---
title: Configuration
---

The `npx composeproof` installer handles MCP configuration automatically for detected clients. This page covers manual setup and advanced settings.

---

## MCP client configuration

All clients use the same JSON structure. The key is `composeproof` inside `mcpServers`.

### Claude Code

**Global** (applies to all projects):

```json
// ~/.claude/settings.json
{
  "mcpServers": {
    "composeproof": {
      "command": "composeproof",
      "args": ["serve", "--stdio"]
    }
  }
}
```

**Per-project** (checked into repo, team-shared):

```json
// .mcp.json at project root
{
  "mcpServers": {
    "composeproof": {
      "command": "composeproof",
      "args": ["serve", "--stdio"]
    }
  }
}
```

### Gemini CLI

```json
// ~/.gemini/settings.json
{
  "mcpServers": {
    "composeproof": {
      "command": "composeproof",
      "args": ["serve", "--stdio"]
    }
  }
}
```

### Cursor

Go to **Settings > MCP Servers > Add Server** and paste:

```json
{
  "composeproof": {
    "command": "composeproof",
    "args": ["serve", "--stdio"]
  }
}
```

### Android Studio (Gemini Agent Mode)

Create `.mcp.json` at the project root with the same content as the Claude Code per-project config above.

---

## Activation

ComposeProof works without activation. Activation unlocks Pro tools (runtime inspection, semantic UI queries, recomposition profiling).

```bash
composeproof activate
```

This opens a GitHub OAuth flow in your browser. After authorizing, a token is stored in `~/.composeproof/credentials.json`.

Check activation status:

```bash
composeproof status
```

Output:

```
ComposeProof v1.1.0
License: Pro (activated)
Linked: your-github-username
```

---

## Context profiles

ComposeProof attaches Compose context to every AI tool response (project structure, architecture patterns, screen inventory). Context profiles control how much is included.

| Profile | Tokens | Use case |
|---------|--------|----------|
| `performance` | ~8K | Deep analysis sessions with large models (Claude Sonnet, Gemini Pro) |
| `balanced` | ~2K | Default. Good for most tasks. |
| `minimal` | ~512 | Fast models or token-constrained environments. |

### Switch profiles via prompt

```
set context profile to performance
```

The AI calls `cp_configure_context` internally and confirms the change.

### Switch profiles via CLI

```bash
composeproof configure --context-profile performance
```

The setting is stored in `.composeproof/config.json` inside your project and persists across sessions.

---

## `.composeproof/config.json`

Created automatically on first use. Example:

```json
{
  "contextProfile": "balanced",
  "goldenDir": ".composeproof/goldens",
  "rendererBackend": "desktop"
}
```

This file is project-local. Add it to `.gitignore` or commit it to share settings with your team.

---

## Next steps

- [First Render](/getting-started/first-render/) — render a `@Preview` function with your AI assistant
- [First Device Session](/getting-started/first-device-session/) — interact with a running app on a real device
