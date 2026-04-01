---
title: Headless Rendering
---

Render `@Preview` composables to PNG using Compose Desktop (Skia) — no emulator, no device, no Android SDK required. Works on any Compose project without modifying build files.

**Timing reference:** cold start ~10–15 s, hot render ~1–3 s, cache hit ~50 ms.

---

### `cp_render`

> Render a single `@Preview` function to a PNG and return the image to the AI.

**What to ask your AI:**
- "render HomeScreenPreview"
- "show me what the LoginCard looks like"
- "render DarkThemePreview at 360×640"

**Parameters**

| Name | Type | Required | Default | Description |
|------|------|----------|---------|-------------|
| preview_name | string | Yes | — | Name of the `@Preview`-annotated function to render |
| project_path | string | Yes | — | Path to the root of the target project |
| width | int | No | 400 | Canvas width in dp |
| height | int | No | 800 | Canvas height in dp |
| theme | string | No | — | Force `light` or `dark` theme; omit to use the preview's own setting |
| module | string | No | auto-detect | Gradle module that contains the preview (e.g. `:feature:home`) |

**Tips**
- The first render of a session triggers daemon startup — expect 10–15 s. Subsequent renders of the same preview are served from cache in ~50 ms.
- If the preview name is ambiguous across modules, pass `module` explicitly.
- Use `theme: dark` to quickly verify dark-mode appearance without creating a separate preview function.

---

### `cp_list_previews`

> Discover all `@Preview`-annotated functions in the project via fast source scanning.

**What to ask your AI:**
- "what previews exist in this project?"
- "show all screen previews"
- "find previews matching 'Profile'"

**Parameters**

| Name | Type | Required | Default | Description |
|------|------|----------|---------|-------------|
| project_path | string | Yes | — | Path to the root of the target project |
| module | string | No | — | Restrict search to a specific Gradle module |
| file | string | No | — | Restrict search to a single `.kt` file — much faster than a full project scan |
| name_pattern | string | No | — | Case-insensitive substring filter on the preview function name |

**Tips**
- Passing `file` makes discovery nearly instant — use it when you already know which screen you are working on.
- Results include the file path, line number, and any `name`/`group` parameters declared on the `@Preview` annotation.

---

### `cp_verify_render`

> Render a preview and run one or more checks (render success, golden comparison, accessibility) in a single call.

**What to ask your AI:**
- "verify HomeScreenPreview"
- "does LoginCard still match the golden?"
- "check accessibility of OnboardingPreview"

**Parameters**

| Name | Type | Required | Default | Description |
|------|------|----------|---------|-------------|
| preview_name | string | Yes | — | Preview function to render and check |
| project_path | string | Yes | — | Path to the target project |
| checks | array[enum] | No | `[render_success, golden]` | One or more of: `render_success`, `golden`, `accessibility` |
| tolerance | int | No | 0 | Pixel-difference tolerance for golden comparison (0 = exact match) |
| module | string | No | auto-detect | Gradle module containing the preview |

**Tips**
- Including `accessibility` in `checks` runs WCAG 2.1 touch-target and content-description validation without an extra tool call.
- Set `tolerance` to a small value (e.g. `2`) to ignore sub-pixel anti-aliasing differences across machines.

---

### `cp_render_batch`

> Render or verify multiple previews in one call — useful for regression checks and CI-style sweeps.

**What to ask your AI:**
- "render all previews in the :feature:home module"
- "check for regressions across every screen"
- "record goldens for the entire project"

**Parameters**

| Name | Type | Required | Default | Description |
|------|------|----------|---------|-------------|
| project_path | string | Yes | — | Path to the root of the target project |
| previews | array[string] | No | all | Explicit list of preview names; omit to run all discovered previews |
| module | string | No | — | Restrict to a specific Gradle module |
| group | string | No | — | Restrict to previews whose `@Preview(group = ...)` matches |
| mode | enum | No | render | One of: `render`, `verify`, `record` |
| limit | int | No | 10 | Maximum previews to process; set to `0` to process all |
| include_images | bool | No | false | Return rendered PNGs in the response (can be large) |

**Tips**
- Start with `limit: 10` to confirm the daemon is healthy before running the full suite.
- Use `mode: record` to establish a fresh golden baseline after intentional design changes.
- `mode: verify` with `include_images: false` is the fastest CI-suitable invocation — only failures return images.

---

### `cp_diff`

> Compare a rendered preview against its golden baseline and return a diff image highlighting changed pixels.

**What to ask your AI:**
- "save this render as the new golden"
- "did anything change since the last baseline?"
- "accept the new design for CartSummaryPreview"

**Parameters**

| Name | Type | Required | Default | Description |
|------|------|----------|---------|-------------|
| preview_name | string | Yes | — | Preview function to compare |
| project_path | string | Yes | — | Path to the target project |
| golden_path | string | No | — | Explicit path to a golden PNG; bypasses mode-based lookup |
| mode | enum | No | verify | One of: `verify` (compare), `record` (save current as golden), `update` (overwrite existing golden) |
| tolerance | int | No | 0 | Pixel-difference tolerance |

**Tips**
- Use `mode: record` on first run to create the baseline, then `mode: verify` on every subsequent render.
- `mode: update` is identical to `record` but only succeeds when a golden already exists — a useful guard against accidentally creating new goldens in CI.
- The diff image uses a red highlight on changed pixels against a dimmed original, making regressions immediately visible to the AI.
