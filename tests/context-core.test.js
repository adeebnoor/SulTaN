/* Context dossier: schema extension, validation, consistency rules, demo and report fragment. */
'use strict';
const assert=require('node:assert/strict');
global.SultanLocales={en:require('../src/locales/en.js'),ar:require('../src/locales/ar.js')};
for(const f of ['final','guided','field-guide'])require('../src/locales/'+f+'.js');
global.SultanI18n=require('../src/i18n.js');
global.Sultan=require('../src/import.js');require('../src/final-core.js');require('../src/context-core.js');
const E=global.Sultan;
const clone=x=>JSON.parse(JSON.stringify(x));
{ const p=E.blank();assert.deepEqual(p.context,{sectorId:'',typeId:'',brief:'',sources:[],documents:[],reviews:[],ai:{enabled:false,consentAt:'',log:[]}}); }
{ const p=E.demo();assert.equal(p.context.sectorId,'highered');assert.equal(p.context.sources.length,3);assert.equal(E.contextSummary(p).proposed,1);assert.deepEqual(E.validateImport(clone(p)),p,'demo with dossier must round-trip'); }
{ const p=E.demo();const legacy=clone(p);delete legacy.context;const q=E.validateImport(legacy);assert.equal(q.context.sources.length,0,'legacy exports gain an empty dossier'); }
{ const p=clone(E.demo());p.context.extra='x';assert.throws(()=>E.validateImport(p),/context/i); }
{ const p=clone(E.demo());p.context.sources[0].kind='law';assert.throws(()=>E.validateImport(p)); }
{ const p=clone(E.demo());p.context.sources[0].status='maybe';assert.throws(()=>E.validateImport(p)); }
{ const p=clone(E.demo());p.context.ai={enabled:true,consentAt:'',log:[],apiKey:'sk-leak'};assert.throws(()=>E.validateImport(p),/ai\.apiKey/,'keys never travel inside the project'); }
{ const p=E.demo();const issues=E.check(p);assert.ok(issues.some(x=>x.entity==='context'&&x.section==='references'&&x.level==='missing'),'proposed sources are a visible issue');p.context.sources.forEach(s=>s.status='accepted');assert.ok(!E.check(p).some(x=>x.entity==='context')); }
{ const p=E.demo();E.addContextReview(p,{model:'test',summary:'s',items:[{section:'choices',severity:'blocking',message:'Target not supported'},{section:'nowhere',severity:'odd',message:'x'}]});const r=p.context.reviews.at(-1);assert.equal(r.items[1].section,'review');assert.equal(r.items[1].severity,'hint');assert.ok(E.check(p).some(x=>x.entity==='ai-review'&&x.section==='choices'&&x.level==='warning'),'blocking AI findings surface as warnings, never as approval blockers'); }
/* A key-free local review snapshots check() itself: it must not come back as duplicated, stale "AI" warnings. */
{ const p=E.demo();const base=E.check(p);assert.ok(base.some(x=>x.level==='blocking'));E.addContextReview(p,{model:'local-rules',summary:'local',items:base.map(x=>({section:x.section,severity:x.level==='blocking'?'blocking':'warning',message:x.message}))});const after=E.check(p);assert.equal(after.length,base.length,'local review adds no issues');assert.ok(!after.some(x=>x.entity==='ai-review')); }
{ const p=E.blank();const a=E.addContextSource(p,{title:'Same title',url:'https://a',kind:'regulation'});const b=E.addContextSource(p,{title:' same TITLE ',url:'https://b'});assert.equal(a,b,'titles dedupe');E.addContextSource(p,{title:'Other',url:'https://a'});assert.equal(p.context.sources.length,2,'shared root URLs do not collapse distinct sources'); }
{ const p=E.blank();for(let i=0;i<350;i++)E.recordAiUse(p,{model:'m',purpose:'p',inputTokens:1,outputTokens:1});assert.equal(p.context.ai.log.length,300); }
{ const p=E.demo();const html=E.contextReportHtml(p);assert.ok(html.includes(p.context.sources[0].title));assert.ok(html.includes('<table'));assert.ok(html.includes(SultanI18n.t('ctxNoAiDisclosure')));E.recordAiUse(p,{model:'m',purpose:'strategy',inputTokens:10,outputTokens:20});assert.ok(E.contextReportHtml(p).includes('1')); }
{ const p=E.demo();p.institution.endYear=2031;E.syncYears(p);assert.equal(p.context.sources.length,3,'syncYears keeps the dossier'); }
console.log(JSON.stringify({suite:'context-core',passed:true}));
