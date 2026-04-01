---
title: Testing & Mocking
---

Generate edge-case test scenarios from composable signatures and stand up a local mock API server — no test-framework boilerplate required.

---

### `cp_generate_edge_cases`

> Analyse a `@Composable` function's parameters and generate a comprehensive set of edge-case render scenarios.

**What to ask your AI:**
- "generate edge cases for ProfileCard"
- "what should I test for this composable?"
- "find edge cases in UserListItem"

**Parameters**

| Name | Type | Required | Default | Description |
|------|------|----------|---------|-------------|
| file | string | Yes | — | Path to the `.kt` source file containing the composable |
| composable | string | No | — | Name of the target composable function; defaults to the first `@Composable` in the file |
| project_path | string | No | `.` | Path to the root of the target project |

**Tips**
- The tool inspects parameter types statically — nullable strings trigger empty/null/very-long scenarios; booleans produce both `true` and `false` cases; sealed classes produce one scenario per subtype.
- Pair the output with `cp_render_batch` to render every generated scenario immediately and visually verify them.
- Edge cases are returned as ready-to-paste `@Preview` function stubs — copy them into your source file to make them permanent.

---

### `cp_mock_api`

> Start, configure, or stop a local WireMock-based HTTP mock server and register stub responses for specific endpoint patterns.

**What to ask your AI:**
- "mock the API to return a 500 error"
- "mock an empty list from /api/feed"
- "add a stub for POST /login that returns a token"
- "stop the mock server"

**Parameters**

| Name | Type | Required | Default | Description |
|------|------|----------|---------|-------------|
| action | enum | Yes | — | One of: `start`, `stop`, `add_stub`, `remove_stub`, `list_stubs` |
| port | int | No | 8080 | Port the mock server listens on |
| proxy_all | string | No | — | Forward unmatched requests to this base URL (e.g. `https://api.example.com`) |
| stubs | array[object] | No | — | Initial stubs to register when using `action: start` (see format below) |
| stub | object | No | — | Single stub to register when using `action: add_stub` |
| stub_id | string | No | — | ID of the stub to remove when using `action: remove_stub` |
| device_id | string | No | auto-select | ADB device serial (used to configure the device proxy automatically) |

**Stub object format**

```json
{
  "request": {
    "method": "GET",
    "urlPattern": "/api/feed.*"
  },
  "response": {
    "status": 200,
    "jsonBody": { "items": [] },
    "headers": { "Content-Type": "application/json" }
  }
}
```

**Example — start with two stubs**

```json
{
  "action": "start",
  "port": 8080,
  "stubs": [
    {
      "request": { "method": "GET", "urlPattern": "/api/profile" },
      "response": { "status": 200, "jsonBody": { "name": "Adit", "avatar": null } }
    },
    {
      "request": { "method": "POST", "urlPattern": "/api/login" },
      "response": { "status": 500, "jsonBody": { "error": "Internal Server Error" } }
    }
  ]
}
```

**Tips**
- Always call `action: stop` when you are done. Forgetting to stop the mock server leaves the device proxy pointing at a dead port, which breaks all real network requests.
- Use `proxy_all` to forward unmatched requests to your real backend — this lets you mock only the endpoints you care about while the rest work normally.
- `action: list_stubs` returns each stub's auto-generated ID, which you can pass to `remove_stub` to remove individual stubs without restarting the server.
- After starting the server, the device proxy is configured automatically via `cp_manage_proxy` — no manual setup needed.
