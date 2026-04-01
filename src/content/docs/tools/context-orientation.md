---
title: Context & Orientation
---

Use these tools to orient an AI assistant within your Compose project — from a quick overview to fine-grained context budgeting and session reports.

---

### `cp_insights`

> Return a concise project overview: module graph, Compose targets, preview count, and recommended next steps.

**What to ask your AI:**
- "what does this project look like?"
- "learn the codebase"
- "give me an overview of the app"

**Parameters**

| Name | Type | Required | Default | Description |
|------|------|----------|---------|-------------|
| project_path | string | Yes | — | Absolute or relative path to the root of the target project |

**Tips**
- Always a good first call at the start of a session — the response tells you exactly which other tools to reach for next.
- The output includes a module graph summary and flags whether the project uses Compose Multiplatform, Android-only Compose, or both.

---

### `cp_get_context`

> Return token-budgeted context about the project, scoped to the most relevant layer.

**What to ask your AI:**
- "show the project structure"
- "what are the Compose patterns used here?"
- "give me the full context"

**Parameters**

| Name | Type | Required | Default | Description |
|------|------|----------|---------|-------------|
| project_path | string | Yes | — | Path to the root of the target project |
| scope | enum | No | full | One of: `structure`, `compose`, `previews`, `patterns`, `full` |
| max_tokens | int | No | — | Hard cap on tokens returned — useful when context window is tight |
| focus_files | array[string] | No | — | Limit context to these specific source files |

**Tips**
- Use `scope: structure` when you only want the module/package layout without source details.
- Use `scope: previews` right before calling `cp_render` so the AI already knows which preview names are available.
- `focus_files` pairs well with `scope: compose` when reviewing a single screen's composable hierarchy.

---

### `cp_configure_context`

> Persist a context profile for the project so subsequent `cp_get_context` calls respect the budget automatically.

**What to ask your AI:**
- "set context to performance mode"
- "switch to minimal context"

**Parameters**

| Name | Type | Required | Default | Description |
|------|------|----------|---------|-------------|
| project_path | string | Yes | — | Path to the target project |
| context_profile | enum | Yes | — | One of: `performance`, `balanced`, `minimal` |
| custom_token_budget | int | No | — | Override the profile's default token ceiling |

**Tips**
- `performance` returns the richest context (good for architecture exploration); `minimal` strips everything except file names and preview counts.
- Profile is stored in `.composeproof/context-profile.json` and is gitignored by default — each developer can set their own.

---

### `cp_generate_report`

> Produce a self-contained HTML report of the session — screenshots, diffs, context summary, and any verification results.

**What to ask your AI:**
- "generate a report for this session"
- "summarize what we did"
- "create a shareable report"

**Parameters**

| Name | Type | Required | Default | Description |
|------|------|----------|---------|-------------|
| project_path | string | Yes | — | Path to the target project |
| output_path | string | No | `.composeproof/reports/report-<timestamp>.html` | Where to write the HTML file |
| include_screenshots | bool | No | true | Embed rendered preview PNGs in the report |
| include_context | bool | No | true | Include the project context summary section |
| report_reason | string | No | — | Free-text label shown as the report title (e.g. "Pre-release visual audit") |

**Tips**
- The HTML file is fully self-contained (base64 images, inline CSS) — safe to attach to a PR or Jira ticket.
- Set `report_reason` to keep a clear audit trail when reviewing multiple features in one session.
