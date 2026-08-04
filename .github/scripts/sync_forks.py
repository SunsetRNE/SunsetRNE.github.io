#!/usr/bin/env python3
"""
Fork 自动同步脚本（并行优化版）
- 拉取用户所有 fork 仓库列表（按 fork 标志精确过滤）
- 4 路并行处理：clone（partial clone 省磁盘）→ fetch upstream → merge → push
- 磁盘空间监控，防止 runner 磁盘写满
- 生成监控报告 docs/public/fork-status.json

环境变量：
  SYNC_TOKEN : 具有 repo 权限的 PAT（用于跨仓库 clone/push）
  USERNAME   : GitHub 用户名（默认 SunsetRNE）
  REPOS      : 可选，仅同步指定仓库名（逗号分隔，留空 = 全部）
  SKIP_REPOS : 可选，跳过的仓库名（逗号分隔）
  PARALLEL   : 可选，并行数（默认 4）
"""
import concurrent.futures as cf
import json
import os
import shutil
import subprocess
import sys
import time
import urllib.request
from datetime import datetime, timezone

USERNAME = os.environ.get("USERNAME", "SunsetRNE")
TOKEN = os.environ.get("SYNC_TOKEN", "")
REPOS_FILTER = [x.strip() for x in os.environ.get("REPOS", "").split(",") if x.strip()]
SKIP_REPOS = [x.strip() for x in os.environ.get("SKIP_REPOS", "").split(",") if x.strip()]
PARALLEL = int(os.environ.get("PARALLEL", "4"))
API = "https://api.github.com"
WORKSPACE = os.getcwd()
TMP_DIR = os.path.join(WORKSPACE, "_fork_tmp")
MIN_DISK_MB = 1024  # 剩余磁盘低于 1GB 时暂停

if not TOKEN:
    print("❌ 缺少 SYNC_TOKEN 环境变量，无法跨仓库同步")
    sys.exit(1)


def api(path):
    """调用 GitHub API（带重试）"""
    for attempt in range(3):
        try:
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
        except Exception as e:
            if attempt == 2:
                raise
            time.sleep(2 * (attempt + 1))


def check_disk():
    """磁盘空间不足时等待"""
    while True:
        free_mb = shutil.disk_usage(WORKSPACE).free // (1024 * 1024)
        if free_mb > MIN_DISK_MB:
            return
        print(f"   ⚠️ 磁盘剩余 {free_mb}MB，等待释放...")
        time.sleep(20)


def run(cmd, cwd=None, timeout=600):
    """执行命令，返回 (returncode, stdout)"""
    p = subprocess.run(cmd, cwd=cwd, capture_output=True, text=True, timeout=timeout)
    return p.returncode, (p.stdout + p.stderr).strip()


def process_fork(fork):
    """处理单个 fork 仓库（在工作线程中执行）"""
    name = fork["name"]
    item = {
        "name": name,
        "upstream": None,
        "status": "pending",
        "note": "",
        "fork_pushed_at": fork.get("pushed_at", ""),
        "upstream_pushed_at": "",
    }

    # 查询仓库详情获取 source/parent
    try:
        detail = api(f"/repos/{USERNAME}/{name}")
    except Exception as e:
        item["status"] = "error"
        item["note"] = f"API 查询失败: {str(e)[:120]}"
        return item

    if not detail.get("fork"):
        item["status"] = "not_fork"
        item["note"] = "自建仓库，无需同步"
        return item

    upstream = (detail.get("source") or detail.get("parent") or {}).get("full_name")
    if not upstream:
        item["status"] = "orphan"
        item["note"] = "fork 的上游仓库已不存在或无法访问"
        return item

    # 获取上游默认分支
    try:
        up = api(f"/repos/{upstream}")
        default_branch = up.get("default_branch", "main")
        item["upstream_pushed_at"] = up.get("pushed_at", "")
    except Exception:
        default_branch = "main"

    repo_dir = os.path.join(TMP_DIR, name)
    t0 = time.time()
    try:
        # 1. partial clone（省磁盘、省时间）
        check_disk()
        clone_url = f"https://x-access-token:{TOKEN}@github.com/{USERNAME}/{name}.git"
        rc, out = run(
            ["git", "clone", "--depth", "1", "--single-branch",
             "--filter=blob:none", clone_url, repo_dir],
            timeout=900,
        )
        if rc != 0:
            item["status"] = "error"
            item["note"] = f"clone 失败: {out[:150]}"
            shutil.rmtree(repo_dir, ignore_errors=True)
            return item

        # 2. fetch upstream（浅获取默认分支）
        run(["git", "remote", "add", "upstream", f"https://github.com/{upstream}.git"], cwd=repo_dir)
        rc, out = run(
            ["git", "fetch", "--depth", "1", "upstream", default_branch],
            cwd=repo_dir, timeout=900,
        )
        if rc != 0:
            item["status"] = "error"
            item["note"] = f"fetch 上游失败: {out[:150]}"
            shutil.rmtree(repo_dir, ignore_errors=True)
            return item

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
            # 4. merge 上游（partial clone 下 git 会自动按需拉取缺失数据）
            rc, out = run(
                ["git", "merge", f"upstream/{default_branch}", "--no-edit"],
                cwd=repo_dir, timeout=900,
            )
            if rc == 0:
                # 5. push 回 fork
                rc2, out2 = run(["git", "push"], cwd=repo_dir, timeout=900)
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

    except Exception as e:
        item["status"] = "error"
        item["note"] = f"{type(e).__name__}: {str(e)[:150]}"

    shutil.rmtree(repo_dir, ignore_errors=True)
    item["duration_s"] = round(time.time() - t0)
    return item


def main():
    print(f"🔍 开始同步 {USERNAME} 的 fork（并行 {PARALLEL} 路）...")
    repos = api(f"/users/{USERNAME}/repos?per_page=100")
    forks = [r for r in repos if r.get("fork")]

    if REPOS_FILTER:
        forks = [r for r in forks if r["name"] in REPOS_FILTER]
        print(f"   🔎 手动指定 {len(forks)} 个仓库")
    if SKIP_REPOS:
        skipped = [r["name"] for r in forks if r["name"] in SKIP_REPOS]
        forks = [r for r in forks if r["name"] not in SKIP_REPOS]
        if skipped:
            print(f"   ⏭️ 跳过 {len(skipped)} 个仓库: {', '.join(skipped)}")
    print(f"   待处理 {len(forks)} 个 fork（总仓库 {len(repos)}）")

    os.makedirs(TMP_DIR, exist_ok=True)
    results = []
    with cf.ThreadPoolExecutor(max_workers=PARALLEL) as pool:
        futures = {pool.submit(process_fork, f): f for f in forks}
        done = 0
        for fut in cf.as_completed(futures):
            item = fut.result()
            results.append(item)
            done += 1
            icon = {"synced": "✅", "conflict": "⚠️", "error": "❌", "orphan": "🕳️",
                    "not_fork": "🏠", "pending": "⏳"}.get(item["status"], "❓")
            dur = item.get("duration_s", 0)
            print(f"   [{done}/{len(forks)}] {icon} {item['name']} "
                  f"({dur}s) {item['note']}")
    shutil.rmtree(TMP_DIR, ignore_errors=True)

    # 写报告
    report = {
        "updated_at": datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ"),
        "total": len(results),
        "synced": sum(1 for r in results if r["status"] == "synced"),
        "conflict": sum(1 for r in results if r["status"] == "conflict"),
        "error": sum(1 for r in results if r["status"] == "error"),
        "orphan": sum(1 for r in results if r["status"] == "orphan"),
        "not_fork": sum(1 for r in results if r["status"] == "not_fork"),
        "forks": results,
    }
    report_dir = os.path.join(WORKSPACE, "docs", "public")
    os.makedirs(report_dir, exist_ok=True)
    with open(os.path.join(report_dir, "fork-status.json"), "w", encoding="utf-8") as f:
        json.dump(report, f, ensure_ascii=False, indent=2)

    print(f"\n📊 报告: 共 {report['total']} | ✅ 同步 {report['synced']} | "
          f"⚠️ 冲突 {report['conflict']} | ❌ 失败 {report['error']} | "
          f"🏠 自建 {report['not_fork']} | 🕳️ 上游缺失 {report['orphan']}")
    if report["error"]:
        print("❌ 失败明细:")
        for r in results:
            if r["status"] == "error":
                print(f"   - {r['name']}: {r['note']}")
    print("📄 已写入 docs/public/fork-status.json")


if __name__ == "__main__":
    main()