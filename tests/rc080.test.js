/* 0.8.0-rc release gates: locale placement, PDF route and trajectory implementation. */
'use strict';
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const ui=fs.readFileSync(path.join(__dirname,'../src/final-ui.js'),'utf8');
const idx=fs.readFileSync(path.join(__dirname,'../index.html'),'utf8');
const build=fs.readFileSync(path.join(__dirname,'../build.py'),'utf8');
assert.match(idx,/src\/locales\/final\.js/);assert.doesNotMatch(idx,/src\/final-locales\.js/);
assert.match(build,/VERSION = '0\.8\.0-rc'/);
assert.doesNotMatch(ui,/toDataURL|foreignObject|pdfBlob\(|pageImages\(/,'canvas PDF path must be removed');
assert.match(ui,/window\.open\('','_blank'\)/);assert.match(ui,/\.print\(\)/);
assert.match(ui,/clientDeliverables/);assert.match(ui,/decisionExtensions/);
assert.match(ui,/class="target-point"/);assert.match(ui,/class="actual-point"/);assert.match(ui,/qualitative-track/);assert.match(ui,/observed/);
assert.match(ui,/candidateDoc\(/);assert.match(ui,/finalizeDoc\(/);
console.log(JSON.stringify({suite:'rc080',passed:true}));
