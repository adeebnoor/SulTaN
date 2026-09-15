/* SULTAN 0.7 execution upgrades: authority checks, escalation pack, decision sensitivity and guided UX. */
(function(root){
'use strict';
const E=root.Sultan,T=root.SultanI18n.t;
const esc=x=>String(x??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const text=x=>typeof x==='string'&&x.trim().length>0;
const fmt=x=>typeof x==='number'&&Number.isFinite(x)?Math.round(x).toLocaleString('en-US'):'—';
const selectedIds=p=>new Set(p.options.filter(o=>o.decision==='select').map(o=>o.id));
const currentSection=()=>location.hash.slice(1)||'home';

function actionText(key){return T({proceed:'authorityProceed',resolve:'authorityResolve',escalate:'authorityEscalate',learn:'authorityLearn',none:'authorityNoEnablers'}[key]);}
function authorityRows(p){return E.authoritySpace(p).filter(r=>r.decision==='select'||r.total>0);}
function authorityHtml(p){const rows=authorityRows(p);return `<section class="report-extra authority-report"><h2>${esc(T('authoritySpaceTitle'))}</h2><p>${esc(T('authoritySpaceIntro'))}</p>${rows.map(r=>`<h3>${esc(r.title)}</h3><dl><dt>${esc(T('authorityOwnership'))}</dt><dd>${r.total<4?`${r.ownershipKnown} / ${r.total}`:fmt(r.ownershipClarity)+'%'}</dd><dt>${esc(T('authorityStatus'))}</dt><dd>${r.total<4?`${r.statusKnown} / ${r.total}`:fmt(r.statusClarity)+'%'}</dd><dt>${esc(T('authorityClearance'))}</dt><dd>${r.total<4?`${r.ready} / ${r.total}`:fmt(r.clearance)+'%'}</dd><dt>${esc(T('authorityNextDue'))}</dt><dd>${r.nextDue||'—'}</dd><dt>${esc(T('authorityActions'))}</dt><dd>${r.actions.map(a=>esc(actionText(a))).join('<br>')}</dd></dl>`).join('')}</section>`;}
function affectedWork(p,enablerId){return p.initiatives.filter(i=>(i.enablerIds||[]).includes(enablerId)).map(i=>(i.title||T('s412'))+' · '+i.startYear).join('; ')||'—';}
function escalationTable(p,items){return items.length?`<table><thead><tr><th>${esc(T('authorityChoice'))}</th><th>${esc(T('s492'))}</th><th>${esc(T('s495'))}</th><th>${esc(T('escalationDue'))}</th><th>${esc(T('affectedWork'))}</th><th>${esc(T('escalationRoute'))}</th><th>${esc(T('escalationFallback'))}</th></tr></thead><tbody>${items.map(x=>`<tr><td>${esc(x.choice)}</td><td>${esc(x.title)}</td><td>${esc(x.owner||T('s408'))}</td><td>${x.dueYear??'—'}</td><td>${esc(affectedWork(p,x.id))}</td><td>${esc(x.route||T('s408'))}</td><td>${esc(x.fallback||T('s408'))}</td></tr>`).join('')}</tbody></table>`:`<p>${esc(T('escalationEmpty'))}</p>`;}
function escalationHtml(p){const selected=new Set(p.options.filter(o=>o.decision==='select').map(o=>o.id)),external=E.authorityEscalationItems(p),internal=p.enablers.filter(e=>selected.has(e.optionId)&&e.control==='internal'&&e.status!=='ready').map(e=>({id:e.id,optionId:e.optionId,choice:p.options.find(o=>o.id===e.optionId)?.title||'',title:e.title||'',owner:e.owner||'',dueYear:e.dueYear,route:e.route||'',fallback:e.fallback||''})).sort((a,b)=>(a.dueYear??9999)-(b.dueYear??9999));return `<section class="report-extra escalation-report"><h2>${esc(T('escalationPack'))}</h2><p><b>${esc(p.institution.name||T('s250'))}</b> · ${esc(T('generatedOn'))}: ${esc(dualDate())} · ${esc(T('revisionLabel'))} ${p.revision}</p><p>${esc(T('escalationPackIntro'))}</p><h3>${esc(T('externalEscalations'))}</h3>${escalationTable(p,external)}<h3>${esc(T('internalPendingDecisions'))}</h3>${escalationTable(p,internal)}</section>`;}
function dualDate(){const d=new Date(),greg=new Intl.DateTimeFormat(SultanI18n.language==='ar'?'ar-SA-u-ca-gregory-nu-latn':'en-GB',{dateStyle:'medium'}).format(d),hijri=new Intl.DateTimeFormat(SultanI18n.language==='ar'?'ar-SA-u-ca-islamic-nu-latn':'en-GB-u-ca-islamic-nu-latn',{dateStyle:'medium'}).format(d);return `${T('gregorianLabel')}: ${greg} · ${T('hijriLabel')}: ${hijri}`;}
function leadershipBody(body){const doc=new DOMParser().parseFromString(body,'text/html'),h=doc.querySelector('[data-report-section="issues"]');if(h){let n=h.nextSibling;while(n){const next=n.nextSibling;if(n.nodeType===1&&n.matches&&n.matches('h2[data-report-section]'))break;n.remove();n=next;}h.remove();}let k=0;doc.querySelectorAll('h2[data-report-section]').forEach(x=>{k++;x.innerHTML=x.innerHTML.replace(/^\s*\d+\.\s*/,k+'. ');});return doc.body.innerHTML;}
function enhancedReport(p,leadership=false){let body=root.SultanApp.getReport();const stamp=`<p class="report-date">${esc(dualDate())}</p>`;body=body.replace(/(<header>[\s\S]*?<h1>[\s\S]*?<\/h1>)/,m=>m+stamp);body=body.replace('</article>',authorityHtml(p)+escalationHtml(p)+'</article>');return leadership?leadershipBody(body):body;}
function fullDocument(body,title){const style=`body{font:16px/1.8 "Segoe UI",Tahoma,Arial,sans-serif;color:#18383b;margin:28px auto;max-width:1100px;padding:24px}h1,h2,h3{color:#126b5b}section,dl{border-bottom:1px solid #ddd;padding-bottom:14px}dt{font-weight:bold}dd{margin:0 0 10px;white-space:pre-wrap}table{width:100%;border-collapse:collapse;margin:12px 0}td,th{border:1px solid #ddd;padding:8px;text-align:start;vertical-align:top}header{border-bottom:3px solid #c5a95d}.report-extra{margin-top:28px}@media print{body{margin:0;font-size:11px}h2,h3{break-after:avoid}tr{break-inside:avoid}.noPrint{display:none}}`;return `<!doctype html><html lang="${SultanI18n.language}" dir="${SultanI18n.direction}"><meta charset="utf-8"><title>${esc(title)}</title><style>${style}</style><body>${body}</body></html>`;}
function download(name,data,type='text/html;charset=utf-8'){const blob=new Blob([data],{type}),url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download=name;document.body.append(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),3000);}
function exportReport(leadership=false){const p=root.SultanApp.getProject(),body=enhancedReport(p,leadership);download(leadership?'SULTAN_Leadership_Report.html':'SULTAN_Internal_Strategy.html',fullDocument(body,leadership?T('leadershipReport'):T('internalReport')));}
function exportEscalation(){const p=root.SultanApp.getProject();download('SULTAN_Escalation_Pack.html',fullDocument(escalationHtml(p),T('escalationPack')));}

const sectionMap={identity:['institution','mandates'],choices:['options'],references:['references','transitions'],priorities:['criteria','weightRationale'],enablers:['enablers'],roadmap:['initiatives','funding'],review:['reviewNote']};
function exportSection(){const section=currentSection(),keys=sectionMap[section];if(!keys)return;const p=root.SultanApp.getProject(),fragment={kind:'sultan.section.v1',section,baseSchema:p.schema,exportedAt:new Date().toISOString(),data:{}};for(const k of keys)fragment.data[k]=p[k];download(`SULTAN_${section}_section.json`,JSON.stringify(fragment,null,2),'application/json');}
function mergeSection(fragment){if(!fragment||fragment.kind!=='sultan.section.v1'||!sectionMap[fragment.section])throw Error('Invalid SULTAN section file.');const p=root.SultanApp.getProject();for(const k of sectionMap[fragment.section])if(Object.prototype.hasOwnProperty.call(fragment.data||{},k))p[k]=fragment.data[k];root.SultanApp.setProject(p);root.SultanApp.navigate(fragment.section);}
function importSection(){const input=document.createElement('input');input.type='file';input.accept='application/json,.json';input.onchange=()=>{const f=input.files[0];if(!f)return;const r=new FileReader();r.onload=()=>{try{mergeSection(JSON.parse(r.result));}catch(e){alert(e.message);}};r.readAsText(f);};input.click();}
function hasWork(p){return text(p.institution.name)||p.options.length||p.transitions.length||p.enablers.length||p.initiatives.length;}
document.addEventListener('click',e=>{const b=e.target.closest('[data-exec]');if(!b)return;const a=b.dataset.exec;if(a==='internal-report')exportReport(false);if(a==='leadership-report')exportReport(true);if(a==='escalation')exportEscalation();if(a==='section-export')exportSection();if(a==='section-import')importSection();});

/* Native browser back/forward should move through SULTAN sections rather than exit the workspace. */
document.addEventListener('click',e=>{const b=e.target.closest('[data-action="goto"][data-section]');if(!b)return;const target=b.dataset.section;if(target&&target!==currentSection())history.pushState({sultanSection:target},'',location.pathname+location.search+'#'+target);},true);
window.addEventListener('popstate',()=>{const s=currentSection();if(root.SultanApp&&['home','identity','choices','references','priorities','enablers','roadmap','review','about'].includes(s))root.SultanApp.navigate(s);});

function sectionIssues(p,key){return E.check(p).filter(x=>x.section===key).length;}
function renderExportMenu(){
 const host=document.querySelector('.topbar .toolbar');if(!host)return;
 let menu=host.querySelector('.export-menu');
 if(!menu){
  menu=document.createElement('details');menu.className='export-menu';
  menu.innerHTML=`<summary class="btn primary small">${esc(T('exportMenu'))}</summary><div class="export-menu-panel"><button type="button" class="btn small" data-action="report">${esc(T('internalExport'))}</button><button type="button" class="btn small" data-exec="leadership-report">${esc(T('leadershipExport'))}</button><button type="button" class="btn small" data-exec="escalation">${esc(T('escalationExport'))}</button><button type="button" class="btn small" data-action="project">${esc(T('projectDataExport'))}</button><button type="button" class="btn small" data-action="print">${esc(T('printInternal'))}</button></div>`;
  host.append(menu);
 }
 // Remove superseded controls, including controls produced inside localized preview templates.
 document.querySelectorAll('[data-action="report"],[data-action="project"],[data-action="print"],[data-exec="internal-report"],[data-exec="leadership-report"],[data-exec="escalation"]').forEach(b=>{
  if(!menu.contains(b))b.remove();
 });
}
function renderProgress(){
 if(!root.SultanApp)return;
 const p=root.SultanApp.getProject(),nav=document.getElementById('navigation');
 if(nav)for(const btn of nav.querySelectorAll('[data-section]')){
  const key=btn.dataset.section;if(key==='home')continue;
  const n=sectionIssues(p,key);let badge=btn.querySelector('.exec-badge');
  if(!badge){badge=document.createElement('span');badge.className='exec-badge';btn.append(badge);}
  badge.textContent=n?String(n):'✓';badge.dataset.ok=n?'0':'1';
 }
 renderExportMenu();
 const content=document.getElementById('content');
 if(!content||content.querySelector('.exec-toolbar')||['home','about'].includes(currentSection()))return;
 const bar=document.createElement('div');bar.className='exec-toolbar noPrint';
 bar.innerHTML=`<span>${esc(T('executionProgress'))}</span><button type="button" class="btn small" data-exec="section-export">${esc(T('sectionExport'))}</button><button type="button" class="btn small" data-exec="section-import">${esc(T('sectionImport'))}</button>`;
 content.prepend(bar);
}
function printInternal(){
 const w=window.open('','_blank');if(!w){alert(T('printPopupBlocked'));return;}
 w.opener=null;w.document.open();w.document.write(fullDocument(enhancedReport(root.SultanApp.getProject()),T('internalReport')));w.document.close();w.focus();w.print();
}
// The sole strategy action exports the complete internal report, never the legacy partial draft.
document.addEventListener('click',e=>{
 const b=e.target.closest('[data-action="report"],[data-action="print"]');
 if(!b||b.disabled||!root.SultanApp)return;
 e.stopImmediatePropagation();e.preventDefault();
 if(b.dataset.action==='report')exportReport(false);else printInternal();
},true);
function renderBreakEven(){if(currentSection()!=='priorities'||!root.SultanApp)return;const content=document.getElementById('content');if(!content||content.querySelector('.break-even-card'))return;const p=root.SultanApp.getProject(),rows=E.breakEven(p),card=document.createElement('article');card.className='card break-even-card';card.innerHTML=`<h2>${esc(T('breakEvenTitle'))}</h2><p class="muted">${esc(T('breakEvenIntro'))}</p>${rows.length?rows.map(r=>`<p><b>${esc(r.criterion)}</b>: ${r.threshold===null?esc(T('breakEvenNoSwitch')):`${fmt(r.current)}% → ${fmt(r.threshold)}% · ${esc(T('breakEvenSwitch'))}: ${esc(r.newTop)}`}</p>`).join(''):`<p>${esc(T('breakEvenNone'))}</p>`}<div class="sensitivity-lab"><h3>${esc(T('sensitivityLab'))}</h3><p class="muted">${esc(T('sensitivityLabHelp'))}</p>${p.criteria.map(c=>`<label class="sensitivity-row"><span>${esc(c.name)}</span><input type="range" min="0" max="100" step="1" value="${c.weight}" data-sensitivity="${esc(c.id)}"><output>${fmt(c.weight)}%</output></label>`).join('')}<div class="sensitivity-preview"></div></div>`;content.append(card);updateSensitivityPreview(card,p);}
function updateSensitivityPreview(card,p,criterionId=null,w=null){const r=criterionId===null?E.ranking(p):E.rankingAt(p,criterionId,Number(w));const box=card.querySelector('.sensitivity-preview');if(box)box.innerHTML=r.slice(0,5).map((x,i)=>`<div class="rank"><span class="ranknum">${i+1}</span><b>${esc(x.title)}</b><strong>${fmt(x.value)}</strong></div>`).join('')||`<p>${esc(T('s384'))}</p>`;}
document.addEventListener('input',e=>{const slider=e.target.closest('[data-sensitivity]');if(!slider||!root.SultanApp)return;slider.nextElementSibling.textContent=slider.value+'%';const card=slider.closest('.break-even-card');updateSensitivityPreview(card,root.SultanApp.getProject(),slider.dataset.sensitivity,slider.value);});
function renderTimeline(){if(currentSection()!=='roadmap'||!root.SultanApp)return;const content=document.getElementById('content');if(!content||content.querySelector('.exec-timeline'))return;const p=root.SultanApp.getProject(),years=E.years(p),items=E.selectedInitiatives(p);const card=document.createElement('article');card.className='card exec-timeline';card.innerHTML=`<h2>${esc(T('timelineTitle'))}</h2><p class="muted">${esc(T('timelineHelp'))}</p>${items.length?`<div class="timeline-grid" style="--years:${years.length}"><div class="timeline-head"></div>${years.map(y=>`<div class="timeline-head">${y}</div>`).join('')}${items.map(i=>`<div class="timeline-name">${esc(i.title||T('s412'))}</div>${years.map(y=>`<div class="timeline-cell ${y>=i.startYear&&y<=i.endYear?'active':''}" title="${esc(i.title)} · ${y}"></div>`).join('')}`).join('')}</div>`:`<p>${esc(T('timelineEmpty'))}</p>`}`;const heading=content.querySelector('.heading');if(heading)heading.insertAdjacentElement('afterend',card);else content.prepend(card);}
function disableEmptyExport(){if(!root.SultanApp)return;const p=root.SultanApp.getProject(),empty=!hasWork(p);document.querySelectorAll('.export-menu [data-action="report"],.export-menu [data-action="print"],.export-menu [data-exec="leadership-report"],.export-menu [data-exec="escalation"]').forEach(b=>{b.disabled=empty;b.title=empty?T('exportNeedsWork'):'';});}
const western=s=>String(s).replace(/[٠-٩]/g,d=>'٠١٢٣٤٥٦٧٨٩'.indexOf(d));
function normalizeStatusDigits(){const el=document.getElementById('saveStatus');if(el&&/[٠-٩]/.test(el.textContent))el.textContent=western(el.textContent);}
function afterRender(){setTimeout(()=>{renderProgress();renderBreakEven();renderTimeline();disableEmptyExport();normalizeStatusDigits();},0);}
document.addEventListener('sultan:render',afterRender);new MutationObserver(normalizeStatusDigits).observe(document.getElementById('saveStatus'),{childList:true,subtree:true,characterData:true});afterRender();
})(globalThis);
