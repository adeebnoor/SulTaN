/* Context dossier — engine-level extension (no DOM).
   A strategy is only as good as the context it is built from. The dossier records the sector,
   the general brief entered by the user, the regulations / programmes / indicators / studies
   gathered for that sector (from the bundled library, from the AI research step, or by hand),
   the institution documents the user supplied, the expert reviews produced by the AI, and an
   auditable log of every AI call. API keys are never stored in the project. */
(function(root){
'use strict';
const isNode=typeof module!=='undefined'&&module.exports;
const E=root.Sultan;
if(!E)return;
const T=k=>{try{return root.SultanI18n.t(k);}catch{return k;}};
const num=x=>typeof x==='number'&&Number.isFinite(x);
const text=x=>typeof x==='string'&&x.trim().length>0;
const clone=x=>JSON.parse(JSON.stringify(x));
const KINDS=['regulation','program','indicator','study','benchmark','internal','other'];
const STATUS=['proposed','accepted','rejected'];
const ORIGIN=['library','ai','user'];
const SEVERITY=['blocking','warning','hint'];
const SECTIONS=['identity','choices','references','priorities','enablers','roadmap','review','context'];
const LIMITS={sources:300,documents:60,reviews:20,items:80,log:300,string:24000};
const ID=/^[A-Za-z0-9_-]{1,80}$/;
const str=(v,max=LIMITS.string)=>typeof v==='string'?v.slice(0,max):'';
const uid=p=>E.uid(p);

function defaults(){return {sectorId:'',typeId:'',brief:'',sources:[],documents:[],reviews:[],ai:{enabled:false,consentAt:'',log:[]}};}
function source(x={}){
 return {id:ID.test(String(x.id||''))?x.id:uid('src'),title:str(x.title),kind:KINDS.includes(x.kind)?x.kind:'other',issuer:str(x.issuer),url:str(x.url,2000),
  year:Number.isInteger(x.year)&&x.year>=1900&&x.year<=2200?x.year:null,summary:str(x.summary),relevance:str(x.relevance),
  status:STATUS.includes(x.status)?x.status:'proposed',origin:ORIGIN.includes(x.origin)?x.origin:'user'};
}
function document(x={}){
 return {id:ID.test(String(x.id||''))?x.id:uid('doc'),name:str(x.name,400),kind:x.kind==='pdf'?'pdf':'text',size:num(x.size)&&x.size>=0?Math.round(x.size):0,
  pages:Number.isInteger(x.pages)&&x.pages>0?x.pages:null,summary:str(x.summary),addedAt:str(x.addedAt,40)};
}
function review(x={}){
 return {at:str(x.at,40),model:str(x.model,120),summary:str(x.summary),
  items:(Array.isArray(x.items)?x.items:[]).slice(0,LIMITS.items).map(i=>({section:SECTIONS.includes(i?.section)?i.section:'review',severity:SEVERITY.includes(i?.severity)?i.severity:'hint',message:str(i?.message,4000),fix:str(i?.fix,4000),lens:str(i?.lens,120)}))};
}
function logEntry(x={}){return {at:str(x.at,40),model:str(x.model,120),purpose:str(x.purpose,120),inputTokens:num(x.inputTokens)?Math.round(x.inputTokens):0,outputTokens:num(x.outputTokens)?Math.round(x.outputTokens):0};}
function normalize(p){
 const c=p.context&&typeof p.context==='object'&&!Array.isArray(p.context)?p.context:{};
 const out=defaults();
 out.sectorId=str(c.sectorId,80);out.typeId=str(c.typeId,80);out.brief=str(c.brief);
 out.sources=(Array.isArray(c.sources)?c.sources:[]).slice(0,LIMITS.sources).map(source);
 out.documents=(Array.isArray(c.documents)?c.documents:[]).slice(0,LIMITS.documents).map(document);
 out.reviews=(Array.isArray(c.reviews)?c.reviews:[]).slice(-LIMITS.reviews).map(review);
 const ai=c.ai&&typeof c.ai==='object'?c.ai:{};
 out.ai={enabled:ai.enabled===true,consentAt:str(ai.consentAt,40),log:(Array.isArray(ai.log)?ai.log:[]).slice(-LIMITS.log).map(logEntry)};
 const seen=new Set();for(const s of out.sources){if(seen.has(s.id))s.id=uid('src');seen.add(s.id);}
 p.context=out;return p;
}
/* Strict shape validation for imports: anything that is not the documented dossier shape is rejected. */
function validateShape(c){
 if(c===undefined)return;
 if(!c||typeof c!=='object'||Array.isArray(c))throw Error(T('ctxInvalid'));
 for(const k of Object.keys(c))if(!['sectorId','typeId','brief','sources','documents','reviews','ai'].includes(k))throw Error(T('ctxInvalidKey')+' '+k);
 for(const k of ['sectorId','typeId','brief'])if(c[k]!==undefined&&typeof c[k]!=='string')throw Error(T('ctxInvalidKey')+' '+k);
 for(const [k,limit] of [['sources',LIMITS.sources],['documents',LIMITS.documents],['reviews',LIMITS.reviews]])if(c[k]!==undefined&&(!Array.isArray(c[k])||c[k].length>limit))throw Error(T('ctxInvalidKey')+' '+k);
 for(const s of c.sources||[]){if(!s||typeof s!=='object')throw Error(T('ctxInvalid'));for(const k of Object.keys(s))if(!['id','title','kind','issuer','url','year','summary','relevance','status','origin'].includes(k))throw Error(T('ctxInvalidKey')+' sources.'+k);if(s.kind!==undefined&&!KINDS.includes(s.kind))throw Error(T('ctxInvalidKey')+' kind');if(s.status!==undefined&&!STATUS.includes(s.status))throw Error(T('ctxInvalidKey')+' status');if(s.origin!==undefined&&!ORIGIN.includes(s.origin))throw Error(T('ctxInvalidKey')+' origin');if(s.year!==undefined&&s.year!==null&&!Number.isInteger(s.year))throw Error(T('ctxInvalidKey')+' year');}
 for(const d of c.documents||[]){if(!d||typeof d!=='object')throw Error(T('ctxInvalid'));for(const k of Object.keys(d))if(!['id','name','kind','size','pages','summary','addedAt'].includes(k))throw Error(T('ctxInvalidKey')+' documents.'+k);}
 for(const r of c.reviews||[]){if(!r||typeof r!=='object')throw Error(T('ctxInvalid'));for(const k of Object.keys(r))if(!['at','model','summary','items'].includes(k))throw Error(T('ctxInvalidKey')+' reviews.'+k);if(r.items!==undefined&&!Array.isArray(r.items))throw Error(T('ctxInvalidKey')+' items');}
 if(c.ai!==undefined){if(!c.ai||typeof c.ai!=='object'||Array.isArray(c.ai))throw Error(T('ctxInvalidKey')+' ai');for(const k of Object.keys(c.ai))if(!['enabled','consentAt','log'].includes(k))throw Error(T('ctxInvalidKey')+' ai.'+k);if(c.ai.log!==undefined&&!Array.isArray(c.ai.log))throw Error(T('ctxInvalidKey')+' ai.log');}
}
const baseBlank=E.blank,baseValidate=E.validateImport,baseCheck=E.check,baseDemo=E.demo,baseSync=E.syncYears;
E.blank=function(){return normalize(baseBlank());};
E.validateImport=function(raw){
 const ctx=raw&&typeof raw==='object'&&!Array.isArray(raw)?raw.context:undefined;
 validateShape(ctx);
 let clean=raw;
 if(ctx!==undefined){clean=clone(raw);delete clean.context;}
 const p=baseValidate(clean);
 p.context=ctx===undefined?undefined:clone(ctx);
 return normalize(p);
};
E.syncYears=function(p){const r=baseSync(p);return normalize(r||p);};
/* The recovery shield in final-core validated the stored draft before this layer existed, so a draft that
   carries a context dossier looked corrupt to it. Re-check with the dossier-aware validator and lift the lock. */
(function recheckRecovery(){
 const r=root.SultanRecovery;if(!r||!r.pending||!r.raw)return;
 try{E.validateImport(JSON.parse(r.raw));r.pending=false;r.error='';}catch{}
})();
E.check=function(p){
 const out=baseCheck(p);
 const c=p?.context;if(!c)return out;
 const proposed=c.sources.filter(s=>s.status==='proposed').length;
 if(proposed)out.push({section:'references',level:'missing',message:T('ctxIssueUnreviewed').replace('%{0}',String(proposed)),entity:'context'});
 const last=c.reviews.at(-1);
 /* Only a model review adds findings here. A key-free local review is a snapshot of these same rules, so
    re-surfacing it would duplicate every blocking issue, label it as AI, and keep it after the issue is fixed. */
 if(last&&last.model!=='local-rules')for(const item of last.items.filter(i=>i.severity==='blocking').slice(0,12))out.push({section:SECTIONS.includes(item.section)&&item.section!=='context'?item.section:'review',level:'warning',message:T('ctxIssueAiReview')+' '+item.message,entity:'ai-review'});
 return out;
};
E.demo=function(){
 const p=normalize(baseDemo()),ar=root.SultanI18n?.language==='ar';
 p.context.sectorId='highered';p.context.typeId='university';
 p.context.brief=ar?'جامعة حكومية افتراضية تريد تركيز بحثها التطبيقي على تجربة الزائر وبناء قدرة فرق مشتركة خلال 2027–2030.':'A fictional public university that wants to focus applied research on visitor experience and build joint-team capability during 2027–2030.';
 p.context.sources=[
  {id:'ctx-demo-1',title:ar?'نظام الجامعات (1441هـ / 2020م)':'Universities Law (1441 AH / 2020)',kind:'regulation',issuer:ar?'وزارة التعليم':'Ministry of Education',url:'https://moe.gov.sa',year:2020,summary:ar?'يمنح الجامعات استقلالًا إداريًا وماليًا أوسع ويحدد صلاحيات مجالس الأمناء.':'Grants universities wider administrative and financial autonomy and defines the authority of boards of trustees.',relevance:ar?'يحدد من يملك قرار الشراكات والتمويل الذاتي في المثال.':'Defines who holds partnership and self-funding decisions in the example.',status:'accepted',origin:'library'},
  {id:'ctx-demo-2',title:ar?'برنامج تنمية القدرات البشرية — رؤية 2030':'Human Capability Development Program — Vision 2030',kind:'program',issuer:ar?'مجلس الشؤون الاقتصادية والتنمية':'Council of Economic and Development Affairs',url:'https://www.vision2030.gov.sa/ar/explore/programs',year:2021,summary:ar?'برنامج وطني لتطوير التعليم والمهارات ومواءمتها مع سوق العمل.':'National programme for education, skills and labour-market alignment.',relevance:ar?'مرجع التكليف الوطني للمثال الافتراضي.':'National mandate reference for the fictional example.',status:'accepted',origin:'library'},
  {id:'ctx-demo-3',title:ar?'دراسة افتراضية عن تجربة الزائر في المدن السعودية':'Fictional study on visitor experience in Saudi cities',kind:'study',issuer:ar?'مركز بحثي افتراضي':'Fictional research centre',url:'',year:2025,summary:ar?'مثال تعليمي لمصدر مقترح ينتظر مراجعة الفريق قبل الاعتماد.':'Teaching example of a proposed source awaiting team review before acceptance.',relevance:ar?'قد يدعم خط الأساس لمؤشر تجربة الزائر إذا تأكدت منهجيته.':'May support the visitor-experience baseline if its method is confirmed.',status:'proposed',origin:'ai'}
 ].map(source);
 return p;
};
E.contextDefaults=defaults;E.contextSource=source;E.contextDocument=document;E.contextReview=review;
E.contextSummary=function(p){const c=p?.context||defaults();return {sources:c.sources.length,accepted:c.sources.filter(s=>s.status==='accepted').length,proposed:c.sources.filter(s=>s.status==='proposed').length,documents:c.documents.length,reviews:c.reviews.length,aiCalls:c.ai.log.length};};
function ensure(p){const c=p.context;if(!c||typeof c!=='object'||!Array.isArray(c.sources)||!Array.isArray(c.documents)||!Array.isArray(c.reviews)||!c.ai||!Array.isArray(c.ai.log))normalize(p);return p;}
E.addContextSource=function(p,x){ensure(p);const s=source(x);const dup=p.context.sources.find(o=>o.title.trim().toLowerCase()===s.title.trim().toLowerCase());if(dup)return dup;p.context.sources.push(s);return s;};
E.recordAiUse=function(p,entry){ensure(p);p.context.ai.log.push(logEntry({at:new Date().toISOString(),...entry}));p.context.ai.log=p.context.ai.log.slice(-LIMITS.log);return p;};
E.addContextReview=function(p,r){ensure(p);p.context.reviews.push(review({at:new Date().toISOString(),...r}));p.context.reviews=p.context.reviews.slice(-LIMITS.reviews);return p;};
/* Report fragment: accepted sources, documents, AI disclosure. Plain strings; the caller escapes nothing else. */
E.contextReportHtml=function(p){
 const esc=x=>String(x??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
 const c=p?.context;if(!c)return '';
 const kinds={regulation:T('ctxKindRegulation'),program:T('ctxKindProgram'),indicator:T('ctxKindIndicator'),study:T('ctxKindStudy'),benchmark:T('ctxKindBenchmark'),internal:T('ctxKindInternal'),other:T('ctxKindOther')};
 const accepted=c.sources.filter(s=>s.status==='accepted'),proposed=c.sources.filter(s=>s.status==='proposed');
 let h='';
 if(text(c.brief))h+=`<p><b>${esc(T('ctxBriefLabel'))}:</b> ${esc(c.brief)}</p>`;
 h+=accepted.length?`<div class="tablewrap"><table><thead><tr><th>${esc(T('ctxColSource'))}</th><th>${esc(T('ctxColKind'))}</th><th>${esc(T('ctxColIssuer'))}</th><th>${esc(T('ctxColYear'))}</th><th>${esc(T('ctxColRelevance'))}</th></tr></thead><tbody>${accepted.map(s=>`<tr><td>${esc(s.title)}${text(s.url)?`<br><small>${esc(s.url)}</small>`:''}</td><td>${esc(kinds[s.kind]||s.kind)}</td><td>${esc(s.issuer||'—')}</td><td>${s.year??'—'}</td><td>${esc(s.relevance||s.summary||'—')}</td></tr>`).join('')}</tbody></table></div>`:`<p>${esc(T('ctxNoneAccepted'))}</p>`;
 if(proposed.length)h+=`<p class="hint">${esc(T('ctxIssueUnreviewed').replace('%{0}',String(proposed.length)))}</p>`;
 if(c.documents.length)h+=`<p><b>${esc(T('ctxDocumentsLabel'))}:</b> ${c.documents.map(d=>esc(d.name)+(d.pages?` (${d.pages} ${esc(T('ctxPages'))})`:'')).join(T('s507'))}</p>`;
 const last=c.reviews.at(-1);
 if(last)h+=`<h3>${esc(T('ctxReviewHeading'))}</h3><p>${esc(last.summary)}</p>${last.items.length?`<ul>${last.items.map(i=>`<li><b>${esc(T('ctxSeverity_'+i.severity))}</b> · ${esc(i.message)}</li>`).join('')}</ul>`:''}`;
 h+=`<p class="hint">${esc(c.ai.log.length?T('ctxAiDisclosure').replace('%{0}',String(c.ai.log.length)):T('ctxNoAiDisclosure'))}</p>`;
 return h;
};
E.contextKinds=KINDS;E.contextStatus=STATUS;E.contextOrigins=ORIGIN;E.normalizeContext=normalize;
root.SultanContext={normalize,defaults,source,document,review,KINDS,STATUS,ORIGIN,SECTIONS};
if(isNode)module.exports=E;
})(typeof globalThis!=='undefined'?globalThis:this);
