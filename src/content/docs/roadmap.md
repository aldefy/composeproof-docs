---
title: Roadmap
description: What's shipped, what's in progress, and what's coming next for ComposeProof.
---

ComposeProof ships in waves. Each wave is a coherent capability layer — you can use everything in a shipped wave today.

---

## Shipped

### Wave 1 — Headless Rendering & Verification

The foundation: render any `@Preview` function without a device, compare against goldens, and understand your project structure.

| Tool | Description |
|------|-------------|
| `cp_render` | Render a single `@Preview` headlessly via Compose Desktop / Skia |
| `cp_list_previews` | Discover all `@Preview` functions in the project via source scanning |
| `cp_verify_render` | Assert visual properties against a spec (colors, spacing, typography) |
| `cp_render_batch` | Render all previews at once; `mode=record` saves goldens, `mode=verify` checks against them |
| `cp_diff` | Pixel-level comparison between two renders or a render and a golden |
| `cp_insights` | Project overview — architecture, screen count, detected patterns, suggested next steps |

---

### Wave 2 — Device Inspection & Interaction

Connect to a running app on a physical device or emulator. Inspect runtime state, interact with the UI, and capture what's actually happening.

| Tool | Description |
|------|-------------|
| `cp_preflight` | Verify device connection, app status, and MCP server health |
| `cp_inspect_ui_tree` | Full semantic UI tree with bounds, roles, and content descriptions |
| `cp_device_interact` | Tap, type, swipe, scroll, and navigate via ADB |
| `cp_take_device_screenshot` | Capture the current screen (two-step file pull — no binary stream corruption) |
| `cp_build_and_deploy` | Build the app and install it to the connected device |
| `cp_get_build_status` | Check the status of an in-progress build |
| `cp_get_recomposition_stats` | Read recomposition counts from the running app |
| `cp_get_network_logs` | Capture HTTP traffic via the ADB proxy |
| `cp_manage_proxy` | Start, stop, and configure the ADB network proxy |
| `cp_get_feature_flags` | Read the current state of all feature flags in the app |

---

### Wave 3 — Embedded Agent Runtime

Deeper runtime introspection via the `composeproof-agent` library in your debug build. Access state that lives inside the JVM process — ViewModels, coroutines, navigation, DataStore, permissions.

| Tool | Description |
|------|-------------|
| `cp_inspect_permissions` | List granted, denied, and permanently-denied runtime permissions |
| `cp_inspect_process_lifecycle` | Current process/activity/fragment lifecycle state |
| `cp_inspect_navigation_graph` | Full NavGraph structure, current destination, and back stack |
| `cp_inspect_datastore` | Read DataStore Proto and Preferences keys |
| `cp_inspect_coroutine_state` | Active coroutines, their states, and stack traces |
| `cp_execute_deeplink` | Navigate directly to any screen via deep link URI |
| `cp_simulate_process_death` | Kill and relaunch the app to test state restoration |

---

### Wave 4 — AI Skills & Session Learning

Purpose-built prompts, license gating, and the npm installer that makes ComposeProof zero-config for any project.

- **npm installer** — `npx composeproof` installs and starts the MCP server. Works on any Compose project with no build file changes.
- **`compose-ui-workflow` skill** — A reusable MCP skill that guides AI assistants through a structured render → inspect → verify → fix loop.
- **MCP `instructions` field** — Remote instructions delivered to the AI assistant at session start. Keeps AI behavior consistent without updating the JAR.
- **6 expert prompts** — `spec-verifier`, `accessibility-checker`, `golden-recorder`, `regression-hunter`, `performance-profiler`, `design-token-auditor`. Invoke via your AI client.
- **License gating** — Free tier (render, list, diff, preflight) and Pro tier (embedded agent, batch, insights, stability analysis). License validated at session start.

---

### Wave 5 — Edge-Case Testing & API Mocking

Generate edge cases automatically, intercept and mock network traffic at the ADB proxy level, and test composable behavior under unexpected inputs.

| Tool | Description |
|------|-------------|
| `cp_generate_edge_cases` | Analyze a composable's parameters and generate edge-case preview variants (empty strings, RTL, large fonts, long text, null optionals) |
| `cp_mock_api` | Intercept HTTP requests at the ADB proxy and return fixture responses |

Additional capabilities in this wave:
- **Composable type analysis** — detects parameter types and generates semantically appropriate edge cases (not just random values)
- **WireMock integration** — persistent mock server for multi-request flows, stateful sequences, and network error simulation
- **ADB proxy routing** — all app traffic routed through the proxy; selective interception by URL pattern, method, or status code
- **Stale proxy safety** — proxy state is checked and cleaned up at session start via `cp_preflight`; leftover proxy from a crashed session never blocks traffic

---

## Planned

### Wave 6 — Multiplatform & CI

Extend rendering to Compose Multiplatform targets and integrate ComposeProof into standard CI workflows as a first-class tool.

- **CMP rendering** — Render iOS, Desktop, and Web/Wasm `@Preview` functions using the same Skia-based renderer. Same tool calls, same golden format, all targets.
- **Gradle plugin** — Optional `id("dev.composeproof")` adds `composeproofRecord`, `composeproofVerify`, `composeproofRender`, `composeproofReport`, and `composeproofList` tasks directly to your build graph.
- **GitHub Action** — `aldefy/composeproof-action` wraps the full CI workflow (install → record/verify → report → PR comment) in a single action step.
- **HTML reports** — Self-contained HTML reports with diff overlays, accessibility annotations, and context graph. No server required.
- **SSE transport** — Server-Sent Events transport for MCP, in addition to STDIO. Enables web-based clients and browser-based AI assistants.
- **Sample CMP app** — Reference project demonstrating ComposeProof on an Android + iOS + Desktop + Web target.

---

## Future

These capabilities are on the horizon. No committed timeline, but all are architecturally compatible with the current design.

| Capability | Description |
|------------|-------------|
| Paparazzi renderer fallback | Use Paparazzi (Android layoutlib) for composables that require `Context`, `Activity`, or Android resources — cases where Compose Desktop / Skia cannot render |
| Roborazzi renderer | Robolectric-based rendering for composables with deep Android framework dependencies |
| Google Screenshot Testing backend | Plug ComposeProof's preview discovery and diff engine into the Google Screenshot Testing for Compose library |
| Figma plugin | Publish golden images directly from Figma frames into `.composeproof/goldens/` — closes the design → golden → verify loop without manual export |
| IntelliJ / Android Studio plugin | Inline rendering and golden comparison inside the IDE. Click a `@Preview` annotation to render, diff, or record — without leaving the editor |
| Memory leak detection | Integrate LeakCanary signals into the agent runtime; surface leak traces in `cp_insights` and `cp_generate_report` |
| Startup profiling | Measure cold start, warm start, and time-to-first-frame; compare across branches; flag regressions in CI |

---

:::note[Suggest a feature]
File an issue or start a discussion at [github.com/aldefy/composeproof](https://github.com/aldefy/composeproof). Roadmap priorities are shaped by how teams are actually using ComposeProof in production.
:::
