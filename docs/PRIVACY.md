# Privacy and data handling — public beta 0.9

## Local projects

SULTAN runs in your browser. Project data is saved under `sultan.strategy.builder.v0.5`, retained for backward compatibility with earlier exports. Language preference uses `sultan.language`, the simple/expert display mode uses `sultan.ui.mode`, and the guided-path answers in progress use `sultan.guided.v2`. There is one active local draft per browser/origin. The app does not send project fields to an application server or AI model unless you explicitly switch on the optional AI assistant described below.

## Optional AI assistant

The AI assistant is **off by default**. Nothing is sent to any model until you open the AI settings, read the consent note and tick the consent box. While it is off, SULTAN behaves exactly as earlier versions: the guided path, the sector library and the field guidance all work locally without any network request.

When you switch it on and press one of the AI actions (gather context, generate a draft, suggest a field, expert review), SULTAN sends to the Claude API, directly or through the relay you configured:

- the project digest (institution identity, the choices, indicators, enablers and initiatives you have entered, with their numbers),
- the sector, institution type and brief you typed in the guided path,
- the documents you attached in the guided path for that run (PDF or text), held in page memory only and never saved into the project,
- the bundled library references for your sector, and
- for the field assistant, the label, guidance and current text of that one field.

Documents are not stored in the project; only their name, size and the summary the model returned are kept in the context dossier. Web search is optional and can be switched off in the AI settings; when it is on, the model may query the public web for regulations and indicators relevant to your sector.

Every call is logged inside the project (`context.ai.log`) with the model name, purpose and token counts, and the strategy report discloses that assistance in its **Context sources and AI assistance** section. AI output is always a draft: generated records carry an `ai-` provenance marker, proposed sources wait for your acceptance, and the review step treats the model's findings as warnings, never as approval conditions.

**Your API key.** If you bring your own key, it is stored only in this browser under `sultan.ai.key`, separately from the project, and it is never written into the project JSON, exports or reports. The import validator rejects any project file that carries a key. Use **Forget** in the AI settings to delete it.

**The relay.** The hosted relay (`server/ai-proxy.js`) holds the operator's key on the server, forwards your request to Anthropic, checks the request origin, enforces a per-client hourly rate limit and a model allow-list, and keeps no copy of request or response bodies. Anthropic's own data policies apply to what the model receives. Do not send confidential institutional information or personal records through the assistant in this public beta.

Local storage is not encryption, an access-control system, or a backup. Anyone with access to the browser profile may be able to read it. Other pages on the same hosting origin can potentially access that origin's storage. Private browsing, storage limits, device changes, or browser cleanup may remove or prevent saves. Export the JSON file and handle it according to your organization's rules.

The Method & privacy page includes **Clear local draft**. Clearing the draft does not delete files you exported, messages you sent, hosting logs, or GitHub issues. Switching the interface language does not translate or overwrite your project values.

## Network requests and feedback

The app contains no telemetry or analytics. A hosting provider still receives ordinary requests to serve the page and may keep its own logs. The provider's policies apply. The page's Content Security Policy allows outbound connections only to the Claude API and the configured relay, and those are made only after the AI consent described above.

The feedback dialog constructs a message from feedback fields only: category, summary, description, optional reproduction steps, interface language, and app version. It does not append organization names, project JSON, scores, roadmap content, screenshots, device fingerprints, or browser history.

**Prepare email** opens your configured mail application with a draft addressed to `adeeb.noor@gmail.com`. You review and send it there. A working mail application is required; copying the text is an alternative. The site cannot confirm delivery.

**Open public GitHub draft** requires explicit acknowledgement that the issue is public. It opens GitHub for review and submission, not a background API call. A GitHub account is required. Do not include confidential, personal, or security-sensitive information. Your GitHub profile and issue content are visible under GitHub's policies.

Feedback typed into the dialog is held in page memory, not saved as project data. This site provides no protected vulnerability-reporting backend. Use a private, appropriately sanitized email for security reports.

## Not an enterprise data environment

The beta has no authentication, cloud collaboration, evidence verification, protected signatures, or tamper-resistant audit records. No claim of regulatory compliance, official accreditation, or institutional approval is made. Use fictional, public, or suitably de-identified planning content only.
