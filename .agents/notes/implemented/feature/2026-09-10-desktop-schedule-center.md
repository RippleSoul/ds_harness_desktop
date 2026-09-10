# Agent Note: Desktop Schedule center

Status: implemented

English | [中文](2026-09-10-desktop-schedule-center.zh.md)

## Problem

Session-local Schedule reminders were available only through Schedule tools and the current conversation's compact header catalog. Desktop users could not discover active reminders across their existing main conversations from the product navigation without adding a second persistence or scheduling system.

## Decision

The Desktop overlay enables `time-context`, `schedule`, and `ui-schedule`. `dsh-client-ui-schedule` registers a Scheduled tasks main panel and a sidebar row below New Session, so the Workspace browser moves below that product navigation.

The panel reads the Session Controller's existing list snapshot and each ordinary Session's `schedule` projection. It excludes subagent rows, orders overdue records before future records, provides status filters and text search, and opens the selected Session before returning the layout to the conversation panel. The Session event stream remains the only durable reminder state; the panel sends no RPC and mutates no Schedule record.

Desktop retains the current Schedule delivery model: a live root Agent handles a due reminder in its original Session. The task center neither scans persistence nor adopts cold Sessions, executes work after Desktop closes, sends operating-system notifications, or adds calendar and cron rules.

## Alternatives considered

**Create a global Desktop scheduler.** Rejected because independent task identity, background ownership, recovery, notification, and execution policy would exceed the retained session-local delivery model.

**Store a second global task list.** Rejected because it would duplicate active reminder state and could disagree with the Session log.

**Put task creation controls on the center page.** Rejected because the existing Schedule tools preserve the originating conversation's context and durable authority; a visual control without a new scheduling lifecycle would falsely imply independent execution.

## Verification

Focused UI specifications cover the root-panel and sidebar registrations, return-to-conversation callback, main-Session filtering, overdue ordering, search, status filters, empty state, and clock refresh. The personal Desktop release workflow packages the same overlay for macOS and Windows.

## Consequences

- Desktop users find scheduled work from the sidebar without leaving the application.
- Each task retains its originating conversation and Schedule record.
- The page remains a read-only local overview, not a cloud service or independent background task runner.
