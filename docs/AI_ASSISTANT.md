# The AI assistant

SULTAN 0.9 can ask a connected Gemini or Claude model to gather sector context, draft a whole strategy, suggest the text of a single field and review the result like a senior consultant. This page explains what it does, what it never does, how to switch it on, and how it is built.

## Principles

- **Off by default.** No request leaves the browser until the user opens the AI settings and ticks the consent box. Without consent the guided path, the sector library and the field guidance work fully offline.
- **A draft, not a decision.** Everything the model returns is normalised by the same draft engine as a library draft and then shown to the team for review. Generated records carry `ai-` ids and a provenance pill; sources it proposes stay *proposed* until a person accepts them; its review findings are warnings in the Review section and never approval conditions.
- **Honesty rules are enforced in code, not in the prompt.** Unknown numbers stay unknown (never zero), readiness is never assumed (`ready` becomes `unknown`), budgets are never invented (amounts become `null`), indicator direction is corrected against baseline and target, years are clamped to the horizon, mandatory requirements are kept out of preference scoring, orphan records are dropped.
- **Disclosed.** Every call is logged in `project.context.ai.log` (model, purpose, input and output tokens) and summarised in the report section *Context sources and AI assistance*.
- **The key never enters the project.** A bring-your-own key lives only in the browser (`sultan.ai.key`); the import validator rejects any project file that carries a key.

## Switching it on

Open **AI settings** from step 3 or step 5 of the guided path, from the context dossier card in References, or from the AI review card in Review.

| Setting | Options | Default |
|---|---|---|
| Transport | **Relay** (operator key stays on the server) or **Direct** (your own key in this browser) | Relay, `https://sultan-strategy-ai.onrender.com` |
| Model | `gemini-flash-lite-latest` (relay), or the supported Claude models (direct Anthropic) | `gemini-flash-lite-latest` (relay) |
| Effort | low · medium · high · xhigh · max | high |
| Web search | on / off | on |
| Consent | must be ticked before any call | off |

**Test connection** sends a one-word request and reports the result. **Forget** deletes the key and the consent.

## The four actions

**Gather context** (guided path, step 3; also from the dossier card). Two calls. The first asks the model for a research memo on the regulations, national programmes, indicators and studies that matter for this sector, type and brief; it may use the web-search server tool (up to ten searches) and reads the documents you attached (PDF or plain text, sent as document blocks, held in page memory only). The second call turns the memo into structured records with a strict JSON schema, using the extraction model (`gemini-flash-lite-latest` by default). The result is a list of **proposed sources**, document summaries and open questions that you accept or reject before building.

**Generate strategy** (guided path, step 5, *Build with AI*). One streamed call with the method rules as system prompt, the project digest, the library grounding for the sector, the accepted sources and your goal hints as the user message, and the full SULTAN draft schema as a structured-output constraint. The JSON passes through `SultanDraft.fromAI` and replaces the strategic records (choices, references, indicators, enablers, initiatives) while keeping the identity you confirmed. If the project already had work, a JSON backup is downloaded first. A response cut by `max_tokens` is flagged as truncated and still normalised.

**Suggest a field** (the ✦ button next to any text field). Sends the field label, its *why this field* guidance, its current text, the section and the project digest; shows the suggestion with *use*, *append* and *dismiss*. Nothing is written until you choose.

**Expert review** (Review section). One streamed structured-output call asking for the critique a consultant with forty years of practice would give: summary, strengths and findings with section, severity and a concrete fix. The review is stored in the dossier; blocking findings appear as warnings on the relevant sections.

## What is sent

The project digest (identity, choices, indicators with numbers, enablers, initiatives, criteria), the sector/type/brief, the bundled library references for the sector, the accepted context sources, the documents you attach for a gathering run, and, for the field assistant, that one field. Nothing else: no browser history, no other projects, no telemetry. See `docs/PRIVACY.md`.

## Errors you may see

| Code | Meaning | What to do |
|---|---|---|
| consent | Consent not given | Tick the consent box in AI settings |
| auth | Key missing or rejected | Check the key, or the relay's server key |
| rate | Rate limit (API or relay) | Wait and retry; the relay limits requests per client per hour |
| size | Request too large | Attach fewer or smaller documents |
| refusal | The model declined | Rephrase the brief; nothing was written |
| parse | The answer was not valid JSON | Retry; the draft was not applied |
| stream / network / server | Connection or upstream problem | Retry; with the relay, check `/healthz` |

## For maintainers

`src/ai.js` is a dependency-free client using the Messages request shape. The relay adapts this shape to Gemini when its server key is configured; direct transport supports Anthropic only.

- Headers: `anthropic-version: 2023-06-01`; direct transport adds `x-api-key` and `anthropic-dangerous-direct-browser-access: true`; relay transport adds `x-sultan-client: web` and never sends a browser key.
- Every request sets `fallbacks: "default"` with the `anthropic-beta: server-side-fallback-2026-07-01` header, uses adaptive thinking (no `budget_tokens`), and sets `output_config.effort` explicitly.
- Structured outputs use `output_config.format = {type: "json_schema", schema}` with `additionalProperties: false`, every property required and no numeric or length constraints; `SultanDraft.aiSchema()` and the context/review schemas follow those rules.
- Long outputs stream over SSE (`readStream`), reporting progress to the UI; `parseJson` tolerates prose around the JSON; `mapError` maps HTTP and stop reasons to the codes above.
- The web-search tool is `{type: "web_search_20260209", name: "web_search", max_uses: 10}` and is omitted when the setting is off.
- `_setFetch` and `_setStorage` exist for tests only. `tests/ai-layer.test.js` exercises consent, headers, streaming, structured outputs, documents, web search and error mapping against a fake fetch; `tests/guided_browser.py` runs the whole AI path in a real browser against an in-page fake of the API. CI never calls the real API.

The relay is documented in `server/README.md`. The page's Content Security Policy allows `connect-src` only to `https://api.anthropic.com` and the relay origin; a self-hosted relay on another origin needs that directive changed in `index.html`.
