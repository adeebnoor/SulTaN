# Expert lenses — teaching SULTAN how the method owner thinks

A strategy tool can validate structure (every choice has an indicator, every initiative an owner) and still miss what an experienced adviser sees in the first five minutes: that the strategy could belong to anyone, that resources are being spread instead of concentrated, that a growth direction never asked whether a partner or an acquisition would get there faster, that a revenue line is one-off tickets rather than recurring business.

**Expert lenses** encode that judgement. A lens is a question the adviser habitually asks of any strategy, what a good answer looks like, an example, and, where the project itself can answer, a deterministic advisory check. Lenses are applied in four places:

1. **The Review section** — a card groups the hints each lens raised for this project, with a link to the section concerned.
2. **AI drafting** — the active lenses travel in the system prompt of every generation call, so a generated draft already weighs partner/acquire routes, recurring revenue, concentration and funder alignment.
3. **AI expert review** — the model is asked to apply each lens explicitly and to tag every finding with the lens it came from; the finding shows the lens name in the Review card.
4. **The report** — the *Context sources and AI assistance* section lists the lenses applied and what they flagged.

Lenses are advisory. They never enter `check()`, section badges or approval. A lens that does not fit a case can be marked "not here"; after three such marks it goes quiet.

## The built-in lenses

Distilled from Prof. Adeeb Noor's critical analysis of a university's strategic transformation (July 2025) and from his growth notes for a technology company.

| Lens | Question | Advisory check |
|---|---|---|
| What do we have that no one else has? | Could this strategy belong to any institution? Name the unique assets and use them in "why us". | Empty distinctive assets; "why us" empty or still a template placeholder. |
| Concentrate resources, do not spread them | Where does money flow to the proven performers, and what is stopped or merged to release it? | Four or more directions and no divest choice; several directions and "what we will not do" empty. |
| Evaluate internally before you cut | How do we know who delivers? An internal evaluation precedes closure or merger; outsiders do not dictate it. | A divest choice without a learning initiative and named evidence. |
| Stabilize before you climb | If the position is slipping, the first goal may be to stabilize; phrase as increase "by", not "to". | A target more than 50% away from a non-trivial baseline (small counts and maturity tracks excluded). |
| Decompose the external index | How is the ranking computed? Act on the components you control now. | An indicator that is an external ranking or index. |
| Critical mass, not fragmentation | In how many pillars can we hold critical mass? Four strong beat ten weak. | More than five growth directions selected. |
| One moonshot, scaled to us | Where is the big project, relative to us? One or two large bets plus small internal grants. | No moonshot at all; more than two selected. |
| Led by our own high performers | Who inside leads each direction? Top-down alone fails. | Half the selected directions without an owner; no culture/people enabler. |
| Partner or acquire, and why would they partner with us? | Did we weigh partnering or acquiring instead of building alone? What do we bring to the table? | A growth direction with no partner/acquire route; a partnership without a stated contribution. |
| Find the recurring business | Is this recurring (subscription, managed service, renewal) or one-off tickets? Fraud detection for banks is recurring. | A revenue direction that does not say whether it recurs. |
| Few verticals, large tickets, a national agenda | Why focus on a vertical with small tickets? Choose few verticals with large tickets and a national digitization agenda. | A vertical named without a national-agenda link; a technology company naming no vertical. |
| Follow the funder | Who funds this? Align with the national funder; learn why earlier bids failed. | A selected moonshot with no funder named and no known funding. |
| Where does the time come from? | Who actually does the work, and when? | Initiatives of selected directions without delivery capacity. |
| How long will external conditions hold? | What external conditions are assumed, for how long, and what is the adaptation plan? | Assumptions without an expected persistence. |
| Liabilities are capital too | What are the liabilities, and can they be reduced towards the goals? | Liabilities empty. |
| Sustainable within its ecosystem, not parasitic | What safeguards keep the institution from draining its country and partners? | Question only. |
| Unknown unknowns | What inquiries are still open, and who answers them? | Review note empty with several directions. |
| AI as a service line, and securing it | Where does AI create a recurring, defensible service? How do we protect client data inside prompts? | A technology company with no AI direction; AI present without security for AI. |

## Teaching the system your own patterns

The lens memory lives in the browser (`sultan.lens.v1`), separate from any project, so what the expert teaches applies to every project they open. Four ways to teach:

- **Add a thinking pattern** — title, the question as you ask it, what a good answer looks like, optional keywords. When keywords are given and none appears anywhere in a project, the lens raises a hint.
- **Make it a pattern** — on any AI review finding; the finding and its fix become a lens of yours.
- **Teach from notes** — paste feedback notes you wrote on any strategy. SULTAN splits them into candidate patterns (one per idea); with the AI assistant enabled, it extracts structured questions with keywords and a group. Keep the candidates that express your thinking.
- **Feedback** — 👍 *useful* moves a lens up the order the AI sees; 👎 *not here* three times mutes it; muted lenses can be re-enabled.

The memory can be exported and imported as JSON (`SULTAN_expert_lenses.json`) to carry it between browsers or share it with a team. A checkbox keeps lenses out of AI prompts entirely when the expert prefers.

## The technology sector in the library

The same notes gave the sector library a sixth sector, **technology and digital services** (systems integrators, cybersecurity providers, fintech, software companies). Its goal templates are the adviser's thinking made concrete: move from project tickets to managed services and recurring subscriptions; focus on two or three verticals with large tickets and a national digitization agenda; grow through partnerships and selective acquisitions with a written answer to "why would they choose us"; AI fraud detection as a recurring service for banks; security for AI as a new market; compliance with the Essential Cybersecurity Controls as a requirement; and stopping small-ticket one-off work as a divestment. References point to CST, NCA, SDAIA, SAMA, the Vision programmes, OWASP and NIST.

## For maintainers

`src/expert-lens.js` holds the catalogue, the checks and the memory (`SultanLens`); `src/lens-ui.js` renders the Review card and decorations; `src/locales/lens.js` holds the interface copy. `SultanLens.promptBlock()` and `reviewQuestions()` are what `src/ai.js` injects. Checks must stay cheap, deterministic and tolerant of missing fields, and every hint carries `level: 'lens'` so nothing downstream mistakes it for an issue. `tests/expert-lens.test.js` covers the catalogue, the judgements, the memory and the report fragment; `tests/guided_browser.py` exercises the card, learning and the lens-tagged AI findings in a real browser.
