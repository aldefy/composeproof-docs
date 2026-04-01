---
title: Device Inspection
---

Inspect the live state of a running app — UI hierarchy, network traffic, recomposition counts, proxy settings, and feature flags — without touching the source code.

---

### `cp_inspect_ui_tree`

> Dump the current UI accessibility hierarchy from the connected device.

**What to ask your AI:**
- "show me the UI tree"
- "dump the view hierarchy"
- "find all clickable elements on screen"

**Parameters**

| Name | Type | Required | Default | Description |
|------|------|----------|---------|-------------|
| device_id | string | No | auto-select | ADB device serial |
| filter_resource_id | string | No | — | Only include nodes whose resource ID contains this substring |
| filter_text | string | No | — | Only include nodes whose visible text contains this substring |
| filter_class | string | No | — | Only include nodes whose class name contains this substring |
| max_depth | int | No | — | Truncate the tree at this depth level |
| compose_only | bool | No | false | When `true`, exclude native View nodes and return only Compose semantics nodes |
| format | enum | No | tree | Output format: `tree` (indented), `flat` (one node per line), `summary` (counts only), or `json` |

**Tips**
- Use `compose_only: true` to cut through Android system UI noise when debugging a pure Compose screen.
- `format: summary` gives a quick node count without flooding the context window — useful for a sanity check before requesting the full tree.
- Combine `filter_text` with `format: flat` to locate a specific button or label instantly.

---

### `cp_get_network_logs`

> Capture HTTP traffic emitted by the app via logcat for a given duration.

**What to ask your AI:**
- "show network traffic for the last 10 seconds"
- "what API calls happened during login?"
- "capture HTTP requests while I scroll the feed"

**Parameters**

| Name | Type | Required | Default | Description |
|------|------|----------|---------|-------------|
| duration_seconds | int | No | 10 | How long to listen to logcat (seconds) |
| package | string | No | — | Filter to a specific app package; omit to capture all packages |
| device_id | string | No | auto-select | ADB device serial |

**Tips**
- Logcat-based capture requires the app to log HTTP traffic (e.g. via OkHttp logging interceptor). Use `cp_inspect_network_logs` (Embedded Compose page) for in-process capture without a logging interceptor.
- Keep `duration_seconds` short (5–10 s) and trigger the action you want to observe immediately after calling this tool.

---

### `cp_get_recomposition_stats`

> Analyse Compose recomposition activity to surface hot composables and unnecessary re-renders.

**What to ask your AI:**
- "why is this screen slow?"
- "check for unnecessary recompositions"
- "show recomposition counts while I scroll"

**Parameters**

| Name | Type | Required | Default | Description |
|------|------|----------|---------|-------------|
| project_path | string | No | — | Path to the target project (used to locate compiler metrics) |
| mode | enum | No | auto | One of: `compiler_metrics` (build-time stability report), `logcat` (runtime counts), `perfetto` (trace), `auto` (picks best available) |
| package | string | No | — | App package to filter logcat output |
| device_id | string | No | auto-select | ADB device serial |
| module | string | No | — | Gradle module for `compiler_metrics` mode |
| duration_seconds | int | No | 10 | Duration for `logcat` and `perfetto` modes |

**Tips**
- `mode: auto` first checks for Compose compiler metrics in the build output; if absent it falls back to logcat.
- `mode: compiler_metrics` requires a build with `-Pcomposeproof.compilerMetrics=true` or the equivalent Compose compiler flag `freeCompilerArgs += ["-P", "plugin:androidx.compose.compiler.plugins.kotlin:metricsDestination=..."]`.
- High skip counts are good; high restart counts on leaf composables usually indicate a stability problem — follow up with `cp_analyze_stability`.

---

### `cp_manage_proxy`

> Get, set, or clear the HTTP proxy on the device — useful for routing traffic through Charles Proxy, mitmproxy, or Proxyman.

**What to ask your AI:**
- "set up Charles Proxy on the device"
- "what proxy is currently configured?"
- "clear the proxy setting"

**Parameters**

| Name | Type | Required | Default | Description |
|------|------|----------|---------|-------------|
| action | enum | No | get | One of: `set`, `get`, `clear` |
| host | string | No (Yes for `set`) | — | Proxy host (e.g. `192.168.1.5`) |
| port | int | No (Yes for `set`) | — | Proxy port (e.g. `8888`) |
| device_id | string | No | auto-select | ADB device serial |

**Tips**
- After setting a proxy, remember to clear it when done — a stale proxy setting will break all network requests if your proxy tool is no longer running.
- For HTTPS inspection you still need to install the proxy's root certificate on the device separately (Settings → Security → Install CA certificate).

---

### `cp_get_feature_flags`

> List, read, or write SharedPreferences entries on the device — handy for toggling feature flags without rebuilding.

**What to ask your AI:**
- "what SharedPreferences files exist?"
- "read the dark_mode flag"
- "enable the new_checkout_flow flag"

**Parameters**

| Name | Type | Required | Default | Description |
|------|------|----------|---------|-------------|
| action | enum | No | list_files | One of: `list_files`, `read`, `write` |
| package | string | Yes | — | App package name (e.g. `com.example.app`) |
| prefs_name | string | No (Yes for `read`/`write`) | — | SharedPreferences file name without `.xml` extension |
| key | string | No (Yes for `write`) | — | Preference key to read or write |
| value | string | No (Yes for `write`) | — | Value to write (cast to the existing type automatically) |
| device_id | string | No | auto-select | ADB device serial |

**Tips**
- Start with `action: list_files` to discover which preference files exist before attempting a read.
- Changes take effect immediately if the app reads preferences dynamically; some flags require an app restart.
- For DataStore preferences use `cp_inspect_datastore` (Embedded Runtime page) instead.
