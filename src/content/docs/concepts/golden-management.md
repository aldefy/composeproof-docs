---
title: Golden Management
description: Record known-good screenshots as baselines, then catch visual regressions automatically.
---

# Golden Management

## What Are Goldens?

A golden (also called a snapshot or baseline) is a screenshot you've approved as correct. Once recorded, it becomes the reference image that future renders are compared against. Any pixel-level difference — a color change, a layout shift, a missing element — is flagged as a regression.

Goldens let you answer a specific question: **"Did my UI change?"**

Not "is my UI correct" in an abstract sense, but "did it change from the state I previously approved?" This is valuable because:

- Many UI bugs are introduced silently by dependency upgrades (`compose_ui` patch release changes button elevation)
- Refactors can break visual output without breaking unit tests
- Design token changes can cascade unexpectedly across many composables
- CI has no eyes — without goldens, it can't see visual regressions

---

## The 4-Step Workflow

Golden management follows a deliberate workflow designed to prevent accidental overwrites.

### Step 1: Record

Ask the AI to record golden baselines for your previews. This renders every `@Preview` function and saves the screenshots as your approved baseline.

```
"save goldens for all previews"
"record the HomeScreen baseline"
"set current renders as golden"
```

Under the hood: `cp_render_batch mode=record`

This creates (or overwrites) the golden files in `.composeproof/goldens/`. It also writes a `manifest.json` entry for each golden tracking metadata.

**When to record:**
- Initial setup (first time setting up goldens for a screen)
- After a deliberate, approved design change
- After accepting a refactor that changes visual output without changing design intent

### Step 2: Make Changes

Work normally. Edit composables, change themes, refactor layouts, upgrade dependencies. The goldens sit untouched in `.composeproof/goldens/`.

### Step 3: Verify

Ask the AI to check if anything broke.

```
"did anything change visually?"
"check for regressions"
"verify all previews against goldens"
```

Under the hood: `cp_render_batch mode=verify`

This renders every preview with a golden and performs a pixel-level diff. **Verify mode never overwrites goldens.** It only reads them and reports differences.

**Output:**

```
50 previews checked
  45 PASS   (pixel-perfect match or within tolerance)
   3 FAIL   (regression detected)
   2 NEW    (no golden recorded yet)

FAIL: ButtonPrimaryPreview
  Delta: 847 pixels changed (0.53%)
  Region: bottom-right quadrant
  Likely cause: padding change

FAIL: CardPreview
  Delta: 2,341 pixels changed (1.46%)
  Region: top area
  Likely cause: text size or font change

FAIL: NavigationBarPreview
  Delta: 124 pixels changed (0.08%)
  Region: scattered
  Likely cause: elevation/shadow rendering
```

The AI sees diff images alongside the pass/fail counts and can reason about which failures represent intentional changes vs. genuine bugs.

### Step 4: Update (Accept)

If the change is intentional (you redesigned a component), update the golden to accept the new appearance.

```
"accept the new button design"
"update the golden for CardPreview"
"the navigation bar change is intentional, update it"
```

Under the hood: `cp_diff mode=update`

This replaces the specific golden with the current render output. It does not affect other goldens.

---

## Storage Format

Goldens are stored in `.composeproof/goldens/` at your project root.

```
.composeproof/
└── goldens/
    ├── manifest.json
    ├── HomeScreenPreview.png
    ├── HomeScreenPreview_dark.png
    ├── ButtonPrimaryPreview.png
    ├── ButtonPrimaryPreview_dark.png
    └── ...
```

### manifest.json

The manifest tracks metadata for every golden. It is what makes `verify` mode reliable — it records what conditions the golden was rendered under so verify can reproduce them.

```json
{
  "version": 2,
  "goldens": {
    "HomeScreenPreview": {
      "file": "app/src/main/kotlin/com/example/ui/HomeScreen.kt",
      "qualifiedName": "com.example.ui.HomeScreenPreview",
      "sourceHash": "sha256:a3f1b2c4...",
      "renderedAt": "2026-03-15T14:22:01Z",
      "backend": "compose-desktop-skia",
      "width": 800,
      "height": 1600,
      "density": 2.0,
      "theme": "light",
      "locale": "en",
      "composeVersion": "1.7.0",
      "tolerance": 0
    },
    "HomeScreenPreview_dark": {
      "...": "same fields, theme: dark"
    }
  }
}
```

**Fields:**
- `sourceHash` — SHA-256 of the `@Preview` function source text. If the source changes, verify warns you that the function was modified since the golden was recorded.
- `backend` — Which renderer produced this golden. Always `compose-desktop-skia` for headless goldens.
- `tolerance` — Per-golden tolerance value (0 = exact match, 255 = any pixel value accepted per channel). Overrides the global tolerance setting.

### Should goldens be committed?

Yes, for team workflows. Goldens committed to your repository serve as a visual changelog — you can see exactly what your UI looked like at any point in git history. They should be committed alongside the code changes that produced them.

```gitignore
# .gitignore — do NOT ignore goldens if using team workflow
# .composeproof/goldens/ ← don't add this

# DO ignore the render cache (large, not useful in git)
.composeproof/cache/
.composeproof/sidecar/
```

For solo developers, you can choose to gitignore goldens and treat them as local-only. This is fine for Layer 1 individual use but limits CI integration.

---

## Tolerance

By default, comparison is exact: every pixel in the golden must match the current render. This is strict but correct — headless rendering is deterministic on the same machine with the same classpath.

However, some scenarios produce minor pixel differences that aren't meaningful:

- Font rendering differences across JVM versions
- Anti-aliasing differences at composable boundaries
- Translucency/shadow rendering variations

For these cases, configure tolerance:

```bash
# Global tolerance (applies to all goldens without a per-golden override)
# Set via MCP: "set render tolerance to 2"
# Or in .composeproof/config.json:
{
  "rendering": {
    "tolerancePerChannel": 2
  }
}
```

Tolerance is per-channel (R, G, B, A independently). A tolerance of `2` means a pixel difference is ignored if every channel differs by 2 or less (out of 255). This is tight enough to catch real regressions while absorbing minor rendering noise.

Per-golden tolerance overrides the global setting in `manifest.json`.

---

## CI Integration

The recommended CI setup uses the Tier 3 Gradle plugin:

```yaml
# .github/workflows/ci.yml
name: Visual Regression

on:
  pull_request:
    branches: [main]

jobs:
  visual-regression:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - name: Set up JDK 17
        uses: actions/setup-java@v4
        with:
          distribution: 'temurin'
          java-version: '17'

      - name: Visual regression check
        run: ./gradlew composeproofVerify

      - name: Upload diff report
        if: failure()
        uses: actions/upload-artifact@v4
        with:
          name: visual-regression-report
          path: build/reports/composeproof/
```

The `composeproofVerify` task fails the build if any golden diff exceeds tolerance. It also generates an HTML report in `build/reports/composeproof/` with side-by-side screenshots and diff overlays for every failing comparison.

---

## Workflow Cheat Sheet

| Situation | Command |
|-----------|---------|
| First time — record all baselines | "record goldens for all previews" |
| Record one specific preview | "record golden for LoginScreenPreview" |
| Check for regressions | "verify all previews" |
| See what changed in a specific preview | "show me the diff for HomeScreenPreview" |
| Accept an intentional change | "update the golden for HomeScreenPreview" |
| Reset and re-record everything | "delete all goldens and re-record" |
| Check if goldens are up to date | "list previews with outdated goldens" |

---

## How It Relates to Other Tools

| Tool | Mode | Reads goldens? | Writes goldens? |
|------|------|----------------|-----------------|
| `cp_render` | — | No | No |
| `cp_render_batch` | `record` | No | Yes |
| `cp_render_batch` | `verify` | Yes | No |
| `cp_diff` | `record` | No | Yes (one preview) |
| `cp_diff` | `verify` | Yes | No |
| `cp_diff` | `update` | Yes | Yes (replaces) |
| `cp_verify_render` | — | Yes | No |

The safety rule: verify never writes. Only explicit record/update writes. This prevents accidental golden overwrites from burying regressions.
