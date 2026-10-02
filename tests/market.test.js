'use strict';
const assert=require('node:assert/strict');
global.SultanLocales={en:require('../src/locales/en.js'),ar:require('../src/locales/ar.js')};
for(const f of ['final','guided','field-guide','market'])require('../src/locales/'+f+'.js');
global.SultanI18n=require('../src/i18n.js');global.Sultan=require('../src/import.js');
for(const f of ['final-core','context-core','market','sector-library','international-library','draft-engine','ai'])require('../src/'+f+'.js');
const E=Sultan,M=SultanMarket,L=SultanLibrary,D=SultanDraft,copy=x=>JSON.parse(JSON.stringify(x));
const old=E.demo();delete old.context.market;delete old.context.country;delete old.context.currency;
const legacy=E.validateImport(old);assert.equal(legacy.context.market,'sa');assert.equal(legacy.context.currency,'SAR');
M.setPreferred('global');assert.equal(E.blank().context.market,'global');assert.equal(E.blank().context.currency,'');assert.equal(E.validateImport(copy(legacy)).context.market,'sa');
let count=4;
for(const sector of L.sectors){
 const p=D.build({market:'global',country:'Kenya',currency:'KES',sectorId:sector.id,typeId:sector.types[0].id,institution:{name:'Test',vision:'V',beneficiaries:'B',startYear:2027,endYear:2030},goals:[{goalId:'verified-outcome',baseline:10,target:30,owner:'Owner'}]});
 assert.equal(p.options.length,1);assert.equal(p.references.length,0);assert.equal(p.mandates.length,0);assert.equal(p.context.sources.length,0);
 assert.equal(p.context.currency,'KES');assert.equal(p.transitions[0].baseline,10);assert.equal(p.transitions[0].annual.at(-1).target,30);
 assert.ok(p.initiatives.length>0&&p.initiatives.every(i=>i.budget.every(b=>b.amount===null)));
 assert.deepEqual(E.validateImport(copy(p)),p);assert.ok(D.digest(p).includes('country: Kenya; currency: KES'));
 const block=SultanAI.groundingBlock(p);assert.ok(block.includes('not verified regulations'));assert.ok(!block.includes('vision2030.gov.sa'));count+=10;
}
const bad=copy(legacy);bad.context.market='invented';assert.throws(()=>E.validateImport(bad));bad.context.market='global';bad.context.currency='US';assert.throws(()=>E.validateImport(bad));count+=2;
const p=D.build({market:'global',sectorId:'edu',goals:[{goalId:'verified-outcome'}]});assert.equal(p.transitions[0].baseline,null);assert.equal(p.transitions[0].target,null);assert.equal(p.context.country,'');assert.equal(p.context.currency,'');count+=4;
assert.ok(!SultanAI.methodSystem().includes('Saudi context'));assert.ok(SultanAI.methodSystem().includes('Do not infer jurisdiction from language'));count+=2;
console.log(JSON.stringify({suite:'international-market',tests:count,passed:count}));
