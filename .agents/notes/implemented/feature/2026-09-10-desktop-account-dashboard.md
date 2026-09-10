# Agent Note: Desktop account and usage dashboard

Status: implemented

English | [中文](2026-09-10-desktop-account-dashboard.zh.md)

## Problem

Desktop stored a DeepSeek API key through Harness credentials and recorded provider usage in session logs, but users had no desktop view of their current DeepSeek balance or accumulated usage. Sending an API key to a renderer to fetch these facts would turn a settings secret into browser-visible data.

## Decision

The Desktop application provides an Account Information window from the native application menu. Its context-isolated renderer calls a narrow Electron IPC method. The Electron main process forwards that method only to the private Desktop Host account endpoint; it does not accept an endpoint, headers, or key from the renderer.

The Host resolves only the managed `DEEPSEEK_API_KEY` credential, calls the official `https://api.deepseek.com/user/balance` endpoint with a twelve-second deadline, and returns normalized balance buckets without the credential. The dashboard reads complete stored session logs through the read-only persistence interface and derives provider-reported input, output, and cache token totals from completed turns. It reads the newest 500 sessions at most, labels a truncated result, and never returns prompts, responses, session contents, or keys to Electron.

The home hero no longer labels the product as a preview.

## Alternatives considered

**Fetch balance in the renderer.** Rejected because the renderer would need the API key or an unrestricted network bridge. The Host already owns credentials and can return the minimum key-free account view.

**Estimate tokens from visible text.** Rejected because DeepSeek response usage is retained in durable assistant settlements. Provider-reported token counts are more accurate and preserve cache buckets.

**Read every session without a bound.** Rejected because a long-running installation can hold an unbounded history. The panel chooses a documented newest-session bound and discloses when it applies.

## Testing

The Desktop cloud verification workflow packages both Apple Silicon macOS and Windows installers. It installs the full private Host dependency closure, builds the renderer assets, constructs the offline seed, and starts the staged profile. The existing locale test enforces that the Account renderer owns no unlocalized static copy.

## Consequences

Refreshing Account Information performs one official API request and a bounded local session read. It reports DeepSeek account balance only for the standard managed credential; a custom provider endpoint remains outside this account view. Token totals represent persisted completed turns and may omit incomplete requests or sessions beyond the displayed bound.
