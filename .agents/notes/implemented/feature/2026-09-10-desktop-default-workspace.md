# Agent Note: Desktop default workspace

Status: implemented

English | [中文](2026-09-10-desktop-default-workspace.zh.md)

## Problem

A new Desktop installation opens on a workspace-selection state even though the application has a predictable user-owned documents location suitable for a safe empty workspace. Users must choose a directory before beginning their first conversation.

## Decision

Electron creates `DeepSeek Harness` under its platform Documents directory before starting the Desktop Host. The Host registers that directory only when the durable workspace registry is empty. Electron supplies the path directly to the Host, so macOS and Windows use their own Documents locations instead of a hard-coded platform path.

## Alternatives considered

**Use the user's home directory.** Rejected because it would expose a broad personal directory as the first workspace and make accidental file access more likely.

**Register the default directory on every launch.** Rejected because an existing workspace selection is user-owned state and must not be displaced by a Desktop default.

**Leave directory selection mandatory.** Rejected because the dedicated empty directory is a safe first-run choice and removes an unnecessary setup screen for new users.

## Consequences

New users receive one empty, visible workspace without being asked to select a folder. Existing users retain their workspace set. Desktop owns the creation of the empty directory, while the workspace registry remains the authority for whether it is visible in the product.

## Verification

The Desktop Host fails startup if its composition cannot provide the workspace registry, and the macOS and Windows release jobs package the Electron and Host changes together.
