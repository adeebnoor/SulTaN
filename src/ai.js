/* AI layer — Claude Messages API client for SULTAN (opt-in, explicit, auditable).
   Why raw fetch and not the SDK: the app is a dependency-free static site with a strict CSP
   (script-src 'self'), so the browser calls POST /v1/messages directly. Two transports:
   - direct: the user's own API key (stored only in this browser) with the documented
     anthropic-dangerous-direct-browser-access header;
   - proxy: a small relay that holds the server key (server/ai-proxy.js).
   Nothing is sent anywhere until the user has given consent in the AI settings dialog, and every
   call is reported back to the caller so it can be logged in the project's context dossier. */
(function(root){
'use strict';
const isNode=typeof module!=='undefined'&&module.exports;
const I18N=()=>root.SultanI18n;
const T=(k,v)=>{try{return I18N().t(k,v);}catch{return k;}};
const lang=()=>I18N()?.language==='en'?'en':'ar';
const num=x=>typeof x==='number'&&Number.isFinite(x);
const text=x=>typeof x==='string'&&x.trim().length>0;
const SETTINGS_KEY='sultan.ai.v1',KEY_KEY='sultan.ai.key';
const DEFAULT_PROXY='https://sultan-strategy-ai.onrender.com';
const API_VERSION='2023-06-01';
const FALLBACK_BETA='server-side-fallback-2026-07-01';
const MODELS=[
 {id:'gemini-flash-lite-latest',label:'Gemini Flash Lite (relay)'},
 {id:'claude-opus-5-5',label:'Claude Opus 5.5'},
 {id:'claude-sonnet-5-5',label:'Claude Sonnet 5.5'},
 {id:'claude-fable-5-1',label:'Claude Fable 5.1'}
];
const DEFAULTS={transport:'proxy',endpoint:DEFAULT_PROXY,model:'gemini-flash-lite-latest',extractModel:'gemini-flash-lite-latest',webSearch:true,effort:'high',consent:false,consentAt:''};
let fetchImpl=(...a)=>root.fetch(...a);
let storage={get(k){try{return root.localStorage?.getItem(k);}catch{return null;}},set(k,v){try{root.localStorage?.setItem(k,v);}catch{}},remove(k){try{root.localStorage?.removeItem(k);}catch{}}};

function settings(){let s={};try{s=JSON.parse(storage.get(SETTINGS_KEY)||'{}')||{};}catch{s={};}const out=Object.assign({},DEFAULTS,s);if(!MODELS.some(m=>m.id===out.model))out.model=DEFAULTS.model;if(!['proxy','direct'].includes(out.transport))out.transport='proxy';if(!['low','medium','high','xhigh','max'].includes(out.effort))out.effort='high';out.endpoint=String(out.endpoint||DEFAULT_PROXY).replace(/\/+$/,'');return out;}
function saveSettings(next){const cur=settings();const merged=Object.assign({},cur,next||{});if(merged.consent&&!cur.consent)merged.consentAt=new Date().toISOString();if(!merged.consent)merged.consentAt='';delete merged.apiKey;storage.set(SETTINGS_KEY,JSON.stringify(merged));return settings();}
function apiKey(){return storage.get(KEY_KEY)||'';}
function saveApiKey(k){if(text(k))storage.set(KEY_KEY,k.trim());else storage.remove(KEY_KEY);}
function configured(){const s=settings();return !!s.consent&&(s.transport==='proxy'?text(s.endpoint):text(apiKey()));}
function status(){const s=settings();return {consent:s.consent,transport:s.transport,hasKey:text(apiKey()),endpoint:s.endpoint,model:s.model,configured:configured()};}

class AIError extends Error{constructor(code,message,detail){super(message);this.code=code;this.detail=detail;}}
function endpointFor(s){return s.transport==='direct'?'https://api.anthropic.com/v1/messages':s.endpoint+'/v1/messages';}
function headersFor(s){const h={'content-type':'application/json','anthropic-version':API_VERSION,'anthropic-beta':FALLBACK_BETA};if(s.transport==='direct'){h['x-api-key']=apiKey();h['anthropic-dangerous-direct-browser-access']='true';}else h['x-sultan-client']='web';return h;}
function mapError(status,body){
 let detail='';try{detail=body?.error?.message||body?.message||'';}catch{}
 if(status===401||status===403)return new AIError('auth',T('aiErrAuth'),detail);
 if(status===429)return new AIError('rate',T('aiErrRate'),detail);
 if(status===413)return new AIError('size',T('aiErrSize'),detail);
 if(status>=500)return new AIError('server',T('aiErrServer'),detail);
 return new AIError('request',T('aiErrRequest')+(detail?' — '+detail:''),detail);
}
/* Parse an SSE stream of Messages API events into one message object. */
async function readStream(response,onProgress){
 const reader=response.body.getReader(),decoder=new TextDecoder();let buffer='',message={content:[],stop_reason:null,usage:{input_tokens:0,output_tokens:0},model:''};const blocks=[];
 const handle=evt=>{
  if(!evt)return;
  if(evt.type==='message_start'){message=Object.assign(message,{id:evt.message?.id,model:evt.message?.model||''});message.usage.input_tokens=evt.message?.usage?.input_tokens||0;}
  else if(evt.type==='content_block_start'){blocks[evt.index]=Object.assign({},evt.content_block,evt.content_block?.type==='text'?{text:evt.content_block.text||''}:{});}
  else if(evt.type==='content_block_delta'){const b=blocks[evt.index];if(!b)return;if(evt.delta?.type==='text_delta'){b.text=(b.text||'')+evt.delta.text;onProgress?.({chars:(b.text||'').length});}else if(evt.delta?.type==='input_json_delta'){b.partial=(b.partial||'')+(evt.delta.partial_json||'');}}
  else if(evt.type==='message_delta'){if(evt.delta?.stop_reason)message.stop_reason=evt.delta.stop_reason;if(evt.delta?.stop_details)message.stop_details=evt.delta.stop_details;if(evt.usage?.output_tokens!==undefined)message.usage.output_tokens=evt.usage.output_tokens;}
  else if(evt.type==='error'){throw new AIError('stream',T('aiErrServer'),evt.error?.message||'');}
 };
 for(;;){
  const {value,done}=await reader.read();if(done)break;
  buffer+=decoder.decode(value,{stream:true});
  let idx;while((idx=buffer.indexOf('\n\n'))>=0){const chunk=buffer.slice(0,idx);buffer=buffer.slice(idx+2);const data=chunk.split('\n').filter(l=>l.startsWith('data:')).map(l=>l.slice(5).trim()).join('');if(!data||data==='[DONE]')continue;let evt=null;try{evt=JSON.parse(data);}catch{continue;}handle(evt);}
 }
 message.content=blocks.filter(Boolean);return message;
}
/* One Messages API call. body: {model,max_tokens,system,messages,tools,output_config,stream}. */
async function call(body,opts={}){
 const s=settings();
 if(!s.consent)throw new AIError('consent',T('aiErrConsent'));
 if(s.transport==='direct'&&String(body.model).startsWith('gemini-'))throw new AIError('request',lang()==='ar'?'Gemini متاح عبر وسيط سلطان فقط. اختر اتصال الوسيط.':'Gemini requires the SULTAN relay transport.');
 if(s.transport==='direct'&&!text(apiKey()))throw new AIError('auth',T('aiErrNoKey'));
 const payload=Object.assign({fallbacks:'default'},body);
 if(opts.stream)payload.stream=true;
 const controller=typeof AbortController!=='undefined'?new AbortController():null;const timer=controller?setTimeout(()=>controller.abort(),opts.timeoutMs||(opts.stream?900000:240000)):null;
 let response;
 try{response=await fetchImpl(endpointFor(s),{method:'POST',headers:headersFor(s),body:JSON.stringify(payload),signal:controller?.signal});}
 catch(err){clearTimeout(timer);throw new AIError('network',T('aiErrNetwork'),String(err?.message||err));}
 if(!response.ok){clearTimeout(timer);let parsed=null;try{parsed=await response.json();}catch{}throw mapError(response.status,parsed);}
 let message;
 try{message=opts.stream?await readStream(response,opts.onProgress):await response.json();}finally{clearTimeout(timer);}
 if(message?.type==='error')throw mapError(400,message);
 if(message.stop_reason==='refusal')throw new AIError('refusal',T('aiErrRefusal'),message.stop_details?.explanation||'');
 return message;
}
const textOf=m=>(m?.content||[]).filter(b=>b.type==='text').map(b=>b.text||'').join('\n');
function parseJson(raw){
 const s=String(raw||'').trim();
 try{return JSON.parse(s);}catch{}
 const a=s.indexOf('{'),b=s.lastIndexOf('}');
 if(a>=0&&b>a){try{return JSON.parse(s.slice(a,b+1));}catch{}}
 throw new AIError('parse',T('aiErrParse'));
}
const usageOf=m=>({inputTokens:m?.usage?.input_tokens||0,outputTokens:m?.usage?.output_tokens||0,model:m?.model||''});

/* ---------------------------------------------------------------- prompts */
function methodSystem(){
 return [
  'You are the drafting and research engine inside SULTAN, a bilingual (Arabic/English) strategy workspace for Saudi institutions built on the SULTAN Decision Accountability Method.',
  'The method chains: mandate → strategic choice → evidence/reference → authority (enablers) → initiative → evidence-gated funding → outcome. Identity (mission, beneficiaries, distinctive assets, liabilities, context, culture, vision, what we will not prioritise) comes before any initiative.',
  'Rules you must respect in every output:',
  '1. Unknown is never zero. If a baseline, target, budget, date or owner is not supported by the brief, the documents or a cited source, leave it null or empty and say what evidence would establish it. Never invent statistics, benchmark values, laws, programme targets or quotations.',
  '2. Mandatory requirements (regulations, licences, safety, data protection) are choices of type "requirement": always selected, never scored against discretionary alternatives.',
  '3. A moonshot keeps its strategic value even without a track record, but needs a foothold and an explicit stop gate.',
  '4. A divest choice (stop/merge/withdraw) must name what stops, where released resources go, the evidence and the impact on people.',
  '5. References must be relevant to the Saudi context of this institution: state why they fit and what may be adapted versus what must not change. Use the bundled library below as a verified starting point and prefer official issuers (ministries, authorities, commissions) with root URLs.',
  '6. Enablers model authority: who controls the decision (internal/external/shared/unknown) and its status. Do not mark anything "ready" unless the brief or a document proves it; prefer "unknown" or "pending".',
  '7. Preference scores (0-100 per criterion) are stated judgements, not probabilities. Explain each score in its note against the criterion anchors.',
  '8. Annual milestones must cover every year of the horizon; targets move from baseline to the final target; the last year equals the final target.',
  '9. Write every user-facing text in '+(lang()==='ar'?'Arabic (formal, concise, institution-ready)':'English (formal, concise, board-ready)')+'. Keep identifiers, keys and URLs in Latin script. Use Latin digits.',
  '10. Be specific to this institution; avoid generic consulting language. Where you must assume, write the assumption into the assumptions register rather than into facts.',
  '11. Diagnose context and risk appetite before choosing initiatives. Assess the existing operating model first; reuse it if adequate. Separate governance and decision rights from management, staffing and sourcing. End strategy design with a roadmap, initiative cards and dashboard; execution support is a separately scoped responsibility.',
  '12. For commercial growth, compare several relevant segments using evidenced demand, contract size, margin, recurring need, buyer access and distinctive advantage. A national digitisation agenda is not proof of demand. Do not assume a sector always has small or large tickets. For public-value strategies use public outcomes instead of forcing revenue.',
  '13. Where sourcing is material, compare build, partner and acquire with time, cost and capability constraints. A partnership must explain our contribution, their contribution and why they would choose us; no implied agreement. Acquisition requires diligence, valuation evidence and an integration owner, never a default recommendation.',
  '14. Separate estimates from committed revenue and cash. Expose unsupported assumptions, test deadlines and stop conditions. Initiative cards need outcomes, accountable owners, KPI definitions and sources, activities, acceptance, dependencies, bottom-up costs and monitorable risk triggers. Never count a detailed budget twice.',
  lensBlock()
 ].filter(text).join('\n');
}
/* The method owner's thinking patterns (expert lenses) travel with every prompt when the expert allows it. */
function lensBlock(){try{return root.SultanLens?.promptBlock?.()||'';}catch{return '';}}
function lensQuestions(){try{return root.SultanLens?.reviewQuestions?.()||[];}catch{return [];}}
function groundingBlock(project){
 const Lib=root.SultanLibrary,ctx=project?.context||{};
 const sectorId=ctx.sectorId||Lib?.detect?.(project?.institution?.sector)?.id||'';
 const g=Lib&&sectorId?Lib.grounding(sectorId,ctx.typeId,lang()):'';
 return g?`Bundled sector library (verified ${Lib.verifiedOn}; re-verify before publishing):\n${g}`:'No bundled sector library matched this institution; rely on official sources and say so when uncertain.';
}
function documentBlocks(documents=[]){
 const blocks=[];
 for(const d of documents){
  if(d.kind==='pdf'&&text(d.base64))blocks.push({type:'document',source:{type:'base64',media_type:'application/pdf',data:d.base64},title:d.name});
  else if(text(d.text))blocks.push({type:'document',source:{type:'text',media_type:'text/plain',data:d.text.slice(0,400000)},title:d.name});
 }
 return blocks;
}
/* Step 1 of context gathering: research memo with web search (when enabled) and attached documents. */
async function researchContext({project,documents=[],onProgress}={}){
 const s=settings(),D=root.SultanDraft;
 const brief=project?.context?.brief||'';
 const user=[
  ...documentBlocks(documents),
  {type:'text',text:[
   'Task: compile the context dossier an expert strategy consultant would gather before building this institution\'s strategy.',
   'Institution digest:\n'+(D?D.digest(project):JSON.stringify(project?.institution||{})),
   groundingBlock(project),
   s.webSearch?'Use web_search to verify and extend the library: current regulations and their issuers, national programmes and published targets for this sector, national and international indicators with the most recent published values (year + source), and studies or official reports from the last five years about this sector in Saudi Arabia. Prefer official domains (.gov.sa, vision2030.gov.sa, etec.gov.sa, oecd.org, iea.nl). Do not cite a value you did not see.':'Web search is disabled: use only the library, the brief and the attached documents, and flag what should be verified online.',
   documents.length?'For each attached document, add a section "Document: <name>" with a 3-5 line summary of what it says that matters for the strategy (baselines, commitments, constraints, previous targets).':'',
   'Output a research memo in '+(lang()==='ar'?'Arabic':'English')+' with numbered sources. For each source give: title, issuer, URL, year, what it establishes, and why it matters for this institution (one line). End with a short list of open questions the institution must answer itself.'
  ].filter(text).join('\n\n')}
 ];
 const body={model:s.model,max_tokens:16000,system:methodSystem(),messages:[{role:'user',content:user}],output_config:{effort:s.effort}};
 if(s.webSearch)body.tools=[{type:'web_search_20260209',name:'web_search',max_uses:10}];
 let m,notice='';
 try{m=await call(body,{stream:true,onProgress});}
 catch(error){
  if(!s.webSearch||error.code!=='rate')throw error;
  delete body.tools;
  notice=lang()==='ar'?'تعذر البحث في الويب بسبب حصة المزوّد. يستند هذا السياق إلى المكتبة والوثائق فقط؛ يلزم التحقق من المصادر والإصدارات الحالية.':'Web search was unavailable because of provider quota. This context uses only the library and attached documents; sources and current editions require verification.';
  body.messages[0].content.push({type:'text',text:'Web search is unavailable. Override the earlier search instruction: use only the bundled library, brief and attached documents. Do not claim any online verification. Explicitly flag sources that require verification.'});
  m=await call(body,{stream:true,onProgress});
 }
 return {memo:(notice?notice+'\n\n':'')+textOf(m),usage:usageOf(m),truncated:m.stop_reason==='max_tokens'};
}
function contextSchema(){
 const s=()=>({type:'string'}),i=()=>({anyOf:[{type:'integer'},{type:'null'}]});
 return {type:'object',additionalProperties:false,required:['sources','documents','openQuestions','summary'],properties:{
  sources:{type:'array',items:{type:'object',additionalProperties:false,required:['title','kind','issuer','url','year','summary','relevance'],properties:{title:s(),kind:{type:'string',enum:['regulation','program','indicator','study','benchmark','internal','other']},issuer:s(),url:s(),year:i(),summary:s(),relevance:s()}}},
  documents:{type:'array',items:{type:'object',additionalProperties:false,required:['name','summary'],properties:{name:s(),summary:s()}}},
  openQuestions:{type:'array',items:s()},
  summary:s()}};
}
/* Step 2: structured extraction of the memo into dossier records. */
async function extractContext({memo,documents=[]}={}){
 const s=settings();
 const body={model:s.extractModel||s.model,max_tokens:16000,system:'You convert a research memo into structured records. Copy titles, issuers, URLs and years exactly as they appear in the memo; never add sources that are not in it. Keep text in the memo\'s language.',
  messages:[{role:'user',content:'Research memo:\n\n'+memo+(documents.length?'\n\nAttached document names: '+documents.map(d=>d.name).join(', '):'')}],
  output_config:{effort:'medium',format:{type:'json_schema',schema:contextSchema()}}};
 const m=await call(body,{stream:true});
 return {data:parseJson(textOf(m)),usage:usageOf(m)};
}
async function gatherContext(args={}){
 const r=await researchContext(args);
 const x=await extractContext({memo:r.memo,documents:args.documents||[]});
 return {memo:r.memo,data:x.data,usage:[r.usage,x.usage],truncated:r.truncated};
}
/* Full strategy draft as structured JSON. */
async function generateStrategy({project,goalHints=[],onProgress}={}){
 const s=settings(),D=root.SultanDraft;
 const years=root.Sultan.years(project);
 const user=[
  'Task: draft a complete, board-defensible strategy for this institution following the SULTAN method. The expert will review and edit every record; mark assumptions as assumptions.',
  'Institution digest and accepted context:\n'+D.digest(project),
  groundingBlock(project),
  goalHints.length?'Strategic directions the leadership wants covered (use them; add a requirement choice where regulations demand one; propose at most one moonshot and, if the brief suggests waste or duplication, one divest choice):\n- '+goalHints.join('\n- '):'Propose 3-5 strategic choices: the discretionary alternatives that matter most for this institution, one requirement choice covering binding regulations, optionally one moonshot with a stop gate and one divest choice.',
  `Horizon years: ${years.join(', ')}. Every transition must include one annual row per year. Baseline/target are null unless the digest, documents or accepted sources give the number. Budgets are null unless figures are given. Enabler status is "unknown" or "pending" unless proven.`,
  'Preserve sourceOptionId/sourceTransitionId/sourceInitiativeId from the digest when rewriting an existing record; use an empty string for new records. Preserve the original KPI definition, unit, baseline, evidence source, target, and team decision. Do not turn a generic score into NAFS or any named official assessment. Costs are null unless that exact initiative/year already has an entered amount; an annual funding cap is not an initiative budget. Do not invent a waiting list, reputation, approval, source document, or current capability. Write unknown facts as questions. Separate a limited feasibility study from capital approval: the study must not depend on the capital decision it informs.',
  'Use keys (short Latin strings) to link records: transitions.optionKey → options.key; initiatives.optionKey/transitionKey; enablers.optionKey; initiatives.enablerKeys/dependsOnKeys. Use the criteria ids identity, benefit, distinct, sustain for scores. Put any additional sources you relied on in contextSources (they will be marked as proposed for review), and list what the institution must still answer in openQuestions.'
 ].join('\n\n');
 const body={model:s.model,max_tokens:48000,system:methodSystem(),messages:[{role:'user',content:user}],output_config:{effort:s.effort,format:{type:'json_schema',schema:D.aiSchema()}}};
 const m=await call(body,{stream:true,onProgress});
 return {data:parseJson(textOf(m)),usage:usageOf(m),truncated:m.stop_reason==='max_tokens'};
}
/* Draft one field in the workspace. */
async function suggestField({project,path,label,why,current,section}={}){
 const s=settings(),D=root.SultanDraft;
 const user=[
  `Task: draft the content of one field in the SULTAN workspace. Section: ${section||''}. Field path: ${path}. Field label: ${label}.`,
  why?`What this field is for: ${why}`:'',
  text(current)?`Current value (improve or complete it; keep what is specific):\n${current}`:'The field is empty.',
  'Project digest:\n'+D.digest(project),
  groundingBlock(project),
  'Return only the field text (no heading, no markdown, no quotation marks), 1-4 sentences unless the field is a title (then one line). Keep numbers only if they are already in the digest; otherwise write the placeholder [to be confirmed] in the output language.'
 ].filter(text).join('\n\n');
 const m=await call({model:s.model,max_tokens:1500,system:methodSystem(),messages:[{role:'user',content:user}],output_config:{effort:'medium'}});
 return {text:textOf(m).trim(),usage:usageOf(m)};
}
function reviewSchema(){
 const s=()=>({type:'string'});
 return {type:'object',additionalProperties:false,required:['summary','strengths','items'],properties:{summary:s(),strengths:{type:'array',items:s()},items:{type:'array',items:{type:'object',additionalProperties:false,required:['section','severity','message','fix','lens'],properties:{section:{type:'string',enum:['identity','choices','references','priorities','enablers','roadmap','review','context']},severity:{type:'string',enum:['blocking','warning','hint']},message:s(),fix:s(),lens:s()}}}}};
}
/* Candidate thinking patterns extracted from an adviser's notes. */
function lensSchema(){
 const s=()=>({type:'string'});
 return {type:'object',additionalProperties:false,required:['lenses'],properties:{lenses:{type:'array',items:{type:'object',additionalProperties:false,required:['title','question','lookFor','keywords','group'],properties:{title:s(),question:s(),lookFor:s(),keywords:{type:'array',items:s()},group:{type:'string',enum:['focus','growth','evidence','people','method','custom']}}}}}};
}
async function extractLenses({text:notes}={}){
 const s=settings();
 const user=[
  'Task: read these notes written by a senior strategy adviser and extract the reusable thinking patterns ("lenses") they reveal: the questions this adviser habitually asks of any strategy. Merge duplicates, drop one-off facts about the specific case, keep 3 to 12 lenses. For each lens give a short title, the question as the adviser would ask it of any institution, what a good answer looks like, 2 to 6 keywords (in the language of the notes and in English) whose presence in a strategy signals that it addresses the lens, and a group (focus, growth, evidence, people, method).',
  'Notes:\n'+String(notes||'').slice(0,60000),
  'Write in '+(lang()==='ar'?'Arabic':'English')+'.'
 ].join('\n\n');
 const m=await call({model:s.model,max_tokens:6000,system:methodSystem(),messages:[{role:'user',content:user}],output_config:{effort:'medium',format:{type:'json_schema',schema:lensSchema()}}});
 return {data:parseJson(textOf(m)),usage:usageOf(m)};
}
/* Expert review of the whole strategy. */
async function reviewStrategy({project}={}){
 const s=settings(),D=root.SultanDraft,E=root.Sultan;
 const selected=new Set(E.selected(project).map(o=>o.id)),portfolio=E.clone(project);
 portfolio.options=portfolio.options.filter(o=>selected.has(o.id));
 for(const key of ['transitions','enablers','initiatives'])portfolio[key]=portfolio[key].filter(x=>selected.has(x.optionId));
 const inactive=project.options.filter(o=>!selected.has(o.id)).map(o=>({title:o.title,decision:o.decision,reason:o.decisionReason}));
 const issues=E.check(project).filter(x=>x.entity!=='ai-review').slice(0,60).map(x=>`${x.section}/${x.level}: ${x.message}`).join('\n');
 const user=[
  'Task: review this strategy as a senior strategy consultant with 40 years of experience preparing boards. Be direct and specific. Judge coherence (mandate → choice → KPI → authority → initiative → funding), realism of targets against the cited sources, missing authority, unmanaged risks, borrowed targets without adaptation, and anything a board member would challenge.',
  'Current decisions override earlier ambitions in the brief. Review execution and funding of the SELECTED portfolio below. Deferred, rejected and considered options are not current commitments: do not add their costs to the current gap or describe their missing approvals as blockers of the selected plan. You may flag a condition for reconsidering them as a clearly labelled hint. Only evidence of an existing obligation can justify a current liability from an inactive option.',
  'Selected portfolio digest:\n'+D.digest(portfolio),
  'Inactive choices (context only):\n'+JSON.stringify(inactive),
  root.SultanStrategy?.aiContext(project)?'Selected strategy design, opportunity cases and initiative cards (hypotheses are not facts):\n'+root.SultanStrategy.aiContext(project):'',
  'Workspace-calculated funding for the selected portfolio (unknown costs remain unknown; zero known gap is not funding approval):\n'+JSON.stringify(E.budgetSummary(project)),
  groundingBlock(project),
  issues?'Deterministic completeness issues already detected by the workspace (do not repeat them; look beyond them):\n'+issues:'',
  lensQuestions().length?'Consider the method owner\'s expert lenses only where applicable. Do not force acquisition or partnership onto routine service quality or staff development. When a finding comes from an applicable lens, set "lens" to that lens id; otherwise set it to "".\n'+lensQuestions().map(q=>`- ${q.id}: ${q.question}`).join('\n'):'',
  'For each finding give the section, a severity (blocking = would embarrass the board or block execution; warning = weakens defensibility; hint = polish), the finding, the concrete fix and the lens id (or ""). Also list genuine strengths. Write in '+(lang()==='ar'?'Arabic':'English')+'.'
 ].filter(text).join('\n\n');
 const m=await call({model:s.model,max_tokens:12000,system:methodSystem(),messages:[{role:'user',content:user}],output_config:{effort:s.effort,format:{type:'json_schema',schema:reviewSchema()}}},{stream:true});
 return {data:parseJson(textOf(m)),usage:usageOf(m)};
}
async function ping(){const s=settings();const m=await call({model:s.model,max_tokens:256,messages:[{role:'user',content:'Reply with the single word OK.'}],output_config:{effort:'low'}});return {ok:/ok/i.test(textOf(m)),usage:usageOf(m)};}
/* File helpers for the browser. */
function fileToBase64(file){return new Promise((resolve,reject)=>{const r=new FileReader();r.onload=()=>resolve(String(r.result).split(',')[1]||'');r.onerror=()=>reject(r.error);r.readAsDataURL(file);});}
function fileToText(file){return new Promise((resolve,reject)=>{const r=new FileReader();r.onload=()=>resolve(String(r.result||''));r.onerror=()=>reject(r.error);r.readAsText(file);});}
root.SultanAI={MODELS,DEFAULT_PROXY,settings,saveSettings,apiKey,saveApiKey,configured,status,call,textOf,parseJson,usageOf,methodSystem,groundingBlock,contextSchema,reviewSchema,lensSchema,researchContext,extractContext,gatherContext,generateStrategy,suggestField,reviewStrategy,extractLenses,ping,fileToBase64,fileToText,AIError,
 _setFetch(f){fetchImpl=f;},_setStorage(s){storage=s;}};
if(isNode)module.exports=root.SultanAI;
})(typeof globalThis!=='undefined'?globalThis:this);
