---
title: Embedded Agent — Runtime
---

Deep runtime introspection powered by an in-process agent library. These tools communicate directly with the running app over ADB — no reflection hacks, no logcat scraping.

:::note[Dependency required]
Add `debugImplementation("dev.composeproof:composeproof-agent:1.2.0")` to your app module's `build.gradle.kts` to enable these tools.
:::

---

### `cp_inspect_permissions`

> List all permissions declared in the manifest and their current grant status at runtime.

**What to ask your AI:**
- "which permissions are granted?"
- "is camera permission allowed?"
- "show me the permission state"

**Parameters**

| Name | Type | Required | Default | Description |
|------|------|----------|---------|-------------|
| device_id | string | No | auto-select | ADB device serial |

**Tips**
- Useful for debugging flows that silently fail because a required permission was not granted during testing — e.g. location, notifications, or camera.

---

### `cp_inspect_process_lifecycle`

> Return the current lifecycle state of each Activity and Fragment in the process.

**What to ask your AI:**
- "what lifecycle state is the Activity in?"
- "is the app in the foreground?"
- "show all Activity lifecycle states"

**Parameters**

| Name | Type | Required | Default | Description |
|------|------|----------|---------|-------------|
| device_id | string | No | auto-select | ADB device serial |

**Tips**
- A common diagnostic for "why doesn't my observer fire?" — if the lifecycle owner is in `CREATED` rather than `STARTED`, LiveData and `repeatOnLifecycle` blocks will not emit.

---

### `cp_inspect_navigation_graph`

> Dump the Navigation component graph and current back stack, including arguments on each entry.

**What to ask your AI:**
- "show the navigation graph"
- "what's the current route?"
- "show the back stack"

**Parameters**

| Name | Type | Required | Default | Description |
|------|------|----------|---------|-------------|
| device_id | string | No | auto-select | ADB device serial |

**Tips**
- The back stack snapshot includes SavedStateHandle arguments — useful for verifying that deep-link parameters were parsed correctly.
- If the app uses multiple `NavController` instances (e.g. bottom-nav tabs), all are reported.

---

### `cp_inspect_datastore`

> Read all key-value pairs from every DataStore preferences file in the app's data directory.

**What to ask your AI:**
- "what's in DataStore?"
- "show the user preferences"
- "read the onboarding_complete flag from DataStore"

**Parameters**

| Name | Type | Required | Default | Description |
|------|------|----------|---------|-------------|
| device_id | string | No | auto-select | ADB device serial |

**Tips**
- For SharedPreferences (not DataStore) use `cp_get_feature_flags` on the Device Inspection page.
- Values are returned with their Protobuf or Preferences DSL types intact (boolean, string, int, etc.).

---

### `cp_inspect_coroutine_state`

> List all active coroutines in the process, grouped by scope, with their current state and stack trace.

**What to ask your AI:**
- "show active coroutines"
- "are there any stuck coroutines?"
- "what coroutines are running right now?"

**Parameters**

| Name | Type | Required | Default | Description |
|------|------|----------|---------|-------------|
| device_id | string | No | auto-select | ADB device serial |

**Tips**
- Requires the app to be built with `kotlinx-coroutines-debug` on the classpath (included transitively by the agent library in debug builds).
- Look for coroutines in `SUSPENDED` state on a network dispatcher for longer than expected — a common sign of a missed timeout or a stuck retry loop.

---

### `cp_execute_deeplink`

> Fire a deep-link URI at the running app via an intent.

**What to ask your AI:**
- "fire deep link myapp://profile/123"
- "navigate to the checkout screen via deep link"
- "test the deep-link URI myapp://reset-password?token=abc"

**Parameters**

| Name | Type | Required | Default | Description |
|------|------|----------|---------|-------------|
| uri | string | Yes | — | The deep-link URI to fire (e.g. `myapp://profile/123`) |
| device_id | string | No | auto-select | ADB device serial |

**Tips**
- Equivalent to `adb shell am start -a android.intent.action.VIEW -d "<uri>"` but with automatic package targeting so the intent always lands in the correct app.
- Combine with `cp_take_device_screenshot` immediately after to confirm the target screen rendered.

---

### `cp_simulate_process_death`

> Kill the app process and relaunch it to verify that saved state and DataStore persistence survive a process death.

**What to ask your AI:**
- "simulate process death"
- "test state restoration after process kill"
- "kill and relaunch the app"

**Parameters**

| Name | Type | Required | Default | Description |
|------|------|----------|---------|-------------|
| device_id | string | No | auto-select | ADB device serial |
| package_name | string | No | auto-detect | App package to kill; auto-detected from the project if omitted |

**Tips**
- This is the correct way to test `rememberSaveable` and `SavedStateHandle` — pressing the back button destroys the Activity but does **not** kill the process.
- After relaunch, follow up with `cp_inspect_navigation_graph` to confirm the back stack was restored to the expected destination.
