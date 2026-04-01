---
title: Introduction
---

# ComposeProof

**ComposeProof is an MCP server that gives AI coding assistants eyes on Compose UI.** It provides headless rendering, embedded runtime inspection, golden management, spec-driven verification, device interaction, and expert analysis prompts.

Works with **Claude Code**, **Gemini CLI**, **Cursor**, **Android Studio Agent Mode** — anything that speaks MCP.

## What it does

```
You: "verify my login screen against this spec"
AI:  reads spec, maps assertions to @Preview functions
AI:  calls verify → render + golden check + accessibility
AI:  "PASS (3/3) — rendered 1.8s, 99.8% golden match, 0 a11y warnings"
```

At scale:

```
AI:  calls render_batch mode='verify'
AI:  "50 previews: 45 PASS, 3 FAIL, 2 NEW"
AI:  drills into failures, suggests fixes, re-verifies
```

No device. No emulator. The AI IS the test engine — ComposeProof gives it eyes.

## Key capabilities

- **44 MCP tools** across headless rendering, device interaction, runtime inspection, testing, and mocking
- **6 expert prompts** for accessibility, performance, KMP architecture, UI review, test generation, and spec verification
- **Zero-install** — works on any Compose project without build file changes
- **Headless rendering** via Compose Desktop (Skia) — no device, no emulator needed
- **Golden management** — record, verify, and update visual baselines
- **Embedded agent** — runtime inspection of Compose state, navigation, coroutines, ViewModel, and more
- **Mock API server** — intercept real API calls with mock responses, no code changes
- **Edge-case generation** — analyze composable parameters and suggest visual test cases
- **HTML reports** — self-contained reports with screenshots, spec assertions, and context graph

## Who it's for

- **Android/Compose developers** using AI coding assistants (Claude Code, Gemini CLI, Cursor) who want the AI to see and verify UI output
- **Teams** wanting automated visual regression testing in CI/CD pipelines
- **Solo developers** who need QA automation without hiring QA

## How it works (30 seconds)

1. Install: `npx composeproof`
2. Open your AI assistant in any Compose project
3. Ask: "render my HomeScreen preview"
4. ComposeProof renders it headlessly via Skia, the AI sees the screenshot
5. Ask: "does it match the spec?" — the AI verifies and reports back

No device. No emulator. No build file changes. The AI closes the feedback loop.

## What's inside

| Category | Tools | Examples |
|----------|-------|---------|
| Context & Orientation | 4 | `insights`, `get_context`, `configure_context`, `generate_report` |
| Headless Rendering | 6 | `render`, `list_previews`, `verify`, `render_batch`, `diff` |
| Device Interaction | 5 | `preflight`, `build_and_deploy`, `device_interact`, `take_screenshot` |
| Device Inspection | 5 | `inspect_ui_tree`, `get_network_logs`, `get_recomposition_stats` |
| Embedded Agent — Runtime | 7 | `inspect_permissions`, `inspect_navigation_graph`, `simulate_process_death` |
| Embedded Agent — Compose | 9 | `semantic_ui_query`, `inspect_compose_state`, `track_recompositions` |
| Testing & Mocking | 2 | `generate_edge_cases`, `mock_api` |
| Expert Prompts | 6 | `accessibility-checker`, `compose-performance`, `ui-reviewer` |

## Next steps

- [Installation](/getting-started/installation/) — get ComposeProof running in 2 minutes
- [Prompt Cookbook](/prompt-cookbook/) — learn what to say to your AI to trigger the right tools
- [How It Works](/concepts/how-it-works/) — understand the architecture
