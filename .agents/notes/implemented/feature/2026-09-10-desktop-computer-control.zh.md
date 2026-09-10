# Agent Note: Desktop computer control

Status: implemented

中文 | [English](2026-09-10-desktop-computer-control.md)

## Problem

Desktop Agent 可以查看和修改选定工作区，但不能查看正在使用的桌面，也无法在原生应用中执行清晰、可确认的操作。通用 Shell 命令无法替代可见且逐次确认的电脑控制。

## Decision

私有 Desktop Host 会在 Harness 组合启动后注册四个仅桌面端可用的工具：`computer_screenshot`、`computer_click`、`computer_type` 和 `computer_open_application`。它们由 Host 进程调用 macOS 与 Windows 原生能力，而不是通过本地网页或第二个 Agent 实现。

每次调用都会先进入现有的一次性 `ctx.approval` 确认流程，之后才会截图、打开应用、点击或输入。截图会作为普通会话附件持久化，这也明确了隐私边界：当前会话的模型可以看到它。在 macOS 上，首次屏幕截图和控制还会触发系统的“屏幕录制”及“辅助功能”授权流程。Windows 对每个动作始终保留 Harness 确认门槛；输入操作会明确说明其会短暂使用剪贴板来粘贴 Unicode 文本。

## Alternatives considered

**赋予 Agent 不受限制的 Shell 权限。** 不采用，因为这不能让可视化操作变得可审查，也会模糊工作区访问与全系统控制之间的边界。

**将电脑控制做成子 Agent。** 不采用，因为子 Agent 无法提供操作系统授权，也不能充当人工确认的授权方。该能力应归属 Desktop Host 与现有确认界面。

**自动批准整个会话。** 不采用，因为截图、点击、输入内容及应用启动都可能分别带来隐私或安全后果。实现要求每次调用都重新进行一次性人工确认。

## Testing

Desktop 云端验证工作流会打包 Apple Silicon macOS 与 Windows 安装包，包含私有 Host 的完整依赖闭包。两个构建都通过后，它会把固定的 `latest` GitHub Release 替换为最新安装包。发行页提供给人安装的最终 `.dmg` 与 `.exe`，同时保留更新器需要的 macOS 压缩包和很小的更新附属文件；不会发布解包后的应用目录。临时的构建传输产物会在一天后过期。运行时行为需要交互式桌面：macOS 首次使用时必须显示系统的“屏幕录制”和“辅助功能”提示；Harness 确认界面必须对每个请求的动作进行批准，系统命令才会执行。

## Consequences

该功能让支持图像输入的模型能在受控前提下理解主显示器内容，并对已确认的坐标或当前焦点应用执行动作。它有意不静默控制电脑、不截图多个显示器、不输入秘密信息，也不绕过 Harness 或 macOS 的授权。Windows 输入会暂时更改剪贴板，因此确认文案和工具说明会在执行前说明这一点。
