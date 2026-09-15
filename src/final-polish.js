/* Final UX/document polish: decision-first documents, true starter questions, and visible divest value. */
(function(root){
'use strict';
if(!root.SultanApp||!root.Sultan)return;
const E=root.Sultan,T=root.SultanI18n.t;
const esc=x=>String(x??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const fmt=x=>typeof x==='number'&&Number.isFinite(x)?Math.round(x).toLocaleString('en-US'):'—';

/* A5 + A3: client documents identify a document number, not an edit counter, and open with the decision summary. */
const baseReport=root.SultanApp.getReport.bind(root.SultanApp);
root.SultanApp.getReport=function(){
 const p=root.SultanApp.getProject(),doc=new DOMParser().parseFromString(baseReport(),'text/html'),report=doc.querySelector('.report'),header=report?.querySelector('header');
 if(header){
  const meta=Array.from(header.children).find(x=>x.tagName==='P'&&!x.classList.contains('hint')&&!x.classList.contains('report-date'));
  if(meta)meta.textContent=`${T('documentNumber')} ${p.documentNumber} · ${p.updatedAt}`;
  const summary=report.querySelector('.executive-summary');
  if(summary){const line=summary.querySelector('p:last-child');if(line)line.innerHTML=`<b>${esc(T('documentNumber'))} ${p.documentNumber}</b>`;const h1=header.querySelector('h1');if(h1)h1.insertAdjacentElement('afterend',summary);}
 }
 return doc.body.innerHTML;
};

function starterQuestions(){
 if(location.hash!=='#identity')return;const content=document.getElementById('content'),starter=content?.querySelector('.identity-starter'),grid=starter?.querySelector('.starter-grid'),more=content?.querySelector('.identity-more-body');if(!grid||!more)return;
 const mission=grid.querySelector('[data-path="institution.mission"]')?.closest('.field'),vision=content.querySelector('[data-path="institution.vision"]')?.closest('.field');
 if(mission&&vision&&!grid.contains(vision)){more.prepend(mission);grid.prepend(vision);}
 const relabel=(path,label)=>{const f=grid.querySelector(`[data-path="${path}"]`)?.closest('.field');if(f){const s=f.querySelector(':scope > span:first-child');if(s)s.textContent=label;}};
 relabel('institution.vision',T('identityStarterChange'));relabel('institution.beneficiaries',T('identityStarterWho'));relabel('institution.endYear',T('identityStarterWhen'));
}
function releasedResources(){
 if(location.hash!=='#priorities')return;const p=root.SultanApp.getProject(),ranking=E.ranking(p),content=document.getElementById('content');if(!content)return;const rows=Array.from(content.querySelectorAll('.rank')).slice(0,ranking.length);
 rows.forEach((row,i)=>{const r=ranking[i],o=p.options.find(x=>x.id===r.id);if(o?.type!=='divest'||typeof o.releasedResources!=='number'||row.querySelector('.released-resources'))return;row.insertAdjacentHTML('beforeend',`<small class="released-resources">+ ${fmt(o.releasedResources)} · ${esc(T('releasedResources'))}</small>`);});
}
function run(){setTimeout(()=>{starterQuestions();releasedResources();},0);}
document.addEventListener('sultan:render',run);run();
})(globalThis);
