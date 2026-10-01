/* Draft engine — "fill on my behalf".
   Two deterministic sources of drafts, both producing ordinary SULTAN records that the expert reviews:
   1. the bundled sector library (goal templates → choice, pathway, references, enablers, initiatives,
      assumptions, risk, mandates), and
   2. an AI-generated JSON strategy (normalised and clamped into the same schema).
   Provenance travels in the record id prefix: `lib-…` came from the library, `ai-…` from the model.
   Unknown numbers stay null; nothing is invented. No network calls here. */
(function(root){
'use strict';
const isNode=typeof module!=='undefined'&&module.exports;
const E=root.Sultan,Lib=root.SultanLibrary;
if(!E||!Lib)return;
const I18N=()=>root.SultanI18n;
const T=(k,v)=>{try{return I18N().t(k,v);}catch{return k;}};
const lang=()=>I18N()?.language==='en'?'en':'ar';
const P=x=>Lib.pick(x,lang());
const num=x=>typeof x==='number'&&Number.isFinite(x);
const text=x=>typeof x==='string'&&x.trim().length>0;
const rand=()=>Math.random().toString(36).slice(2,6);
const safe=s=>String(s||'').toLowerCase().replace(/[^a-z0-9]+/g,'').slice(0,24)||'x';
const libId=(sector,goal,kind)=>`lib-${safe(sector)}-${safe(goal)}-${kind}-${rand()}`;
const aiId=(kind,n)=>`ai-${kind}-${n}-${rand()}`;
const str=(v,max=24000)=>typeof v==='string'?v.slice(0,max):(v===null||v===undefined?'':String(v).slice(0,max));
const proposal=v=>text(v)?T('drUnverified')+' '+str(v):'';
const normalizedTitle=s=>str(s).trim().toLowerCase().replace(/\s+/g,' ');
const fmt=v=>num(v)?(Math.abs(v)>=1000?Math.round(v).toLocaleString('en-US'):String(Math.round(v*100)/100)):'';
function fill(tpl,vars){return String(tpl||'').replace(/\{(\w+)\}/g,(_,k)=>vars[k]??'');}

/* ---------------------------------------------------------------- annual interpolation */
function roundLike(v,unit){const u=String(unit||'');if(/ريال|SAR|عدد|count|مستفيد|benefic|ساعة|hour|مرتبة|rank/i.test(u)||Math.abs(v)>=1000)return Math.round(v);return Math.round(v*10)/10;}
function interpolateAnnual(t,p,opts={}){
 if(!t||!['up','down'].includes(t.direction)||!num(t.baseline)||!num(t.target))return 0;
 const rows=t.annual||[],n=rows.length;if(!n)return 0;let filled=0;
 rows.forEach((a,i)=>{
  const v=i===n-1?t.target:roundLike(t.baseline+(t.target-t.baseline)*(i+1)/n,t.unit);
  if(opts.overwrite||!num(a.target)){a.target=v;filled++;}
  if(opts.overwrite||!text(a.milestone))a.milestone=T('drMilestone',[fmt(a.target),t.unit||'']);
  if((opts.overwrite||!text(a.evidence))&&text(opts.evidence))a.evidence=opts.evidence;
 });
 return filled;
}

/* ---------------------------------------------------------------- library → records */
function addProgram(p,sectorId,programId){
 const prog=Lib.program(sectorId,programId);if(!prog)return null;
 const title=P(prog.name);const existing=(p.mandates||[]).find(m=>m.title===title);if(existing)return existing;
 const m={id:libId(sectorId,programId,'m'),title,relationship:'contribution',source:`${P(prog.issuer)} — ${prog.url}`,contribution:P(prog.contribution)};
 p.mandates.push(m);return m;
}
function addReference(p,sectorId,refId){
 const r=Lib.reference(sectorId,refId);if(!r)return null;
 const name=P(r.name);const existing=p.references.find(x=>x.name===name);if(existing)return existing;
 const ref=Object.assign(E.reference(),{id:libId(sectorId,refId,'r'),name,kind:['framework','benchmark','accreditation','internal'].includes(r.kind)?r.kind:'framework',source:`${P(r.issuer)}${r.url?' — '+r.url:''}${r.year?' · '+r.year:''}`,purpose:P(r.summary),context:P(r.relevance),adaptation:r.status==='adapt'?T('drAdaptation'):'',status:'unchecked'});
 p.references.push(ref);
 if(E.addContextSource)E.addContextSource(p,{id:libId(sectorId,refId,'s'),title:name,kind:r.kind==='benchmark'?'benchmark':'regulation',issuer:P(r.issuer),url:r.url||'',year:r.year,summary:P(r.summary),relevance:P(r.relevance),status:'accepted',origin:'library'});
 return ref;
}
function enablerFromTemplate(p,sectorId,goalId,optionId,e){
 return Object.assign(E.enabler(),{id:libId(sectorId,goalId,'e'),optionId,title:P(e.title),kind:['legislation','authority','capability','culture','operating'].includes(e.kind)?e.kind:'capability',action:['keep','activate','amend','add','remove'].includes(e.action)?e.action:'add',control:['internal','external','shared','unknown'].includes(e.control)?e.control:'unknown',owner:P(e.owner),status:'unknown',dueYear:p.institution.startYear,source:P(e.source),route:P(e.route),fallback:P(e.fallback)});
}
function addGoal(p,sectorId,goalId,params={}){
 const g=Lib.goal(sectorId,goalId),sector=Lib.sector(sectorId);if(!g||!sector)return null;
 const ind=Lib.indicator(sectorId,g.kpi),years=E.years(p),startYear=p.institution.startYear,endYear=p.institution.endYear;
 const baseline=num(params.baseline)?params.baseline:null,target=num(params.target)?params.target:null,owner=str(params.owner,200);
 const unit=ind?P(ind.unit):'',kpiName=ind?P(ind.name):'';
 const vars={kpi:kpiName,unit,endYear,baseline:baseline===null?T('drUnknownBaseline'):fmt(baseline),target:target===null?T('drUnknownTarget'):fmt(target)};
 const option=Object.assign(E.option(),{id:libId(sectorId,goalId,'o'),title:P(g.title),type:['requirement','differentiation','moonshot','divest'].includes(g.type)?g.type:'differentiation',outcome:fill(P(g.outcome),vars),whyUs:proposal(P(g.whyUs)),foothold:g.foothold?proposal(P(g.foothold)):'',tradeoff:P(g.tradeoff),owner,decision:'select',decisionReason:T('drDecisionReason',[P(sector.name)]),riskSource:P(g.risk),stopEvidence:g.stopEvidence?P(g.stopEvidence):''});
 if(g.type==='divest'&&g.divest)Object.assign(option,{divestStop:P(g.divest.stop),redeployTo:P(g.divest.redeploy),divestEvidence:P(g.divest.evidence),divestImpact:P(g.divest.impact),releasedResources:null});
 option.assumptions=(g.assumptions||[]).map(a=>({id:E.uid('asm'),text:P(a.text),expectedPersistence:'',owner,testDate:'',testEvidence:'',failureImpact:P(a.failureImpact)}));
 p.options.push(option);
 for(const id of g.programs||[])addProgram(p,sectorId,id);
 let primaryRef=null;for(const id of g.refs||[]){const r=addReference(p,sectorId,id);if(r&&!primaryRef)primaryRef=r;}
 if(ind)for(const id of ind.refs||[]){const r=addReference(p,sectorId,id);if(r&&!primaryRef)primaryRef=r;}
 const tr=E.transition(p);
 Object.assign(tr,{id:libId(sectorId,goalId,'t'),optionId:option.id,referenceId:primaryRef?.id||'',domain:ind?P(ind.domain):P(g.title),current:baseline===null?T('drCurrentUnknown',[ind?P(ind.dataSource):'—']):T('drCurrentValue',[kpiName,fmt(baseline),unit]),currentSource:'',targetState:target===null?T('drTargetStateUnknown',[endYear]):T('drTargetState',[fmt(target),unit,endYear]),kpi:kpiName,unit,direction:ind?ind.direction:'up',baseline,target,owner,dataSource:ind?P(ind.dataSource):'',frequency:ind?P(ind.frequency):T('s012'),indicatorType:'performance',trackType:'outcome'});
 interpolateAnnual(tr,p,{evidence:ind?P(ind.dataSource):''});
 if(!num(tr.baseline)||!num(tr.target))tr.annual.forEach(a=>{if(!text(a.milestone))a.milestone=T('drMilestoneUnknown');if(!text(a.evidence)&&ind)a.evidence=P(ind.dataSource);});
 p.transitions.push(tr);
 const enablerIds={};for(const e of g.enablers||[]){const en=enablerFromTemplate(p,sectorId,goalId,option.id,e);p.enablers.push(en);enablerIds[e.id]=en.id;}
 const initIds={};const made=[];
 for(const i of g.initiatives||[]){
  const start=Math.min(endYear,startYear+(Number.isInteger(i.start)?i.start:0)),end=Math.min(endYear,Math.max(start,startYear+(Number.isInteger(i.end)?i.end:0)));
  const init=Object.assign(E.initiative(p),{id:libId(sectorId,goalId,'i'),optionId:option.id,transitionId:tr.id,title:P(i.title),kind:['learn','build','deliver'].includes(i.kind)?i.kind:'build',owner,startYear:start,endYear:end,output:P(i.output),acceptance:P(i.acceptance),capacity:'',budgetStatus:'unconfirmed',status:'design',enablerIds:(i.enablers||[]).map(k=>enablerIds[k]).filter(Boolean),dependsOn:[]});
  initIds[i.id]=init.id;made.push([init,i]);
 }
 for(const [init,i] of made){init.dependsOn=(i.dependsOn||[]).map(k=>initIds[k]).filter(Boolean);p.initiatives.push(init);}
 p.log.push({at:new Date().toISOString(),action:'library-goal',path:`${sectorId}/${goalId}`,revision:p.revision});
 return {option,transition:tr,years};
}
function addCustomGoal(p,custom={}){
 const option=Object.assign(E.option(),{id:`lib-custom-${rand()}-o-${rand()}`,title:str(custom.title,300),type:'differentiation',outcome:str(custom.outcome,2000),whyUs:T('drCustomWhy'),tradeoff:T('drCustomTradeoff'),owner:str(custom.owner,200),decision:'select',decisionReason:T('drCustomDecision')});
 p.options.push(option);
 if(text(custom.kpi)){const tr=E.transition(p);Object.assign(tr,{id:`lib-custom-${rand()}-t-${rand()}`,optionId:option.id,domain:str(custom.title,300),kpi:str(custom.kpi,300),unit:str(custom.unit,60),direction:custom.direction==='down'?'down':'up',baseline:num(custom.baseline)?custom.baseline:null,target:num(custom.target)?custom.target:null,owner:str(custom.owner,200),current:num(custom.baseline)?T('drCurrentValue',[custom.kpi,fmt(custom.baseline),custom.unit||'']):'',targetState:num(custom.target)?T('drTargetState',[fmt(custom.target),custom.unit||'',p.institution.endYear]):''});interpolateAnnual(tr,p);p.transitions.push(tr);}
 return option;
}
/* Build a complete first draft from the wizard answers. */
function build(spec={}){
 const p=E.blank();
 const sector=Lib.sector(spec.sectorId);
 const inst=spec.institution||{};
 const start=Number.isInteger(inst.startYear)?inst.startYear:p.institution.startYear,end=Number.isInteger(inst.endYear)&&inst.endYear>=start&&inst.endYear-start<=15?inst.endYear:Math.max(start,Math.min(start+3,start+15));
 Object.assign(p.institution,{name:str(inst.name,300),sector:sector?P(sector.name)+(spec.typeId?' · '+P((sector.types.find(t=>t.id===spec.typeId)||{}).name||''):''):str(inst.sector,200),vision:str(inst.vision),beneficiaries:str(inst.beneficiaries),mission:str(inst.mission),startYear:start,endYear:end});
 E.syncYears(p);
 if(sector&&spec.useTemplates!==false){
  const tpl=sector.templates||{};
  if(!text(p.institution.mission)&&tpl.mission)p.institution.mission=P(tpl.mission);
  if(!text(p.institution.beneficiaries)&&tpl.beneficiaries)p.institution.beneficiaries=P(tpl.beneficiaries);
  if(tpl.context)p.institution.context=P(tpl.context);
  if(tpl.notDoing)p.institution.notDoing=P(tpl.notDoing);
  if(tpl.culture)p.institution.culture=P(tpl.culture);
 }
 p.weightRationale=T('drWeightRationale');
 if(p.context){p.context.sectorId=sector?sector.id:'';p.context.typeId=str(spec.typeId,80);p.context.brief=str(spec.brief);}
 for(const g of spec.goals||[]){if(g.custom)addCustomGoal(p,{...g.custom,owner:g.owner,baseline:g.baseline,target:g.target});else if(sector)addGoal(p,sector.id,g.goalId,g);}
 if(spec.funding&&typeof spec.funding==='object')for(const f of p.funding){const v=spec.funding[f.year];if(num(v)&&v>=0)f.available=v;}
 p.log.push({at:new Date().toISOString(),action:'guided-build',path:sector?sector.id:'custom',revision:p.revision});
 p.revision=1;p.updatedAt=new Date().toISOString();
 return E.validateImport(JSON.parse(JSON.stringify(p)));
}

/* ---------------------------------------------------------------- AI JSON → records */
const CRITERIA=['identity','benefit','distinct','sustain'];
function aiSchema(){
 const S=(props,required=Object.keys(props))=>({type:'object',properties:props,required,additionalProperties:false});
 const s=()=>({type:'string'}),n=()=>({anyOf:[{type:'number'},{type:'null'}]}),i=()=>({anyOf:[{type:'integer'},{type:'null'}]}),en=v=>({type:'string',enum:v}),arr=x=>({type:'array',items:x});
 return S({
  institution:S({mission:s(),beneficiaries:s(),assets:s(),liabilities:s(),context:s(),culture:s(),vision:s(),notDoing:s()}),
  mandates:arr(S({title:s(),relationship:en(['mandatory','contribution','outside']),source:s(),contribution:s()})),
  weightRationale:s(),
  options:arr(S({key:s(),sourceOptionId:s(),title:s(),type:en(['requirement','differentiation','moonshot','divest']),outcome:s(),whyUs:s(),foothold:s(),tradeoff:s(),owner:s(),decision:en(['select','defer','reject','consider']),decisionReason:s(),riskSource:s(),stopEvidence:s(),
   scores:arr(S({criterion:en(CRITERIA),value:i(),note:s()})),
   assumptions:arr(S({text:s(),expectedPersistence:s(),owner:s(),testEvidence:s(),failureImpact:s()})),
   divest:S({stop:s(),releasedResources:n(),redeployTo:s(),evidence:s(),impact:s()})})),
  references:arr(S({key:s(),name:s(),kind:en(['framework','benchmark','accreditation','internal']),source:s(),purpose:s(),context:s(),adaptation:s(),status:en(['use','adapt','unchecked'])})),
  transitions:arr(S({key:s(),sourceTransitionId:s(),optionKey:s(),referenceKey:s(),domain:s(),current:s(),currentSource:s(),targetState:s(),kpi:s(),unit:s(),direction:en(['up','down','qualitative']),baseline:n(),target:n(),owner:s(),dataSource:s(),frequency:s(),
   annual:arr(S({year:{type:'integer'},milestone:s(),target:n(),evidence:s()}))})),
  enablers:arr(S({key:s(),optionKey:s(),title:s(),kind:en(['legislation','authority','capability','culture','operating']),action:en(['keep','activate','amend','add','remove']),control:en(['internal','external','shared','unknown']),owner:s(),status:en(['ready','pending','blocked','unknown']),dueYear:i(),source:s(),route:s(),fallback:s()})),
  initiatives:arr(S({key:s(),sourceInitiativeId:s(),optionKey:s(),transitionKey:s(),title:s(),kind:en(['learn','build','deliver']),owner:s(),startYear:{type:'integer'},endYear:{type:'integer'},output:s(),acceptance:s(),capacity:s(),enablerKeys:arr(s()),dependsOnKeys:arr(s()),
   budget:arr(S({year:{type:'integer'},amount:n(),releaseEvidence:s()}))})),
  contextSources:arr(S({title:s(),kind:en(['regulation','program','indicator','study','benchmark','internal','other']),issuer:s(),url:s(),year:i(),summary:s(),relevance:s()})),
  openQuestions:arr(s()),
  notes:s()
 });
}
const pick=(v,list,fallback)=>list.includes(v)?v:fallback;
const clampYear=(y,p)=>Number.isInteger(y)?Math.min(p.institution.endYear,Math.max(p.institution.startYear,y)):p.institution.startYear;
const cleanNum=(v,min=null,max=null)=>{if(!num(v))return null;let x=v;if(min!==null)x=Math.max(min,x);if(max!==null)x=Math.min(max,x);return x;};
/* Merge an AI strategy JSON into a project. mode 'replace' clears strategic records first (identity and context stay). */
function fromAI(json,base,opts={}){
 const p=E.validateImport(JSON.parse(JSON.stringify(base||E.blank())));
 const original=E.clone(p),usedOptions=new Set(),usedTransitions=new Set(),usedInitiatives=new Set();
 const sourceOptions={};
 const data=json&&typeof json==='object'?json:{};
 if(opts.mode==='replace'){p.options=[];p.references=[];p.transitions=[];p.enablers=[];p.initiatives=[];p.mandates=p.mandates.filter(m=>!String(m.id).startsWith('ai-'));}
 const inst=data.institution||{};
 for(const k of ['mission','beneficiaries','assets','liabilities','context','culture','vision','notDoing'])if(text(inst[k])&&(opts.overwriteIdentity||!text(p.institution[k])))p.institution[k]=proposal(inst[k]);
 if(text(data.weightRationale)&&!text(p.weightRationale))p.weightRationale=str(data.weightRationale);
 let n=0;
 for(const m of data.mandates||[]){if(!text(m?.title)||p.mandates.some(x=>normalizedTitle(x.title)===normalizedTitle(m.title)))continue;p.mandates.push({id:aiId('m',++n),title:str(m.title,300),relationship:m.relationship==='mandatory'?'unknown':pick(m.relationship,['contribution','outside'],'unknown'),source:proposal(m.source),contribution:str(m.contribution)});}
 const optIds={},refIds={},trIds={},enIds={},inIds={};
 for(const r of data.references||[]){if(!text(r?.name))continue;const ref=Object.assign(E.reference(),{id:aiId('r',++n),name:str(r.name,300),kind:pick(r.kind,['framework','benchmark','accreditation','internal'],'framework'),source:str(r.source,2000),purpose:str(r.purpose),context:str(r.context),adaptation:str(r.adaptation),status:'unchecked'});p.references.push(ref);if(text(r.key))refIds[r.key]=ref.id;}
 for(const o of data.options||[]){
  if(!text(o?.title))continue;
  const source=opts.mode==='replace'&&original.options.find(x=>!usedOptions.has(x.id)&&(o.sourceOptionId?x.id===o.sourceOptionId:normalizedTitle(x.title)===normalizedTitle(o.title)));
  if(source)usedOptions.add(source.id);
  const option=Object.assign(E.option(),{id:aiId('o',++n),title:source?source.title:str(o.title,300),type:source?source.type:pick(o.type,['requirement','differentiation','moonshot','divest'],'differentiation'),outcome:proposal(o.outcome),whyUs:proposal(o.whyUs),foothold:proposal(o.foothold),tradeoff:str(o.tradeoff),owner:str(o.owner,200),decision:source?source.decision:'consider',decisionReason:str(o.decisionReason),riskSource:str(o.riskSource),riskDate:'',stopEvidence:str(o.stopEvidence)});
  if(option.type==='requirement'&&source)option.decision=source.decision;
  if(option.type==='divest'&&o.divest&&typeof o.divest==='object')Object.assign(option,{divestStop:str(o.divest.stop),releasedResources:source?.type==='divest'?source.releasedResources:null,redeployTo:str(o.divest.redeployTo),divestEvidence:str(o.divest.evidence),divestImpact:str(o.divest.impact)});
  option.scores={};if(option.type!=='requirement'&&opts.scores!==false)for(const s of o.scores||[]){if(!CRITERIA.includes(s?.criterion)||!p.criteria.some(c=>c.id===s.criterion))continue;const v=cleanNum(s.value,0,100);option.scores[s.criterion]={value:v===null?null:Math.round(v),note:str(s.note,4000)};}
  option.assumptions=(o.assumptions||[]).filter(a=>text(a?.text)).slice(0,8).map(a=>({id:E.uid('asm'),text:str(a.text,4000),expectedPersistence:str(a.expectedPersistence,200),owner:str(a.owner,200),testDate:'',testEvidence:str(a.testEvidence,4000),failureImpact:str(a.failureImpact,4000)}));
  p.options.push(option);if(source)sourceOptions[option.id]=source; if(text(o.key))optIds[o.key]=option.id;
 }
 const years=E.years(p);
 for(const t of data.transitions||[]){
  const optionId=optIds[t?.optionKey];if(!optionId)continue;
  const sourceOption=sourceOptions[optionId];
  const source=sourceOption&&original.transitions.find(x=>x.optionId===sourceOption.id&&!usedTransitions.has(x.id)&&(t.sourceTransitionId?x.id===t.sourceTransitionId:normalizedTitle(x.kpi)===normalizedTitle(t.kpi)));
  if(source)usedTransitions.add(source.id);
  const tr=E.transition(p);
  Object.assign(tr,{id:aiId('t',++n),optionId,referenceId:refIds[t.referenceKey]||'',domain:str(t.domain,300),current:source?source.current:proposal(t.current),currentSource:source?source.currentSource:'',targetState:source?source.targetState:proposal(t.targetState),kpi:source?source.kpi:str(t.kpi,300),unit:source?source.unit:str(t.unit,60),direction:source?source.direction:pick(t.direction,['up','down','qualitative'],'up'),baseline:source?source.baseline:null,target:source?source.target:null,owner:str(t.owner,200),dataSource:source?source.dataSource:proposal(t.dataSource),frequency:text(t.frequency)?str(t.frequency,60):T('s012')});
  if(tr.direction!=='qualitative'&&num(tr.baseline)&&num(tr.target)&&((tr.direction==='up'&&tr.target<tr.baseline)||(tr.direction==='down'&&tr.target>tr.baseline)))tr.direction=tr.target<tr.baseline?'down':'up';
  for(const a of t.annual||[]){const row=tr.annual.find(x=>x.year===a?.year);if(!row)continue;row.milestone=str(a.milestone,4000);row.evidence=proposal(a.evidence);row.target=tr.direction==='qualitative'?null:(source?.annual.find(x=>x.year===a.year)?.target??null);}
  if(source){for(const row of tr.annual){const old=source.annual.find(a=>a.year===row.year);if(old){row.target=old.target;row.actual=old.actual;row.actualSource=old.actualSource;row.observation=old.observation;}}}
  if(tr.direction!=='qualitative'){const last=tr.annual.at(-1);if(last&&num(tr.target)&&!num(last.target))last.target=tr.target;if(tr.annual.some(a=>!num(a.target)))interpolateAnnual(tr,p);}
  p.transitions.push(tr);if(text(t.key))trIds[t.key]=tr.id;
 }
 for(const e of data.enablers||[]){
  const optionId=optIds[e?.optionKey];if(!optionId||!text(e.title))continue;
  const en=Object.assign(E.enabler(),{id:aiId('e',++n),optionId,title:str(e.title,300),kind:pick(e.kind,['legislation','authority','capability','culture','operating'],'capability'),action:pick(e.action,['keep','activate','amend','add','remove'],'add'),control:pick(e.control,['internal','external','shared','unknown'],'unknown'),owner:str(e.owner,200),status:pick(e.status,['ready','pending','blocked','unknown'],'unknown'),dueYear:Number.isInteger(e.dueYear)?clampYear(e.dueYear,p):null,source:proposal(e.source),route:proposal(e.route),fallback:proposal(e.fallback)});
  if(en.status==='ready'&&opts.trustReadiness!==true)en.status='unknown';
  p.enablers.push(en);if(text(e.key))enIds[e.key]=en.id;
 }
 const pendingDeps=[];
 for(const i of data.initiatives||[]){
  const optionId=optIds[i?.optionKey];if(!optionId||!text(i.title))continue;
  let transitionId=trIds[i.transitionKey]||'';if(transitionId&&p.transitions.find(t=>t.id===transitionId)?.optionId!==optionId)transitionId='';
  if(!transitionId)transitionId=p.transitions.find(t=>t.optionId===optionId)?.id||'';
  const sourceOption=sourceOptions[optionId];
  const source=sourceOption&&original.initiatives.find(x=>x.optionId===sourceOption.id&&!usedInitiatives.has(x.id)&&(i.sourceInitiativeId?x.id===i.sourceInitiativeId:normalizedTitle(x.title)===normalizedTitle(i.title)));
  if(source)usedInitiatives.add(source.id);
  const start=clampYear(i.startYear,p),end=Math.max(start,clampYear(i.endYear,p));
  const init=Object.assign(E.initiative(p),{id:aiId('i',++n),optionId,transitionId,title:str(i.title,300),kind:pick(i.kind,['learn','build','deliver'],'build'),owner:str(i.owner,200),startYear:start,endYear:end,output:str(i.output),acceptance:str(i.acceptance),capacity:str(i.capacity),budgetStatus:'unconfirmed',status:'design',enablerIds:(i.enablerKeys||[]).map(k=>enIds[k]).filter(Boolean)});
  /* The model cannot allocate an annual cap or invent initiative estimates. */
  for(const row of init.budget){const known=source?.budget.find(b=>b.year===row.year);row.amount=known?.amount??null;row.releaseEvidence=known?.releaseEvidence||'';}
  p.initiatives.push(init);if(text(i.key))inIds[i.key]=init.id;pendingDeps.push([init,i.dependsOnKeys||[]]);
 }
 for(const [init,keys] of pendingDeps)init.dependsOn=keys.map(k=>inIds[k]).filter(id=>id&&id!==init.id);
 if(opts.mode==='replace'&&(original.options.some(o=>!usedOptions.has(o.id))||original.transitions.some(t=>!usedTransitions.has(t.id)&&(num(t.baseline)||num(t.target)||t.annual.some(a=>num(a.actual))))||original.initiatives.some(i=>!usedInitiatives.has(i.id)&&i.budget.some(b=>num(b.amount)))))throw Error(T('drMappingLost'));
 const circular=E.feasibilityFundingConflicts?E.feasibilityFundingConflicts(p):[];
 for(const {initiative,enabler} of circular)if(origin(initiative.id)==='ai')initiative.enablerIds=initiative.enablerIds.filter(id=>id!==enabler.id);
 if(E.addContextSource)for(const s of data.contextSources||[]){if(!text(s?.title))continue;E.addContextSource(p,{id:aiId('s',++n),title:str(s.title,400),kind:pick(s.kind,['regulation','program','indicator','study','benchmark','internal','other'],'other'),issuer:str(s.issuer,300),url:str(s.url,2000),year:Number.isInteger(s.year)?s.year:null,summary:str(s.summary,4000),relevance:str(s.relevance,4000),status:'proposed',origin:'ai'});}
 const notes=[T('drBudgetGuard'),circular.length?T('drFeasibilityFix'):'',str(data.notes,8000),...(Array.isArray(data.openQuestions)?data.openQuestions.filter(text).slice(0,20).map(q=>'• '+str(q,1000)):[])].filter(text).join('\n');
 if(text(notes))p.reviewNote=(text(p.reviewNote)?p.reviewNote+'\n\n':'')+T('drAiNotesHeading')+'\n'+notes;
 p.log.push({at:new Date().toISOString(),action:'ai-draft',path:opts.mode||'append',revision:p.revision});
 p.revision++;p.updatedAt=new Date().toISOString();p.reviewedRevision=null;
 return E.validateImport(JSON.parse(JSON.stringify(p)));
}
/* Provenance helpers for the UI. */
function origin(id){const s=String(id||'');return s.startsWith('lib-')?'library':s.startsWith('ai-')?'ai':null;}
function summary(p){const out={library:0,ai:0};for(const k of ['options','references','transitions','enablers','initiatives','mandates'])for(const x of p?.[k]||[]){const o=origin(x.id);if(o)out[o]++;}return out;}
/* Compact project digest for AI prompts: everything the model needs, nothing it should not see twice. */
function digest(p){
 const c=p.context||{};const L=lang();
 const lines=[];const push=(k,v)=>{if(text(v)||num(v))lines.push(`${k}: ${v}`);};
 const I=p.institution;push('name',I.name);push('sector',I.sector);push('horizon',`${I.startYear}-${I.endYear}`);for(const k of ['mission','vision','beneficiaries','assets','liabilities','context','culture','notDoing'])push(k,I[k]);
 if(text(c.brief))push('brief',c.brief);
 if(c.sources?.length)lines.push('context sources (accepted): '+c.sources.filter(s=>s.status==='accepted').map(s=>`${s.title} [${s.kind}; ${s.issuer}${s.year?' '+s.year:''}${s.url?'; '+s.url:''}] — ${s.relevance||s.summary}`).join(' | '));
 if(c.documents?.length)lines.push('documents: '+c.documents.map(d=>`${d.name}: ${d.summary||''}`).join(' | '));
 for(const m of p.mandates)lines.push(`mandate: ${m.title} (${m.relationship}) — ${m.source}`);
 lines.push('criteria: '+p.criteria.map(c=>`${c.id}=${c.name} ${c.weight}% [0:${c.low} | 100:${c.high}]${c.polarity==='cost'?' (cost)':''}`).join('; '));
 for(const o of p.options)lines.push(`option ${o.id} (sourceOptionId=${o.id}) [${o.type}/${o.decision}]: ${o.title} — outcome: ${o.outcome} — whyUs: ${o.whyUs} — tradeoff: ${o.tradeoff}`);
 for(const r of p.references)lines.push(`reference ${r.id} [${r.kind}/${r.status}]: ${r.name} — ${r.source}`);
 for(const t of p.transitions)lines.push(`transition ${t.id} (sourceTransitionId=${t.id}; option ${t.optionId}): ${t.domain} — KPI ${t.kpi} ${t.unit} ${t.direction} baseline=${t.baseline??'?'} target=${t.target??'?'} annual=${t.annual.map(a=>a.year+':'+(a.target??'?')).join(',')}`);
 for(const e of p.enablers)lines.push(`enabler ${e.id} (option ${e.optionId}): ${e.title} [${e.kind}/${e.control}/${e.status}] owner=${e.owner} due=${e.dueYear??'?'}`);
 for(const i of p.initiatives)lines.push(`initiative ${i.id} (sourceInitiativeId=${i.id}; option ${i.optionId}): ${i.title} [${i.kind}] ${i.startYear}-${i.endYear} owner=${i.owner} budget=${i.budget.map(b=>b.year+':'+(b.amount??'?')).join(',')}`);
 lines.push('funding: '+p.funding.map(f=>f.year+':'+(f.available??'?')).join(','));
 lines.push('interface language: '+L);
 return lines.join('\n');
}
root.SultanDraft={build,addGoal,addCustomGoal,addReference,addProgram,interpolateAnnual,fromAI,aiSchema,origin,summary,digest,fill};
if(isNode)module.exports=root.SultanDraft;
})(typeof globalThis!=='undefined'?globalThis:this);
