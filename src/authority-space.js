/* Authority Space: descriptive authority/clearance measures with action routing. */
(function(root){
'use strict';
const E=root.Sultan,T=root.SultanI18n.t;
function pct(n,d){return d?Math.round((n/d)*100):null;}
function classify(enabler){
 if(!enabler)return 'unknown';
 if(enabler.status==='blocked')return 'blocked';
 if(enabler.status==='unknown'||enabler.control==='unknown')return 'unknown';
 if(enabler.status==='pending')return 'pending';
 if(enabler.status==='ready'&&enabler.control==='internal')return 'internal';
 if(enabler.status==='ready'&&['external','shared'].includes(enabler.control))return 'externalReady';
 return 'unknown';
}
function summaryForOption(p,optionId){
 const linked=p.enablers.filter(e=>e.optionId===optionId),counts={internal:0,externalReady:0,pending:0,blocked:0,unknown:0};
 for(const e of linked)counts[classify(e)]++;
 const known=linked.filter(e=>e.control!=='unknown').length,ready=linked.filter(e=>e.status==='ready').length,total=linked.length;
 let action='proceed';
 if(!total)action='none';else if(counts.blocked)action='resolve';else if(counts.unknown)action='learn';else if(counts.pending)action='escalate';
 return {optionId,total,known,ready,clarity:pct(known,total),clearance:pct(ready,total),counts,action};
}
function authoritySpace(p){return p.options.map(o=>({...summaryForOption(p,o.id),title:o.title,type:o.type,decision:o.decision}));}
E.authoritySpace=authoritySpace;E.authoritySpaceForOption=summaryForOption;
function esc(x){return String(x??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));}
function metric(label,value,help){return `<div class="authority-metric"><span>${esc(label)}</span><strong>${value===null?'—':value+'%'}</strong><small>${esc(help)}</small></div>`;}
function actionText(key){return T({proceed:'authorityProceed',resolve:'authorityResolve',escalate:'authorityEscalate',learn:'authorityLearn',none:'authorityNoEnablers'}[key]);}
function render(){
 if(location.hash!=='#enablers'||!root.SultanApp)return;
 const content=document.getElementById('content');if(!content||content.querySelector('.authority-space'))return;
 const rows=authoritySpace(root.SultanApp.getProject()).filter(r=>r.decision==='select'||r.total>0);
 const html=`<article class="card authority-space"><div class="authority-head"><div><div class="eyebrow">SULTAN / AUTHORITY SPACE</div><h2>${esc(T('authoritySpaceTitle'))}</h2><p class="muted">${esc(T('authoritySpaceIntro'))}</p></div></div><div class="authority-grid">${rows.map(r=>`<section class="authority-row"><div><span class="authority-choice-label">${esc(T('authorityChoice'))}</span><h3>${esc(r.title||T('s028'))}</h3></div><div class="authority-metrics">${metric(T('authorityKnown'),r.clarity,T('authorityKnownHelp'))}${metric(T('authorityClearance'),r.clearance,T('authorityClearanceHelp'))}</div><div class="authority-states"><span>${esc(T('authorityInternal'))}: <b>${r.counts.internal}</b></span><span>${esc(T('authorityExternalReady'))}: <b>${r.counts.externalReady}</b></span><span>${esc(T('authorityPending'))}: <b>${r.counts.pending}</b></span><span>${esc(T('authorityBlocked'))}: <b>${r.counts.blocked}</b></span><span>${esc(T('authorityUnknown'))}: <b>${r.counts.unknown}</b></span></div><div class="authority-action"><b>${esc(T('authorityAction'))}</b><p>${esc(actionText(r.action))}</p></div></section>`).join('')||`<p class="muted">${esc(T('authorityNoEnablers'))}</p>`}</div><details><summary>${esc(T('authorityFormula'))}</summary><p class="muted">${esc(T('authorityFormulaText'))}</p></details></article>`;
 const heading=content.querySelector('.heading');if(heading)heading.insertAdjacentHTML('afterend',html);else content.insertAdjacentHTML('afterbegin',html);
}
document.addEventListener('sultan:render',()=>setTimeout(render,0));setTimeout(render,0);
})(globalThis);
