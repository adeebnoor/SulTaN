/* Authority Space v2: separate ownership/status clarity, surface all actions, time pressure and escalation data. */
(function(root){
'use strict';
const E=root.Sultan,T=root.SultanI18n.t;
function pct(n,d){return d?Math.round((n/d)*100):null;}
function classify(enabler){
 if(!enabler)return 'unknown';
 if(enabler.status==='blocked')return 'blocked';
 if(enabler.control==='unknown'||enabler.status==='unknown')return 'unknown';
 if(enabler.status==='pending')return 'pending';
 if(enabler.status==='ready'&&enabler.control==='internal')return 'internal';
 if(enabler.status==='ready'&&['external','shared'].includes(enabler.control))return 'externalReady';
 return 'unknown';
}
function actionsFor(counts,total){
 if(!total)return ['none'];
 const out=[];
 if(counts.blocked)out.push('resolve');
 if(counts.unknown)out.push('learn');
 if(counts.pending)out.push('escalate');
 if(!out.length)out.push('proceed');
 return out;
}
function summaryForOption(p,optionId){
 const linked=p.enablers.filter(e=>e.optionId===optionId),counts={internal:0,externalReady:0,pending:0,blocked:0,unknown:0};
 for(const e of linked)counts[classify(e)]++;
 const ownershipKnown=linked.filter(e=>e.control!=='unknown'&&String(e.owner||'').trim()).length;
 const statusKnown=linked.filter(e=>e.status!=='unknown').length;
 const ready=linked.filter(e=>e.status==='ready').length,total=linked.length;
 const dated=linked.filter(e=>Number.isInteger(e.dueYear)).length;
 const dueYears=linked.filter(e=>Number.isInteger(e.dueYear)).map(e=>e.dueYear);
 const nextDue=dueYears.length?Math.min(...dueYears):null;
 const actions=actionsFor(counts,total);
 return {optionId,total,ownershipKnown,statusKnown,ready,dated,nextDue,ownershipClarity:pct(ownershipKnown,total),statusClarity:pct(statusKnown,total),clearance:pct(ready,total),dateCoverage:pct(dated,total),counts,actions,action:actions[0]};
}
function authoritySpace(p){return p.options.map(o=>({...summaryForOption(p,o.id),title:o.title,type:o.type,decision:o.decision}));}
function escalationItems(p){
 const selected=new Set(p.options.filter(o=>o.decision==='select').map(o=>o.id));
 return p.enablers.filter(e=>selected.has(e.optionId)&&['external','shared','unknown'].includes(e.control)&&e.status!=='ready').map(e=>({
  id:e.id,optionId:e.optionId,choice:p.options.find(o=>o.id===e.optionId)?.title||'',title:e.title||'',owner:e.owner||'',control:e.control,status:e.status,dueYear:e.dueYear,route:e.route||'',fallback:e.fallback||'',source:e.source||''
 })).sort((a,b)=>(a.dueYear??9999)-(b.dueYear??9999)||a.title.localeCompare(b.title));
}
E.authoritySpace=authoritySpace;E.authoritySpaceForOption=summaryForOption;E.authorityEscalationItems=escalationItems;
function esc(x){return String(x??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));}
function metric(label,value,help,count,total){const shown=total>0&&total<4?`${count} / ${total}`:(value===null?'—':value+'%');return `<div class="authority-metric"><span>${esc(label)}</span><strong>${shown}</strong><small>${esc(help)}</small></div>`;}
function actionText(key){return T({proceed:'authorityProceed',resolve:'authorityResolve',escalate:'authorityEscalate',learn:'authorityLearn',none:'authorityNoEnablers'}[key]);}
function render(){
 if(location.hash!=='#enablers'||!root.SultanApp)return;
 const content=document.getElementById('content');if(!content||content.querySelector('.authority-space'))return;
 const rows=authoritySpace(root.SultanApp.getProject()).filter(r=>r.decision==='select'||r.total>0);
 const html=`<article class="card authority-space"><div class="authority-head"><div><div class="eyebrow">SULTAN / AUTHORITY SPACE</div><h2>${esc(T('authoritySpaceTitle'))}</h2><p class="muted">${esc(T('authoritySpaceIntro'))}</p></div></div><div class="authority-grid">${rows.map(r=>`<section class="authority-row"><div><span class="authority-choice-label">${esc(T('authorityChoice'))}</span><h3>${esc(r.title||T('s028'))}</h3><small>${esc(T('authorityCoverage'))}: ${r.total}</small>${r.nextDue?`<small> · ${esc(T('authorityNextDue'))}: ${r.nextDue}</small>`:''}</div><div class="authority-metrics">${metric(T('authorityOwnership'),r.ownershipClarity,T('authorityOwnershipHelp'),r.ownershipKnown,r.total)}${metric(T('authorityStatus'),r.statusClarity,T('authorityStatusHelp'),r.statusKnown,r.total)}${metric(T('authorityClearance'),r.clearance,T('authorityClearanceHelp'),r.ready,r.total)}</div><div class="authority-states"><span>${esc(T('authorityInternal'))}: <b>${r.counts.internal}</b></span><span>${esc(T('authorityExternalReady'))}: <b>${r.counts.externalReady}</b></span><span>${esc(T('authorityPending'))}: <b>${r.counts.pending}</b></span><span>${esc(T('authorityBlocked'))}: <b>${r.counts.blocked}</b></span><span>${esc(T('authorityUnknown'))}: <b>${r.counts.unknown}</b></span></div><div class="authority-action"><b>${esc(T('authorityActions'))}</b>${r.actions.map(a=>`<p>• ${esc(actionText(a))}</p>`).join('')}</div></section>`).join('')||`<p class="muted">${esc(T('authorityNoEnablers'))}</p>`}</div><details><summary>${esc(T('authorityFormula'))}</summary><p class="muted">${esc(T('authorityFormulaText'))}</p></details></article>`;
 const heading=content.querySelector('.heading');if(heading)heading.insertAdjacentHTML('afterend',html);else content.insertAdjacentHTML('afterbegin',html);
}
document.addEventListener('sultan:render',()=>setTimeout(render,0));setTimeout(render,0);
})(globalThis);
