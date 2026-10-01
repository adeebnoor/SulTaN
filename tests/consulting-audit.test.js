'use strict';
const assert=require('node:assert/strict');
global.SultanLocales={en:require('../src/locales/en.js'),ar:require('../src/locales/ar.js')};
for(const f of ['final','guided','field-guide','lens'])require('../src/locales/'+f+'.js');
global.SultanI18n=require('../src/i18n.js');global.Sultan=require('../src/import.js');
for(const f of ['final-core','context-core','sector-library','draft-engine','expert-lens'])require('../src/'+f+'.js');
const E=Sultan,D=SultanDraft,L=SultanLens,copy=x=>JSON.parse(JSON.stringify(x));
const p=D.build({sectorId:'edu',typeId:'private',institution:{name:'Audit fixture',startYear:2027,endYear:2030},goals:[{goalId:'quality',baseline:58,target:70},{goalId:'teachers',baseline:82,target:90}]});
p.transitions[0].kpi='Internal diagnostic score';p.transitions[0].currentSource='User supplied internal diagnostic';p.transitions[0].dataSource='Internal register';
p.transitions[0].annual[0].actual=59;p.transitions[0].annual[0].actualSource='Fictional test';
p.initiatives[0].budget[0].amount=12500;p.funding[0].available=1200000;
const fixture={institution:{assets:'A waiting list exists'},mandates:[{title:p.mandates[0].title,relationship:'contribution'}],references:[{key:'ref',name:'Model reference',source:'Homepage',status:'use'}],
 options:p.options.map((o,n)=>({key:'o'+n,sourceOptionId:o.id,title:o.title,type:o.type,decision:'select',whyUs:'Established reputation',outcome:'Suggested outcome'})),
 transitions:p.transitions.map((t,n)=>({key:'t'+n,sourceTransitionId:t.id,optionKey:'o'+n,referenceKey:'ref',kpi:'National test NAFS',unit:'points',direction:'up',baseline:99,target:100,currentSource:'Official report never supplied',dataSource:'Official website',annual:[{year:2027,target:99}]})),
 initiatives:[{key:'i',sourceInitiativeId:p.initiatives[0].id,optionKey:'o0',transitionKey:'t0',title:p.initiatives[0].title,startYear:2027,endYear:2030,budget:[{year:2027,amount:3500000},{year:2028,amount:80000}]},{key:'new',optionKey:'o0',title:'New model initiative',startYear:2027,endYear:2028,budget:[{year:2027,amount:50000}]}]};
const before=copy(p),q=D.fromAI(fixture,p,{mode:'replace'});
assert.deepEqual(p,before,'generation never mutates the original project');
assert.equal(q.transitions[0].baseline,58);assert.equal(q.transitions[0].target,70);
assert.equal(q.transitions[0].kpi,'Internal diagnostic score');assert.equal(q.transitions[0].currentSource,p.transitions[0].currentSource);assert.equal(q.transitions[0].annual[0].actual,59);
assert.equal(q.initiatives[0].budget[0].amount,12500);assert.equal(q.initiatives[0].budget[1].amount,null);assert.ok(q.initiatives[1].budget.every(b=>b.amount===null));
assert.equal(q.references[0].status,'unchecked');assert.ok(q.institution.assets.includes(SultanI18n.t('drUnverified')));assert.ok(q.options.every(o=>o.whyUs.startsWith(SultanI18n.t('drUnverified'))));
assert.equal(q.mandates.length,p.mandates.length,'AI/library mandates deduplicate');assert.deepEqual(E.validateImport(copy(q)),q);
const lost=copy(fixture);lost.options=lost.options.slice(0,1);assert.throws(()=>D.fromAI(lost,p,{mode:'replace'}),new RegExp(SultanI18n.t('drMappingLost').slice(0,30)),'missing choices do not replace user data');
const duplicate=copy(fixture);duplicate.initiatives.push({...duplicate.initiatives[0],key:'duplicate'});const du=D.fromAI(duplicate,p,{mode:'replace'});assert.equal(du.initiatives.reduce((n,i)=>n+(i.budget[0].amount||0),0),12500,'one source budget cannot be copied twice');
const fresh=E.demo();E.addContextReview(fresh,{model:'test',summary:'Old gap',items:[{section:'roadmap',severity:'blocking',message:'Old funding gap'}]});assert.ok(E.contextReviewIsCurrent(fresh));assert.ok(E.check(fresh).some(x=>x.entity==='ai-review'));
fresh.revision++;fresh.documentNumber++;E.recordAiUse(fresh,{model:'test',purpose:'review'});assert.ok(E.contextReviewIsCurrent(fresh),'administrative metadata does not stale a review');
const imported=E.validateImport(copy(fresh));assert.ok(E.contextReviewIsCurrent(imported),'freshness survives roundtrip');
fresh.options[0].decision='defer';assert.ok(!E.contextReviewIsCurrent(fresh));assert.ok(!E.check(fresh).some(x=>x.entity==='ai-review'));assert.ok(!E.contextReportHtml(fresh).includes('Old funding gap'));assert.ok(E.contextReportHtml(fresh).includes(SultanI18n.t('ctxReviewStale')));
const legacy=copy(imported);delete legacy.context.reviews[0].basis;const recovered=E.validateImport(legacy);assert.ok(!E.contextReviewIsCurrent(recovered),'old reviews are explicitly unverified');
const school=copy(p);school.options.forEach(o=>o.owner='Owner');school.initiatives.push({...E.initiative(school),optionId:school.options[0].id,title:'تصميم المسار المهني ونظام الحوافز'});assert.ok(!L.hints(school).some(h=>h.lens==='partner-route'));assert.ok(!L.hints(school).some(h=>h.lens==='bottom-up'));
const expansion=E.option();Object.assign(expansion,{title:'التوسع بفرع جديد',type:'moonshot',decision:'select'});school.options.push(expansion);assert.ok(L.hints(school).some(h=>h.lens==='partner-route'&&h.entity===expansion.id));
const en={...E.enabler(),optionId:expansion.id,title:'تمويل رأسمالي للفرع',route:'طلب التمويل مدعوم بدراسة الجدوى'};school.enablers.push(en);
const study={...E.initiative(school),optionId:expansion.id,title:'دراسة جدوى للفرع',kind:'learn',enablerIds:[en.id]};school.initiatives.push(study);
assert.equal(E.feasibilityFundingConflicts(school).length,1);assert.ok(E.check(school).some(x=>x.entity===study.id&&x.message.includes(SultanI18n.t('ctxFeasibilityCycle'))));
expansion.decision='defer';assert.equal(E.feasibilityFundingConflicts(school).length,0);assert.ok(!E.check(school).some(x=>x.entity===study.id&&x.level==='warning'));
const cycleInput={...copy(fixture),enablers:[{key:'fund',optionKey:'o0',title:en.title,route:en.route}],initiatives:[...copy(fixture.initiatives),{key:'study',optionKey:'o0',title:study.title,kind:'learn',startYear:2027,endYear:2027,enablerKeys:['fund']} ]};
const repaired=D.fromAI(cycleInput,p,{mode:'replace'});assert.equal(E.feasibilityFundingConflicts(repaired).length,0);assert.ok(repaired.reviewNote.includes(SultanI18n.t('drFeasibilityFix')));
const anonymous=D.fromAI({options:[{key:'new',title:'New choice'}],transitions:[{optionKey:'new',baseline:58,target:70,currentSource:'Imaginary report'}],initiatives:[]},E.blank());assert.equal(anonymous.transitions[0].baseline,null);assert.equal(anonymous.transitions[0].currentSource,'');
console.log(JSON.stringify({suite:'consulting-audit',passed:true}));
