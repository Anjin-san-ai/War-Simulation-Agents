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

Server defaults to `http://localhost:3000`. `GET /health` reports whether Azure env vars loaded.

## API

- `POST /api/war-simulation` — JSON body matches the client: `{ attacker, defender, allies, enemies, filters }` (country objects + filter booleans). Returns `{ hats, consensus, phases, risks, winner }` for the UI.

## Code map

| Path | Role |
|------|------|
| `src/graph/warGraph.ts` | LangGraph `entrypoint` — parallel `invokeHatJson` × 6, then `invokeFinalizeJson` |
| `src/agents/hatPrompts.ts` | Per-hat system prompts |
| `src/llm/azureChat.ts` | `AzureChatOpenAI` factory |
| `src/routes/warSimulation.ts` | Express route + Zod validation |

The Vite app proxies `/api` to this server in development (see root `vite.config.js`).
