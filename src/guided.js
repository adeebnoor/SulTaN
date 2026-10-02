/* Guided path — from general information to a reviewable first draft.
   Five short steps: sector → institution & brief (+documents) → context dossier (library + AI research)
   → strategic directions → generate. The library and the AI do the drafting; the expert reviews.
   Also adds: the "Guided path" navigation entry, the context dossier card and library pickers in the
   workspace, the AI expert review in the Review section, the AI settings dialog and provenance banners. */
(function(root){
'use strict';
const E=root.Sultan,I=root.SultanI18n,T=I.t,Lib=root.SultanLibrary,D=root.SultanDraft,AI=root.SultanAI;
if(!E||!Lib||!D)return;
const esc=x=>String(x??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const num=x=>typeof x==='number'&&Number.isFinite(x);
const text=x=>typeof x==='string'&&x.trim().length>0;
const P=x=>Lib.pick(x,I.language);
const scoped=()=>Lib.forMarket?.((section()==='guide'?state.market:project()?.context?.market)||'sa')||Lib;
const section=()=>location.hash.slice(1)||'home';
const project=()=>root.SultanApp?.getProject?.();
const STATE_KEY='sultan.guided.v2';
const thisYear=new Date().getFullYear();
const KINDS=['regulation','program','indicator','study','benchmark','internal','other'];
const kindLabel=k=>T('ctxKind'+{regulation:'Regulation',program:'Program',indicator:'Indicator',study:'Study',benchmark:'Benchmark',internal:'Internal',other:'Other'}[k]||'Other');
let docs=[];  // in-memory attachments (base64 / text); never persisted
let busy=false;

/* ---------------------------------------------------------------- wizard state */
function blankState(){return {step:1,market:root.SultanMarket?.preferred()||'sa',country:root.SultanMarket?.preferred()==='global'?'':'Saudi Arabia',currency:root.SultanMarket?.preferred()==='global'?'':'SAR',sectorId:'',typeId:'',brief:'',institution:{name:'',vision:'',beneficiaries:'',mission:'',startYear:thisYear+1,endYear:thisYear+4},goals:{},custom:[],funding:{},context:{sources:[],memo:'',documents:[],openQuestions:[]},aiLog:[],useAI:true};}
let state=load();
function load(){try{const s=JSON.parse(localStorage.getItem(STATE_KEY)||'null');if(s&&typeof s==='object')return Object.assign(blankState(),s,{institution:Object.assign(blankState().institution,s.institution||{}),context:Object.assign(blankState().context,s.context||{})});}catch{}return blankState();}
function save(){try{localStorage.setItem(STATE_KEY,JSON.stringify(state));}catch{}}
function reset(){state=blankState();docs=[];save();}
function setPath(path,value){if(path==='market'){state.market=value;if(!Object.keys(state.funding).length){state.country=value==='sa'?'Saudi Arabia':'';state.currency=value==='sa'?'SAR':'';}save();return;}const keys=path.split('.');let o=state;for(const k of keys.slice(0,-1)){if(o[k]===undefined||o[k]===null)o[k]={};o=o[k];}o[keys.at(-1)]=value;save();}
function selectedGoals(){return Object.entries(state.goals).filter(([id,g])=>g&&g.selected&&scoped().goal(state.sectorId,id)).map(([goalId,g])=>({goalId,baseline:num(g.baseline)?g.baseline:null,target:num(g.target)?g.target:null,owner:g.owner||''}));}
function spec(){return {market:state.market,country:state.country||(state.market==='sa'?'Saudi Arabia':''),currency:state.currency||(state.market==='sa'?'SAR':''),sectorId:state.sectorId,typeId:state.typeId,brief:state.brief,institution:state.institution,goals:[...selectedGoals(),...state.custom.filter(c=>text(c.title)).map(c=>({custom:c,owner:c.owner||'',baseline:num(c.baseline)?c.baseline:null,target:num(c.target)?c.target:null}))],funding:state.funding};}
function aiReady(){return !!AI&&AI.configured();}
function go(step){state.step=Math.max(1,Math.min(5,step));save();root.SultanApp.navigate('guide');}

/* ---------------------------------------------------------------- view pieces */
const btn=(label,action,cls='',extra='')=>`<button type="button" class="btn ${cls}" data-gw-action="${esc(action)}" ${extra}>${esc(label)}</button>`;
const field=(label,path,value,type='text',help='',attrs='')=>{const id='gw_'+path.replace(/[^A-Za-z0-9_-]+/g,'_');const control=type==='textarea'?`<textarea id="${id}" data-gw="${esc(path)}" rows="3" ${attrs}>${esc(value??'')}</textarea>`:`<input id="${id}" type="${type}" data-gw="${esc(path)}" value="${esc(value??'')}" ${attrs}>`;return `<label class="field gw-field" for="${id}"><span>${esc(label)}</span>${control}${help?`<span class="help">${esc(help)}</span>`:''}</label>`;};
function stepper(){const labels=[T('gwStep1'),T('gwStep2'),T('gwStep3'),T('gwStep4'),T('gwStep5')];return `<ol class="gw-steps" aria-label="${esc(T('gwStepsLabel'))}">${labels.map((l,i)=>`<li class="${state.step===i+1?'current':state.step>i+1?'done':''}"><button type="button" data-gw-action="go" data-step="${i+1}" ${state.step===i+1?'aria-current="step"':''}><span>${i+1}</span>${esc(l)}</button></li>`).join('')}</ol>`;}
function aiStatusLine(){if(!AI)return '';const s=AI.status();return `<div class="gw-ai-status ${s.configured?'on':'off'}"><span class="status-light"></span><span>${esc(s.configured?T('gwAiOn',[AI.MODELS.find(m=>m.id===s.model)?.label||s.model]):T('gwAiOff'))}</span><button type="button" class="btn small" data-gw-action="ai-settings">${esc(T('aiSettings'))}</button></div>`;}
function step1(){
 const cards=scoped().sectors.map(s=>{const c=scoped().counts(s.id);return `<label class="gw-sector ${state.sectorId===s.id?'selected':''}"><input type="radio" name="gw-sector" value="${esc(s.id)}" data-gw-action="sector" ${state.sectorId===s.id?'checked':''}><b>${esc(P(s.name))}</b><small>${esc(P(s.short))}</small><span class="gw-counts">${esc(T('gwLibraryCounts',[c.regulations,c.indicators,c.goals]))}</span></label>`;}).join('');
 const sector=scoped().sector(state.sectorId);
 const types=sector?`<label class="field gw-field"><span>${esc(T('gwTypeLabel'))}</span><select data-gw="typeId" data-gw-action="type"><option value="">${esc(T('s252'))}</option>${sector.types.map(t=>`<option value="${esc(t.id)}" ${state.typeId===t.id?'selected':''}>${esc(P(t.name))}</option>`).join('')}</select></label>`:'';
 return `<article class="card gw-card"><h2>${esc(T('gwStep1Title'))}</h2>${root.SultanMarketUI?.wizardFields(state)||''}<p class="muted">${esc(T('gwStep1Lead'))}</p><div class="gw-sector-grid">${cards}</div>${types}${sector?`<p class="hint">${esc(state.market==='global'&&section()==='guide'||section()!=='guide'&&project()?.context?.market==='global'?T('mkLibrary'):T('gwLibraryNote',[P(sector.regulator),Lib.verifiedOn]))}</p>`:''}</article>`;
}
function step2(){
 const i=state.institution,years=[];for(let y=thisYear;y<=thisYear+8;y++)years.push(y);
 const yearSelect=(path,value)=>`<select data-gw="${path}">${years.map(y=>`<option value="${y}" ${value===y?'selected':''}>${y}</option>`).join('')}</select>`;
 const files=docs.length?`<ul class="gw-docs">${docs.map((d,k)=>`<li><b>${esc(d.name)}</b> <small>${esc(d.kind.toUpperCase())} · ${Math.round(d.size/1024)} KB</small><button type="button" class="btn small danger" data-gw-action="doc-remove" data-index="${k}">${esc(T('s254'))}</button></li>`).join('')}</ul>`:`<p class="muted">${esc(T('gwDocsNone'))}</p>`;
 return `<article class="card gw-card"><h2>${esc(T('gwStep2Title'))}</h2><p class="muted">${esc(T('gwStep2Lead'))}</p>
 <div class="grid2">${field(T('s015'),'institution.name',i.name,'text',T('fgw_institution_name'))}<label class="field gw-field"><span>${esc(T('gwHorizon'))}</span><div class="gw-years">${yearSelect('institution.startYear',i.startYear)}<span>→</span>${yearSelect('institution.endYear',i.endYear)}</div><span class="help">${esc(T('gwHorizonHelp'))}</span></label></div>
 ${field(T('identityStarterChange'),'institution.vision',i.vision,'textarea',T('gwVisionHelp'))}
 ${field(T('identityStarterWho'),'institution.beneficiaries',i.beneficiaries,'textarea',T('gwBeneficiariesHelp'))}
 ${field(T('gwBrief'),'brief',state.brief,'textarea',T('gwBriefHelp'),'rows="6"')}
 <details class="gw-optional"><summary>${esc(T('gwOptionalMore'))}</summary>${field(T('s272'),'institution.mission',i.mission,'textarea',T('gwMissionHelp'))}</details>
 <section class="gw-docs-box"><h3>${esc(T('gwDocsTitle'))}</h3><p class="muted">${esc(T('gwDocsLead'))}</p>${files}<label class="btn small gw-upload"><input type="file" accept="application/pdf,.pdf,.txt,.md,.csv,text/plain" multiple data-gw-action="docs" hidden>${esc(T('gwDocsAdd'))}</label><p class="help">${esc(T('gwDocsPrivacy'))}</p></section></article>`;
}
function sourceRow(s,k){
 return `<li class="gw-source ${s.status}" data-index="${k}"><div class="gw-source-head"><span class="pill ${s.origin==='ai'?'ai':'lib'}">${esc(s.origin==='ai'?T('uxOriginAiShort'):T('uxOriginLibraryShort'))}</span><span class="pill">${esc(kindLabel(s.kind))}</span><b>${esc(s.title)}</b></div><p>${esc([s.issuer,s.year].filter(Boolean).join(' · '))}${s.url?` · <a href="${esc(s.url)}" target="_blank" rel="noopener noreferrer">${esc(T('gwOpenSource'))} ↗</a>`:''}</p><p>${esc(s.summary)}</p>${s.relevance?`<p class="gw-relevance"><b>${esc(T('ctxColRelevance'))}:</b> ${esc(s.relevance)}</p>`:''}<div class="toolbar"><button type="button" class="btn small ${s.status==='accepted'?'primary':''}" data-gw-action="source-status" data-index="${k}" data-status="accepted">${esc(T('ctxAccept'))}</button><button type="button" class="btn small ${s.status==='rejected'?'danger':''}" data-gw-action="source-status" data-index="${k}" data-status="rejected">${esc(T('ctxReject'))}</button></div></li>`;
}
function step3(){
 const sector=scoped().sector(state.sectorId);
 const libRefs=sector?scoped().referencesFor(sector.id,state.typeId):[];
 const libList=sector?`<details class="gw-lib-refs" open><summary>${esc(T('gwLibraryRefs',[libRefs.length,sector.programs.length,sector.indicators.length]))}</summary><ul>${libRefs.map(r=>`<li><b>${esc(P(r.name))}</b> <small>${esc(P(r.issuer))}${r.url?` · <a href="${esc(r.url)}" target="_blank" rel="noopener noreferrer">↗</a>`:''}</small><br><span class="muted">${esc(P(r.relevance))}</span></li>`).join('')}</ul><p class="help">${esc(T('gwLibraryRefsNote'))}</p></details>`:`<p class="hint">${esc(T('gwNoSector'))}</p>`;
 const ctx=state.context;
 const ai=aiReady();
 const gather=`<div class="gw-gather"><h3>${esc(T('gwGatherTitle'))}</h3><p class="muted">${esc(T('gwGatherLead'))}</p>${aiStatusLine()}<div class="toolbar">${btn(ctx.sources.length?T('gwGatherAgain'):T('gwGather'),'gather','primary',ai?'':'disabled')}${ctx.sources.length?btn(T('gwAcceptAll'),'accept-all','small'):''}</div><div class="gw-progress" hidden></div></div>`;
 const list=ctx.sources.length?`<ul class="gw-sources">${ctx.sources.map(sourceRow).join('')}</ul>`:'';
 const memo=text(ctx.memo)?`<details class="gw-memo"><summary>${esc(T('gwMemo'))}</summary><pre>${esc(ctx.memo)}</pre></details>`:'';
 const questions=ctx.openQuestions?.length?`<div class="hint"><b>${esc(T('gwOpenQuestions'))}</b><ul>${ctx.openQuestions.map(q=>`<li>${esc(q)}</li>`).join('')}</ul></div>`:'';
 const docsum=ctx.documents?.length?`<div class="gw-docsum"><h3>${esc(T('ctxDocumentsLabel'))}</h3>${ctx.documents.map(d=>`<p><b>${esc(d.name)}</b><br>${esc(d.summary)}</p>`).join('')}</div>`:'';
 return `<article class="card gw-card"><h2>${esc(T('gwStep3Title'))}</h2><p class="muted">${esc(T('gwStep3Lead'))}</p>${libList}${gather}${list}${questions}${docsum}${memo}</article>`;
}
function goalCard(g,sectorId){
 const st=state.goals[g.id]||{},ind=scoped().indicator(sectorId,g.kpi),sel=!!st.selected;
 const typeLabel={requirement:T('s215'),differentiation:T('s216'),moonshot:T('s217'),divest:T('divest')}[g.type]||g.type;
 const drafted=T('gwGoalDrafts',[(g.refs||[]).length,(g.enablers||[]).length,(g.initiatives||[]).length]);
 return `<li class="gw-goal ${sel?'selected':''}" data-goal="${esc(g.id)}"><label class="gw-goal-head"><input type="checkbox" data-gw-action="goal" data-goal="${esc(g.id)}" ${sel?'checked':''}><span class="gw-goal-title"><b>${esc(P(g.title))}</b><span class="pill blue">${esc(typeLabel)}</span></span></label><p class="muted">${esc(T('gwGoalKpi'))}: ${esc(ind?P(ind.name):'—')}${ind?` (${esc(P(ind.unit))}, ${esc(ind.direction==='down'?T('s339'):T('s338'))})`:''} · ${esc(drafted)}</p><div class="gw-goal-fields grid3" ${sel?'':'hidden'}>${g.type==='requirement'?'':field(T('s341'),`goals.${g.id}.baseline`,st.baseline,'number',T('gwBaselineHelp'),'step="any"')}${field(T('s343'),`goals.${g.id}.target`,st.target,'number',T('gwTargetHelp'),'step="any"')}${field(T('s305'),`goals.${g.id}.owner`,st.owner||'','text',T('gwOwnerHelp'))}</div></li>`;
}
function step4(){
 const sector=scoped().sector(state.sectorId);
 const goals=sector?scoped().goalsFor(sector.id,state.typeId):[];
 const groups={};for(const g of goals)(groups[g.group]=groups[g.group]||[]).push(g);
 const groupLabel=k=>T('gwGroup_'+k);
 const lists=Object.entries(groups).map(([k,list])=>`<h3 class="gw-group">${esc(groupLabel(k))}</h3><ul class="gw-goals">${list.map(g=>goalCard(g,sector.id)).join('')}</ul>`).join('');
 const customs=state.custom.map((c,k)=>`<li class="gw-goal selected gw-custom"><div class="grid2">${field(T('s298'),`custom.${k}.title`,c.title,'text',T('gwCustomTitleHelp'))}${field(T('s335'),`custom.${k}.kpi`,c.kpi,'text',T('gwCustomKpiHelp'))}${field(T('s336'),`custom.${k}.unit`,c.unit,'text')}<label class="field gw-field"><span>${esc(T('s337'))}</span><select data-gw="custom.${k}.direction"><option value="up" ${c.direction!=='down'?'selected':''}>${esc(T('s338'))}</option><option value="down" ${c.direction==='down'?'selected':''}>${esc(T('s339'))}</option></select></label>${field(T('s341'),`custom.${k}.baseline`,c.baseline,'number','', 'step="any"')}${field(T('s343'),`custom.${k}.target`,c.target,'number','', 'step="any"')}${field(T('s305'),`custom.${k}.owner`,c.owner||'')}</div>${field(T('s300'),`custom.${k}.outcome`,c.outcome||'','textarea')}<button type="button" class="btn small danger" data-gw-action="custom-remove" data-index="${k}">${esc(T('s254'))}</button></li>`).join('');
 const n=selectedGoals().length+state.custom.filter(c=>text(c.title)).length;
 const funding=`<details class="gw-optional"><summary>${esc(T('gwFundingTitle'))}</summary><p class="muted">${esc(T('gwFundingLead'))}</p><div class="grid3">${yearsOf().map(y=>field(T('s440')+y+T('s441'),`funding.${y}`,state.funding[y],'number','', 'min="0" step="any"')).join('')}</div></details>`;
 return `<article class="card gw-card"><h2>${esc(T('gwStep4Title'))}</h2><p class="muted">${esc(T('gwStep4Lead'))}</p>${aiReady()?`<p class="hint">${esc(T('gwGoalsAiHint'))}</p>`:''}<p class="gw-selected-count">${esc(T('gwSelectedCount',[n]))}</p>${lists||`<p class="hint">${esc(T('gwNoSector'))}</p>`}<h3 class="gw-group">${esc(T('gwCustomTitle'))}</h3><ul class="gw-goals">${customs}</ul>${btn(T('gwCustomAdd'),'custom-add','small')}${funding}</article>`;
}
function yearsOf(){const s=state.institution.startYear,e=Math.max(s,Math.min(state.institution.endYear,s+15));const out=[];for(let y=s;y<=e;y++)out.push(y);return out;}
function step5(){
 const sector=scoped().sector(state.sectorId),sel=selectedGoals(),customs=state.custom.filter(c=>text(c.title));
 let preview=null;try{preview=D.build(spec());}catch(err){preview=null;}
 const counts=preview?{options:preview.options.length,references:preview.references.length,transitions:preview.transitions.length,enablers:preview.enablers.length,initiatives:preview.initiatives.length,mandates:preview.mandates.length,sources:state.context.sources.filter(s=>s.status==='accepted').length+preview.context.sources.length}:null;
 const rows=counts?[['s209',counts.options],['s285',counts.mandates],['s312',counts.references],['s210',counts.transitions],['s212',counts.enablers],['s213',counts.initiatives],['ctxSourcesLabel',counts.sources]].map(([k,v])=>`<div><span>${esc(T(k))}</span><strong>${v}</strong></div>`).join(''):'';
 const ready=text(state.institution.name)&&(sel.length||customs.length||aiReady());
 const ai=aiReady();
 return `<article class="card gw-card"><h2>${esc(T('gwStep5Title'))}</h2><p class="muted">${esc(T('gwStep5Lead'))}</p>
 <div class="gw-summary"><div><span>${esc(T('s015'))}</span><strong>${esc(state.institution.name||'—')}</strong></div><div><span>${esc(T('s271'))}</span><strong>${esc(sector?P(sector.name):'—')}</strong></div><div><span>${esc(T('gwHorizon'))}</span><strong>${state.institution.startYear}–${state.institution.endYear}</strong></div><div><span>${esc(T('gwStep4'))}</span><strong>${sel.length+customs.length}</strong></div></div>
 ${rows?`<h3>${esc(T('gwWillCreate'))}</h3><div class="gw-summary gw-counts-grid">${rows}</div>`:''}
 <p class="hint">${esc(T('gwDraftNote'))}</p>
 ${aiStatusLine()}
 <div class="gw-build"><div class="gw-build-option ${ai?'':'disabled'}"><h3>✦ ${esc(T('gwBuildAi'))}</h3><p>${esc(T('gwBuildAiLead'))}</p>${btn(T('gwBuildAiBtn'),'build-ai','primary',ai&&ready?'':'disabled')}</div><div class="gw-build-option"><h3>${esc(T('gwBuildLib'))}</h3><p>${esc(T('gwBuildLibLead'))}</p>${btn(T('gwBuildLibBtn'),'build-lib','primary',ready&&(sel.length||customs.length)?'':'disabled')}</div></div>
 ${ready?'':`<p class="hint warn">${esc(T('gwNotReady'))}</p>`}<div class="gw-progress" hidden></div></article>`;
}
function view(){
 const steps=[step1,step2,step3,step4,step5];
 return `<div class="heading gw-heading"><div><div class="eyebrow">${esc(T('mkGuided'))}</div><h1 tabindex="-1">${esc(T('gwTitle'))}</h1><p>${esc(T('gwLead'))}</p></div><div class="toolbar">${btn(T('gwReset'),'reset','small')}<button type="button" class="btn small" data-action="goto" data-section="identity">${esc(T('gwToWorkspace'))}</button></div></div>${stepper()}${steps[state.step-1]()}<div class="gw-nav">${state.step>1?btn(T('s545'),'prev'):'<span></span>'}${state.step<5?btn(T('s547')+[T('gwStep1'),T('gwStep2'),T('gwStep3'),T('gwStep4'),T('gwStep5')][state.step],'next','primary'):''}</div>`;
}

/* ---------------------------------------------------------------- actions */
function download(name,data,type){const blob=new Blob([data],{type}),url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download=name;document.body.append(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),5000);}
function toast(message,ms=7000){const el=document.getElementById('toast');if(!el)return;el.textContent=message;el.className='toast show';clearTimeout(toast.timer);toast.timer=setTimeout(()=>el.className='toast',ms);}
function progress(box,message){if(!box)return;box.hidden=false;box.innerHTML=`<span class="gw-spinner" aria-hidden="true"></span><span>${esc(message)}</span>`;}
function hasWork(p){return p&&(text(p.institution.name)||p.options.length||p.transitions.length||p.enablers.length||p.initiatives.length);}
function confirmReplace(){const p=project();if(!hasWork(p))return true;if(!confirm(T('gwReplaceConfirm')))return false;download('SULTAN_Auto_Backup_Before_Guided.json',JSON.stringify(p,null,2),'application/json');return true;}
function logUsage(p,purpose,usage){const list=Array.isArray(usage)?usage:[usage];for(const u of list)if(u&&E.recordAiUse)E.recordAiUse(p,{model:u.model,purpose,inputTokens:u.inputTokens,outputTokens:u.outputTokens});}
function previewProject(){const p=D.build(Object.assign({},spec(),{goals:[]}));applyContext(p);return p;}
function applyContext(p){
 for(const s of state.context.sources)E.addContextSource(p,Object.assign({},s,{status:s.status==='accepted'?'accepted':s.status==='rejected'?'rejected':'proposed'}));
 for(const d of state.context.documents||[]){const meta=docs.find(x=>x.name===d.name);if(!p.context.documents.some(x=>x.name===d.name))p.context.documents.push(E.contextDocument({name:d.name,kind:meta?.kind||'text',size:meta?.size||0,pages:null,summary:d.summary,addedAt:new Date().toISOString()}));}
 for(const u of state.aiLog)E.recordAiUse(p,u);
 return p;
}
async function gather(box){
 if(busy||!aiReady())return;busy=true;
 try{
  progress(box,T('gwGatherWorking'));
  const p=previewProject();
  const r=await AI.gatherContext({project:p,documents:docs,onProgress:x=>progress(box,T('gwGatherStreaming',[x.chars]))});
  const sources=(r.data?.sources||[]).map(s=>E.contextSource(Object.assign({},s,{status:'proposed',origin:'ai'})));
  state.context={sources,memo:r.memo,documents:r.data?.documents||[],openQuestions:r.data?.openQuestions||[],summary:r.data?.summary||''};
  for(const u of r.usage||[])state.aiLog.push({at:new Date().toISOString(),model:u.model,purpose:'context',inputTokens:u.inputTokens,outputTokens:u.outputTokens});
  save();toast(T('gwGatherDone',[sources.length]));root.SultanApp.navigate('guide');
 }catch(err){progress(box,'');box.innerHTML=`<p class="fg-ai-error">${esc(err?.message||String(err))}</p>`;}
 finally{busy=false;}
}
async function build(useAI,box){
 if(busy)return;busy=true;
 try{
  if(!confirmReplace())return;
  progress(box,T('gwBuilding'));
  let p=D.build(spec());applyContext(p);
  if(useAI&&aiReady()){
   const hints=[...selectedGoals().map(g=>P(scoped().goal(state.sectorId,g.goalId)?.title)),...state.custom.filter(c=>text(c.title)).map(c=>c.title)].filter(text);
   const r=await AI.generateStrategy({project:p,goalHints:hints,onProgress:x=>progress(box,T('gwAiStreaming',[x.chars]))});
   p=D.fromAI(r.data,p,{mode:'replace'});logUsage(p,'strategy',r.usage);
   if(r.truncated)toast(T('aiErrTruncated'),9000);
  }
  root.SultanApp.setProject(p);
  state.step=5;save();
  root.SultanApp.navigate('review');
  toast(useAI?T('gwBuiltAi'):T('gwBuiltLib'),9000);
 }catch(err){progress(box,'');box.innerHTML=`<p class="fg-ai-error">${esc(err?.message||String(err))}</p>`;}
 finally{busy=false;}
}
async function addFiles(files){
 for(const f of Array.from(files||[])){
  if(docs.length>=8){toast(T('gwDocsLimit'));break;}
  if(f.size>20*1024*1024){toast(T('gwDocsTooBig',[f.name]));continue;}
  const isPdf=f.type==='application/pdf'||/\.pdf$/i.test(f.name);
  try{const d={name:f.name,size:f.size,kind:isPdf?'pdf':'text'};if(isPdf)d.base64=await AI.fileToBase64(f);else d.text=await AI.fileToText(f);docs=docs.filter(x=>x.name!==f.name);docs.push(d);}catch{toast(T('s559'));}
 }
 root.SultanApp.navigate('guide');
}
document.addEventListener('input',e=>{const el=e.target.closest('[data-gw]');if(!el)return;let v=el.value;if(el.dataset.gw==='currency')v=v.toUpperCase();if(el.type==='number')v=v.trim()===''?null:Number(v);if(/Year$/.test(el.dataset.gw))v=Number(v);setPath(el.dataset.gw,v);});
document.addEventListener('change',e=>{
 const el=e.target;
 if(el.matches?.('[data-gw-action="docs"]')){addFiles(el.files);return;}
 if(el.matches?.('[data-gw-action="sector"]')){state.sectorId=el.value;state.typeId='';state.goals={};state.context=blankState().context;save();go(1);return;}
 if(el.matches?.('[data-gw-action="type"]')){state.typeId=el.value;save();go(1);return;}
 if(el.matches?.('[data-gw-action="goal"]')){const id=el.dataset.goal;state.goals[id]=Object.assign({},state.goals[id]||{},{selected:el.checked});save();const li=el.closest('.gw-goal');li?.classList.toggle('selected',el.checked);const f=li?.querySelector('.gw-goal-fields');if(f)f.hidden=!el.checked;const n=selectedGoals().length+state.custom.filter(c=>text(c.title)).length;const c=document.querySelector('.gw-selected-count');if(c)c.textContent=T('gwSelectedCount',[n]);return;}
 if(el.matches?.('[data-gw]')&&(el.tagName==='SELECT')){let v=el.value;if(/Year$/.test(el.dataset.gw))v=Number(v);setPath(el.dataset.gw,v);if(/Year$/.test(el.dataset.gw)){if(state.institution.endYear<state.institution.startYear)state.institution.endYear=state.institution.startYear;if(state.institution.endYear-state.institution.startYear>15)state.institution.endYear=state.institution.startYear+15;save();}}
});
document.addEventListener('click',async e=>{
 const b=e.target.closest('[data-gw-action]');if(!b||b.tagName==='INPUT')return;
 const a=b.dataset.gwAction,box=document.querySelector('.gw-progress');
 if(a==='go'){go(Number(b.dataset.step));return;}
 if(a==='prev'){go(state.step-1);return;}
 if(a==='next'){go(state.step+1);return;}
 if(a==='reset'){if(confirm(T('gwResetConfirm'))){reset();go(1);}return;}
 if(a==='ai-settings'){openAISettings();return;}
 if(a==='gather'){gather(box);return;}
 if(a==='accept-all'){state.context.sources.forEach(s=>{if(s.status!=='rejected')s.status='accepted';});save();go(3);return;}
 if(a==='source-status'){const s=state.context.sources[Number(b.dataset.index)];if(s){s.status=b.dataset.status;save();go(3);}return;}
 if(a==='doc-remove'){docs.splice(Number(b.dataset.index),1);go(2);return;}
 if(a==='custom-add'){state.custom.push({title:'',kpi:'',unit:'',direction:'up',baseline:null,target:null,owner:'',outcome:''});save();go(4);return;}
 if(a==='custom-remove'){state.custom.splice(Number(b.dataset.index),1);save();go(4);return;}
 if(a==='build-lib'){build(false,box);return;}
 if(a==='build-ai'){build(true,box);return;}
});

/* ---------------------------------------------------------------- AI settings dialog */
function aiDialogHtml(){
 const s=AI.settings(),key=AI.apiKey();
 return `<dialog id="aiDialog" aria-labelledby="aiDialogTitle"><div class="dialog-header"><div><span class="eyebrow">SULTAN · AI</span><h2 id="aiDialogTitle">${esc(T('aiSettings'))}</h2></div><button type="button" class="btn small" data-ai="close">${esc(T('close'))}</button></div>
 <p>${esc(T('aiSettingsLead'))}</p><p class="ai-notice" id="aiNotice" hidden></p>
 <form id="aiForm"><fieldset class="ai-transport"><legend>${esc(T('aiTransport'))}</legend><label><input type="radio" name="aiTransport" value="proxy" ${s.transport==='proxy'?'checked':''}> <b>${esc(T('aiTransportProxy'))}</b><small>${esc(T('aiTransportProxyHelp'))}</small></label><label><input type="radio" name="aiTransport" value="direct" ${s.transport==='direct'?'checked':''}> <b>${esc(T('aiTransportDirect'))}</b><small>${esc(T('aiTransportDirectHelp'))}</small></label></fieldset>
 <label class="field" data-ai-only="proxy"><span>${esc(T('aiEndpoint'))}</span><input id="aiEndpoint" type="url" value="${esc(s.endpoint)}" dir="ltr"><span class="help">${esc(T('aiEndpointHelp'))}</span></label>
 <label class="field" data-ai-only="direct"><span>${esc(T('aiKey'))}</span><input id="aiKey" type="password" value="${esc(key)}" autocomplete="off" dir="ltr" placeholder="sk-ant-…"><span class="help">${esc(T('aiKeyHelp'))}</span></label>
 <div class="grid2"><label class="field"><span>${esc(T('aiModel'))}</span><select id="aiModel">${AI.MODELS.map(m=>`<option value="${m.id}" ${s.model===m.id?'selected':''}>${esc(m.label)}</option>`).join('')}</select><span class="help">${esc(T('aiModelHelp'))}</span></label><label class="field"><span>${esc(T('aiEffort'))}</span><select id="aiEffort">${['medium','high','xhigh'].map(v=>`<option value="${v}" ${s.effort===v?'selected':''}>${esc(T('aiEffort_'+v))}</option>`).join('')}</select><span class="help">${esc(T('aiEffortHelp'))}</span></label></div>
 <label class="consent"><input type="checkbox" id="aiWeb" ${s.webSearch?'checked':''}><span>${esc(T('aiWebSearch'))}</span></label>
 <label class="consent ai-consent"><input type="checkbox" id="aiConsent" ${s.consent?'checked':''}><span>${esc(T('aiConsent'))}</span></label>
 <div class="toolbar"><button type="button" class="btn primary" data-ai="save">${esc(T('aiSave'))}</button><button type="button" class="btn" data-ai="test">${esc(T('aiTest'))}</button><button type="button" class="btn small danger" data-ai="forget">${esc(T('aiForget'))}</button></div><p id="aiStatus" role="status" class="muted"></p></form></dialog>`;
}
function openAISettings(notice){
 if(!AI)return;let el=document.getElementById('aiDialog');if(el)el.remove();
 document.body.insertAdjacentHTML('beforeend',aiDialogHtml());el=document.getElementById('aiDialog');
 const n=el.querySelector('#aiNotice');if(text(notice)){n.hidden=false;n.textContent=notice;}
 syncTransport(el);el.showModal();
}
function syncTransport(el){const v=el.querySelector('input[name="aiTransport"]:checked')?.value||'proxy';el.querySelectorAll('[data-ai-only]').forEach(x=>x.hidden=x.dataset.aiOnly!==v);}
function readAIForm(el){return {transport:el.querySelector('input[name="aiTransport"]:checked')?.value||'proxy',endpoint:el.querySelector('#aiEndpoint').value.trim()||AI.DEFAULT_PROXY,model:el.querySelector('#aiModel').value,effort:el.querySelector('#aiEffort').value,webSearch:el.querySelector('#aiWeb').checked,consent:el.querySelector('#aiConsent').checked};}
document.addEventListener('change',e=>{if(e.target.name==='aiTransport')syncTransport(document.getElementById('aiDialog'));});
document.addEventListener('click',async e=>{
 const b=e.target.closest('[data-ai]');if(!b||!AI)return;const el=document.getElementById('aiDialog');const status=el?.querySelector('#aiStatus');
 if(b.dataset.ai==='close'){el?.close();return;}
 if(b.dataset.ai==='forget'){AI.saveApiKey('');AI.saveSettings({consent:false});if(status)status.textContent=T('aiForgotten');el?.querySelector('#aiKey')&&(el.querySelector('#aiKey').value='');el?.querySelector('#aiConsent')&&(el.querySelector('#aiConsent').checked=false);refreshAfterSettings();return;}
 const form=readAIForm(el);
 if(b.dataset.ai==='save'||b.dataset.ai==='test'){AI.saveSettings(form);AI.saveApiKey(el.querySelector('#aiKey').value);if(!form.consent){status.textContent=T('aiNeedConsent');return;}}
 if(b.dataset.ai==='save'){status.textContent=AI.configured()?T('aiSaved'):T('aiSavedIncomplete');refreshAfterSettings();return;}
 if(b.dataset.ai==='test'){status.textContent=T('aiTesting');b.disabled=true;try{const r=await AI.ping();status.textContent=r.ok?T('aiTestOk'):T('aiTestOdd');}catch(err){status.textContent=T('aiTestFailed')+' '+(err?.message||err);}finally{b.disabled=false;refreshAfterSettings();}}
});
function refreshAfterSettings(){if(section()==='guide'||section()==='review'||section()==='references'||section()==='council')root.SultanApp.navigate(section());}

/* ---------------------------------------------------------------- workspace additions */
function renderNav(){
 const nav=document.getElementById('navigation');if(!nav||nav.querySelector('[data-section="guide"]'))return;
 const home=nav.querySelector('[data-section="home"]');const b=document.createElement('button');b.className='navbtn guide-nav'+(section()==='guide'?' active':'');b.dataset.action='goto';b.dataset.section='guide';if(section()==='guide')b.setAttribute('aria-current','page');b.innerHTML=`<span class="num">✦</span>${esc(T('gwNav'))}`;
 if(home)home.insertAdjacentElement('afterend',b);else nav.prepend(b);
 if(section()==='guide')nav.querySelectorAll('.navbtn').forEach(x=>{if(x!==b){x.classList.remove('active');x.removeAttribute('aria-current');}});
}
function renderBanner(){
 const p=project(),content=document.getElementById('content'),s=section();if(!p||!content||['home','about','guide','council'].includes(s)||content.querySelector('.fx-banner'))return;
 const sum=D.summary(p),ctx=E.contextSummary(p);if(!sum.library&&!sum.ai&&!ctx.proposed)return;
 const key='sultan.banner.'+(p.createdAt||'');try{if(localStorage.getItem(key)==='1')return;}catch{}
 const parts=[];if(sum.ai)parts.push(T('gwBannerAi',[sum.ai]));if(sum.library)parts.push(T('gwBannerLib',[sum.library]));if(ctx.proposed)parts.push(T('ctxIssueUnreviewed').replace('%{0}',String(ctx.proposed)));
 const el=document.createElement('div');el.className='fx-banner noPrint';el.innerHTML=`<div><b>${esc(T('gwBannerTitle'))}</b><span>${esc(parts.join(' · '))}</span></div><div class="toolbar"><button type="button" class="btn small" data-action="goto" data-section="references">${esc(T('gwBannerSources'))}</button><button type="button" class="btn small" data-banner-dismiss="${esc(key)}">${esc(T('close'))}</button></div>`;
 const heading=content.querySelector('.heading');if(heading)heading.insertAdjacentElement('afterend',el);else content.prepend(el);
}
document.addEventListener('click',e=>{const b=e.target.closest('[data-banner-dismiss]');if(!b)return;try{localStorage.setItem(b.dataset.bannerDismiss,'1');}catch{}b.closest('.fx-banner')?.remove();});
function dossierCard(){
 const p=project();if(!p?.context)return '';
 const c=p.context,sources=c.sources;
 const rows=sources.length?`<ul class="gw-sources compact">${sources.map((s,k)=>`<li class="gw-source ${s.status}"><div class="gw-source-head"><span class="pill ${s.origin==='ai'?'ai':s.origin==='library'?'lib':''}">${esc(s.origin==='ai'?T('uxOriginAiShort'):s.origin==='library'?T('uxOriginLibraryShort'):T('ctxOriginUser'))}</span><span class="pill">${esc(kindLabel(s.kind))}</span><b>${esc(s.title)}</b><span class="pill status-${s.status}">${esc(T('ctxStatus_'+s.status))}</span></div><p>${esc([s.issuer,s.year].filter(Boolean).join(' · '))}${s.url?` · <a href="${esc(s.url)}" target="_blank" rel="noopener noreferrer">↗</a>`:''} ${esc(s.relevance||s.summary)}</p><div class="toolbar">${s.status!=='accepted'?`<button type="button" class="btn small primary" data-ctx="status" data-id="${esc(s.id)}" data-status="accepted">${esc(T('ctxAccept'))}</button>`:''}${s.status!=='rejected'?`<button type="button" class="btn small" data-ctx="status" data-id="${esc(s.id)}" data-status="rejected">${esc(T('ctxReject'))}</button>`:''}${s.status==='accepted'&&['regulation','benchmark','indicator','program'].includes(s.kind)&&!p.references.some(r=>r.name===s.title)&&!p.mandates.some(m=>m.title===s.title)?`<button type="button" class="btn small" data-ctx="to-reference" data-id="${esc(s.id)}">${esc(s.kind==='program'?T('ctxToMandate'):T('ctxToReference'))}</button>`:''}<button type="button" class="btn small danger" data-ctx="remove" data-id="${esc(s.id)}">${esc(T('s254'))}</button></div></li>`).join('')}</ul>`:`<p class="muted">${esc(T('ctxEmpty'))}</p>`;
 const sector=scoped().sector(c.sectorId)||scoped().detect(p.institution.sector);
 return `<article class="card ctx-dossier"><div class="feature-head"><h2>${esc(T('ctxDossierTitle'))}</h2><span class="pill">${esc(T('ctxCounts',[E.contextSummary(p).accepted,sources.length]))}</span></div><p class="muted">${esc(T('ctxDossierLead'))}</p>${text(c.brief)?`<p><b>${esc(T('ctxBriefLabel'))}:</b> ${esc(c.brief)}</p>`:''}<div class="toolbar"><button type="button" class="btn small primary" data-ctx="library">${esc(T('libAddReference'))}</button><button type="button" class="btn small" data-ctx="gather" ${aiReady()?'':'disabled'}>✦ ${esc(T('gwGather'))}</button><button type="button" class="btn small" data-ctx="add">${esc(T('ctxAddManual'))}</button>${AI?`<button type="button" class="btn small" data-gw-action="ai-settings">${esc(T('aiSettings'))}</button>`:''}</div><div class="gw-progress" hidden></div>${rows}${sector?`<p class="help">${esc(state.market==='global'&&section()==='guide'||section()!=='guide'&&project()?.context?.market==='global'?T('mkLibrary'):T('gwLibraryNote',[P(sector.regulator),Lib.verifiedOn]))}</p>`:''}</article>`;
}
function renderDossier(){
 if(section()!=='references')return;const content=document.getElementById('content');if(!content||content.querySelector('.ctx-dossier'))return;
 const html=dossierCard();if(!html)return;const heading=content.querySelector('.heading');const anchor=content.querySelector('.route-initiative-note')||heading;if(anchor)anchor.insertAdjacentHTML('afterend',html);else content.insertAdjacentHTML('afterbegin',html);
}
function renderLibraryButtons(){
 const s=section(),content=document.getElementById('content');if(!content)return;
 if(s==='choices'){const add=content.querySelector('[data-action="add"][data-kind="options"]');if(add&&!content.querySelector('[data-lib="goals"]'))add.insertAdjacentHTML('afterend',` <button type="button" class="btn" data-lib="goals">${esc(T('libAddGoal'))}</button>`);}
 if(s==='references'){const p=project();(p?.transitions||[]).forEach((t,i)=>{const sel=content.querySelector(`[data-path="transitions.${i}.direction"]`),card=sel?.closest('article.card');if(!card||card.querySelector('[data-lib="interpolate"]'))return;const ok=['up','down'].includes(t.direction)&&num(t.baseline)&&num(t.target);const toolbar=card.querySelector(':scope > .toolbar')||card;toolbar.insertAdjacentHTML('afterbegin',`<button type="button" class="btn small" data-lib="interpolate" data-index="${i}" ${ok?'':'disabled'} title="${esc(ok?'':T('libInterpolateNeeds'))}">${esc(T('libInterpolate'))}</button>`);});}
}
function libraryDialogHtml(kind){
 const p=project();const sector=scoped().sector(p?.context?.sectorId)||scoped().detect(p?.institution?.sector)||scoped().sectors[0];
 const sectorSelect=`<label class="field"><span>${esc(T('s271'))}</span><select id="libSector">${scoped().sectors.map(s=>`<option value="${s.id}" ${sector?.id===s.id?'selected':''}>${esc(P(s.name))}</option>`).join('')}</select></label>`;
 return `<dialog id="libDialog" aria-labelledby="libDialogTitle" data-kind="${kind}"><div class="dialog-header"><div><span class="eyebrow">SULTAN · ${esc(T('libEyebrow'))}</span><h2 id="libDialogTitle">${esc(kind==='goals'?T('libAddGoal'):T('libAddReference'))}</h2></div><button type="button" class="btn small" data-lib="close">${esc(T('close'))}</button></div><p>${esc(kind==='goals'?T('libGoalsLead'):T('libRefsLead'))}</p>${sectorSelect}<div id="libList"></div><div class="toolbar"><button type="button" class="btn primary" data-lib="apply">${esc(T('libApply'))}</button><button type="button" class="btn" data-lib="close">${esc(T('close'))}</button></div><p class="help">${esc(state.market==='global'&&section()==='guide'||section()!=='guide'&&project()?.context?.market==='global'?T('mkLibrary'):T('gwLibraryNote',[P(sector.regulator),Lib.verifiedOn]))}</p></dialog>`;
}
function fillLibraryList(){
 const el=document.getElementById('libDialog');if(!el)return;const kind=el.dataset.kind,sectorId=el.querySelector('#libSector').value,p=project(),list=el.querySelector('#libList');
 if(kind==='goals'){const goals=scoped().goalsFor(sectorId,p?.context?.typeId);list.innerHTML=`<ul class="gw-goals">${goals.map(g=>{const ind=scoped().indicator(sectorId,g.kpi);const exists=p.options.some(o=>o.title===P(g.title));return `<li class="gw-goal"><label class="gw-goal-head"><input type="checkbox" value="${esc(g.id)}" ${exists?'disabled':''}><span class="gw-goal-title"><b>${esc(P(g.title))}</b>${exists?`<span class="pill">${esc(T('libAlreadyAdded'))}</span>`:''}</span></label><p class="muted">${esc(T('gwGoalKpi'))}: ${esc(ind?P(ind.name):'—')} · ${esc(T('gwGoalDrafts',[(g.refs||[]).length,(g.enablers||[]).length,(g.initiatives||[]).length]))}</p></li>`;}).join('')}</ul>`;}
 else{const refs=scoped().referencesFor(sectorId,p?.context?.typeId);list.innerHTML=`<ul class="gw-goals">${refs.map(r=>{const exists=p.references.some(x=>x.name===P(r.name));return `<li class="gw-goal"><label class="gw-goal-head"><input type="checkbox" value="${esc(r.id)}" ${exists?'disabled':''}><span class="gw-goal-title"><b>${esc(P(r.name))}</b><span class="pill blue">${esc({framework:T('s316'),benchmark:T('s317'),accreditation:T('s318'),internal:T('s319')}[r.kind]||r.kind)}</span>${exists?`<span class="pill">${esc(T('libAlreadyAdded'))}</span>`:''}</span></label><p class="muted">${esc(P(r.issuer))} · ${esc(P(r.relevance))}</p></li>`;}).join('')}</ul>`;}
}
function openLibrary(kind){let el=document.getElementById('libDialog');if(el)el.remove();document.body.insertAdjacentHTML('beforeend',libraryDialogHtml(kind));fillLibraryList();document.getElementById('libDialog').showModal();}
document.addEventListener('change',e=>{if(e.target.id==='libSector')fillLibraryList();});
document.addEventListener('click',e=>{
 const lib=e.target.closest('[data-lib]');
 if(lib){
  const a=lib.dataset.lib;
  if(a==='goals'||a==='refs'){openLibrary(a);return;}
  if(a==='close'){document.getElementById('libDialog')?.close();return;}
  if(a==='apply'){const el=document.getElementById('libDialog');const sectorId=el.querySelector('#libSector').value,ids=Array.from(el.querySelectorAll('#libList input:checked')).map(x=>x.value);if(!ids.length)return;const p=project();if(p.context&&!p.context.sectorId)p.context.sectorId=sectorId;if(el.dataset.kind==='goals')for(const id of ids)D.addGoal(p,sectorId,id,{});else for(const id of ids)D.addReference(p,sectorId,id);p.revision++;p.updatedAt=new Date().toISOString();root.SultanApp.setProject(p);el.close();root.SultanApp.navigate(section());toast(T('libAdded',[ids.length]));return;}
  if(a==='interpolate'){const p=project(),t=p.transitions[Number(lib.dataset.index)];if(!t)return;const n=D.interpolateAnnual(t,p,{overwrite:false});if(n===0&&!confirm(T('libInterpolateOverwrite')))return;if(n===0)D.interpolateAnnual(t,p,{overwrite:true});p.revision++;p.updatedAt=new Date().toISOString();root.SultanApp.setProject(p);root.SultanApp.navigate('references');toast(T('libInterpolated'));return;}
 }
 const ctx=e.target.closest('[data-ctx]');
 if(ctx){
  const a=ctx.dataset.ctx,p=project();if(!p)return;
  if(a==='library'){openLibrary('refs');return;}
  if(a==='gather'){gatherIntoProject(ctx.closest('.ctx-dossier')?.querySelector('.gw-progress'));return;}
  if(a==='add'){const title=prompt(T('ctxAddPrompt'));if(!text(title))return;E.addContextSource(p,{title,kind:'other',status:'accepted',origin:'user'});root.SultanApp.setProject(p);root.SultanApp.navigate('references');return;}
  const s=p.context.sources.find(x=>x.id===ctx.dataset.id);if(!s)return;
  if(a==='status'){s.status=ctx.dataset.status;}
  if(a==='remove'){p.context.sources=p.context.sources.filter(x=>x!==s);}
  if(a==='to-reference'){if(s.kind==='program')p.mandates.push({id:E.uid('mand'),title:s.title,relationship:'contribution',source:[s.issuer,s.url].filter(text).join(' — '),contribution:''});else p.references.push(Object.assign(E.reference(),{name:s.title,kind:s.kind==='benchmark'||s.kind==='indicator'?'benchmark':'framework',source:[s.issuer,s.url,s.year].filter(Boolean).join(' · '),purpose:s.summary,context:s.relevance,status:'unchecked'}));}
  p.revision++;p.updatedAt=new Date().toISOString();root.SultanApp.setProject(p);root.SultanApp.navigate('references');
 }
});
async function gatherIntoProject(box){
 if(busy||!aiReady())return;busy=true;
 try{progress(box,T('gwGatherWorking'));const p=project();const r=await AI.gatherContext({project:p,documents:[],onProgress:x=>progress(box,T('gwGatherStreaming',[x.chars]))});let n=0;for(const s of r.data?.sources||[]){const before=p.context.sources.length;E.addContextSource(p,Object.assign({},s,{status:'proposed',origin:'ai'}));if(p.context.sources.length>before)n++;}logUsage(p,'context',r.usage);p.revision++;p.updatedAt=new Date().toISOString();root.SultanApp.setProject(p);root.SultanApp.navigate('references');toast(T('gwGatherDone',[n]));}
 catch(err){if(box){box.hidden=false;box.innerHTML=`<p class="fg-ai-error">${esc(err?.message||String(err))}</p>`;}}
 finally{busy=false;}
}
/* Expert AI review in the Review section. */
function reviewCard(){
 const p=project();if(!p?.context)return '';
 const last=p.context.reviews.at(-1),stale=last&&!E.contextReviewIsCurrent(p,last);
 const sev={blocking:T('ctxSeverity_blocking'),warning:T('ctxSeverity_warning'),hint:T('ctxSeverity_hint')};
 const items=last?.items?.length?`<ul class="ai-review-items">${last.items.map(i=>`<li class="${i.severity}"><span class="pill status-${i.severity}">${esc(sev[i.severity]||i.severity)}</span><span>${esc(i.message)}</span><button type="button" class="btn small" data-action="goto" data-section="${esc(i.section==='context'?'references':i.section)}">${esc(T('s256'))}</button></li>`).join('')}</ul>`:'';
 return `<article class="card ai-review"><div class="feature-head"><h2>✦ ${esc(T(aiReady()?'aiReviewTitle':'localReviewTitle'))}</h2>${AI?`<button type="button" class="btn small" data-gw-action="ai-settings">${esc(T('aiSettings'))}</button>`:''}</div><p class="muted">${esc(T(aiReady()?'aiReviewLead':'localReviewLead'))}</p><div class="toolbar"><button type="button" class="btn primary" data-ai-review="run">${esc(last?T('aiReviewAgain'):T('aiReviewRun'))}</button>${aiReady()?'':`<span class="muted">${esc(T('gwAiOff'))}</span>`}</div><div class="gw-progress" hidden></div>${stale?`<p class="hint warn review-stale" role="status">${esc(T('ctxReviewStale'))}</p><details><summary>${esc(T('ctxReviewArchive'))}</summary>`:''}${last?`<p class="ai-review-meta">${esc(T('aiReviewedOn'))} ${esc(last.at.slice(0,10))} · ${esc(last.model)}</p><p class="ai-review-summary">${esc(last.summary)}</p>${items}`:''}${stale?'</details>':''}<p class="help">${esc(T('aiReviewDisclaimer'))}</p></article>`;
}
function renderReview(){
 if(section()!=='review')return;const content=document.getElementById('content');if(!content||content.querySelector('.ai-review'))return;
 const html=reviewCard();if(!html)return;const anchor=content.querySelector('.semantic-hints')||content.querySelector('.review-executive')||content.querySelector('.heading');if(anchor)anchor.insertAdjacentHTML('afterend',html);else content.insertAdjacentHTML('afterbegin',html);
}
document.addEventListener('click',async e=>{
 const b=e.target.closest('[data-ai-review="run"]');if(!b||busy)return;busy=true;const box=b.closest('.ai-review').querySelector('.gw-progress');
 try{progress(box,T('aiReviewWorking'));const p=project();const r=aiReady()?await AI.reviewStrategy({project:p}):{usage:{model:'local-rules',inputTokens:0,outputTokens:0},data:{summary:T('localReviewLead'),strengths:[],items:E.check(p).map(x=>({section:x.section,severity:x.level==='blocking'?'blocking':'warning',message:x.message,fix:'',lens:''}))}};E.addContextReview(p,{model:r.usage.model,summary:[r.data.summary,...(r.data.strengths||[]).map(s=>'✓ '+s)].filter(text).join('\n'),items:r.data.items||[]});if(aiReady())logUsage(p,'review',r.usage);p.revision++;p.updatedAt=new Date().toISOString();root.SultanApp.setProject(p);root.SultanApp.navigate('review');toast(T('aiReviewDone',[(r.data.items||[]).length]));}
 catch(err){box.hidden=false;box.innerHTML=`<p class="fg-ai-error">${esc(err?.message||String(err))}</p>`;}
 finally{busy=false;}
});
/* Older entrances may expose a guided CTA; the first-use hero owns its own two actions. */
function renderHome(){
 if(!document.body.classList.contains('is-home'))return;
 const actions=document.querySelector('.launch-hero .hero-actions');if(actions?.closest('[data-first-minute]'))return;if(!actions||actions.querySelector('[data-section="guide"]'))return;
 actions.insertAdjacentHTML('afterbegin',`<button type="button" class="btn primary gw-hero-cta" data-action="goto" data-section="guide">✦ ${esc(T('gwHomeCta'))}</button>`);
 actions.querySelectorAll('.btn.primary:not(.gw-hero-cta)').forEach(x=>{x.classList.remove('primary');x.classList.add('ghost');});
}
function afterRender(){setTimeout(()=>setTimeout(()=>setTimeout(()=>{renderNav();renderHome();renderBanner();renderDossier();renderLibraryButtons();renderReview();},0),0),0);}
document.addEventListener('sultan:render',afterRender);afterRender();
root.SultanGuided={view,state:()=>state,reset,spec,openAISettings,openLibrary,go};
})(globalThis);
