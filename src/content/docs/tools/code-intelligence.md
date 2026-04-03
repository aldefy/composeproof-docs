---
title: Code Intelligence (Pro)
---

AST-based code understanding powered by [Kartograph](https://github.com/aldefy/kartograph). Tree-sitter parsing + local ONNX vector embeddings for semantic search across your codebase. All data stays local — nothing sent to cloud.

**Pro feature** — requires a ComposeProof Pro license. Pro users get automatic indexing at server startup.

---

### `cp_index_project`

> Index a Compose project for semantic code search. Uses tree-sitter AST parsing + vector embeddings (nomic-embed-text-v1.5, 768-dim local ONNX model).

**Parameters**

| Name | Type | Required | Description |
|------|------|----------|-------------|
| project_path | string | yes | Path to the Compose project root |
| full | boolean | no | Force full re-index (ignore cached state). Default: `false` (incremental) |

**Behavior**
- First index downloads the ONNX model (~134MB) and takes 30-60s for a large project
- Subsequent indexes are git-aware and incremental — only re-index changed files (~1-5s)
- Pro users: project is auto-indexed at server startup, no need to call manually
- Index is stored locally at `~/.kartograph/indexes/`

**What gets indexed**
- Kotlin files: full AST parsing via tree-sitter — functions, classes, interfaces, objects, type aliases, with parent scope tracking
- Java files: regex-based extraction of classes, interfaces, methods
- Other files: sliding-window chunking (50 lines, 5 overlap)
- Each chunk is enriched with: `@Composable` detection, `@Preview` tagging, `expect`/`actual` classification, KMP source set detection, Compose ecosystem identification

---

### `cp_semantic_search`

> Search the codebase semantically using natural language. Uses hybrid search: vector cosine similarity + BM25 keyword matching + Reciprocal Rank Fusion (RRF).

**Parameters**

| Name | Type | Required | Description |
|------|------|----------|-------------|
| query | string | yes | Natural language search query. Short and keyword-focused (max 60 words) |
| project_path | string | no | Path to the project. If omitted, searches all indexed projects |
| top_k | integer | no | Number of results to return. Default: 10 |
| types | string | no | Filter by chunk types (comma-separated): `FUNCTION`, `CLASS`, `COMPOSABLE`, `INTERFACE`, `OBJECT`, `DATA_CLASS`, `ENDPOINT`, `TYPE_ALIAS` |

**Example queries**
- `"authentication flow"` — find auth-related code
- `"@Composable HomeScreen"` — find a specific composable
- `"ViewModel state management"` — find state management patterns
- `"API error handling"` — find error handling code

**Tips**
- Requires `cp_index_project` to have been run first (automatic for Pro users)
- Use `types: COMPOSABLE` to filter results to only `@Composable` functions
- Short, keyword-focused queries work better than long natural language sentences
- Results include file path, line numbers, relevance score, and a code preview
