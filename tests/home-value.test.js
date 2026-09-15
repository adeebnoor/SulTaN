/* First-glance homepage value and privacy regression guards. */
'use strict';
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const root=path.resolve(__dirname,'..'),read=f=>fs.readFileSync(path.join(root,f),'utf8');
const js=read('src/home-value.js'),css=read('src/home-value.css'),index=read('index.html'),locale=read('src/locales/home-value.js');
for(const token of ['hv-snapshot','hv-questions','hv-value-section','hv-contrast','hv-pillar-grid']) assert.ok(js.includes(token)||css.includes(token),token);
for(const engineCall of ['E.ranking','E.breakEven','E.authoritySpaceForOption']) assert.ok(js.includes(engineCall),engineCall);
for(const label of ['Why this choice?','When could it change?','Can it actually execute?','What is still unknown?','لماذا هذا الاختيار؟','متى قد يتغير؟','هل يمكن تنفيذه فعلًا؟','ما الذي ما زال مجهولًا؟']) assert.ok(locale.includes(label),label);
assert.ok(js.includes('<svg')&&!js.includes('<canvas')&&!js.includes('<foreignObject'));
assert.ok(!/\b(fetch|XMLHttpRequest|sendBeacon)\s*\(/.test(js),'homepage value layer must not transmit project data');
assert.ok(index.includes("src/home-value.css")&&index.includes("src/locales/home-value.js")&&index.includes("src/home-value.js"),'canonical source index must ship homepage value layer');
assert.ok(index.includes('Decision Accountability for Strategy'),'public metadata must state the product category in source index');
for(const legacy of ['#e8f0ed','#6d8d85','#547f69','#15383d','#5c706e','#173c44','#60736e','#566c68','#e6ebe7','#7d9d8a','#1c6658','#c7d8cd','#0f3038','#c7d8d3','#42646a','#d5e2de','#e2ece8','#96aaa4']) assert.ok(!css.toLowerCase().includes(legacy),`legacy green/teal colour removed: ${legacy}`);
for(const token of ['var(--brand-navy)','var(--brand-navy-900)','var(--brand-gold-700)','var(--brand-gold-600)']) assert.ok(css.includes(token),`brand token used: ${token}`);
const ctx={globalThis:{SultanLocales:{en:{},ar:{}}}};vm.createContext(ctx);vm.runInContext(locale,ctx);
const en=ctx.globalThis.SultanLocales.en,ar=ctx.globalThis.SultanLocales.ar;
for(const key of Object.keys(en)){assert.equal(typeof ar[key],'string','Arabic counterpart: '+key);assert.ok(en[key].trim()&&ar[key].trim(),key);}
assert.ok(Object.keys(en).length>=40);
console.log(JSON.stringify({suite:'home-value',passed:true,keys:Object.keys(en).length,svg:true,network:false,palette:'navy-gold'}));
