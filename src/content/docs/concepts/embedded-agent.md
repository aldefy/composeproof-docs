---
title: Embedded Agent
description: Runtime inspection of Compose state, ViewModel, navigation, coroutines, and more — powered by the in-app ComposeProof SDK.
---

# Embedded Agent

## What It Is

Headless rendering (Layer 1) shows you what your UI looks like at preview time. Device interaction (Layer 2) shows you what's on screen at runtime. But neither tells you *why* the UI is in a given state — what data is flowing, what the ViewModel holds, where the user is in the navigation graph, which coroutines are running.

The Embedded Agent is an in-app SDK that runs inside your debug app and exposes a local HTTP API for runtime inspection. ComposeProof's MCP server connects to it over ADB reverse TCP tunnel, giving the AI direct access to live runtime state.

This is Layer 3: the deepest layer, with the highest fidelity.

---

## Setup

The agent is debug-only. It adds zero code to your release builds.

```kotlin
// app/build.gradle.kts
dependencies {
    debugImplementation("dev.composeproof:composeproof-agent:1.2.0")
}
```

No `Application` class changes. No manifest changes. The agent SDK uses an `androidx.startup.Initializer` to start automatically in debug builds.

When the app launches, the agent binds to a local HTTP port (default: 8078) inside the app process. It exposes a REST API that ComposeProof's MCP server calls.

---

## Pairing

The MCP server needs to connect to the agent's HTTP server. Because both sides are on the same machine (ADB tunnels device traffic to localhost), this is a simple TCP setup.

### ADB Reverse (required for USB/emulator)

```bash
adb reverse tcp:8078 tcp:8078
```

This forwards `localhost:8078` on your Mac to port `8078` inside the device. Run this once per session. If you're using a wireless device, run it after `adb connect`.

### Pairing via MCP

```
"pair with the companion app"
"connect to the embedded agent"
```

`cp_pair_companion` handles the pairing flow:

1. Starts an HTTP listener on your machine
2. Generates a pairing token (random 32-byte hex)
3. Displays a QR code in the terminal containing `composeproof://pair?host=...&port=8078&token=...`
4. Scan with your device's camera app → app connects and stores the token
5. All subsequent agent calls use this token for authentication

### Deep Link Pairing (QR-free)

For automation or when QR scanning isn't convenient:

```bash
adb shell am start \
  -n dev.composeproof.companion/.MainActivity \
  -e host "localhost" \
  -e port "8078" \
  -e token "your-32-byte-token-here"
```

The `cp_pair_companion` tool outputs this command alongside the QR code as a fallback.

### Pairing Persistence

Once paired, the token is stored in the app's encrypted SharedPreferences. You don't need to re-pair when you restart the app. You only need to re-pair if you:
- Clear app data
- Install a fresh build that wipes data
- Rotate the token manually

---

## Capabilities

### Compose State Inspection

Read `State<*>` and `MutableState<*>` values from any composable in the hierarchy.

```
"what's the current value of isLoading in HomeScreen?"
"show me the full state of LoginScreen"
```

The agent traverses the Compose snapshot state tree and returns current values, including:
- `mutableStateOf` primitives (Boolean, String, Int, etc.)
- `mutableStateOf` with data classes (serialized to JSON)
- `derivedStateOf` computed values
- `collectAsState()` values from StateFlow

```json
{
  "composable": "HomeScreen",
  "state": {
    "isLoading": false,
    "error": null,
    "posts": [
      {"id": 1, "title": "Hello", "isExpanded": false},
      {"id": 2, "title": "World", "isExpanded": true}
    ],
    "selectedTabIndex": 1
  }
}
```

### ViewModel State

Read `StateFlow`, `LiveData`, and `UiState` from ViewModels by class name.

```
"show me the HomeViewModel state"
"what does the AuthViewModel hold right now?"
```

The agent uses reflection to enumerate ViewModel properties annotated with `@StateFlow` or implementing `StateFlow<*>`, and serializes their current values.

```json
{
  "viewModel": "HomeViewModel",
  "state": {
    "uiState": {
      "type": "HomeUiState.Content",
      "posts": 12,
      "isRefreshing": false,
      "selectedFilter": "Recent"
    },
    "searchQuery": "",
    "sortOrder": "DESCENDING"
  }
}
```

### Navigation Graph

Inspect the full navigation graph, current back stack, and argument values.

```
"where am I in the navigation graph?"
"show me the full nav graph"
"what arguments were passed to this screen?"
```

```json
{
  "currentDestination": "home/feed",
  "backStack": [
    "splash",
    "onboarding",
    "home/feed"
  ],
  "currentArguments": {
    "userId": null,
    "initialTab": "feed"
  },
  "pendingDeepLink": null,
  "graph": {
    "startDestination": "splash",
    "routes": ["splash", "onboarding", "home/{tab}", "profile/{userId}", "settings"]
  }
}
```

### Coroutine Inspection

List all active coroutines in the app, their dispatchers, states, and parent job hierarchy.

```
"are there any coroutines running?"
"show me the coroutine tree for HomeViewModel"
"why is this coroutine suspended?"
```

```json
{
  "coroutines": [
    {
      "name": "StandaloneCoroutine{Active}",
      "state": "Active",
      "dispatcher": "Dispatchers.IO",
      "suspended_at": "HomeRepository.kt:87 (fetchPosts)",
      "parent": "viewModelScope"
    },
    {
      "name": "StandaloneCoroutine{Active}",
      "state": "Active",
      "dispatcher": "Dispatchers.Main",
      "suspended_at": "HomeViewModel.kt:42 (collectLatest)",
      "parent": "viewModelScope"
    }
  ]
}
```

### Process Death Simulation

Simulate what happens when Android kills your app process. This is **real** process death — not just backgrounding. It uses `am kill` to terminate the process and captures state before and after restoration.

```
"simulate process death and show me what survives"
"test that my saved state handles process death correctly"
```

**What happens:**

1. Agent captures current state snapshot (all Compose state + ViewModel state + SharedPreferences)
2. Agent instructs ADB to run `adb shell am kill <package>` — real process death
3. App relaunches via the saved instance state bundle
4. Agent captures restored state snapshot
5. ComposeProof diffs the two snapshots

```
Process Death Report
─────────────────────────────────
Survived (SavedStateHandle / rememberSaveable):
  ✓ selectedTabIndex: 1
  ✓ scrollPosition: 240
  ✓ searchQuery: "compose"

Lost (not persisted):
  ✗ expandedPostIds: [2, 7, 14]
  ✗ isRefreshing: true
  ✗ cachedPosts: <12 items>

Recommendation: expandedPostIds is likely UX state worth persisting.
Use rememberSaveable or SavedStateHandle.
```

### Semantic UI Queries

Find composables by text content, `testTag`, accessibility role, or content description — without navigating the full UI hierarchy.

```
"find the button with text 'Sign In'"
"find all elements with testTag 'post-card'"
"find the element with contentDescription 'Back'"
```

```json
{
  "query": {"type": "text", "value": "Sign In"},
  "results": [
    {
      "composable": "Button",
      "bounds": {"x": 24, "y": 680, "width": 352, "height": 56},
      "isEnabled": true,
      "isFocused": false,
      "testTag": "btn_sign_in",
      "actions": ["onClick"]
    }
  ]
}
```

Semantic queries are faster than full UI tree dumps when you know what you're looking for. They also work when the UI hierarchy is deep (RecyclerView inside ViewPager inside Fragment inside...).

### LazyList Profiling

Measure scroll performance in `LazyColumn` and `LazyRow`:

```
"profile the posts list scroll performance"
"are there any items being composed off-screen?"
```

```
LazyList Profile: PostsLazyColumn
─────────────────────────────────
Visible items: 8
Total items: 156
Items composed outside viewport: 3 (excessive — check prefetchDistance)

Item composition times (avg over 60 frames):
  PostCard: 4.2ms (SLOW — exceeds 16ms budget for 3+ items/frame)
  PostCard_Skeleton: 0.3ms (fast)

Recomposition hot spots:
  PostCard: 12 recompositions in 5s (likely caused by parent lambda)
  LikeButton: 34 recompositions in 5s (consider wrapping in remember)
```

### Stability Analysis

Analyze composable stability — which composables are unstable and causing unnecessary recompositions.

```
"find unstable composables"
"why is HomeScreen recomposing so often?"
"analyze stability of my data classes"
```

```
Stability Report
─────────────────────────────────
Unstable composables:
  ✗ PostCard(post: Post) — Post is UNSTABLE
    Post.tags: List<String> is not @Immutable
    Fix: annotate Post with @Immutable or use ImmutableList

  ✗ UserAvatar(user: User) — User is UNSTABLE
    User.metadata: Map<String, Any> causes instability
    Fix: extract stable fields or annotate with @Stable

Stable composables (skippable):
  ✓ LikeButton — all params stable
  ✓ PostTitle — String param, stable
  ✓ PostMetadata — primitives only, stable
```

### Recomposition Tracking

Track live recomposition counts per composable over a time window.

```
"track recompositions for 10 seconds while I scroll"
"show me which composables are recomposing"
```

This tool requires the Embedded Agent and captures recomposition counts from the Compose runtime's internal counters over the specified time window.

---

## Free vs. Pro Capabilities

| Capability | Free | Pro |
|-----------|------|-----|
| Headless rendering (`cp_render`) | Yes | Yes |
| Golden management | Yes | Yes |
| Device screenshots | Yes | Yes |
| Build and deploy | Yes | Yes |
| UI tree inspection | Yes | Yes |
| Network logs | Yes | Yes |
| SharedPreferences read/write | Yes | Yes |
| **Compose state inspection** | No | Yes |
| **ViewModel state** | No | Yes |
| **Navigation graph + back stack** | No | Yes |
| **Coroutine inspection** | No | Yes |
| **Process death simulation** | No | Yes |
| **Semantic UI queries** | No | Yes |
| **LazyList profiling** | No | Yes |
| **Stability analysis** | No | Yes |
| **Recomposition tracking** | No | Yes |

Free tier covers everything you need for visual feedback and UI testing. Pro adds the deep runtime inspection capabilities that require the embedded agent.

---

## Technical Details

### Communication Architecture

```
AI Client (Claude Code)
    │
    │ MCP (STDIO)
    ▼
ComposeProof MCP Server (localhost)
    │
    │ HTTP (localhost:8078)
    ▼
ADB Reverse TCP tunnel
    │
    │ HTTP (device:8078)
    ▼
ComposeProof Agent SDK (inside app process)
    │
    ├── Compose snapshot observer
    ├── ViewModel registry
    ├── NavController observer
    ├── CoroutineScope inspector
    └── Semantics tree accessor
```

### Authentication

Every HTTP call to the agent includes the pairing token in the `Authorization: Bearer <token>` header. The agent rejects requests without a valid token. Tokens are scoped to a device + app installation.

### Release Safety

The `debugImplementation` dependency ensures the agent SDK is not included in release APKs. The `dev.composeproof:composeproof-agent` artifact has a `compileOnly` transitive dependency on release — so even if someone accidentally uses `implementation`, it strips at release time.

Zero release APK size impact. Zero production behavior change.

### Port Configuration

If port 8078 is in use, configure a different port:

```kotlin
// In your Application class or a debug-only module
ComposeProofAgent.configure {
    port = 9090
}
```

Then update `adb reverse`:

```bash
adb reverse tcp:9090 tcp:9090
```
