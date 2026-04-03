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

---

### `compose-skill`

> Source-backed Compose best practices from actual `androidx` framework source code. 13 topic guides covering state, modifiers, side effects, lists, navigation, animation, theming, performance, accessibility, and deprecated pattern migration.

**What to ask your AI:**
- "best practices for Compose state management"
- "how should I use modifiers correctly?"
- "what's the right way to handle side effects?"

**Arguments**

| Name | Values | Description |
|------|--------|-------------|
| topic | `state` / `modifiers` / `side-effects` / `lists` / `navigation` / `animation` / `theming` / `performance` / `accessibility` / `composition-locals` / `deprecated` / `styles-api` / `all` | Specific topic to look up |

**What it covers**
- **State** — `remember` vs `rememberSaveable`, `derivedStateOf`, `collectAsStateWithLifecycle`, state hoisting
- **Modifiers** — ordering rules (outside-in), click area vs padding, size constraints
- **Side effects** — `LaunchedEffect` keys, `DisposableEffect` cleanup, `rememberCoroutineScope` for callbacks
- **Lists** — keys, `contentType`, stable item types, `derivedStateOf` for filtering
- **Navigation** — pass IDs not objects, `launchSingleTop`, deep links
- **Animation** — `graphicsLayer` for performance, API selection guide
- **Theming** — semantic tokens, dynamic color, dark theme testing
- **Performance** — stability, skipping, deferred reads, lambda stability
- **Accessibility** — 48dp touch targets, semantics, Roles, focus management
- **Deprecated** — accompanist migration paths with exact replacement code

**Tips**
- Based on [compose-skill](https://github.com/aldefy/compose-skill) — 13 guides + 2.3MB of actual `androidx` source code analysis.
- Ask for a specific topic (e.g. `topic: state`) for focused guidance, or `topic: all` for an overview.

---

### `rebound-basics`

> Guide to using Compose Rebound for recomposition budget monitoring — setup, budget classes, annotations, and violation interpretation.

**What to ask your AI:**
- "how do I set up Rebound?"
- "what budget class should my composable use?"
- "what does this Rebound violation mean?"

**Arguments**

None.

**What it covers**
- **Setup** — one-line Gradle plugin addition
- **Budget classes** — SCREEN (3/s), CONTAINER (10/s), INTERACTIVE (30/s), LIST_ITEM (60/s), ANIMATED (120/s), LEAF (5/s)
- **Dynamic scaling** — budgets multiply during scrolling (2x), animation (1.5x), user input (1.5x)
- **`@ReboundBudget` annotation** — manual budget class override for composables the heuristic misclassifies
- **CLI tools** — `snapshot`, `summary`, `watch`, `ping`
- **Violation interpretation** — what violations mean and common root causes

**Tips**
- Based on [compose-rebound](https://github.com/aldefy/compose-rebound) — a Kotlin compiler plugin for recomposition budget monitoring.
- Pair with `cp_get_recomposition_stats` or `cp_track_recompositions` for data-backed diagnosis.

---

## Pro Prompts

The following prompts require a ComposeProof Pro license. They add an intelligence layer on top of the free tools and prompts — combining multiple data sources for deeper analysis.

---

### `stability-doctor` (Pro)

> Deep stability diagnosis combining Rebound budget data with framework knowledge. Traces unstable parameters to root cause and prescribes source-backed fixes.

**What to ask your AI:**
- "why is my HomeScreen recomposing so much?"
- "diagnose the stability issues in this screen"
- "which parameters are causing recompositions?"

**What it does**
1. **Gathers evidence** — uses `cp_analyze_stability`, `cp_track_recompositions`, `cp_inspect_compose_state`
2. **Identifies the pattern** — unstable parameter, unstable lambda, state read too high, missing key, rapid state updates
3. **Prescribes fix** — before/after code with root cause explanation
4. **Verifies** — confirms recomposition rate dropped below budget after fix

---

### `rebound-advisor` (Pro)

> Interprets Rebound budget violations with severity triage and context-aware, actionable fixes.

**What to ask your AI:**
- "triage my Rebound violations"
- "which budget violations should I fix first?"
- "is this violation a false positive?"

**What it does**
1. **Collects metrics** via ComposeProof tools
2. **Classifies each violation** — checks if budget class is correct, if violation is contextual (scrolling/animation), identifies the recomposition driver
3. **Triages by severity** — Critical (>10x budget), High (>5x), Medium (>2x), Low, False positive
4. **Prescribes targeted fix** matched to the violation type and composable class

---

### `migration-assistant` (Pro)

> Source-backed migration from deprecated Compose patterns to modern replacements. Scans codebase, counts occurrences, and provides exact before/after code.

**What to ask your AI:**
- "migrate from accompanist to built-in APIs"
- "find deprecated Compose patterns in my project"
- "replace SwipeRefresh with PullToRefreshBox"

**What it does**
1. **Scans** — uses `cp_semantic_search` to find deprecated imports and API usage
2. **Maps** — matches each deprecated pattern to its modern replacement (accompanist-systemuicontroller → `enableEdgeToEdge()`, accompanist-pager → Foundation `HorizontalPager`, etc.)
3. **Generates migration plan** — files affected, risk level, migration order
4. **Verifies** — suggests `cp_render_batch` to confirm no visual regressions after migration
