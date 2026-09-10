# Agent Note: Desktop 定时任务中心

Status: implemented

[English](2026-09-10-desktop-schedule-center.md) | 中文

## Problem

会话本地的 Schedule 提醒原本只能通过 Schedule 工具和当前会话头部的紧凑目录使用。Desktop 用户无法从产品导航发现既有主会话中的活动提醒，同时又不应为此新增第二套持久化或调度系统。

## Decision

Desktop overlay 启用 `time-context`、`schedule` 与 `ui-schedule`。`dsh-client-ui-schedule` 注册“定时任务”主面板，并在“新会话”下方注册侧栏行，因此“工作区”浏览区位于该产品导航之后。

面板读取 Session Controller 既有的列表快照，以及每个普通会话的 `schedule` projection。它排除 subagent 行，将逾期记录排在未来记录之前，提供状态筛选和文字搜索，并先打开所选会话再让布局返回会话面板。会话事件流仍是唯一的提醒持久状态；面板不发送 RPC，也不修改任何 Schedule 记录。

Desktop 保留当前的 Schedule 交付模型：一个存活的根 agent 在其原始会话中处理到期提醒。任务中心不扫描持久化记录、不接管休眠会话、不在 Desktop 关闭后执行工作、不发送操作系统通知，也不增加日历或 cron 规则。

## Alternatives considered

**创建全局 Desktop 调度器。** 不采用，因为独立的任务身份、后台所有权、恢复、通知和执行策略会超出保留的会话本地交付模型。

**存储第二份全局任务列表。** 不采用，因为它会重复活动提醒状态，并可能与会话日志不一致。

**在中心页面放置创建任务的控件。** 不采用，因为既有 Schedule 工具会保留原始会话的上下文和持久权威；在没有新调度生命周期时添加视觉控件会错误暗示独立执行。

## Verification

聚焦的 UI 规格覆盖根面板和侧栏注册、返回所属会话的回调、主会话筛选、逾期排序、搜索、状态筛选、空状态和时钟刷新。个人 Desktop 发布工作流会为 macOS 与 Windows 打包同一份 overlay。

## Consequences

- Desktop 用户无需离开应用即可从侧栏发现定时工作。
- 每项任务保留其原始会话与 Schedule 记录。
- 该页面仍是只读本地概览，不是云服务或独立后台任务执行器。
