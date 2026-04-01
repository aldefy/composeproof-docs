---
title: Headless Rendering
description: How ComposeProof renders @Preview functions to screenshots using Compose Desktop and Skia — no device, no emulator.
---

# Headless Rendering

## The Problem

AI coding assistants write Compose code but cannot see what it produces. They reason about UI through text descriptions — reading your composable function and imagining what it might look like. This is fragile. A wrong padding value, a clipped text overflow, a dark theme color that's unreadable — these don't show up in code review. They show up when you look at the screen.

The traditional fix is: run the app, navigate to the screen, take a screenshot, paste it into the chat. That's 2–5 minutes per iteration. At that speed, AI-assisted UI development is slower than doing it manually.

**ComposeProof's solution:** render `@Preview` functions to screenshots directly on the JVM, using the same rendering stack that IntelliJ's live preview uses. No device. No emulator. No build changes. The AI sees the screenshot in the same response as the tool call.

---

## How It Works

The headless rendering pipeline has four stages.

```
Source files
    │
    ▼
[1] Preview Scanner
    regex + Kotlin AST
    no compilation needed
    output: list of @Preview functions + locations
    │
    ▼
[2] Classpath Resolution
    Gradle Tooling API
    AAR → JAR transformation
    output: ~269 JARs on disk
    │
    ▼
[3] Render Daemon
    persistent JVM process
    isolated classloader per project
    file watcher + incremental recompile
    │
    ▼
[4] Subprocess Render
    reflection → load @Preview function
    ImageComposeScene (Compose Desktop)
    PNG export
    output: image/png base64 → AI client
```

---

## Stage 1: Preview Scanner

The scanner finds `@Preview` functions without compiling your code. It uses regex pattern matching combined with basic Kotlin parsing.

**What it detects:**

```kotlin
// Standard @Preview
@Preview
@Composable
fun HomeScreenPreview() { ... }

// @Preview with parameters
@Preview(name = "Dark Theme", uiMode = UI_MODE_NIGHT_YES)
@Composable
fun HomeScreenDarkPreview() { ... }

// Multiple @Preview annotations
@Preview(name = "Phone", widthDp = 400)
@Preview(name = "Tablet", widthDp = 840)
@Composable
fun HomeScreenMultiPreview() { ... }

// Custom annotation (wrapping @Preview)
@MyAppPreview
@Composable
fun HomeScreenCustomPreview() { ... }

// Private functions — scanner finds these too
@Preview
@Composable
private fun InternalComponentPreview() { ... }

// Nested package with backticks
package `my.compose.package`

@Preview
@Composable
fun `Preview with spaces`() { ... }
```

The scanner also resolves custom preview annotations by chasing the annotation definition: if `@MyAppPreview` is annotated with `@Preview`, ComposeProof treats it as a preview annotation.

**Output from `cp_list_previews`:**

```json
[
  {
    "name": "HomeScreenPreview",
    "qualifiedName": "com.example.ui.HomeScreenPreview",
    "file": "app/src/main/kotlin/com/example/ui/HomeScreen.kt",
    "line": 42,
    "annotations": [
      {"name": "Preview", "widthDp": 400, "heightDp": 800, "uiMode": 0}
    ]
  }
]
```

**Why no compilation?** Compilation takes 15–60 seconds on a typical Android project. The scanner runs in milliseconds by reading source text. This makes `cp_list_previews` instant — the AI can see all available previews without waiting for a build.

---

## Stage 2: Classpath Resolution

To execute your `@Preview` function on the JVM, ComposeProof needs the same JARs that your Android build uses. It resolves them using the Gradle Tooling API — the same mechanism that IntelliJ uses when it imports your project.

**The AAR problem:**

Android libraries are distributed as `.aar` files (Android Archive). They contain:
- `classes.jar` — the compiled Kotlin/Java classes
- `res/` — Android resources
- `AndroidManifest.xml`
- `R.txt`

The JVM can load `classes.jar` directly, but not the surrounding `.aar` wrapper. ComposeProof applies the `artifactType = "android-classes-jar"` transform, which Gradle uses internally in the Android plugin. This extracts `classes.jar` from each AAR.

**What this looks like in practice:**

```
Input:  67 JARs  + 200 AARs
               ↓
AAR transform extracts classes.jar from each AAR
               ↓
Output: 269 JARs (all loadable by JVM classloader)
```

A typical Android project with standard dependencies (Jetpack Compose, Material 3, Retrofit, Hilt, etc.) resolves to roughly 250–300 JARs. The resolved classpath is cached: as long as your Gradle files don't change, subsequent renders skip this step.

---

## Stage 3: Render Daemon

Rather than spawning a new JVM for every render request, ComposeProof keeps a long-running render daemon process. This is the key to achieving fast hot renders.

**Daemon lifecycle:**

```
First request
    → JVM starts (2–4s)
    → classpath loads (~200 JARs, 5–10s)
    → classloader initialized
    → first render (1–2s)
    Total: 10–15s (cold start)

Subsequent requests (same classpath)
    → classloader already loaded
    → render only
    Total: 1–3s (hot render)

Cached requests (same source hash)
    → result retrieved from SHA-256 keyed cache
    Total: ~50ms (cache hit)
```

**File watcher + incremental recompile:**

The daemon watches your source files. When you edit a `.kt` file containing a `@Preview`, the daemon invalidates the classloader for that file's module and recompiles only what changed. This keeps hot renders fast even after edits.

**Cache keys:**

Each cached screenshot is keyed on a SHA-256 hash of:
- The `@Preview` function source text
- The resolved classpath entries (file paths + modification times)
- The render parameters (width, height, theme, locale)

If any of these change, the cache misses and a fresh render runs.

**Daemon per project:**

Each project root gets its own daemon. If you have two ComposeProof sessions running against different projects, they run separate daemons with independent classpath isolation.

---

## Stage 4: Subprocess Rendering

The actual rendering happens in an isolated subprocess that executes your `@Preview` function using `ImageComposeScene` — the Compose Desktop API for off-screen rendering.

**The render loop (simplified):**

```kotlin
// ComposeProof's render harness (simplified)
fun renderPreview(
    qualifiedName: String,
    width: Int,
    height: Int,
    theme: ComposeTheme
): ByteArray {
    val scene = ImageComposeScene(
        width = width,
        height = height,
        density = Density(2f)  // @2x for retina-quality output
    )

    scene.setContent {
        // Apply system theme (light/dark)
        AppThemeWrapper(theme) {
            // Load and invoke the @Preview function via reflection
            val previewFn = classLoader.loadClass(qualifiedName)
                .declaredMethods
                .first { it.isAnnotationPresent(Preview::class.java) }
            previewFn.invoke(null)
        }
    }

    // Render one frame
    val image = scene.render()
    scene.close()

    return image.encodeToData(EncodedImageFormat.PNG)!!.bytes
}
```

**Theme variants:**

When you request `theme = "dark"`, ComposeProof wraps your composable in a `MaterialTheme` with `darkColorScheme()`. When you request `theme = "light"`, it uses `lightColorScheme()`. Both match what the Android Studio preview panel shows.

**Size:** Defaults match `@Preview` annotation parameters (`widthDp`, `heightDp`). If not specified, defaults to 400×800dp at @2x = 800×1600px PNG.

---

## What Can and Cannot Be Rendered

### Works without a device

```kotlin
// Pure composables — always works
@Preview
@Composable
fun ButtonPreview() {
    Button(onClick = {}) { Text("Click me") }
}

// Composables with fake/stub data — works
@Preview
@Composable
fun UserCardPreview() {
    UserCard(user = User(name = "Alice", avatarUrl = null))
}

// Composables using MaterialTheme — works
@Preview
@Composable
fun ThemedPreview() {
    MaterialTheme(colorScheme = darkColorScheme()) {
        Surface { HomeScreen() }
    }
}

// ViewModels via preview parameters — works (with stub VM)
@Preview
@Composable
fun HomeScreenPreview() {
    val fakeVm = HomeViewModel(FakeRepository())
    HomeScreen(viewModel = fakeVm)
}
```

### Requires device (Layer 2) or Paparazzi

```kotlin
// Uses LocalContext — cannot render headlessly
@Preview
@Composable
fun ContextualPreview() {
    val context = LocalContext.current  // ❌ no Android context on JVM
    Image(painter = rememberAsyncImagePainter(context.getString(R.string.url)))
}

// Uses Android resources directly
@Preview
@Composable
fun ResourcePreview() {
    Image(painter = painterResource(R.drawable.logo))  // ❌ no R class on JVM
}

// Embeds an Android View
@Preview
@Composable
fun MapPreview() {
    AndroidView(factory = { context -> MapView(context) })  // ❌ needs Activity
}
```

When ComposeProof encounters a composable it cannot render headlessly, it returns an error with a suggestion to use `cp_take_device_screenshot` instead.

---

## Writing Headless-Friendly Previews

Structure your `@Preview` functions to be self-contained. This is good practice regardless of ComposeProof — it also makes your previews more useful in Android Studio.

**Recommended pattern:**

```kotlin
// Create a companion object or object with fake data
object FakeData {
    val user = User(
        name = "Alice Wonderland",
        email = "alice@example.com",
        avatarUrl = null,  // Use null or a stable URL
        isPremium = true
    )

    val posts = listOf(
        Post(id = 1, title = "Hello", body = "World"),
        Post(id = 2, title = "Another", body = "Post")
    )
}

// Preview function only uses its own data and no Android context
@Preview(name = "User Card - Light", showBackground = true)
@Preview(name = "User Card - Dark", uiMode = UI_MODE_NIGHT_YES, showBackground = true)
@Composable
fun UserCardPreview() {
    AppTheme {
        UserCard(user = FakeData.user)
    }
}
```

**Avoid in previews:**
- `LocalContext.current`
- `stringResource()`, `dimensionResource()`, `colorResource()` (use hardcoded values instead)
- `painterResource()` for vector drawables (use `Icons.*` from Material instead)
- `Hilt` injection (use constructor injection with fakes)
- `rememberNavController()` without a stub (use `NavController` parameter injection)
