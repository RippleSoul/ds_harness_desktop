# Personal Desktop Release

This fork publishes an unsigned Apple Silicon macOS build for its owner. It is not a production distribution: macOS may require a one-time Finder confirmation because the app is not signed or notarized.

The scheduled **Personal macOS Desktop release** workflow rebases this fork's personal desktop configuration onto `deepseek-ai/deepseek-harness` `master`, then packages the desktop application. It uploads the DMG for first installation and the ZIP, blockmap, and `latest-mac.yml` update feed to the `latest` GitHub Release.

The packaged app checks `https://github.com/RippleSoul/ds_harness_desktop/releases/download/latest` on startup. The feed is public and contains no credentials. The application downloads the ZIP update only after the user accepts the update prompt.

Run the workflow manually after the initial push, then allow the daily schedule to keep the fork current. If an upstream change conflicts with the personal unsigned-build configuration, the rebase fails without publishing an update; resolve the conflict on `main` before re-running the workflow.

The upstream real-API E2E workflow is disabled outside the `deepseek-ai` repository because it requires DeepSeek's private external API test key and does not validate this personal desktop release.
