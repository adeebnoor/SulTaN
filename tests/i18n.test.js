/* Translation completeness and interpolation parity are release requirements. */
'use strict';
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const baseEn=require('../src/locales/en.js'),baseAr=require('../src/locales/ar.js');
const dictionaries={en:{...baseEn},ar:{...baseAr}},context={globalThis:{SultanLocales:dictionaries}};vm.createContext(context);
for(const file of fs.readdirSync(path.join(__dirname,'../src/locales')).filter(x=>x.endsWith('.js')&&!['en.js','ar.js'].includes(x)).sort())vm.runInContext(fs.readFileSync(path.join(__dirname,'../src/locales',file),'utf8'),context,{filename:file});
const en=context.globalThis.SultanLocales.en,ar=context.globalThis.SultanLocales.ar;assert.deepEqual(Object.keys(en).sort(),Object.keys(ar).sort());
for(const key of Object.keys(en)){assert.equal(typeof en[key],'string');assert.equal(typeof ar[key],'string');const vars=s=>[...s.matchAll(/%\{\d+\}/g)].map(x=>x[0]).sort();assert.deepEqual(vars(en[key]),vars(ar[key]),'Placeholder mismatch: '+key);}
console.log(JSON.stringify({translationKeys:Object.keys(en).length,localeFiles:fs.readdirSync(path.join(__dirname,'../src/locales')).filter(x=>x.endsWith('.js')).length,parity:'pass'}));
