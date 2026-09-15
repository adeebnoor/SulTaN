/* Translation completeness and interpolation parity are release requirements. */
'use strict';
const assert=require('node:assert/strict');
const path=require('node:path');
const fs=require('node:fs');
const en=require('../src/locales/en.js'),ar=require('../src/locales/ar.js');
globalThis.SultanLocales={en:{...en},ar:{...ar}};
for(const name of fs.readdirSync(path.join(__dirname,'../src/locales')).filter(x=>x.endsWith('.js')&&!['en.js','ar.js'].includes(x)).sort())require('../src/locales/'+name);
const allEn=globalThis.SultanLocales.en,allAr=globalThis.SultanLocales.ar;
assert.deepEqual(Object.keys(allEn).sort(),Object.keys(allAr).sort());
const vars=s=>[...s.matchAll(/%\{\d+\}/g)].map(x=>x[0]).sort();
for(const key of Object.keys(allEn)){
 assert.equal(typeof allEn[key],'string','English locale must be a string: '+key);
 assert.equal(typeof allAr[key],'string','Arabic locale must be a string: '+key);
 assert.deepEqual(vars(allEn[key]),vars(allAr[key]),'Placeholder mismatch: '+key);
 assert.ok(allEn[key].trim().length>0,'Empty English locale: '+key);
 assert.ok(allAr[key].trim().length>0,'Empty Arabic locale: '+key);
}
console.log(JSON.stringify({translationKeys:Object.keys(allEn).length,catalogs:fs.readdirSync(path.join(__dirname,'../src/locales')).filter(x=>x.endsWith('.js')).length,parity:'pass'}));
