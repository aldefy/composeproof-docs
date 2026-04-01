---
title: Expert Prompts
---

MCP-registered prompts that inject expert-level domain knowledge directly into the AI's context. Unlike tools, prompts are invoked by name rather than by function call — ask your AI to "use the `<prompt-name>` prompt" or simply phrase your request naturally and the AI will select the right prompt.

---

### `accessibility-checker`

> Conduct a WCAG 2.1 accessibility audit of the current screen or a specific composable.

**What to ask your AI:**
- "check accessibility of this screen"
- "run an a11y audit"
- "are the touch targets large enough?"

**Arguments**

| Name | Values | Description |
|------|--------|-------------|
| focus | `touch-targets` / `contrast` / `screen-reader` / `all` | Scope the audit to a specific concern or run all checks |

**What it covers**
- **Touch targets** — flags interactive elements smaller than 48 × 48 dp
- **Contrast** — checks text and icon contrast ratios against the 4.5:1 WCAG AA minimum
- **Content descriptions** — identifies `Image` and `Icon` composables missing `contentDescription`
- **Screen reader order** — verifies that the semantics traversal order matches the visual reading order

**Tips**
- Pair with `cp_verify_render checks=[accessibility]` to run accessibility checks as part of your golden verification workflow.
- Use `focus: touch-targets` first — it is the most common issue and the fastest to fix.

---

### `compose-performance`

> Analyse the current screen or codebase for Compose performance anti-patterns and recomposition traps.

**What to ask your AI:**
- "are there any performance issues?"
- "find recomposition traps"
- "check for unnecessary allocations in composables"

**Arguments**

None.

**What it covers**
- **Stability rules** — classes that should be annotated `@Stable` or `@Immutable`
- **Recomposition traps** — inline lambdas creating new object instances, `List<T>` parameters instead of `ImmutableList`, state reads in the wrong scope
- **Unkeyed lazy lists** — `LazyColumn` items missing `key` parameter, causing full re-composition on data updates
- **Layout performance** — deep nesting that could trigger multiple measure passes
- **Image performance** — oversized bitmaps loaded without a `size` constraint

**Tips**
- Follow up with `cp_track_recompositions` to measure the real-world impact of issues the prompt identifies.
- The prompt outputs a prioritised fix list — address high-frequency leaf composables before higher-level screens.

---

### `kmp-architect`

> Guide the AI through Kotlin Multiplatform architecture decisions for your project.

**What to ask your AI:**
- "help me structure the shared KMP code"
- "how should I split the data layer across platforms?"
- "architecture review for KMP"

**Arguments**

None.

**What it covers**
- **Module structure** — recommended split between `:shared`, `:shared:data`, `:shared:domain`, and platform-specific modules
- **expect/actual** — when to use `expect`/`actual` vs. dependency injection for platform differences
- **Compose Multiplatform UI** — sharing UI across Android, iOS, Desktop, and Web targets
- **Data layer** — Ktor for networking, SQLDelight for local persistence, DataStore for preferences
- **Platform boundaries** — which APIs must stay platform-specific (camera, biometrics, push notifications)
- **Testing** — `commonTest` strategies, `runTest`, and platform-specific test runners

**Tips**
- Run this prompt before making structural decisions — it is much cheaper to reorganise modules early than to refactor a monolithic `:shared` module later.
- Combine with `cp_get_context scope=structure` so the AI applies recommendations to your actual project layout rather than generic advice.

---

### `ui-reviewer`

> Perform a visual quality review of the current screen against a design system or general Material 3 guidelines.

**What to ask your AI:**
- "review this UI"
- "visual quality check against our design system"
- "does this screen follow Material 3?"

**Arguments**

| Name | Values | Description |
|------|--------|-------------|
| design_system | `material3` / `custom` / free-text description | The design system to validate against |

**What it covers**
- **Layout** — padding consistency, alignment, spacing scale adherence
- **Typography** — correct use of type scale roles (`headlineLarge`, `bodyMedium`, etc.)
- **Color and theming** — use of semantic color tokens vs. hardcoded values; dark-mode compatibility
- **Component patterns** — correct usage of Material 3 components (cards, FABs, navigation bars)
- **Visual hierarchy** — whether the primary action is visually prominent relative to secondary actions

**Tips**
- Pass a screenshot via `cp_render` or `cp_take_device_screenshot` before invoking this prompt so the AI has a visual reference alongside the source code.
- For custom design systems, pass a brief description (e.g. `"custom: uses 8dp spacing grid, IBM Plex Sans, brand blue #0F62FE"`) instead of `custom`.

---

### `screenshot-test-writer`

> Generate a complete, ready-to-run screenshot test class for a composable or screen.

**What to ask your AI:**
- "write screenshot tests for HomeScreen"
- "generate Paparazzi tests for ProfileCard"
- "create a ComposeProof test suite for the onboarding flow"

**Arguments**

| Name | Values | Description |
|------|--------|-------------|
| framework | `paparazzi` / `roborazzi` / `composeproof` | The screenshot testing framework to target |

**What it covers**
- A complete test class with `@RunWith`, setup/teardown, and one test method per `@Preview` annotation found on the target composable
- Correct framework-specific APIs (`Paparazzi.snapshot()`, `captureRoboImage()`, `cp_diff mode=record`)
- Multi-theme and multi-device test variants where the framework supports them
- Import statements and Gradle dependency snippets

**Tips**
- The generated class uses the same preview function names that `cp_list_previews` discovers — run that first so the AI knows which previews to cover.
- `framework: composeproof` generates tests that call `cp_render_batch mode=record` on first run and `mode=verify` on subsequent runs — no additional test runner configuration required.

---

### `spec-verifier`

> Run a structured four-step workflow to verify that the current UI implementation matches a written specification.

**What to ask your AI:**
- "verify the UI against this spec"
- "does the checkout screen match the design doc?"
- "check the implementation against the Figma notes"

**Arguments**

| Name | Values | Description |
|------|--------|-------------|
| spec_source | `markdown` / `jira` / `figma` / `pr` / `inline` | Where the specification comes from |

**Workflow steps**

1. **Parse assertions** — extract testable UI assertions from the spec source (e.g. "button label must be 'Confirm Order'", "error state shows red banner")
2. **Discover previews** — call `cp_list_previews` to find the relevant `@Preview` functions
3. **Verify** — render each preview and check each assertion visually and via the semantics tree
4. **Report** — produce a pass/fail summary with annotated screenshots for any failures

**Tips**
- `spec_source: inline` lets you paste the spec directly in your message — useful for quick ad-hoc checks without a linked document.
- `spec_source: pr` instructs the AI to read the PR description as the spec — good for pre-merge visual reviews.
- Failures include a diff image and the exact assertion that failed, making it straightforward to file a bug or request a design update.
