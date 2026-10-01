/* Draft engine: library templates and AI JSON both become valid, honest SULTAN projects. */
'use strict';
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
global.SultanLocales={en:require('../src/locales/en.js'),ar:require('../src/locales/ar.js')};
for(const f of ['final','guided','field-guide'])require('../src/locales/'+f+'.js');
global.SultanI18n=require('../src/i18n.js');
global.Sultan=require('../src/import.js');require('../src/final-core.js');require('../src/context-core.js');require('../src/sector-library.js');require('../src/draft-engine.js');
const E=global.Sultan,L=global.SultanLibrary,D=global.SultanDraft;
for(const f of ['src/draft-engine.js','src/context-core.js'])assert.ok(!/\b(fetch|XMLHttpRequest|sendBeacon)\s*\(/.test(fs.readFileSync(path.join(__dirname,'..',f),'utf8')),f+' must not transmit');
const inst={name:'Test institution',vision:'V',beneficiaries:'B',startYear:2027,endYear:2030};
/* Every goal template of every sector builds a valid project with no blocking issue. */
for(const s of L.sectors){
 const p=D.build({sectorId:s.id,typeId:s.types[0].id,brief:'brief',institution:inst,goals:s.goals.map(g=>{const down=L.indicator(s.id,g.kpi)?.direction==='down';return {goalId:g.id,baseline:g.type==='requirement'?null:(down?20:10),target:down?10:20,owner:'Owner'};})});
 assert.equal(p.options.length,s.goals.length,s.id);
 assert.ok(p.transitions.length===s.goals.length&&p.enablers.length>0&&p.initiatives.length>0&&p.references.length>0);
 assert.deepEqual(E.validateImport(JSON.parse(JSON.stringify(p))),p,s.id+' round-trips');
 const blocking=E.check(p).filter(x=>x.level==='blocking');assert.deepEqual(blocking,[],s.id+' must not create blocking issues');
 assert.ok(p.options.every(o=>o.id.startsWith('lib-'))&&p.transitions.every(t=>t.id.startsWith('lib-')),'library provenance in ids');
 assert.equal(p.context.sectorId,s.id);assert.ok(p.context.sources.length>0&&p.context.sources.every(x=>x.origin==='library'&&x.status==='accepted'));
 for(const t of p.transitions.filter(t=>t.direction!=='qualitative'&&E.num(t.baseline)&&E.num(t.target)))assert.equal(t.annual.at(-1).target,t.target,'last annual target equals final target');
 for(const i of p.initiatives){assert.ok(i.startYear>=2027&&i.endYear<=2030&&i.endYear>=i.startYear);for(const id of i.enablerIds)assert.ok(p.enablers.some(e=>e.id===id));for(const id of i.dependsOn)assert.ok(p.initiatives.some(x=>x.id===id));assert.ok(i.budget.every(b=>b.amount===null),'budgets stay unknown, never invented');}
 assert.ok(p.enablers.every(e=>e.status==='unknown'),'readiness is never assumed');
 assert.ok(p.options.filter(o=>o.type!=='requirement').every(o=>Object.keys(o.scores).length===0),'library draft leaves preference scores to the team');
}
/* Unknown numbers stay unknown; interpolation only fills what it can. */
{ const p=D.build({sectorId:'edu',typeId:'private',institution:inst,goals:[{goalId:'quality'}]});const t=p.transitions[0];assert.equal(t.baseline,null);assert.equal(t.target,null);assert.ok(t.annual.every(a=>a.target===null));assert.ok(t.outcome===undefined);assert.ok(p.options[0].outcome.includes(SultanI18n.t('drUnknownBaseline')));
 t.baseline=50;t.target=70;assert.equal(D.interpolateAnnual(t,p),4);assert.deepEqual(t.annual.map(a=>a.target),[55,60,65,70]);assert.equal(D.interpolateAnnual(t,p),0,'existing values are kept');t.target=90;assert.equal(D.interpolateAnnual(t,p,{overwrite:true}),4);assert.deepEqual(t.annual.map(a=>a.target),[60,70,80,90]); }
{ const p=D.build({sectorId:'edu',typeId:'private',institution:inst,goals:[{goalId:'efficiency',baseline:0,target:30}]});assert.deepEqual(p.transitions[0].annual.map(a=>a.target),[7.5,15,22.5,30]);assert.equal(p.transitions[0].direction,'up'); }
{ const p=D.build({sectorId:'edu',typeId:'private',institution:inst,goals:[{goalId:'divest-activities',baseline:9000,target:8000}]});assert.equal(p.options[0].type,'divest');assert.equal(p.transitions[0].direction,'down');assert.deepEqual(p.transitions[0].annual.map(a=>a.target),[8750,8500,8250,8000]);assert.ok(p.options[0].divestStop); }
{ const p=D.build({sectorId:'edu',typeId:'private',institution:inst,goals:[{custom:{title:'My goal',kpi:'My KPI',unit:'%',direction:'up'},baseline:10,target:20}]});assert.equal(p.options.length,1);assert.equal(p.transitions[0].kpi,'My KPI');assert.deepEqual(p.transitions[0].annual.map(a=>a.target),[12.5,15,17.5,20]); }
{ const p=D.build({sectorId:'edu',typeId:'private',institution:Object.assign({},inst,{mission:''}),goals:[]});assert.ok(p.institution.mission.length>0,'sector template fills an empty mission');assert.ok(p.institution.notDoing.length>0);const q=D.build({sectorId:'edu',institution:Object.assign({},inst,{mission:'Ours'}),goals:[]});assert.equal(q.institution.mission,'Ours','user text wins over templates'); }
{ const p=D.build({sectorId:'nope',institution:Object.assign({},inst,{sector:'Free text'}),goals:[{goalId:'x'}]});assert.equal(p.options.length,0);assert.equal(p.institution.sector,'Free text'); }
{ const p=D.build({sectorId:'edu',typeId:'private',institution:Object.assign({},inst,{startYear:2027,endYear:2060}),goals:[]});assert.equal(p.institution.endYear,2030,'absurd horizons are clamped'); }
{ const p=D.build({sectorId:'edu',typeId:'private',institution:inst,goals:[],funding:{2027:500000,2028:-5}});assert.equal(p.funding[0].available,500000);assert.equal(p.funding[1].available,null); }
/* addGoal / addReference inside an existing project are idempotent on references and mandates. */
{ const p=E.demo();const before=p.references.length;D.addGoal(p,'edu','quality',{});D.addGoal(p,'edu','teachers',{});const names=p.references.map(r=>r.name);assert.equal(new Set(names).size,names.length,'no duplicate references');assert.ok(p.references.length>before);assert.equal(D.summary(p).library,p.options.filter(o=>o.id.startsWith('lib-')).length+p.references.filter(r=>r.id.startsWith('lib-')).length+p.transitions.filter(t=>t.id.startsWith('lib-')).length+p.enablers.filter(e=>e.id.startsWith('lib-')).length+p.initiatives.filter(i=>i.id.startsWith('lib-')).length+p.mandates.filter(m=>m.id.startsWith('lib-')).length);E.validateImport(JSON.parse(JSON.stringify(p))); }
/* AI JSON normalisation: clamp, map keys, never trust readiness, tolerate garbage. */
const aiJson={institution:{mission:'M',beneficiaries:'',assets:'A',liabilities:'',context:'',culture:'',vision:'',notDoing:'N'},mandates:[{title:'HCDP',relationship:'contribution',source:'vision2030',contribution:'c'}],weightRationale:'w',
 options:[{key:'a',title:'Choice A',type:'differentiation',outcome:'o',whyUs:'w',foothold:'',tradeoff:'t',owner:'x',decision:'select',decisionReason:'r',riskSource:'rs',stopEvidence:'',scores:[{criterion:'identity',value:70,note:'n'},{criterion:'benefit',value:120,note:'n'},{criterion:'bogus',value:50,note:''}],assumptions:[{text:'a',expectedPersistence:'12 months',owner:'o',testEvidence:'e',failureImpact:'f'}],divest:{stop:'',releasedResources:null,redeployTo:'',evidence:'',impact:''}},
  {key:'req',title:'Licence',type:'requirement',outcome:'o',whyUs:'w',foothold:'',tradeoff:'t',owner:'x',decision:'defer',decisionReason:'r',riskSource:'',stopEvidence:'',scores:[{criterion:'identity',value:1,note:''}],assumptions:[],divest:{stop:'',releasedResources:null,redeployTo:'',evidence:'',impact:''}}],
 references:[{key:'r',name:'Ref',kind:'benchmark',source:'s',purpose:'p',context:'c',adaptation:'a',status:'use'}],
 transitions:[{key:'t',optionKey:'a',referenceKey:'r',domain:'d',current:'c',currentSource:'cs',targetState:'ts',kpi:'k',unit:'%',direction:'down',baseline:10,target:20,owner:'o',dataSource:'ds',frequency:'Annual',annual:[{year:2027,milestone:'m',target:12,evidence:'e'},{year:2099,milestone:'x',target:1,evidence:''}]},{key:'orphan',optionKey:'none',referenceKey:'',domain:'d',current:'',currentSource:'',targetState:'',kpi:'k',unit:'',direction:'up',baseline:null,target:null,owner:'',dataSource:'',frequency:'',annual:[]}],
 enablers:[{key:'e',optionKey:'a',title:'En',kind:'authority',action:'activate',control:'external',owner:'o',status:'ready',dueYear:2026,source:'s',route:'r',fallback:'f'}],
 initiatives:[{key:'i',optionKey:'a',transitionKey:'t',title:'Init',kind:'build',owner:'o',startYear:2020,endYear:2040,output:'o',acceptance:'a',capacity:'c',enablerKeys:['e','ghost'],dependsOnKeys:['i'],budget:[{year:2027,amount:-100,releaseEvidence:'g'},{year:2028,amount:50,releaseEvidence:''}]}],
 contextSources:[{title:'Study',kind:'study',issuer:'I',url:'https://x',year:2025,summary:'s',relevance:'r'}],openQuestions:['q1'],notes:'n'};
{ const base=D.build({sectorId:'edu',typeId:'private',institution:inst,goals:[{goalId:'quality',baseline:1,target:2}]});const input=JSON.parse(JSON.stringify(aiJson));input.options[0].sourceOptionId=base.options[0].id;input.transitions[0].sourceTransitionId=base.transitions[0].id;const p=D.fromAI(input,base,{mode:'replace'});
 assert.equal(p.options.length,2);assert.ok(p.options.every(o=>o.id.startsWith('ai-')));
 const a=p.options.find(o=>o.type==='differentiation');assert.equal(a.scores.benefit.value,100,'scores clamp to 0-100');assert.equal(a.scores.bogus,undefined);assert.equal(a.riskDate,'','AI never dates a risk assessment it did not see');
 const req=p.options.find(o=>o.type==='requirement');assert.equal(req.decision,'consider','an AI-proposed obligation needs a team decision');assert.deepEqual(req.scores,{},'requirements are not scored');
 assert.equal(p.transitions.length,1,'orphan transitions are dropped');const t=p.transitions[0];assert.equal(t.direction,'up','direction corrected to match baseline/target');assert.deepEqual(t.annual.map(x=>x.year),[2027,2028,2029,2030]);assert.equal(t.baseline,1);assert.equal(t.target,2);assert.equal(t.annual.at(-1).target,2);assert.equal(t.annual[0].target,base.transitions[0].annual[0].target);
 assert.equal(p.enablers[0].status,'unknown','AI readiness is not trusted');assert.equal(p.enablers[0].dueYear,2027);
 const i=p.initiatives[0];assert.equal(i.startYear,2027);assert.equal(i.endYear,2030);assert.deepEqual(i.enablerIds,[p.enablers[0].id]);assert.deepEqual(i.dependsOn,[],'self-dependency removed');assert.equal(i.budget[0].amount,null);assert.equal(i.budget[1].amount,null);assert.equal(i.budget[0].releaseEvidence,'');
 assert.ok(p.context.sources.some(s=>s.title==='Study'&&s.status==='proposed'&&s.origin==='ai'));assert.ok(p.context.sources.some(s=>s.origin==='library'),'library context survives replace');
 assert.ok(p.reviewNote.includes('q1'));assert.equal(p.institution.mission,base.institution.mission,'identity text already present is not overwritten');assert.equal(p.institution.assets,SultanI18n.t('drUnverified')+' A');
 assert.deepEqual(E.validateImport(JSON.parse(JSON.stringify(p))),p);assert.deepEqual(E.check(p).filter(x=>x.level==='blocking'),[]); }
{ const p=D.fromAI({},E.blank(),{mode:'append'});assert.equal(p.options.length,0);E.validateImport(JSON.parse(JSON.stringify(p))); }
{ const p=D.fromAI({options:'garbage',transitions:null,enablers:[null],initiatives:[{}]},E.blank(),{});assert.equal(p.options.length,0);assert.equal(p.initiatives.length,0); }
/* Structured-output schema stays within the API's supported subset. */
{ const schema=D.aiSchema();const walk=(node,where)=>{if(!node||typeof node!=='object')return;if(node.type==='object'){assert.equal(node.additionalProperties,false,where);assert.deepEqual(Object.keys(node.properties).sort(),[...node.required].sort(),where+' every property required');for(const [k,v] of Object.entries(node.properties))walk(v,where+'.'+k);}for(const k of ['minimum','maximum','minLength','maxLength','multipleOf'])assert.ok(!(k in node),where+' uses unsupported '+k);if(node.items)walk(node.items,where+'[]');if(node.anyOf)node.anyOf.forEach((x,i)=>walk(x,where+'|'+i));};walk(schema,'root');assert.ok(schema.properties.options.items.properties.scores.items.properties.criterion.enum.length===4); }
{ const d=D.digest(E.demo());assert.ok(d.includes('criteria:')&&d.includes('option ')&&d.includes('context sources (accepted)')&&d.includes('interface language')); }
assert.equal(D.origin('lib-edu-quality-o-ab12'),'library');assert.equal(D.origin('ai-o-1-x'),'ai');assert.equal(D.origin('o1'),null);
console.log(JSON.stringify({suite:'draft-engine',passed:true,sectorsBuilt:L.sectors.length}));
