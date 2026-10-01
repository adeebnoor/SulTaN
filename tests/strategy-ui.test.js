/* DOM-independent view-contract checks; these do not replace real-browser acceptance. */
'use strict';
const assert=require('node:assert/strict');
global.SultanLocales={en:require('../src/locales/en.js'),ar:require('../src/locales/ar.js')};
for(const f of ['final','guided','field-guide','lens','strategy'])require('../src/locales/'+f+'.js');
global.SultanI18n=require('../src/i18n.js');global.Sultan=require('../src/import.js');
for(const f of ['final-core','context-core','sector-library','draft-engine','expert-lens','strategy-core'])require('../src/'+f+'.js');
const E=Sultan,S=SultanStrategy;let lang='en',p=E.demo();const listeners={};
global.SultanI18n={get language(){return lang;},get locale(){return lang==='ar'?'ar-SA':'en-US';},t(k,vars=[]){const s=SultanLocales[lang][k];assert.equal(typeof s,'string','missing translation '+lang+'/'+k);return s.replace(/%\{(\d+)\}/g,(_,i)=>vars[+i]??'');}};
global.SultanApp={getProject:()=>E.clone(p),setProject:q=>{p=E.validateImport(q);},navigate(){},getReport:()=>'<article class="report"></article>'};
global.document={addEventListener(name,fn){(listeners[name]??=[]).push(fn);},getElementById(id){return id.startsWith('sw-tab-')?{focus(){}}:null;},querySelectorAll(){return [];}};
global.location={hash:'#home'};global.sessionStorage={getItem(){return null;},setItem(){}};
require('../src/strategy-ui.js');
function stage(key){for(const fn of listeners.click)fn({target:{closest(selector){return selector==='[data-sw-tab]'?{dataset:{swTab:key}}:null;}}});return SultanStudio.view();}
let count=0;
for(const language of ['ar','en']){lang=language;
 for(const key of ['diagnosis','opportunities','delivery','operating','execution','review']){const h=stage(key);assert.ok(h.includes('id="sw-panel"'));assert.ok(h.includes('aria-selected="true"'));assert.ok(!h.includes('undefined'));count++;}
 p.strategy.opportunities[0].route='acquire';let h=stage('delivery');assert.ok(h.includes('strategy.opportunities.0.dueDiligence'));assert.ok(!h.includes('data-path="strategy.opportunities.0.partnerIncentive"'));count++;
 p.strategy.opportunities[0].valueModel='public';h=stage('opportunities');assert.ok(!h.includes('data-path="strategy.opportunities.0.annualContract"'));count++;
 p.strategy.operating.mode='reuse';h=stage('operating');assert.ok(!h.includes('data-path="strategy.operating.targetModel"'));count++;
 const c=p.strategy.charters[0];c.activities=[S.activity()];c.costs=[S.cost(2027)];c.risks=[S.risk()];h=stage('execution');assert.ok(h.includes('strategy.charters.0.activities.0.acceptance'));assert.ok(h.includes('strategy.charters.0.costs.0.unitCost'));assert.ok(h.includes('strategy.charters.0.risks.0.trigger'));count++;
 assert.ok(SultanApp.getReport().includes('data-report-section="strategy-workbench"'));count++;
}
console.log(JSON.stringify({suite:'strategy-ui-view-contract',tests:count,passed:count,realBrowser:false}));
