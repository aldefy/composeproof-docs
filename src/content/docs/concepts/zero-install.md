---
title: Zero-Install Architecture
description: How ComposeProof works on any Compose project without modifying a single build file.
---

# Zero-Install Architecture

## The Problem With Every Other Tool

Every screenshot testing tool for Android requires you to modify your build files before you can use it.

```kotlin
// Paparazzi — you must add this to every module
plugins {
    id("app.cash.paparazzi")
}

// Roborazzi — same story
plugins {
    id("io.github.takahirom.roborazzi")
}

// Google Screenshot Testing — also requires plugin
plugins {
    id("com.android.test")
}
```

This creates real friction:

- You need to understand how the plugin integrates with your existing build
- You need team approval before changing shared build files
- You might hit Gradle configuration cache conflicts
- You're committing to the tool before you know if it works for your project
- In CI, you need to update pipeline configuration

The result: most developers don't bother. Tools that require upfront investment before delivering value see low adoption.

**ComposeProof's design principle:** the tool should work before you've committed to it.

---

## Three Tiers

ComposeProof has three integration tiers. You start at Tier 1 with zero changes, and only move to deeper tiers if you need what they offer.

```
Tier 1 (Zero-install)     Tier 2 (Sidecar)           Tier 3 (Gradle Plugin)
──────────────────────    ──────────────────────      ──────────────────────
npx composeproof          Auto-created .composeproof/ id("dev.composeproof")
No build changes          module (gitignored)         in build.gradle.kts
Works immediately         Faster hot renders          CI tasks + golden mgmt
                          Still no manual edits       Full team workflow
```

---

## Tier 1: Zero-Install (Default)

ComposeProof uses the **Gradle Tooling API** to read your project externally — the same API that powers IntelliJ's project import. It never runs as part of your build.

**What happens when you first call `cp_render`:**

1. **Project discovery** — Reads `settings.gradle.kts` (or `.gradle`), enumerates all included modules, identifies Android library and application modules.

2. **Classpath resolution** — Invokes the Tooling API's `IdeaProject` model to resolve each module's compile + runtime classpath. This produces a list of JARs and AARs.

3. **AAR transformation** — Android Archive files (`.aar`) contain classes in a `classes.jar` inside the archive. ComposeProof extracts them using the `artifactType = "android-classes-jar"` transform strategy, equivalent to what the Android Gradle Plugin does internally. A typical project yields ~67 JARs + ~200 AARs → ~269 JARs after transformation.

4. **Preview scanning** — Source files are scanned for `@Preview` annotations without compilation. Results are available in milliseconds.

5. **Rendering** — Your `@Preview` function is loaded into an isolated classloader backed by the resolved classpath, then executed using the Compose Desktop (Skia) backend.

**Nothing in your project changes.** The Tooling API is read-only. No files are created in your repo (except the render cache in your system temp dir).

```bash
# This is all it takes
npx composeproof

# Then in Claude Code:
> render my HomeScreen preview
```

### Classpath Resolution in Detail

The Tooling API gives ComposeProof access to the same information that your IDE has about your project — without running a build.

```
settings.gradle.kts
  ├── :app
  │     ├── implementation("androidx.compose.ui:ui:1.7.0")  → resolved JAR
  │     ├── implementation("com.squareup.retrofit2:retrofit:2.11.0") → JAR
  │     └── api project(":core:ui")  → local module
  ├── :core:ui
  │     └── ...
  └── :feature:home
        └── ...

ComposeProof resolves all of this into a flat list of JARs.
```

### Limitations of Tier 1

- Composables using `LocalContext.current`, `Activity`, Android resources, or `AndroidView` cannot be rendered headlessly. These require a real device (Layer 2) or Paparazzi fallback.
- First render includes JVM startup + classpath load: 10–15 seconds. Subsequent renders are 1–3 seconds once the daemon is warm.
- If your project uses Gradle version catalogs or complex multi-project setups, classpath resolution may occasionally need a hint. Use `cp_configure_context` to specify the module path.

---

## Tier 2: Sidecar Module

When you're iterating frequently and want faster hot renders, ComposeProof can auto-create a sidecar module.

**What it does:**

ComposeProof creates a `.composeproof/` directory at your project root (automatically gitignored) containing a minimal Gradle module:

```
.composeproof/
├── build.gradle.kts       # depends on :app + compose-desktop
├── src/main/kotlin/
│   └── Renderer.kt        # generated render harness
└── .gitignore             # ignores everything in this dir
```

The sidecar module explicitly declares `implementation project(":app")` and `implementation compose.desktop.currentOs`, giving the Compose Desktop renderer direct access to your app's compiled classes rather than going through the Tooling API classpath resolution on every render.

**Your build files are not modified.** The sidecar module is a new module that references your existing module — your existing `settings.gradle.kts` is not edited, and neither is any existing `build.gradle.kts`.

**Performance improvement:** Hot renders drop from 1–3 seconds to under 1 second because the classloader is backed by compiled outputs rather than resolved artifacts.

**Activating Tier 2:**

```bash
# In Claude Code:
> set up sidecar for faster renders
```

Or directly via CLI:

```bash
composeproof sidecar init --project .
```

**Cleaning up:**

```bash
composeproof sidecar remove --project .
# Removes .composeproof/ entirely
```

---

## Tier 3: Gradle Plugin (Opt-In)

For teams that want golden management and CI integration, the optional Gradle plugin adds tasks directly to your build.

```kotlin
// build.gradle.kts (module level)
plugins {
    id("dev.composeproof") version "1.1.0"
}
```

**Added tasks:**

| Task | Description |
|------|-------------|
| `composeproofRecord` | Render all previews and save as golden baselines |
| `composeproofVerify` | Render all previews and compare to goldens. Fails the build on regression. |
| `composeproofReport` | Generate HTML report with screenshots and diff overlays |
| `composeproofRender` | Render a named preview to a file |
| `composeproofList` | List all discovered @Preview functions |

**CI integration:**

```yaml
# .github/workflows/ci.yml
- name: Visual regression check
  run: ./gradlew composeproofVerify
```

The plugin uses the same underlying renderer as Tiers 1 and 2. Goldens are stored in `src/test/snapshots/` by default and are meant to be committed to your repo.

**When to use Tier 3:**

- Your team has established a visual regression testing policy
- You want CI to catch regressions automatically
- You want the `composeproofVerify` task to block PRs that break UI

---

## Why This Matters

The zero-install principle changes the adoption curve.

**Traditional tool adoption:**
```
Discover tool → Read docs → Understand setup → Get team approval →
Modify build files → Debug Gradle issues → Run first test → Maybe works
```

**ComposeProof adoption:**
```
npx composeproof → ask AI to render → it works
```

Try before you commit. Adopt incrementally. Start with headless rendering today, add the plugin when your team is ready.

---

## Comparison Table

| Capability | Tier 1 | Tier 2 | Tier 3 |
|-----------|--------|--------|--------|
| Zero build file changes | Yes | Yes | No |
| Works immediately | Yes | After `sidecar init` | After plugin apply |
| Hot render speed | 1–3s | <1s | <1s |
| Golden management (MCP) | Yes | Yes | Yes |
| Golden management (Gradle task) | No | No | Yes |
| CI task (`composeproofVerify`) | No | No | Yes |
| Incremental recompile | No | Yes | Yes |
| Team workflow | Individual | Individual | Team |
