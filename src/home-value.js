/* Homepage value layer: make SULTAN's decision-accountability value visible immediately. */
(function(root){
'use strict';
const E=root.Sultan,I=root.SultanI18n,T=I.t;
const esc=x=>String(x??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const num=x=>typeof x==='number'&&Number.isFinite(x);
const fmt=x=>num(x)?x.toLocaleString(I.language==='ar'?'ar-SA':'en-US',{maximumFractionDigits:1}):'—';

function snapshot(){
 const p=E.demo(),ranking=E.ranking(p),leader=ranking[0];
 const breakRow=(E.breakEven(p)||[]).find(x=>num(x.threshold));
 const selected=p.options.find(o=>o.decision==='select'&&p.enablers.some(e=>e.optionId===o.id))||p.options.find(o=>o.decision==='select');
 const authority=selected?E.authoritySpaceForOption(p,selected.id):null;
 const noInitiative=p.options.find(o=>!p.initiatives.some(i=>i.optionId===o.id));
 return {p,leader,breakRow,selected,authority,noInitiative};
}
function sensitivitySvg(s){
 const row=s.breakRow,current=num(row?.current)?row.current:15,threshold=num(row?.threshold)?row.threshold:null;
 const cx=28+current*2.22,tx=threshold===null?228:28+threshold*2.22;
 return `<svg class="hv-mini-svg" viewBox="0 0 278 104" role="img" aria-label="${esc(T('hvP2'))}"><line x1="28" y1="82" x2="250" y2="82" class="hv-axis"/><path d="M30 28 L246 77" class="hv-line hv-a"/><path d="M30 65 L246 39" class="hv-line hv-b"/><line x1="${cx}" y1="18" x2="${cx}" y2="86" class="hv-current"/>${threshold===null?'':`<line x1="${tx}" y1="18" x2="${tx}" y2="86" class="hv-switch"/><circle cx="${tx}" cy="53" r="5" class="hv-cross"/>`}<text x="${cx}" y="100" text-anchor="middle">${fmt(current)}%</text>${threshold===null?'':`<text x="${tx}" y="14" text-anchor="middle">${fmt(threshold)}%</text>`}</svg>`;
}
function authoritySvg(s){
 const a=s.authority||{},vals=[a.ownershipClarity,a.statusClarity,a.clearance];
 return `<svg class="hv-mini-svg" viewBox="0 0 278 104" role="img" aria-label="${esc(T('hvP3'))}">${vals.map((v,i)=>{const w=num(v)?Math.max(0,Math.min(100,v))*1.72:0,y=18+i*28;return `<rect x="82" y="${y}" width="172" height="14" rx="7" class="hv-track"/><rect x="82" y="${y}" width="${w}" height="14" rx="7" class="hv-fill"/><text x="72" y="${y+11}" text-anchor="end">${num(v)?Math.round(v)+'%':'—'}</text>`;}).join('')}</svg>`;
}
function choiceSvg(s){
 const rows=E.ranking(s.p).slice(0,3),max=Math.max(1,...rows.map(r=>r.value||0));
 return `<svg class="hv-mini-svg" viewBox="0 0 278 104" role="img" aria-label="${esc(T('hvP1'))}">${rows.map((r,i)=>{const w=(r.value||0)/max*190,y=16+i*28;return `<rect x="44" y="${y}" width="196" height="15" rx="7" class="hv-track"/><rect x="44" y="${y}" width="${w}" height="15" rx="7" class="hv-fill ${i===0?'hv-primary-fill':''}"/><text x="36" y="${y+12}" text-anchor="end">${i+1}</text><text x="246" y="${y+12}">${fmt(r.value)}</text>`;}).join('')}</svg>`;
}
function unknownSvg(){
 return `<svg class="hv-mini-svg" viewBox="0 0 278 104" role="img" aria-label="${esc(T('hvP4'))}"><rect x="22" y="20" width="68" height="58" rx="10" class="hv-known-box"/><text x="56" y="44" text-anchor="middle">0</text><text x="56" y="64" text-anchor="middle">${esc(I.language==='ar'?'معلوم':'known')}</text><path d="M111 49 H151" class="hv-not-equal"/><text x="131" y="44" text-anchor="middle">≠</text><rect x="172" y="20" width="84" height="58" rx="10" class="hv-unknown-box"/><text x="214" y="44" text-anchor="middle">?</text><text x="214" y="64" text-anchor="middle">${esc(I.language==='ar'?'مجهول':'unknown')}</text></svg>`;
}
function trace(){
 const labels=['hvMandate','hvChoice','hvEvidence','hvAuthority','hvInitiative','hvFunding','hvOutcome'];
 return `<div class="hv-trace" aria-label="${esc(T('hvTrace'))}">${labels.map((k,i)=>`<div class="hv-trace-node"><span>${String(i+1).padStart(2,'0')}</span><b>${esc(T(k))}</b></div>`).join('<i aria-hidden="true">→</i>')}</div>`;
}
function metric(label,value,help,css=''){
 return `<div class="hv-metric ${css}"><span>${esc(label)}</span><strong>${esc(value)}</strong>${help?`<small>${esc(help)}</small>`:''}</div>`;
}
function heroSnapshot(s){
 const switchValue=num(s.breakRow?.threshold)?fmt(s.breakRow.threshold)+'%':T('hvNoSwitch');
 const clearance=num(s.authority?.clearance)?fmt(s.authority.clearance)+'%':T('hvNoClearance');
 return `<section class="hv-snapshot" aria-label="${esc(T('hvSnapshot'))}"><div class="hv-snapshot-head"><div><span>${esc(T('hvSnapshot'))}</span><b>${esc(T('hvDemo'))}</b></div><span class="hv-live-dot">●</span></div><div class="hv-metric-grid">${metric(T('hvValue'),fmt(s.leader?.value||0),s.leader?.title||'')}${metric(T('hvSwitch'),switchValue,s.breakRow?.criterion||'')}${metric(T('hvClearance'),clearance,s.selected?.title||'')}${metric(T('hvUnknown'),'≠ 0',T('hvUnknownHelp'),'hv-unknown-metric')}</div>${trace()}<p class="hv-proof-note">${esc(T('hvProof'))}</p></section>`;
}
function pillar(index,title,help,visual){return `<article class="hv-pillar"><div class="hv-pillar-head"><span>0${index}</span><h3>${esc(title)}</h3></div>${visual}<p>${esc(help)}</p></article>`;}
function pillars(s){
 return `<section class="landing-wrap hv-value-section" id="value-difference"><div class="hv-section-heading"><span class="eyebrow">SULTAN / DECISION ACCOUNTABILITY</span><h2>${esc(T('hvWhyTitle'))}</h2><p>${esc(T('hvWhyLead'))}</p></div><div class="hv-pillar-grid">${pillar(1,T('hvP1'),T('hvP1Help'),choiceSvg(s))}${pillar(2,T('hvP2'),T('hvP2Help'),sensitivitySvg(s))}${pillar(3,T('hvP3'),T('hvP3Help'),authoritySvg(s))}${pillar(4,T('hvP4'),T('hvP4Help'),unknownSvg())}</div></section>`;
}
function contrast(){
 const list=(title,items,kind)=>`<article class="hv-contrast-card ${kind}"><span>${esc(title)}</span><ul>${items.map(x=>`<li>${esc(x)}</li>`).join('')}</ul></article>`;
 return `<section class="hv-contrast"><div class="landing-wrap"><div class="hv-contrast-intro"><h2>${esc(T('hvContrastTitle'))}</h2><p>${esc(T('hvContrastLead'))}</p></div><div class="hv-contrast-grid">${list(T('hvTraditional'),[T('hvTraditional1'),T('hvTraditional2'),T('hvTraditional3')],'traditional')}${list(T('hvSultan'),[T('hvSultan1'),T('hvSultan2'),T('hvSultan3'),T('hvSultan4')],'sultan')}</div></div></section>`;
}
function enhanceHome(){
 if(!document.body.classList.contains('is-home'))return;
 const home=document.querySelector('.public-entrance');if(!home||home.dataset.valueEnhanced==='1')return;home.dataset.valueEnhanced='1';
 const s=snapshot(),hero=document.querySelector('.launch-hero');
 const over=hero?.querySelector('.hero-overline');if(over)over.innerHTML=`<span class="status-light"></span>${esc(T('hvKicker'))}`;
 const h1=hero?.querySelector('.hero-copy h1');if(h1)h1.textContent=T('hvTitle');
 const lead=hero?.querySelector('.hero-copy>p');if(lead)lead.textContent=T('hvLead');
 const actions=hero?.querySelector('.hero-actions');if(actions&&!hero.querySelector('.hv-questions'))actions.insertAdjacentHTML('beforebegin',`<div class="hv-questions">${['hvQ1','hvQ2','hvQ3','hvQ4'].map((k,i)=>`<span><b>${i+1}</b>${esc(T(k))}</span>`).join('')}</div>`);
 const preview=hero?.querySelector('.product-preview');if(preview&&!preview.querySelector('.hv-snapshot'))preview.insertAdjacentHTML('afterbegin',heroSnapshot(s));
 const proof=document.querySelector('.proof-strip');if(proof){proof.classList.add('hv-proof-strip');proof.innerHTML=[['hvP1','hvP1Help'],['hvP2','hvP2Help'],['hvP3','hvP3Help'],['hvP4','hvP4Help']].map(([a,b],i)=>`<div><span class="proof-num">0${i+1}</span><div><h2>${esc(T(a))}</h2><p>${esc(T(b))}</p></div></div>`).join('');}
 if(proof&&!document.getElementById('value-difference'))proof.insertAdjacentHTML('afterend',pillars(s)+contrast());
}
function schedule(){setTimeout(()=>setTimeout(enhanceHome,0),0);}
document.addEventListener('sultan:render',schedule);schedule();
root.SultanHomeValue={snapshot,enhanceHome};
})(globalThis);
