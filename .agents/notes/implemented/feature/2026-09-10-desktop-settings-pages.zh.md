# Agent Note: Desktop 设置页

Status: implemented

中文 | [English](2026-09-10-desktop-settings-pages.md)

## Problem

Desktop MCP 市场和账户面板原本从操作系统菜单打开，并使用独立原生窗口。这让产品流程脱离了设置面板，也让 macOS 与 Windows 的发现路径不一致。

## Decision

主 Desktop 渲染进程现在通过隔离的 preload 桥接获得固定白名单：MCP 搜索、列出、添加、移除及账户摘要读取。产品内的设置导航借此渲染 MCP 市场、账户信息和电脑控制页面。旧的 macOS 应用菜单中的 MCP 市场和账户入口被移除；更新入口保持原生，因为安装和重启归 Electron 所有。

MCP 添加和移除仍使用既有的主进程发送方校验及项目事务路径。渲染进程不会获得原始 IPC、文件系统、Shell、包管理或任意进程启动权限。即使扩展注册表比隔离桥接更早观察到运行环境，Desktop 应用 origin 仍会保留这些页面；每个原生操作只会在实际使用时解析这组固定桥接。普通浏览器产品仍不具备 Desktop origin，因此不会出现虚假的桌面功能入口。界面刻意采用简洁卡片和操作，不使用说明性小字；macOS 与 Windows 共用同一套页面。

## Alternatives considered

**从设置页打开已有原生窗口。** 不采用，因为功能仍在设置面板之外，并会形成两套互相竞争的导航。

**向网页渲染进程公开通用 Electron IPC。** 不采用，因为这会允许产品页面调用超出自身功能范围的操作。桥接只公开这些页面所需的结构化操作。

**为 Windows 制作单独页面。** 不采用，因为市场、账户和 Harness 确认规则属于产品能力，不是操作系统专属流程。原生电脑控制权限会在真正执行时按平台分别处理。

## Testing

个人桌面工作流会在 Apple Silicon macOS 与 Windows x64 上打包同一份主渲染进程桥接。运行这些页面需要 Desktop 应用的 `dsh-app://app` origin：普通浏览器加载会省略这些注册，而稍晚才可观察到 preload 桥接不会移除设置入口。MCP 变更走既有的打包项目事务，并在激活后重新加载主窗口。账户读取使用活动 Desktop Host 既有的无密钥账户端点。

## Consequences

用户可从一个设置弹窗找到全部个人 Desktop 增强功能。MCP 连接仍只接受既有的一键 HTTPS Streamable HTTP 注册表条目。账户页显示当前余额与本地保留的 Token 总量。电脑控制在此显示可用操作；真正的截图、点击、输入和打开应用请求仍需要每次重新经过 Harness 确认及操作系统相应权限。
