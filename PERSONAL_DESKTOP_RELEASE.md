# Personal Desktop Release

This fork publishes unsigned Apple Silicon macOS and x64 Windows builds for its owner. They are not production distributions: macOS may require a one-time Finder confirmation, and Windows may show a SmartScreen warning, because the apps are not signed or notarized.

The scheduled **Personal Desktop release** workflow rebases this fork's personal desktop configuration onto `deepseek-ai/deepseek-harness` `master`, then packages both desktop applications in GitHub-hosted macOS and Windows runners. It uploads the DMG for macOS first installation, the Windows EXE installer, and the ZIP, blockmap, and platform update feeds to the `latest` GitHub Release.

The packaged app checks `https://github.com/RippleSoul/ds_harness_desktop/releases/download/latest` on startup. The feed is public and contains no credentials. The application downloads the ZIP update only after the user accepts the update prompt.

The app packages the complete Harness runtime for offline use, including Node.js, pnpm, and its dependency seed. This makes the installer large and makes the first launch slower while it prepares the writable local profile; later launches reuse that profile. The desktop application's Edit menu provides normal keyboard clipboard commands, including Paste for the API-key setup field.

Every push to `main`, a manual run, and the daily schedule start the workflow. If an upstream change conflicts with the personal unsigned-build configuration, the rebase fails without publishing an update; resolve the conflict on `main` before re-running the workflow.

The upstream real-API E2E workflow is disabled outside the `deepseek-ai` repository because it requires DeepSeek's private external API test key and does not validate this personal desktop release.
