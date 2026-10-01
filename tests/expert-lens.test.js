/* Expert lenses: the method owner's thinking patterns run as advisory checks, travel to the AI, and learn. */
'use strict';
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
global.SultanLocales={en:require('../src/locales/en.js'),ar:require('../src/locales/ar.js')};
for(const f of ['final','guided','field-guide','lens'])require('../src/locales/'+f+'.js');
global.SultanI18n=require('../src/i18n.js');
global.Sultan=require('../src/import.js');require('../src/final-core.js');require('../src/context-core.js');require('../src/sector-library.js');require('../src/draft-engine.js');
const Lens=require('../src/expert-lens.js'),E=global.Sultan,D=global.SultanDraft,L=global.SultanLibrary,I=global.SultanI18n;
const src=fs.readFileSync(path.join(__dirname,'../src/expert-lens.js'),'utf8');
assert.ok(!/\b(fetch|XMLHttpRequest|sendBeacon)\s*\(/.test(src),'lenses are local; no network');
let mem={};Lens._setStorage({get:k=>mem[k]??null,set:(k,v)=>{mem[k]=v;}});
const SECTIONS=['identity','choices','references','priorities','enablers','roadmap','review'];
const inst={name:'Test',vision:'V',beneficiaries:'B',startYear:2027,endYear:2030};
const clone=x=>JSON.parse(JSON.stringify(x));
/* Built-in catalogue: the adviser's patterns from the university analysis and the technology-company notes. */
const ids=Lens.builtins();assert.ok(ids.length>=16);assert.equal(new Set(ids).size,ids.length);
for(const id of ['unique','concentrate','evaluate-first','stabilize','controllable','critical-mass','moonshot-scale','bottom-up','partner-route','recurring','vertical-focus','follow-funding','time-capacity','persistence','liabilities','ecosystem','unknowns','ai-service'])assert.ok(ids.includes(id),'missing lens '+id);
for(const l of Lens.all()){for(const k of ['title','question','lookFor'])assert.ok(typeof l[k]==='string'&&l[k].length>10,l.id+'.'+k);assert.ok(Lens.GROUPS.includes(l.group),l.id+' group');assert.ok(['kau','ejada','method'].includes(l.source),l.id+' source');}
/* Checks never throw and only produce well-formed advisory hints, for the blank project, the demo and every library draft. */
const wellFormed=hs=>{for(const h of hs){assert.ok(ids.includes(h.lens)||h.lens.startsWith('my-'),h.lens);assert.ok(SECTIONS.includes(h.section),h.section);assert.equal(h.level,'lens');assert.ok(typeof h.message==='string'&&h.message.length>5);}};
wellFormed(Lens.hints(E.blank()));
const demoHints=Lens.hints(E.demo());wellFormed(demoHints);assert.ok(demoHints.length>=1,'the fictional example invites at least one lens question');
for(const s of L.sectors){const p=D.build({sectorId:s.id,typeId:s.types[0].id,brief:'b',institution:inst,goals:s.goals.map(g=>{const down=L.indicator(s.id,g.kpi)?.direction==='down';return {goalId:g.id,baseline:g.type==='requirement'?null:(down?20:10),target:down?10:20};})});wellFormed(Lens.hints(p));assert.deepEqual(E.check(p).filter(x=>x.level==='blocking'),[],s.id);}
/* Advisory means advisory: check() and the base issue list are untouched by lenses. */
{ const p=E.demo();const before=E.check(p).length;Lens.hints(p);assert.equal(E.check(p).length,before);assert.ok(!E.check(p).some(x=>x.level==='lens')); }
/* Specific judgements. */
{ const p=D.build({sectorId:'edu',typeId:'private',institution:inst,goals:['quality','teachers','efficiency','parents','digital'].map(goalId=>({goalId,baseline:50,target:60}))});p.institution.notDoing='';
  assert.ok(Lens.hints(p).some(h=>h.lens==='concentrate'),'five directions and nothing stopped → concentrate');
  const q=D.build({sectorId:'edu',typeId:'private',institution:inst,goals:[...['quality','teachers','efficiency','parents'].map(goalId=>({goalId,baseline:50,target:60})),{goalId:'divest-activities',baseline:9000,target:8000}]});
  assert.ok(!Lens.hints(q).some(h=>h.lens==='concentrate'),'a divest choice answers the concentration lens');
  assert.ok(!Lens.hints(q).some(h=>h.lens==='evaluate-first'),'the library divest template carries its learning initiative and evidence'); }
{ const p=D.build({sectorId:'edu',typeId:'private',institution:inst,goals:[{goalId:'quality',baseline:40,target:70}]});assert.ok(Lens.hints(p).some(h=>h.lens==='stabilize'),'a 75% jump asks the stabilize question');
  const q=D.build({sectorId:'edu',typeId:'private',institution:inst,goals:[{goalId:'quality',baseline:60,target:70}]});assert.ok(!Lens.hints(q).some(h=>h.lens==='stabilize')); }
{ const p=D.build({sectorId:'tech',typeId:'si',brief:'IT services company',institution:inst,goals:[{goalId:'recurring',baseline:20,target:50},{goalId:'partner',baseline:5,target:30},{goalId:'fraud-ai',baseline:0,target:4},{goalId:'ai-security',baseline:2,target:12},{goalId:'verticals',baseline:40,target:70}]});
  const hs=Lens.hints(p);const partner=p.options.find(o=>o.id.includes('-partner-'));
  assert.ok(partner&&!hs.some(h=>h.lens==='partner-route'&&h.entity===partner.id),'the partnership template states the route and what we bring');
  assert.ok(!hs.some(h=>h.lens==='ai-service'),'AI service and security for AI are both present');
  const q=D.build({sectorId:'tech',typeId:'si',brief:'IT services company',institution:inst,goals:[{goalId:'verticals',baseline:40,target:70}]});
  assert.ok(Lens.hints(q).some(h=>h.lens==='ai-service'),'a technology company without an AI direction is asked where the recurring AI service is'); }
{ const p=E.demo();const sel=p.options.filter(o=>o.decision==='select');sel.forEach(o=>o.owner='');assert.ok(Lens.hints(p).some(h=>h.lens==='bottom-up'));
  p.institution.liabilities='';assert.ok(Lens.hints(p).some(h=>h.lens==='liabilities'));p.institution.liabilities='Debt';assert.ok(!Lens.hints(p).some(h=>h.lens==='liabilities')); }
/* Memory: the expert's own patterns, feedback, muting, prompts, learning from findings and notes, export/import. */
{ const p=E.demo();
  const own=Lens.learn({title:'Reciprocity',question:'What do we bring to the partner?',keywords:['zzqq-token','reciprocity']});assert.ok(own.id.startsWith('my-'));
  assert.equal(Lens.learn({title:'reciprocity',question:'dup'}).id,own.id,'titles dedupe');
  assert.ok(Lens.hints(p).some(h=>h.lens===own.id&&h.message.includes('What do we bring')),'a pattern whose keywords are absent raises a hint');
  const q=clone(p);q.reviewNote='We bring reciprocity to every partner.';assert.ok(!Lens.hints(q).some(h=>h.lens===own.id),'a keyword present anywhere answers the pattern');
  assert.ok(Lens.promptBlock().includes('(partner-route)')&&Lens.promptBlock().includes('Reciprocity'),'built-in and own lenses travel in the prompt block');
  assert.ok(Lens.reviewQuestions().some(x=>x.id==='partner-route'));
  for(let i=0;i<3;i++)Lens.feedback('stabilize','noise');assert.ok(Lens.isMuted('stabilize'));assert.ok(!Lens.promptBlock().includes('(stabilize)'),'a lens marked "not here" three times goes quiet');
  const jump=D.build({sectorId:'edu',typeId:'private',institution:inst,goals:[{goalId:'quality',baseline:40,target:70}]});assert.ok(!Lens.hints(jump).some(h=>h.lens==='stabilize'));
  Lens.setEnabled('stabilize',true);assert.ok(!Lens.isMuted('stabilize'));assert.ok(Lens.hints(jump).some(h=>h.lens==='stabilize'));
  Lens.feedback('partner-route','useful');Lens.feedback('partner-route','useful');assert.equal(Lens.active()[0].id,'partner-route','useful lenses lead');
  Lens.setIncludeInAI(false);assert.equal(Lens.promptBlock(),'');assert.deepEqual(Lens.reviewQuestions(),[]);Lens.setIncludeInAI(true);
  const learned=Lens.fromFinding({section:'choices',severity:'warning',message:'Fintech tickets are small; focus elsewhere',fix:'Pick verticals with large tickets and a national agenda'});assert.ok(learned&&learned.question.includes('national agenda'));
  const cands=Lens.extract('- Why focus on fintech when their tickets are small?\n- Fraud is a good use case because it is recurring business.\n- What can we bring to the table for the partner?\nshort\n');assert.equal(cands.length,3);
  const exported=Lens.exportJson();mem={};assert.equal(Lens.mem().custom.length,0);Lens.importJson(exported);assert.equal(Lens.mem().custom.length,2);assert.ok(Lens.isMuted('stabilize')===false);
  assert.throws(()=>Lens.importJson('{"kind":"other"}'));
  Lens.forget(own.id);assert.equal(Lens.mem().custom.length,1); }
/* Report: the context section discloses the lenses applied. */
{ const p=E.demo();const html=E.contextReportHtml(p);assert.ok(html.includes(I.t('lensReportTitle')));assert.ok(html.includes('<table')); }
/* Bilingual: the same lens reads in both languages. */
{ for(const lang of ['ar','en'])for(const l of Lens.catalogue(lang))for(const k of ['title','question','lookFor','example'])assert.ok(typeof l[k]==='string'&&l[k].trim().length>8,`${l.id}.${k} (${lang})`);
  assert.ok(/متكرر/.test(Lens.catalogue('ar').find(l=>l.id==='recurring').title)&&/recurring/i.test(Lens.catalogue('en').find(l=>l.id==='recurring').title));
  assert.ok(Lens.catalogue('en').find(l=>l.id==='partner-route').question.includes('bring to the table')); }
/* Small counts and maturity tracks are not asked to "stabilize". */
{ const p=E.demo();const tiny=p.transitions.find(t=>t.trackType!=='maturity');tiny.baseline=1;tiny.target=5;assert.ok(!Lens.hints(p).some(h=>h.lens==='stabilize'&&h.entity===tiny.id)); }
console.log(JSON.stringify({suite:'expert-lens',passed:true,builtins:ids.length,demoHints:demoHints.length}));
