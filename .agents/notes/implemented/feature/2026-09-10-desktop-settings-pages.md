# Agent Note: Desktop Settings pages

Status: implemented

English | [中文](2026-09-10-desktop-settings-pages.zh.md)

## Problem

The Desktop MCP Marketplace and account dashboard opened from operating-system menu entries and separate native windows. That split the product workflow away from the Settings panel and gave macOS a different discovery path from Windows.

## Decision

The primary Desktop renderer now receives a fixed allowlist of MCP search, list, add, remove, and account-summary operations through its isolated preload bridge. The in-product Settings navigation uses that bridge to render MCP Marketplace, Account, and Computer Control pages. The old macOS application-menu entries for MCP Marketplace and Account are removed; the updates entry remains native because installation and restart are Electron-owned.

MCP add and remove retain the existing main-process sender verification and project transaction path. The renderer does not receive raw IPC, filesystem, shell, package-management, or arbitrary process-launch access. The Desktop application origin keeps these pages registered even if its extension registry observes the isolated bridge slightly late; each native action resolves that fixed bridge only when used. The ordinary browser product still has no Desktop origin and gains no false desktop surface. The UI intentionally uses concise cards and actions without instructional microcopy, and is shared by macOS and Windows.

## Alternatives considered

**Open the existing native windows from Settings.** Rejected because it leaves the requested feature outside the Settings panel and creates two competing navigation systems.

**Expose generic Electron IPC to the web renderer.** Rejected because it would permit the product page to invoke operations beyond the features it owns. The bridge publishes only the structured operations required by these pages.

**Give Windows a separate page.** Rejected because Marketplace, Account, and the Harness approval rule are product capabilities, not operating-system-specific workflows. Native desktop-control permissions remain platform-specific at execution time.

## Testing

The personal desktop workflow packages the same primary renderer bridge on Apple Silicon macOS and Windows x64. The runtime pages require the Desktop application's `dsh-app://app` origin: ordinary browser loading omits their registrations, while a late-observed preload bridge does not remove the Settings entries. MCP mutations run through the existing packaged-project transaction and reload the primary window after activation. Account reads use the active Desktop Host's existing key-free account endpoint.

## Consequences

Users find all personal Desktop additions from one Settings modal. MCP connections continue to accept only the existing one-click HTTPS Streamable HTTP registry entries. Account displays current balance and retained local Token totals. Computer Control exposes its enabled operations here; actual screenshot, click, typing, and launch requests still require a fresh Harness approval and the operating system's applicable permissions.
