<p align="center">
  <img src="./src/public/icon/128.png" alt="Motrix Extension" width="96" height="96">
</p>

# Motrix Extension

Browser extension for Motrix — download interception, aria2 JSON-RPC delegation, and live task control from Chrome.

![Manifest](https://img.shields.io/badge/manifest-v3-blue)
![Chrome](https://img.shields.io/badge/Chrome-116%2B-4285F4)
![WXT](https://img.shields.io/badge/WXT-React-0ea5e9)
![License](https://img.shields.io/badge/license-MIT-green)

---

**Popup** — connection status, speed metrics, and task controls
**Options** — RPC connection, interception behavior, site rules, appearance, language, and maintenance

## Features

- **Download interception** — Captures browser downloads and routes matching tasks to Motrix through aria2 JSON-RPC.
- **Smart filtering** — Applies the global switch, self-download guard, protocol switches, size limits, extension lists, and site rules before intercepting.
- **Context menu** — Adds "Download with Motrix" for links, images, audio, video, pages, and selected text.
- **Protocol links** — Handles `magnet:`, `ed2k:`, and `thunder:` links from pages when the corresponding option is enabled.
- **Cookie forwarding** — Optionally forwards cookies to the local aria2 task for authenticated downloads.
- **Request context forwarding** — Optionally forwards a small allowlist of request headers such as Referer and User-Agent.
- **Filename preservation** — Reads `Content-Disposition` response headers and URL paths to preserve delegated filenames.
- **Popup dashboard** — Shows connection status, global speeds, active/waiting/stopped tasks, and per-task actions.
- **Task actions** — Pause, resume, remove, pause all, and resume all through aria2 RPC.
- **Auto wake and fallback** — Attempts to wake Motrix with `motrix://` and falls back to `motrix://new-task` when RPC submission fails.
- **Settings management** — Stores connection, download, site rule, UI, and diagnostic settings locally.
- **i18n** — Includes English and Simplified Chinese.

## Installation

### From Source

```bash
git clone https://github.com/reagin/motrix-extension.git
cd motrix-extension
pnpm install
pnpm build
```

Then load the unpacked extension:

1. Open `chrome://extensions`.
2. Enable **Developer mode**.
3. Click **Load unpacked**.
4. Select `.output/chrome-mv3`.

To create a ZIP package for Chrome Web Store submission:

```bash
pnpm zip
```

### From GitHub Releases

Pre-built ZIP packages are published on the [Releases](https://github.com/reagin/motrix-extension/releases) page.

1. Download the latest `motrix-extension-*-chrome-mv3.zip` asset.
2. Unzip the archive.
3. Open `chrome://extensions`, enable **Developer mode**, click **Load unpacked**, and select the extracted folder.

Release tags use the manifest date version format, for example `v2026.07.08.12345`, which matches the extension's `version_name` shown in `chrome://extensions`.

## Releases

### For users

Download the latest ZIP from [GitHub Releases](https://github.com/reagin/motrix-extension/releases) and load the unpacked extension as described above.

### For maintainers

1. Merge the changes you want to ship into the default branch.
2. Open **Actions** → **Release** → **Run workflow**.
3. Optionally set custom release notes, or leave them empty to auto-generate from commits.
4. Optionally enable **draft** or **prerelease**, and choose whether to run ESLint before packaging.
5. After the workflow completes, verify the new release tag (for example `v2026.07.07.12345`) and attached ZIP on the Releases page.

The workflow packages the Chrome MV3 build with `pnpm zip`, reads `version_name` from the built manifest, and uploads `motrix-extension-*-chrome-mv3.zip` to GitHub Releases. Manifest versions are computed in UTC so local builds and CI releases follow the same rules.

Ensure the repository allows workflow write access under **Settings** → **Actions** → **General** → **Workflow permissions** → **Read and write permissions**.

## FAQ

### What is Motrix?

[Motrix](https://github.com/agalwood/Motrix) is a download manager powered by aria2. This extension bridges Chrome downloads to a local Motrix or aria2-compatible JSON-RPC endpoint.

### Do I need the desktop app?

Yes. The extension sends tasks to a local JSON-RPC endpoint. By default it uses `http://127.0.0.1:16800/jsonrpc`. Without Motrix or a compatible aria2 service running, the popup will show a disconnected state and downloads cannot be delegated through RPC.

### Why does the extension request broad host permissions?

Downloads can originate from any website. The extension needs matching `http://*/*` and `https://*/*` host permissions so Chrome allows it to read cookies, request headers, and response filename headers for delegated downloads. These values are used only to submit download tasks to the local RPC endpoint. Cookie forwarding and request header forwarding can be disabled in Options.

### Does this extension collect data?

No. The extension does not send analytics, telemetry, advertising data, or browsing data to the developer or to third-party services. Runtime communication is intended for the local Motrix/aria2 endpoint configured by the user. See the [Privacy Policy](PRIVACY_POLICY.md).

## Development

### Prerequisites

- [Node.js](https://nodejs.org/)
- [pnpm](https://pnpm.io/)
- Motrix or another aria2 JSON-RPC-compatible service

### Setup

```bash
# Install dependencies
pnpm install

# Start WXT dev mode
pnpm dev

# Build for production
pnpm build

# Package for Chrome Web Store submission
pnpm zip
```

### Project Structure

```text
motrix-extension/
├── src/
│   ├── components/
│   │   ├── motrix/             # Motrix task/status presentation components
│   │   └── ui/                 # Reusable Radix/Tailwind UI primitives
│   ├── entrypoints/            # WXT extension entry points
│   │   ├── background.ts       # Service worker bootstrap
│   │   ├── content.ts          # Protocol-link click interception
│   │   ├── options/            # Full-page settings app
│   │   └── popup/              # Browser action popup app
│   ├── features/
│   │   ├── background/         # Downloads, context menu, messaging, runtime state
│   │   └── options/            # Options page components, hooks, sections, constants
│   ├── hooks/                  # Shared React hooks
│   ├── library/
│   │   ├── download/           # Filtering, duplicate guard, metadata, request context
│   │   ├── i18n/               # Runtime dictionaries and locale helpers
│   │   ├── protocol/           # motrix:// protocol launcher
│   │   ├── rpc/                # aria2 JSON-RPC client and error types
│   │   ├── storage/            # Zod schemas and browser storage helpers
│   │   ├── messages.ts         # Runtime message and state contracts
│   │   ├── runtime.ts          # Browser runtime messaging helper
│   │   └── utils.ts            # Shared formatting and class helpers
│   ├── locales/                # WXT i18n resources
│   ├── public/icon/            # Extension icons
│   └── styles/                 # Global styles
├── wxt.config.ts               # WXT and manifest configuration
├── eslint.config.mjs           # ESLint configuration
└── package.json                # Scripts and dependencies
```

### Scripts

| Command            | Description                       |
| ------------------ | --------------------------------- |
| `pnpm dev`         | Start WXT dev mode                |
| `pnpm build`       | Build the Chrome MV3 extension    |
| `pnpm zip`         | Package the Chrome build as a ZIP |
| `pnpm clean`       | Clean WXT output                  |
| `pnpm lint:eslint` | Run ESLint with auto-fix          |

## Chrome Web Store Notes

The current manifest requests only the permissions used by the implementation:

| Permission                  | Reason                                                                    |
| --------------------------- | ------------------------------------------------------------------------- |
| `downloads`                 | Detect, cancel, and erase Chrome downloads delegated to Motrix            |
| `storage`                   | Store settings, site rules, UI preferences, and diagnostic events locally |
| `contextMenus`              | Provide the "Download with Motrix" right-click command                    |
| `cookies`                   | Forward cookies to the local RPC task when cookie forwarding is enabled   |
| `webRequest`                | Capture request headers and `Content-Disposition` filename metadata       |
| `http://*/*`, `https://*/*` | Match download origins for cookie and request metadata access             |

The extension does not use remote code and does not include analytics or telemetry.

## Acknowledgements

This project references the product direction and documentation structure of [AnInsomniacy/motrix-next-extension](https://github.com/AnInsomniacy/motrix-next-extension), which is licensed under the MIT License.

```text
MIT License
Copyright (c) 2026 AnInsomniac
```

This repository's README and privacy policy are written for the current Motrix Extension implementation. If substantial code or assets from the referenced project are copied, modified, or redistributed, keep the corresponding MIT copyright notice and license text.

## Privacy

See [PRIVACY_POLICY.md](PRIVACY_POLICY.md).
