#!/usr/bin/env python3
"""
Actions 监控快照生成脚本（纯 API 版）
=====================================
扫描账号下所有**公开**仓库的最近 Actions runs，生成快照 JSON：
  docs/public/actions-runs.json

设计要点：
- 每仓库只取最近 2 条 runs（per_page=2），55 仓库 ≈ 110 条 ≈ 22KB
- API 用量：1 次列表 + N 次 runs ≈ 56 次/轮；每 30 分钟一轮 ≈ 112 次/小时
  （SYNC_TOKEN 限额 5000/小时无压力；匿名 60/小时只够单次手动跑）
- 只保留稳定字段（不含 run 的 updated_at），状态无变化时旧快照与新数据
  完全一致 → 不写文件，由 workflow 的 git diff 判断跳过 commit
- 每仓库带 category 分类（规则与 sync_forks.py 一致），前端按分类分组
- 时间流记忆：对比新旧快照的仓库状态，变化追加到 actions-history.json
  （最近 300 条），供监控页时间线展示；状态无变化时历史文件也不动

环境变量：
  SYNC_TOKEN : GitHub token（可选，匿名也能跑但限额低）
  USERNAME   : GitHub 用户名（默认 SunsetRNE）
  PARALLEL   : 并行数（默认 8）
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
PARALLEL = int(os.environ.get("PARALLEL", "8"))
API = "https://api.github.com"
SNAPSHOT = os.path.join("docs", "public", "actions-runs.json")
HISTORY = os.path.join("docs", "public", "actions-history.json")
HISTORY_MAX = 300  # 时间流最多保留 300 条事件

# run 状态 → 前端语义（页面只用最近一条定卡片色）
OK_CONCLUSIONS = {"success", "skipped", "neutral"}


def st_of(item):
    """仓库状态语义（与前端 ActionsMonitor.vue 的 stOf 一致）"""
    runs = item.get("runs") or []
    if not runs:
        return "no_runs"
    r0 = runs[0]
    if r0.get("status") != "completed":
        return "running"
    return "ok" if r0.get("conclusion") in OK_CONCLUSIONS else "failed"


def update_history(new_repos, old_repos, t):
    """对比新旧状态，把变化追加进时间流历史；有事件才写文件。

    只记录状态实质变化（no_runs/running/ok/failed 之间切换），
    首次运行（无旧快照）不产生事件。返回是否有事件写入。
    """
    old_st = {r["name"]: st_of(r) for r in old_repos} if old_repos else {}
    events = []
    for item in new_repos:
        name = item["name"]
        to = st_of(item)
        frm = old_st.get(name)
        if not frm or frm == to:
            continue
        r0 = (item.get("runs") or [{}])[0]
        events.append({
            "t": t,
            "repo": name,
            "from": frm,
            "to": to,
            "run": r0.get("name", ""),
            "run_number": r0.get("run_number"),
            "conclusion": r0.get("conclusion", ""),
        })
    if not events:
        return False

    history = []
    if os.path.exists(HISTORY):
        try:
            with open(HISTORY, encoding="utf-8") as f:
                history = json.load(f)
            if not isinstance(history, list):
                history = []
        except Exception:
            history = []
    history.extend(events)
    history = history[-HISTORY_MAX:]
    os.makedirs(os.path.dirname(HISTORY), exist_ok=True)
    with open(HISTORY, "w", encoding="utf-8") as f:
        json.dump(history, f, ensure_ascii=False, indent=1)
    print(f"📜 时间流 +{len(events)} 条事件（共 {len(history)} 条）")
    for e in events:
        print(f"   {e['t']} {e['repo']}: {e['from']} → {e['to']}")
    return True


def api(method, path, timeout=30):
    """调用 GitHub API（带重试），返回 (status, json)"""
    for attempt in range(3):
        try:
            headers = {
                "Accept": "application/vnd.github+json",
                "User-Agent": "actions-monitor-bot",
            }
            if TOKEN:
                headers["Authorization"] = f"Bearer {TOKEN}"
            req = urllib.request.Request(f"{API}{path}", method=method, headers=headers)
            with urllib.request.urlopen(req, timeout=timeout) as r:
                raw = r.read()
                return r.status, (json.loads(raw) if raw else {})
        except urllib.error.HTTPError as e:
            if e.code in (403, 429):  # 限流，重试
                if attempt == 2:
                    return e.code, {}
                time.sleep(5 * (attempt + 1))
                continue
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


def classify(name):
    """按仓库名推断"存在的意义"分类（与 sync_forks.py / GitHubForks.vue 一致）"""
    n = name.lower()
    if any(k in n for k in ("toolchain", "ccache", "manifest", "anykernel")):
        return "编译依赖"
    if any(k in n for k in ("clash", "mihomo")) or n == "box":
        return "代理网络"
    if any(k in n for k in ("gpt", "codex", "llm", "mcp", "operit", "open-", "headroom", "agent")):
        return "AI工具"
    if any(k in n for k in ("installer", "zygisk", "webui", "tricky", "integrity", "hma", "lyric", "faker", "telegram")):
        return "模块/框架"
    if any(k in n for k in ("ci", "action")):
        return "CI/产物"
    if any(k in n for k in ("kernelsu", "ksu", "susfs", "magisk", "patch", "kpm", "sukisu")):
        return "Root方案"
    if "kernel" in n:
        return "内核源码"
    return "工具/脚本"


def pick_run(r):
    """只保留前端需要的稳定字段（故意丢掉 updated_at，避免运行中噪声触发 commit）"""
    return {
        "id": r.get("id"),
        "run_number": r.get("run_number"),
        "name": r.get("name") or r.get("path") or "?",
        "display_title": r.get("display_title") or "",
        "event": r.get("event", ""),
        "status": r.get("status", ""),
        "conclusion": r.get("conclusion") or "",
        "created_at": r.get("created_at", ""),
        "html_url": r.get("html_url", ""),
        "path": r.get("path", ""),
    }


def scan_repo(name):
    """扫单个仓库的最近 2 条 runs"""
    status, body = api("GET", f"/repos/{USERNAME}/{name}/actions/runs?per_page=2")
    if status != 200:
        return {"name": name, "category": classify(name),
                "html_url": f"https://github.com/{USERNAME}/{name}",
                "runs": [], "note": f"API {status}"}
    return {"name": name, "category": classify(name),
            "html_url": f"https://github.com/{USERNAME}/{name}",
            "runs": [pick_run(r) for r in body.get("workflow_runs", [])],
            "note": ""}


def main():
    if not TOKEN:
        print("⚠️ 未设置 SYNC_TOKEN（匿名模式，限 60 次/小时，只够单次手动跑）")
    print(f"🔍 扫描 {USERNAME} 的公开仓库 Actions 状态（并行 {PARALLEL}）...")

    # 1. 仓库列表（type=owner 拿全部 own 仓库；过滤私有，监控页是公开页面）
    status, repos = api("GET", f"/users/{USERNAME}/repos?per_page=100&type=owner")
    if status != 200:
        print(f"❌ 获取仓库列表失败 (HTTP {status})")
        sys.exit(1)
    public = [r for r in repos if not r.get("private")]
    print(f"   公开仓库 {len(public)} 个（私有 {len(repos) - len(public)} 个已跳过）")

    # 2. 并行扫描 runs
    results = []
    with cf.ThreadPoolExecutor(max_workers=PARALLEL) as pool:
        futures = {pool.submit(scan_repo, r["name"]): r["name"] for r in public}
        done = 0
        for fut in cf.as_completed(futures):
            item = fut.result()
            results.append(item)
            done += 1
            n = len(item["runs"])
            print(f"   [{done}/{len(public)}] {item['name']} ({item['category']}) "
                  f"{n} 条 runs{item['note']}")

    # 3. 摘要：以每仓库最近一条 run 的状态为准
    running = failed = ok = no_runs = 0
    for item in results:
        runs = item["runs"]
        if not runs:
            no_runs += 1
            continue
        r0 = runs[0]
        if r0["status"] != "completed":
            running += 1
        elif r0["conclusion"] in OK_CONCLUSIONS:
            ok += 1
        else:
            failed += 1
    summary = {
        "total": len(results),
        "running": running,
        "failed": failed,
        "ok": ok,
        "no_runs": no_runs,
    }

    # 4. 与旧快照比较（排除扫描时间，只看真实状态），无变化则不写文件
    results.sort(key=lambda x: x["name"])
    new_data = {
        "updated_at": datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ"),
        "generated_by": "actions_monitor.py",
        "summary": summary,
        "repos": results,
    }
    changed = True
    old_repos = []
    if os.path.exists(SNAPSHOT):
        try:
            with open(SNAPSHOT, encoding="utf-8") as f:
                old = json.load(f)
            old_repos = old.get("repos", [])
            changed = old.get("repos") != new_data["repos"]
        except Exception:
            pass

    if not changed:
        print("📭 runs 状态无变化，跳过写入")
        return

    os.makedirs(os.path.dirname(SNAPSHOT), exist_ok=True)
    with open(SNAPSHOT, "w", encoding="utf-8") as f:
        json.dump(new_data, f, ensure_ascii=False, indent=1)
    print(f"✅ 快照已更新：{SNAPSHOT}（{os.path.getsize(SNAPSHOT)} 字节）")

    # 时间流记忆：状态变化追加进历史（有事件才写，与快照同 commit）
    update_history(new_data["repos"], old_repos, new_data["updated_at"])
    print(f"📊 汇总: 共 {summary['total']} | ▶️ 运行中 {summary['running']} | "
          f"✅ 正常 {summary['ok']} | ❌ 失败 {summary['failed']} | "
          f"⛔ 无 runs {summary['no_runs']}")
    if failed:
        print("❌ 失败仓库:")
        for item in results:
            r0 = item["runs"][0] if item["runs"] else None
            if r0 and r0["status"] == "completed" and r0["conclusion"] not in OK_CONCLUSIONS:
                print(f"   - {item['name']}: #{r0['run_number']} {r0['name']} "
                      f"→ {r0['conclusion']} {r0['html_url']}")


if __name__ == "__main__":
    main()
