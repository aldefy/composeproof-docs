---
title: CI/CD Integration
description: Run ComposeProof as a QA agent on every pull request — headless rendering, golden verification, accessibility checks, and HTML reports without human QA.
---

ComposeProof runs as a QA agent inside your CI pipeline. Every pull request triggers headless rendering of all `@Preview` functions, golden comparison, accessibility checks, and an HTML report — before a human ever reviews the code.

:::tip[What CI mode means]
Your AI assistant is the orchestrator. It calls `cp_render_batch`, `cp_verify_render`, and `cp_generate_report` in sequence, interprets the results, and comments on the PR. No custom scripting required.
:::

---

## How it works: Equal AI example

At Equal AI, ComposeProof runs alongside manual QA on every PR:

1. **Render all `@Preview` functions** — headlessly via Compose Desktop (Skia). No emulator, no device, no Android SDK on the CI runner.
2. **Compare against Figma goldens** — pixel-level diff against the committed `.composeproof/goldens/` directory. Any visual delta above threshold is flagged.
3. **Check fonts on smaller devices** — renders at 360dp width to catch text overflow, truncation, and layout shifts that only appear on compact screens.
4. **Flag accessibility issues** — contrast ratios, missing content descriptions, touch targets below 48dp, missing semantic roles. Issues are tagged P0 (blocking) or P1 (warning).
5. **Produce HTML report** — self-contained report with screenshots, diffs, assertion results, and context graph. Linked in the PR comment.
6. **Run alongside manual QA** — the report gives human reviewers a pre-filtered list of issues. They review P0s first; P1s are tracked but don't block merge.

This workflow catches ~80% of visual regressions automatically. Manual QA focuses on interaction flows and business logic — not pixel checking.

---

## Setup

### Step 1 — Install on CI

Add ComposeProof to your CI runner. No build file changes to your app project are required.

```bash
npx composeproof --ci
```

The `--ci` flag suppresses interactive prompts and outputs machine-readable JSON alongside human-readable logs.

For GitHub Actions, add to your workflow:

```yaml
- name: Install ComposeProof
  run: npx composeproof --ci
```

### Step 2 — Record goldens on main

On the main branch (or your golden branch), record baselines for all previews. Commit the output.

```
"save baselines for all screens"
AI: calls cp_render_batch mode=record → saves PNGs to .composeproof/goldens/
```

Then commit:

```bash
git add .composeproof/goldens/
git commit -m "chore: record golden baselines"
```

Goldens are shared across the team. Every developer and every CI run verifies against the same set.

### Step 3 — Verify on pull request

On every PR, run batch verification. Your AI calls:

```
cp_render_batch mode=verify
```

Output:

```
45 previews: 40 PASS, 3 FAIL, 2 NEW (no golden found)

FAIL  LoginScreen      — padding delta (expected 16dp, rendered 12dp)
FAIL  ProfileCard      — font size mismatch on 360dp width
FAIL  CheckoutButton   — contrast ratio 3.2:1 (P0 — below WCAG AA)
NEW   OnboardingStep3  — no golden recorded
NEW   EmptyStateCard   — no golden recorded
```

### Step 4 — Generate the report

```
"generate an HTML report"
AI: calls cp_generate_report
AI: "Report saved to .composeproof/reports/2024-01-15-pr-42.html"
```

The report contains:
- **Per-preview PASS/FAIL** with side-by-side diff images
- **Accessibility warnings** tagged P0 (blocking) or P1 (advisory) with exact composable locations
- **Render times** per preview (flag regressions — e.g. a composable that jumped from 80ms to 2s)
- **Context graph** — the AI's understanding of your project structure, component relationships, and detected architecture pattern
- **Summary header** — total counts, top failures, and a recommended action list

---

## With an AI agent

Use Claude Code or Gemini CLI to orchestrate the full pipeline in one prompt:

```
"run a full QA check on this PR: render everything, verify against goldens,
 check accessibility, and generate the report"
```

The AI calls the tools in the right order:

```
AI: calls cp_preflight          — checks device/environment
AI: calls cp_list_previews      — discovers all @Preview functions
AI: calls cp_render_batch       — renders all 45 previews
AI: calls cp_render_batch mode=verify  — compares to goldens
AI: calls cp_generate_report    — produces HTML report
AI: "3 failures, 2 new screens. P0 issue on CheckoutButton (contrast).
     Report: .composeproof/reports/2024-01-15-pr-42.html"
```

For spec-driven verification (recommended), provide your spec file:

```
"verify this PR against .composeproof/spec.md and generate the report"
AI: reads spec → maps 23 assertions to previews → calls verify for each
AI: "21/23 assertions pass. FAIL: button color, FAIL: header font size"
```

---

## GitHub Actions example

```yaml
name: Visual QA

on:
  pull_request:
    branches: [main]

jobs:
  visual-qa:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - name: Set up JDK
        uses: actions/setup-java@v4
        with:
          java-version: '17'
          distribution: 'temurin'

      - name: Install ComposeProof
        run: npx composeproof --ci

      - name: Run visual verification
        run: |
          # Claude Code or Gemini CLI runs the verification
          # and outputs results as JSON
          composeproof verify --all --mode=verify --report=html

      - name: Upload report
        uses: actions/upload-artifact@v4
        with:
          name: composeproof-report
          path: .composeproof/reports/
```

:::note[AI-orchestrated vs. direct CLI]
The `composeproof verify` CLI command runs the same tool chain your AI would. You can also use `claude --mcp` or `gemini --mcp` to run the AI-orchestrated version, which gives richer analysis (the AI interprets results, not just counts pass/fail).
:::

---

## Report anatomy

The HTML report is a self-contained file — no server needed. It includes:

| Section | Contents |
|---------|----------|
| Summary | Total previews, PASS/FAIL counts, P0/P1 breakdown, render time totals |
| Per-preview cards | Screenshot, golden image, diff overlay, PASS/FAIL badge, render time |
| A11y warnings | Composable name, issue type, severity (P0/P1), suggested fix |
| Spec assertions | Each assertion from your spec file, matched to a preview, PASS/FAIL |
| Render times | Histogram of render durations — spikes indicate regressions |
| Context graph | Project structure, detected screen count, architecture pattern, Compose version |

P0 issues (contrast failures, missing content descriptions on interactive elements) are highlighted in red at the top. P1 issues appear inline in the preview cards.

---

## Tips

- **Commit goldens to version control.** Without committed goldens, CI can only check accessibility and render errors — not visual regressions.
- **Run `mode=record` on main, `mode=verify` on PRs.** Never record new goldens from a PR branch — you'll overwrite the baseline with unreviewed changes.
- **Use `--ci` flag in scripts.** It sets non-interactive mode, exits with code 1 on P0 failures, and writes a machine-readable summary to stdout.
- **Keep the spec file in the repo.** `.composeproof/spec.md` is checked in. The AI reads it on every run — no separate CI config needed.
