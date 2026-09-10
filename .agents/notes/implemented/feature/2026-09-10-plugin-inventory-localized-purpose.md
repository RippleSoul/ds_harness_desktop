# Agent Note: Localized plugin purposes

Status: implemented

English | [中文](2026-09-10-plugin-inventory-localized-purpose.zh.md)

## Problem

The collapsed Plugin list cards showed Harness internal entry identifiers beneath their technical names. In a Chinese Desktop interface those identifiers were not a useful explanation of what each capability does.

## Decision

Cards keep their technical module name as the title for precise identification, but their compact subtitle is now a localized purpose label. Known Harness modules receive short, specific labels such as “子智能体协作” and “执行工作流”. Unknown future modules use localized category labels for tool, command, UI, client, or system components. The raw entry identifier remains searchable, is part of the accessible name, and stays available in expanded details.

## Consequences

The list is readable in Chinese without hiding troubleshooting information. No plugin behavior, enablement state, or Agent preset composition changes.
