/* Brand-palette regression guard: public surfaces stay navy/gold/neutral. */
'use strict';
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const root=path.resolve(__dirname,'..'),read=f=>fs.readFileSync(path.join(root,f),'utf8');
const css=read('src/palette-unify.css'),home=read('src/home-value.css'),index=read('index.html');
for(const token of ['--brand-navy','--brand-gold','--sultan-neutral-200','.preview-window','.quick-section','.hv-contrast','.v-authority-grid .v-cell.known-ready']) assert.ok(css.includes(token),token);
for(const legacy of ['#12363b','#116753','#235b51','#315c59','#abc998','#668a82','#386061','#83a198','#668071','#637e6c','#527a66','#edf4e9','#d0e0c7','#54765f','#4f7961','#658957','#58705e','#e9f2e5','#336340','#367861','#597565','#5e766d','#5a7269','#829987','#edf3e9','#357353','#5b7166','#eef4ef','#b6cbbb','#738759','#547163','#607969','#f4f7f2','#637869']) assert.ok(!home.toLowerCase().includes(legacy),`home-value has no legacy green: ${legacy}`);
assert.ok(index.includes('src/home-value.css')&&index.includes('src/palette-unify.css'),'both public palette layers are declared in source index');
assert.ok(index.indexOf('src/home-value.css')<index.indexOf('src/palette-unify.css'),'palette-unify loads after home-value');
console.log(JSON.stringify({suite:'palette-unify',passed:true,palette:'navy-gold-neutral'}));
