---
title: Spec-Driven Verification
description: Provide a spec — Figma export, Markdown, JIRA ticket, or inline text — and let your AI assistant verify every assertion systematically against your Compose previews.
---

Spec-driven verification is the most powerful workflow ComposeProof supports. Instead of writing test code or checking screens manually, you hand a spec to your AI assistant and it verifies every assertion — colors, spacing, typography, accessibility, copy — against your live Compose previews and device screenshots.

:::tip[Why specs beat ad-hoc checks]
Ad-hoc checks miss things. A spec is exhaustive by definition. When you describe what a screen _must_ look like, the AI verifies all of it — not just the things you thought to ask about.
:::

---

## How it works

The workflow has five steps:

### Step 1 — Provide your spec

Your spec can come from any source. Inline text is the simplest:

```
"Verify the login screen against this spec:
 - Background: #FFFFFF
 - 'Sign in' button: filled, primary color #1A73E8, 48dp height, corner radius 8dp
 - 'Forgot password' link: 14sp, color #1A73E8, tappable area at least 48x48dp
 - Error state: red inline message below the password field, never a dialog
 - All interactive elements have content descriptions
 - No text is truncated at 360dp screen width"
```

Or point to a file:

```
"Verify LoginScreen against .composeproof/specs/login-screen.md"
```

Or reference a JIRA ticket:

```
"Verify the checkout flow against the acceptance criteria in TICKET-4821"
```

### Step 2 — AI parses the assertions

The AI reads your spec and extracts structured assertions. For the login screen example above, it identifies six assertions:
- Background color check
- Button styling check (color, height, radius)
- Link styling check (size, color, touch target)
- Error state behavior check
- Accessibility check (content descriptions)
- Text overflow check (360dp width)

It maps each assertion to the appropriate verification tool before running anything.

### Step 3 — AI discovers relevant previews

```
AI: calls cp_list_previews
AI: "Found 3 previews for LoginScreen:
     LoginScreenPreview, LoginScreenErrorPreview, LoginScreenLoadingPreview"
```

The AI matches spec assertions to previews automatically. Error state assertions run against `LoginScreenErrorPreview`; the base layout assertions run against `LoginScreenPreview`.

### Step 4 — AI verifies each assertion

The AI calls the right combination of tools per assertion:

```
AI: calls cp_render preview=LoginScreenPreview
    → renders at default width
AI: calls cp_verify_render assertions=[background_color, button_style, link_style]
    → PASS: background #FFFFFF, PASS: button color #1A73E8, FAIL: button height 44dp (expected 48dp)

AI: calls cp_render preview=LoginScreenPreview width=360
    → renders at 360dp compact width
AI: calls cp_verify_render assertions=[text_overflow]
    → PASS: no truncation detected

AI: calls cp_inspect_ui_tree
    → checks content descriptions on all interactive elements
    → FAIL: 'Forgot password' TextButton has no contentDescription

AI: calls cp_render preview=LoginScreenErrorPreview
    → renders error state
AI: calls cp_verify_render assertions=[error_state]
    → PASS: inline error message present, no dialog
```

### Step 5 — Structured report

The AI produces a pass/fail summary:

```
Login Screen Spec — 6 assertions

PASS  Background color (#FFFFFF)
PASS  Button color (#1A73E8)
FAIL  Button height — expected 48dp, found 44dp
PASS  'Forgot password' link color and size
FAIL  'Forgot password' content description — missing
PASS  No text truncation at 360dp
PASS  Error state is inline, not a dialog

2 failures. Suggested fixes:
  - LoginScreen.kt:87 — increase button height from 44.dp to 48.dp
  - LoginScreen.kt:103 — add contentDescription = "Forgot password" to TextButton
```

---

## Using the spec-verifier prompt

ComposeProof ships with a built-in `spec-verifier` prompt that structures the verification session automatically.

Invoke it with a spec source:

```
"use spec-verifier with spec_source=.composeproof/specs/checkout.md"
```

The prompt instructs the AI to:
1. Parse all assertions from the spec file
2. Call `cp_list_previews` to discover screens
3. Map assertions to previews
4. Call `cp_render` and `cp_verify_render` for visual/layout assertions
5. Call `cp_inspect_ui_tree` for accessibility and semantic assertions
6. Call `cp_take_device_screenshot` for dynamic state assertions that require a running app
7. Output a structured PASS/FAIL report grouped by assertion category

You can also run the verifier without a file — just describe your spec inline in the prompt.

---

## Golden comparison from design exports

For pixel-level fidelity checks against Figma or Sketch exports:

```
"compare LoginScreen to the Figma export at designs/login-v3.png"
```

The AI calls `cp_diff` with the design export as the golden:

```
AI: calls cp_diff preview=LoginScreenPreview golden_path=designs/login-v3.png
AI: "Diff result: 94.2% match
     Regions with delta:
       - Button vertical padding: 2dp low (visible in diff overlay)
       - Subtitle font weight: rendered 400, golden shows 500"
```

`cp_diff` does pixel-level comparison and overlays the delta as a heatmap image. The AI interprets the heatmap and translates pixel coordinates back into dp values and composable locations.

To use design exports as persistent goldens (checked into the repo):

```bash
cp designs/login-v3.png .composeproof/goldens/LoginScreenPreview.png
git add .composeproof/goldens/LoginScreenPreview.png
```

Now `cp_render_batch mode=verify` will compare against your Figma export on every PR.

---

## Batch verification

For end-of-sprint or pre-release verification across all screens:

```
"verify all screens against goldens and generate a report"
```

The AI runs:

```
AI: calls cp_list_previews      — discovers all @Preview functions
AI: calls cp_render_batch mode=verify  — verifies all against committed goldens
AI: calls cp_generate_report    — produces HTML report
AI: "47 previews verified. 44 PASS, 3 FAIL.
     Report: .composeproof/reports/2024-01-15-pre-release.html"
```

Or verify all screens against a single spec:

```
"verify every screen against .composeproof/specs/design-system.md"
```

The design system spec might assert things like: all buttons use the primary color, all body text uses 14sp or 16sp, all touch targets are at least 48dp — rules that apply globally. The AI maps them to every discovered preview and checks each one.

---

## Tips

- **Keep specs in the repo.** `.composeproof/specs/` is checked in alongside your code. When a spec changes, the verification changes with it — no manual test updates.
- **Write assertions in plain language.** The AI understands "button height 48dp" without special syntax. Use the language your designers use in their annotations.
- **Combine spec verification with CI.** Commit your spec files, then use `spec-verifier` in your CI workflow to run automated spec checks on every PR. See [CI/CD Integration](/guides/ci-cd/) for setup details.
- **Use inline specs for quick one-off checks.** You don't need a file. Paste the relevant acceptance criteria directly into your prompt when reviewing a single screen.
