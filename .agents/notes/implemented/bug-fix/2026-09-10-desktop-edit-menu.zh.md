# Agent Note: 恢复桌面端编辑命令

Status: implemented

[English](2026-09-10-desktop-edit-menu.md) | 中文

## Problem

打包后的桌面端 shell 用产品菜单替换了 Electron 默认应用菜单，却遗漏了标准“编辑”菜单。用户输入 API 密钥时没有可见的“粘贴”命令；在 macOS 上，这还可能让 Command-V 无法传给已聚焦的可编辑控件。

## Decision

桌面端应用菜单保留产品操作，并加入 Electron 标准 `editMenu` role。它向当前聚焦的渲染控件提供平台原生的撤销、剪切、复制、粘贴、全选及相关快捷键，同时不向 Web 渲染器暴露 Node 或剪贴板权限。

个人发布说明记录了完整离线运行时会使安装包较大，并让首次打开在准备可写本地 profile 时变慢。该初始化保留，因为桌面应用必须不依赖浏览器或另行安装的运行时。

## Alternatives considered

**只在 API 密钥输入框中处理粘贴。** 不采用，因为每个可编辑控件都需要相同的原生编辑行为，而且页面专属的剪贴板桥会不必要地扩大渲染器权限。

**恢复完整的 Electron 默认菜单。** 不采用，因为这会丢弃产品菜单的插件、更新以及仅打包版可用性规则。标准 Edit role 能补齐缺失行为而不改变这些操作。

## Consequences

应用现在有可见的、平台标准的“编辑”菜单及其常规编辑快捷键。安装包大小和首次启动准备仍是自包含桌面运行时的代价；之后的启动会复用已准备好的 profile。

## Verification

打包 macOS 和 Windows 的 GitHub Actions 任务在发布打包过程中运行 Electron 入口。菜单使用 Electron 内置 role 而非渲染器实现，因此菜单项和快捷键行为仍由平台负责。
