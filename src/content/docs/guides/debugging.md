---
title: Debugging Workflows
description: Five end-to-end debugging workflows — visual bugs, performance issues, state bugs, network/API problems, and cross-repo mismatches — all driven from your AI assistant.
---

ComposeProof gives your AI assistant a full toolkit for diagnosing Compose bugs at every layer: visual output, runtime state, performance counters, network traffic, and inter-process behavior. These five workflows cover the most common debugging scenarios.

:::tip[Start every debugging session here]
Before diving into any workflow, run:

```
"run preflight checks"
```

`cp_preflight` confirms the device is connected, the app is installed and running, and the MCP server is healthy. It catches 80% of "nothing works" issues in 5 seconds.
:::

---

## Workflow 1 — Visual bug

Use when: a screen looks wrong — layout broken, text clipped, wrong color, missing element.

```
Step 1 — Capture what's on screen:
  "take a screenshot"
  AI: calls cp_take_device_screenshot → returns current screen state

Step 2 — Inspect the UI tree:
  "show me the UI tree"
  AI: calls cp_inspect_ui_tree → returns full semantic tree with bounds and roles

Step 3 — Render headlessly for comparison:
  "render LoginScreenPreview"
  AI: calls cp_render → returns Skia-rendered screenshot (no device state)

Step 4 — Compare to golden:
  "compare to golden"
  AI: calls cp_diff mode=verify → highlights pixel-level delta

Step 5 — Fix and re-render:
  Apply code fix, then:
  "render LoginScreenPreview"
  AI: calls cp_render → confirms fix visually
```

The combination of device screenshot + headless render + UI tree is powerful: the device shows the bug in context, the headless render shows what the composable should look like in isolation, and the UI tree shows the exact bounds and attributes causing the issue.

---

## Workflow 2 — Performance (recomposition / scroll)

Use when: a screen is janky, scroll stutters, or animations drop frames.

```
Step 1 — Get recomposition stats:
  "check recomposition counts"
  AI: calls cp_get_recomposition_stats
  AI: "UserCard: 47 recompositions in 2s — likely unstable parameter"

Step 2 — Track live recompositions:
  "watch recompositions on the feed screen for 5 seconds"
  AI: calls cp_track_recompositions duration=5000
  AI: "FeedItem recomposed on every scroll frame — skipped count: 0"

Step 3 — Analyze stability:
  "analyze parameter stability for UserCard"
  AI: calls cp_analyze_stability
  AI: "onClick lambda is unstable — not wrapped in rememberUpdatedState or remember"

Step 4 — Profile lazy list:
  "profile the LazyColumn scroll"
  AI: calls cp_profile_lazy_list
  AI: "avg frame: 22ms, max: 67ms, 3 janky frames in 60-frame window"

Step 5 — Fix and verify:
  Apply fix (wrap lambda in remember), then:
  "check recomposition counts again"
  AI: "UserCard: 2 recompositions — fixed"

Step 6 — Visual confirmation:
  "render UserCardPreview"
  AI: calls cp_render → confirms no visual regression from the fix
```

:::tip[Stability is the most common perf root cause]
When `cp_get_recomposition_stats` shows a composable recomposing far more than expected, `cp_analyze_stability` almost always finds the cause: an unstable lambda, a non-`@Stable` data class, or a `List<T>` parameter (use `ImmutableList` instead).
:::

---

## Workflow 3 — State bug (process death / ViewModel)

Use when: state is lost on navigation, screen rotates and data disappears, or `SavedStateHandle` isn't restoring correctly.

```
Step 1 — Inspect current ViewModel state:
  "what's the HomeViewModel state?"
  AI: calls cp_inspect_viewmodel_state
  AI: "HomeViewModel { uiState=Success(items=12), selectedId=null }"

Step 2 — Simulate process death:
  "simulate process death"
  AI: calls cp_simulate_process_death → kills process, relaunches app

Step 3 — Compare state after restore:
  "what's the HomeViewModel state now?"
  AI: calls cp_inspect_viewmodel_state
  AI: "HomeViewModel { uiState=Loading, selectedId=null }"
  AI: "uiState reverted to Loading — not persisted through process death"

Step 4 — Fix:
  Add SavedStateHandle persistence or DataStore write on state change.

Step 5 — Verify:
  "simulate process death again"
  AI: kills and relaunches
  "what's the state?"
  AI: "HomeViewModel { uiState=Success(items=12) } — restored correctly"
```

:::note[Requires embedded agent]
`cp_inspect_viewmodel_state` and `cp_simulate_process_death` require `composeproof-agent` in your debug build. See [Embedded Agent setup](/getting-started/embedded-agent/).
:::

---

## Workflow 4 — Network / API issue

Use when: data isn't loading, wrong data is shown, or you suspect an API call is failing silently.

```
Step 1 — Capture network traffic:
  "show network traffic"
  AI: calls cp_get_network_logs
  AI: "GET /api/feed → 200 (1.2s), POST /api/track → 401"

Step 2 — Inspect SharedPreferences for auth state:
  "what's in SharedPreferences?"
  AI: calls cp_inspect_shared_preferences
  AI: "auth_token=eyJ..., token_expiry=1705123200 (expired 3 days ago)"

Step 3 — Mock the API with a valid response:
  "mock GET /api/feed to return the fixture in fixtures/feed.json"
  AI: calls cp_mock_api → proxy intercepts traffic

Step 4 — Take a screenshot to verify behavior:
  "navigate to the feed and take a screenshot"
  AI: calls cp_device_interact (navigate) → cp_take_device_screenshot

Step 5 — Identify the real issue:
  AI: "Screen renders correctly with mock — confirms the 401 on /api/track
       is clearing the auth token on next launch"

Step 6 — Stop the mock and fix:
  "stop the mock"
  AI: calls cp_mock_api action=stop → real traffic resumes
  Fix token refresh logic, verify with real API.
```

The network log + SharedPreferences combination is the fastest way to diagnose auth bugs — you can see exactly what token was sent and whether it was valid.

---

## Workflow 5 — Cross-repo / backend mismatch

Use when: the app screen looks wrong and you suspect the backend is returning unexpected data (wrong field name, missing field, schema change).

```
Step 1 — Capture network traffic on the broken screen:
  "navigate to ProfileScreen and show network traffic"
  AI: calls cp_device_interact → cp_get_network_logs
  AI: "GET /api/profile → 200 but response body logged"

Step 2 — Read the backend contract:
  Ask your AI to read the backend source:
  "read the ProfileResponse data class in the backend repo"
  AI: reads ~/projects/backend/src/.../ProfileResponse.kt

Step 3 — Mock the expected backend response:
  "mock GET /api/profile to return this JSON: { displayName: '...', avatarUrl: '...' }"
  AI: calls cp_mock_api with the correct schema

Step 4 — Screenshot to verify:
  "take a screenshot"
  AI: calls cp_take_device_screenshot

Step 5 — Identify the mismatch:
  AI: "With the correct schema, ProfileScreen renders correctly.
       Live API is returning 'display_name' (snake_case) but the app
       expects 'displayName' (camelCase) — serialization mismatch."
```

This workflow is particularly useful when the app and backend are in different repos. The AI reads both codebases in the same session, compares the contracts, and isolates the mismatch without requiring a backend deployment.

---

## General tips

**Start with `cp_preflight`** — it catches environment issues (device not connected, app not running, proxy not started) before you spend time in any of the above workflows.

**Use `cp_insights` first on an unfamiliar codebase** — it gives the AI a project overview (architecture, screen count, detected patterns) so its subsequent tool calls are targeted, not exploratory.

**Chain naturally in one prompt** — don't issue one tool at a time. Describe your goal and let the AI chain the calls:

```
"simulate process death, then check the HomeViewModel state and compare to before"
```

The AI calls `cp_inspect_viewmodel_state` to capture before-state, then `cp_simulate_process_death`, then `cp_inspect_viewmodel_state` again — giving you a before/after comparison automatically.

**Let the AI drive** — ComposeProof's MCP instructions guide the AI on which tools to use in sequence. Describe the symptom ("the feed screen looks wrong after scrolling") rather than the tool ("call cp_get_recomposition_stats"). The AI will pick the right starting point.
