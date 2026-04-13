# World Command Center — API server

Node.js service for **war simulation** using **LangGraph** (`entrypoint`) and **Azure OpenAI**. Six Thinking Hats run as **six parallel LLM calls** (one system prompt per hat), then a **finalize** call builds `consensus`, `phases`, `risks`, and `winner`.

## Setup

1. Copy `.env.example` to `.env` and set:

   - `AZURE_OPENAI_API_KEY`
   - `AZURE_OPENAI_ENDPOINT` — resource base URL (e.g. `https://your-name.cognitiveservices.azure.com`)
   - `AZURE_OPENAI_DEPLOYMENT_NAME` — deployment name in Azure (must match your chat model)
   - `AZURE_OPENAI_API_VERSION` — API version supported by the resource

2. Install and run:

```bash
npm install
npm run dev
```

Server defaults to `http://localhost:3000`. `GET /health` reports whether Azure env vars loaded (`"azure": true` means the client was constructed successfully).

## Troubleshooting

- **`GET /health` returns `"azure": false`:** The API could not read a key, endpoint, and deployment. The server loads **repo-root `.env` first**, then **`server/.env`** (which overrides). Use either:
  - **`server/.env`** with `AZURE_OPENAI_API_KEY`, `AZURE_OPENAI_ENDPOINT`, `AZURE_OPENAI_DEPLOYMENT_NAME`, or
  - **repo-root `.env`** with the same names, or with **`VITE_AZURE_OPENAI_KEY`**, `VITE_AZURE_OPENAI_ENDPOINT`, `VITE_AZURE_OPENAI_DEPLOYMENT` (and optional API version) — the server maps those for local dev.
- **Restart the server** after editing any `.env` file.
- **`"azure": true` but simulation errors:** Check deployment name and API version in Azure Portal; ensure the endpoint URL is the **base** host only (no `/openai/...` path).
- **404 / deployment not found** ([LangChain MODEL_NOT_FOUND](https://docs.langchain.com/oss/javascript/langchain/errors/MODEL_NOT_FOUND/)): `AZURE_OPENAI_DEPLOYMENT_NAME` must match the **exact** deployment name in Azure (e.g. `gpt-4o`). The API version must be one your resource supports for **Chat Completions**. If the URL is wrong, you will get 404 from Azure—not from this app’s routing.

## API

- `POST /api/war-simulation` — JSON body matches the client: `{ attacker, defender, allies, enemies, filters }` (country objects + filter booleans). Returns `{ hats, consensus, phases, risks, winner }` for the UI.

## Code map

| Path | Role |
|------|------|
| `src/loadEnv.ts` | Loads repo-root `.env` then `server/.env` (override) |
| `src/graph/warGraph.ts` | LangGraph `entrypoint` — parallel `invokeHatJson` × 6, then `invokeFinalizeJson` |
| `src/agents/hatPrompts.ts` | Per-hat system prompts |
| `src/llm/azureChat.ts` | `AzureChatOpenAI` factory |
| `src/routes/warSimulation.ts` | Express route + Zod validation |

The Vite app proxies `/api` to this server in development (see root `vite.config.js`).
