/* Translation completeness and interpolation parity are release requirements. */
'use strict';
const assert=require('node:assert/strict');
const en=require('../src/locales/en.js'),ar=require('../src/locales/ar.js');
assert.deepEqual(Object.keys(en).sort(),Object.keys(ar).sort());
for(const key of Object.keys(en)){
 assert.equal(typeof en[key],'string');assert.equal(typeof ar[key],'string');
 const vars=s=>[...s.matchAll(/%\{\d+\}/g)].map(x=>x[0]).sort();
 assert.deepEqual(vars(en[key]),vars(ar[key]),'Placeholder mismatch: '+key);
}
console.log(JSON.stringify({translationKeys:Object.keys(en).length,parity:'pass'}));
