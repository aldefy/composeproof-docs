---
title: Prompt Cookbook
description: What to say to your AI assistant to trigger the right ComposeProof tools. Map your intent to tools, instantly.
---

You don't call ComposeProof tools directly — your AI does. This page maps the natural-language phrases you type into the right MCP tools. Scan the category that matches your intent and copy the prompt style that fits.

:::tip[Start every session here]
Open a new project? Say **"what does this project look like?"** — it triggers `cp_insights` followed by `cp_get_context scope=full`, giving your AI a complete picture before it touches any code.
:::

---

## Discovery & Orientation

Get your bearings before doing anything else.

| What to ask | Tools triggered |
|---|---|
| "what previews exist?" | `cp_list_previews` |
| "show me all screens" | `cp_list_previews` |
| "learn the codebase" | `cp_insights` → `cp_get_context scope=full` |
| "what does this app do?" | `cp_insights` → `cp_get_context scope=full` |
| "is the app running?" | `cp_preflight` |
| "is a device connected?" | `cp_preflight` |
| "show project structure" | `cp_get_context scope=structure` |
| "what Compose patterns does this project use?" | `cp_get_context scope=patterns` |
| "architecture overview" | `cp_get_context scope=structure` |

:::tip[Pro tip]
`cp_insights` returns a narrative overview of your project — Compose version, detected screen count, architecture pattern, and recommended next steps. Let your AI read it before issuing any render or test commands.
:::

---

## Rendering

Render `@Preview` functions headlessly — no device, no emulator.

| What to ask | Tools triggered |
|---|---|
| "render the HomeScreenPreview" | `cp_render` |
| "show me what the login screen looks like" | `cp_render` (AI finds the right preview name) |
| "render in dark theme" | `cp_render theme=dark` |
| "render in light theme" | `cp_render theme=light` |
| "render at 200dp wide" | `cp_render width=200` |
| "render all previews" | `cp_render_batch` |
| "render all screens in dark mode" | `cp_render_batch theme=dark` |

:::tip[After rendering, ask]
"Does this look right?" or "Is there anything off about this UI?" — your AI will analyze the screenshot and flag layout issues, clipped content, missing padding, or contrast problems.
:::

**Typical rendering session:**

```
You: "what previews exist?"
AI:  calls cp_list_previews → lists 12 preview functions

You: "render LoginScreenPreview"
AI:  calls cp_render → returns screenshot

You: "render it in dark theme too"
AI:  calls cp_render theme=dark → returns dark screenshot

You: "does the dark version look right?"
AI:  analyzes both screenshots, flags issues
```

---

## Golden Management

Catch visual regressions before they ship. The golden workflow is: **record → change → verify → update**.

| What to ask | Tools triggered |
|---|---|
| "save baselines for all screens" | `cp_render_batch mode=record` |
| "record this as golden" | `cp_diff mode=record` |
| "did anything change?" | `cp_diff mode=verify` |
| "check for regressions" | `cp_render_batch mode=verify` |
| "accept the new design" | `cp_diff mode=update` |
| "update the baseline" | `cp_diff mode=update` |
| "show me what changed" | `cp_diff mode=verify` (AI interprets diff image) |

**The 4-step golden workflow:**

```
Step 1 — Record baselines (once, before any changes):
  You: "save baselines for all screens"
  AI:  calls cp_render_batch mode=record → saves golden PNGs

Step 2 — Make your UI changes in code

Step 3 — Verify:
  You: "did anything change?"
  AI:  calls cp_render_batch mode=verify
  AI:  "3 previews changed: LoginScreen (padding), HomeScreen (font), ProfileCard (PASS)"

Step 4 — Accept or reject:
  You: "the LoginScreen change is intentional, accept it"
  AI:  calls cp_diff mode=update for LoginScreen only
```

:::caution[Golden files are per-machine by default]
Commit your `.composeproof/goldens/` directory to version control so the whole team shares baselines. CI then catches regressions automatically — see the [CI/CD guide](/guides/ci-cd/).
:::

---

## Device Testing

Build, install, and interact with a real device or emulator.

### Build & Deploy

| What to ask | Tools triggered |
|---|---|
| "build and install" | `cp_build_and_deploy` |
| "deploy to device" | `cp_build_and_deploy` |
| "build the staging variant" | `cp_build_and_deploy variant=staging` |
| "build release APK" | `cp_build_and_deploy variant=release` |

### Screenshots

| What to ask | Tools triggered |
|---|---|
| "take a screenshot" | `cp_take_device_screenshot` |
| "what's on screen right now?" | `cp_take_device_screenshot` |
| "capture the current state" | `cp_take_device_screenshot` |

### Interactions

| What to ask | Tools triggered |
|---|---|
| "tap Login" | `cp_device_interact action=tap_element` |
| "tap the submit button" | `cp_device_interact action=tap_element` |
| "type test@email.com" | `cp_device_interact action=text` |
| "enter password 'hunter2'" | `cp_device_interact action=text` |
| "scroll down" | `cp_device_interact action=scroll` |
| "swipe left" | `cp_device_interact action=swipe` |
| "go back" | `cp_device_interact action=back` |
| "press home" | `cp_device_interact action=home` |
| "wait for 'Success' to appear" | `cp_device_interact action=wait_for` |
| "wait until the loading spinner is gone" | `cp_device_interact action=wait_for` |

:::tip[Chain interactions naturally]
Describe a full user journey and let the AI chain the calls:

```
"Go to the profile screen: tap the nav bar Profile icon,
 then scroll to the bottom, then take a screenshot."
```

The AI calls `cp_device_interact` three times in sequence, takes the screenshot, and analyzes the result — all from one prompt.
:::

---

## Debugging

Diagnose performance and runtime issues without leaving your AI conversation.

### Performance

| What to ask | Tools triggered |
|---|---|
| "why is this screen slow?" | `cp_get_recomposition_stats` |
| "check recomposition counts" | `cp_track_recompositions` |
| "is LazyColumn performing well?" | `cp_profile_lazy_list` |
| "analyze parameter stability" | `cp_analyze_stability` |

### Network & Storage

| What to ask | Tools triggered |
|---|---|
| "show network traffic" | `cp_get_network_logs` |
| "what API calls were made?" | `cp_inspect_network_logs` |
| "what SharedPreferences are set?" | `cp_inspect_shared_preferences` |
| "what feature flags are active?" | `cp_get_feature_flags` |

### Navigation & UI

| What to ask | Tools triggered |
|---|---|
| "current navigation state?" | `cp_inspect_navigation_graph` |
| "what's the current back stack?" | `cp_inspect_navigation_graph` |
| "show UI tree" | `cp_inspect_ui_tree` |
| "describe the current screen layout" | `cp_inspect_ui_tree` |

**The 5-step debugging workflow:**

```
Step 1 — Check what's on screen:
  "show me the UI tree"
  AI: calls cp_inspect_ui_tree

Step 2 — Spot the performance culprit:
  "check recomposition counts"
  AI: calls cp_get_recomposition_stats
  AI: "UserCard recomposed 47 times in 2s — likely unstable lambda"

Step 3 — Dig into stability:
  "analyze parameter stability for UserCard"
  AI: calls cp_analyze_stability
  AI: "onCLick lambda is unstable — wrap in rememberUpdatedState"

Step 4 — Fix and re-verify:
  Apply fix, then: "check recomposition counts again"
  AI: "UserCard now recomposes 2 times — fixed"

Step 5 — Render to confirm visually:
  "render UserCardPreview"
  AI: calls cp_render → screenshot
```

---

## State Inspection

Deep runtime inspection of live Compose state. Requires the embedded agent.

:::note[Setup required]
State inspection tools require the `composeproof-agent` library in your app's debug build:

```kotlin
debugImplementation("dev.composeproof:composeproof-agent:$version")
```

See [Embedded Agent setup](/getting-started/embedded-agent/) for details.
:::

| What to ask | Tools triggered |
|---|---|
| "what's the ViewModel state?" | `cp_inspect_viewmodel_state` |
| "show active coroutines" | `cp_inspect_coroutine_state` |
| "simulate process death" | `cp_simulate_process_death` |
| "which permissions are granted?" | `cp_inspect_permissions` |
| "what screen am I on?" | `cp_inspect_current_screen` |
| "Activity lifecycle state?" | `cp_inspect_process_lifecycle` |
| "what's in DataStore?" | `cp_inspect_datastore` |
| "fire deep link myapp://profile/123" | `cp_execute_deeplink` |
| "find all buttons on screen" | `cp_semantic_ui_query Role(Button)` |
| "find element with test tag 'submit'" | `cp_semantic_ui_query TestTag("submit")` |
| "profile the LazyColumn scroll" | `cp_profile_lazy_list` |
| "read the remembered state in ProductCard" | `cp_inspect_compose_state` |

:::tip[Combine inspection with interaction]
```
"Tap Login, then show me the HomeViewModel state"
```
The AI calls `cp_device_interact` to tap, then `cp_inspect_viewmodel_state` — giving you before/after state in one prompt.
:::

---

## Testing & Mocking

Generate edge cases and intercept real API calls with mock responses.

### Edge-Case Testing

| What to ask | Tools triggered |
|---|---|
| "generate edge cases for this composable" | `cp_generate_edge_cases` |
| "what visual states should I test for UserCard?" | `cp_generate_edge_cases` |
| "find tricky inputs for the form screen" | `cp_generate_edge_cases` |

**Edge-case workflow:**

```
Step 1 — Generate cases:
  "generate edge cases for ProductCard"
  AI: calls cp_generate_edge_cases
  AI: "Suggested: empty title, 200-char title, $0 price, null image, loading state, error state"

Step 2 — Render each:
  "render ProductCard with an empty title"
  AI: calls cp_render with the generated parameters

Step 3 — Spot failures:
  AI: "empty title causes the card to collapse — 0dp height"

Step 4 — Fix and re-render:
  Apply fix → "render ProductCard with empty title again"
  AI: confirms fix
```

### Mock API

Intercept real API calls without touching your code.

| What to ask | Tools triggered |
|---|---|
| "mock the API returning a 500 error" | `cp_mock_api` |
| "mock an empty list response" | `cp_mock_api` |
| "mock a slow API (3 second delay)" | `cp_mock_api fixedDelayMilliseconds=3000` |
| "mock login as always failing" | `cp_mock_api` |
| "return a specific JSON body for /api/users" | `cp_mock_api` |
| "stop the mock" | `cp_mock_api action=stop` |

**Mock API workflow:**

```
Step 1 — Set up the mock:
  "mock GET /api/products to return an empty list"
  AI: calls cp_mock_api → proxy intercepts traffic

Step 2 — Interact with the app:
  "navigate to the Products screen"
  AI: calls cp_device_interact

Step 3 — Take a screenshot:
  "take a screenshot"
  AI: calls cp_take_device_screenshot

Step 4 — Analyze empty state:
  AI: "Empty state shows 'No products found' — layout looks correct"

Step 5 — Clean up:
  "stop the mock"
  AI: calls cp_mock_api action=stop → real traffic resumes
```

:::tip[Test error handling]
The easiest way to test your error UI is:
```
"mock the login API to return 401, then tap Login, then screenshot"
```
Three intents, one prompt — the AI handles all three calls in sequence.
:::

---

## Expert Analysis

Six built-in expert prompts that guide your AI through structured analysis workflows.

| What to ask | Prompt triggered | What it does |
|---|---|---|
| "check accessibility" / "a11y audit" | `accessibility-checker` | Audits contrast, content descriptions, touch targets, semantic roles |
| "review this UI" | `ui-reviewer` | Holistic UX and visual design review with actionable feedback |
| "performance issues?" / "Compose perf audit" | `compose-performance` | Recomposition analysis, stability audit, layout measurement review |
| "structure shared code for KMP" | `kmp-architect` | Guides expect/actual splits, platform module boundaries, Ktor setup |
| "write screenshot tests" | `screenshot-test-writer` | Generates Roborazzi or Paparazzi test files from your previews |
| "verify against spec" | `spec-verifier` | Maps spec assertions to renders, reports PASS/FAIL per assertion |

:::tip[Combine prompts with tools]
Expert prompts work best when your AI has fresh screenshots to analyze:

```
"render all previews in dark theme, then run an accessibility audit"
```

The AI renders first (giving it visual data), then runs the `accessibility-checker` prompt against each screenshot.
:::

---

## CI/QA Workflow

Full spec verification pipeline for pull requests and nightly runs.

| What to ask | Tools triggered |
|---|---|
| "verify this PR against the spec" | `cp_list_previews` → `cp_render_batch` → `cp_verify_render` |
| "generate an HTML report" | `cp_generate_report` |
| "full spec verification" | `spec-verifier` prompt chain |
| "regression check before merge" | `cp_render_batch mode=verify` → `cp_generate_report` |

**Full CI workflow:**

```
Step 1 — List all previews:
  AI: calls cp_list_previews
  AI: "Found 23 previews across 8 screens"

Step 2 — Render everything:
  AI: calls cp_render_batch
  AI: "23/23 rendered successfully"

Step 3 — Golden verification:
  AI: calls cp_render_batch mode=verify
  AI: "21 PASS, 2 FAIL: LoginScreen (padding delta), CheckoutCard (NEW — no golden)"

Step 4 — Spec verification (if spec file present):
  AI: uses spec-verifier prompt
  AI: "11/12 assertions pass. FAIL: primary button must be #0057FF (rendered #0055FF)"

Step 5 — Generate report:
  AI: calls cp_generate_report
  AI: "Report saved to .composeproof/reports/2024-01-15.html"
```

:::tip[Automate in CI]
Add a `.composeproof/spec.md` file to your repo. On every PR, tell your AI:
```
"run a full spec verification and generate the report"
```
The AI reads the spec, renders all previews, verifies each assertion, and produces an HTML report — no human QA needed for visual regressions.

See the [CI/CD guide](/guides/ci-cd/) for GitHub Actions setup.
:::

---

## Quick Reference

### Most-used prompts

```
"what does this project look like?"          → orientation
"what previews exist?"                       → discovery
"render [ScreenName]Preview"                 → render
"did anything change?"                       → regression check
"build and install"                          → deploy
"take a screenshot"                          → capture
"tap [element name]"                         → interact
"check recomposition counts"                 → perf debug
"mock the API returning [error/response]"    → test error states
"check accessibility"                        → a11y audit
"generate edge cases for [Composable]"       → test generation
"generate an HTML report"                    → summarize session
```

### Tool → phrase mapping (reverse lookup)

| Tool | Natural-language trigger |
|---|---|
| `cp_insights` | "learn the codebase", "project overview" |
| `cp_get_context` | "show structure", "Compose patterns", "full context" |
| `cp_preflight` | "is the app running?", "check device" |
| `cp_list_previews` | "what previews exist?", "show all screens" |
| `cp_render` | "render [X]", "show me [X]" |
| `cp_render_batch` | "render all", "batch render" |
| `cp_diff` | "did anything change?", "compare to golden" |
| `cp_verify_render` | "verify against spec", "does this match?" |
| `cp_build_and_deploy` | "build and install", "deploy" |
| `cp_take_device_screenshot` | "take a screenshot", "what's on screen?" |
| `cp_device_interact` | "tap", "type", "scroll", "go back", "wait for" |
| `cp_inspect_ui_tree` | "show UI tree", "describe the layout" |
| `cp_get_recomposition_stats` | "why is this slow?", "recomposition counts" |
| `cp_track_recompositions` | "track recompositions", "watch recompose" |
| `cp_analyze_stability` | "analyze stability", "unstable parameters?" |
| `cp_get_network_logs` | "show network traffic", "API calls made?" |
| `cp_inspect_navigation_graph` | "navigation state", "back stack?" |
| `cp_inspect_viewmodel_state` | "ViewModel state?", "current state of X" |
| `cp_inspect_coroutine_state` | "active coroutines", "what's running?" |
| `cp_simulate_process_death` | "simulate process death", "test state restore" |
| `cp_inspect_permissions` | "which permissions granted?" |
| `cp_inspect_current_screen` | "what screen am I on?" |
| `cp_inspect_datastore` | "what's in DataStore?" |
| `cp_execute_deeplink` | "fire deep link", "navigate via deep link" |
| `cp_semantic_ui_query` | "find all buttons", "find element with tag X" |
| `cp_profile_lazy_list` | "profile LazyColumn", "lazy list performance" |
| `cp_inspect_compose_state` | "read remembered state", "Compose state value" |
| `cp_generate_edge_cases` | "edge cases for X", "what should I test?" |
| `cp_mock_api` | "mock the API", "simulate error response" |
| `cp_generate_report` | "generate report", "summarize session" |
