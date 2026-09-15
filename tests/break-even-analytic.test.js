'use strict';
const assert=require('node:assert/strict'),fs=require('node:fs');
const {performance}=require('node:perf_hooks');
const E=require('../src/break-even-analytic.js');
const results=[],metrics={scanSwitches:0,exactSwitches:0,exactOnlySwitches:0,maxGridGap:0};
function test(name,fn){try{fn();results.push({name,pass:true});}catch(e){results.push({name,pass:false,error:e.stack||e.message});}}
const near=(a,b,t=1e-8)=>assert(Math.abs(a-b)<=t,`${a} != ${b}`);
function option(id,title,scores){return {id,title,type:'differentiation',scores:Object.fromEntries(Object.entries(scores).map(([k,v])=>[k,{value:v,note:'test'}]))};}
function twoWay(cost=false){const p=E.blank();p.criteria=[{id:'x',name:'X',weight:40,low:'0',high:'100',polarity:'benefit'},{id:'y',name:'Y',weight:60,low:'0',high:'100',polarity:cost?'cost':'benefit'}];p.options=cost?[option('a','A',{x:100,y:100}),option('b','B',{x:0,y:0})]:[option('a','A',{x:100,y:0}),option('b','B',{x:0,y:100})];return p;}

test('Exact two-line switch is 50%',()=>{const p=twoWay(false),r=E.breakEvenAnalytic(p);near(r.find(x=>x.criterionId==='x').threshold,50);near(r.find(x=>x.criterionId==='y').threshold,50);assert.equal(r.find(x=>x.criterionId==='x').newTop,'A');});
test('Production breakEven points to the analytical solver',()=>{const p=twoWay(false);assert.deepEqual(E.breakEven(p),E.breakEvenAnalytic(p));assert.equal(typeof E.breakEvenScan,'function');});
test('Cost polarity is included in the exact line',()=>{const p=twoWay(true),r=E.breakEvenAnalytic(p);near(r.find(x=>x.criterionId==='x').threshold,50);near(r.find(x=>x.criterionId==='y').threshold,50);});
test('Dominating option has no switch inside the open interval',()=>{const p=E.blank();p.criteria=[{id:'x',name:'X',weight:50,low:'0',high:'100',polarity:'benefit'},{id:'y',name:'Y',weight:50,low:'0',high:'100',polarity:'benefit'}];p.options=[option('a','A',{x:90,y:90}),option('b','B',{x:20,y:30})];assert(E.breakEvenAnalytic(p).every(x=>x.threshold===null));});
test('A boundary tie at 0% is not reported as an internal switch',()=>{const p=E.blank();p.criteria=[{id:'x',name:'X',weight:50,low:'0',high:'100',polarity:'benefit'},{id:'y',name:'Y',weight:50,low:'0',high:'100',polarity:'benefit'}];p.options=[option('a','A',{x:100,y:50}),option('b','B',{x:0,y:50})];assert.equal(E.breakEvenAnalytic(p).find(x=>x.criterionId==='x').threshold,null);});
test('Degenerate current 0/100 weights safely fall back to the established scan',()=>{const p=twoWay(false);p.criteria[0].weight=0;p.criteria[1].weight=100;assert.deepEqual(E.breakEvenAnalytic(p),E.breakEvenScan(p));});
test('Current leader tie safely falls back to the established scan',()=>{const p=twoWay(false);p.criteria[0].weight=50;p.criteria[1].weight=50;assert.deepEqual(E.breakEvenAnalytic(p),E.breakEvenScan(p));});

let seed=9173;const rnd=()=>((seed=(Math.imul(seed,1664525)+1013904223)>>>0)/4294967296);
function randomProject(optionCount,criterionCount,missingRate=0){
 const p=E.blank(),raw=Array.from({length:criterionCount},()=>1+rnd()*9),sum=raw.reduce((a,b)=>a+b,0);let used=0;
 p.criteria=raw.map((x,i)=>{let w=i===criterionCount-1?100-used:Math.round(x/sum*1e8)/1e6;used+=w;return {id:'c'+i,name:'Criterion '+i,weight:w,low:'low',high:'high',polarity:rnd()<.3?'cost':'benefit'};});
 p.criteria[p.criteria.length-1].weight+=100-p.criteria.reduce((a,c)=>a+c.weight,0);
 p.options=Array.from({length:optionCount},(_,i)=>option('o'+i,'Option '+i,Object.fromEntries(p.criteria.map(c=>[c.id,(i>=2&&rnd()<missingRate)?null:Math.round(rnd()*10000)/100]))));
 return p;
}
function compareScan(p,label){const scan=E.breakEvenScan(p),exact=E.breakEvenAnalytic(p);assert.equal(exact.length,scan.length);for(let i=0;i<scan.length;i++){if(scan[i].threshold!==null){metrics.scanSwitches++;assert.notEqual(exact[i].threshold,null,`missing exact switch ${label}/${i}`);assert(exact[i].distance<=scan[i].distance+.500001,`exact switch farther than grid ${label}/${i}: ${exact[i].distance} > ${scan[i].distance}`);metrics.maxGridGap=Math.max(metrics.maxGridGap,Math.abs(exact[i].threshold-scan[i].threshold));}if(exact[i].threshold!==null){metrics.exactSwitches++;assert(exact[i].threshold>0&&exact[i].threshold<100);if(scan[i].threshold===null)metrics.exactOnlySwitches++;}}}
test('Random complete projects never miss a switch found by the 0.5% scan',()=>{for(let n=0;n<250;n++)compareScan(randomProject(2+Math.floor(rnd()*9),2+Math.floor(rnd()*5)),`complete ${n}`);});
test('Random incomplete alternatives preserve scan eligibility semantics',()=>{for(let n=0;n<150;n++)compareScan(randomProject(4+Math.floor(rnd()*8),2+Math.floor(rnd()*5),.22),`incomplete ${n}`);});
test('Every exact threshold lies on the current leader upper envelope',()=>{for(let n=0;n<120;n++){const p=randomProject(3+Math.floor(rnd()*7),2+Math.floor(rnd()*5)),base=E.ranking(p),baseTop=base[0]?.id,rows=E.breakEvenAnalytic(p);for(const row of rows){if(row.threshold===null||row.distance===0)continue;const r=E.rankingAt(p,row.criterionId,row.threshold);assert(r.length>=2);assert(r.slice(0,3).some(x=>x.id===baseTop),`base leader absent at exact crossing ${n}/${row.criterionId}`);assert(Math.abs(r[0].value-r[1].value)<1e-5,`no top tie at crossing ${n}/${row.criterionId}`);}}});

function benchProject(){return randomProject(20,12);}
test('Analytical solver is materially faster on a 20×12 complete project',()=>{const p=benchProject();E.breakEvenScan(p);E.breakEvenAnalytic(p);let t=performance.now();for(let i=0;i<4;i++)E.breakEvenScan(p);const scanMs=performance.now()-t;t=performance.now();for(let i=0;i<20;i++)E.breakEvenAnalytic(p);const exactMs=(performance.now()-t)/5;results.push({name:'benchmark 20x12',pass:true,scanMs:+scanMs.toFixed(3),analyticEquivalent4CallsMs:+exactMs.toFixed(3),speedup:+(scanMs/exactMs).toFixed(1)});assert(exactMs<scanMs,`analytic ${exactMs}ms was not faster than scan ${scanMs}ms`);});

const functional=results.filter(x=>x.name!=='benchmark 20x12'),summary={suite:'break-even-analytic',tests:functional.length,passed:functional.filter(x=>x.pass).length,failed:functional.filter(x=>!x.pass).length,metrics,results};
fs.mkdirSync('qa',{recursive:true});fs.writeFileSync('qa/break-even-analytic-results.json',JSON.stringify(summary,null,2));
console.log(JSON.stringify({suite:summary.suite,tests:summary.tests,passed:summary.passed,failed:summary.failed,metrics,benchmark:results.find(x=>x.name==='benchmark 20x12')}));if(summary.failed)process.exitCode=1;
