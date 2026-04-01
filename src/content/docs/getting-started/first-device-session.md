---
title: First Device Session
---

## Prerequisites

- ComposeProof installed and previews rendering (see [First Render](/getting-started/first-render/))
- Android device connected via USB with USB debugging enabled
- `adb` on PATH (`adb devices` shows your device)
- Your app built and installable via Gradle

---

## Step 1: Check device and app status

Ask your AI assistant:

```
is the app running?
```

The AI calls `cp_preflight`. It checks:

- Connected ADB devices (device ID, model, Android version)
- Whether your app package is installed
- Whether the app process is currently running
- ADB version and reachability

Example output:

```
Preflight check:
  Device: Pixel 7 (Android 14, API 34) — connected
  Package: com.example.myapp — installed (v2.3.1, build 47)
  Process: running (PID 12483)
  ADB: 1.0.41
```

If the app isn't installed yet, move to Step 2.

---

## Step 2: Build and install

Ask your AI assistant:

```
build and install the app
```

The AI calls `cp_build_and_deploy`. This runs `./gradlew :app:installDebug` and waits for the install to complete. Progress is streamed back.

```
Building...
  > Task :app:compileDebugKotlin
  > Task :app:packageDebug
  > Task :app:installDebug
Install complete: com.example.myapp v2.3.1 (build 47)
Launched on: Pixel 7 (emulator-5554)
```

The app is automatically launched after install. You can also ask "build release" or "install on device emulator-5554" to target a specific device.

---

## Step 3: Interact with the app

Ask your AI assistant:

```
tap the Login button
```

The AI calls `cp_device_interact` with action `tap_element`. ComposeProof resolves "Login button" against the live UI accessibility tree, finds the element, and taps it.

After every interaction, a screenshot is taken automatically. The AI sees the result immediately.

Other interactions:

```
type "hello@example.com" into the email field
scroll down
swipe left on the image carousel
press the back button
long-press the first list item
```

Each produces a screenshot. You get a visual trail of every step without manually taking screenshots.

### Type text

```
type "password123" into the password field
```

Uses `cp_device_interact` with action `type_text`. Text is injected via ADB input, targeting the focused field.

### Navigate

```
navigate to the settings screen
```

The AI can either tap navigation elements or call `cp_execute_deeplink` if your app supports deep link navigation (e.g., `myapp://settings`).

---

## Step 4: Inspect the UI tree

Ask your AI assistant:

```
show me the UI tree
```

The AI calls `cp_inspect_ui_tree`. It dumps the full accessibility hierarchy of the current screen.

Example output (abbreviated):

```
Screen: LoginScreen
  LinearLayout (root)
    Text: "Welcome back" [heading]
    TextField: email  [editable, placeholder: "Email address"]
    TextField: password  [editable, password, placeholder: "Password"]
    Button: "Log in"  [clickable]
    Text: "Forgot password?"  [clickable]

Accessibility warnings:
  ⚠ TextField at row 3: missing contentDescription
  ⚠ Button at row 4: contrast ratio 2.8:1 (minimum 4.5:1)
```

The tree includes content descriptions, roles, focus order, and clickability. Accessibility warnings are flagged inline.

---

## Step 5: Inspect app state

### SharedPreferences

```
what SharedPreferences are set?
```

The AI calls `cp_inspect_shared_preferences`. Returns all key-value pairs from every SharedPreferences file in the app's data directory.

```
Preferences: com.example.myapp_preferences
  user_id: "u_48291"
  auth_token: "eyJ..." (truncated)
  onboarding_complete: true
  last_sync: 1743490823000
```

### Network traffic

```
show me network traffic
```

The AI calls `cp_inspect_network_logs`. Returns recent HTTP requests and responses captured by ComposeProof's embedded proxy (if the proxy is active — see [cp_manage_proxy](/tools/device-interaction/)).

```
GET https://api.example.com/user/profile → 200 (124ms)
POST https://api.example.com/session/refresh → 401 (89ms)
```

To enable the proxy before starting a session:

```
start the network proxy
```

### Navigation state

```
what's the navigation route?
```

The AI calls `cp_inspect_navigation_graph`. Returns the current back stack and destination.

```
Navigation back stack:
  → RootGraph/HomeScreen (current)
  ← RootGraph/LoginScreen
  ← RootGraph/SplashScreen

Defined routes: splash, login, home, profile, settings, settings/notifications
```

### Other inspection tools

```
what permissions does the app have?
what's the ViewModel state for ProfileViewModel?
show me the coroutine state
what's in the DataStore?
```

These call `cp_inspect_permissions`, `cp_inspect_viewmodel_state`, `cp_inspect_coroutine_state`, and `cp_inspect_datastore` respectively. All return structured data from the live running process via ComposeProof's embedded agent.

---

## Taking a manual screenshot

```
take a screenshot
```

The AI calls `cp_take_device_screenshot`. The screenshot is saved locally and shown inline. Useful when you want a snapshot without triggering an interaction.

---

## Simulate edge cases

```
simulate process death and restore
```

The AI calls `cp_simulate_process_death`. The app process is killed and re-launched to test saved state restoration. Screenshots are taken before and after.

---

## Next steps

- [Embedded Agent](/concepts/embedded-agent/) — understand how runtime inspection works
- [Debugging Guide](/guides/debugging/) — structured workflow for tracking down bugs with ComposeProof
- [Prompt Cookbook](/prompt-cookbook/) — copy-paste prompts for device sessions
