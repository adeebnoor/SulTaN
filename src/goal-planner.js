/* Goal-first orchestration. Local recipes are proposals; research and approvals remain explicit. */
(function(root){
'use strict';
const E=root.Sultan,S=root.SultanStrategy,D=root.SultanDraft;if(!E||!S||!D)return;
const T=(k,v)=>root.SultanI18n.t(k,v),clone=E.clone,has=x=>typeof x==='string'&&x.trim(),id=k=>'lib-plan-'+E.uid(k);
const norm=x=>String(x).normalize('NFKC').trim().toLowerCase().replace(/\s+/g,' ');
const proposal=(k,v)=>T('gpProposal')+' '+T(k,v);
function parse(raw){const rows=String(raw||'').split(/\n/).map(x=>x.replace(/^\s*(?:[-•]|[0-9٠-٩]+[.)-])\s*/, '').trim()).filter(Boolean);if(rows.length>10||rows.some(x=>x.length>300))throw Error(T('gpLimit'));return [...new Map(rows.map(x=>[norm(x),x])).values()];}
function theme(title){if(/recurr|revenue|sales|growth|إيراد|ايراد|مبيع|نمو|متكرر/i.test(title))return 'growth';if(/cost|efficien|cycle|time|تكلف|تكاليف|كفاء|زمن|وقت/i.test(title))return 'efficiency';if(/satisf|experience|service|رضا|تجربة|خدمة|خدمات/i.test(title))return 'service';if(/talent|skill|workforce|employee|مهار|كفاءات|موظف|مواهب/i.test(title))return 'people';if(/risk|secur|complian|fraud|مخاطر|أمن|امن|احتيال|امتثال/i.test(title))return 'risk';return 'outcome';}
function fill(obj,values){for(const [k,v] of Object.entries(values))if(!has(obj[k]))obj[k]=v;}
function complete(p,optionIds){
 const s=S.ensure(p),years=E.years(p),start=years[0],end=years.at(-1);
 fill(s.assessment,{problem:proposal('gpProblem'),scope:optionIds.map(k=>p.options.find(o=>o.id===k)?.title).filter(Boolean).join('\n'),benchmark:proposal('gpBenchmarkMethod')});
 // Evidence, risk appetite, current state and decision rights are deliberately not fabricated.
 fill(s.operating,{governanceOwner:proposal('gpSponsor'),managementOwner:proposal('gpRoleLead'),capabilities:proposal('gpCapabilities'),sourcing:proposal('gpSourcing'),cadence:proposal('gpCadence')});
 for(const optionId of optionIds){
  const o=p.options.find(x=>x.id===optionId);if(!o||!E.selected(p).some(x=>x.id===o.id))continue;
  const kind=theme(o.title),owner=o.owner||proposal('gpRoleLead'),v=[o.title];
  fill(o,{outcome:proposal('gpOutcome',v),riskSource:proposal('gpRisk'),stopEvidence:proposal('gpStop')});
  let t=p.transitions.find(x=>x.optionId===o.id);
  if(!t){t=Object.assign(E.transition(p),{id:id('kpi'),optionId:o.id,domain:o.title,kpi:T('gpKpi_'+kind),unit:T('gpUnit_'+kind),direction:['efficiency','risk'].includes(kind)?'down':'up',owner,dataSource:proposal('gpData_'+kind),frequency:T('gpMonthly'),current:proposal('gpBaseline'),targetState:proposal('gpTarget')});p.transitions.push(t);}
  if(!t.referenceId){const r=Object.assign(E.reference(),{id:id('ref'),name:T('gpBenchmarkTitle',v),kind:'benchmark',purpose:proposal('gpBenchmarkPurpose',[t.kpi]),context:proposal('gpBenchmarkContext'),adaptation:proposal('gpBenchmarkAdapt'),status:'unchecked'});p.references.push(r);t.referenceId=r.id;}
  for(const a of t.annual)fill(a,{milestone:proposal(a.year===start?'gpPhase0':a.year===end?'gpPhase2':'gpPhase1',v),evidence:proposal('gpEvidence')});
  if(!s.opportunities.some(x=>x.optionId===o.id)){const opp=S.addOpportunity(p,o.id);Object.assign(opp,{id:id('opportunity'),need:o.title,valueModel:kind==='growth'?'commercial':'public',buildRationale:proposal('gpBuild'),partnerRationale:proposal('gpPartner'),acquireRationale:proposal('gpAcquire'),ourContribution:proposal('gpOurValue'),partnerContribution:proposal('gpTheirValue'),partnerIncentive:proposal('gpMutual'),renewalDriver:kind==='growth'?proposal('gpRecurring'):'',validationOwner:owner,killCriterion:proposal('gpStop')});}
  let en=p.enablers.find(x=>x.optionId===o.id);if(!en){en=Object.assign(E.enabler(),{id:id('enabler'),optionId:o.id,title:T('gpEnabler',v),kind:'capability',owner,action:'activate',control:'unknown',status:'unknown',dueYear:start,route:proposal('gpSourcing'),fallback:proposal('gpFallback')});p.enablers.push(en);}
  let initiatives=p.initiatives.filter(x=>x.optionId===o.id);
  if(!initiatives.length){for(let phase=0;phase<3;phase++){const a=start+Math.floor((years.length-1)*phase/3),b=phase===2?end:start+Math.floor((years.length-1)*(phase+1)/3);const i=Object.assign(E.initiative(p),{id:id('initiative'),optionId:o.id,transitionId:t.id,title:T('gpPhase'+phase,v),kind:['learn','build','deliver'][phase],owner,startYear:a,endYear:b,output:proposal('gpOutput'+phase,v),acceptance:proposal('gpAccept'+phase),capacity:proposal('gpResources'),enablerIds:phase?[en.id]:[],dependsOn:phase?[initiatives[phase-1].id]:[]});p.initiatives.push(i);initiatives.push(i);}}
  for(const i of initiatives){if(s.charters.some(c=>c.initiativeId===i.id))continue;const linked=p.transitions.find(x=>x.id===i.transitionId)||t,c=S.addCharter(p,i.id);Object.assign(c,{id:id('charter'),sponsor:proposal('gpSponsor'),scope:i.output||proposal('gpOutcome',v),outOfScope:proposal('gpOutOfScope'),benefit:o.outcome,benefitOwner:owner,formula:linked===t&&t.id.startsWith('lib-plan-')?proposal('gpFormula_'+kind):proposal('gpConfirmFormula',[linked.kpi]),measurementSource:linked.dataSource||proposal('gpData_'+kind),frequency:linked.frequency||T('gpMonthly'),resources:i.capacity||proposal('gpResources'),handover:proposal('gpHandover'),priority:i.kind==='learn'?'foundation':'anchor'});
   // Three sequential activity windows fit even a one-year initiative. Dates are draft schedule proposals.
   const months=(i.endYear-i.startYear+1)*12;for(let n=0;n<3;n++){const from=Math.floor(months*n/3),to=Math.floor(months*(n+1)/3);const begin=new Date(Date.UTC(i.startYear,from,1)),finish=new Date(Date.UTC(i.startYear,to,0));c.activities.push({...S.activity(),id:id('activity'),title:T('gpActivity'+n,[i.title]),owner,start:begin.toISOString().slice(0,10),end:finish.toISOString().slice(0,10),output:n===2?i.output:proposal('gpActivityOutput'+n),acceptance:n===2?i.acceptance:proposal('gpActivityAccept'+n)});}
   for(const k of ['Effort','Tools'])c.costs.push({...S.cost(i.startYear),id:id('cost'),label:T('gpCost'+k),unit:T('gpCostUnit'+k)});
   c.risks.push({...S.risk(),id:id('risk'),title:proposal('gpRisk'),owner,mitigation:proposal('gpMitigation'),trigger:proposal('gpTrigger')});
  }
 }
 return E.validateImport(p);
}
function prepare(base,raw){const p=E.validateImport(clone(base)),titles=parse(raw),ids=[];for(const title of titles){let o=p.options.find(x=>norm(x.title)===norm(title));if(!o){o=D.addCustomGoal(p,{title});}if(E.selected(p).some(x=>x.id===o.id))ids.push(o.id);}if(!titles.length)ids.push(...E.selected(p).map(o=>o.id));if(!ids.length)throw Error(T('gpEmpty'));return {project:p,ids};}
async function generate(base,raw,{useAI=false,onProgress}={}){
 const prepared=prepare(base,raw);let p=prepared.project,ids=prepared.ids,mode='local',fallback=false,researchPending=false;
 // AI drafts only new goals in an isolated seed; existing edited records never enter a replacement merge.
 const fresh=ids.filter(k=>!base.options.some(o=>o.id===k));
 if(useAI&&root.SultanAI?.configured()&&fresh.length){
  try{let seed=E.blank();seed.institution=clone(p.institution);seed.context=clone(p.context);seed.options=p.options.filter(o=>fresh.includes(o.id)).map(clone);E.syncYears(seed);
   let benchmarkMemo='';
   if(root.SultanAI.settings?.().webSearch&&root.SultanAI.gatherContext){
    try{const research=await root.SultanAI.gatherContext({project:seed,onProgress,focus:'Research benchmark evidence for each stated strategic goal. Use the institution context to choose comparable peers and leading practices. If sector, scale or geography is unspecified, do not assume it: research transferable methods and state the selection questions. For each comparison give primary source URL, issuer, date, metric definition, period, observed value only if seen, comparability limits and transferable lesson. Do not present search suggestions as verified values.'});if(research.truncated)throw Error('Incomplete research');benchmarkMemo=research.memo;for(const source of (research.data?.sources||[]).slice(0,20))E.addContextSource(seed,{...source,status:'proposed',origin:'ai'});}catch{researchPending=true;}
   }
   const result=await root.SultanAI.generateStrategy({project:seed,goalHints:seed.options.map(o=>o.title),onProgress,benchmarkMemo});if(result.truncated)throw Error('Incomplete AI output');
   const data=clone(result.data||{});if(!Array.isArray(data.options))data.options=[];
   for(const o of seed.options)if(!data.options.some(x=>x.sourceOptionId===o.id||norm(x.title)===norm(o.title)))data.options.push({key:E.uid('goal'),sourceOptionId:o.id,title:o.title});
   const draft=D.fromAI(data,seed,{mode:'replace',scores:false});
   // Keep every requested objective, even when an AI response omits it.
   for(const o of seed.options)if(!draft.options.some(x=>norm(x.title)===norm(o.title)))draft.options.push(o);
   const requested=draft.options.filter(x=>seed.options.some(o=>norm(o.title)===norm(x.title)));for(const o of requested)o.decision='select';
   p.options=p.options.filter(o=>!fresh.includes(o.id));for(const list of ['options','references','transitions','enablers','initiatives'])p[list].push(...draft[list]);
   if(p.context&&draft.context)for(const source of draft.context.sources)if(!p.context.sources.some(x=>x.id===source.id))p.context.sources.push(source);
   ids=[...ids.filter(k=>!fresh.includes(k)),...requested.map(o=>o.id)];mode='ai';
  }catch{fallback=true;p=prepared.project;ids=prepared.ids;}
 }
 p=complete(p,ids);p.log.push({at:new Date().toISOString(),action:'goal-plan-'+mode,path:ids.join(',').slice(0,1000),revision:p.revision});
 return {project:p,mode,fallback,researchPending,counts:{goals:ids.length,kpis:p.transitions.filter(t=>ids.includes(t.optionId)).length,initiatives:p.initiatives.filter(i=>ids.includes(i.optionId)).length}};
}
root.SultanGoalPlanner={parse,theme,prepare,complete,generate};
})(globalThis);
