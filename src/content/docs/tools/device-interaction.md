---
title: Device Interaction
---

Build, deploy, and interact with your app on a connected Android device or emulator via ADB.

---

### `cp_preflight`

> Check that a device is connected, the app is installed, and ADB is reachable — before issuing any other device command.

**What to ask your AI:**
- "is the app running on device?"
- "check device status before we start"
- "do we have a connected device?"

**Parameters**

| Name | Type | Required | Default | Description |
|------|------|----------|---------|-------------|
| project_path | string | Yes | — | Path to the target project (used to resolve the app package) |
| device_id | string | No | auto-select | ADB device serial; auto-selected when only one device is connected |

**Tips**
- Run this at the start of any device-heavy session — it surfaces missing ADB authorisation, multiple devices without an explicit `device_id`, or a stale install before you attempt a build.

---

### `cp_build_and_deploy`

> Build the app and install it on the target device in one step.

**What to ask your AI:**
- "build and install the app"
- "deploy the staging flavour"
- "rebuild and push to device"

**Parameters**

| Name | Type | Required | Default | Description |
|------|------|----------|---------|-------------|
| project_path | string | Yes | — | Path to the root of the target project |
| module | string | No | `:app` | Gradle module to build (e.g. `:app`, `:sample`) |
| variant | string | No | `debug` | Build variant (e.g. `debug`, `release`, `staging`) |
| device_id | string | No | auto-select | ADB device serial |
| flavor | string | No | — | Product flavor combined with `variant` (e.g. `free` → `freeDebug`) |

**Tips**
- The tool streams Gradle output so the AI can report compile errors immediately.
- After a successful install the app is launched automatically — follow up with `cp_take_device_screenshot` to confirm the splash screen rendered.

---

### `cp_device_interact`

> Perform a gesture, text input, navigation action, or launch command on the device. A screenshot is captured automatically after every action.

**What to ask your AI:**
- "tap the Login button"
- "type test@example.com into the email field"
- "scroll down to the bottom"
- "go back"
- "swipe left to dismiss"

**Parameters**

| Name | Type | Required | Default | Description |
|------|------|----------|---------|-------------|
| action | enum | Yes | — | One of: `tap_element`, `tap`, `long_press`, `swipe`, `scroll`, `text`, `back`, `home`, `enter`, `launch`, `wait_for` |
| element_text | string | No | — | Accessibility text of the element to target (for `tap_element`) |
| x | int | No | — | Screen X coordinate in pixels (for coordinate-based actions) |
| y | int | No | — | Screen Y coordinate in pixels |
| end_x | int | No | — | End X coordinate for `swipe` |
| end_y | int | No | — | End Y coordinate for `swipe` |
| direction | string | No | — | One of: `up`, `down`, `left`, `right` (for `scroll`) |
| duration_ms | int | No | — | Gesture duration in milliseconds |
| timeout_ms | int | No | 5000 | Maximum wait time in ms for `wait_for` action |
| text | string | No | — | Text to input (for `text` action) |
| activity | string | No | — | Fully-qualified Activity class to launch (for `launch` action) |
| device_id | string | No | auto-select | ADB device serial |

**Tips**
- A screenshot is taken automatically after every action — you do not need to call `cp_take_device_screenshot` separately.
- Prefer `tap_element` with `element_text` over coordinate-based `tap` — it is resolution-independent and survives layout changes.
- Use `wait_for` with `element_text` to pause until a loading state resolves before issuing the next action.

---

### `cp_take_device_screenshot`

> Capture the current screen and return it to the AI.

**What to ask your AI:**
- "take a screenshot"
- "what's on screen right now?"
- "capture the current state"

**Parameters**

| Name | Type | Required | Default | Description |
|------|------|----------|---------|-------------|
| device_id | string | No | auto-select | ADB device serial |

**Tips**
- Uses the two-step file-pull approach (`adb shell screencap` → `adb pull`) to avoid binary stream corruption on macOS — do not bypass this with `adb exec-out`.
- Useful as a quick sanity check after navigating to a new screen before asking the AI to interact with elements.

---

### `cp_get_build_status`

> Compare the currently-installed APK version against the project's build output to determine whether a re-deploy is needed.

**What to ask your AI:**
- "is the installed version up to date?"
- "has anything changed since the last install?"

**Parameters**

| Name | Type | Required | Default | Description |
|------|------|----------|---------|-------------|
| project_path | string | Yes | — | Path to the target project |
| module | string | No | `:app` | Gradle module to check |
| device_id | string | No | auto-select | ADB device serial |
| package | string | No | auto-detect | App package name; auto-detected from `AndroidManifest.xml` |

**Tips**
- The comparison uses `versionCode` and the APK last-modified timestamp — no full Gradle sync needed.
- Pair with `cp_build_and_deploy` to ensure the AI always tests the latest code.
