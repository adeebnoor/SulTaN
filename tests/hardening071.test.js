/* Behavioral model regressions retained from 0.7.1 and extended for 0.7.2.
 * Visual, localization and export checks run in hardening_browser.py, not source regexes.
 */
'use strict';
const assert=require('node:assert/strict'),fs=require('node:fs'),E=require('../src/import.js');
const results=[];
function test(name,fn){try{fn();results.push({name,pass:true});}catch(e){results.push({name,pass:false,error:e.message});}}
function alternatives(){
 const p=E.blank();p.criteria=[{id:'benefit',name:'Benefit',weight:50,low:'low',high:'high',polarity:'benefit'},{id:'cost',name:'Cost',weight:50,low:'low',high:'high',polarity:'cost'}];
 p.options=[{...E.option(),id:'a',title:'A',scores:{benefit:{value:80,note:'x'},cost:{value:20,note:'x'}}},{...E.option(),id:'b',title:'B',scores:{benefit:{value:70,note:'x'},cost:{value:60,note:'x'}}}];return p;
}
test('Cost polarity is applied once',()=>{const p=alternatives();assert.equal(E.score(p,p.options[0]).value,80);assert.equal(E.score(p,p.options[1]).value,55);});
test('Unknown cost stays an interval',()=>{const p=alternatives();p.options[0].scores.cost.value=null;const s=E.score(p,p.options[0]);assert.equal(s.value,null);assert.equal(s.low,40);assert.equal(s.high,90);});
test('Sensitivity returns no invented switch for a dominating option',()=>{const p=alternatives(),s=E.breakEven(p);assert.equal(s.length,2);assert.ok(s.every(x=>x.threshold===null));});
test('A reported switch actually changes the leaders',()=>{const p=alternatives();p.options[1].scores.benefit.value=95;const base=E.ranking(p)[0].id;const s=E.breakEven(p).filter(x=>x.threshold!==null);assert.ok(s.length);for(const x of s){assert.ok(x.threshold>0&&x.threshold<100);const r=E.rankingAt(p,x.criterionId,x.threshold);assert.ok(r[0].id!==base||Math.abs(r[0].value-r[1].value)<1e-7);}});
test('Pending and unknown authority enter consistency checks',()=>{const p=E.demo(),ai=E.authorityIssues(p);assert.ok(ai.some(x=>x.entity==='e1'&&x.code==='authorityIssuePending'));assert.ok(ai.some(x=>x.entity==='e2'&&x.code==='authorityIssueUnknownStatus'));for(const id of ['e1','e2'])assert.ok(E.check(p).some(x=>x.entity===id&&x.section==='enablers'));});
test('No initiatives has no cost and no confirmation judgment',()=>{const c=E.choiceCost(E.demo(),'o3');assert.deepEqual(c,{total:null,known:0,unknown:0,confirmed:null,count:0,state:'no-initiatives'});});
test('Explicit zero remains an observed zero',()=>{const p=E.demo();p.initiatives[0].budget.forEach(b=>b.amount=0);const c=E.choiceCost(p,'o1');assert.equal(c.total,0);assert.equal(c.known,2);assert.equal(c.unknown,0);assert.equal(c.confirmed,true);});
test('All-null budgets are unestimated, not free',()=>{const p=E.demo();p.initiatives[0].budget.forEach(b=>b.amount=null);const c=E.choiceCost(p,'o1');assert.equal(c.known,0);assert.equal(c.unknown,2);});
test('Missing annual row is counted as an unknown',()=>{const p=E.demo();p.initiatives[0].budget=p.initiatives[0].budget.filter(b=>b.year!==2028);const c=E.choiceCost(p,'o1');assert.equal(c.total,200000);assert.equal(c.known,1);assert.equal(c.unknown,1);});
test('Confirmation is independent of the estimate amount',()=>{const p=E.demo();p.initiatives[0].budgetStatus='unconfirmed';assert.equal(E.choiceCost(p,'o1').state,'unconfirmed');p.initiatives[0].budgetStatus='confirmed';assert.equal(E.choiceCost(p,'o1').state,'confirmed');});
test('Amounts outside an initiative window are not counted',()=>{const p=E.demo();p.initiatives[0].budget.find(b=>b.year===2029).amount=999999;assert.equal(E.choiceCost(p,'o1').total,500000);});
test('Demo retains original values with a genuine cost anchor',()=>{const p=E.demo();assert.equal(p.criteria[3].polarity,'cost');assert.equal(E.score(p,p.options[0]).value,83);assert.equal(E.score(p,p.options[1]).value,89.25);assert.equal(E.ranking(p)[0].id,'o2');});
test('Every demo choice has assumptions and risks',()=>{const p=E.demo();assert.equal(p.options.length,4);assert.ok(p.options.every(o=>E.text(o.assumptions)&&E.text(o.risks)));});
test('The demo exposes a blocked decision without discounting value',()=>{const p=E.demo(),before=E.ranking(p);assert.ok(E.check(p).some(x=>x.entity==='e3'&&x.level==='blocking'));p.enablers.find(e=>e.id==='e3').status='ready';assert.deepEqual(E.ranking(p),before);});
test('The demo contains a selected unmapped and uncosted choice',()=>{const p=E.demo();assert.equal(p.options.find(o=>o.id==='o4').decision,'select');assert.ok(!p.enablers.some(e=>e.optionId==='o4'));assert.equal(E.choiceCost(p,'o4').state,'no-initiatives');});
test('Demo round-trip preserves the new content',()=>{const p=E.demo();assert.deepEqual(E.validateImport(JSON.parse(JSON.stringify(p))),p);});
const report={suite:'model-hardening',tests:results.length,passed:results.filter(x=>x.pass).length,results};
fs.mkdirSync('qa',{recursive:true});fs.writeFileSync('qa/model-hardening-results.json',JSON.stringify(report,null,2));
console.log(JSON.stringify({...report,results:undefined}));
if(results.some(x=>!x.pass)){console.error(results.filter(x=>!x.pass));process.exitCode=1;}
