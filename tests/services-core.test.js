'use strict';
const assert=require('node:assert/strict');
global.SultanLocales={en:require('../src/locales/en.js'),ar:require('../src/locales/ar.js')};
for(const f of ['final','guided','field-guide','lens','strategy','services'])require('../src/locales/'+f+'.js');
global.SultanI18n=require('../src/i18n.js');
global.Sultan=require('../src/import.js');
for(const f of ['final-core','context-core','sector-library','draft-engine','expert-lens','strategy-core'])require('../src/'+f+'.js');
const E=Sultan,S=SultanStrategy,copy=x=>JSON.parse(JSON.stringify(x));let count=0;
function test(name,fn){fn();count++;console.log('PASS '+name);}
test('Legacy strategy projects gain empty services without invented claims',()=>{
 const p=E.blank();delete p.strategy.services;const q=E.validateImport(copy(p));
 assert.deepEqual(q.strategy.services.shifts,[]);
 assert.deepEqual(q.strategy.services.inaction,[]);
 assert.equal(q.strategy.services.watch.cadence,'quarterly');
});
test('Shift radar preserves unknowns and requires evidence for completion',()=>{
 const p=E.blank();S.ensure(p);const x=S.addShift(p);
 Object.assign(x,{signal:'Synthetic channel shift',implication:'Synthetic interface risk'});
 assert.equal(S.serviceReadiness(p).shift.done,true);
 assert.ok(S.issues(p).some(i=>i.code==='shift'));
 x.evidence='Synthetic primary source';assert.ok(!S.issues(p).some(i=>i.code==='shift'));
});
test('Channel risk is a specific shift type, not every external trend',()=>{
 const p=E.blank();S.ensure(p);const x=S.addShift(p);Object.assign(x,{shiftType:'technology',signal:'Synthetic model capability',evidence:'Synthetic source',implication:'Synthetic implication'});
 assert.equal(S.serviceReadiness(p).channel.done,false);x.shiftType='channel';assert.equal(S.serviceReadiness(p).channel.done,true);
});
test('Cost of inaction records qualitative uncertainty without fabricated numbers',()=>{
 const p=E.blank();const o=E.option();Object.assign(o,{title:'Synthetic choice',decision:'select'});p.options.push(o);S.ensure(p);
 const x=S.addInaction(p,o.id);Object.assign(x,{decision:'Enter now or wait',consequence:'Lose learning window',window:'90 days',inactionCost:'Delayed evidence and partner access',owner:'Strategy lead',reviewDate:'2027-03-31'});
 assert.equal(S.serviceReadiness(p).inaction.done,true);
 assert.ok(!S.issues(p).some(i=>i.code==='inaction'));
 assert.equal(x.actionCost,'');
});
test('Watch plan is recorded but does not imply background monitoring',()=>{
 const p=E.blank();S.ensure(p);Object.assign(p.strategy.services.watch,{owner:'Strategy office',triggers:'Channel share changes; new regulation',nextReviewDate:'2027-06-30'});
 assert.equal(S.serviceReadiness(p).watch.done,true);
});
test('Malformed service enums, dates and duplicate ids are rejected',()=>{
 for(const mutate of [
  p=>{S.addShift(p).shiftType='magic';},
  p=>{S.addInaction(p).reviewDate='2027-02-31';},
  p=>{const a=S.addShift(p),b=S.addShift(p);b.id=a.id;}
 ]){const p=E.blank();S.ensure(p);mutate(p);assert.throws(()=>E.validateImport(copy(p)));}
});
test('Service evidence is escaped in reports',()=>{
 const p=E.blank();S.ensure(p);const x=S.addShift(p);Object.assign(x,{signal:'<img src=x onerror=alert(1)>',evidence:'Synthetic source',implication:'Synthetic implication'});
 const h=S.report(p);assert.ok(!h.includes('<img'));assert.ok(h.includes('&lt;img'));assert.ok(h.includes('Strategic services evidence'));
});
test('Route and recurring service readiness reuse canonical opportunity records',()=>{
 const p=E.blank(),o=E.option();Object.assign(o,{title:'Synthetic recurring offer',decision:'select'});p.options.push(o);S.ensure(p);
 const x=S.addOpportunity(p,o.id);Object.assign(x,{route:'partner',routeReason:'Partner route',buildRationale:'Slow',partnerRationale:'Fast access',acquireRationale:'Too expensive',ourContribution:'Distribution',partnerContribution:'Capability',partnerIncentive:'New market',partnerEvidence:'Synthetic discussion',valueModel:'commercial',recurringShare:70,renewalDriver:'Ongoing service'});
 const r=S.serviceReadiness(p);assert.equal(r.route.done,true);assert.equal(r.partnership.done,true);assert.equal(r.recurring.done,true);
});
console.log(JSON.stringify({suite:'strategic-services-core',tests:count,passed:count}));
