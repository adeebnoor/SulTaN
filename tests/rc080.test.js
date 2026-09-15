'use strict';
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const root=path.resolve(__dirname,'..');
const ui=fs.readFileSync(path.join(root,'src/final-ui.js'),'utf8');
const index=fs.readFileSync(path.join(root,'index.html'),'utf8');
const build=fs.readFileSync(path.join(root,'build.py'),'utf8');
assert.ok(build.includes("VERSION = '0.8.0-rc'"),'RC version must come from build.py');
assert.ok(fs.existsSync(path.join(root,'src/locales/final.js')),'final locale must live under src/locales');
assert.ok(!fs.existsSync(path.join(root,'src/final-locales.js')),'legacy out-of-tree locale must be removed');
assert.ok(index.includes('src/locales/final.js'),'browser must load tested final locale');
assert.ok(!/foreignObject|toDataURL|pageImages\(|pdfBlob\(/.test(ui),'PDF export must not use canvas/foreignObject');
assert.ok(ui.includes("window.open('','_blank')")&&ui.includes('w.print()'),'PDF export must use browser print route');
assert.ok(ui.includes("T('clientDeliverables')")&&ui.includes("T('decisionExtensions')"),'client headings must be localized');
assert.ok(ui.includes('circle.baseline-dot')||ui.includes('baseline-dot'),'trajectory markers must be present');
assert.ok(ui.includes("T('gatedFundingTitle')")&&ui.includes("T('riskSource')")&&ui.includes("T('maturityFamily')"),'client report must surface gated funding, risk source and maturity family');
/* 28 is intentional: six public home/methodology/audit/rev3 scripts now live in index.html so source and built app share one visible load graph. */
const scripts=(index.match(/<script src=/g)||[]).length;assert.ok(scripts<=28,'source load graph should remain explicit and consolidated');
for(const removed of ['final-core-patch.js','final-export-hook.js','final-report-patch.js','final-polish.js','final-dashboard-polish.js','version-patch.js'])assert.ok(!index.includes(removed),'obsolete patch loaded: '+removed);
console.log(JSON.stringify({suite:'rc080',passed:true,scripts}));
