# Agent Note: Desktop computer control

Status: implemented

English | [中文](2026-09-10-desktop-computer-control.zh.md)

## Problem

Desktop Agents could inspect and edit a selected workspace, but could not inspect a live desktop or perform a clearly approved action in a native application. A general shell command is not a safe replacement for visible, per-action computer control.

## Decision

The private Desktop Host registers four desktop-only tools after its Harness composition boots: `computer_screenshot`, `computer_click`, `computer_type`, and `computer_open_application`. They use the native macOS and Windows facilities from the Host process rather than a local web page or a secondary Agent.

Every invocation goes through the existing one-shot `ctx.approval` request before taking any screenshot, opening an application, clicking, or typing. A screenshot is persisted as a normal conversation attachment, which makes the privacy boundary explicit: it is available to the current model in that conversation. On macOS, the first screen capture and control request additionally uses the operating system's Screen Recording and Accessibility permission flows. Windows keeps the Harness approval gate for every action; typing is disclosed because it uses the clipboard briefly to paste Unicode text.

## Alternatives considered

**Give the Agent unrestricted shell access.** Rejected because it does not make visual operations reviewable and would blur the boundary between workspace access and system-wide control.

**Implement computer control as a child Agent.** Rejected because a child Agent cannot supply operating-system permissions or act as the human approval authority. The capability belongs in the Desktop Host and the existing approval surface.

**Auto-approve a whole session.** Rejected because screenshots, clicks, typed content, and application launch can each have distinct privacy or safety consequences. The implementation requires a fresh one-shot approval for each invocation.

## Testing

The Desktop cloud verification workflow packages both Apple Silicon macOS and Windows installers, including the private Host dependency closure. Runtime behavior requires an interactive desktop: macOS must display its native Screen Recording and Accessibility prompts on first use, and the Harness approval UI must approve each requested action before the operating-system command runs.

## Consequences

The feature gives image-capable models a controlled way to reason over the primary display and act on an approved coordinate or focused application. It intentionally does not silently control the computer, capture multiple displays, type secrets, or bypass either Harness or macOS authorization. Windows typing temporarily changes the clipboard, so the approval wording and tool description make that behavior visible before it occurs.
