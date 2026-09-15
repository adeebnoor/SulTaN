/* Surface SULTAN's named methodology without changing project data or check() semantics. */
(function(root){
'use strict';
const I=root.SultanI18n,T=I.t;
const esc=x=>String(x??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
function mini(type){
 if(type===1)return `<svg class="sm-mini" viewBox="0 0 220 92" role="img" aria-label="${esc(T('smC1'))}"><rect x="18" y="16" width="184" height="15" rx="7" class="track"/><rect x="18" y="16" width="145" height="15" rx="7" class="n"/><rect x="18" y="46" width="184" height="15" rx="7" class="track"/><rect x="18" y="46" width="102" height="15" rx="7" class="g"/><text x="18" y="82">reason · trade-off · evidence</text></svg>`;
 if(type===2)return `<svg class="sm-mini" viewBox="0 0 220 92" role="img" aria-label="${esc(T('smC2'))}"><rect x="18" y="15" width="184" height="12" rx="6" class="track"/><rect x="18" y="15" width="154" height="12" rx="6" class="n"/><rect x="18" y="39" width="184" height="12" rx="6" class="track"/><rect x="18" y="39" width="120" height="12" rx="6" class="g"/><rect x="18" y="63" width="184" height="12" rx="6" class="track"/><rect x="18" y="63" width="88" height="12" rx="6" class="n"/></svg>`;
 if(type===3)return `<svg class="sm-mini" viewBox="0 0 220 92" role="img" aria-label="${esc(T('smC3'))}"><line x1="20" y1="73" x2="202" y2="73" class="axis"/><path d="M22 22 L198 68" class="line-a"/><path d="M22 62 L198 30" class="line-b"/><line x1="124" y1="12" x2="124" y2="76" class="dash"/><circle cx="124" cy="48" r="5" class="g"/></svg>`;
 if(type===4)return `<svg class="sm-mini" viewBox="0 0 220 92" role="img" aria-label="${esc(T('smC4'))}"><rect x="18" y="18" width="62" height="52" rx="9" class="box"/><text x="49" y="48" text-anchor="middle">0</text><text x="110" y="49" text-anchor="middle">≠</text><rect x="140" y="18" width="62" height="52" rx="9" class="box-gold"/><text x="171" y="48" text-anchor="middle">?</text></svg>`;
 return `<svg class="sm-mini" viewBox="0 0 220 92" role="img" aria-label="${esc(T('smC5'))}"><rect x="18" y="31" width="48" height="30" rx="7" class="box"/><rect x="86" y="22" width="48" height="48" rx="8" class="box-gold"/><rect x="154" y="31" width="48" height="30" rx="7" class="box"/><path d="M66 46 H86 M134 46 H154" class="axis"/><text x="110" y="51" text-anchor="middle">✓</text></svg>`;
}
function chain(){
 const ks=['smMandate','smChoice','smEvidence','smAuthority','smInitiative','smFunding','smOutcome'];
 return `<div class="sm-chain-wrap"><span class="sm-chain-label">${esc(T('smChain'))}</span><div class="sm-chain">${ks.map((k,i)=>`<div class="sm-node"><span>${String(i+1).padStart(2,'0')}</span><b>${esc(T(k))}</b></div>`).join('<i class="sm-arrow" aria-hidden="true">→</i>')}</div></div>`;
}
function construct(i){return `<article class="sm-construct"><span class="sm-construct-index">0${i}</span><h3>${esc(T('smC'+i))}</h3>${mini(i)}<p>${esc(T('smC'+i+'D'))}</p></article>`;}
function rule(i){return `<article class="sm-rule"><b>${esc(T('smR'+i))}</b><p>${esc(T('smR'+i+'D'))}</p></article>`;}
function ready(){return `<div class="sm-ready"><div><h3>${esc(T('smReady'))}</h3><p class="sm-ready-note">${esc(T('smNote'))}</p></div><ul class="sm-ready-list">${[1,2,3,4,5].map(i=>`<li>${esc(T('smReady'+i))}</li>`).join('')}</ul></div>`;}
function markup(){return `<div class="landing-wrap sultan-methodology-inner"><header class="sm-head"><span class="eyebrow">${esc(T('smEyebrow'))}</span><h2>${esc(T('smTitle'))}</h2><p>${esc(T('smLead'))}</p></header>${chain()}<h3 class="sm-section-title">${esc(T('smConstructs'))}</h3><div class="sm-construct-grid">${[1,2,3,4,5].map(construct).join('')}</div><section class="sm-rule-panel"><div><h3>${esc(T('smRules'))}</h3><p>${esc(T('smRulesLead'))}</p></div><div class="sm-rule-grid">${[1,2,3,4,5].map(rule).join('')}</div></section>${ready()}</div>`;}
function enhance(){
 if(!document.body.classList.contains('is-home'))return;
 let host=document.getElementById('methodology');
 if(host&&host.querySelector('.sultan-methodology-inner'))return;
 if(!host){
  host=document.createElement('section');host.id='methodology';host.className='sultan-methodology';
  const anchor=document.getElementById('value-difference')||document.querySelector('.proof-strip');
  if(anchor)anchor.insertAdjacentElement('afterend',host);else document.querySelector('.public-entrance')?.append(host);
 }else{
  host.classList.add('sultan-methodology');
  const old=host.querySelector('.sultan-methodology-inner');if(old)return;
 }
 host.insertAdjacentHTML('afterbegin',markup());
}
function schedule(){setTimeout(()=>setTimeout(enhance,0),0);}
document.addEventListener('sultan:render',schedule);schedule();
root.SultanMethodology={enhance};
})(globalThis);
