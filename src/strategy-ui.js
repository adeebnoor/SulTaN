/* Strategy studio UI. All edits use the canonical project store and import validator. */
(function(root){
'use strict';
const E=root.Sultan,S=root.SultanStrategy,I=root.SultanI18n,T=I.t,A=root.SultanApp;if(!S||!A)return;
const esc=x=>String(x??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const fmt=x=>E.num(x)?x.toLocaleString(I.locale,{maximumFractionDigits:2}):T('swUnknown');
const tabs=['diagnosis','services','opportunities','delivery','operating','execution','review'];
let goalText='',generating=false,generationNotice='';
const openDetails=new Set();
function goalComposer(p){const ai=!!root.SultanAI?.configured();return `<article class="card gp-composer"><h2>${esc(T('gpTitle'))}</h2><p>${esc(T('gpLead'))}</p><label class="field" for="gp-goals"><span>${esc(T('gpLabel'))}</span><textarea id="gp-goals" rows="4" maxlength="3100" placeholder="${esc(T('gpPlaceholder'))}" aria-describedby="gp-note">${esc(goalText)}</textarea></label><p id="gp-note" class="sw-note">${esc(T('gpNote'))}</p>${ai?`<label class="gp-ai"><input type="checkbox" id="gp-ai" checked> ${esc(T('gpAI'))}</label>`:''}<div class="toolbar"><button type="button" class="btn primary" data-gp="generate" ${generating?'disabled':''}>${esc(T('gpGenerate'))}</button>${E.selected(p).length?`<button type="button" class="btn" data-gp="existing" ${generating?'disabled':''}>${esc(T('gpExisting'))}</button>`:''}<button type="button" class="btn small" data-gw-action="ai-settings">${esc(T('aiSettings'))}</button></div><p id="gp-status" role="status" aria-live="polite">${esc(generating?T('gpWorking'):generationNotice)}</p></article>`;}
let active='diagnosis';try{const saved=sessionStorage.getItem('sultan.studio.tab');if(tabs.includes(saved))active=saved;}catch{}
const btn=(key,action,extra='')=>`<button type="button" class="btn" data-sw="${action}" ${extra}>${esc(T(key))}</button>`;
const link=(key,section)=>`<button type="button" class="btn" data-action="goto" data-section="${section}">${esc(T(key))}</button>`;
const title=(key,lead)=>`<h2>${esc(T(key))}</h2><p class="sw-note">${esc(T(lead))}</p>`;
function svcField(obj,path,k,options=null){
 const value=obj[k],id='svc_'+(path+'.'+k).replaceAll('.','_'),vals=options||S.enums[k],date=k.endsWith('Date')||k==='reviewDate',attrs=`id="${id}" data-path="${esc(path+'.'+k)}"`;
 let control;if(vals){control=`<select ${attrs}>${vals.map(v=>`<option value="${esc(v)}" ${value===v?'selected':''}>${esc(T((k==='confidence'?'swV_':'svcV_')+v))}</option>`).join('')}</select>`;}
 else if(date)control=`<input ${attrs} type="date" value="${esc(value||'')}">`;
 else control=`<textarea ${attrs} rows="2" maxlength="12000">${esc(value||'')}</textarea>`;
 return `<label class="field sw-field" for="${id}"><span>${esc(T('svcF_'+k))}</span>${control}<span class="field-error" hidden></span></label>`;
}
function svcChoiceField(p,obj,path){const id='svc_'+(path+'.optionId').replaceAll('.','_');return `<label class="field sw-field" for="${id}"><span>${esc(T('svcF_optionId'))}</span><select id="${id}" data-path="${esc(path+'.optionId')}"><option value=""></option>${p.options.map(o=>`<option value="${esc(o.id)}" ${obj.optionId===o.id?'selected':''}>${esc(o.title||T('swUnknown'))}</option>`).join('')}</select><span class="field-error" hidden></span></label>`;}
function field(obj,path,k){
 const value=obj[k],id='sw_'+(path+'.'+k).replaceAll('.','_'),opts=S.enums[k],numeric=['annualContract','customers','recurringShare','grossMargin','year','quantity','unitCost','likelihood','impact'].includes(k),date=['start','end','validationDate','reviewDate'].includes(k);
 const attrs=`id="${id}" data-path="${esc(path+'.'+k)}" aria-describedby="${id}_help"`;
 let control;if(opts)control=`<select ${attrs}>${opts.map(v=>`<option value="${v}" ${value===v?'selected':''}>${esc(T('swV_'+v))}</option>`).join('')}</select>`;
 else if(numeric||date)control=`<input ${attrs} type="${date?'date':'number'}" value="${esc(value??'')}" ${numeric?`min="${['likelihood','impact'].includes(k)?1:0}" ${['recurringShare','grossMargin'].includes(k)?'max="100"':['likelihood','impact'].includes(k)?'max="5"':''} step="${['customers','year','likelihood','impact'].includes(k)?1:'any'}"`:''}>`;
 else control=`<textarea ${attrs} rows="2" maxlength="12000">${esc(value)}</textarea>`;
 return `<label class="field sw-field" for="${id}"><span>${esc(T('swF_'+k))}</span>${control}<span class="help" id="${id}_help">${esc(T('swE_'+k))}</span><span class="field-error" hidden></span></label>`;
}
const grid=(obj,path,keys)=>`<div class="sw-grid">${keys.map(k=>field(obj,path,k)).join('')}</div>`;
const disclosure=(heading,body,key=heading)=>`<details class="sw-details" data-sw-detail="${esc(key)}" ${openDetails.has(key)?'open':''}><summary>${esc(heading)}</summary>${body}</details>`;
function picker(p,kind){const opp=kind==='opportunity',used=new Set((opp?p.strategy.opportunities:p.strategy.charters).map(x=>opp?x.optionId:x.initiativeId)),rows=(opp?p.options:p.initiatives).filter(x=>!used.has(x.id));return `<div class="sw-picker">${rows.length?`<label>${esc(T(opp?'swChooseOption':'swChooseInitiative'))}<select id="sw-pick-${kind}">${rows.map(x=>`<option value="${esc(x.id)}">${esc(x.title||T('swUnknown'))}</option>`).join('')}</select></label>${btn(opp?'swAddOpportunity':'swAddCharter','add-'+kind)}`:`<p>${esc(T(opp?'swNoOptions':'swNoInitiatives'))}</p>`}${link(opp?'swGoChoices':'swGoRoadmap',opp?'choices':'roadmap')}</div>`;}
function metrics(o){const n=S.economics(o);return `<p class="sw-note">${esc(T('swScenario'))}</p><div class="sw-metrics">${[['swAnnual',n.annual],['swRecurring',n.recurring],['swGross',n.grossProfit]].map(([k,v])=>`<div><span>${esc(T(k))}</span><strong>${esc(fmt(v))}</strong></div>`).join('')}</div>`;}
function compare(p){return `<h3>${esc(T('swComparison'))}</h3><div class="tablewrap"><table class="sw-comparison"><thead><tr>${['swF_segment','swDecision','swAnnual','swRecurring','swF_route','swF_confidence'].map(k=>`<th>${esc(T(k))}</th>`).join('')}</tr></thead><tbody>${p.strategy.opportunities.map(o=>{const n=S.economics(o),x=p.options.find(x=>x.id===o.optionId);return `<tr><td>${esc(o.segment||x?.title||T('swUnlinked'))}</td><td>${esc(x?T('swDecision_'+x.decision):T('swUnlinked'))}</td><td>${esc(fmt(n.annual))}</td><td>${esc(fmt(n.recurring))}</td><td>${esc(T('swV_'+o.route))}</td><td>${esc(T('swV_'+o.confidence))}</td></tr>`;}).join('')}</tbody></table></div>`;}
function opportunities(p,delivery=false){
 let h=title(delivery?'swTab_delivery':'swTab_opportunities',delivery?'swRouteNote':'swComparisonNote')+picker(p,'opportunity');
 h+=p.strategy.opportunities.map((o,i)=>{const path=`strategy.opportunities.${i}`,x=p.options.find(x=>x.id===o.optionId);let body=`<div class="sw-record-title"><h3>${esc(x?.title||T('swUnlinked'))}</h3><span class="pill">${esc(x?T('swDecision_'+x.decision):T('swUnlinked'))}</span></div>`;
  if(delivery){body+=grid(o,path,['route'])+grid(o,path,['buildRationale','partnerRationale','acquireRationale','routeReason']);if(o.route==='partner')body+=grid(o,path,['ourContribution','partnerContribution','partnerIncentive','partnerEvidence']);if(o.route==='acquire')body+=grid(o,path,['dueDiligence','integrationPlan']);body+=disclosure(T('swF_validationOwner'),grid(o,path,['validationOwner','validationDate','killCriterion']),path+'.validation');}
  else{body+=grid(o,path,['segment','buyer','need','demandEvidence','valueModel','confidence']);if(o.valueModel==='commercial')body+=grid(o,path,['annualContract','customers','recurringShare','grossMargin','renewalDriver','valueEvidence'])+`<div data-sw-economics="${i}">${metrics(o)}</div>`;else body+=grid(o,path,['valueEvidence']);body+=disclosure(T('swF_agenda'),grid(o,path,['agenda','agendaEvidence']),path+'.agenda');if(x)body+=disclosure(T('s006'),`<p>${esc(x.whyUs||T('swUnknown'))}</p>${link('swGoChoices','choices')}`,path+'.choice');}
  return `<article class="card sw-record">${body}${btn('swRemove','remove-opportunity',`data-index="${i}"`)}</article>`;
 }).join('');if(!delivery&&p.strategy.opportunities.length)h+=`<div id="sw-comparison">${compare(p)}</div>`;return h;
}
function rows(c,i,kind){const plural={activity:'activities',cost:'costs',risk:'risks'}[kind],extra={activity:['status'],cost:['year','quantity','unitCost','category'],risk:['likelihood','impact']}[kind];return `<h4>${esc(T('swRows_'+kind))}</h4>${c[plural].map((r,j)=>`<div class="sw-row"><b>${j+1}</b>${grid(r,`strategy.charters.${i}.${plural}.${j}`,[...S.fields[kind],...extra])}${btn('swRemove','remove-row',`data-index="${i}" data-kind="${kind}" data-row="${j}"`)}</div>`).join('')}${btn('swAdd_'+kind,'add-row',`data-kind="${kind}" data-index="${i}"`)}`;}
function execution(p){let h=title('swTab_execution','swLinkedNote')+picker(p,'charter');return h+p.strategy.charters.map((c,i)=>{const path=`strategy.charters.${i}`,x=p.initiatives.find(x=>x.id===c.initiativeId),t=p.transitions.find(t=>t.id===x?.transitionId),owner=x?.owner||T('swUnknown');return `<article class="card sw-record"><h3>${esc(x?.title||T('swUnlinked'))}</h3><p>${esc(T('swF_owner'))}: ${esc(owner)} · ${esc(x?.startYear||'—')}–${esc(x?.endYear||'—')}</p><p class="sw-linked">${esc(T('swLinkedKpi'))}: <b>${esc(t?.kpi||T('swUnknown'))}</b> · ${esc(fmt(t?.baseline))} ← ${esc(fmt(t?.target))} ${esc(t?.unit||'')}</p>${grid(c,path,['priority','executionMode','sponsor','scope','benefit','benefitOwner'])}${disclosure(T('swLinkedKpi'),grid(c,path,['formula','measurementSource','frequency','outOfScope','resources','handover','reviewDate']),path+'.measurement')}${disclosure(T('swRows_activity'),rows(c,i,'activity'),path+'.activity')}${disclosure(T('swRows_cost'),rows(c,i,'cost')+`<p data-sw-cost-total="${i}">${esc(T('swCostTotal'))}: <b>${esc(fmt(S.costs(c).total))}</b></p><p class="sw-note">${esc(T('swBudgetNote'))}</p>`+btn('swSyncBudget','sync-budget',`data-index="${i}"`),path+'.cost')}${disclosure(T('swRows_risk'),rows(c,i,'risk'),path+'.risk')}${btn('swRemove','remove-charter',`data-index="${i}"`)}</article>`;}).join('');}
function review(p){const r=S.readiness(p),q=S.issues(p);return title('swTab_review','swReviewNote')+`<div class="sw-stage-grid">${r.stages.map(x=>`<div class="sw-stage ${x.done?'complete':''}"><b>${esc(T('swTab_'+x.key))}</b><span>${esc(T(x.done?'swComplete':'swPending'))}</span></div>`).join('')}</div><p>${esc(T('swCycle'))}</p><article class="card"><h3>${esc(T('swOpen'))} (${q.length})</h3>${q.length?'<ul class="sw-issues">'+q.map(x=>`<li>${esc(x.message)}</li>`).join('')+'</ul>':`<p>${esc(T('swFieldsComplete'))}</p>`}</article>${link('swGoReview','review')}`;}
function serviceHub(p){
 const s=p.strategy||S.defaults(),v=s.services||S.defaults().services,r=S.serviceReadiness(p);
 const phases=[['discover','svcMacro_discover','svcMacro_discoverD'],['decide','svcMacro_decide','svcMacro_decideD'],['challenge','svcMacro_challenge','svcMacro_challengeD'],['execute','svcMacro_execute','svcMacro_executeD'],['watch','svcMacro_watch','svcMacro_watchD']];
 const defs=[
  ['shift','svcShiftRadar','svcShiftRadarD','svcShiftRadarO','services','svc-shifts'],
  ['channel','svcChannel','svcChannelD','svcChannelO','services','svc-shifts'],
  ['inaction','svcCostInaction','svcCostInactionD','svcCostInactionO','services','svc-inaction'],
  ['route','svcRoute','svcRouteD','svcRouteO','delivery',''],
  ['partnership','svcPartnership','svcPartnershipD','svcPartnershipO','delivery',''],
  ['recurring','svcRecurring','svcRecurringD','svcRecurringO','opportunities',''],
  ['experiment','svcExperiment','svcExperimentD','svcExperimentO','delivery',''],
  ['evidence','svcEvidence','svcEvidenceD','svcEvidenceO','diagnosis',''],
  ['adversarial','svcAdversarial','svcAdversarialD','svcAdversarialO','council',''],
  ['execution','svcExecution','svcExecutionD','svcExecutionO','execution',''],
  ['benchmark','svcBenchmark','svcBenchmarkD','svcBenchmarkO','references',''],
  ['board','svcBoard','svcBoardD','svcBoardO','council',''],
  ['watch','svcWatch','svcWatchD','svcWatchO','services','svc-watch']
 ];
 let h=`<div class="sw-header"><span class="eyebrow">${esc(T('svcAvailable'))}</span><h2>${esc(T('svcTab'))}</h2><p>${esc(T('svcLead'))}</p><p><b>${esc(T('svcFlow'))}</b></p></div>`;
 h+=`<div class="svc-flow">${phases.map(x=>`<div class="svc-phase"><b>${esc(T(x[1]))}</b><span>${esc(T(x[2]))}</span></div>`).join('')}</div>`;
 h+=`<div class="svc-catalog">${defs.map(([key,titleKey,descKey,outKey,target,anchor])=>`<article class="svc-card"><span class="svc-status ${r[key]?.done?'done':'todo'}">${esc(T(r[key]?.done?'svcStatus_done':'svcStatus_start'))}</span><h3>${esc(T(titleKey))}</h3><p>${esc(T(descKey))}</p><p class="svc-output"><b>${esc(T('svcOutput'))}:</b> ${esc(T(outKey))}</p><div class="toolbar"><button type="button" class="btn small" data-svc-target="${esc(target)}" ${anchor?`data-svc-anchor="${esc(anchor)}"`:''}>${esc(T('svcOpen'))}</button></div></article>`).join('')}</div>`;
 h+=`<article class="card svc-editor" id="svc-shifts"><h3>${esc(T('svcShiftEditor'))}</h3><p class="sw-note">${esc(T('svcShiftEditorD'))}</p>${v.shifts.map((x,i)=>{const path=`strategy.services.shifts.${i}`;return `<div class="svc-record">${svcField(x,path,'shiftType')}${svcField(x,path,'signal')}${svcField(x,path,'evidence')}${svcField(x,path,'implication')}${svcField(x,path,'horizon')}${svcField(x,path,'response')}${svcField(x,path,'confidence')}<div class="svc-actions">${btn('svcRemoveShift','svc-remove-shift',`data-index="${i}"`)}</div></div>`;}).join('')}${btn('svcAddShift','svc-add-shift')}</article>`;
 h+=`<article class="card svc-editor" id="svc-inaction"><h3>${esc(T('svcInactionEditor'))}</h3><p class="sw-note">${esc(T('svcInactionEditorD'))}</p>${v.inaction.map((x,i)=>{const path=`strategy.services.inaction.${i}`;return `<div class="svc-record">${svcChoiceField(p,x,path)}${svcField(x,path,'decision')}${svcField(x,path,'consequence')}${svcField(x,path,'trigger')}${svcField(x,path,'window')}${svcField(x,path,'actionCost')}${svcField(x,path,'inactionCost')}${svcField(x,path,'reversibility')}${svcField(x,path,'learningValue')}${svcField(x,path,'owner')}${svcField(x,path,'reviewDate')}<div class="svc-actions">${btn('svcRemoveInaction','svc-remove-inaction',`data-index="${i}"`)}</div></div>`;}).join('')}${btn('svcAddInaction','svc-add-inaction')}</article>`;
 const w=v.watch,path='strategy.services.watch';h+=`<article class="card svc-editor" id="svc-watch"><h3>${esc(T('svcWatchEditor'))}</h3><p class="sw-note">${esc(T('svcWatchEditorD'))}</p>${svcField(w,path,'owner')}${svcField(w,path,'reviewCadence')}${svcField(w,path,'triggers')}${svcField(w,path,'nextReviewDate')}</article>`;
 return h;
}
function view(){const p=A.getProject(),s=p.strategy||S.defaults();let h=`<div class="sw-header"><span class="eyebrow">${esc(T('mkEyebrow'))}</span><h1 tabindex="-1">${esc(T('swTitle'))}</h1><p>${esc(T('swLead'))}</p></div>`+goalComposer(p);
 if(!s.enabled)return h+`<article class="card sw-start"><p>${esc(T('swIntro'))}</p><div class="sw-stage-grid">${['diagnosis','opportunities','delivery','operating','execution'].map(k=>`<div class="sw-stage"><b>${esc(T('swTab_'+k))}</b></div>`).join('')}</div>${btn('swEnable','enable')}</article>`;
 h+=`<div class="sw-tabs" role="tablist" aria-label="${esc(T('swTitle'))}">${tabs.map(k=>`<button type="button" role="tab" id="sw-tab-${k}" aria-selected="${active===k}" aria-controls="sw-panel" data-sw-tab="${k}" class="${active===k?'active':''}">${esc(T('swTab_'+k))}</button>`).join('')}</div><section id="sw-panel" role="tabpanel" aria-labelledby="sw-tab-${active}">`;
 if(p.isDemo)h+=`<p class="sw-note">${esc(T('swSampleNote'))}</p>`;
 if(active==='diagnosis')h+=`<article class="card">${title('swTab_diagnosis','swDiagnosisNote')}${grid(s.assessment,'strategy.assessment',S.fields.assessment)}${link('swGoMaturity','references')}</article>`;
 if(active==='services')h+=serviceHub(p);
 if(active==='opportunities'||active==='delivery')h+=opportunities(p,active==='delivery');
 if(active==='operating')h+=`<article class="card">${title('swTab_operating','swOperatingNote')}${grid(s.operating,'strategy.operating',['mode','currentModel','gaps'])}${s.operating.mode==='reuse'?'':grid(s.operating,'strategy.operating',S.fields.operating.filter(k=>!['currentModel','gaps'].includes(k)))}</article>`;
 if(active==='execution')h+=execution(p);if(active==='review')h+=review(p);return h+'</section>';
}
function save(p){p.revision++;p.reviewedRevision=null;p.updatedAt=new Date().toISOString();A.setProject(p);}
document.addEventListener('click',e=>{const summary=e.target.closest('.sw-details > summary');if(!summary)return;const detail=summary.parentElement,key=detail.dataset.swDetail;if(detail.open)openDetails.delete(key);else openDetails.add(key);});
document.addEventListener('input',e=>{if(e.target.id==='gp-goals')goalText=e.target.value;});
document.addEventListener('click',async e=>{const b=e.target.closest('[data-gp]');if(!b||generating||!root.SultanGoalPlanner)return;const base=A.getProject(),snapshot=JSON.stringify(base),raw=b.dataset.gp==='existing'?'':document.getElementById('gp-goals')?.value||'',useAI=!!document.getElementById('gp-ai')?.checked;generating=true;generationNotice='';document.querySelectorAll('[data-gp]').forEach(x=>x.disabled=true);const status=document.getElementById('gp-status');if(status)status.textContent=T('gpWorking');
 try{if(b.dataset.gp==='generate'&&!raw.trim())throw Error(T('gpEmpty'));const r=await root.SultanGoalPlanner.generate(base,raw,{useAI});if(JSON.stringify(A.getProject())!==snapshot)throw Error(T('gpChanged'));generationNotice=(r.fallback?T('gpAIFallback')+' ':'')+(r.researchPending?T('gpResearchPending')+' ':'')+T('gpDone',[r.counts.goals,r.counts.kpis,r.counts.initiatives]);goalText='';active='execution';try{sessionStorage.setItem('sultan.studio.tab',active);}catch{}generating=false;save(r.project);A.navigate('strategy');document.getElementById('gp-status')?.scrollIntoView({block:'center'});}
 catch(err){generationNotice=err.message;const box=document.getElementById('gp-status');if(box)box.textContent=generationNotice;}
 finally{generating=false;document.querySelectorAll('[data-gp]').forEach(x=>x.disabled=false);}
});
document.addEventListener('click',e=>{const svc=e.target.closest('[data-svc-target]');if(svc){const target=svc.dataset.svcTarget,anchor=svc.dataset.svcAnchor;if(target==='services'){active='services';try{sessionStorage.setItem('sultan.studio.tab',active);}catch{}A.navigate('strategy');setTimeout(()=>document.getElementById(anchor)?.scrollIntoView({behavior:'smooth',block:'start'}),0);}else if(tabs.includes(target)){active=target;try{sessionStorage.setItem('sultan.studio.tab',active);}catch{}A.navigate('strategy');}else A.navigate(target);return;}const tab=e.target.closest('[data-sw-tab]');if(tab){active=tab.dataset.swTab;try{sessionStorage.setItem('sultan.studio.tab',active);}catch{}A.navigate('strategy');document.getElementById('sw-tab-'+active)?.focus();return;}
 const b=e.target.closest('[data-sw]');if(!b)return;const p=A.getProject(),s=p.strategy||S.defaults();try{
  if(b.dataset.sw==='enable'){S.ensure(p);save(p);return;}
  if(b.dataset.sw==='svc-add-shift'){S.addShift(p);save(p);active='services';return;}
  if(b.dataset.sw==='svc-add-inaction'){S.addInaction(p,E.selected(p)[0]?.id||'');save(p);active='services';return;}
  if(b.dataset.sw==='svc-remove-shift'||b.dataset.sw==='svc-remove-inaction'){if(!confirm(T('swRemoveConfirm')))return;const key=b.dataset.sw==='svc-remove-shift'?'shifts':'inaction';s.services[key].splice(Number(b.dataset.index),1);save(p);active='services';return;}
  if(b.dataset.sw==='add-opportunity'||b.dataset.sw==='add-charter'){const opp=b.dataset.sw==='add-opportunity',id=document.getElementById('sw-pick-'+(opp?'opportunity':'charter'))?.value;if(!id)return;(opp?S.addOpportunity:S.addCharter)(p,id);save(p);return;}
  if(b.dataset.sw==='add-row'){const c=s.charters[Number(b.dataset.index)],kind=b.dataset.kind,key={activity:'activities',cost:'costs',risk:'risks'}[kind];if(!c||!key)return;if(c[key].length>=100)throw Error(T('swLimit'));c[key].push(S[kind](p.institution.startYear));save(p);const cards=document.querySelectorAll('.sw-record');cards[Number(b.dataset.index)]?.querySelectorAll('details').forEach(x=>{if(x.querySelector(`[data-kind="${kind}"]`)){x.open=true;openDetails.add(x.dataset.swDetail);}});return;}
  if(['remove-opportunity','remove-charter','remove-row'].includes(b.dataset.sw)){
   if(!confirm(T('swRemoveConfirm')))return;
   const index=Number(b.dataset.index);
   if(b.dataset.sw==='remove-row'){const key={activity:'activities',cost:'costs',risk:'risks'}[b.dataset.kind];if(key)s.charters[index][key].splice(Number(b.dataset.row),1);}
   else s[b.dataset.sw==='remove-opportunity'?'opportunities':'charters'].splice(index,1);
   save(p);return;
  }
  if(b.dataset.sw==='sync-budget'){if(!confirm(T('swSyncConfirm')))return;S.syncBudget(p,s.charters[Number(b.dataset.index)]);save(p);}
 }catch(err){const toast=document.getElementById('toast');toast.textContent=err.message;toast.className='toast show';setTimeout(()=>toast.className='toast',6000);}
});
document.addEventListener('input',e=>{if(!e.target.dataset.path?.startsWith('strategy.'))return;const p=A.getProject();document.querySelectorAll('[data-sw-economics]').forEach(el=>{const o=p.strategy.opportunities[+el.dataset.swEconomics];if(o)el.innerHTML=metrics(o);});document.querySelectorAll('[data-sw-cost-total]').forEach(el=>{const c=p.strategy.charters[+el.dataset.swCostTotal];if(c)el.innerHTML=esc(T('swCostTotal'))+': <b>'+esc(fmt(S.costs(c).total))+'</b>';});const comp=document.getElementById('sw-comparison');if(comp)comp.innerHTML=compare(p);});
const baseReport=A.getReport.bind(A);A.getReport=()=>{const body=baseReport(),extra=S.report(A.getProject()),i=body.lastIndexOf('</article>');return i>=0?body.slice(0,i)+extra+body.slice(i):body+extra;};
function apply(){const section=location.hash.slice(1),content=document.getElementById('content');if(!content)return;
 if(section==='home'&&!content.querySelector('[data-first-minute]')&&!content.querySelector('.gp-hero-cta')){content.querySelector('.launch-hero .hero-actions')?.insertAdjacentHTML('beforeend',`<button type="button" class="btn gp-hero-cta" data-action="goto" data-section="strategy">${esc(T('gpTitle'))}</button>`);}
 if(section==='review'){const host=content.querySelector('.report');if(host&&!host.querySelector('[data-report-section="strategy-workbench"]'))host.insertAdjacentHTML('beforeend',S.report(A.getProject()));}
 if(['choices','enablers','roadmap','review'].includes(section)&&!content.querySelector('.sw-entry')){const el=document.createElement('div');el.className='sw-entry';el.innerHTML=`<p>${esc(T('swStudioHint'))}</p>${link('swOpenStudio','strategy')}`;content.querySelector('h1')?.parentElement?.insertAdjacentElement('afterend',el);}
}
document.addEventListener('sultan:render',()=>setTimeout(apply,0));root.SultanStudio={view,apply,openExecution(){active='execution';try{sessionStorage.setItem('sultan.studio.tab',active);}catch{}A.navigate('strategy');}};if(location.hash==='#strategy')A.navigate('strategy');else apply();
})(globalThis);
