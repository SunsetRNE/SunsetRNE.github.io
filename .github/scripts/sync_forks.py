#!/usr/bin/env python3
"""
Fork 自动同步脚本（纯 API 版 · 结构优化）
==========================================
不再 clone 任何仓库！使用 GitHub 官方 merge-upstream API
（等同于网页上 "Sync fork" 按钮的底层接口），服务端直接合并：

  对每个 fork → POST /repos/{owner}/{repo}/merge-upstream → 完成

全流程 1~3 分钟（48 个仓库 API 并行请求），相比旧方案提速 10 倍以上。

环境变量：
  SYNC_TOKEN : 具有 repo 权限的 PAT（用于跨仓库操作）
  USERNAME   : GitHub 用户名（默认 SunsetRNE）
  REPOS      : 可选，仅同步指定仓库名（逗号分隔，留空 = 全部）
  SKIP_REPOS : 可选，跳过的仓库名（逗号分隔）
  PARALLEL   : 可选，并行数（默认 8）
"""
import concurrent.futures as cf
import json
import os
import shutil
import subprocess
import sys
import threading
import time
import urllib.error
import urllib.request
from datetime import datetime, timezone

USERNAME = os.environ.get("USERNAME", "SunsetRNE")
TOKEN = os.environ.get("SYNC_TOKEN", "")
REPOS_FILTER = [x.strip() for x in os.environ.get("REPOS", "").split(",") if x.strip()]
SKIP_REPOS = [x.strip() for x in os.environ.get("SKIP_REPOS", "").split(",") if x.strip()]
PARALLEL = int(os.environ.get("PARALLEL", "8"))
API = "https://api.github.com"
WORKSPACE = os.getcwd()
TMP_DIR = os.path.join(WORKSPACE, "_fork_tmp")
MIN_DISK_MB = 1024
CLONE_SEM = threading.Semaphore(2)  # fallback clone 最多 2 路并行，防磁盘爆

if not TOKEN:
    print("❌ 缺少 SYNC_TOKEN 环境变量，无法跨仓库同步")
    sys.exit(1)


def api(method, path, body=None, timeout=30):
    """调用 GitHub API（带重试），返回 (status, json)"""
    data = json.dumps(body).encode() if body is not None else None
    for attempt in range(3):
        try:
            req = urllib.request.Request(
                f"{API}{path}",
                data=data,
                method=method,
                headers={
                    "Authorization": f"Bearer {TOKEN}",
                    "Accept": "application/vnd.github+json",
                    "User-Agent": "fork-sync-bot",
                    "Content-Type": "application/json",
                },
            )
            with urllib.request.urlopen(req, timeout=timeout) as r:
                raw = r.read()
                return r.status, (json.loads(raw) if raw else {})
        except urllib.error.HTTPError as e:
            if e.code in (403, 429):  # 限流，重试
                if attempt == 2:
                    return e.code, {}
                time.sleep(5 * (attempt + 1))
                continue
            # 读取错误详情用于诊断
            try:
                err = json.loads(e.read().decode() or "{}")
                return e.code, {"_error": err.get("message", "")}
            except Exception:
                return e.code, {"_error": ""}
        except Exception:
            if attempt == 2:
                return 0, {}
            time.sleep(2 * (attempt + 1))
    return 0, {}


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


def fallback_sync(name, upstream, branch):
    """API 同步失败时的 git clone 兜底方案（2 路并行 + 磁盘保护）

    流程：完整单分支 clone（⚠️ 不用 shallow/filter——git 2.x 的 shallow push
          有 thin-pack 缺对象 bug，完整 clone 保证对象完整、push 可靠）
          → fetch 上游默认分支 → 计算落后提交数
          → merge；真无共同祖先（上游重写历史）才 --allow-unrelated-histories
          → push。真正冲突才标 conflict。
    """
    repo_dir = os.path.join(TMP_DIR, name)
    with CLONE_SEM:
        try:
            check_disk()
            clone_url = f"https://x-access-token:{TOKEN}@github.com/{USERNAME}/{name}.git"
            rc, out = run(
                ["git", "clone", "--single-branch", clone_url, repo_dir],
                timeout=1800,
            )
            if rc != 0:
                return "error", f"fallback clone 失败: {out[:100]}"

            # merge 提交需要身份配置（新 clone 的仓库没有）
            run(["git", "config", "user.name", USERNAME], cwd=repo_dir)
            run(["git", "config", "user.email",
                 f"{USERNAME}@users.noreply.github.com"], cwd=repo_dir)

            run(["git", "remote", "add", "upstream",
                 f"https://github.com/{upstream}.git"], cwd=repo_dir)
            rc, out = run(
                ["git", "fetch", "upstream", branch],
                cwd=repo_dir, timeout=1800,
            )
            if rc != 0:
                return "error", f"fallback fetch 失败: {out[:100]}"

            rc, out = run(
                ["git", "rev-list", "--count", f"HEAD..upstream/{branch}"],
                cwd=repo_dir,
            )
            behind = int(out.strip() or "0") if rc == 0 else 0
            if behind == 0:
                return "synced", "已是最新（无需同步）"

            rc, out = run(
                ["git", "merge", f"upstream/{branch}", "--no-edit"],
                cwd=repo_dir, timeout=1800,
            )
            if rc != 0:
                run(["git", "merge", "--abort"], cwd=repo_dir)
                if "unrelated" in out.lower():
                    # 上游 force-push/重写历史导致真无共同祖先
                    # → 这正是 API 422 的成因，允许无关联历史合并
                    rc, out = run(
                        ["git", "merge", f"upstream/{branch}", "--no-edit",
                         "--allow-unrelated-histories"],
                        cwd=repo_dir, timeout=1800,
                    )
                    if rc != 0:
                        run(["git", "merge", "--abort"], cwd=repo_dir)
                        return "conflict", f"无共同历史且合并冲突（落后 {behind} 个提交），需手动处理"
                else:
                    return "conflict", f"合并冲突（落后 {behind} 个提交），需手动 Sync fork"

            # push（网络抖动时重试 1 次）
            rc2, out2 = run(["git", "push"], cwd=repo_dir, timeout=1800)
            if rc2 != 0:
                time.sleep(5)
                rc2, out2 = run(["git", "push"], cwd=repo_dir, timeout=1800)
            if rc2 != 0:
                return "error", f"push 失败: {out2[:400]}"
            return "synced", f"clone 兜底成功，已同步上游 {behind} 个提交"
        except Exception as e:
            return "error", f"fallback {type(e).__name__}: {str(e)[:100]}"
        finally:
            shutil.rmtree(repo_dir, ignore_errors=True)


def process_fork(fork):
    """处理单个 fork：纯 API 同步，不 clone"""
    name = fork["name"]
    item = {
        "name": name,
        "upstream": None,
        "status": "pending",
        "note": "",
        "fork_pushed_at": fork.get("pushed_at", ""),
        "upstream_pushed_at": "",
    }
    t0 = time.time()

    # 1. 仓库详情：拿默认分支 + 上游
    status, detail = api("GET", f"/repos/{USERNAME}/{name}")
    if status != 200:
        item["status"] = "error"
        item["note"] = f"查询仓库详情失败 (HTTP {status})"
        item["duration_s"] = round(time.time() - t0)
        return item

    if not detail.get("fork"):
        item["status"] = "not_fork"
        item["note"] = "自建仓库，无需同步"
        item["duration_s"] = round(time.time() - t0)
        return item

    # 上游：优先 parent（实际同步对象），其次 source（原始源头）
    upstream = (detail.get("parent") or detail.get("source") or {}).get("full_name")
    if not upstream:
        item["status"] = "orphan"
        item["note"] = "fork 的上游仓库已不存在或无法访问"
        item["duration_s"] = round(time.time() - t0)
        return item

    branch = detail.get("default_branch", "main")
    item["upstream"] = upstream

    # 2. 上游信息（默认分支 + 最后推送时间）
    up_branch = branch
    status, up = api("GET", f"/repos/{upstream}")
    if status == 200:
        item["upstream_pushed_at"] = up.get("pushed_at", "")
        up_branch = up.get("default_branch") or branch

    # 3. ⭐ 核心：merge-upstream API（服务端同步，等同网页 Sync fork）
    status, body = api("POST", f"/repos/{USERNAME}/{name}/merge-upstream",
                       {"branch": branch})

    if status == 200:
        msg = (body.get("message") or "").lower()
        if "up-to-date" in msg:
            item["status"] = "synced"
            item["note"] = "已是最新"
        elif "merged" in msg:
            item["status"] = "synced"
            item["note"] = f"已同步上游（{body.get('merge_type', 'merge')}）"
        else:
            item["status"] = "synced"
            item["note"] = msg[:120]
    elif status == 409:
        item["status"] = "conflict"
        item["note"] = "与上游存在冲突，需在 GitHub 网页手动 Sync fork"
    elif status in (403, 422):
        err_msg = body.get("_error", "") if isinstance(body, dict) else ""
        # ⭐ 兜底：API 被拒（422 常见于无共同历史，403 常见于临时限制）→
        # 降级为 git clone 方式重试，网页能同步的这里也能同步
        print(f"   ⚠️ {name}: API 同步被拒 (HTTP {status})，降级 git clone 兜底...")
        f_status, f_note = fallback_sync(name, upstream, up_branch)
        item["status"] = f_status
        item["note"] = f"API {status} → clone 兜底: {f_note}"
    else:
        item["status"] = "error"
        err_msg = body.get("_error", "") if isinstance(body, dict) else ""
        item["note"] = f"同步失败 (HTTP {status}){('：' + err_msg[:100]) if err_msg else ''}"

    item["duration_s"] = round(time.time() - t0)
    return item


def main():
    print(f"🔍 开始同步 {USERNAME} 的 fork（纯 API，并行 {PARALLEL} 路）...")
    status, repos = api("GET", f"/users/{USERNAME}/repos?per_page=100")
    if status != 200:
        print(f"❌ 获取仓库列表失败 (HTTP {status})，请检查 SYNC_TOKEN")
        sys.exit(1)

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
            print(f"   [{done}/{len(forks)}] {icon} {item['name']} "
                  f"({item.get('duration_s', 0)}s) {item['note']}")

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
    if report["conflict"]:
        print("⚠️ 冲突仓库（需手动处理）:")
        for r in results:
            if r["status"] == "conflict":
                print(f"   - {r['name']} → https://github.com/{USERNAME}/{r['name']}/compare")
    print("📄 已写入 docs/public/fork-status.json")


if __name__ == "__main__":
    main()