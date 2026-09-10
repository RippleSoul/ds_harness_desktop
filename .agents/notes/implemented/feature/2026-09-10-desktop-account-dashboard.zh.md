# Agent Note: Desktop account and usage dashboard

Status: implemented

中文 | [English](2026-09-10-desktop-account-dashboard.md)

## Problem

Desktop 通过 Harness 凭据存储 DeepSeek API Key，并在会话日志中记录供应商用量，但用户没有桌面界面可查看当前 DeepSeek 余额或累计用量。若把 API Key 交给渲染页面去读取这些信息，会把设置中的密钥变成浏览器可见数据。

## Decision

Desktop 在原生应用菜单中提供“账户信息”窗口。上下文隔离的渲染页只调用一个窄 Electron IPC 方法。Electron 主进程只会把该方法转发给私有 Desktop Host 的账户端点；渲染页无法传入端点、请求头或密钥。

Host 只解析受管理的 `DEEPSEEK_API_KEY` 凭据，以十二秒截止时间调用官方 `https://api.deepseek.com/user/balance` 端点，并返回不含凭据的标准化余额条目。仪表盘通过只读持久化接口读取完整的已保存会话日志，从已完成回合中推导供应商报告的输入、输出和缓存 Token 总量。它最多读取最新 500 个会话，发生截断时会明确标注，并且不会把提示词、回复、会话内容或密钥返回给 Electron。

首页不再将产品标识为预览版。

## Alternatives considered

**在渲染页中读取余额。** 不采用，因为渲染页需要 API Key 或不受限制的网络桥。Host 已拥有凭据，可以返回最小化且不含密钥的账户视图。

**根据可见文本估算 Token。** 不采用，因为 DeepSeek 的响应用量已经保存在持久化的 Assistant 结算记录中。供应商报告的 Token 更准确，也能保留缓存分桶。

**不设上限地读取所有会话。** 不采用，因为长期使用的安装可能拥有无限增长的历史。面板采用明确的最新会话上限，并在生效时说明。

## Testing

Desktop 云端验证工作流会打包 Apple Silicon macOS 和 Windows 安装包。它会安装完整的私有 Host 依赖闭包、构建渲染资源、生成离线 seed，并启动 staging profile。现有 locale 测试会确保账户渲染页不含未本地化的静态文案。

## Consequences

刷新“账户信息”会发起一次官方 API 请求并进行有上限的本地会话读取。它只报告标准受管理凭据对应的 DeepSeek 账户余额；自定义供应商端点不在此账户视图范围内。Token 总量代表已持久化的完整回合，可能不包含未完成请求或超出显示上限的会话。
