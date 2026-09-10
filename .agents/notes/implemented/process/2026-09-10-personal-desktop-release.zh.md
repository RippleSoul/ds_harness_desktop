# Agent Note: 个人未签名桌面版发布

Status: implemented

[English](2026-09-10-personal-desktop-release.md) | 中文

## Problem

所有者需要一个仅供个人使用的 macOS 桌面版本，既能跟随上游 Harness 更新，也不必购买代码签名证书或维护独立更新服务器。

## Decision

桌面打包仅在显式设置 `DSH_DESKTOP_PERSONAL_UNSIGNED=1` 时允许个人未签名构建。该构建跳过 macOS 签名和公证，但保留标准打包 Electron、内置运行时和离线 seed 工作流。`DSH_DESKTOP_PERSONAL_UPDATE_URL` 覆盖该构建的通用更新地址。

[Personal macOS Desktop release](../../../../.github/workflows/personal-desktop-release.yml) 每日或按需将 `main` rebase 到官方 `master`，以个人构建设置打包 Apple Silicon macOS，并替换 `latest` GitHub Release 资源。DMG 用于首次安装；ZIP、blockmap 和 `latest-mac.yml` 供 electron-updater 更新。

上游 [real-API E2E workflow](../../../../.github/workflows/e2e.yml) 只在 `deepseek-ai` 仓库运行。这个公开个人仓库没有也不应拥有其私密测试密钥，并且该测试不验证桌面版发布。

## Alternatives considered

**购买签名身份。** Apple 签名和公证能提供标准 Gatekeeper 体验，但仅供所有者使用的构建并不需要，而且需要付费 Apple Developer 会员资格。

**每次上游更新后在用户 Mac 上直接构建。** 本地构建不需要 GitHub Actions，但需要完整工具链，也会让每次更新都变成手动拉取和编译源码。

**使用私有更新仓库。** 客户端需要凭据才能读取更新流。上游源码已按 MIT 公开，因此公开仓库更合适。

## Consequences

由于个人构建未签名，macOS 可能在首次打开时显示警告。更新流公开且不包含密钥。上游冲突会停止 rebase，直到修复 `main` 前不会发布更新。该工作流只面向 Apple Silicon；Windows 和 Intel macOS 不属于此个人发布通道。

## Verification

[macOS signature tests](../../../../apps/desktop/tests/macos-signature.spec.ts) 覆盖显式未签名构建及其更新地址。GitHub Actions 工作流负责实际打包并发布更新流。
