---
title: How It Works
description: The feedback loop architecture behind ComposeProof — headless rendering, device interaction, and embedded agent working together.
---

# How It Works

## The Feedback Loop Problem

Traditional Compose development has a slow feedback loop when working with AI coding assistants.

```
Traditional cycle (2–5 minutes per iteration):

You write code
   → describe UI in text to AI
   → AI suggests changes
   → you build (30–90s)
   → run on device/emulator
   → screenshot manually
   → paste into chat
   → AI suggests more changes
   → repeat
```

The bottleneck is that AI assistants are blind. They write code by reasoning about text — they can't see what the UI actually looks like until you manually capture and share a screenshot. This turns a conversation into a slow back-and-forth with a 2–5 minute cycle per iteration.

ComposeProof closes this loop:

```
ComposeProof cycle (seconds per iteration):

You describe the UI goal
   → AI calls cp_render
   → ComposeProof renders headlessly via Skia
   → AI sees screenshot in the same tool call
   → AI identifies issues, edits code
   → AI calls cp_render again
   → converges in 2–3 iterations
```

The AI stops guessing and starts verifying.

---

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                         AI Client                               │
│          (Claude Code, Gemini CLI, Cursor, etc.)                │
└───────────────────────────┬─────────────────────────────────────┘
                            │  MCP (JSON-RPC 2.0 over STDIO)
                            ▼
┌─────────────────────────────────────────────────────────────────┐
│                      MCP Server                                 │
│                    (composeproof)                               │
│                                                                 │
│   ┌───────────────┐  ┌──────────────┐  ┌──────────────────┐   │
│   │   Layer 1     │  │   Layer 2    │  │    Layer 3       │   │
│   │   Headless    │  │   Device     │  │   Embedded       │   │
│   │   Renderer    │  │   ADB        │  │   Agent          │   │
│   │               │  │              │  │                  │   │
│   │ Compose Skia  │  │ uiautomator  │  │  in-app SDK      │   │
│   │ No device     │  │ Real device  │  │  Local HTTP      │   │
│   │ @Preview      │  │ or emulator  │  │  Runtime state   │   │
│   └───────────────┘  └──────────────┘  └──────────────────┘   │
└─────────────────────────────────────────────────────────────────┘
```

Each layer adds capabilities. They are independent — you can use Layer 1 alone, or combine all three depending on what you need.

---

## Layer 1: Headless Rendering

The primary layer. No device, no emulator, no build changes required.

**How it works:**

1. ComposeProof scans your project's source files for `@Preview` functions using regex + Kotlin AST parsing. This happens without compilation — results appear in milliseconds.
2. The Gradle Tooling API resolves your project's classpath externally. ComposeProof transforms Android AARs to JARs, builds a full classpath, and loads your code into an isolated JVM.
3. A long-running render daemon (persistent JVM process) executes your `@Preview` function using the Compose Desktop (Skia) backend. It writes pixels to an in-memory bitmap and exports PNG.
4. The PNG is returned to the AI client as a tool result. The AI sees the screenshot inline, in the same response as the tool call.

**Performance:**
- Cold start (first render, JVM boot + classpath load): 10–15 seconds
- Hot render (daemon warm, classpath cached): 1–3 seconds
- Cache hit (same composable, no source changes): ~50ms

**Relevant tools:** `cp_render`, `cp_list_previews`, `cp_render_batch`, `cp_diff`, `cp_verify_render`

**Limitation:** Cannot render composables that depend on `LocalContext.current`, Android `Activity`, Android resources, or `AndroidView`. These require Layer 2 (device screenshot) or the Paparazzi fallback.

---

## Layer 2: Device Interaction (ADB)

For when you need a real or emulated Android device.

ComposeProof wraps ADB into MCP tools. Every interaction automatically captures a screenshot after completion — the AI sees the result of every tap, swipe, and type without an extra tool call.

**What Layer 2 provides:**

- **Build and install** — triggers Gradle builds and deploys to connected device (`cp_build_and_deploy`)
- **Screenshots** — full-resolution device screenshots, correctly handled as two-step file pull to avoid binary stream corruption on macOS (`cp_take_device_screenshot`)
- **Gestures** — tap, swipe, long press, scroll, key press via uiautomator (`cp_device_interact`)
- **Text input** — type into focused fields, clear fields, submit forms
- **UI hierarchy** — full XML dump of the view tree + Compose semantics tree (`cp_inspect_ui_tree`)
- **Network logs** — captured HTTP traffic, request/response pairs (`cp_get_network_logs`)
- **SharedPreferences** — read and write app preferences without code changes (`cp_inspect_shared_preferences`)
- **Proxy management** — configure network proxy for traffic inspection or mocking (`cp_manage_proxy`)

**Auto-screenshot behavior:** After every `cp_device_interact` call, ComposeProof captures a screenshot and includes it in the response. The AI sees the updated screen state without needing a separate `cp_take_device_screenshot` call.

**Relevant tools:** `cp_preflight`, `cp_build_and_deploy`, `cp_device_interact`, `cp_take_device_screenshot`, `cp_inspect_ui_tree`, `cp_get_network_logs`, `cp_inspect_shared_preferences`, `cp_manage_proxy`

---

## Layer 3: Embedded Agent

The deepest layer. Requires adding the agent SDK to your app (debug builds only).

```kotlin
debugImplementation("dev.composeproof:composeproof-agent:1.2.0")
```

The agent SDK runs a local HTTP server inside your app process. ComposeProof's MCP server connects to it over ADB reverse TCP tunnel. This gives the AI direct access to live runtime state that ADB alone cannot reach.

**What Layer 3 provides:**

- **Compose state** — read `State<*>` and `MutableState<*>` values from any composable, including nested values and derived state
- **ViewModel state** — read `StateFlow`, `LiveData`, and `UiState` values from ViewModels by class name
- **Navigation** — full navigation graph, current back stack, argument values, pending deep links
- **Coroutines** — list active coroutines, their dispatcher, state (Active/Suspended/Cancelling), and parent job hierarchy
- **Process death simulation** — triggers real `am kill` (not just background + restore), captures state before and after, highlights data that survived vs. was lost
- **Semantic UI queries** — find composables by `Text` content, `testTag`, `Role`, or `ContentDescription` without navigating the full view tree
- **LazyList profiling** — measure scroll performance, item recomposition counts, out-of-window composition counts
- **Stability analysis** — identify unstable composables causing unnecessary recompositions, class-level stability reports
- **Recomposition tracking** — live recomposition counts per composable, identify hot spots

**Communication:** The agent binds to a random port (default: 8078) inside the app process. `adb reverse tcp:8078 tcp:8078` forwards it to localhost. The MCP server calls the local HTTP endpoint. All communication stays on-device — no network egress.

**Relevant tools:** `cp_pair_companion`, `cp_inspect_compose_state`, `cp_inspect_viewmodel_state`, `cp_inspect_navigation_graph`, `cp_inspect_coroutine_state`, `cp_simulate_process_death`, `cp_semantic_ui_query`, `cp_profile_lazy_list`, `cp_analyze_stability`, `cp_track_recompositions`

---

## MCP Protocol

ComposeProof is a standard MCP server. It speaks JSON-RPC 2.0 over STDIO — the same transport used by all MCP-compatible AI clients.

```json
// Example: AI calls cp_render
{
  "jsonrpc": "2.0",
  "id": 1,
  "method": "tools/call",
  "params": {
    "name": "cp_render",
    "arguments": {
      "preview": "HomeScreenPreview",
      "width": 400,
      "height": 800,
      "theme": "dark"
    }
  }
}

// ComposeProof responds with image content
{
  "jsonrpc": "2.0",
  "id": 1,
  "result": {
    "content": [
      {
        "type": "image",
        "data": "<base64-encoded PNG>",
        "mimeType": "image/png"
      },
      {
        "type": "text",
        "text": "Rendered HomeScreenPreview (400x800, dark theme) in 1.2s"
      }
    ]
  }
}
```

Any client that implements the MCP specification works with ComposeProof: Claude Code, Gemini CLI, Cursor, Continue.dev, or your own custom client.

**MCP instructions field:** ComposeProof includes an `instructions` field in its MCP server manifest. This gives behavioral guidance to the AI client — telling it which tool to call for which intent, how to interpret results, and how to chain tools for common workflows. This is how the AI knows to call `cp_preflight` before `cp_build_and_deploy`, or to call `cp_insights` before exploring an unfamiliar project.

---

## Putting It Together

A typical session combines all three layers:

```
1. cp_insights          → AI learns the project structure
2. cp_list_previews     → AI discovers all @Preview functions
3. cp_render            → AI renders and sees the UI (Layer 1)
4. [AI edits code]
5. cp_render            → AI verifies the fix (Layer 1)
6. cp_build_and_deploy  → AI installs on device (Layer 2)
7. cp_device_interact   → AI taps through the flow (Layer 2)
8. cp_inspect_compose_state → AI reads live state (Layer 3)
9. cp_generate_report   → AI produces HTML report with all screenshots
```

Each layer adds fidelity. Layer 1 is fast iteration. Layer 2 is real-world behavior. Layer 3 is runtime truth.
