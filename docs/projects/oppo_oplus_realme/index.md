---
title: oppo_oplus_realme 拆解
description: 欧加真内核统一构建平台：双 Workflow 解耦 + 任务队列 + 依赖自持
---

# oppo_oplus_realme 拆解

> **欧加真（OPPO / 一加 / 真我）内核统一构建平台**——从"每个平台一套脚本"到"一个表单 + 一条队列 + 三平台流水线"的完整重构记录。

## 这是什么

把欧加系三代旗舰平台的 Android 内核编译，从**手动触发 + 各管各的**变成**统一编排 + 队列化执行**的自动化平台：

| 维度 | 说明 |
| --- | --- |
| 主仓库 | `oppo_oplus_realme`：统一调度（队列 + 双 workflow）+ 26 个编译模板 |
| 执行仓库 | `sm8650`（★6）/ `sm8750`（★2）/ `sm8850`：各平台实际编译流水线 |
| 覆盖平台 | SM8850 / SM8750 / SM8650 + 天玑 9400+/9400e/8350/9500 |
| 内核版本 | 6.12.x / 6.6.x（含风驰 scx 移植）/ 6.1.x |
| 产物 | `Anykernel3-<机型>-<特性标签>-v<日期>.zip`，自动发 Release |

## 为什么做（三个痛点）

**① 手动编译 = 重复劳动**
每次编译要重复填写一堆参数（KSU 分支 / susfs / lz4 / BBR / Droidspaces……），点错一个就要重跑几十分钟。

**② 上游漂移 = 不可控**
原方案基于 cctv18 开源方案，依赖指向第三方仓库——上游一改，编译链路就断。内核源码 ×10、工具链、ccache、susfs、KPM 全部挂在别人名下。

**③ 并发全靠自觉**
多平台同时编译时，runner 并发没人管，高峰期排队、低谷期浪费。

## 架构总览

```
┌─────────────────────────────────────────────────────────┐
│  compile_dispatcher.yml（🎛️ 生成器·参数入队）              │
│  手动表单：选 workflow + 8 个参数 → 写标准任务 JSON 入队      │
└──────────────────────┬──────────────────────────────────┘
                       ▼
┌─────────────────────────────────────────────────────────┐
│  queue/ 状态机（commit 即状态）                            │
│  pending/ → running/ → done/ 或 failed/                  │
└──────────────────────┬──────────────────────────────────┘
                       ▼
┌─────────────────────────────────────────────────────────┐
│  compile_trigger.yml（🔄 触发器·消费入队）                  │
│  每 5 分钟 cron：扫 pending/，消费到期任务，触发编译 workflow │
└──────────────────────┬──────────────────────────────────┘
                       ▼
┌─────────────────────────────────────────────────────────┐
│  平台执行（sm8650 / sm8750 / sm8850）                     │
│  fastbuild_<版本>.yml：补丁链 → ccache → 编译 → Release    │
└─────────────────────────────────────────────────────────┘
```

## 三大设计

### ① 双 Workflow 解耦：生成与执行分离

传统做法是"一个 workflow 干到底"，这里拆成两个各管一段：

| | 生成器（dispatcher） | 触发器（trigger） |
| --- | --- | --- |
| 触发方式 | 手动（workflow_dispatch） | 每 5 分钟 cron |
| 职责 | **入队**：收集参数 → 写任务 JSON | **消费**：读 pending/ → 触发编译 |
| 并发控制 | — | `batch_size` 默认 2，天然限并发 |
| 故障恢复 | — | `running/` 幂等：崩溃后下次 cron 继续 |

参数与执行解耦后，**加参数不用动编译流水线**，改编译流水线不影响入队逻辑——两个文件各 1~8KB，而不是堆在 50KB 的 fastbuild 里。

### ② Queue 状态机：用 git commit 当数据库

任务状态不存数据库，直接是仓库目录：

```
queue/
├── pending/    # 待消费（触发器扫描这里）
├── running/    # 执行中（崩溃后幂等恢复）
├── done/       # 成功（保留任务 JSON 可回溯）
└── failed/     # 失败
```

```json
// queue/done/20260804142827_sm8850_61223.json（任务示例）
{
  "workflow": "sm8850_fastbuild_6.12.23.yml",
  "params": { "ksu_type": "resukisu", "susfs_enable": true, ... }
}
```

消费逻辑（`scripts/dispatcher/consume_tasks.py`）：
- 扫 `pending/` → 按时间排序 → 取 `batch_size` 个 → 移入 `running/` → 调 API 触发编译
- 编译结束由 workflow 自己把任务移到 `done/` 或 `failed/`
- 崩溃中断时 `running/` 残留 → 下次 cron 自动恢复重试

### ③ 档案机制：无档案 = 无链

`sync_profile_options.py` 自动维护 dispatcher 的 workflow 下拉列表：

```yaml
# BEGIN_PROFILE_OPTIONS  ← 自动生成的边界标记，勿手改
- 'sm8650_fastbuild_6.1.115.yml'
- 'sm8650_fastbuild_6.1.141.yml'
# END_PROFILE_OPTIONS
```

**有验证档案的 workflow 才出现在表单里**——没建档的不会显示、不会触发、也不会报错。表单预设值 = 各编译 workflow 的已校准默认值，参数可改但"改后自负验证责任"。

## 脱离上游：依赖自持清单

原方案依赖 cctv18 名下仓库，重构时全部迁移到 SunsetRNE 名下：

| 依赖 | 自持仓库 | 迁移状态 |
| --- | --- | --- |
| 内核源码 ×10 | `android_kernel_*` | ✅ fork（全分支同步） |
| 编译工具链 | `oneplus_sm8650_toolchain` | ✅ 8/8 附件 |
| 公共 ccache | `public_ccache` | ✅ 78/78 附件 |
| susfs 补丁 | `susfs4oki` | ✅ fork（7 分支） |
| KPM 模块 | `KPatch-Next` | ✅ 44/44 附件 |
| 刷机模板 | `AnyKernel3` | ✅ fork |
| 基带保护 | `Baseband-guard` | ✅ fork |
| KSU 管理器 | `ReSukiSU_CI` | ✅ 1848/1848 附件 |

> 目标：**编译链路 100% 自主可控，上游仅作为可选的同步源**。

## 编译参数与补丁链

每个 fastbuild workflow 暴露 8 个可调参数（默认值已按档案校准）：

| 参数 | 默认 | 说明 |
| --- | --- | --- |
| `ksu_type` | resukisu | KSU 分支（原版 ksu 因上游漂移不可用） |
| `susfs_enable` | true | 隐藏环境挂载增强 |
| `kpm_enable` | false | KpatchNext 独立实现 |
| `lz4_enable` | true | lz4 1.10.0 + zstd 1.5.7 补丁 |
| `lz4kd_enable` | false | 与 lz4 互斥，勿同开 |
| `bbr_enable` | false | bbr 算法（true 仅加入 / default 设为默认） |
| `droidspaces_enable` | false | 轻量 Linux 容器支持 |

补丁顺序链（对标上游基线）：

```
dirty清理 → 版本后缀 → KSU注入 → susfs → lz4/zstd → lz4kd
→ defconfig → config隐藏 → Droidspaces → BBG
```

ccache 用**三级缓存**：`actions/cache` → 公共 release → 上传覆盖（`ccache_update` 控制），跨平台共享编译缓存。

## 踩过的坑

- **原版 KSU 上游漂移**：分支不可用 → 表单里直接移除该选项，默认走 ReSukiSU
- **lz4 与 LZ4KD 互斥**：表单注释明示"勿同开"，参数校验在档案层兜底
- **上游仓库一改全链断**：这就是依赖自持的直接动机——fork + 附件全量搬运后，编译不再受第三方仓库状态影响
- **并发不可控**：batch_size 从源头限流，不碰 runner 上限配置

## 现在的样子

`Actions 监控` 页里能看到这套系统每天自己跑：`🔄 统一编译触发器（消费入队）` 每 5 分钟消费，`6.1.141 欧加真OKI内核快速构建` 等流水线按队列执行，产物自动发 Release——**手动操作被压缩成"在表单里选参数、点一下"**。

---

**仓库**：[github.com/SunsetRNE/oppo_oplus_realme](https://github.com/SunsetRNE/oppo_oplus_realme) · **监控**：[Actions 监控](/projects/actions-monitor/)