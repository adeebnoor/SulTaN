/* First-glance homepage value and privacy regression guards. */
'use strict';
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const root=path.resolve(__dirname,'..'),read=f=>fs.readFileSync(path.join(root,f),'utf8');
const js=read('src/home-value.js'),css=read('src/home-value.css'),build=read('build.py'),locale=read('src/locales/home-value.js');
for(const token of ['hv-snapshot','hv-questions','hv-value-section','hv-contrast','hv-pillar-grid']) assert.ok(js.includes(token)||css.includes(token),token);
for(const engineCall of ['E.ranking','E.breakEven','E.authoritySpaceForOption']) assert.ok(js.includes(engineCall),engineCall);
for(const label of ['Why this choice?','When could it change?','Can it actually execute?','What is still unknown?','لماذا هذا الاختيار؟','متى قد يتغير؟','هل يمكن تنفيذه فعلًا؟','ما الذي ما زال مجهولًا؟']) assert.ok(locale.includes(label),label);
assert.ok(js.includes('<svg')&&!js.includes('<canvas')&&!js.includes('<foreignObject'));
assert.ok(!/\b(fetch|XMLHttpRequest|sendBeacon)\s*\(/.test(js),'homepage value layer must not transmit project data');
assert.ok(build.includes("src/home-value.css")&&build.includes("src/locales/home-value.js")&&build.includes("src/home-value.js"),'standalone build must ship homepage value layer');
assert.ok(build.includes('Decision Accountability for Strategy'),'public metadata must state the product category');
const ctx={globalThis:{SultanLocales:{en:{},ar:{}}}};vm.createContext(ctx);vm.runInContext(locale,ctx);
const en=ctx.globalThis.SultanLocales.en,ar=ctx.globalThis.SultanLocales.ar;
for(const key of Object.keys(en)){assert.equal(typeof ar[key],'string','Arabic counterpart: '+key);assert.ok(en[key].trim()&&ar[key].trim(),key);}
assert.ok(Object.keys(en).length>=40);
console.log(JSON.stringify({suite:'home-value',passed:true,keys:Object.keys(en).length,svg:true,network:false}));
