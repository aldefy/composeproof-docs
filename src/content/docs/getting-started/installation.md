---
title: Installation
---

## Requirements

- **Node 18+** — for the `npx composeproof` installer
- **Java 17+** — the ComposeProof JAR runs on JVM. Check with `java -version`.
- **A Compose project** — any project with `@Preview`-annotated composables (Android, CMP, or Desktop)

No Gradle plugin needed. No build file changes. ComposeProof uses Gradle Tooling API to read your project without touching it.

---

## Quick install (recommended)

```bash
npx composeproof
```

The installer runs a 7-step wizard:

1. **Detect OS** — determines whether to create a shell wrapper (macOS/Linux) or `.cmd` file (Windows)
2. **Check Java** — verifies Java 17+ is on PATH. Exits with instructions if not found.
3. **Download JAR** — fetches the latest `composeproof.jar` from [aldefy/composeproof-releases](https://github.com/aldefy/composeproof-releases/releases) to `~/.composeproof/`
4. **Create binary** — writes a `composeproof` launcher script to `~/.local/bin/` (or `%APPDATA%\composeproof\bin\` on Windows) and adds it to PATH
5. **Detect AI clients** — scans for Claude Code, Gemini CLI, Cursor, and Android Studio on the machine
6. **Write MCP config** — for each detected client, writes or merges the `composeproof` server entry into the appropriate config file (global or per-project)
7. **Verify** — runs `composeproof --version` to confirm the install

After the wizard completes, restart your AI client to pick up the new MCP server.

---

## Alternative: Homebrew

```bash
brew install aldefy/tap/composeproof
```

Installs the JAR + launcher via Homebrew. MCP config is not written automatically — see [Configuration](/getting-started/configuration/) to set that up manually.

---

## Alternative: Manual JAR

Download `composeproof.jar` from [aldefy/composeproof-releases](https://github.com/aldefy/composeproof-releases/releases), then run:

```bash
java -jar composeproof.jar serve --stdio
```

Point your MCP client at this command. See [Configuration](/getting-started/configuration/) for the exact JSON.

---

## Verify the install

```bash
composeproof --version
```

Expected output:

```
ComposeProof v1.1.0
```

---

## Update

```bash
npx composeproof --update
```

Downloads the latest JAR and replaces the existing one in `~/.composeproof/`. The binary on PATH is unchanged.

---

## Uninstall

```bash
npx composeproof --uninstall
```

Removes the JAR, the launcher script, and the PATH entry. MCP config entries written by the installer are left in place — remove them manually if needed.

---

## Next steps

- [Configuration](/getting-started/configuration/) — manually configure MCP clients or adjust settings
- [First Render](/getting-started/first-render/) — render your first `@Preview` in 5 minutes
