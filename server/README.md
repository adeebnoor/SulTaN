# SULTAN AI relay

A dependency-free Node (22+) relay that lets the hosted web app use the operator's Gemini or Anthropic API key without exposing it to the browser. The web app can also work without it: a user may enter their own key in the AI settings (direct transport). See `docs/AI_ASSISTANT.md` and `docs/PRIVACY.md`.

## Run

```sh
GEMINI_API_KEY=… ALLOWED_ORIGINS=http://localhost:8000 node server/ai-proxy.js
curl -s http://127.0.0.1:8787/healthz
```

| Variable | Purpose | Default |
|---|---|---|
| `ANTHROPIC_API_KEY` | Anthropic server-side key; used when Gemini is not configured. | empty (health check reports `keyConfigured: false`) |
| `GEMINI_API_KEY` | Google key kept on the server; takes precedence over Anthropic. | empty |
| `GEMINI_MODEL` | Native Gemini model used by the relay. | `gemini-flash-lite-latest` |
| `ALLOWED_ORIGINS` | Comma-separated browser origins allowed to call the relay (CORS and request check). | `https://sultan-strategy-beta.onrender.com` |
| `PORT` | Listening port. | `8787` |
| `ANTHROPIC_BASE_URL` | Upstream API base; tests point it at a fake. | `https://api.anthropic.com` |
| `MODEL_ALLOWLIST` | Comma-separated model ids the relay accepts. | `claude-opus-5-5`, `claude-sonnet-5-5`, `claude-fable-5-1` |
| `MAX_TOKENS_CAP` | Upper bound applied to `max_tokens` of every request. | `64000` |
| `MAX_BODY_BYTES` | Largest accepted request body (attached documents travel inside it). | 32 MiB |
| `RATE_LIMIT_PER_HOUR` | Requests per client (IP) per rolling hour before `429`. | `60` |

## Endpoints

- `GET /healthz` → `{ ok, keyConfigured, provider, defaultModel }`.
- `OPTIONS /v1/messages` → CORS preflight; `204` for an allowed origin, `403` otherwise.
- `POST /v1/messages` → body in the Claude Messages API shape. The relay checks the origin, the model allow-list and the body size, caps `max_tokens`, forwards `anthropic-version` and `anthropic-beta`, injects `x-api-key`, and passes JSON or SSE streams through unchanged. Disallowed model → `400`; wrong origin → `403`; over the limit → `429`.

The relay keeps no copy of request or response bodies and writes only status lines to its log. Any `x-api-key` sent by a browser is ignored; the server key is the only credential used upstream.

## Deployment

`render.yaml` declares the relay as a second Render service (`sultan-strategy-ai`, root `server/`, start `node ai-proxy.js`, health check `/healthz`). Set `GEMINI_API_KEY` and `GEMINI_MODEL=gemini-flash-lite-latest` in the Render dashboard (it is marked `sync: false` so it never lives in the repository), and set `ALLOWED_ORIGINS` to the web app's origin. The web app's Content Security Policy in `index.html` must list the relay origin under `connect-src`.

## Tests

`node tests/ai-proxy.test.js` starts a fake upstream and verifies key injection, header forwarding, the `max_tokens` cap, the model allow-list, origin checks, SSE pass-through and the hourly rate limit.

With Gemini configured, the relay translates Messages requests into native Google `generateContent`, including JSON schemas, PDF/text documents and Google Search grounding. Responses are translated back into the client shape. SSE events are emitted after the complete Gemini response, rather than token-by-token. Provider error text is redacted, and temporary 503 responses get at most two retries. Run `node tests/gemini-relay.test.js` for the native-adapter checks.
