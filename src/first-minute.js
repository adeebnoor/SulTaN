/* An isolated local preview. Only explicit continuation writes to the project. */
(function(root){
'use strict';
const E=root.Sultan,T=(k,v)=>root.SultanI18n.t(k,v);
const esc=x=>String(x??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
let raw='',draft=null,sample=false,busy=false,sequence=0,savedProject=false;
function parse(value){const lines=String(value||'').split(/\r?\n/).map(s=>s.trim()).filter(Boolean);if(lines.length!==3||lines.some(s=>s.length>240))throw Error(T('fmThree'));return {organisation:lines[0],goal:lines[1],constraint:lines[2]};}
function hasWork(p){return savedProject||!!(p.institution.name||p.options.length||p.references.length||p.initiatives.length||p.revision);}
async function build(value){const input=parse(value),p=E.blank();p.institution.name=input.organisation;p.institution.context=input.constraint;p.context.brief=[input.organisation,input.constraint].join('\n');const result=await root.SultanGoalPlanner.generate(p,input.goal,{useAI:false});return {input,project:result.project};}
function output(result){
 const p=result.project,t=p.transitions[0],first=p.initiatives[0],saved=hasWork(root.SultanApp.getProject());
 return `<div class="fm-result-header"><span>${esc(T(sample?'fmSampleLabel':'fmDraft'))}</span><h3 tabindex="-1">${esc(result.input.organisation)}</h3></div><div class="fm-decision"><span>${esc(T('fmDecision'))}</span><strong>${esc(result.input.goal)}</strong></div><div class="fm-cards"><article><span class="fm-number">01</span><h4>${esc(T('fmStep'))}</h4><p>${esc(first.title)}</p></article><article><span class="fm-number">02</span><h4>${esc(T('fmMeasure'))}</h4><p>${esc(t.kpi)}</p></article><article><span class="fm-number">03</span><h4>${esc(T('fmBefore'))}</h4><p>${esc(T('fmUnknown'))}</p></article></div><p class="fm-constraint"><b>${esc(T('fmBasedOn'))}:</b> ${esc(result.input.constraint)}</p><p class="fm-caution">${esc(T('fmCaution'))}</p><div class="fm-handoff"><h4>${esc(T('fmReady'))}</h4><p>${esc(T(saved?'fmKeep':'fmHandoff'))}</p><button type="button" class="btn primary" data-fm="continue">${esc(T(saved?'fmAppend':'fmContinue'))}</button></div>`;
}
function hero({started}){savedProject=started;return `<section class="launch-hero fm-hero" data-first-minute="true"><div class="landing-wrap hero-grid"><div class="hero-copy"><div class="hero-overline"><span class="status-light"></span>${esc(T('fmKicker'))}</div><h1 tabindex="-1">${esc(T('fmTitle'))}</h1><p>${esc(T('fmLead'))}</p><div class="hero-actions"><button type="button" class="btn primary" data-fm="try">${esc(T('fmTry'))}</button><button type="button" class="btn ghost" data-fm="example">${esc(T('fmExample'))}</button></div><p class="fm-privacy">${esc(T('fmNote'))}</p>${started?`<a class="fm-saved" href="#identity" data-action="goto" data-section="identity">${esc(T('fmSaved'))} ↗</a>`:''}<ol class="fm-promise"><li>${esc(T('fmDecision'))}</li><li>${esc(T('fmStep'))}</li><li>${esc(T('fmMeasure'))}</li></ol></div><div class="fm-sandbox"><form id="fm-form"><div class="fm-form-head"><span>01 / SULTAN</span><h2>${esc(T('fmPrompt'))}</h2></div><label for="fm-brief">${esc(T('fmLabel'))}</label><textarea id="fm-brief" rows="4" maxlength="730" required aria-describedby="fm-hint fm-status" placeholder="${esc(T('fmPlaceholder'))}">${esc(raw)}</textarea><p id="fm-hint">${esc(T('fmHint'))}</p><button class="btn primary" type="submit">${esc(T('fmGenerate'))}</button><p id="fm-status" role="status" aria-live="polite"></p></form><section id="fm-result" aria-label="${esc(T('fmResult'))}" ${draft?'':'hidden'}>${draft?output(draft):''}</section><div class="fm-empty" ${draft?'hidden':''}><div class="fm-mini-flow" aria-hidden="true"><span>01</span><i></i><span>02</span><i></i><span>03</span></div><h3>${esc(T('fmEmptyTitle'))}</h3><p>${esc(T('fmEmptyText'))}</p></div></div></div></section>`;}
function invalidate(){sequence++;draft=null;sample=false;const host=document.getElementById('fm-result');if(host){host.hidden=true;host.replaceChildren();}const empty=document.querySelector('.fm-empty');if(empty)empty.hidden=false;const status=document.getElementById('fm-status');if(status)status.textContent='';}
async function generate(){
 if(busy)return;const form=document.getElementById('fm-form'),status=document.getElementById('fm-status'),host=document.getElementById('fm-result');if(!form||!host)return;
 const run=++sequence;busy=true;form.querySelector('button').disabled=true;status.textContent=T('fmWorking');
 try{const next=await build(raw);if(run!==sequence||!host.isConnected)return;draft=next;host.innerHTML=output(next);host.hidden=false;document.querySelector('.fm-empty').hidden=true;status.textContent=T('fmResult');host.querySelector('h3').focus({preventScroll:true});host.scrollIntoView({block:'nearest',behavior:root.matchMedia?.('(prefers-reduced-motion: reduce)').matches?'auto':'smooth'});}
 catch(err){if(run===sequence){draft=null;host.hidden=true;status.textContent=err.message||T('fmError');}}
 finally{busy=false;if(form.isConnected)form.querySelector('button').disabled=false;}
}
document.addEventListener('input',e=>{if(e.target.id!=='fm-brief')return;raw=e.target.value;invalidate();});
document.addEventListener('submit',e=>{if(e.target.id!=='fm-form')return;e.preventDefault();raw=document.getElementById('fm-brief').value;generate();});
document.addEventListener('click',async e=>{
 const button=e.target.closest('[data-fm]');if(!button)return;
 if(button.dataset.fm==='try'){const el=document.getElementById('fm-brief');el.focus();el.scrollIntoView({block:'center',behavior:'smooth'});return;}
 if(button.dataset.fm==='example'){if(busy)return;raw=T('fmSample');invalidate();sample=true;document.getElementById('fm-brief').value=raw;generate();return;}
 if(button.dataset.fm!=='continue'||busy||!draft)return;
 busy=true;button.disabled=true;const base=root.SultanApp.getProject(),snapshot=JSON.stringify(base),current=draft;
 try{const next=hasWork(base)?(await root.SultanGoalPlanner.generate(base,current.input.goal,{useAI:false})).project:current.project;if(JSON.stringify(root.SultanApp.getProject())!==snapshot)throw Error(T('gpChanged'));root.SultanApp.setProject(next);root.SultanStudio.openExecution();}
 catch(err){const status=document.getElementById('fm-status');if(status)status.textContent=err.message||T('fmError');}
 finally{busy=false;if(button.isConnected)button.disabled=false;}
});
root.SultanFirstMinute={hero,parse,build};
})(globalThis);
