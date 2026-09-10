# Agent Note: Restore desktop editing commands

Status: implemented

English | [中文](2026-09-10-desktop-edit-menu.zh.md)

## Problem

The packaged desktop shell replaced Electron's default application menu with a product-specific menu. It omitted the standard Edit menu, leaving a user without a visible Paste command while entering an API key. On macOS this could also prevent the expected Command-V path from reaching a focused editable control.

## Decision

The desktop application menu keeps the product actions and adds Electron's standard `editMenu` role. It provides the platform-native Undo, Cut, Copy, Paste, Select All, and related shortcuts to the focused renderer control without exposing Node or clipboard privileges to the web renderer.

The personal release guide documents that the complete offline runtime makes the installer large and the first launch slower while it prepares the writable profile. This initialization is retained because the desktop app must run without a browser or a separately installed runtime.

## Alternatives considered

**Handle Paste in the API-key input only.** Rejected because every editable control needs the same native editing behavior, and a page-specific clipboard bridge would unnecessarily broaden renderer privileges.

**Restore Electron's entire default menu.** Rejected because it would discard the product menu's plugin, update, and packaged-only availability rules. The standard Edit role supplies the missing behavior without changing those actions.

## Consequences

The application now has a visible platform-standard Edit menu and its normal editing shortcuts. Installer size and first-launch preparation remain the trade-off for the self-contained desktop runtime; subsequent launches reuse the prepared profile.

## Verification

The packaged macOS and Windows GitHub Actions jobs exercise the Electron entry point during release packaging. The menu uses Electron's built-in role rather than a renderer implementation, so its menu item and accelerator behavior remain platform-owned.
