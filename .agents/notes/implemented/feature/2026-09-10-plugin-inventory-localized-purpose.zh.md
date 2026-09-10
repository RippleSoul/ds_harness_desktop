# Agent Note: 插件用途中文化

Status: implemented

中文 | [English](2026-09-10-plugin-inventory-localized-purpose.md)

## Problem

收起的插件列表卡片会在技术名称下显示 Harness 内部条目 ID。在中文 Desktop 界面中，它无法有效说明每项能力的用途。

## Decision

卡片保留技术模块名作为标题，便于精确定位；紧凑的次标题改为本地化用途标签。已知 Harness 模块使用“子智能体协作”“执行工作流”等简短具体标签。未来未知模块则按 tool、command、UI、client 或系统组件显示相应的本地化类别标签。原始条目 ID 仍可被搜索、属于无障碍名称的一部分，并保留在展开详情中。

## Consequences

列表在中文环境中可直接阅读，同时不隐藏排查所需的技术信息。插件行为、启停状态和 Agent 预设组合均不改变。
