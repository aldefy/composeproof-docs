---
title: Embedded Agent — Compose Intelligence
---

Live Compose introspection from inside the running process — semantics queries, state snapshots, recomposition tracking, stability analysis, and more.

:::note[Dependency required]
Add `debugImplementation("dev.composeproof:composeproof-agent:1.1.0")` to your app module's `build.gradle.kts` to enable these tools.
:::

---

### `cp_semantic_ui_query`

> Query the Compose semantics tree using a structured selector to find one or more nodes.

**What to ask your AI:**
- "find all buttons on screen"
- "find the element with test tag 'submit'"
- "is there a node with content description 'Close'?"

**Parameters**

| Name | Type | Required | Default | Description |
|------|------|----------|---------|-------------|
| selector | string | Yes | — | Selector expression: `Text("Login")`, `TestTag("submit")`, `Role(Button)`, `ContentDescription("Close")`, or `*` for all nodes |
| device_id | string | No | auto-select | ADB device serial |

**Tips**
- Use `*` to dump every semantics node — helpful when you don't yet know the exact labels or tags in use.
- `Role(Button)` finds all tappable elements regardless of their visual appearance — useful for accessibility audits.
- Results include the node's bounding box, so you can follow up with a coordinate-based `cp_device_interact` tap if needed.

---

### `cp_inspect_compose_state`

> Snapshot all `remember`-ed and `State<T>` values currently held in the composition.

**What to ask your AI:**
- "what's the remembered state right now?"
- "show me the state in CheckoutScreen"
- "inspect compose state"

**Parameters**

| Name | Type | Required | Default | Description |
|------|------|----------|---------|-------------|
| composable | string | No | — | Optional substring filter on composable function name |
| device_id | string | No | auto-select | ADB device serial |

**Tips**
- Filter by `composable` to narrow output to a single screen — unfiltered output on a complex app can be very large.
- State values are returned with their Kotlin type, making it easy to spot unexpected nulls or incorrect defaults.

---

### `cp_track_recompositions`

> Count recompositions per composable over a fixed duration and return a ranked list of the hottest nodes.

**What to ask your AI:**
- "track recompositions for 10 seconds while I scroll"
- "which composable recomposes the most?"
- "measure recomposition counts during the animation"

**Parameters**

| Name | Type | Required | Default | Description |
|------|------|----------|---------|-------------|
| duration_ms | int | No | 5000 | Tracking window in milliseconds (maximum 30,000) |
| device_id | string | No | auto-select | ADB device serial |

**Tips**
- Trigger the interaction you want to profile (scroll, animation, typing) immediately after calling this tool — results are captured during the `duration_ms` window.
- A composable recomposing more than once per frame for non-animated content is a red flag; follow up with `cp_analyze_stability`.

---

### `cp_analyze_stability`

> Run a Compose compiler stability analysis on the project and cross-reference with live recomposition data to identify unstable parameters causing unnecessary recompositions.

**What to ask your AI:**
- "analyze the stability of HomeScreen"
- "why does ProfileCard recompose so often?"
- "find unstable composable parameters"

**Parameters**

| Name | Type | Required | Default | Description |
|------|------|----------|---------|-------------|
| project_path | string | No | `.` | Path to the root of the target project |
| module | string | No | — | Gradle module to analyse; omit for all modules |
| composable | string | No | — | Filter to a specific composable function name |
| device_id | string | No | auto-select | ADB device serial |

**Tips**
- The tool combines static compiler metrics (from `build/compose_metrics/`) with live runtime data — run a build with compiler metrics enabled first for the richest output.
- Common fixes flagged by this tool: wrapping lambda parameters in `remember`, adding `@Stable` or `@Immutable` to data classes, and replacing `List<T>` with `ImmutableList<T>`.

---

### `cp_profile_lazy_list`

> Profile a LazyColumn or LazyRow — measure item composition time, prefetch hits/misses, and scroll jank frames.

**What to ask your AI:**
- "profile the LazyColumn performance"
- "is the feed scrolling smoothly?"
- "check for scroll jank"

**Parameters**

| Name | Type | Required | Default | Description |
|------|------|----------|---------|-------------|
| device_id | string | No | auto-select | ADB device serial |

**Tips**
- Scroll the list at a natural pace during profiling — the tool hooks into Compose's frame timing and captures one full scroll gesture.
- A high prefetch miss rate usually means item composables are too expensive; split them into smaller composables or defer heavy work with `LaunchedEffect`.

---

### `cp_inspect_shared_preferences`

> Read SharedPreferences values via the in-process agent (no root or ADB file-pull required).

**What to ask your AI:**
- "show all SharedPreferences"
- "read the auth_token from user_prefs"
- "what's stored in SharedPreferences?"

**Parameters**

| Name | Type | Required | Default | Description |
|------|------|----------|---------|-------------|
| file | string | No | — | SharedPreferences file name (without `.xml`); omit to list all files |
| key | string | No | — | Specific key to read; omit to return all keys in the file |
| device_id | string | No | auto-select | ADB device serial |

**Tips**
- For apps that encrypt SharedPreferences with `EncryptedSharedPreferences`, the agent decrypts values transparently — the ADB-based `cp_get_feature_flags` cannot.

---

### `cp_inspect_viewmodel_state`

> Snapshot the public `StateFlow` and `LiveData` fields of active ViewModels in the process.

**What to ask your AI:**
- "what's the ViewModel state?"
- "show HomeViewModel state"
- "inspect the current ViewModel"

**Parameters**

| Name | Type | Required | Default | Description |
|------|------|----------|---------|-------------|
| viewModel | string | No | — | Optional substring filter on ViewModel class name |
| device_id | string | No | auto-select | ADB device serial |

**Tips**
- Only fields that are `StateFlow`, `MutableStateFlow`, `LiveData`, or `MutableLiveData` are captured — private backing fields are intentionally excluded.
- Use alongside `cp_inspect_compose_state` to correlate ViewModel emissions with what the UI actually renders.

---

### `cp_inspect_current_screen`

> Return the name of the currently visible screen, its route, and top-level composable.

**What to ask your AI:**
- "what screen am I on?"
- "which route is active?"
- "show current screen info"

**Parameters**

| Name | Type | Required | Default | Description |
|------|------|----------|---------|-------------|
| device_id | string | No | auto-select | ADB device serial |

**Tips**
- Useful as a quick orientation check before issuing a `cp_device_interact` action — confirms the expected screen is in front.
- Returns both the Navigation route (if Navigation component is used) and the top-level composable function name.

---

### `cp_inspect_network_logs`

> Return recent HTTP request/response pairs captured by the in-process OkHttp interceptor.

**What to ask your AI:**
- "show in-app network logs"
- "what was the last API response?"
- "show me the network calls from the last action"

**Parameters**

| Name | Type | Required | Default | Description |
|------|------|----------|---------|-------------|
| device_id | string | No | auto-select | ADB device serial |

**Tips**
- Unlike `cp_get_network_logs` (which scrapes logcat), this tool captures traffic from inside the OkHttp interceptor chain — works even when logcat HTTP logging is disabled.
- Response bodies are truncated at 10 KB by default to keep context manageable; full bodies are available via the companion app's network inspector panel.
