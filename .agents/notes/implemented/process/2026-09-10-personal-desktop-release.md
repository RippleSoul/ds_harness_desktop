# Agent Note: Personal unsigned desktop release

Status: implemented

English | [中文](2026-09-10-personal-desktop-release.zh.md)

## Problem

The owner needs a private-use macOS desktop build that follows upstream Harness changes without purchasing code-signing certificates or operating a separate update server.

## Decision

The desktop package accepts `DSH_DESKTOP_PERSONAL_UNSIGNED=1` only when a build explicitly selects it. That build skips macOS signing and notarization while retaining the normal packaged Electron, bundled runtime, and offline seed workflow. `DSH_DESKTOP_PERSONAL_UPDATE_URL` overrides the generic update feed URL for that build.

[Personal macOS Desktop release](../../../../.github/workflows/personal-desktop-release.yml) rebases `main` onto the official `master` branch daily or on demand, packages Apple Silicon macOS with the personal build settings, and replaces the `latest` GitHub Release assets. The DMG supports first installation; the ZIP, blockmap, and `latest-mac.yml` support electron-updater.

The upstream [real-API E2E workflow](../../../../.github/workflows/e2e.yml) runs only in the `deepseek-ai` repository. Its private test key is unavailable in this public personal fork and the test does not validate the desktop release.

## Alternatives considered

**Purchase signing identities.** Apple signing and notarization provide the normal Gatekeeper experience, but are unnecessary for an owner-only build and require a paid Apple Developer membership.

**Build directly on the user's Mac after every upstream update.** Local builds avoid GitHub Actions but require a full toolchain and turn every update into a manual source checkout and build.

**Use a private update repository.** The client would need credentials to read the feed. A public repository is appropriate because the upstream source is already public under MIT.

## Consequences

macOS can display a first-launch warning because the personal build is unsigned. The update feed is public and contains no secrets. An upstream conflict stops the rebase and publishes no release until `main` is repaired. The workflow targets Apple Silicon only; Windows and Intel macOS remain outside this personal release channel.

## Verification

[macOS signature tests](../../../../apps/desktop/tests/macos-signature.spec.ts) cover the explicit unsigned build and its update URL. The GitHub Actions workflow performs the packaged build and publishes the feed.
