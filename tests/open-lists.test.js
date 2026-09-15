/* Open suggestion lists and bundled Vision 2030 reference data. */
'use strict';
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const root=path.resolve(__dirname,'..'),read=f=>fs.readFileSync(path.join(root,f),'utf8');
const app=read('src/app.js'),index=read('index.html');
assert.ok(/if\(Array\.isArray\(options\)\)/.test(app));assert.ok(app.indexOf('Array.isArray(options)')<app.indexOf('else if(options)input=`<select'));assert.ok(/<datalist id=/.test(app));
for(const guarded of ['whyUs','tradeoff','decisionReason','outcome','foothold','adaptation','notDoing']) assert.ok(!new RegExp("\\['"+guarded+"',T\\('s\\d+'\\),'text','',").test(app));
assert.ok(index.includes('src/locales/vision.js'));const ctx={globalThis:{SultanLocales:{en:{},ar:{}}}};vm.createContext(ctx);vm.runInContext(read('src/locales/vision.js'),ctx);const V=ctx.globalThis.SultanVision;
assert.equal(V.programs.length,11);assert.ok(/^\d{4}-\d{2}-\d{2}$/.test(V.verifiedOn));assert.equal(new Set(V.programs.map(x=>x.id)).size,11);assert.equal(V.active.length,9);assert.equal(V.completed.length,2);assert.ok(V.completed.some(x=>x.id==='priv')&&V.completed.some(x=>x.id==='fsp'));for(const x of V.programs)assert.ok(['active','completed'].includes(x.status));assert.equal(V.titles('ar').length,11);assert.equal(V.titles('en').length,11);assert.ok(/غير مرتبط/.test(ctx.globalThis.SultanLocales.ar.visionListDisclaimer));assert.ok(/not affiliated/i.test(ctx.globalThis.SultanLocales.en.visionListDisclaimer));
console.log(JSON.stringify({suite:'open-lists',passed:true,programs:11,activePrograms:9,completedPrograms:2,verifiedOn:V.verifiedOn}));
