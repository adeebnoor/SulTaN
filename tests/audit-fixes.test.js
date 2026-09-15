'use strict';
const assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const root=path.resolve(__dirname,'..'),read=f=>fs.readFileSync(path.join(root,f),'utf8');
const source=read('src/audit-fixes.js'),css=read('src/audit-fixes.css'),brand=read('src/brand.css'),index=read('index.html'),review=read('src/review-visuals.js');

/* Reproduce the exact metadata-only cache collision found during import review, then
   prove the post-integration shield makes content part of the effective cache key. */
let key='',cached=[],rawCalls=0;
const raw=p=>{rawCalls++;return [{message:p.marker||''}];};
const buggyCheck=p=>{const k=[p?.revision,p?.updatedAt,p?.options?.length,p?.transitions?.length,p?.initiatives?.length].join('|');if(k===key)return cached.slice();key=k;cached=raw(p);return cached.slice();};
const fakeDemo=()=>({institution:{liabilities:'generic'},options:[
 {type:'differentiation',owner:'Team',assumptions:[{owner:'Choice owner'}]},
 {type:'moonshot',owner:'Team',assumptions:[{owner:'Choice owner'}]},
 {type:'divest',owner:'Team',assumptions:[{owner:'Choice owner'}]},
 {type:'requirement',owner:'Team',assumptions:[{owner:'Choice owner'}]}
]});
const ctx={globalThis:{Sultan:{check:buggyCheck,demo:fakeDemo,semanticIssues:()=>[{rule:'S1',level:'hint'},{rule:'S5',level:'hint'}]},SultanI18n:{language:'en'}}};
vm.createContext(ctx);vm.runInContext(source,ctx);
const E=ctx.globalThis.Sultan;
const common={revision:9,updatedAt:'2026-09-15T00:00:00Z',options:[],transitions:[],initiatives:[]};
assert.equal(E.check({...common,marker:'project A'})[0].message,'project A');
assert.equal(E.check({...common,marker:'project B'})[0].message,'project B','same edit metadata must not return another project\'s check result');
assert.ok(rawCalls>=2,'content collision must force a fresh consistency pass');
const demo=E.demo();
assert.match(demo.institution.liabilities,/Two operating commitments/);
assert.ok(demo.options.every(o=>(o.assumptions||[]).every(a=>a.owner&&a.owner!=='Choice owner')),'demo assumptions need accountable role owners');
assert.deepEqual(E.semanticIssues({}).map(x=>x.rule),['R1','R5']);
assert.ok(E.semanticIssues({}).every(x=>x.level==='hint'),'semantic rules remain advisory, outside check()');

/* WCAG contrast guard for the legacy CTA during pre-enhancement/partial rendering. */
const navy=(brand.match(/--brand-navy:#([0-9a-f]{6})/i)||[])[1];assert.ok(navy,'brand navy token');
const rgb=h=>[0,2,4].map(i=>parseInt(h.slice(i,i+2),16));
const lum=h=>{const c=rgb(h).map(v=>{v/=255;return v<=.04045?v/12.92:Math.pow((v+.055)/1.055,2.4);});return .2126*c[0]+.7152*c[1]+.0722*c[2];};
const ratio=(a,b)=>{const x=lum(a),y=lum(b);return (Math.max(x,y)+.05)/(Math.min(x,y)+.05);};
assert.ok(css.includes('#publicStart')&&css.includes('color:#fff'),'legacy CTA must have an explicit readable fallback');
assert.ok(ratio(navy,'ffffff')>=4.5,'legacy CTA text/background contrast must meet WCAG AA');
assert.ok(review.includes("['publicMethod','publicStart']")&&review.includes("classList.add('v-legacy-action')"),'duplicate header CTA remains hidden after enhancement');
assert.ok(index.includes('src/audit-fixes.css')&&index.includes('src/audit-fixes.js'),'canonical source index must ship audit fixes');
console.log(JSON.stringify({suite:'audit-fixes',passed:true,cacheCollision:'fixed',contrast:Number(ratio(navy,'ffffff').toFixed(2)),semanticRules:'R1-R5'}));
