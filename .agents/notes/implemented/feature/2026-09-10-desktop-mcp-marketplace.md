# Agent Note: Desktop MCP Marketplace

Status: implemented

English | [中文](2026-09-10-desktop-mcp-marketplace.zh.md)

## Problem

Desktop users need a discoverable way to connect MCP servers without treating MCP transport configuration as an npm plugin. The existing Desktop Plugins window installs `dsh.bundle.patch` packages, which cannot safely represent an arbitrary remote MCP endpoint or distinguish one-click connections from local code execution.

## Decision

The Desktop application exposes an MCP Marketplace backed by the official MCP Registry. Its dedicated renderer searches and displays registry records through narrow Electron IPC operations, and its add action persists only HTTPS Streamable HTTP endpoints that have no registry-declared headers or credentials.

Desktop stores accepted connections in the profile-owned `desktop-mcp.json` file. Each staged profile validates that file, creates a deterministic local tool namespace, and loads one `@deepseek-ai/dsh-mcp-client` row for each connection. Add and remove operations use the existing staged health check, activation journal, rollback, and backend restart path.

## Alternatives considered

**Rename the existing plugin manager.** Rejected because package bundles and MCP servers have different installation, trust, and runtime models. Calling package installation an MCP marketplace would imply support for server configuration it cannot provide.

**Run every Registry package with one click.** Rejected because Registry records can require local commands, containers, package managers, credentials, or arbitrary code. The one-click path is limited to remote HTTPS endpoints without headers so the Desktop app does not silently execute a server on the user's device.

**Use an unaffiliated directory as the default catalog.** Rejected because the official MCP Registry gives the product a stable, public protocol catalog and preserves repository links for users who need to inspect a server's source.

## Consequences

The Marketplace provides searchable, one-click remote MCP connections that survive Desktop upgrades. It does not install stdio, OCI, PyPI, or npm servers, and it does not collect secrets for authenticated MCP endpoints; those capabilities need an explicit runtime and credential design before they can enter the Desktop UI.

## Verification

`apps/desktop/tests/project-manager.spec.ts` covers transactional persistence and removal of an HTTPS MCP connection. The macOS and Windows release jobs build the embedded MCP client closure and package the Marketplace renderer.
