/* Sector library integrity: every link resolves, every string is bilingual, education is covered in depth. */
'use strict';
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const L=require('../src/sector-library.js');
const src=fs.readFileSync(path.join(__dirname,'../src/sector-library.js'),'utf8');
assert.ok(!/\b(fetch|XMLHttpRequest|sendBeacon)\s*\(/.test(src),'library is static data; no network');
assert.match(L.verifiedOn,/^\d{4}-\d{2}-\d{2}$/);
const bilingual=(x,where)=>{assert.ok(x&&typeof x==='object'&&typeof x.ar==='string'&&typeof x.en==='string'&&x.ar.trim()&&x.en.trim(),'bilingual text missing at '+where);};
const ids=new Set(L.sectors.map(s=>s.id));assert.equal(ids.size,L.sectors.length);
for(const s of L.sectors){
 bilingual(s.name,s.id+'.name');bilingual(s.short,s.id+'.short');bilingual(s.regulator,s.id+'.regulator');
 for(const k of ['mission','beneficiaries','context','notDoing','culture'])bilingual(s.templates[k],s.id+'.templates.'+k);
 const uniq=list=>{const set=new Set(list.map(x=>x.id));assert.equal(set.size,list.length,'duplicate ids in '+s.id);};
 uniq(s.types);uniq(s.programs);uniq(s.regulations);uniq(s.indicators);uniq(s.goals);
 const regIds=new Set(s.regulations.map(r=>r.id)),progIds=new Set(s.programs.map(p=>p.id)),indIds=new Set(s.indicators.map(i=>i.id)),typeIds=new Set(s.types.map(t=>t.id));
 for(const r of s.regulations){bilingual(r.name,r.id);bilingual(r.issuer,r.id);bilingual(r.summary,r.id);bilingual(r.relevance,r.id);assert.ok(['framework','benchmark','accreditation','internal'].includes(r.kind),r.id);assert.ok(['use','adapt'].includes(r.status),r.id);assert.match(r.url,/^https:\/\//,r.id+' needs an official root URL');for(const t of r.types||[])assert.ok(typeIds.has(t),r.id+' type '+t);}
 for(const p of s.programs){bilingual(p.name,p.id);bilingual(p.issuer,p.id);bilingual(p.summary,p.id);bilingual(p.contribution,p.id);assert.match(p.url,/^https:\/\//);}
 for(const i of s.indicators){bilingual(i.name,i.id);bilingual(i.unit,i.id);bilingual(i.frequency,i.id);bilingual(i.dataSource,i.id);bilingual(i.domain,i.id);assert.ok(['up','down'].includes(i.direction),i.id);assert.ok(['national','international','internal'].includes(i.scope),i.id);for(const r of i.refs||[])assert.ok(regIds.has(r)||progIds.has(r),`${s.id}.${i.id} references unknown ${r}`);}
 for(const g of s.goals){
  bilingual(g.title,g.id);bilingual(g.outcome,g.id);bilingual(g.whyUs,g.id);bilingual(g.tradeoff,g.id);bilingual(g.risk,g.id);
  assert.ok(['requirement','differentiation','moonshot','divest'].includes(g.type),g.id);
  assert.ok(indIds.has(g.kpi),`${s.id}.${g.id} kpi ${g.kpi}`);
  for(const r of g.refs||[])assert.ok(regIds.has(r),`${s.id}.${g.id} ref ${r}`);
  for(const p of g.programs||[])assert.ok(progIds.has(p),`${s.id}.${g.id} program ${p}`);
  for(const t of g.types||[])assert.ok(typeIds.has(t),`${s.id}.${g.id} type ${t}`);
  if(g.type==='moonshot'){bilingual(g.foothold,g.id+'.foothold');bilingual(g.stopEvidence,g.id+'.stopEvidence');}
  if(g.type==='divest'){for(const k of ['stop','redeploy','evidence','impact'])bilingual(g.divest[k],g.id+'.divest.'+k);}
  const enIds=new Set((g.enablers||[]).map(e=>e.id));assert.equal(enIds.size,(g.enablers||[]).length);
  for(const e of g.enablers||[]){for(const k of ['title','owner','source','route','fallback'])bilingual(e[k],`${g.id}.${e.id}.${k}`);assert.ok(['legislation','authority','capability','culture','operating'].includes(e.kind));assert.ok(['keep','activate','amend','add','remove'].includes(e.action));assert.ok(['internal','external','shared','unknown'].includes(e.control));}
  const inIds=new Set((g.initiatives||[]).map(i=>i.id));assert.equal(inIds.size,(g.initiatives||[]).length);
  for(const i of g.initiatives||[]){for(const k of ['title','output','acceptance'])bilingual(i[k],`${g.id}.${i.id}.${k}`);assert.ok(['learn','build','deliver'].includes(i.kind));assert.ok(i.start>=0&&i.end>=i.start);for(const e of i.enablers||[])assert.ok(enIds.has(e),`${g.id}.${i.id} enabler ${e}`);for(const d of i.dependsOn||[])assert.ok(inIds.has(d)&&d!==i.id,`${g.id}.${i.id} dependsOn ${d}`);}
  for(const a of g.assumptions||[]){bilingual(a.text,g.id);bilingual(a.failureImpact,g.id);}
  assert.ok((g.enablers||[]).length>=1&&(g.initiatives||[]).length>=1&&(g.assumptions||[]).length>=1,g.id+' must draft enablers, initiatives and assumptions');
 }
}
/* The expert asked for the education sector "from every angle": regulations, national goals, national and international indicators. */
const edu=L.sector('edu');
assert.ok(edu.regulations.length>=12&&edu.indicators.length>=18&&edu.goals.length>=10&&edu.programs.length>=2);
assert.ok(edu.indicators.some(i=>i.scope==='international')&&edu.indicators.some(i=>i.scope==='national')&&edu.indicators.some(i=>i.scope==='internal'));
assert.ok(edu.regulations.some(r=>r.kind==='accreditation')&&edu.regulations.some(r=>r.kind==='benchmark'));
assert.deepEqual(new Set(edu.goals.map(g=>g.type)),new Set(['requirement','differentiation','moonshot','divest']));
assert.equal(L.goalsFor('edu','public').some(g=>g.id==='revenue'),false,'fee-based revenue is not offered to public schools');
assert.ok(L.goalsFor('edu','private').some(g=>g.id==='revenue'));
assert.equal(L.detect('مدرسة أهلية في الرياض')?.id,'edu');assert.equal(L.detect('Public university')?.id,'highered');assert.equal(L.detect('مستشفى خاص')?.id,'health');assert.equal(L.detect('جمعية خيرية')?.id,'nonprofit');assert.equal(L.detect('هيئة حكومية')?.id,'gov');assert.equal(L.detect(''),null);
/* Every goal group the guided path renders must have a label in both languages (a missing key breaks step 4). */
global.SultanLocales={en:{},ar:{}};require('../src/locales/guided.js');
for(const s of L.sectors)for(const g of s.goals)for(const lang of ['en','ar'])assert.ok(typeof global.SultanLocales[lang]['gwGroup_'+g.group]==='string',`${s.id}.${g.id}: no ${lang} label for group "${g.group}"`);
/* The method owner's growth thinking for technology companies is encoded as a sector of its own. */
const tech=L.sector('tech');assert.ok(tech&&tech.types.length===4&&tech.goals.length>=7,'technology sector present');
assert.ok(tech.goals.some(g=>g.id==='partner'&&g.type==='moonshot')&&tech.goals.some(g=>g.id==='recurring')&&tech.goals.some(g=>g.id==='fraud-ai')&&tech.goals.some(g=>g.id==='ai-security')&&tech.goals.some(g=>g.id==='verticals')&&tech.goals.some(g=>g.type==='divest'));
assert.ok(tech.indicators.some(i=>i.id==='recurring-share')&&tech.indicators.some(i=>i.id==='avg-ticket'));
assert.equal(L.detect('شركة تقنية معلومات')?.id,'tech');assert.equal(L.detect('Systems integrator and cybersecurity provider')?.id,'tech');
assert.ok(L.grounding('edu','private','ar').includes('etec.gov.sa'));assert.ok(L.grounding('edu','private','en').split('\n').length>30);
assert.equal(L.pick({ar:'أ',en:'b'},'en'),'b');assert.equal(L.pick({ar:'أ',en:'b'},'ar'),'أ');
console.log(JSON.stringify({suite:'sector-library',passed:true,sectors:L.sectors.map(s=>({id:s.id,goals:s.goals.length,regulations:s.regulations.length,indicators:s.indicators.length}))}));
