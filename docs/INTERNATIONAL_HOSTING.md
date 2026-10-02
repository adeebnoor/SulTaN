# International planning and hosting (0.12.0-beta)

Language and planning jurisdiction are independent. The homepage preference affects new projects; an existing project's saved context wins. The guided path and workspace context editor support Saudi / international scope, country and a three-letter currency label. Currency changes never convert stored amounts. Imported projects lacking these fields keep the prior Saudi/SAR convention.

International templates are general sector prompts, not verified international regulations. They add no Saudi programmes or regulatory references. Local mandates and evidence must be supplied and checked for the named jurisdiction. Switching an existing project retains its records, references and money; the editor explicitly asks for an applicability and currency review. AI prompts use the project context and never infer it from interface language.

The hosted service worker prepares public app and export assets automatically after load. Its allow-list excludes project data and AI requests. The Council section shows readiness and retry; AI still needs connectivity. A first visit must complete preparation before offline reload works.

## Static hosting configuration

The current Render frontend is a `static_site`, served by its CDN. The separate AI relay is a free web service and may idle. Moving the frontend does not remove relay cold starts. Measure the page and relay separately; local timings do not establish a worldwide performance guarantee.

Both alternatives use repository `adeebnoor/SulTaN`, branch `main`, build `python3 build.py`, output `public`. Netlify reads `netlify.toml`; Cloudflare Pages uses these settings in its Git integration. No Worker, server function or SPA rewrite is required. The `share.html` reader must remain a real separate file.

1. Connect an authorised provider account and import the repository. Obtain the assigned provider URL.
2. Set `SULTAN_PUBLIC_URL=https://<assigned-host>/` and rebuild. This sets canonical/OG URLs, sitemap and standalone-reader links. `_headers` gives hashed assets a one-year immutable cache and prevents a stale service-worker entry file.
3. Run `SULTAN_PUBLIC_URL=https://<assigned-host>/ python3 build.py` locally, then compare the deployed files to `release/manifest.json`. Test Arabic/English, direct reader URLs, OG image, automatic SW and offline export at that origin.
4. Add an owned custom domain in the provider dashboard. Configure only the DNS records the provider gives, wait for HTTPS, set `SULTAN_PUBLIC_URL` to the final domain and rebuild. Do not repurpose another domain without the owner's decision.
5. Export JSON project backups from the old origin and import them on the new one. Browser storage and signing keys are origin-specific. Previously issued signed response links should continue to be processed on the old origin; keep it available during migration. Do not silently redirect away the only copy of user work.

The AI relay keeps its existing HTTPS endpoint. Update any origin restrictions only if the selected final origin requires it; do not weaken relay security to make a preview work.

## Verification

`market.test.js` checks migration, independent preferences, international template provenance, honest unknowns, round trips and prompt scope. `market_browser.py` checks both languages through the wizard, currency persistence, existing-record preservation, responsive layout, initial HTML paint, social metadata and automatic offline reopening. Existing council tests cover PDF/PPTX and signed sharing. External model quality and conversion are not inferred from synthetic tests.
