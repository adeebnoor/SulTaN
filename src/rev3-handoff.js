/* Rev-3 handoff closure: shorten the public story, harden deterministic hints,
   and tighten the fictional teaching case without changing the project schema. */
(function(root){
'use strict';
const E=root.Sultan,I=root.SultanI18n,T=I.t;
if(!E)return;
Object.assign(root.SultanLocales.en,{
 smR1:'R1 · Unapproved borrowed target',smR1D:'Flag when a numeric target appears literally inside its linked reference while that reference is not approved for use or adaptation.',
 smR2:'R2 · Boundary contradiction',smR2D:'Flag when something declared as “not doing” materially overlaps a selected choice, outcome or rationale.',
 smR3:'R3 · Trade-off omission',smR3D:'Flag a stated “not doing” boundary when no option trade-off visibly carries that boundary into the choice set.',
 smR4:'R4 · Choice distinctiveness',smR4D:'Flag selected choices whose outcomes are so similar that they may be duplicates rather than real alternatives.',
 smR5:'R5 · Advantage grounding',smR5D:'Flag a selected discretionary choice when its “why us” has no visible anchor in institutional assets or context.'
});
Object.assign(root.SultanLocales.ar,{
 smR1:'R1 · مستهدف مستعار غير معتمد',smR1D:'ينبّه إذا ظهر المستهدف الرقمي نصًا داخل المرجعية المرتبطة بينما لم تُعتمد المرجعية للاستخدام أو التكييف.',
 smR2:'R2 · تناقض الحدود',smR2D:'ينبّه إذا تداخل ما أُعلن أنه «لن يُفعل» بصورة جوهرية مع اختيار محدد أو نتيجته أو مبرره.',
 smR3:'R3 · غياب المفاضلة',smR3D:'ينبّه إذا أعلنت الجهة ما لن تفعله ولم يظهر هذا الحد داخل أي مفاضلة للخيارات.',
 smR4:'R4 · تمايز الخيارات',smR4D:'ينبّه إذا كانت نتائج خيارين محددين متشابهة جدًا لدرجة قد تعني أنهما تكرار لا بديلان حقيقيان.',
 smR5:'R5 · تأصيل الميزة',smR5D:'ينبّه إذا كان الاختيار التقديري المحدد يذكر «لماذا نحن» دون ارتكاز ظاهر على أصول الجهة أو سياقها.'
});
const text=x=>typeof x==='string'&&x.trim().length>0;
const num=x=>typeof x==='number'&&Number.isFinite(x);
const esc=x=>String(x??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]||c));

/* --- Canonical R1-R5 deterministic hints: advisory only, never part of check(). --- */
function words(v){return new Set(String(v||'').toLowerCase().replace(/[^\p{L}\p{N}]+/gu,' ').split(/\s+/).filter(w=>w.length>=4));}
function overlap(a,b){const A=words(a),B=words(b);let n=0;for(const w of A)if(B.has(w))n++;return n;}
function numberTokens(v){
 if(!num(v))return [];
 const raw=String(v),plain=Number.isInteger(v)?String(Math.trunc(v)):raw.replace(/0+$/,'').replace(/\.$/,''),grouped=Number(v).toLocaleString('en-US',{maximumFractionDigits:8});
 const ar=x=>String(x).replace(/[0-9]/g,d=>'٠١٢٣٤٥٦٧٨٩'[Number(d)]);
 return [...new Set([raw,plain,grouped,ar(raw),ar(plain),ar(grouped)].filter(Boolean))];
}
function referenceMentionsTarget(r,v){const body=[r?.name,r?.source,r?.purpose,r?.context,r?.adaptation].join(' ');return numberTokens(v).some(token=>body.includes(token));}
E.semanticIssues=function(p){
 const hints=[],push=(rule,message,entity='')=>hints.push({level:'hint',rule,section:'review',message,entity});
 const tr=k=>{try{return T(k);}catch{return k;}};
 const selected=(p?.options||[]).filter(o=>o.decision==='select');
 for(const t of p?.transitions||[]){const r=(p.references||[]).find(x=>x.id===t.referenceId);if(t.direction!=='qualitative'&&num(t.target)&&r&&!['use','adapt'].includes(r.status)&&referenceMentionsTarget(r,t.target))push('R1',tr('semanticS5')+' '+(t.domain||''),t.id);}
 if(text(p?.institution?.notDoing)){
  const nd=p.institution.notDoing;
  for(const o of selected)if(overlap(nd,[o.title,o.outcome,o.whyUs].join(' '))>=2)push('R2',tr('semanticS3')+' '+(o.title||''),o.id);
  if(!(p.options||[]).some(o=>overlap(nd,o.tradeoff)>=2))push('R3',tr('semanticS2'));
 }
 for(let i=0;i<selected.length;i++)for(let j=i+1;j<selected.length;j++){const a=selected[i],b=selected[j],A=words(a.outcome),B=words(b.outcome);if(A.size&&B.size){let inter=0;for(const w of A)if(B.has(w))inter++;const union=new Set([...A,...B]).size;if(inter/union>=.75)push('R4',tr('semanticS4')+' '+(a.title||'')+' / '+(b.title||''),a.id);}}
 const anchor=[p?.institution?.assets,p?.institution?.context].join(' ');if(text(anchor))for(const o of selected.filter(x=>x.type!=='requirement'))if(text(o.whyUs)&&overlap(o.whyUs,anchor)===0)push('R5',tr('semanticS1')+' '+(o.title||''),o.id);
 return hints;
};

/* --- Tighten the fictional university example. --- */
const baseDemo=E.demo;
if(typeof baseDemo==='function')E.demo=function(){
 const p=baseDemo(),ar=I.language==='ar';
 if(p?.institution)p.institution.liabilities=ar
  ?'التزام تشغيلي قدره 1,800,000 ريال مرتبط بوحدتين منخفضتي الأثر حتى 31 ديسمبر 2027، مع عقد دعم مشترك يتجدد تلقائيًا ما لم يُخطر قبل 90 يومًا.'
  :'A SAR 1,800,000 operating commitment remains tied to two low-impact legacy units through 31 December 2027, with a shared-support contract that auto-renews unless notice is given 90 days in advance.';
 const roles={
  differentiation:ar?'عميد كلية الحاسبات':'Dean of the Computing College',
  moonshot:ar?'مدير مركز الابتكار':'Director of the Innovation Center',
  divest:ar?'مدير إدارة التخطيط والميزانية':'Director of Planning and Budget',
  requirement:ar?'مدير إدارة الحوكمة والامتثال':'Director of Governance and Compliance'
 };
 for(const o of p?.options||[])for(const a of o.assumptions||[])a.owner=roles[o.type]||(text(o.owner)?o.owner:(ar?'مالك الاستراتيجية':'Strategy owner'));
 return p;
};

function makeEvidenceTabs(){
 const grid=document.querySelector('#decision-visuals .v-chart-grid');if(!grid||grid.dataset.rev3Tabbed==='1')return;
 const cards=[...grid.querySelectorAll(':scope > [data-evidence]')];if(!cards.length)return;grid.dataset.rev3Tabbed='1';
 const tabs=document.createElement('div');tabs.className='rev3-evidence-tabs';tabs.setAttribute('role','tablist');tabs.setAttribute('aria-label',document.querySelector('#decision-visuals h2')?.textContent||'Evidence');
 const stage=document.createElement('div');stage.className='rev3-evidence-stage';
 cards.forEach((card,i)=>{const key=card.dataset.evidence||('panel'+i),label=card.querySelector('h3')?.textContent||key;const btn=document.createElement('button');btn.type='button';btn.dataset.rev3Tab=key;btn.setAttribute('role','tab');btn.setAttribute('aria-selected',String(i===0));btn.setAttribute('aria-controls','evidence-'+key);btn.tabIndex=i===0?0:-1;btn.textContent=label;tabs.append(btn);const panel=document.createElement('div');panel.className='rev3-evidence-panel';panel.id='evidence-'+key;panel.dataset.rev3Panel=key;panel.setAttribute('role','tabpanel');panel.hidden=i!==0;panel.append(card);stage.append(panel);});
 grid.replaceWith(tabs,stage);
}
function activateEvidence(key,focus=false){
 const host=document.getElementById('decision-visuals');if(!host)return false;const panel=host.querySelector(`[data-rev3-panel="${key}"]`);if(!panel)return false;
 host.querySelectorAll('[data-rev3-panel]').forEach(x=>x.hidden=x!==panel);host.querySelectorAll('[data-rev3-tab]').forEach(x=>{const on=x.dataset.rev3Tab===key;x.setAttribute('aria-selected',String(on));x.tabIndex=on?0:-1;});
 if(focus){const h=panel.querySelector('h3')||panel;h.tabIndex=-1;h.focus({preventScroll:true});panel.scrollIntoView({behavior:root.matchMedia?.('(prefers-reduced-motion: reduce)').matches?'auto':'smooth',block:'nearest'});}return true;
}
function compactMethodology(){
 const host=document.getElementById('methodology'),inner=host?.querySelector('.sultan-methodology-inner');if(!host||!inner||host.dataset.rev3Compact==='1')return;host.dataset.rev3Compact='1';
 [...host.children].forEach(ch=>{if(ch!==inner)ch.remove();});host.classList.remove('landing-wrap','product-section');
 const contrast=document.querySelector('.hv-contrast');if(contrast){const body=contrast.querySelector('.landing-wrap');if(body){const block=document.createElement('div');block.className='rev3-method-contrast';block.innerHTML=body.innerHTML;inner.querySelector('.sm-chain-wrap')?.insertAdjacentElement('afterend',block);}contrast.remove();}
 const rulePanel=inner.querySelector('.sm-rule-panel');if(rulePanel){const details=document.createElement('details');details.className='rev3-rules-details';const summary=document.createElement('summary'),head=rulePanel.firstElementChild;summary.innerHTML=`<span>${esc(head?.querySelector('h3')?.textContent||'R1–R5')}</span><small>${esc(head?.querySelector('p')?.textContent||'')}</small>`;details.append(summary);const grid=rulePanel.querySelector('.sm-rule-grid');if(grid)details.append(grid);const ready=inner.querySelector('.sm-ready');if(ready)details.append(ready);rulePanel.replaceWith(details);}
}
function shortenHome(){
 if(!document.body.classList.contains('is-home'))return;
 document.querySelector('.proof-strip')?.remove();document.getElementById('value-difference')?.remove();
 const quick=document.querySelector('.quick-section'),cta=document.querySelector('.bottom-cta');if(quick&&cta&&!cta.querySelector('.rev3-quick-inline')){const steps=Array.from(quick.querySelectorAll('.quick-grid>div')).map(x=>x.outerHTML).join('');if(steps)cta.querySelector('.hero-actions')?.insertAdjacentHTML('beforebegin',`<div class="rev3-quick-inline">${steps}</div>`);quick.remove();}
 const hero=document.querySelector('.launch-hero'),actions=hero?.querySelector('.hero-actions');if(actions&&!hero.querySelector('.rev3-mobile-metrics')&&root.SultanHomeValue?.snapshot){const s=root.SultanHomeValue.snapshot(),fmt=x=>num(x)?x.toLocaleString(I.language==='ar'?'ar-SA':'en-US',{maximumFractionDigits:1}):'—',switchValue=num(s.breakRow?.threshold)?fmt(s.breakRow.threshold)+'%':T('hvNoSwitch');actions.insertAdjacentHTML('beforebegin',`<div class="rev3-mobile-metrics"><div><span>${esc(T('hvValue'))}</span><strong>${esc(fmt(s.leader?.value||0))}</strong></div><div><span>${esc(T('hvSwitch'))}</span><strong>${esc(switchValue)}</strong></div></div>`);}
}
function syncHash(){const id=location.hash.slice(1);if(id.startsWith('evidence-'))activateEvidence(id.slice(9),true);}
function apply(){if(!document.body.classList.contains('is-home'))return;shortenHome();compactMethodology();makeEvidenceTabs();syncHash();document.body.dataset.rev3='ready';}
function schedule(){setTimeout(()=>setTimeout(()=>setTimeout(apply,0),0),0);}
document.addEventListener('sultan:render',schedule);document.addEventListener('click',e=>{const tab=e.target.closest('[data-rev3-tab]');if(!tab)return;activateEvidence(tab.dataset.rev3Tab,true);history.replaceState(null,'','#evidence-'+tab.dataset.rev3Tab);});root.addEventListener('hashchange',syncHash);schedule();
root.SultanRev3={apply,activateEvidence,referenceMentionsTarget};
})(globalThis);
