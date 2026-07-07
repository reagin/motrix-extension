# Privacy Policy — Motrix Extension

**Last updated:** July 7, 2026

## Overview

Motrix Extension ("the Extension") is a Chrome extension that can intercept browser downloads and delegate them to a local Motrix or aria2-compatible JSON-RPC service. This policy explains what data the Extension can access, how that data is used, and how it is protected.

## Data Collection

**The Extension does not collect, sell, share, or transmit personal data to the developer or to any third-party service.**

The Extension is designed to operate locally. Its runtime network communication is intended for the local RPC endpoint configured by the user, such as `http://127.0.0.1:16800/jsonrpc`.

## Data Access

The Extension accesses the following data only to provide its download delegation features.

### Download Metadata

When a browser download is created, the Extension may read:

- **Download URL** — used to submit the task to the local Motrix/aria2 RPC endpoint.
- **Final URL** — used when Chrome provides a resolved download URL.
- **Filename** — used for diagnostics and as the aria2 output filename.
- **File size** — used for filtering and duplicate detection.
- **HTTP Referer** — used when available so the local downloader can reproduce the browser request.

This metadata is used transiently for routing the download task. Diagnostic events are stored locally in `chrome.storage.local`.

### Request Context

When request header forwarding is enabled, the Extension reads a small allowlist of request headers for HTTP and HTTPS requests:

- `Accept`
- `Accept-Language`
- `Authorization`
- `Cookie`
- `Referer`
- `User-Agent`

This helps the local downloader handle downloads that depend on browser request context. Request header forwarding can be disabled in Options.

### Cookies

When cookie forwarding is enabled, the Extension may read cookies for the download URL's domain and pass them to the local Motrix/aria2 RPC task. This supports authenticated downloads from sites that require an active browser login.

Cookies are not sent to the developer, analytics services, advertising networks, or remote third-party APIs by this Extension. Cookie forwarding can be disabled in Options.

### Local Storage

The Extension stores the following data in `chrome.storage.local`:

- RPC connection settings, including host, port, path, secret token, and timeout.
- Download behavior settings, including interception switches, forwarding options, size limits, extension filters, default directory, and auto-launch preference.
- Site rules configured by the user.
- UI preferences, including language, theme, density, and motion setting.
- Diagnostic events for troubleshooting.

This data remains in the user's browser unless the user clears it, restores defaults, or uninstalls the Extension.

## Network Communication

The Extension is intended to make runtime network requests only to the local Motrix/aria2 RPC endpoint configured by the user, for example:

- `http://127.0.0.1:16800/jsonrpc`
- `http://localhost:16800/jsonrpc`

The Extension can also open `motrix://` URLs to wake Motrix or create a new task through the desktop app's custom protocol handler.

The Extension does not include analytics, telemetry, advertising, or tracking integrations.

## Permissions Explained

| Permission | Why It Is Needed |
| --- | --- |
| `downloads` | Detect, cancel, and erase browser downloads that are delegated to Motrix |
| `storage` | Store settings, site rules, UI preferences, and diagnostic events locally |
| `contextMenus` | Add "Download with Motrix" to the right-click menu |
| `cookies` | Read cookies for the download domain when cookie forwarding is enabled |
| `webRequest` | Read allowlisted request headers and response filename metadata |
| `http://*/*`, `https://*/*` | Match possible download origins for cookie and request metadata access |

## Data Retention

- **Download metadata** is used during download routing and is not stored as a separate long-term record.
- **Request context and filename metadata** are held in short-lived in-memory stores during interception.
- **User settings** remain in local browser storage until changed, reset, cleared, or removed by uninstalling the Extension.
- **Diagnostic events** are stored locally with a fixed maximum size and older entries are overwritten.

## Third-Party Services

The Extension does not integrate with third-party analytics, telemetry, advertising, or tracking services.

## Children's Privacy

The Extension is not directed to children and does not knowingly collect personal information from children.

## Changes to This Policy

If this policy changes, this file will be updated with a new "Last updated" date. Continued use of the Extension after changes means the updated policy applies.

## Open Source

The Extension is open source under the MIT License. The source code can be inspected in this repository.

## Contact

For privacy-related questions or concerns, open an issue in this repository.
