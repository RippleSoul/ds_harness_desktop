# Agent Note: 桌面端默认工作区

Status: implemented

[English](2026-09-10-desktop-default-workspace.md) | 中文

## Problem

新的 Desktop 安装会停在工作区选择状态，但应用有一个可预测、由用户拥有的文档目录，适合作为安全的空工作区。用户必须先选择目录才能开始第一次对话。

## Decision

Electron 在启动 Desktop Host 前，会在平台“文档”目录下创建 `DeepSeek Harness`。Host 仅在持久化工作区 registry 为空时注册该目录。Electron 将路径直接交给 Host，因此 macOS 和 Windows 都使用各自的 Documents 位置，而非硬编码平台路径。

## Alternatives considered

**使用用户主目录。** 不采用，因为这会把很大的个人目录暴露为首个工作区，增加意外文件访问的可能性。

**每次启动都注册默认目录。** 不采用，因为已有的工作区选择是用户状态，不能被 Desktop 默认值替换。

**始终要求选择目录。** 不采用，因为专门的空目录是安全的首次启动选择，能免去新用户不必要的设置页面。

## Consequences

新用户会获得一个可见的空工作区，无需选择文件夹。已有用户保留原有工作区集合。Desktop 负责创建空目录，工作区 registry 仍是它是否在产品中可见的唯一权威。

## Verification

若 Desktop Host 组合未提供工作区 registry，启动会失败；macOS 和 Windows 发布任务会一起打包 Electron 与 Host 的改动。
