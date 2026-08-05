---
title: Android 内核编译完整流程（含 KernelSU 集成）
date: 2026-08-05
description: 从同步源码到刷机上机的完整流程：build.sh 与 Kleaf 两代构建系统、GKI 内核编译、KernelSU 三种集成方式（镜像/LKM/非GKI），以及 Pixel 刷写与常见坑。
tags: [Android, 内核, KernelSU, GKI, Kleaf]
---

# Android 内核编译完整流程（含 KernelSU 集成）

> 资料整理自 [AOSP 构建内核](https://source.android.com/docs/setup/building-kernels)、[构建 Pixel 内核](https://source.android.com/docs/setup/building-pixel-kernels)、[内核分支与构建系统](https://source.android.com/reference/bazel-support) 与 [KernelSU 文档](https://kernelsu.org/zh_CN/guide/how-to-build.html)。

## 1. 总览：两代构建系统

Android 内核构建正从 `build/build.sh`（Make 封装）迁移到 **Kleaf（Bazel）**：

| 内核分支 | build.sh | Kleaf |
| --- | --- | --- |
| ≤ android12-5.10 | ✅ 唯一方式 | ❌ |
| android13-5.10 / 5.15 | ✅ 可用 | ✅ 官方推荐 |
| android14-5.15 / 6.1、android15-6.6、mainline | ❌ 已移除 | ✅ 唯一方式 |

> Android 14+ 不支持 build.sh；`LTO=thin` 在 Kleaf 下改用 `--lto=thin` 命令行参数。

## 2. 前置准备

- **内存 ≥ 24GB**（Kleaf 无此硬性限制，但 LTO 建议 thin）
- 磁盘 ≥ 100GB（内核源码 + 构建产物；`repo sync -c --no-tags` 可减小体积）
- 工具：`repo`、`git`、`python3`、Clang（Kleaf 自动下载工具链）
- 网络能访问 `android.googlesource.com`（国内可配镜像）

## 3. 同步源码

```sh
mkdir android-kernel && cd android-kernel
repo init -u https://android.googlesource.com/kernel/manifest -b BRANCH
repo sync
```

- `BRANCH` 选择：通用内核用 `common-android15-6.6` 等；特定发布构建可从 [GKI 发布构建](https://source.android.com/docs/core/architecture/kernel/gki-release-builds) 下载 manifest.xml 精确锁定
- 可选 `-c --no-tags` 浅同步（Pixel 文档推荐）

## 4. 编译内核

### 4.1 Kleaf（Android 13+，推荐）

```sh
tools/bazel run //common:kernel_aarch64_dist [-- --destdir=$DIST_DIR]
```

- 产物在 `$DIST_DIR`（未指定时见命令输出）
- LTO 控制：`--lto=thin` / `--lto=none` / `--lto=full`
- 虚拟设备模块：`tools/bazel run //common-modules/virtual-device:virtual_device_x86_64_dist`
- Kleaf 为 hermetic 构建，不受环境变量干扰，适合 CI

### 4.2 build.sh（≤ android13-5.15）

```sh
LTO=thin BUILD_CONFIG=common/build.config.gki.aarch64 build/build.sh
```

- 产物：`out/BRANCH/dist/`
- 常用环境变量：

| 变量 | 说明 | 示例 |
| --- | --- | --- |
| `BUILD_CONFIG` | build 配置（GKI 必须指定） | `common/build.config.gki.aarch64` |
| `CC` | 编译器 | `CC=clang` |
| `DIST_DIR` / `OUT_DIR` | 产物/中间目录 | `/path/to/dist` |
| `SKIP_DEFCONFIG` | 跳过 defconfig | `SKIP_DEFCONFIG=1` |
| `POST_DEFCONFIG_CMDS` | defconfig 后钩子（可关 LTO） | 见官方文档 |

## 5. 集成 KernelSU（三种方式）

### 5.1 GKI 镜像模式（KernelSU ≤ v2.x，已存档）

```sh
curl -LSs "https://raw.githubusercontent.com/tiann/KernelSU/main/kernel/setup.sh" | bash -
# 指定版本：bash -s v1.0.2
```

集成后**重新编译内核**，产物即为带 KernelSU 的 boot.img。⚠️ 自 v3.0 起官方放弃此模式。

### 5.2 LKM 模式（KernelSU v3.0+，官方推荐）⭐

KernelSU 改为**可加载内核模块**，与 GKI 内核解耦，用 [Ylarod/ddk](https://github.com/Ylarod/ddk) 构建：

```sh
# 安装便捷脚本（封装 docker，强制 linux/amd64）
sudo curl -fsSL https://raw.githubusercontent.com/Ylarod/ddk/main/scripts/ddk -o /usr/local/bin/ddk
sudo chmod +x /usr/local/bin/ddk

# 拉取镜像 → 构建 → 产物在当前目录
export DDK_TARGET=android15-6.6
ddk pull
ddk build
```

- 三种模式：Host（Linux）/ DevContainer（macOS/Windows）/ Docker（CI）
- 生成的 `.ko` 模块由 KernelSU Manager 加载，**无需刷内核**，升级更安全
- GitHub CI 模板：`ddk-lkm.yml`（仓库根目录）

### 5.3 非 GKI 内核（KernelSU v0.9.5，已存档）

仅适用于 4.14+ 老内核，两条路：

- **kprobe 自动集成**：`setup.sh -s v0.9.5` + 开启 `CONFIG_KPROBES=y`、`CONFIG_HAVE_KPROBES=y`、`CONFIG_KPROBE_EVENTS=y`（依赖 `CONFIG_MODULES=y`）
- **手动改源码**：`CONFIG_KSU=y` + 打 4 处 hook 补丁（`fs/open.c` 的 do_faccessat、`fs/exec.c` 的 do_execveat_common、`fs/read_write.c` 的 vfs_read、`fs/stat.c` 的 vfs_statx）+ 安全模式（`input.c`）+ `devpts/inode.c`

## 6. 产物与刷写

### 6.1 产物位置

| 构建系统 | 位置 | 关键文件 |
| --- | --- | --- |
| build.sh | `out/BRANCH/dist/` | `Image.lz4-dtb`、`boot.img`、`*.ko` |
| Kleaf | `$DIST_DIR` | 同上 |

### 6.2 刷写（以 Pixel 为例）

```sh
# 临时启动（不保留）
fastboot boot Image.lz4-dtb

# 永久刷写（需先停用验证）
fastboot oem disable-verification
fastboot flash boot        out/slider/dist/boot.img
fastboot flash dtbo        out/slider/dist/dtbo.img
fastboot flash vendor_boot out/slider/dist/vendor_boot.img
fastboot reboot fastboot   # 动态分区需进 fastbootd
fastboot flash vendor_dlkm out/slider/dist/vendor_dlkm.img
```

分区差异：**Pixel 7+ 多一个 `vendor_kernel_boot`**（内核完全在该分区），另需刷 `system_dlkm`。

### 6.3 嵌入 AOSP 构建

```sh
export TARGET_PREBUILT_KERNEL=DIST_DIR/Image.lz4-dtb
# 或复制到 AOSP 树 device/VENDOR/NAME-kernel 位置后 make bootimage
```

## 7. 常见坑

| 问题 | 解法 |
| --- | --- |
| 内存 <24GB 构建失败 | build.sh 加 `LTO=thin`；Kleaf 用 `--lto=thin` |
| 生产 Pixel 分支构建慢/不生效 | 默认用预构建 GKI，改核心需 `BUILD_AOSP_KERNEL=1` |
| Pixel 6 系刷内核后 SELinux 起不来 | vendor_ramdisk 与平台 build 不匹配，需从出厂镜像提取更新 |
| Kleaf 受环境变量干扰 | 改用 `--lto` 等命令行参数，hermetic 构建 |
| KernelSU 开不了机（非 GKI） | 大概率 kprobe 异常：注释 ksu.c 中 sucompat/ksud init 验证 |

## 8. 快速决策表

```
你的场景 → 走哪条路
├─ Android 14+ / mainline 设备 → Kleaf + KernelSU LKM (ddk)
├─ Android 13 (5.10/5.15)    → Kleaf（官方）或 build.sh
├─ Android ≤12 (5.10 及以下) → build.sh + KernelSU 镜像模式
└─ 非 GKI 老设备             → build.sh + KernelSU v0.9.5 手动集成
```
