# Agent Note: 桌面端 MCP 市场

Status: implemented

[English](2026-09-10-desktop-mcp-marketplace.md) | 中文

## Problem

桌面端用户需要一个可发现的方式来连接 MCP 服务器，而不是把 MCP 传输配置当作 npm 插件。现有的桌面插件窗口安装的是 `dsh.bundle.patch` 包，无法安全表示任意远程 MCP endpoint，也无法区分一键连接和本地代码执行。

## Decision

桌面应用提供由官方 MCP Registry 支持的 MCP 市场。专属渲染器通过收窄的 Electron IPC 操作搜索并展示 Registry 记录；添加操作只持久化 Registry 未声明 headers 或凭据的 HTTPS Streamable HTTP endpoint。

Desktop 将被接受的连接存入 profile 所有的 `desktop-mcp.json`。每个 staging profile 都会验证该文件、创建确定的本地工具 namespace，并为每个连接加载一条 `@deepseek-ai/dsh-mcp-client` 配置。添加和移除操作沿用现有的 staging 健康检查、激活日志、rollback 和后端重启路径。

## Alternatives considered

**重命名现有插件管理器。** 不采用，因为包 bundle 与 MCP 服务器的安装、信任和运行模型不同。把包安装称为 MCP 市场，会错误暗示它能提供服务器配置。

**一键运行每个 Registry 包。** 不采用，因为 Registry 记录可能需要本地命令、容器、包管理器、凭据或任意代码。一键路径限制为无需 headers 的远程 HTTPS endpoint，避免桌面应用静默在用户设备上执行服务器。

**使用非官方目录作为默认目录。** 不采用，因为官方 MCP Registry 提供稳定、公开的协议目录，并保留仓库链接供用户在需要时检查服务器源码。

## Consequences

市场提供可搜索、可一键连接且会跨 Desktop 升级保留的远程 MCP 连接。它不安装 stdio、OCI、PyPI 或 npm 服务器，也不为需认证的 MCP endpoint 收集密钥；这些能力需要明确的运行时和凭据设计后才能进入桌面 UI。

## Verification

`apps/desktop/tests/project-manager.spec.ts` 覆盖 HTTPS MCP 连接的事务性持久化和移除。macOS 与 Windows 发布任务会构建内置 MCP client 依赖闭包并打包市场渲染器。
