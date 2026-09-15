/* SULTAN final programmatic upgrades: structured fields, dashboards, executive summary and client deliverables. */
(function(root){
'use strict';
const E=root.Sultan,T=root.SultanI18n.t;
if(!E||!root.SultanApp)return;
const esc=x=>String(x??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const num=x=>typeof x==='number'&&Number.isFinite(x);
const text=x=>typeof x==='string'&&x.trim().length>0;
const money=x=>num(x)?Math.round(x).toLocaleString('en-US'):'—';
const currentSection=()=>location.hash.slice(1)||'home';
const download=(name,data,type)=>{const blob=data instanceof Blob?data:new Blob([data],{type}),url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download=name;document.body.append(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),3000);};
function field(label,path,value,type='text',help='',attrs=''){
 const id='final_'+path.replace(/[^A-Za-z0-9_-]+/g,'_');
 const control=type==='textarea'?`<textarea id="${id}" data-path="${esc(path)}" rows="3" ${attrs}>${esc(value??'')}</textarea>`:type==='select'?`<select id="${id}" data-path="${esc(path)}" ${attrs}>${help}</select>`:`<input id="${id}" data-path="${esc(path)}" type="${type}" value="${esc(value??'')}" ${attrs}>`;
 return `<label class="field final-field" for="${id}"><span>${esc(label)}</span>${control}${type==='select'?'':help?`<span class="help">${esc(help)}</span>`:''}<span class="field-error" hidden></span></label>`;
}
const optionHtml=(value,label,selected)=>`<option value="${esc(value)}" ${String(selected)===String(value)?'selected':''}>${esc(label)}</option>`;
function touchProject(p){p.revision=(Number.isInteger(p.revision)?p.revision:0)+1;p.updatedAt=new Date().toISOString();p.reviewedRevision=null;return p;}
function setProject(p,section){touchProject(p);root.SultanApp.setProject(p);if(section)root.SultanApp.navigate(section);}

/* Cache validation once per render/edit state. This removes seven repeated check() passes in navigation rendering. */
(function memoizeCheck(){const base=E.check;let key='',result=[];E.check=function(p){const k=[p?.revision,p?.updatedAt,p?.options?.length,p?.initiatives?.length,p?.transitions?.length].join('|');if(k===key)return result.slice();key=k;result=base(p);return result.slice();};})();

function renderRecovery(){
 const r=root.SultanRecovery;if(!r?.pending)return;
 let banner=document.querySelector('.recovery-lock');
 if(!banner){banner=document.createElement('section');banner.className='recovery-lock';banner.setAttribute('role','alert');document.body.prepend(banner);}
 banner.innerHTML=`<div><b>${esc(T('recoveryTitle'))}</b><p>${esc(T('recoveryMessage'))}</p><small>${esc(T('recoveryLocked'))}</small></div><div class="recovery-actions"><button class="btn" type="button" data-final-action="recovery-download">${esc(T('recoveryDownload'))}</button><button class="btn primary" type="button" data-final-action="recovery-new">${esc(T('recoveryNew'))}</button></div>`;
 document.querySelectorAll('.shell input,.shell textarea,.shell select,.shell button').forEach(el=>{if(!el.closest('.recovery-lock'))el.disabled=true;});
 const status=document.getElementById('saveStatus');if(status)status.textContent=T('recoveryLocked');
}
function renderVersion(){const foot=document.querySelector('.sidefoot');if(foot&&!foot.querySelector('.final-version'))foot.insertAdjacentHTML('afterbegin',`<span class="final-version">${esc(T('versionLabel'))} 0.7.4</span><br>`);}

function renderIdentity(){
 if(currentSection()!=='identity')return;const p=root.SultanApp.getProject(),content=document.getElementById('content');if(!content)return;
 const first=content.querySelector('article.card');if(first&&!first.querySelector('[data-path="institution.liabilities"]')){
  const assets=first.querySelector('[data-path="institution.assets"]')?.closest('.field');
  const html=field(T('liabilities'),'institution.liabilities',p.institution.liabilities,'textarea',T('liabilitiesHelp'));
  if(assets)assets.insertAdjacentHTML('afterend',html);else first.insertAdjacentHTML('beforeend',html);
 }
 const empty=!text(p.institution.name)&&!text(p.institution.mission)&&!text(p.institution.beneficiaries)&&!text(p.institution.vision);
 if(empty&&first&&!first.querySelector('.identity-starter')){
  const starter=document.createElement('div');starter.className='identity-starter';starter.innerHTML=`<h3>${esc(T('identityStarter'))}</h3><div class="starter-grid"></div>`;
  const grid=starter.querySelector('.starter-grid');
  for(const path of ['institution.mission','institution.beneficiaries','institution.endYear']){const f=first.querySelector(`[data-path="${path}"]`)?.closest('.field');if(f)grid.append(f);}
  const details=document.createElement('details');details.className='identity-more';details.innerHTML=`<summary>${esc(T('identityMore'))}</summary><div class="identity-more-body"></div>`;
  const body=details.querySelector('.identity-more-body');Array.from(first.children).filter(x=>x.classList?.contains('grid2')).forEach(g=>{while(g.firstChild)body.append(g.firstChild);g.remove();});
  first.prepend(details);first.prepend(starter);
 }
}

function renderChoices(){
 if(currentSection()!=='choices')return;const p=root.SultanApp.getProject(),content=document.getElementById('content');if(!content)return;
 const cards=Array.from(content.querySelectorAll('article.card')).slice(0,p.options.length);
 cards.forEach((card,i)=>{
  const o=p.options[i],typeSelect=card.querySelector(`[data-path="options.${i}.type"]`);
  if(typeSelect&&!typeSelect.querySelector('option[value="divest"]'))typeSelect.insertAdjacentHTML('beforeend',optionHtml('divest',T('divest'),o.type));
  if(o.type==='requirement'&&!card.querySelector('.requirement-note'))card.insertAdjacentHTML('afterbegin',`<p class="hint requirement-note">${esc(T('requirementRankNote'))}</p>`);
  if(!card.querySelector('.final-choice-fields')){
   const box=document.createElement('div');box.className='final-choice-fields';let html='';
   if(o.type==='moonshot')html+=field(T('moonshotStopEvidence'),'options.'+i+'.stopEvidence',o.stopEvidence,'textarea',T('moonshotStopEvidenceHelp'));
   if(o.type==='divest')html+=`<div class="final-feature"><p class="hint">${esc(T('divestHelp'))}</p><div class="grid2">${field(T('divestStop'),`options.${i}.divestStop`,o.divestStop,'textarea')}${field(T('divestResources'),`options.${i}.releasedResources`,o.releasedResources,'number',T('releasedResources'),'min="0" step="any"')}${field(T('divestRedeploy'),`options.${i}.redeployTo`,o.redeployTo,'textarea')}${field(T('divestEvidence'),`options.${i}.divestEvidence`,o.divestEvidence,'textarea')}${field(T('divestImpact'),`options.${i}.divestImpact`,o.divestImpact,'textarea')}</div></div>`;
   if(o.type!=='requirement')html+=`<div class="grid2">${field(T('riskSource'),`options.${i}.riskSource`,o.riskSource,'textarea')}${field(T('riskDate'),`options.${i}.riskDate`,o.riskDate,'date')}</div>`;
   html+=`<section class="assumption-register final-feature"><div class="feature-head"><h3>${esc(T('assumptionRegister2'))}</h3><button type="button" class="btn small" data-final-action="assumption-add" data-option="${i}">${esc(T('assumptionAdd'))}</button></div>${(o.assumptions||[]).map((a,j)=>`<details open class="assumption-item"><summary>${esc(a.text||T('assumptionText'))}</summary><div class="grid2">${field(T('assumptionText'),`options.${i}.assumptions.${j}.text`,a.text,'textarea')}${field(T('assumptionDuration'),`options.${i}.assumptions.${j}.expectedPersistence`,a.expectedPersistence)}${field(T('assumptionOwner'),`options.${i}.assumptions.${j}.owner`,a.owner)}${field(T('assumptionTestDate'),`options.${i}.assumptions.${j}.testDate`,a.testDate,'date')}${field(T('assumptionEvidence'),`options.${i}.assumptions.${j}.testEvidence`,a.testEvidence,'textarea')}${field(T('assumptionFailure'),`options.${i}.assumptions.${j}.failureImpact`,a.failureImpact,'textarea')}</div><button type="button" class="btn small danger" data-final-action="assumption-remove" data-option="${i}" data-assumption="${j}">×</button></details>`).join('')}</section>`;
   box.innerHTML=html;card.append(box);
  }
 });
}

function renderReferences(){
 if(currentSection()!=='references')return;const p=root.SultanApp.getProject(),content=document.getElementById('content');if(!content)return;
 for(let i=0;i<p.transitions.length;i++){
  const t=p.transitions[i],dir=content.querySelector(`[data-path="transitions.${i}.direction"]`);
  if(dir&&!dir.querySelector('option[value="delta"]'))dir.insertAdjacentHTML('beforeend',optionHtml('delta',T('delta'),t.direction));
  const card=dir?.closest('article.card');if(!card||card.querySelector('.final-transition-fields'))continue;
  const box=document.createElement('div');box.className='final-transition-fields final-feature';
  box.innerHTML=`<div class="grid3">${field(T('maturity'),'transitions.'+i+'.trackType',t.trackType,'select',optionHtml('outcome',T('dashboardProgress'),t.trackType)+optionHtml('maturity',T('maturity'),t.trackType))}${field(T('maturityFamily'),'transitions.'+i+'.maturityFamily',t.maturityFamily)}${field(T('indicatorType'),'transitions.'+i+'.indicatorType',t.indicatorType,'select',optionHtml('performance',T('indicatorPerformance'),t.indicatorType)+optionHtml('risk',T('indicatorRisk'),t.indicatorType))}</div>${t.direction==='delta'&&num(t.baseline)&&num(t.target)?`<p class="hint">${esc(T('deltaAbsolute'))}: <b>${money(t.baseline+t.target)}</b> ${esc(t.unit||'')}</p>`:''}${t.trackType==='maturity'?`<p class="hint">${esc(T('dashboardMaturity'))}: ${money(t.baseline)} → ${money(t.target)} / 5</p>`:''}`;
  card.append(box);
 }
 const heading=content.querySelector('.heading');if(heading&&!content.querySelector('.route-initiative-note'))heading.insertAdjacentHTML('afterend',`<p class="hint route-initiative-note">${esc(T('routeVsInitiative'))}</p>`);
}

function renderRoadmap(){
 if(currentSection()!=='roadmap')return;const p=root.SultanApp.getProject(),content=document.getElementById('content');if(!content)return;
 p.initiatives.forEach((i,ix)=>{
  if(i.kind!=='learn')return;
  i.budget.forEach((b,bx)=>{
   if(b.year<i.startYear||b.year>i.endYear)return;
   const amount=content.querySelector(`[data-path="initiatives.${ix}.budget.${bx}.amount"]`);if(!amount)return;const host=amount.closest('.field');if(host?.nextElementSibling?.classList?.contains('release-evidence-field'))return;
   host.insertAdjacentHTML('afterend',field(T('releaseEvidence'),`initiatives.${ix}.budget.${bx}.releaseEvidence`,b.releaseEvidence,'textarea').replace('final-field','final-field release-evidence-field'));
  });
 });
}

function sectionCollaboration(){
 const section=currentSection();if(['home','about'].includes(section))return;const p=root.SultanApp.getProject(),content=document.getElementById('content');if(!content||content.querySelector('.collaboration-bar'))return;
 const bar=document.createElement('section');bar.className='collaboration-bar noPrint';const owner=p.collaboration?.owners?.[section]||'';
 bar.innerHTML=`<div><b>${esc(T('workshopOwner'))}</b><input type="text" data-final-owner="${esc(section)}" value="${esc(owner)}" placeholder="${esc(T('workshopAssign'))}"></div><div class="contribution-entry"><input type="text" data-final-contributor placeholder="${esc(T('workshopContributor'))}"><input type="text" data-final-note placeholder="${esc(T('workshopContribution'))}"><button type="button" class="btn small" data-final-action="contribution-add" data-section="${esc(section)}">+</button></div></section>`;
 content.prepend(bar);
}

function executiveMetrics(p){
 const selected=new Set(p.options.filter(o=>o.decision==='select').map(o=>o.id)),ens=p.enablers.filter(e=>selected.has(e.optionId)),pending=ens.filter(e=>e.status!=='ready'),external=pending.filter(e=>['external','shared','unknown'].includes(e.control)),due=pending.filter(e=>Number.isInteger(e.dueYear)).map(e=>e.dueYear),blockedOpts=new Set(ens.filter(e=>e.status==='blocked').map(e=>e.optionId)),fund=E.budgetSummary(p),gap=fund.reduce((s,b)=>s+(num(b.gap)?b.gap:0),0);
 return {decisions:pending.length,external:external.length,nextDue:due.length?Math.min(...due):null,blocked:blockedOpts.size,gap};
}
function executiveSummaryHtml(p){const m=executiveMetrics(p);return `<section class="executive-summary" data-report-section="executive"><h2>${esc(T('executiveSummary'))}</h2><div class="executive-grid"><div><span>${esc(T('summaryDecisions'))}</span><strong>${m.decisions}</strong></div><div><span>${esc(T('summaryExternal'))}</span><strong>${m.external}</strong></div><div><span>${esc(T('summaryNextDue'))}</span><strong>${m.nextDue??'—'}</strong></div><div><span>${esc(T('summaryBlocked'))}</span><strong>${m.blocked}</strong></div><div><span>${esc(T('summaryFundingGap'))}</span><strong>${money(m.gap)}</strong></div></div><p class="report-principle">${esc(T('noSingleScore'))}</p><p><b>${esc(T('documentNumber'))} ${p.documentNumber}</b> · ${esc(T('editRevision'))} ${p.revision}</p></section>`;}
function collaborationHtml(p){const rows=p.collaboration?.contributions||[];if(!rows.length&&!Object.values(p.collaboration?.owners||{}).some(text))return '';return `<section class="collaboration-report"><h2>${esc(T('workshopLog'))}</h2><dl>${Object.entries(p.collaboration?.owners||{}).filter(([,v])=>text(v)).map(([k,v])=>`<dt>${esc(k)}</dt><dd>${esc(v)}</dd>`).join('')}</dl>${rows.map(r=>`<p><b>${esc(r.name||'—')}</b> · ${esc(r.section)} · ${esc(r.at)}<br>${esc(r.note)}</p>`).join('')}</section>`;}
function extensionsReportHtml(p){return `<section class="extension-report"><h2>SULTAN decision extensions</h2>${text(p.institution.liabilities)?`<h3>${esc(T('liabilities'))}</h3><p>${esc(p.institution.liabilities)}</p>`:''}${p.options.map(o=>{let h='';if(o.type==='divest')h+=`<h3>${esc(o.title)} · ${esc(T('divest'))}</h3><dl><dt>${esc(T('divestStop'))}</dt><dd>${esc(o.divestStop)}</dd><dt>${esc(T('divestResources'))}</dt><dd>${money(o.releasedResources)}</dd><dt>${esc(T('divestRedeploy'))}</dt><dd>${esc(o.redeployTo)}</dd><dt>${esc(T('divestEvidence'))}</dt><dd>${esc(o.divestEvidence)}</dd><dt>${esc(T('divestImpact'))}</dt><dd>${esc(o.divestImpact)}</dd></dl>`;if(o.type==='moonshot'&&text(o.stopEvidence))h+=`<h3>${esc(o.title)} · ${esc(T('moonshotStopEvidence'))}</h3><p>${esc(o.stopEvidence)}</p>`;if((o.assumptions||[]).length)h+=`<h3>${esc(o.title)} · ${esc(T('assumptionRegister2'))}</h3>${o.assumptions.map(a=>`<dl><dt>${esc(T('assumptionText'))}</dt><dd>${esc(a.text)}</dd><dt>${esc(T('assumptionDuration'))}</dt><dd>${esc(a.expectedPersistence)}</dd><dt>${esc(T('assumptionOwner'))}</dt><dd>${esc(a.owner)}</dd><dt>${esc(T('assumptionTestDate'))}</dt><dd>${esc(a.testDate)}</dd><dt>${esc(T('assumptionEvidence'))}</dt><dd>${esc(a.testEvidence)}</dd><dt>${esc(T('assumptionFailure'))}</dt><dd>${esc(a.failureImpact)}</dd></dl>`).join('');return h;}).join('')}</section>`;}

/* Wrap the report after all legacy modules: executive decision summary is now first, and extension fields reach leadership. */
const baseGetReport=root.SultanApp.getReport.bind(root.SultanApp);
root.SultanApp.getReport=function(){const p=root.SultanApp.getProject();let html=baseGetReport();const extra=executiveSummaryHtml(p)+extensionsReportHtml(p)+collaborationHtml(p);const ix=html.indexOf('</header>');return ix>=0?html.slice(0,ix+9)+extra+html.slice(ix+9):extra+html;};

function svgPath(t,p){
 const years=E.years(p),vals=[];if(num(t.baseline))vals.push(t.baseline);for(const a of t.annual){const trg=t.direction==='delta'&&num(t.baseline)&&num(a.target)?t.baseline+a.target:a.target;if(num(trg))vals.push(trg);if(num(a.actual))vals.push(a.actual);}if(!vals.length)return `<p>${esc(T('noData'))}</p>`;
 const min=Math.min(...vals),max=Math.max(...vals),span=max-min||1,w=620,h=150,x=i=>30+i*((w-60)/Math.max(1,years.length)),y=v=>h-25-((v-min)/span)*(h-50),targets=t.annual.map((a,i)=>{const v=t.direction==='delta'&&num(t.baseline)&&num(a.target)?t.baseline+a.target:a.target;return num(v)?[x(i+1),y(v)]:null;}).filter(Boolean),actual=t.annual.map((a,i)=>num(a.actual)?[x(i+1),y(a.actual)]:null).filter(Boolean),baseline=num(t.baseline)?[x(0),y(t.baseline)]:null;
 const pts=a=>a.map(q=>q.join(',')).join(' ');return `<svg viewBox="0 0 ${w} ${h}" class="track-svg" role="img" aria-label="${esc(t.kpi||t.domain)}">${baseline?`<circle cx="${baseline[0]}" cy="${baseline[1]}" r="5" class="baseline-dot"></circle>`:''}<polyline points="${pts([...(baseline?[baseline]:[]),...targets])}" class="target-line"></polyline>${actual.length?`<polyline points="${pts([...(baseline?[baseline]:[]),...actual])}" class="actual-line"></polyline>`:''}${years.map((yr,i)=>`<text x="${x(i+1)}" y="145" text-anchor="middle">${yr}</text>`).join('')}</svg>`;
}
function fundingSvg(p){const rows=E.budgetSummary(p),max=Math.max(1,...rows.flatMap(r=>[r.declared||0,r.available||0]));return `<div class="funding-bars">${rows.map(r=>`<div class="funding-year"><b>${r.year}</b><span class="bar declared" style="--w:${Math.round((r.declared/max)*100)}%"><i>${money(r.declared)}</i></span><span class="bar available" style="--w:${Math.round(((r.available||0)/max)*100)}%"><i>${r.available==null?'—':money(r.available)}</i></span><small>${r.unknown?`${r.unknown} × ${esc(T('noReading'))}`:''}${num(r.gap)&&r.gap>0?` · ${esc(T('summaryFundingGap'))}: ${money(r.gap)}`:''}</small></div>`).join('')}</div>`;}
function authorityBar(p){const selected=new Set(p.options.filter(o=>o.decision==='select').map(o=>o.id)),ens=p.enablers.filter(e=>selected.has(e.optionId)),counts={ready:0,pending:0,blocked:0,unknown:0};for(const e of ens){if(e.status==='ready')counts.ready++;else if(e.status==='pending')counts.pending++;else if(e.status==='blocked')counts.blocked++;else counts.unknown++;}const n=Math.max(1,ens.length),due=ens.filter(e=>e.status!=='ready'&&Number.isInteger(e.dueYear)).map(e=>e.dueYear);return `<div class="authority-stack">${Object.entries(counts).map(([k,v])=>`<span class="${k}" style="--w:${(v/n)*100}%" title="${k}: ${v}"></span>`).join('')}</div><p>${esc(T('summaryNextDue'))}: <b>${due.length?Math.min(...due):'—'}</b></p>`;}
function timeline(p){const years=E.years(p),items=E.selectedInitiatives(p);return `<div class="dashboard-timeline" style="--years:${years.length}"><div></div>${years.map(y=>`<b>${y}</b>`).join('')}${items.map(i=>`<span>${esc(i.title)}</span>${years.map(y=>`<i class="${y>=i.startYear&&y<=i.endYear?'active':''}"></i>`).join('')}`).join('')}</div>`;}
function renderDashboard(){
 if(currentSection()!=='review')return;const content=document.getElementById('content');if(!content||content.querySelector('.final-dashboard'))return;const p=root.SultanApp.getProject(),selected=new Set(p.options.filter(o=>o.decision==='select').map(o=>o.id)),trs=p.transitions.filter(t=>selected.has(t.optionId)),maturity=trs.filter(t=>t.trackType==='maturity'),risks=trs.filter(t=>t.indicatorType==='risk');
 const card=document.createElement('article');card.className='card final-dashboard';card.innerHTML=`<h2>${esc(T('dashboardTitle'))}</h2><p class="muted">${esc(T('dashboardIntro'))}</p><div class="dashboard-grid"><section><h3>${esc(T('dashboardProgress'))}</h3>${trs.filter(t=>t.trackType!=='maturity'&&t.indicatorType!=='risk').map(t=>`<div class="track-card"><div><b>${esc(t.kpi||t.domain)}</b>${(()=>{const a=[...t.annual].reverse().find(a=>num(a.actual));const s=a?E.indicatorStatus(t,a):'noReading';return `<span class="status ${s}">${esc(T(s))}</span>`;})()}</div>${svgPath(t,p)}</div>`).join('')||`<p>${esc(T('noData'))}</p>`}</section><section><h3>${esc(T('dashboardFunding'))}</h3>${fundingSvg(p)}</section><section><h3>${esc(T('dashboardAuthority'))}</h3>${authorityBar(p)}</section><section><h3>${esc(T('dashboardTimeline'))}</h3>${timeline(p)}</section>${maturity.length?`<section><h3>${esc(T('dashboardMaturity'))}</h3>${maturity.map(t=>`<p><b>${esc(t.maturityFamily||t.domain)}</b> · ${money(t.baseline)} → ${money(t.target)} / 5</p>`).join('')}</section>`:''}${risks.length?`<section><h3>${esc(T('dashboardRisk'))}</h3>${risks.map(t=>{const a=[...t.annual].reverse().find(a=>num(a.actual)),s=a?E.indicatorStatus(t,a):'noReading';return `<p><b>${esc(t.kpi||t.domain)}</b> <span class="status ${s}">${esc(T(s))}</span></p>`;}).join('')}</section>`:''}</div>`;
 const heading=content.querySelector('.heading');if(heading)heading.insertAdjacentElement('afterend',card);else content.prepend(card);
 content.querySelectorAll('.reportPreview h1').forEach(h=>{const h2=document.createElement('h2');h2.innerHTML=h.innerHTML;for(const a of h.attributes)h2.setAttribute(a.name,a.value);h.replaceWith(h2);});
}

function renderExecutiveCard(){if(currentSection()!=='review')return;const content=document.getElementById('content');if(!content||content.querySelector('.review-executive'))return;const p=root.SultanApp.getProject(),box=document.createElement('article');box.className='card review-executive';box.innerHTML=executiveSummaryHtml(p);const dash=content.querySelector('.final-dashboard');if(dash)dash.insertAdjacentElement('beforebegin',box);else content.prepend(box);}

function fullDocument(body,title){return `<!doctype html><html lang="${root.SultanI18n.language}" dir="${root.SultanI18n.direction}"><meta charset="utf-8"><title>${esc(title)}</title><style>body{font:16px/1.8 Tahoma,Arial,sans-serif;color:#0b2d63;margin:28px auto;max-width:1080px;padding:26px}h1,h2,h3{color:#0b2d63}header{border-bottom:3px solid #caa85e}.executive-grid{display:grid;grid-template-columns:repeat(5,1fr);gap:10px}.executive-grid>div{border:1px solid #d9e0ea;padding:12px}.executive-grid span{display:block;font-size:12px;color:#667}.executive-grid strong{font-size:22px;color:#b18a3b}table{width:100%;border-collapse:collapse}td,th{padding:8px;border:1px solid #ddd;vertical-align:top;text-align:start}dl{display:grid;grid-template-columns:180px 1fr;gap:7px 14px}dt{font-weight:bold}dd{margin:0}.report-principle{padding:10px 14px;background:#f5f0e5;border-inline-start:4px solid #caa85e}@media print{body{margin:0;font-size:11px}h2,h3{break-after:avoid}tr{break-inside:avoid}}</style><body>${body}</body></html>`;}
function escalationBody(p){const items=E.authorityEscalationItems?E.authorityEscalationItems(p):[],m=executiveMetrics(p);return `<article><header><h1>${esc(T('exportEscalation'))}</h1><p>${esc(p.institution.name||'SULTAN')}</p></header>${executiveSummaryHtml(p)}<table><thead><tr><th>${esc(T('summaryExternal'))}</th><th>${esc(T('workshopOwner'))}</th><th>${esc(T('summaryNextDue'))}</th><th>Route</th><th>Fallback</th></tr></thead><tbody>${items.map(x=>`<tr><td>${esc(x.choice)} — ${esc(x.title)}</td><td>${esc(x.owner||'—')}</td><td>${x.dueYear??'—'}</td><td>${esc(x.route||'—')}</td><td>${esc(x.fallback||'—')}</td></tr>`).join('')}</tbody></table><p>${esc(T('summaryDecisions'))}: ${m.decisions}</p></article>`;}
function reportBody(kind,p){if(kind==='escalation')return escalationBody(p);let body=root.SultanApp.getReport();if(kind==='leadership'){const doc=new DOMParser().parseFromString(body,'text/html');doc.querySelectorAll('.issue,[data-report-section="issues"]').forEach(x=>x.remove());body=doc.body.innerHTML;}return body;}
function incrementDoc(){const p=root.SultanApp.getProject();E.nextDocumentNumber(p);touchProject(p);root.SultanApp.setProject(p);return root.SultanApp.getProject();}
function exportHtml(kind){const p=incrementDoc(),body=reportBody(kind,p),label=kind==='strategy'?T('exportStrategy'):kind==='leadership'?T('exportLeadership'):T('exportEscalation');download(`SULTAN_${kind}_D${p.documentNumber}.html`,fullDocument(body,label),'text/html;charset=utf-8');}
function exportWord(kind){const p=incrementDoc(),body=reportBody(kind,p),label=kind==='strategy'?T('exportStrategy'):kind==='leadership'?T('exportLeadership'):T('exportEscalation');const doc=fullDocument(body,label).replace('<html','<html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:w="urn:schemas-microsoft-com:office:word"');download(`SULTAN_${kind}_D${p.documentNumber}.doc`,doc,'application/msword;charset=utf-8');}

/* Rasterize the self-contained report into real PDF pages. Browser text shaping is preserved, including Arabic. */
const bytes=s=>new TextEncoder().encode(s);
function joinBytes(parts){const n=parts.reduce((s,a)=>s+a.length,0),out=new Uint8Array(n);let o=0;for(const a of parts){out.set(a,o);o+=a.length;}return out;}
function dataUrlBytes(url){const b=atob(url.split(',')[1]),a=new Uint8Array(b.length);for(let i=0;i<b.length;i++)a[i]=b.charCodeAt(i);return a;}
function makePdf(images){
 const objs=[],pageIds=[],imgIds=[],contentIds=[];let next=3;for(let i=0;i<images.length;i++){pageIds.push(next++);imgIds.push(next++);contentIds.push(next++);}objs[1]=bytes('<< /Type /Catalog /Pages 2 0 R >>');objs[2]=bytes(`<< /Type /Pages /Count ${images.length} /Kids [${pageIds.map(id=>id+' 0 R').join(' ')}] >>`);
 images.forEach((im,i)=>{const p=pageIds[i],img=imgIds[i],c=contentIds[i],stream=`q\n595 0 0 842 0 0 cm\n/Im${i} Do\nQ\n`;objs[p]=bytes(`<< /Type /Page /Parent 2 0 R /MediaBox [0 0 595 842] /Resources << /XObject << /Im${i} ${img} 0 R >> >> /Contents ${c} 0 R >>`);objs[img]=joinBytes([bytes(`<< /Type /XObject /Subtype /Image /Width ${im.w} /Height ${im.h} /ColorSpace /DeviceRGB /BitsPerComponent 8 /Filter /DCTDecode /Length ${im.data.length} >>\nstream\n`),im.data,bytes('\nendstream')]);objs[c]=bytes(`<< /Length ${stream.length} >>\nstream\n${stream}endstream`);});
 const parts=[bytes('%PDF-1.4\n%\xE2\xE3\xCF\xD3\n')],offset=[0,0];let pos=parts[0].length;for(let i=1;i<objs.length;i++){offset[i]=pos;const a=bytes(`${i} 0 obj\n`),b=bytes('\nendobj\n');parts.push(a,objs[i],b);pos+=a.length+objs[i].length+b.length;}const xref=pos;let x=`xref\n0 ${objs.length}\n0000000000 65535 f \n`;for(let i=1;i<objs.length;i++)x+=String(offset[i]).padStart(10,'0')+' 00000 n \n';x+=`trailer\n<< /Size ${objs.length} /Root 1 0 R >>\nstartxref\n${xref}\n%%EOF`;parts.push(bytes(x));return new Blob(parts,{type:'application/pdf'});
}
async function htmlPages(body,title){
 const host=document.createElement('div');host.className='pdf-render-host';host.innerHTML=fullDocument(body,title).match(/<body>([\s\S]*)<\/body>/)?.[1]||body;document.body.append(host);await new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(r)));
 const width=794,pageH=1123,total=Math.max(pageH,host.scrollHeight),pages=Math.ceil(total/pageH),styles=`body{margin:0;font:16px/1.8 Tahoma,Arial,sans-serif;color:#0b2d63;background:white}.pageclip{position:relative;width:${width}px;height:${pageH}px;overflow:hidden}.content{width:${width}px;transform:translateY(VARpx)}h1,h2,h3{color:#0b2d63}table{width:100%;border-collapse:collapse}td,th{border:1px solid #ddd;padding:8px}dl{display:grid;grid-template-columns:180px 1fr;gap:6px 12px}.executive-grid{display:grid;grid-template-columns:repeat(5,1fr);gap:8px}.executive-grid>div{border:1px solid #ddd;padding:8px}`,
 html=host.innerHTML,images=[];
 for(let i=0;i<pages;i++){const pageStyle=styles.replace('VAR',String(-i*pageH));const svg=`<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${pageH}"><foreignObject width="100%" height="100%"><div xmlns="http://www.w3.org/1999/xhtml" class="pageclip"><style>${pageStyle}</style><div class="content">${html}</div></div></foreignObject></svg>`;const url=URL.createObjectURL(new Blob([svg],{type:'image/svg+xml;charset=utf-8'})),img=new Image();await new Promise((resolve,reject)=>{img.onload=resolve;img.onerror=reject;img.src=url;});const canvas=document.createElement('canvas');canvas.width=width*1.4;canvas.height=pageH*1.4;const ctx=canvas.getContext('2d');ctx.fillStyle='#fff';ctx.fillRect(0,0,canvas.width,canvas.height);ctx.drawImage(img,0,0,canvas.width,canvas.height);URL.revokeObjectURL(url);images.push({data:dataUrlBytes(canvas.toDataURL('image/jpeg',0.88)),w:canvas.width,h:canvas.height});}
 host.remove();return images;
}
async function exportPdf(kind,button){const p=incrementDoc(),body=reportBody(kind,p),label=kind==='strategy'?T('exportStrategy'):kind==='leadership'?T('exportLeadership'):T('exportEscalation');if(button){button.disabled=true;button.dataset.oldText=button.textContent;button.textContent='…';}try{const imgs=await htmlPages(body,label);download(`SULTAN_${kind}_D${p.documentNumber}.pdf`,makePdf(imgs),'application/pdf');}catch(e){console.error(e);alert(String(e.message||e));}finally{if(button){button.disabled=false;button.textContent=button.dataset.oldText||T('exportPdf');}}}

function renderExportTools(){const menu=document.querySelector('.export-menu-panel');if(!menu||menu.querySelector('.final-deliverables'))return;const box=document.createElement('div');box.className='final-deliverables';box.innerHTML=`<b>Client deliverables</b>${['strategy','leadership','escalation'].map(k=>`<div class="deliverable-row"><span>${esc(k==='strategy'?T('exportStrategy'):k==='leadership'?T('exportLeadership'):T('exportEscalation'))}</span><button type="button" class="btn small" data-final-export="${k}" data-format="html">${esc(T('exportHtml'))}</button><button type="button" class="btn small" data-final-export="${k}" data-format="word">${esc(T('exportWord'))}</button><button type="button" class="btn small" data-final-export="${k}" data-format="pdf">${esc(T('exportPdf'))}</button></div>`).join('')}`;menu.append(box);}

/* Upgrade distributed section export/import to carry ownership and contribution provenance. */
const sectionMap={identity:['institution','mandates'],choices:['options'],references:['references','transitions'],priorities:['criteria','weightRationale'],enablers:['enablers'],roadmap:['initiatives','funding'],review:['reviewNote']};
function exportSection2(){const s=currentSection(),keys=sectionMap[s];if(!keys)return;const p=root.SultanApp.getProject(),data={kind:'sultan.section.v2',section:s,baseSchema:p.schema,exportedAt:new Date().toISOString(),owner:p.collaboration?.owners?.[s]||'',contributions:(p.collaboration?.contributions||[]).filter(x=>x.section===s),data:{}};for(const k of keys)data.data[k]=p[k];download(`SULTAN_${s}_section_v2.json`,JSON.stringify(data,null,2),'application/json;charset=utf-8');}
function importSection2(){const input=document.createElement('input');input.type='file';input.accept='.json,application/json';input.onchange=()=>{const f=input.files[0];if(!f)return;const r=new FileReader();r.onload=()=>{try{const x=JSON.parse(r.result);if(x.kind!=='sultan.section.v2'||!sectionMap[x.section])throw Error('Invalid SULTAN section file.');const p=root.SultanApp.getProject();for(const k of sectionMap[x.section])if(Object.prototype.hasOwnProperty.call(x.data||{},k))p[k]=x.data[k];p.collaboration=p.collaboration||{owners:{},contributions:[]};p.collaboration.owners[x.section]=String(x.owner||'');p.collaboration.contributions=[...(p.collaboration.contributions||[]),...(x.contributions||[])].slice(-250);setProject(p,x.section);}catch(e){alert(String(e.message||e));}};r.readAsText(f);};input.click();}

/* Sensitivity sliders use the render snapshot instead of deep-cloning the project for every pixel. */
document.addEventListener('input',e=>{const slider=e.target.closest('[data-sensitivity]');if(!slider)return;e.stopImmediatePropagation();const card=slider.closest('.break-even-card');if(!card)return;const p=card.__finalProject||root.SultanApp.getProject();card.__finalProject=p;slider.nextElementSibling.textContent=slider.value+'%';const r=E.rankingAt(p,slider.dataset.sensitivity,Number(slider.value)),box=card.querySelector('.sensitivity-preview');if(box)box.innerHTML=r.slice(0,5).map((x,i)=>`<div class="rank"><span class="ranknum">${i+1}</span><b>${esc(x.title)}</b><strong>${money(x.value)}</strong></div>`).join('');},true);

/* Capture upgraded controls before legacy listeners. */
document.addEventListener('click',e=>{
 const b=e.target.closest('[data-final-action],[data-final-export],[data-exec="section-export"],[data-exec="section-import"],[data-action="report"],[data-exec="leadership-report"],[data-exec="escalation"],[data-action="reviewed"]');if(!b)return;
 if(b.matches('[data-exec="section-export"]')){e.preventDefault();e.stopImmediatePropagation();exportSection2();return;}
 if(b.matches('[data-exec="section-import"]')){e.preventDefault();e.stopImmediatePropagation();importSection2();return;}
 if(b.matches('[data-action="report"]')){e.preventDefault();e.stopImmediatePropagation();exportHtml('strategy');return;}
 if(b.matches('[data-exec="leadership-report"]')){e.preventDefault();e.stopImmediatePropagation();exportHtml('leadership');return;}
 if(b.matches('[data-exec="escalation"]')){e.preventDefault();e.stopImmediatePropagation();exportHtml('escalation');return;}
 if(b.matches('[data-action="reviewed"]')){e.preventDefault();e.stopImmediatePropagation();const p=root.SultanApp.getProject();p.reviewedRevision=p.revision;E.nextDocumentNumber(p);touchProject(p);p.reviewedRevision=p.revision;root.SultanApp.setProject(p);return;}
 const a=b.dataset.finalAction;if(a==='recovery-download'){root.SultanRecovery?.download();return;}if(a==='recovery-new'){document.querySelector('.recovery-lock')?.remove();root.SultanRecovery?.startNew();location.reload();return;}
 if(a==='assumption-add'){const p=root.SultanApp.getProject(),i=Number(b.dataset.option);p.options[i].assumptions=p.options[i].assumptions||[];p.options[i].assumptions.push({id:E.uid('asm'),text:'',expectedPersistence:'',owner:'',testDate:'',testEvidence:'',failureImpact:''});setProject(p,'choices');return;}
 if(a==='assumption-remove'){const p=root.SultanApp.getProject(),i=Number(b.dataset.option),j=Number(b.dataset.assumption);p.options[i].assumptions.splice(j,1);setProject(p,'choices');return;}
 if(a==='contribution-add'){const p=root.SultanApp.getProject(),bar=b.closest('.collaboration-bar'),name=bar.querySelector('[data-final-contributor]').value,note=bar.querySelector('[data-final-note]').value;if(!text(name)&&!text(note))return;E.recordContribution(p,b.dataset.section,name,note);setProject(p,b.dataset.section);return;}
 const kind=b.dataset.finalExport;if(kind){e.preventDefault();e.stopImmediatePropagation();const fmt=b.dataset.format;if(fmt==='html')exportHtml(kind);else if(fmt==='word')exportWord(kind);else exportPdf(kind,b);}
},true);
document.addEventListener('change',e=>{const owner=e.target.closest('[data-final-owner]');if(!owner)return;const p=root.SultanApp.getProject();p.collaboration.owners[owner.dataset.finalOwner]=owner.value;setProject(p,owner.dataset.finalOwner);});

function afterRender(){setTimeout(()=>{renderVersion();renderRecovery();renderIdentity();renderChoices();renderReferences();renderRoadmap();sectionCollaboration();renderDashboard();renderExecutiveCard();renderExportTools();const card=document.querySelector('.break-even-card');if(card)card.__finalProject=root.SultanApp.getProject();},0);}
document.addEventListener('sultan:render',afterRender);afterRender();
})(globalThis);
