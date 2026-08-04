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
import sys
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
            return e.code, {}
        except Exception:
            if attempt == 2:
                return 0, {}
            time.sleep(2 * (attempt + 1))
    return 0, {}


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

    upstream = (detail.get("source") or detail.get("parent") or {}).get("full_name")
    if not upstream:
        item["status"] = "orphan"
        item["note"] = "fork 的上游仓库已不存在或无法访问"
        item["duration_s"] = round(time.time() - t0)
        return item

    branch = detail.get("default_branch", "main")
    item["upstream"] = upstream

    # 2. 上游信息（默认分支 + 最后推送时间）
    status, up = api("GET", f"/repos/{upstream}")
    if status == 200:
        item["upstream_pushed_at"] = up.get("pushed_at", "")

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
        item["status"] = "error"
        item["note"] = f"同步被拒绝 (HTTP {status})，可能是 fork 与上游无共同历史"
    else:
        item["status"] = "error"
        item["note"] = f"同步失败 (HTTP {status})"

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