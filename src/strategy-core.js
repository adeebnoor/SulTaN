/* Sector-neutral strategy design: evidence, route choice, operating model and execution cards. */
(function(root){
'use strict';
const E=root.Sultan;if(!E)return;
const T=(k,v)=>root.SultanI18n.t(k,v),copy=x=>JSON.parse(JSON.stringify(x));
const text=x=>typeof x==='string'&&x.trim().length>0,num=x=>typeof x==='number'&&Number.isFinite(x);
const esc=x=>String(x??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const fields={
 assessment:['problem','scope','currentState','evidence','benchmark','riskAppetite'],
 operating:['currentModel','gaps','governanceOwner','decisionRights','managementOwner','capabilities','sourcing','targetModel','transitionModel','cadence'],
 opportunity:['segment','buyer','need','demandEvidence','agenda','agendaEvidence','renewalDriver','valueEvidence','buildRationale','partnerRationale','acquireRationale','routeReason','ourContribution','partnerContribution','partnerIncentive','partnerEvidence','dueDiligence','integrationPlan','validationOwner','validationDate','killCriterion'],
 charter:['sponsor','scope','outOfScope','benefit','benefitOwner','formula','measurementSource','frequency','resources','handover','reviewDate'],
 activity:['title','owner','start','end','output','acceptance'],
 cost:['label','unit'],risk:['title','owner','mitigation','trigger'],
 shift:['signal','evidence','implication'],inaction:['decision','consequence','trigger','window','actionCost','inactionCost','owner'],watch:['owner','triggers']
};
const enums={valueModel:['commercial','public'],confidence:['hypothesis','documented'],route:['undecided','build','partner','acquire'],mode:['assess','reuse','adapt','design'],priority:['anchor','quickwin','foundation'],executionMode:['internal','advisory','delivery'],category:['capex','opex'],status:['planned','active','done'],shiftType:['customer','channel','technology','value-chain','economics','regulation'],horizon:['now','near','later'],response:['ignore','experiment','partner','build','acquire','scale'],reversibility:['unknown','high','medium','low'],learningValue:['unknown','high','medium','low'],reviewCadence:['monthly','quarterly','semiannual','annual']};
// Register every studio input in the existing why/example guidance system.
const guidance={assessment:fields.assessment,operating:[...fields.operating,'mode'],opportunities:[...fields.opportunity,'valueModel','confidence','route','annualContract','customers','recurringShare','grossMargin'],charters:[...fields.charter,'priority','executionMode'],'charters.activities':[...fields.activity,'status'],'charters.costs':[...fields.cost,'year','quantity','unitCost','category'],'charters.risks':[...fields.risk,'likelihood','impact']};
for(const [group,keys] of Object.entries(guidance))for(const k of keys){const pattern=('strategy.'+group+'.'+k).replaceAll('.','_');for(const lang of ['en','ar']){const d=root.SultanLocales[lang];d['fgw_'+pattern]=d['swW_'+k];d['fge_'+pattern]=d['swE_'+k];}if(root.SultanFieldGuide&&!root.SultanFieldGuide.patterns.includes(pattern))root.SultanFieldGuide.patterns.push(pattern);}
const strings=kind=>Object.fromEntries(fields[kind].map(k=>[k,'']));
const defaults=()=>({version:1,enabled:false,assessment:strings('assessment'),operating:{...strings('operating'),mode:'assess'},opportunities:[],charters:[],services:{shifts:[],inaction:[],watch:{owner:'',reviewCadence:'quarterly',triggers:'',nextReviewDate:''}}});
const opportunity=optionId=>({id:E.uid('opp'),optionId:optionId||'',...strings('opportunity'),valueModel:'commercial',confidence:'hypothesis',route:'undecided',annualContract:null,customers:null,recurringShare:null,grossMargin:null});
const charter=initiativeId=>({id:E.uid('charter'),initiativeId:initiativeId||'',...strings('charter'),priority:'foundation',executionMode:'internal',activities:[],costs:[],risks:[]});
const activity=()=>({id:E.uid('activity'),...strings('activity'),status:'planned'});
const cost=year=>({id:E.uid('cost'),...strings('cost'),year:year??null,quantity:null,unitCost:null,category:'opex'});
const risk=()=>({id:E.uid('risk'),...strings('risk'),likelihood:null,impact:null});
const shift=()=>({id:E.uid('shift'),shiftType:'channel',...strings('shift'),horizon:'near',response:'experiment',confidence:'hypothesis'});
const inaction=optionId=>({id:E.uid('inaction'),optionId:optionId||'',...strings('inaction'),reversibility:'unknown',learningValue:'unknown',reviewDate:''});
function shape(raw,template,path){
 if(raw===undefined)return copy(template);
 if(!raw||typeof raw!=='object'||Array.isArray(raw))throw Error(T('swInvalid')+' '+path);
 for(const k of Object.keys(raw))if(!Object.hasOwn(template,k))throw Error(T('swInvalid')+' '+path+'.'+k);
 const out=copy(template);
 for(const [k,v] of Object.entries(raw)){
  const at=path+'.'+k,d=template[k];
  if(Array.isArray(d)){if(!Array.isArray(v)||v.length>100)throw Error(T('swInvalid')+' '+at);out[k]=copy(v);}
  else if(d&&typeof d==='object')out[k]=shape(v,d,at);
  else if(typeof d==='string'){
   if(typeof v!=='string'||v.length>12000)throw Error(T('swInvalid')+' '+at);
   if(enums[k]&&!enums[k].includes(v))throw Error(T('swInvalid')+' '+at);
   if((k==='id'||k.endsWith('Id'))&&v&&!/^[A-Za-z0-9_-]{1,80}$/.test(v))throw Error(T('swInvalid')+' '+at);
   if((k==='start'||k==='end'||k.endsWith('Date'))&&v&&(!/^\d{4}-\d{2}-\d{2}$/.test(v)||!Number.isFinite(Date.parse(v))||new Date(v).toISOString().slice(0,10)!==v))throw Error(T('swInvalid')+' '+at);
   out[k]=v;
  }else if(d===null){if(v!==null&&(!num(v)||v<0||v>1e15||(['recurringShare','grossMargin'].includes(k)&&v>100)||(['likelihood','impact'].includes(k)&&(v<1||v>5))||(['customers','year','likelihood','impact'].includes(k)&&!Number.isInteger(v))||(k==='year'&&(v<1900||v>2200))))throw Error(T('swInvalid')+' '+at);out[k]=v;}
  else {if(typeof v!==typeof d||(k==='version'&&v!==1))throw Error(T('swInvalid')+' '+at);out[k]=v;}
 }
 return out;
}
function validate(raw){
 const s=shape(raw,defaults(),'strategy');
 s.opportunities=s.opportunities.map(x=>shape(x,opportunity(),'opportunity'));
 s.charters=s.charters.map(x=>{const c=shape(x,charter(),'charter');c.activities=c.activities.map(a=>shape(a,activity(),'activity'));c.costs=c.costs.map(a=>shape(a,cost(),'cost'));c.risks=c.risks.map(a=>shape(a,risk(),'risk'));return c;});
 s.services.shifts=s.services.shifts.map(x=>shape(x,shift(),'shift'));
 s.services.inaction=s.services.inaction.map(x=>shape(x,inaction(),'inaction'));
 const ids=new Set();for(const row of [...s.opportunities,...s.charters,...s.charters.flatMap(c=>[...c.activities,...c.costs,...c.risks]),...s.services.shifts,...s.services.inaction]){if(!row.id||ids.has(row.id))throw Error(T('swInvalid')+' id');ids.add(row.id);}
 for(const [list,key] of [[s.opportunities,'optionId'],[s.charters,'initiativeId']]){const seen=new Set();for(const r of list)if(r[key]){if(seen.has(r[key]))throw Error(T('swDuplicate'));seen.add(r[key]);}}
 return s;
}
const blank=E.blank,importer=E.validateImport,sync=E.syncYears;
E.blank=()=>({...blank(),strategy:defaults()});
E.validateImport=raw=>{if(!raw||typeof raw!=='object'||Array.isArray(raw))return importer(raw);const s=validate(raw.strategy),clean=copy(raw);delete clean.strategy;const p=importer(clean);p.strategy=s;return p;};
E.syncYears=p=>{const q=sync(p)||p;if(!q.strategy)q.strategy=defaults();return q;};
// Older recovery layers cannot recognise a newer extension until this validator is installed.
if(root.SultanRecovery?.pending&&root.SultanRecovery.raw){try{E.validateImport(JSON.parse(root.SultanRecovery.raw));root.SultanRecovery.pending=false;root.SultanRecovery.error='';}catch{}}
const finite=x=>num(x)?x:null;
function economics(o){
 if(o.valueModel!=='commercial')return {annual:null,recurring:null,grossProfit:null};
 const annual=num(o.annualContract)&&num(o.customers)?finite(o.annualContract*o.customers):null;
 return {annual,recurring:num(annual)&&num(o.recurringShare)?finite(annual*o.recurringShare/100):null,grossProfit:num(annual)&&num(o.grossMargin)?finite(annual*o.grossMargin/100):null};
}
function costs(c){const years={};let known=0,missing=0;for(const x of c.costs){const value=num(x.quantity)&&num(x.unitCost)?finite(x.quantity*x.unitCost):null;if(value===null||!Number.isInteger(x.year)){missing++;continue;}known+=value;years[x.year]=(years[x.year]||0)+value;}return {known,missing,total:c.costs.length&&missing===0?finite(known):null,years};}
function issues(p){
 const s=p.strategy;if(!s?.enabled)return [];
 const out=[],add=(code,entity,section='strategy',vars=[])=>out.push({code,entity,section,level:'missing',message:T('swIssue_'+code,vars)});
 if(!text(s.assessment.problem)||!text(s.assessment.evidence)||!text(s.assessment.riskAppetite))add('diagnosis','strategy');
 const op=s.operating;if(op.mode==='assess')add('operating','strategy');
 else if(op.mode==='reuse'&&!text(op.currentModel))add('reuse','strategy');
 else if(op.mode!=='reuse'&&(!text(op.targetModel)||!text(op.governanceOwner)||!text(op.decisionRights)||!text(op.managementOwner)||!text(op.sourcing)))add('operating','strategy');
 for(const o of s.opportunities){
  const choice=p.options.find(x=>x.id===o.optionId);
  if(!choice){add('optionLink',o.id);continue;}
  if(!E.selected(p).some(x=>x.id===choice.id))continue;
  if(!text(o.segment)||!text(o.buyer)||!text(o.need)||!text(o.demandEvidence)||!text(choice.whyUs))add('demand',o.id);
  if(o.confidence==='documented'&&!text(o.valueEvidence))add('valueEvidence',o.id);
  if(text(o.agenda)&&!text(o.agendaEvidence))add('agenda',o.id);
  if(o.valueModel==='commercial'){
   if(economics(o).annual===null||o.recurringShare===null||o.grossMargin===null)add('economics',o.id);
   if(num(o.recurringShare)&&o.recurringShare>0&&!text(o.renewalDriver))add('renewal',o.id);
  }else if(!text(o.valueEvidence))add('publicValue',o.id);
  if(o.route==='undecided'||!text(o.routeReason)||!text(o.buildRationale)||!text(o.partnerRationale)||!text(o.acquireRationale))add('route',o.id);
  if(o.route==='partner'&&['ourContribution','partnerContribution','partnerIncentive','partnerEvidence'].some(k=>!text(o[k])))add('partner',o.id);
  if(o.route==='acquire'&&(!text(o.dueDiligence)||!text(o.integrationPlan)))add('acquire',o.id);
  if(!text(o.validationOwner)||!text(o.validationDate)||!text(o.killCriterion))add('validation',o.id);
 }
 for(const x of s.services.shifts)if(!text(x.signal)||!text(x.evidence)||!text(x.implication))add('shift',x.id);
 for(const x of s.services.inaction)if(!text(x.decision)||!text(x.consequence)||!text(x.window)||!text(x.inactionCost)||!text(x.owner)||!text(x.reviewDate))add('inaction',x.id);
 const selected=new Set(E.selectedInitiatives(p).map(x=>x.id));
 for(const c of s.charters){
  const i=p.initiatives.find(x=>x.id===c.initiativeId);
  if(!i){add('initiativeLink',c.id);continue;}if(!selected.has(i.id))continue;
  if(['sponsor','scope','benefit','benefitOwner','handover','reviewDate'].some(k=>!text(c[k])))add('charter',c.id);
  const tr=p.transitions.find(x=>x.id===i.transitionId);
  if(!tr||['formula','measurementSource','frequency'].some(k=>!text(c[k])))add('measurement',c.id);
  if(!c.activities.length||c.activities.some(a=>!text(a.title)||!text(a.owner)||!text(a.start)||!text(a.end)||!text(a.output)||!text(a.acceptance)))add('activities',c.id);
  if(c.activities.some(a=>a.start&&a.end&&(a.start>a.end||Number(a.start.slice(0,4))<i.startYear||Number(a.end.slice(0,4))>i.endYear)))add('dates',c.id);
  const total=costs(c);if(total.total===null)add('costs',c.id);
  if(c.costs.some(x=>!E.years(p).includes(x.year)||x.year<i.startYear||x.year>i.endYear))add('costYear',c.id);
  if(c.costs.some(x=>!text(x.label)||!text(x.unit)))add('costs',c.id);
  if(total.total!==null&&Object.entries(total.years).some(([y,v])=>!num(i.budget.find(b=>b.year===Number(y))?.amount)||Math.abs(i.budget.find(b=>b.year===Number(y)).amount-v)>.01))add('budgetMismatch',c.id);
  if(!c.risks.length||c.risks.some(r=>!text(r.title)||!text(r.owner)||!text(r.mitigation)||!text(r.trigger)))add('risks',c.id);
 }
 return out;
}
const check=E.check;E.check=p=>[...check(p),...issues(p)];
function ensure(p){if(!p.strategy)p.strategy=defaults();p.strategy.enabled=true;return p.strategy;}
function addOpportunity(p,optionId){const s=ensure(p);if(s.opportunities.length>=100)throw Error(T('swLimit'));if(s.opportunities.some(x=>x.optionId===optionId))throw Error(T('swDuplicate'));const o=opportunity(optionId);s.opportunities.push(o);return o;}
function addCharter(p,initiativeId){const s=ensure(p);if(s.charters.length>=100)throw Error(T('swLimit'));if(s.charters.some(x=>x.initiativeId===initiativeId))throw Error(T('swDuplicate'));const c=charter(initiativeId);s.charters.push(c);return c;}
function addShift(p){const s=ensure(p);if(s.services.shifts.length>=60)throw Error(T('swLimit'));const x=shift();s.services.shifts.push(x);return x;}
function addInaction(p,optionId=''){const s=ensure(p);if(s.services.inaction.length>=60)throw Error(T('swLimit'));const x=inaction(optionId);s.services.inaction.push(x);return x;}
function serviceReadiness(p){const s=p.strategy||defaults(),v=s.services||defaults().services,selectedOptions=E.selected(p),selectedIds=new Set(selectedOptions.map(x=>x.id)),active=s.opportunities.filter(o=>selectedIds.has(o.optionId));const allRoutes=active.length>0&&active.every(o=>o.route!=='undecided'&&text(o.routeReason)&&text(o.buildRationale)&&text(o.partnerRationale)&&text(o.acquireRationale));const partner=active.some(o=>o.route==='partner'&&['ourContribution','partnerContribution','partnerIncentive','partnerEvidence'].every(k=>text(o[k])));const recurring=active.some(o=>o.valueModel==='commercial'&&num(o.recurringShare)&&text(o.renewalDriver));const experiment=active.some(o=>text(o.validationOwner)&&text(o.validationDate)&&text(o.killCriterion));const evidence=!!text(s.assessment.evidence)&&(!active.length||active.every(o=>text(o.demandEvidence)));const executionReady=E.selectedInitiatives(p).length>0&&s.charters.length>0;const benchmark=!!text(s.assessment.benchmark)||p.references.some(r=>text(r.source)&&['use','adapt'].includes(r.status));const adversarial=!!p.council?.reviews?.length;const watch=!!text(v.watch.owner)&&!!text(v.watch.triggers)&&!!text(v.watch.nextReviewDate);return {shift:{done:v.shifts.some(x=>text(x.signal)&&text(x.implication))},channel:{done:v.shifts.some(x=>['channel','value-chain'].includes(x.shiftType)&&text(x.signal)&&text(x.implication))},inaction:{done:v.inaction.some(x=>text(x.decision)&&text(x.inactionCost))},route:{done:allRoutes},partnership:{done:partner},recurring:{done:recurring},experiment:{done:experiment},evidence:{done:evidence},adversarial:{done:adversarial},execution:{done:executionReady},benchmark:{done:benchmark},board:{done:executionReady&&E.check(p).filter(x=>x.level==='blocking').length===0},watch:{done:watch}};}
function syncBudget(p,c){
 const i=p.initiatives.find(x=>x.id===c.initiativeId),v=costs(c);
 if(!i||v.total===null||c.costs.some(x=>!E.years(p).includes(x.year)||x.year<i.startYear||x.year>i.endYear))throw Error(T('swBudgetBlocked'));
 for(const [year,amount] of Object.entries(v.years)){const b=i.budget.find(x=>x.year===Number(year));if(!b)throw Error(T('swBudgetBlocked'));b.amount=amount;}
 // Budget confirmation and resource-release evidence remain separate decisions.
 return p;
}
function readiness(p){const s=p.strategy||defaults(),q=issues(p),selected=new Set(E.selected(p).map(x=>x.id)),active=s.opportunities.filter(o=>selected.has(o.optionId)),selectedI=new Set(E.selectedInitiatives(p).map(i=>i.id)),cards=s.charters.filter(c=>selectedI.has(c.initiativeId));return {active:active.length,cards:cards.length,issues:q.length,stages:[{key:'diagnosis',done:s.enabled&&!!s.assessment.problem&&!!s.assessment.evidence&&!q.some(x=>x.code==='diagnosis')},{key:'opportunities',done:active.length>0&&!q.some(x=>active.some(o=>o.id===x.entity))},{key:'operating',done:s.enabled&&!q.some(x=>['operating','reuse'].includes(x.code))},{key:'execution',done:cards.length>0&&cards.length===selectedI.size&&!q.some(x=>cards.some(c=>c.id===x.entity))}]};}
function report(p){
 const s=p.strategy;if(!s?.enabled)return '';
 const fmt=x=>num(x)?x.toLocaleString(root.SultanI18n.locale,{maximumFractionDigits:2}):T('swUnknown');
 const pairs=(kind,x)=>'<dl>'+fields[kind].filter(k=>text(x[k])).map(k=>`<dt>${esc(T('swF_'+k))}</dt><dd>${esc(x[k])}</dd>`).join('')+'</dl>';
 let h=`<section data-report-section="strategy-workbench"><h2>${esc(T('swTitle'))}</h2><p>${esc(T('swReportNote'))}</p><h3>${esc(T('swTab_diagnosis'))}</h3>${pairs('assessment',s.assessment)}<h3>${esc(T('swTab_operating'))}: ${esc(T('swV_'+s.operating.mode))}</h3>${pairs('operating',s.operating)}`;
 for(const o of s.opportunities){const choice=p.options.find(x=>x.id===o.optionId),n=economics(o);h+=`<h3>${esc(choice?.title||T('swUnlinked'))}</h3><p>${esc(T('swDecision'))}: ${esc(choice?T('swDecision_'+choice.decision):T('swUnlinked'))} · ${esc(T('swV_'+o.confidence))} · ${esc(T('swV_'+o.route))} · ${esc(T('swV_'+o.valueModel))}</p>${pairs('opportunity',o)}`;if(o.valueModel==='commercial')h+=`<p>${esc(T('swScenario'))} · ${esc(T('swF_annualContract'))}: ${fmt(o.annualContract)} × ${esc(T('swF_customers'))}: ${fmt(o.customers)}; ${esc(T('swAnnual'))}: ${fmt(n.annual)}; ${esc(T('swRecurring'))}: ${fmt(n.recurring)} (${fmt(o.recurringShare)}%); ${esc(T('swGross'))}: ${fmt(n.grossProfit)} (${fmt(o.grossMargin)}%)</p>`;}
 for(const c of s.charters){const i=p.initiatives.find(x=>x.id===c.initiativeId),t=p.transitions.find(x=>x.id===i?.transitionId);h+=`<h3>${esc(T('swCharter'))}: ${esc(i?.title||T('swUnlinked'))}</h3><p>${esc(T('swV_'+c.priority))} · ${esc(T('swV_'+c.executionMode))}</p>${pairs('charter',c)}<p>${esc(T('swLinkedKpi'))}: ${esc(t?.kpi||T('swUnknown'))} · ${fmt(t?.baseline)} → ${fmt(t?.target)} ${esc(t?.unit||'')}</p>`;
  for(const [kind,list,extra] of [['activity',c.activities,['status']],['cost',c.costs,['year','quantity','unitCost','category']],['risk',c.risks,['likelihood','impact']]])if(list.length)h+=`<h4>${esc(T('swRows_'+kind))}</h4><table><thead><tr>${[...fields[kind],...extra].map(k=>`<th>${esc(T('swF_'+k))}</th>`).join('')}</tr></thead><tbody>${list.map(r=>'<tr>'+[...fields[kind],...extra].map(k=>`<td>${esc(enums[k]?T('swV_'+r[k]):r[k]??T('swUnknown'))}</td>`).join('')+'</tr>').join('')}</tbody></table>`;
  h+=`<p>${esc(T('swCostTotal'))}: ${fmt(costs(c).total)} · ${esc(T('swBudgetNote'))}</p>`;
 }
 const svc=s.services||defaults().services,svcPairs=(kind,x)=>'<dl>'+fields[kind].filter(k=>text(x[k])).map(k=>`<dt>${esc(T('svcF_'+k))}</dt><dd>${esc(x[k])}</dd>`).join('')+'</dl>';if(svc.shifts.length||svc.inaction.length||text(svc.watch.owner)||text(svc.watch.triggers)){h+=`<h3>${esc(T('svcReportTitle'))}</h3>`;for(const x of svc.shifts)h+=`<h4>${esc(T('svcShiftRadar'))}</h4><p>${esc(T('svcF_shiftType'))}: ${esc(T('svcV_'+x.shiftType))}</p>${svcPairs('shift',x)}<p>${esc(T('svcF_horizon'))}: ${esc(T('svcV_'+x.horizon))} · ${esc(T('svcF_response'))}: ${esc(T('svcV_'+x.response))}</p>`;for(const x of svc.inaction)h+=`<h4>${esc(T('svcCostInaction'))}</h4>${svcPairs('inaction',x)}<p>${esc(T('svcF_reversibility'))}: ${esc(T('svcV_'+x.reversibility))} · ${esc(T('svcF_learningValue'))}: ${esc(T('svcV_'+x.learningValue))}</p>`;if(text(svc.watch.owner)||text(svc.watch.triggers))h+=`<h4>${esc(T('svcWatch'))}</h4>${svcPairs('watch',svc.watch)}<p>${esc(T('svcF_reviewCadence'))}: ${esc(T('svcV_'+svc.watch.reviewCadence))} · ${esc(T('svcF_nextReviewDate'))}: ${esc(svc.watch.nextReviewDate||T('swUnknown'))}</p>`;}
 const q=issues(p);h+=`<h3>${esc(T('swOpen'))}</h3>${q.length?'<ul>'+q.map(x=>`<li>${esc(x.message)}</li>`).join('')+'</ul>':`<p>${esc(T('swFieldsComplete'))}</p>`}</section>`;return h;
}
function aiContext(p){if(!p.strategy?.enabled)return '';const selected=new Set(E.selected(p).map(o=>o.id)),ids=new Set(E.selectedInitiatives(p).map(i=>i.id)),s=copy(p.strategy);s.opportunities=s.opportunities.filter(o=>selected.has(o.optionId));s.charters=s.charters.filter(c=>ids.has(c.initiativeId));return JSON.stringify(s);}
const demo=E.demo;E.demo=function(){const p=demo();p.strategy=defaults();const s=ensure(p);s.assessment={problem:T('swDemo_problem'),scope:T('swDemo_scope'),currentState:T('swDemo_current'),evidence:T('swDemo_evidence'),benchmark:T('swDemo_benchmark'),riskAppetite:T('swDemo_risk')};s.operating.mode='reuse';s.operating.currentModel=T('swDemo_model');const choice=E.selected(p).find(o=>o.type!=='requirement');if(choice){const o=addOpportunity(p,choice.id);Object.assign(o,{segment:T('swDemo_segment'),buyer:T('swDemo_buyer'),need:T('swDemo_need'),demandEvidence:T('swDemo_evidence'),route:'partner',ourContribution:T('swDemo_ours'),partnerContribution:T('swDemo_theirs'),partnerIncentive:T('swDemo_incentive'),routeReason:T('swDemo_route'),annualContract:120000,customers:6,recurringShare:75,grossMargin:35,renewalDriver:T('swDemo_renewal'),validationOwner:T('swDemo_owner'),validationDate:'2027-03-31',killCriterion:T('swDemo_stop')});}const i=E.selectedInitiatives(p)[0];if(i){const c=addCharter(p,i.id);Object.assign(c,{sponsor:T('swDemo_owner'),scope:T('swDemo_scope'),benefit:T('swDemo_benefit'),benefitOwner:T('swDemo_owner')});}return p;};
root.SultanStrategy={fields,enums,defaults,opportunity,charter,activity,cost,risk,shift,inaction,validate,economics,costs,issues,ensure,addOpportunity,addCharter,addShift,addInaction,serviceReadiness,syncBudget,readiness,report,aiContext};
if(typeof module!=='undefined'&&module.exports)module.exports=root.SultanStrategy;
})(globalThis);
