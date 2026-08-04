#!/usr/bin/env python3
"""
Fork 自动同步脚本
- 拉取用户所有 fork 仓库列表
- 对每个 fork：clone → fetch upstream → merge → push
- 生成监控报告 docs/public/fork-status.json（站点上游监控页数据源）

环境变量：
  SYNC_TOKEN : 具有 repo 权限的 PAT（用于跨仓库 clone/push）
  USERNAME   : GitHub 用户名（默认 SunsetRNE）
"""
import json
import os
import subprocess
import sys
import urllib.request
from datetime import datetime, timezone

USERNAME = os.environ.get("USERNAME", "SunsetRNE")
TOKEN = os.environ.get("SYNC_TOKEN", "")
API = "https://api.github.com"
WORKSPACE = os.getcwd()

if not TOKEN:
    print("❌ 缺少 SYNC_TOKEN 环境变量，无法跨仓库同步")
    sys.exit(1)


def api(path):
    """调用 GitHub API"""
    req = urllib.request.Request(
        f"{API}{path}",
        headers={
            "Authorization": f"Bearer {TOKEN}",
            "Accept": "application/vnd.github+json",
            "User-Agent": "fork-sync-bot",
        },
    )
    with urllib.request.urlopen(req, timeout=30) as r:
        return json.load(r)


def run(cmd, cwd=None, check=False):
    """执行命令，返回 (returncode, stdout)"""
    p = subprocess.run(
        cmd, cwd=cwd, capture_output=True, text=True, timeout=600
    )
    if check and p.returncode != 0:
        raise RuntimeError(p.stderr.strip()[:300])
    return p.returncode, (p.stdout + p.stderr).strip()


def main():
    print(f"🔍 开始同步 {USERNAME} 的 fork 仓库...")
    forks = api(f"/users/{USERNAME}/repos?type=fork&per_page=100")
    print(f"   共发现 {len(forks)} 个 fork")

    results = []

    for idx, fork in enumerate(forks, 1):
        name = fork["name"]
        # 列表接口不返回 source/parent，需单独查询仓库详情
        try:
            detail = api(f"/repos/{USERNAME}/{name}")
            upstream = (detail.get("source") or {}).get("full_name") or (
                detail.get("parent") or {}
            ).get("full_name")
        except Exception:
            upstream = None
        item = {
            "name": name,
            "upstream": upstream,
            "status": "pending",
            "note": "",
            "fork_pushed_at": fork.get("pushed_at", ""),
            "upstream_pushed_at": "",
        }

        if not upstream:
            item["status"] = "error"
            item["note"] = "无法确定上游仓库"
            results.append(item)
            print(f"   [{idx}/{len(forks)}] {name}: 无上游信息，跳过")
            continue

        # 获取上游默认分支
        try:
            up = api(f"/repos/{upstream}")
            default_branch = up.get("default_branch", "main")
            item["upstream_pushed_at"] = up.get("pushed_at", "")
        except Exception as e:
            default_branch = "main"
            item["upstream_pushed_at"] = ""

        repo_dir = os.path.join(WORKSPACE, "_fork_tmp", name)
        try:
            # 1. clone fork
            clone_url = f"https://x-access-token:{TOKEN}@github.com/{USERNAME}/{name}.git"
            rc, out = run(["git", "clone", "--depth", "1", clone_url, repo_dir])
            if rc != 0:
                item["status"] = "error"
                item["note"] = f"clone 失败: {out[:150]}"
                results.append(item)
                print(f"   [{idx}/{len(forks)}] {name}: ❌ clone 失败")
                continue

            # 2. 添加 upstream 并 fetch
            run(["git", "remote", "add", "upstream", f"https://github.com/{upstream}.git"], cwd=repo_dir)
            rc, out = run(["git", "fetch", "upstream", default_branch], cwd=repo_dir)
            if rc != 0:
                item["status"] = "error"
                item["note"] = f"fetch 上游失败: {out[:150]}"
                run(["rm", "-rf", repo_dir])
                results.append(item)
                print(f"   [{idx}/{len(forks)}] {name}: ❌ fetch 失败")
                continue

            # 3. 检查是否落后
            rc, out = run(
                ["git", "rev-list", "--count", f"HEAD..upstream/{default_branch}"],
                cwd=repo_dir,
            )
            behind = int(out.strip() or "0") if rc == 0 else 0

            if behind == 0:
                item["status"] = "synced"
                item["note"] = "已是最新"
            else:
                # 4. merge 上游
                rc, out = run(
                    ["git", "merge", f"upstream/{default_branch}", "--no-edit"],
                    cwd=repo_dir,
                )
                if rc == 0:
                    # 5. push 回 fork
                    rc2, out2 = run(["git", "push"], cwd=repo_dir)
                    if rc2 == 0:
                        item["status"] = "synced"
                        item["note"] = f"已同步上游 {behind} 个提交"
                    else:
                        item["status"] = "error"
                        item["note"] = f"push 失败: {out2[:150]}"
                else:
                    run(["git", "merge", "--abort"], cwd=repo_dir)
                    item["status"] = "conflict"
                    item["note"] = f"合并冲突（落后 {behind} 个提交），已跳过"

            run(["rm", "-rf", repo_dir])

        except Exception as e:
            item["status"] = "error"
            item["note"] = str(e)[:200]
            run(["rm", "-rf", repo_dir])

        results.append(item)
        icon = {"synced": "✅", "conflict": "⚠️", "error": "❌", "pending": "⏳"}.get(
            item["status"], "❓"
        )
        print(f"   [{idx}/{len(forks)}] {name}: {icon} {item['note']}")

    # 写报告
    report = {
        "updated_at": datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ"),
        "total": len(results),
        "synced": sum(1 for r in results if r["status"] == "synced"),
        "conflict": sum(1 for r in results if r["status"] == "conflict"),
        "error": sum(1 for r in results if r["status"] == "error"),
        "forks": results,
    }
    report_dir = os.path.join(WORKSPACE, "docs", "public")
    os.makedirs(report_dir, exist_ok=True)
    with open(os.path.join(report_dir, "fork-status.json"), "w", encoding="utf-8") as f:
        json.dump(report, f, ensure_ascii=False, indent=2)

    print(f"\n📊 报告: 共 {report['total']} | ✅ 同步 {report['synced']} | "
          f"⚠️ 冲突 {report['conflict']} | ❌ 失败 {report['error']}")
    print("📄 已写入 docs/public/fork-status.json")


if __name__ == "__main__":
    main()