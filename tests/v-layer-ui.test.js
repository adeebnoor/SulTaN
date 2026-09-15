/* Public surfacing and numerical-chart regression guards. */
'use strict';
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const base=path.resolve(__dirname,'..'),read=f=>fs.readFileSync(path.join(base,f),'utf8');
const ui=read('src/review-visuals.js'),app=read('src/app.js'),vision=read('src/locales/vision.js');
for(const id of ['methodology','outputs','privacy-limits','about-sultan'])assert.ok(ui.includes(id));
for(const label of ['المنهجية','المخرجات','الخصوصية والحدود','من نحن','Authority space','Break-even point'])assert.ok(vision.includes(label));
assert.ok(ui.includes('<svg class="v-svg"')||ui.includes('<svg class="v-svg '));
assert.ok(!ui.includes('<canvas')&&!ui.includes('<foreignObject'));
assert.ok(ui.includes('vision-programs')&&vision.includes('vision2030.gov.sa/ar/explore/programs'));
assert.ok(vision.includes('SULTAN is not affiliated')&&vision.includes('سلطان غير مرتبط'));
assert.ok(ui.includes('annual-details')&&ui.includes('details.open=first')&&ui.includes('annualState'));
assert.ok(ui.includes('is-pristine')&&ui.includes('pristine-note'));
assert.ok(app.includes('SECTORS()')&&app.includes('UNITS()')&&app.includes('FREQS()'));
const extract=(src,name)=>{const start=src.indexOf('function '+name+'('),end=src.indexOf('\nfunction ',start+1);return src.slice(start,end);};
assert.equal(extract(ui,'trackSvg'),extract(read('src/final-ui.js'),'trackSvg'),'trajectory renderer must stay byte-for-byte identical');
// No timers or DOM rendering run in the numerical unit tests.
global.document={addEventListener(){}};global.location={hash:'#home'};global.addEventListener=()=>{};global.setTimeout=()=>0;
global.SultanLocales={en:require('../src/locales/en.js'),ar:require('../src/locales/ar.js')};
for(const file of ['authority-space','execution-upgrades','demo','final','vision'])require('../src/locales/'+file+'.js');
global.SultanI18n=require('../src/i18n.js');
require('../src/break-even-analytic.js');global.Sultan=require('../src/import.js');require('../src/final-core.js');require('../src/authority-space.js');require('../src/review-visuals.js');
const E=global.Sultan,V=global.SultanEvidence,p=E.demo(),before=JSON.stringify(p),d=V.breakEvenData(p);
assert.ok(d);assert.ok(Math.abs(d.threshold-47.69230769230773)<1e-7);assert.equal(d.current,15);assert.equal(JSON.stringify(p),before,'rendering must not mutate project');
for(const criterion of p.criteria){const data=V.breakEvenData(p,criterion.id);assert.ok(data);const others=p.criteria.filter(c=>c.id!==criterion.id),sum=others.reduce((a,c)=>a+c.weight,0);for(const w of [0,7,25,47.69230769230773,80,100]){const weights=Object.fromEntries(p.criteria.map(c=>[c.id,c.id===criterion.id?w:c.weight/sum*(100-w)]));for(const series of data.series){const option=p.options.find(o=>o.id===series.id),expected=E.score(p,option,weights).value,value=series.points[0].value+(series.points[1].value-series.points[0].value)*w/100;assert.ok(Math.abs(expected-value)<1e-7);}}}
const flat=E.clone(p);flat.criteria.forEach(c=>c.polarity='benefit');flat.options.filter(o=>o.type!=='requirement').forEach((o,i)=>flat.criteria.forEach(c=>o.scores[c.id].value=90-10*i));assert.equal(V.breakEvenData(flat).crossing,null);assert.ok(!V.breakEvenVisual(flat).includes('class="v-crossing"'),'null threshold must not generate fake crossing');
const unknown=E.clone(p);unknown.options[0].scores.identity.value=null;assert.equal(V.breakEvenData(unknown),null);
const noEns=E.clone(p);noEns.enablers=[];const a=V.authorityVisual(noEns);assert.ok(a.includes('unknown, not zero'));assert.ok(!a.includes('>0%</dd>'));
const blank=E.blank();blank.revision=1;assert.equal(V.isPristine(blank),true,'new-project touch must not disable onboarding');blank.institution.name='Working institution';assert.equal(V.isPristine(blank),false);
for(const k of Object.keys(SultanLocales.en).filter(k=>k.startsWith('v')&&k!=='versionLabel')){assert.equal(typeof SultanLocales.ar[k],'string','Arabic counterpart: '+k);assert.equal(typeof SultanLocales.en[k],'string');}
assert.equal(SultanVision.programs.length,11);assert.equal(SultanVision.completed.length,2);assert.ok(SultanI18n.t('visionListDisclaimer',[SultanVision.verifiedOn]).includes('2026-09-15'));
console.log(JSON.stringify({suite:'v-layer-ui',passed:true,nav:4,evidenceViews:5,inlineSvg:true,engineCoordinateChecks:96,unknowns:true,progressiveDisclosure:true}));
