/* Public V-layer regression guards. */
'use strict';
const assert=require('node:assert/strict'),fs=require('node:fs');
const ui=fs.readFileSync('src/review-visuals.js','utf8');
const app=fs.readFileSync('src/app.js','utf8');
const vision=fs.readFileSync('src/locales/vision.js','utf8');
for(const id of ['methodology','outputs','privacy-limits','about-sultan'])assert.ok(ui.includes(id),'missing public surface: '+id);
for(const label of ['المنهجية','المخرجات','الخصوصية والحدود','من نحن'])assert.ok(ui.includes(label),'missing Arabic navigation label: '+label);
assert.ok(ui.includes('<svg class="v-svg"'),'V-layer must render inline SVG evidence views');
assert.ok(!ui.includes('<canvas'),'V-layer must not use canvas');
assert.ok(!ui.includes('<foreignObject'),'V-layer must not use foreignObject');
assert.ok(ui.includes('Authority space')&&ui.includes('Break-even point'),'both decision evidence views must exist');
assert.ok(ui.includes('vision-programs')&&vision.includes('vision2030.gov.sa/ar/explore/programs'),'Vision reference must point to official source');
assert.ok(ui.includes('SULTAN is not affiliated')&&ui.includes('سلطان غير مرتبط'),'affiliation disclaimer must be bilingual');
assert.ok(ui.includes('annual-details')&&ui.includes('details.open=first'),'annual rows must use progressive disclosure with one open by default');
assert.ok(ui.includes('is-pristine')&&ui.includes('pristine-note'),'blank-project onboarding must avoid a red-wall first impression');
assert.ok(app.includes('SECTORS()')&&app.includes('UNITS()')&&app.includes('FREQS()'),'open suggestion list wiring must remain present');
console.log(JSON.stringify({suite:'v-layer-ui',passed:true,nav:4,svg:2,vision:true,progressiveDisclosure:true}));
