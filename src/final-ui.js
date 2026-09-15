/* SULTAN 0.8 final integration: decision model extensions, executive dashboard, reports and client exports. */
(function(root){
'use strict';
const E=root.Sultan,T=root.SultanI18n.t;
if(!E||!root.SultanApp)return;
const esc=x=>String(x??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const text=x=>typeof x==='string'&&x.trim().length>0;
const num=x=>typeof x==='number'&&Number.isFinite(x);
const fmt=x=>num(x)?Math.round(x).toLocaleString('en-US'):'—';
const section=()=>location.hash.slice(1)||'home';

function dl(name,data,type){
 try{
  const blob=data instanceof Blob?data:new Blob([data],{type}),url=URL.createObjectURL(blob),a=document.createElement('a');
  a.href=url;a.download=name;document.body.append(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),3000);return true;
 }catch(err){console.error(err);return false;}
}
function opt(value,label,current){return `<option value="${esc(value)}" ${String(current)===String(value)?'selected':''}>${esc(label)}</option>`;}
function field(label,path,value,type='text',help='',extra=''){
 const id='fx_'+path.replace(/[^A-Za-z0-9_-]+/g,'_');let control='';
 if(type==='textarea')control=`<textarea id="${id}" data-path="${esc(path)}" rows="3" ${extra}>${esc(value??'')}</textarea>`;
 else if(type==='select')control=`<select id="${id}" data-path="${esc(path)}" ${extra}>${help}</select>`;
 else control=`<input id="${id}" data-path="${esc(path)}" type="${type}" value="${esc(value??'')}" ${extra}>`;
 const hint=type==='select'?'':help?`<span class="help">${esc(help)}</span>`:'';
 return `<label class="field final-field" for="${id}"><span>${esc(label)}</span>${control}${hint}<span class="field-error" hidden></span></label>`;
}
function touch(p){p.revision=(Number.isInteger(p.revision)?p.revision:0)+1;p.updatedAt=new Date().toISOString();p.reviewedRevision=null;return p;}
function saveProject(p,target){touch(p);root.SultanApp.setProject(p);if(target)root.SultanApp.navigate(target);}

/* One consistency pass per edit state. */
(function(){const raw=E.check;let key='',cached=[];E.check=function(p){const k=[p?.revision,p?.updatedAt,p?.options?.length,p?.transitions?.length,p?.initiatives?.length].join('|');if(k===key)return cached.slice();key=k;cached=raw(p);return cached.slice();};})();

function renderRecovery(){
 const r=root.SultanRecovery;if(!r?.pending)return;
 let b=document.querySelector('.recovery-lock');if(!b){b=document.createElement('section');b.className='recovery-lock';b.setAttribute('role','alert');document.body.prepend(b);}
 b.innerHTML=`<div><b>${esc(T('recoveryTitle'))}</b><p>${esc(T('recoveryMessage'))}</p><small>${esc(T('recoveryLocked'))}</small></div><div class="recovery-actions"><button type="button" class="btn" data-final-action="recovery-download">${esc(T('recoveryDownload'))}</button><button type="button" class="btn primary" data-final-action="recovery-new">${esc(T('recoveryNew'))}</button></div>`;
 document.querySelectorAll('.shell input,.shell textarea,.shell select,.shell button').forEach(el=>el.disabled=true);
 const s=document.getElementById('saveStatus');if(s)s.textContent=T('recoveryLocked');
}
function renderVersion(){
 const f=document.querySelector('.sidefoot');if(!f)return;let v=f.querySelector('.final-version');
 if(!v){v=document.createElement('span');v.className='final-version';f.prepend(document.createElement('br'));f.prepend(v);}
 v.textContent=`${T('versionLabel')} ${root.SULTAN_VERSION||'0.8.0-rc'}`;
}

function renderIdentity(){
 if(section()!=='identity')return;const p=root.SultanApp.getProject(),content=document.getElementById('content'),card=content?.querySelector('article.card');if(!card)return;
 if(!card.querySelector('[data-path="institution.liabilities"]')){const a=card.querySelector('[data-path="institution.assets"]')?.closest('.field'),h=field(T('liabilities'),'institution.liabilities',p.institution.liabilities,'textarea',T('liabilitiesHelp'));if(a)a.insertAdjacentHTML('afterend',h);else card.insertAdjacentHTML('beforeend',h);}
 const empty=!text(p.institution.name)&&!text(p.institution.mission)&&!text(p.institution.beneficiaries)&&!text(p.institution.vision);
 if(!empty||card.querySelector('.identity-starter'))return;
 const starter=document.createElement('div');starter.className='identity-starter';starter.innerHTML=`<h3>${esc(T('identityStarter'))}</h3><div class="starter-grid"></div>`;const g=starter.querySelector('.starter-grid');
 ['institution.mission','institution.beneficiaries','institution.endYear'].forEach(path=>{const f=card.querySelector(`[data-path="${path}"]`)?.closest('.field');if(f)g.append(f);});
 const more=document.createElement('details');more.className='identity-more';more.innerHTML=`<summary>${esc(T('identityMore'))}</summary><div class="identity-more-body"></div>`;const body=more.querySelector('.identity-more-body');
 Array.from(card.querySelectorAll(':scope > .grid2')).forEach(gr=>{while(gr.firstChild)body.append(gr.firstChild);gr.remove();});card.prepend(more);card.prepend(starter);
 starterQuestions();
}
function starterQuestions(){
 if(section()!=='identity')return;const content=document.getElementById('content'),starter=content?.querySelector('.identity-starter'),grid=starter?.querySelector('.starter-grid'),more=content?.querySelector('.identity-more-body');if(!grid||!more)return;
 const mission=grid.querySelector('[data-path="institution.mission"]')?.closest('.field'),vision=content.querySelector('[data-path="institution.vision"]')?.closest('.field');
 if(mission&&vision&&!grid.contains(vision)){more.prepend(mission);grid.prepend(vision);}
 const relabel=(path,label)=>{const f=grid.querySelector(`[data-path="${path}"]`)?.closest('.field');if(f){const s=f.querySelector(':scope > span:first-child');if(s)s.textContent=label;}};
 relabel('institution.vision',T('identityStarterChange'));relabel('institution.beneficiaries',T('identityStarterWho'));relabel('institution.endYear',T('identityStarterWhen'));
}

function assumptionHtml(o,i){
 let out=`<section class="assumption-register final-feature"><div class="feature-head"><h3>${esc(T('assumptionRegister2'))}</h3><button type="button" class="btn small" data-final-action="assumption-add" data-option="${i}">${esc(T('assumptionAdd'))}</button></div>`;
 (o.assumptions||[]).forEach((a,j)=>{out+=`<details open class="assumption-item"><summary>${esc(a.text||T('assumptionText'))}</summary><div class="grid2">${field(T('assumptionText'),`options.${i}.assumptions.${j}.text`,a.text,'textarea')}${field(T('assumptionDuration'),`options.${i}.assumptions.${j}.expectedPersistence`,a.expectedPersistence)}${field(T('assumptionOwner'),`options.${i}.assumptions.${j}.owner`,a.owner)}${field(T('assumptionTestDate'),`options.${i}.assumptions.${j}.testDate`,a.testDate,'date')}${field(T('assumptionEvidence'),`options.${i}.assumptions.${j}.testEvidence`,a.testEvidence,'textarea')}${field(T('assumptionFailure'),`options.${i}.assumptions.${j}.failureImpact`,a.failureImpact,'textarea')}</div><button type="button" class="btn small danger" data-final-action="assumption-remove" data-option="${i}" data-assumption="${j}">×</button></details>`;});
 return out+'</section>';
}
function renderChoices(){
 if(section()!=='choices')return;const p=root.SultanApp.getProject(),content=document.getElementById('content');if(!content)return;const cards=Array.from(content.querySelectorAll('article.card')).slice(0,p.options.length);
 cards.forEach((card,i)=>{const o=p.options[i],sel=card.querySelector(`[data-path="options.${i}.type"]`);if(sel&&!sel.querySelector('option[value="divest"]'))sel.insertAdjacentHTML('beforeend',opt('divest',T('divest'),o.type));if(o.type==='requirement'&&!card.querySelector('.requirement-note'))card.insertAdjacentHTML('afterbegin',`<p class="hint requirement-note">${esc(T('requirementRankNote'))}</p>`);if(card.querySelector('.final-choice-fields'))return;
  let h='';if(o.type==='moonshot')h+=field(T('moonshotStopEvidence'),`options.${i}.stopEvidence`,o.stopEvidence,'textarea',T('moonshotStopEvidenceHelp'));
  if(o.type==='divest'){h+=`<div class="final-feature"><p class="hint">${esc(T('divestHelp'))}</p><div class="grid2">`;h+=field(T('divestStop'),`options.${i}.divestStop`,o.divestStop,'textarea');h+=field(T('divestResources'),`options.${i}.releasedResources`,o.releasedResources,'number',T('releasedResources'),'min="0" step="any"');h+=field(T('divestRedeploy'),`options.${i}.redeployTo`,o.redeployTo,'textarea');h+=field(T('divestEvidence'),`options.${i}.divestEvidence`,o.divestEvidence,'textarea');h+=field(T('divestImpact'),`options.${i}.divestImpact`,o.divestImpact,'textarea');h+='</div></div>';}
  if(o.type!=='requirement')h+=`<div class="grid2">${field(T('riskSource'),`options.${i}.riskSource`,o.riskSource,'textarea')}${field(T('riskDate'),`options.${i}.riskDate`,o.riskDate,'date')}</div>`;
  h+=assumptionHtml(o,i);const box=document.createElement('div');box.className='final-choice-fields';box.innerHTML=h;card.append(box);
 });
}
function renderReferences(){
 if(section()!=='references')return;const p=root.SultanApp.getProject(),content=document.getElementById('content');if(!content)return;
 const heading=content.querySelector('.heading');if(heading&&!content.querySelector('.route-initiative-note'))heading.insertAdjacentHTML('afterend',`<p class="hint route-initiative-note">${esc(T('routeVsInitiative'))}</p>`);
 p.transitions.forEach((t,i)=>{const sel=content.querySelector(`[data-path="transitions.${i}.direction"]`);if(sel&&!sel.querySelector('option[value="delta"]'))sel.insertAdjacentHTML('beforeend',opt('delta',T('delta'),t.direction));const card=sel?.closest('article.card');if(!card||card.querySelector('.final-transition-fields'))return;
  const trackOptions=opt('outcome',T('dashboardProgress'),t.trackType)+opt('maturity',T('maturity'),t.trackType),indOptions=opt('performance',T('indicatorPerformance'),t.indicatorType)+opt('risk',T('indicatorRisk'),t.indicatorType);
  let h=`<div class="grid3">${field(T('maturity'),`transitions.${i}.trackType`,t.trackType,'select',trackOptions)}${field(T('maturityFamily'),`transitions.${i}.maturityFamily`,t.maturityFamily)}${field(T('indicatorType'),`transitions.${i}.indicatorType`,t.indicatorType,'select',indOptions)}</div>`;
  if(t.direction==='delta'&&num(t.baseline)&&num(t.target))h+=`<p class="hint">${esc(T('deltaAbsolute'))}: <b>${fmt(t.baseline+t.target)}</b> ${esc(t.unit||'')}</p>`;
  if(t.trackType==='maturity')h+=`<p class="hint">${esc(T('dashboardMaturity'))}: ${fmt(t.baseline)} → ${fmt(t.target)} / 5</p>`;
  const box=document.createElement('div');box.className='final-transition-fields final-feature';box.innerHTML=h;card.append(box);
 });
}
function renderRoadmap(){
 if(section()!=='roadmap')return;const p=root.SultanApp.getProject(),content=document.getElementById('content');if(!content)return;
 p.initiatives.forEach((i,ix)=>{if(i.kind!=='learn')return;i.budget.forEach((b,bx)=>{if(b.year<i.startYear||b.year>i.endYear)return;const a=content.querySelector(`[data-path="initiatives.${ix}.budget.${bx}.amount"]`),host=a?.closest('.field');if(!host||host.nextElementSibling?.classList?.contains('release-evidence-field'))return;const h=field(T('releaseEvidence'),`initiatives.${ix}.budget.${bx}.releaseEvidence`,b.releaseEvidence,'textarea').replace('final-field','final-field release-evidence-field');host.insertAdjacentHTML('afterend',h);});});
}
function renderCollaboration(){
 const s=section();if(['home','about'].includes(s))return;const p=root.SultanApp.getProject(),content=document.getElementById('content');if(!content||content.querySelector('.collaboration-bar'))return;const owner=p.collaboration?.owners?.[s]||'';const bar=document.createElement('section');bar.className='collaboration-bar noPrint';bar.innerHTML=`<div><b>${esc(T('workshopOwner'))}</b><input type="text" data-final-owner="${esc(s)}" value="${esc(owner)}" placeholder="${esc(T('workshopAssign'))}"></div><div class="contribution-entry"><input type="text" data-final-contributor placeholder="${esc(T('workshopContributor'))}"><input type="text" data-final-note placeholder="${esc(T('workshopContribution'))}"><button type="button" class="btn small" data-final-action="contribution-add" data-section="${esc(s)}">+</button></div>`;content.prepend(bar);
}

function dualDate(){const d=new Date(),greg=new Intl.DateTimeFormat(root.SultanI18n.language==='ar'?'ar-SA-u-ca-gregory-nu-latn':'en-GB',{dateStyle:'medium'}).format(d),hijri=new Intl.DateTimeFormat(root.SultanI18n.language==='ar'?'ar-SA-u-ca-islamic-nu-latn':'en-GB-u-ca-islamic-nu-latn',{dateStyle:'medium'}).format(d);return `${T('gregorianLabel')}: ${greg} · ${T('hijriLabel')}: ${hijri}`;}
function metrics(p){const selected=new Set(p.options.filter(o=>o.decision==='select').map(o=>o.id)),ens=p.enablers.filter(e=>selected.has(e.optionId)),pending=ens.filter(e=>e.status!=='ready'),external=pending.filter(e=>['external','shared','unknown'].includes(e.control)),due=pending.filter(e=>Number.isInteger(e.dueYear)).map(e=>e.dueYear),blocked=new Set(ens.filter(e=>e.status==='blocked').map(e=>e.optionId)),gap=E.budgetSummary(p).reduce((s,b)=>s+(num(b.gap)?b.gap:0),0);return {decisions:pending.length,external:external.length,nextDue:due.length?Math.min(...due):null,blocked:blocked.size,gap};}
function summaryHtml(p,docNo=p.documentNumber){const m=metrics(p);return `<section class="executive-summary"><h2>${esc(T('executiveSummary'))}</h2><div class="executive-grid"><div><span>${esc(T('summaryDecisions'))}</span><strong>${m.decisions}</strong></div><div><span>${esc(T('summaryExternal'))}</span><strong>${m.external}</strong></div><div><span>${esc(T('summaryNextDue'))}</span><strong>${m.nextDue??'—'}</strong></div><div><span>${esc(T('summaryBlocked'))}</span><strong>${m.blocked}</strong></div><div><span>${esc(T('summaryFundingGap'))}</span><strong>${fmt(m.gap)}</strong></div></div><p class="report-principle">${esc(T('noSingleScore'))}</p><p><b data-doc-number>${esc(T('documentNumber'))} ${docNo}</b> · ${esc(T('editRevision'))} ${p.revision}</p></section>`;}
function extensionReport(p){
 const chunks=[];if(text(p.institution.liabilities))chunks.push(`<h3>${esc(T('liabilities'))}</h3><p>${esc(p.institution.liabilities)}</p>`);
 p.options.forEach(o=>{if(o.type==='divest'){chunks.push(`<h3>${esc(o.title)} · ${esc(T('divest'))}</h3><dl><dt>${esc(T('divestStop'))}</dt><dd>${esc(o.divestStop)}</dd><dt>${esc(T('divestResources'))}</dt><dd>${fmt(o.releasedResources)}</dd><dt>${esc(T('divestRedeploy'))}</dt><dd>${esc(o.redeployTo)}</dd><dt>${esc(T('divestEvidence'))}</dt><dd>${esc(o.divestEvidence)}</dd><dt>${esc(T('divestImpact'))}</dt><dd>${esc(o.divestImpact)}</dd></dl>`);}if(o.type==='moonshot'&&text(o.stopEvidence))chunks.push(`<h3>${esc(o.title)} · ${esc(T('moonshotStopEvidence'))}</h3><p>${esc(o.stopEvidence)}</p>`);if(Array.isArray(o.assumptions)&&o.assumptions.length){const rows=o.assumptions.map(a=>`<dl><dt>${esc(T('assumptionText'))}</dt><dd>${esc(a.text)}</dd><dt>${esc(T('assumptionDuration'))}</dt><dd>${esc(a.expectedPersistence)}</dd><dt>${esc(T('assumptionOwner'))}</dt><dd>${esc(a.owner)}</dd><dt>${esc(T('assumptionTestDate'))}</dt><dd>${esc(a.testDate)}</dd><dt>${esc(T('assumptionEvidence'))}</dt><dd>${esc(a.testEvidence)}</dd><dt>${esc(T('assumptionFailure'))}</dt><dd>${esc(a.failureImpact)}</dd></dl>`).join('');chunks.push(`<h3>${esc(o.title)} · ${esc(T('assumptionRegister2'))}</h3>${rows}`);}});
 return chunks.length?`<section class="extension-report"><h2>${esc(T('decisionExtensions'))}</h2>${chunks.join('')}</section>`:'';
}
function collaborationReport(p){const owners=p.collaboration?.owners||{},rows=p.collaboration?.contributions||[];if(!rows.length&&!Object.values(owners).some(text))return '';const ownerRows=Object.entries(owners).filter(([,v])=>text(v)).map(([k,v])=>`<dt>${esc(k)}</dt><dd>${esc(v)}</dd>`).join('');const log=rows.map(r=>`<p><b>${esc(r.name||'—')}</b> · ${esc(r.section)} · ${esc(r.at)}<br>${esc(r.note)}</p>`).join('');return `<section class="collaboration-report"><h2>${esc(T('workshopLog'))}</h2><dl>${ownerRows}</dl>${log}</section>`;}
function authorityReport(p){const rows=E.authoritySpace?E.authoritySpace(p).filter(r=>r.decision==='select'||r.total>0):[];if(!rows.length)return '';return `<section class="report-extra authority-report"><h2>${esc(T('authoritySpaceTitle'))}</h2><p>${esc(T('authoritySpaceIntro'))}</p><table><thead><tr><th>${esc(T('authorityChoice'))}</th><th>${esc(T('authorityOwnership'))}</th><th>${esc(T('authorityStatus'))}</th><th>${esc(T('authorityClearance'))}</th><th>${esc(T('authorityNextDue'))}</th></tr></thead><tbody>${rows.map(r=>`<tr><td>${esc(r.title)}</td><td>${r.ownershipClarity==null?'—':r.ownershipClarity+'%'}</td><td>${r.statusClarity==null?'—':r.statusClarity+'%'}</td><td>${r.clearance==null?'—':r.clearance+'%'}</td><td>${r.nextDue??'—'}</td></tr>`).join('')}</tbody></table></section>`;}
function escalationEvidence(p){const rows=E.authorityEscalationItems?E.authorityEscalationItems(p):[];if(!rows.length)return '';return `<section class="report-extra escalation-report"><h2>${esc(T('escalationPack'))}</h2><table><thead><tr><th>${esc(T('authorityChoice'))}</th><th>${esc(T('s492'))}</th><th>${esc(T('s495'))}</th><th>${esc(T('escalationDue'))}</th><th>${esc(T('escalationRoute'))}</th><th>${esc(T('escalationFallback'))}</th></tr></thead><tbody>${rows.map(x=>`<tr><td>${esc(x.choice)}</td><td>${esc(x.title)}</td><td>${esc(x.owner||'—')}</td><td>${x.dueYear??'—'}</td><td>${esc(x.route||'—')}</td><td>${esc(x.fallback||'—')}</td></tr>`).join('')}</tbody></table></section>`;}
function releasedResources(){
 if(section()!=='priorities')return;const p=root.SultanApp.getProject(),ranking=E.ranking(p),content=document.getElementById('content');if(!content)return;const rows=Array.from(content.querySelectorAll('.rank')).slice(0,ranking.length);
 rows.forEach((row,i)=>{const r=ranking[i],o=p.options.find(x=>x.id===r.id);if(o?.type!=='divest'||!num(o.releasedResources)||row.querySelector('.released-resources'))return;row.insertAdjacentHTML('beforeend',`<small class="released-resources">+ ${fmt(o.releasedResources)} · ${esc(T('releasedResources'))}</small>`);});
}

/* One authoritative report wrapper. */
const baseReport=root.SultanApp.getReport.bind(root.SultanApp);
root.SultanApp.getReport=function(){
 const p=root.SultanApp.getProject();let body=baseReport();const extra=summaryHtml(p)+extensionReport(p)+collaborationReport(p);const i=body.indexOf('</header>');body=i>=0?body.slice(0,i+9)+extra+body.slice(i+9):extra+body;
 const pos=body.lastIndexOf('</article>'),tail=authorityReport(p)+escalationEvidence(p);body=pos>=0?body.slice(0,pos)+tail+body.slice(pos):body+tail;
 const doc=new DOMParser().parseFromString(body,'text/html'),report=doc.querySelector('.report'),header=report?.querySelector('header');
 if(header){const meta=Array.from(header.children).find(x=>x.tagName==='P'&&!x.classList.contains('hint')&&!x.classList.contains('report-date'));if(meta)meta.innerHTML=`<span data-doc-number>${esc(T('documentNumber'))} ${p.documentNumber}</span> · ${esc(p.updatedAt)}`;if(!header.querySelector('.report-date')){const date=document.createElement('p');date.className='report-date';date.textContent=dualDate();header.append(date);}const summary=report.querySelector('.executive-summary'),h1=header.querySelector('h1');if(summary&&h1)h1.insertAdjacentElement('afterend',summary);}
 return doc.body.innerHTML;
};

function qualitativeStatus(t){return (t.annual||[]).some(r=>text(r.observation))?'recorded':'noReading';}
function statusFor(t){if(t.direction==='qualitative')return qualitativeStatus(t);const a=[...(t.annual||[])].reverse().find(r=>num(r.actual));return a?E.indicatorStatus(t,a):'noReading';}
function statusPill(t){const s=statusFor(t),label=s==='recorded'?T('qualitativeRecorded'):T(s);return `<span class="status ${s}">${esc(label)}</span>`;}
function statusLegend(){return `<div class="dashboard-status-legend" aria-label="${esc(T('trajectoryLegend'))}">${['ahead','onTrack','behind','noReading'].map(k=>`<span class="${k}"><i></i>${esc(T(k))}</span>`).join('')}</div>`;}
function seriesLegend(){return `<div class="trajectory-legend"><span class="baseline"><i></i>${esc(T('trajectoryBaseline'))}</span><span class="target"><i></i>${esc(T('trajectoryTarget'))}</span><span class="actual"><i></i>${esc(T('trajectoryActual'))}</span></div>`;}
function qualitativeTrack(t,p){const years=E.years(p),rows=years.map(y=>(t.annual||[]).find(a=>a.year===y)||{year:y});return `<div class="qualitative-track"><p class="muted">${esc(T('qualitativeTrackNote'))}</p><div class="qualitative-years">${rows.map(r=>`<div data-year="${r.year}" class="${text(r.observation)?'recorded':''}"><b>${r.year}</b><span>${esc(r.observation||r.milestone||'—')}</span></div>`).join('')}</div></div>`;}
function trackSvg(t,p){
 if(t.direction==='qualitative')return qualitativeTrack(t,p);
 const years=E.years(p),annual=t.annual||[],targets=[],actuals=[],vals=[];if(num(t.baseline))vals.push(t.baseline);
 annual.forEach(a=>{const tv=E.absoluteTarget?E.absoluteTarget(t,a):(t.direction==='delta'&&num(t.baseline)&&num(a.target)?t.baseline+a.target:a.target);if(num(tv)){targets.push({year:a.year,value:tv});vals.push(tv);}if(num(a.actual)){actuals.push({year:a.year,value:a.actual});vals.push(a.actual);}});
 if(!vals.length)return `<p>${esc(T('noData'))}</p>`;
 const w=700,h=190,left=52,right=20,top=20,bottom=42,mn=Math.min(...vals),mx=Math.max(...vals),pad=(mx-mn||1)*0.08,lo=mn-pad,hi=mx+pad,span=hi-lo||1;
 const slots=[{key:'baseline',label:T('trajectoryBaseline')},...years.map(y=>({key:y,label:String(y)}))],x=i=>left+i*((w-left-right)/Math.max(1,slots.length-1)),y=v=>top+(hi-v)/span*(h-top-bottom),yearIndex=year=>years.indexOf(year)+1;
 const targetPts=[];if(num(t.baseline))targetPts.push([x(0),y(t.baseline),'baseline',t.baseline]);targets.forEach(q=>{const i=yearIndex(q.year);if(i>0)targetPts.push([x(i),y(q.value),q.year,q.value]);});
 const actualPts=actuals.map(q=>[x(yearIndex(q.year)),y(q.value),q.year,q.value]).filter(q=>q[0]>=left);
 const path=pts=>pts.map((q,i)=>(i?'L':'M')+q[0].toFixed(1)+' '+q[1].toFixed(1)).join(' ');
 const grid=[0,.5,1].map(r=>{const yy=top+r*(h-top-bottom),v=hi-r*span;return `<line x1="${left}" y1="${yy}" x2="${w-right}" y2="${yy}" class="track-grid"></line><text x="${left-8}" y="${yy+4}" text-anchor="end">${fmt(v)}</text>`;}).join('');
 return `<svg viewBox="0 0 ${w} ${h}" class="track-svg" role="img" aria-label="${esc(t.kpi||t.domain||T('dashboardProgress'))}">${grid}${targetPts.length>1?`<path d="${path(targetPts)}" class="target-line" data-series="target"></path>`:''}${actualPts.length>1?`<path d="${path(actualPts)}" class="actual-line" data-series="actual"></path>`:''}${targetPts.map((q,i)=>`<circle cx="${q[0]}" cy="${q[1]}" r="${i===0?'4.5':'4'}" class="${i===0?'baseline-dot':'target-dot'}" data-series="${i===0?'baseline':'target'}" data-year="${q[2]}" data-value="${q[3]}"><title>${esc(i===0?T('trajectoryBaseline'):T('trajectoryTarget'))}: ${fmt(q[3])}</title></circle>`).join('')}${actualPts.map(q=>`<circle cx="${q[0]}" cy="${q[1]}" r="4" class="actual-dot" data-series="actual" data-year="${q[2]}" data-value="${q[3]}"><title>${esc(T('trajectoryActual'))}: ${fmt(q[3])}</title></circle>`).join('')}${slots.map((s,i)=>`<text x="${x(i)}" y="${h-10}" text-anchor="middle">${esc(s.label)}</text>`).join('')}</svg>`;
}
function fundingPanel(p){const rows=E.budgetSummary(p),mx=Math.max(1,...rows.flatMap(r=>[r.declared||0,r.available||0]));return `<div class="funding-bars">${rows.map(r=>`<div class="funding-year"><b>${r.year}</b><span class="bar declared" style="--w:${Math.round((r.declared/mx)*100)}%"><i>${fmt(r.declared)}</i></span><span class="bar available" style="--w:${Math.round(((r.available||0)/mx)*100)}%"><i>${r.available==null?'—':fmt(r.available)}</i></span><small>${r.unknown?`${r.unknown} × ${esc(T('noReading'))}`:''}${num(r.gap)&&r.gap>0?` · ${esc(T('summaryFundingGap'))}: ${fmt(r.gap)}`:''}</small></div>`).join('')}</div>`;}
function authorityPanel(p){const selected=new Set(p.options.filter(o=>o.decision==='select').map(o=>o.id)),ens=p.enablers.filter(e=>selected.has(e.optionId)),c={ready:0,pending:0,blocked:0,unknown:0};ens.forEach(e=>{if(e.status==='ready')c.ready++;else if(e.status==='pending')c.pending++;else if(e.status==='blocked')c.blocked++;else c.unknown++;});const n=Math.max(1,ens.length),due=ens.filter(e=>e.status!=='ready'&&Number.isInteger(e.dueYear)).map(e=>e.dueYear);return `<div class="authority-stack">${Object.entries(c).map(([k,v])=>`<span class="${k}" style="--w:${v/n*100}%" title="${k}: ${v}"></span>`).join('')}</div><p>${esc(T('summaryNextDue'))}: <b>${due.length?Math.min(...due):'—'}</b></p>`;}
function timelinePanel(p){const ys=E.years(p),items=E.selectedInitiatives(p);return `<div class="dashboard-timeline" style="--years:${ys.length}"><div></div>${ys.map(y=>`<b>${y}</b>`).join('')}${items.map(i=>`<span>${esc(i.title)}</span>${ys.map(y=>`<i class="${y>=i.startYear&&y<=i.endYear?'active':''}"></i>`).join('')}`).join('')}</div>`;}
function maturityPanel(rows){return `<div class="maturity-visuals">${rows.map(t=>{const current=num(t.baseline)?Math.max(0,Math.min(5,t.baseline)):null,target=num(t.target)?Math.max(0,Math.min(5,t.target)):null,pos=v=>root.SultanI18n.direction==='rtl'?(100-v/5*100):(v/5*100);return `<div class="maturity-row"><div class="maturity-row-head"><b>${esc(t.maturityFamily||t.domain||T('maturity'))}</b><small>${current==null?'—':current} → ${target==null?'—':target} / 5</small></div><div class="maturity-scale">${current==null?'':`<i class="maturity-current" style="left:${pos(current)}%"></i>`}${target==null?'':`<i class="maturity-target" style="left:${pos(target)}%"></i>`}</div><div class="maturity-legend"><span class="cur"><i></i>${esc(T('s341'))}: ${current??'—'}</span><span class="tar"><i></i>${esc(T('s343'))}: ${target??'—'}</span></div></div>`;}).join('')}</div>`;}
function renderDashboard(){
 if(section()!=='review')return;const content=document.getElementById('content');if(!content||content.querySelector('.final-dashboard'))return;const p=root.SultanApp.getProject(),selected=new Set(p.options.filter(o=>o.decision==='select').map(o=>o.id)),trs=p.transitions.filter(t=>selected.has(t.optionId)),outcome=trs.filter(t=>t.trackType!=='maturity'&&t.indicatorType!=='risk'),maturity=trs.filter(t=>t.trackType==='maturity'),risk=trs.filter(t=>t.indicatorType==='risk');
 let h=`<h2>${esc(T('dashboardTitle'))}</h2><p class="muted">${esc(T('dashboardIntro'))}</p><div class="dashboard-grid"><section class="dashboard-progress"><h3>${esc(T('dashboardProgress'))}</h3>${statusLegend()}${seriesLegend()}`;
 h+=outcome.length?outcome.map(t=>`<div class="track-card" data-transition-id="${esc(t.id)}"><div class="track-head"><b>${esc(t.kpi||t.domain)}</b>${statusPill(t)}</div>${trackSvg(t,p)}</div>`).join(''):`<p>${esc(T('noData'))}</p>`;
 h+=`</section><section><h3>${esc(T('dashboardFunding'))}</h3>${fundingPanel(p)}</section><section><h3>${esc(T('dashboardAuthority'))}</h3>${authorityPanel(p)}</section><section><h3>${esc(T('dashboardTimeline'))}</h3>${timelinePanel(p)}</section>`;
 if(maturity.length)h+=`<section><h3>${esc(T('dashboardMaturity'))}</h3>${maturityPanel(maturity)}</section>`;
 if(risk.length)h+=`<section><h3>${esc(T('dashboardRisk'))}</h3>${risk.map(t=>`<div class="risk-track"><b>${esc(t.kpi||t.domain)}</b>${statusPill(t)}${trackSvg(t,p)}</div>`).join('')}</section>`;
 h+='</div>';const card=document.createElement('article');card.className='card final-dashboard';card.innerHTML=h;const heading=content.querySelector('.heading');if(heading)heading.insertAdjacentElement('afterend',card);else content.prepend(card);content.querySelectorAll('.reportPreview h1').forEach(old=>{const n=document.createElement('h2');n.innerHTML=old.innerHTML;old.replaceWith(n);});
}
function renderExecutive(){if(section()!=='review')return;const content=document.getElementById('content');if(!content||content.querySelector('.review-executive'))return;const c=document.createElement('article');c.className='card review-executive';c.innerHTML=summaryHtml(root.SultanApp.getProject());const d=content.querySelector('.final-dashboard');if(d)d.insertAdjacentElement('beforebegin',c);else content.prepend(c);}

function reportDoc(body,title){return `<!doctype html><html lang="${root.SultanI18n.language}" dir="${root.SultanI18n.direction}"><head><meta charset="utf-8"><title>${esc(title)}</title><style>@page{size:A4;margin:14mm}body{font:15px/1.75 Tahoma,Arial,sans-serif;color:#0b2d63;margin:0 auto;max-width:1080px;padding:18px}h1,h2,h3{color:#0b2d63;break-after:avoid}header{border-bottom:3px solid #caa85e}table{width:100%;border-collapse:collapse}td,th{padding:7px;border:1px solid #ddd;text-align:start;vertical-align:top}tr{break-inside:avoid}dl{display:grid;grid-template-columns:180px 1fr;gap:7px 14px}dt{font-weight:bold}dd{margin:0}.executive-grid{display:grid;grid-template-columns:repeat(5,1fr);gap:8px}.executive-grid>div{border:1px solid #ddd;padding:8px}.report-principle{padding:8px;background:#f5f0e5;border-inline-start:4px solid #caa85e}@media print{body{padding:0}.noPrint{display:none!important}section{break-inside:auto}}</style></head><body>${body}</body></html>`;}
function leadershipBody(body){const doc=new DOMParser().parseFromString(body,'text/html'),h=doc.querySelector('[data-report-section="issues"]');if(h){let n=h.nextSibling;while(n){const next=n.nextSibling;if(n.nodeType===1&&n.matches&&n.matches('h2[data-report-section]'))break;n.remove();n=next;}h.remove();}return doc.body.innerHTML;}
function escalationReport(p,docNo=p.documentNumber){const rows=E.authorityEscalationItems?E.authorityEscalationItems(p):[];return `<article><header><h1>${esc(T('exportEscalation'))}</h1><p>${esc(p.institution.name||'SULTAN')}</p></header>${summaryHtml(p,docNo)}<section class="report-extra escalation-report"><h2>${esc(T('escalationPack'))}</h2><p><b>${esc(p.institution.name||T('s250'))}</b> · ${esc(T('generatedOn'))}: ${esc(dualDate())} · ${esc(T('revisionLabel'))} ${p.revision}</p><table><thead><tr><th>${esc(T('authorityChoice'))}</th><th>${esc(T('s492'))}</th><th>${esc(T('s495'))}</th><th>${esc(T('summaryNextDue'))}</th><th>${esc(T('escalationRoute'))}</th><th>${esc(T('escalationFallback'))}</th></tr></thead><tbody>${rows.map(r=>`<tr><td>${esc(r.choice)}</td><td>${esc(r.title)}</td><td>${esc(r.owner||'—')}</td><td>${r.dueYear??'—'}</td><td>${esc(r.route||'—')}</td><td>${esc(r.fallback||'—')}</td></tr>`).join('')}</tbody></table></section></article>`;}
function stampDocumentNumber(body,docNo){const doc=new DOMParser().parseFromString(body,'text/html');doc.querySelectorAll('[data-doc-number]').forEach(el=>el.textContent=`${T('documentNumber')} ${docNo}`);return doc.body.innerHTML;}
function bodyFor(kind,p,docNo){if(kind==='escalation')return escalationReport(p,docNo);const body=stampDocumentNumber(root.SultanApp.getReport(),docNo);return kind==='leadership'?leadershipBody(body):body;}
function labelFor(kind){return kind==='strategy'?T('exportStrategy'):kind==='leadership'?T('exportLeadership'):T('exportEscalation');}
function candidateDoc(){const p=root.SultanApp.getProject();return (Number.isInteger(p.documentNumber)&&p.documentNumber>0?p.documentNumber:1)+1;}
function commitDoc(n){const p=root.SultanApp.getProject();p.documentNumber=n;root.SultanApp.setProject(p);return root.SultanApp.getProject();}
function showExportMessage(message,isError=true){const host=document.querySelector('.topbar .toolbar')||document.getElementById('content')||document.body;let s=host.querySelector(':scope > .export-status');if(!s){s=document.createElement('p');s.className='export-status';s.setAttribute('role','status');s.setAttribute('aria-live','polite');host.append(s);}s.textContent=message;s.dataset.error=isError?'1':'0';const toast=document.getElementById('toast');if(toast){toast.textContent=message;toast.className='toast show';clearTimeout(showExportMessage.timer);showExportMessage.timer=setTimeout(()=>toast.className='toast',5000);}}
function exportHtml(kind){try{const p=root.SultanApp.getProject(),n=candidateDoc(),doc=reportDoc(bodyFor(kind,p,n),labelFor(kind));if(!dl(`SULTAN_${kind}_D${n}.html`,doc,'text/html;charset=utf-8'))throw Error('download');commitDoc(n);}catch(err){console.error(err);showExportMessage(T('exportStartFailed'));}}
function exportWord(kind){try{const p=root.SultanApp.getProject(),n=candidateDoc(),doc=reportDoc(bodyFor(kind,p,n),labelFor(kind)).replace('<html','<html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:w="urn:schemas-microsoft-com:office:word"');if(!dl(`SULTAN_${kind}_D${n}.doc`,doc,'application/msword;charset=utf-8'))throw Error('download');commitDoc(n);}catch(err){console.error(err);showExportMessage(T('exportStartFailed'));}}
function exportPdf(kind,b){
 const w=window.open('','_blank');if(!w){showExportMessage(T('pdfPopupBlocked'));return;}
 if(b){b.disabled=true;b.dataset.label=b.textContent;b.textContent='…';}
 try{const p=root.SultanApp.getProject(),n=candidateDoc(),doc=reportDoc(bodyFor(kind,p,n),labelFor(kind));w.opener=null;w.document.open();w.document.write(doc);w.document.close();w.focus();w.print();commitDoc(n);}catch(err){console.error(err);try{w.close();}catch{}showExportMessage(T('exportStartFailed'));}finally{if(b){b.disabled=false;b.textContent=b.dataset.label||T('exportPdf');}}
}
function renderExport(){const menu=document.querySelector('.export-menu-panel');if(!menu||menu.querySelector('.final-deliverables'))return;const box=document.createElement('div');box.className='final-deliverables';let h=`<b>${esc(T('clientDeliverables'))}</b>`;['strategy','leadership','escalation'].forEach(k=>{h+=`<div class="deliverable-row"><span>${esc(labelFor(k))}</span><button class="btn small" type="button" data-final-export="${k}" data-format="html">${esc(T('exportHtml'))}</button><button class="btn small" type="button" data-final-export="${k}" data-format="word">${esc(T('exportWord'))}</button><button class="btn small" type="button" data-final-export="${k}" data-format="pdf">${esc(T('exportPdf'))}</button></div>`;});box.innerHTML=h;menu.append(box);}

const sectionMap={identity:['institution','mandates'],choices:['options'],references:['references','transitions'],priorities:['criteria','weightRationale'],enablers:['enablers'],roadmap:['initiatives','funding'],review:['reviewNote']};
function exportSection(){const s=section(),keys=sectionMap[s];if(!keys)return;const p=root.SultanApp.getProject(),x={kind:'sultan.section.v2',section:s,baseSchema:p.schema,exportedAt:new Date().toISOString(),owner:p.collaboration?.owners?.[s]||'',contributions:(p.collaboration?.contributions||[]).filter(r=>r.section===s),data:{}};keys.forEach(k=>x.data[k]=p[k]);dl(`SULTAN_${s}_section_v2.json`,JSON.stringify(x,null,2),'application/json;charset=utf-8');}
function importSection(){const input=document.createElement('input');input.type='file';input.accept='.json,application/json';input.onchange=()=>{const f=input.files[0];if(!f)return;const r=new FileReader();r.onload=()=>{try{const x=JSON.parse(r.result);if(x.kind!=='sultan.section.v2'||!sectionMap[x.section])throw Error('Invalid SULTAN section file.');const p=root.SultanApp.getProject();sectionMap[x.section].forEach(k=>{if(Object.prototype.hasOwnProperty.call(x.data||{},k))p[k]=x.data[k];});p.collaboration=p.collaboration||{owners:{},contributions:[]};p.collaboration.owners[x.section]=String(x.owner||'');p.collaboration.contributions=[...(p.collaboration.contributions||[]),...(x.contributions||[])].slice(-250);saveProject(p,x.section);}catch(err){console.error(err);showExportMessage(T('exportStartFailed'));}};r.readAsText(f);};input.click();}

/* Use the render snapshot instead of cloning project state for every range-input pixel. */
document.addEventListener('input',e=>{const s=e.target.closest('[data-sensitivity]');if(!s)return;e.stopImmediatePropagation();const card=s.closest('.break-even-card');if(!card)return;const p=card.__finalProject||root.SultanApp.getProject();card.__finalProject=p;s.nextElementSibling.textContent=s.value+'%';const rows=E.rankingAt(p,s.dataset.sensitivity,Number(s.value)),box=card.querySelector('.sensitivity-preview');if(box)box.innerHTML=rows.slice(0,5).map((x,i)=>`<div class="rank"><span class="ranknum">${i+1}</span><b>${esc(x.title)}</b><strong>${fmt(x.value)}</strong></div>`).join('');},true);

document.addEventListener('change',e=>{const o=e.target.closest('[data-final-owner]');if(!o)return;const p=root.SultanApp.getProject();p.collaboration.owners[o.dataset.finalOwner]=o.value;saveProject(p,o.dataset.finalOwner);});
document.addEventListener('click',e=>{
 const b=e.target.closest('[data-final-action],[data-final-export],[data-exec="section-export"],[data-exec="section-import"],[data-action="report"],[data-exec="leadership-report"],[data-exec="escalation"],[data-action="reviewed"]');if(!b)return;
 if(b.matches('[data-exec="section-export"]')){e.preventDefault();e.stopImmediatePropagation();exportSection();return;}
 if(b.matches('[data-exec="section-import"]')){e.preventDefault();e.stopImmediatePropagation();importSection();return;}
 if(b.matches('[data-action="report"]')){e.preventDefault();e.stopImmediatePropagation();exportHtml('strategy');return;}
 if(b.matches('[data-exec="leadership-report"]')){e.preventDefault();e.stopImmediatePropagation();exportHtml('leadership');return;}
 if(b.matches('[data-exec="escalation"]')){e.preventDefault();e.stopImmediatePropagation();exportHtml('escalation');return;}
 if(b.matches('[data-action="reviewed"]')){e.preventDefault();e.stopImmediatePropagation();const p=root.SultanApp.getProject();touch(p);p.reviewedRevision=p.revision;root.SultanApp.setProject(p);return;}
 const a=b.dataset.finalAction;if(a==='recovery-download'){root.SultanRecovery?.download();return;}if(a==='recovery-new'){root.SultanRecovery?.startNew();location.reload();return;}
 if(a==='assumption-add'){const p=root.SultanApp.getProject(),i=Number(b.dataset.option);p.options[i].assumptions=p.options[i].assumptions||[];p.options[i].assumptions.push({id:E.uid('asm'),text:'',expectedPersistence:'',owner:'',testDate:'',testEvidence:'',failureImpact:''});saveProject(p,'choices');return;}
 if(a==='assumption-remove'){const p=root.SultanApp.getProject(),i=Number(b.dataset.option),j=Number(b.dataset.assumption);p.options[i].assumptions.splice(j,1);saveProject(p,'choices');return;}
 if(a==='contribution-add'){const p=root.SultanApp.getProject(),bar=b.closest('.collaboration-bar'),name=bar.querySelector('[data-final-contributor]').value,note=bar.querySelector('[data-final-note]').value;if(!text(name)&&!text(note))return;E.recordContribution(p,b.dataset.section,name,note);saveProject(p,b.dataset.section);return;}
 if(b.dataset.finalExport){e.preventDefault();e.stopImmediatePropagation();if(b.dataset.format==='html')exportHtml(b.dataset.finalExport);else if(b.dataset.format==='word')exportWord(b.dataset.finalExport);else exportPdf(b.dataset.finalExport,b);}
},true);

function afterRender(){setTimeout(()=>{renderVersion();renderRecovery();renderIdentity();renderChoices();renderReferences();renderRoadmap();renderCollaboration();renderDashboard();renderExecutive();renderExport();releasedResources();const c=document.querySelector('.break-even-card');if(c)c.__finalProject=root.SultanApp.getProject();},0);}
document.addEventListener('sultan:render',afterRender);afterRender();
})(globalThis);
