# Agent Note: Desktop Agent Teams composition

Status: implemented

中文 | [English](2026-09-10-desktop-agent-teams.md)

## Problem

DeepSeek Harness 已发布实验性的 Agent Teams，但 Desktop profile 只选择了基础层和 Web 层。桌面用户可以让标准 Agent 创建普通子智能体，却没有可恢复的团队成员表、共享任务板、成员会话导航或对等消息面板。

## Decision

Desktop seed 在 `@deepseek-ai/dsh-base` 和 `@deepseek-ai/dsh-web-app` 之后组合 `@deepseek-ai/dsh-experimental-agent-team-profile` 与 `@deepseek-ai/dsh-experimental-agent-team-web-profile`。私有 Desktop Host 将两个 profile 包声明为第一方依赖，因此离线包闭包会包含其 Team 领域、工具、生成的 Remote API 和客户端面板。Desktop 开发元数据也声明相同的 profile 包。

已发布的 Team 实现仍然拥有成员、消息箱和任务的持久化状态。Desktop 不另建协调器。用户可在会话顶部打开 Team 操作，查看成员表与任务板，修改任务归属和状态，或进入成员会话。

团队成员共用当前选中的工作区。写入范围只是冲突提示，不是锁，也不授予写入权限。主 Agent 仍负责检查最终结果并解决冲突。

## Alternatives considered

**构建一个仅限桌面的多智能体协调器。** 不采用，因为已发布的 Team 服务已经提供了可恢复状态、比较并交换的任务更新、消息投递和客户端面板。再建一个协调器会产生不兼容的子智能体和任务语义。

**只启用普通子智能体。** 不采用，因为普通子智能体没有协同开发所需的可见成员表、共享任务板和对等消息。

**把任务写入范围当作互斥锁。** 不采用，因为 Shell 命令和外部程序可以绕过它们。现有 Team 合同会显示重叠，但不会虚假宣称排他性。

## Testing

Desktop 云端打包会物化私有 Host 的依赖闭包、创建离线 seed，并启动 staging Desktop profile，因此可验证有序的 Team profile 组合。上游 Team 包仍保留自己的成员、任务、消息箱和浏览器面板测试。

## Consequences

Desktop 发布包会包含实验性的 Team 包与界面，seed 体积会小幅增加。多智能体任务会消耗更多模型 Token，也需要清晰地拆分任务。该能力在上游仍标注为实验性，但在 Desktop 中是第一方功能，不是任意第三方插件。
