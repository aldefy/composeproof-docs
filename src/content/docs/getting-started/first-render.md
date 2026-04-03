---
title: First Render
---

## Prerequisites

- ComposeProof installed (`composeproof --version` returns `ComposeProof v1.2.0`)
- A Compose project with at least one `@Preview`-annotated function
- An MCP-enabled AI client configured (Claude Code, Gemini CLI, or Cursor)

No device. No emulator. No Gradle plugin.

---

## Step 1: Open your AI assistant in the project directory

ComposeProof's MCP server reads project context from the working directory. Open your AI client with the project root as the working directory.

For Claude Code:

```bash
cd /path/to/your/compose/project
claude
```

---

## Step 2: Discover previews

Ask your AI assistant:

```
what previews exist in this project?
```

The AI calls `cp_list_previews`. It scans your source files for `@Preview`-annotated functions using a fast regex pass — no compilation needed.

Example output:

```
Found 12 previews:

ui/screens/HomeScreen.kt:45  HomeScreenPreview
ui/screens/LoginScreen.kt:88  LoginScreenPreview
ui/screens/LoginScreen.kt:102  LoginScreenDarkPreview
ui/components/Button.kt:23  PrimaryButtonPreview
ui/components/Button.kt:31  DisabledButtonPreview
...
```

Each entry shows the file path, line number, and function name.

---

## Step 3: Render a preview

Ask your AI assistant:

```
render HomeScreenPreview
```

The AI calls `cp_render`. Watch the timing:

- **First render**: ~10–15 seconds. ComposeProof uses Gradle Tooling API to resolve your project's classpath, then compiles and renders using its own Compose Desktop stack.
- **Hot render** (same session, modified file): ~1–3 seconds. The daemon has a warm classloader.
- **Cache hit** (unchanged file): ~50ms. No recompilation.

The AI receives the rendered PNG and shows it inline. You can now ask questions about it:

```
does the layout look correct?
what's the padding between the header and the content?
is there anything that looks like an accessibility issue?
```

---

## Step 4: Try variations

### Dark theme

```
render HomeScreenPreview in dark mode
```

### Specific width

```
render HomeScreenPreview at 360dp width
```

### Render all previews at once

```
render all previews
```

The AI calls `cp_render_batch`. All previews render in parallel. Results come back as a batch with pass/fail status if goldens exist, or raw screenshots if this is the first run.

### Save a golden

```
record golden for HomeScreenPreview
```

The AI calls `cp_diff mode=record`. The current render is saved as the baseline in `.composeproof/goldens/`. Future renders are diffed against it.

---

## What just happened

When you rendered `HomeScreenPreview`, ComposeProof ran through three tiers of its zero-install architecture:

**Tier 1 (what you just used)**

1. Gradle Tooling API connected to your project and read the build graph — no `./gradlew` invocation, no build file changes
2. ComposeProof resolved your module's full runtime classpath (your app code + all dependencies)
3. Your `@Preview` function was compiled in an isolated classloader
4. Compose Desktop (Skia) rendered the composable into a PNG on the JVM — no Android SDK, no emulator
5. The PNG was returned to your AI client

The whole thing runs in a long-lived daemon process. The first render pays the cold-start cost; subsequent renders reuse the warm classloader.

**Tier 2 (sidecar)** kicks in automatically for faster repeated renders: a `.composeproof/` module is auto-created (gitignored) that links to your app module and the renderer.

**Tier 3 (Gradle plugin)** is optional — use it for CI golden verification with `./gradlew composeproofVerify`.

---

## Troubleshooting

**"No previews found"** — Make sure your functions are annotated with `@Preview` (not `@PreviewParameterProvider` or custom annotations). The scanner looks for the literal string `@Preview`.

**"Classpath resolution failed"** — Run `./gradlew :app:dependencies` manually to verify the project builds. ComposeProof can only resolve what Gradle can build.

**"Render failed: missing class"** — Your preview may use Android-specific APIs (`Context`, `Activity`, `AndroidView`) that Compose Desktop can't render. These require the Paparazzi backend (Phase 2).

---

## Next steps

- [First Device Session](/getting-started/first-device-session/) — interact with a running app on a physical device
- [Golden Management](/concepts/golden-management/) — understand record, verify, and update workflows
- [Prompt Cookbook](/prompt-cookbook/) — copy-paste prompts for common rendering tasks
