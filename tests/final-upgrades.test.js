'use strict';
const assert=require('node:assert/strict');
global.SultanLocales={en:require('../src/locales/en.js'),ar:require('../src/locales/ar.js')};
// Extend dictionaries exactly as the browser does before i18n is initialized.
require('../src/locales/final.js');
global.SultanI18n=require('../src/i18n.js');
global.Sultan=require('../src/import.js');
require('../src/final-core.js');
const E=global.Sultan;
function validBase(){
 const p=E.blank();Object.assign(p.institution,{name:'X',mission:'M',beneficiaries:'B',assets:'A',liabilities:'L',context:'C',culture:'K',vision:'V'});p.weightRationale='R';return p;
}
{
 const p=E.blank();
 assert.equal(p.documentNumber,1);assert.equal(p.institution.liabilities,'');assert.ok(Array.isArray(p.collaboration.contributions));
 const o=E.option();assert.ok(Array.isArray(o.assumptions));assert.equal(o.stopEvidence,'');
 const t=E.transition(p);assert.equal(t.trackType,'outcome');assert.equal(t.indicatorType,'performance');
 const i=E.initiative(p);assert.ok(i.budget.every(b=>b.releaseEvidence===''));
}
{
 const p=validBase(),o=E.option();Object.assign(o,{id:'d1',title:'Stop legacy center',type:'divest',outcome:'Concentrate resources',whyUs:'Evidence',tradeoff:'Transition cost',owner:'CEO',decision:'select',decisionReason:'Low performance',divestStop:'Legacy center',releasedResources:1200000,redeployTo:'Priority program',divestEvidence:'Three-year underperformance',divestImpact:'Transition staff',riskSource:'Risk register R-12',riskDate:'2026-09-15',scores:Object.fromEntries(p.criteria.map(c=>[c.id,{value:80,note:'evidence'}]))});o.assumptions=[{id:'a1',text:'Funding remains available',expectedPersistence:'24 months',owner:'CFO',testDate:'2027-01-01',testEvidence:'Budget approval',failureImpact:'Redeployment pauses'}];p.options=[o];const t=E.transition(p);Object.assign(t,{id:'t1',optionId:o.id,referenceId:'',domain:'Outcome',current:'10',currentSource:'baseline',targetState:'22',kpi:'Index',unit:'pts',direction:'delta',baseline:10,target:12,owner:'O',dataSource:'D',trackType:'outcome',indicatorType:'performance'});t.annual=t.annual.map((a,k)=>({...a,milestone:'m',evidence:'e',target:k+3}));p.transitions=[t];const i=E.initiative(p);Object.assign(i,{id:'i1',optionId:o.id,transitionId:t.id,title:'Pilot',kind:'learn',owner:'O',output:'out',acceptance:'acc',capacity:'cap'});i.budget[0].amount=100;i.budget[0].releaseEvidence='Gate passed';p.initiatives=[i];p.collaboration.owners.choices='Strategy lead';p.collaboration.contributions.push({at:'2026-09-15T00:00:00Z',section:'choices',name:'Team A',note:'Reviewed choice'});
 const q=E.validateImport(JSON.parse(JSON.stringify(p)));
 assert.equal(q.options[0].type,'divest');assert.equal(q.options[0].releasedResources,1200000);assert.equal(q.transitions[0].direction,'delta');assert.equal(q.initiatives[0].budget[0].releaseEvidence,'Gate passed');assert.equal(q.collaboration.owners.choices,'Strategy lead');
 assert.equal(E.absoluteTarget(q.transitions[0],q.transitions[0].annual[0]),13);
}
{
 const p=validBase(),o=E.option();Object.assign(o,{id:'m1',title:'Moonshot',type:'moonshot',outcome:'O',whyUs:'W',foothold:'F',tradeoff:'T',owner:'X',decision:'select',decisionReason:'D',riskSource:'R',riskDate:'2026-09-15',scores:Object.fromEntries(p.criteria.map(c=>[c.id,{value:70,note:'n'}]))});p.options=[o];assert.ok(E.check(p).some(x=>x.message===SultanI18n.t('moonshotStopMissing')));o.stopEvidence='Stop if adoption < 10%';assert.ok(!E.check(p).some(x=>x.message===SultanI18n.t('moonshotStopMissing')));
}
{
 const p=validBase(),o=E.option();Object.assign(o,{id:'o1',title:'A',outcome:'O',whyUs:'W',tradeoff:'T',owner:'X',decision:'select',decisionReason:'D',riskSource:'R',riskDate:'2026-09-15',scores:Object.fromEntries(p.criteria.map(c=>[c.id,{value:70,note:'n'}]))});p.options=[o];const t=E.transition(p);Object.assign(t,{optionId:o.id,direction:'delta',baseline:50,target:10});const row={target:10,actual:55};assert.equal(E.progress(t,row),50);t.indicatorType='risk';assert.equal(E.indicatorStatus(t,{target:10,actual:65}),'behind');
}
{
 const p=E.demo();assert.ok(Array.isArray(p.options[0].assumptions));assert.ok(p.options.every(o=>'riskSource' in o));assert.equal(p.documentNumber,1);assert.ok(p.collaboration&&p.collaboration.owners);assert.deepEqual(new Set(p.options.map(o=>o.type)),new Set(['requirement','differentiation','moonshot','divest']));assert.ok(p.options.some(o=>o.type==='divest'&&o.decision==='select'&&o.releasedResources>0&&o.divestStop&&o.redeployTo&&o.divestEvidence&&o.divestImpact));assert.ok(p.transitions.some(t=>t.direction==='delta'));assert.ok(p.transitions.some(t=>t.trackType==='maturity'&&t.maturityFamily));assert.ok(p.transitions.some(t=>t.indicatorType==='risk'));assert.ok(p.initiatives.some(i=>i.budget.some(b=>b.releaseEvidence)));
}
console.log(JSON.stringify({suite:'final-upgrades',passed:true}));

{ const p=E.demo(),raw=JSON.parse(JSON.stringify(p));raw.options[0].riskDate='2026';assert.equal(E.validateImport(raw).options[0].riskDate,'2026-01-01');raw.options[0].riskDate='2026-05';assert.equal(E.validateImport(raw).options[0].riskDate,'2026-05-01');raw.options[0].riskDate=null;assert.equal(E.validateImport(raw).options[0].riskDate,'');}
{ const p=E.demo();p.institution.notDoing='legacy duplicated units';p.options[0].tradeoff='legacy duplicated units are explicitly excluded';assert.ok(Array.isArray(E.semanticIssues(p)));assert.ok(E.semanticIssues(p).every(x=>x.level==='hint'));}
