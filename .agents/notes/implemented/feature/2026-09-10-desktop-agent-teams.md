# Agent Note: Desktop Agent Teams composition

Status: implemented

English | [中文](2026-09-10-desktop-agent-teams.zh.md)

## Problem

DeepSeek Harness already publishes experimental Agent Teams, but the Desktop profile only selected the base and Web layers. A desktop user could ask a standard Agent to create ordinary child agents, yet had no durable team roster, shared task board, member navigation, or peer mailbox panel.

## Decision

The Desktop seed composes `@deepseek-ai/dsh-experimental-agent-team-profile` and `@deepseek-ai/dsh-experimental-agent-team-web-profile` after `@deepseek-ai/dsh-base` and `@deepseek-ai/dsh-web-app`. The private Desktop Host declares both profile packages as first-party dependencies, so the offline package closure contains their Team domain, tools, generated Remote API, and client panel. Desktop development metadata declares the same profile packages.

The published Team implementation remains the owner of durable member, mailbox, and task state. Desktop adds no alternate coordinator. The user opens the Team action in a conversation header to inspect the roster and task board, update task ownership and state, or open a teammate conversation.

Team members share the selected workspace. Write scopes remain advisory conflict warnings; they are not locks and do not authorize writes. The lead Agent remains responsible for reviewing the final result and resolving conflicting changes.

## Alternatives considered

**Build a desktop-only multi-agent coordinator.** Rejected because the published Team service already provides durable recovery, compare-and-set task updates, mailbox delivery, and a client panel. A second coordinator would create incompatible child and task semantics.

**Enable only ordinary subagents.** Rejected because ordinary children do not provide the visible roster, shared task board, or peer messaging requested for coordinated development.

**Treat task write scopes as exclusive locks.** Rejected because shell commands and external programs can bypass them. The existing Team contract exposes overlap without claiming false exclusion.

## Testing

The Desktop cloud package build materializes the private Host dependency closure, creates the offline seed, starts the staged Desktop profile, and thereby verifies the ordered Team profile composition. The upstream Team packages retain their own durable roster, task, mailbox, and browser-panel tests.

## Consequences

Desktop releases include the experimental Team packages and their UI, increasing the seed size modestly. Multi-agent work can cost more model tokens and needs a clear task decomposition. The feature remains explicitly experimental upstream, but it is a first-party Desktop capability rather than an arbitrary third-party plugin.
