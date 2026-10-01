/* Expert lenses in the interface: the Review card (hints grouped by lens, feedback, your own patterns,
   learning from notes and from AI findings, memory export/import), the lens pill on AI review findings and the
   note in the guided path's last step. Advisory only; nothing here touches check() or approval badges. */
(function(root){
'use strict';
const E=root.Sultan,I=root.SultanI18n,T=I.t,Lens=root.SultanLens,AI=root.SultanAI;
if(!Lens||typeof document==='undefined')return;
const esc=x=>String(x??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const text=x=>typeof x==='string'&&x.trim().length>0;
const Tf=(k,args=[])=>T(k,args.map(String));
const project=()=>root.SultanApp?.getProject?.();
const section=()=>document.querySelector('#navigation [aria-current="page"]')?.dataset.section||location.hash.replace('#','')||'home';
const SECTION_KEY={identity:'s208',choices:'s209',references:'s210',priorities:'s211',enablers:'s212',roadmap:'s213',review:'s214'};
const sectionLabel=s=>T(SECTION_KEY[s]||'s214');
const sourceLabel=l=>l.origin==='user'?(l.source==='ai-review'?T('lensSource_ai'):T('lensSource_user')):T('lensSource_'+(l.source||'method'));
let notes='',candidates=[],openPanels={};
function toast(message,ms=7000){const el=document.getElementById('toast');if(!el)return;el.textContent=message;el.className='toast show';clearTimeout(toast.timer);toast.timer=setTimeout(()=>el.className='toast',ms);}
function dl(name,content){const b=new Blob([content],{type:'application/json;charset=utf-8'}),u=URL.createObjectURL(b),a=document.createElement('a');a.href=u;a.download=name;document.body.append(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(u),2000);}

function groupHtml(l,hs){
 const items=hs.map(h=>`<li><span>${esc(h.message)}</span>${SECTION_KEY[h.section]&&h.section!=='review'?`<button type="button" class="btn small" data-action="goto" data-section="${esc(h.section)}">${esc(T('s256'))}</button>`:''}</li>`).join('');
 return `<details class="lens-group" ${openPanels[l.id]===false?'':'open'} data-lens-group="${esc(l.id)}"><summary><b>${esc(l.title)}</b><span class="pill">${esc(Tf('lensHintCount',[hs.length]))}</span><small class="muted">${esc(sourceLabel(l))}</small></summary><p class="lens-q">${esc(l.question)}</p><ul>${items}</ul><div class="toolbar"><button type="button" class="btn small" data-lens-fb="useful" data-lens-id="${esc(l.id)}">👍 ${esc(T('lensUseful'))}</button><button type="button" class="btn small" data-lens-fb="noise" data-lens-id="${esc(l.id)}">👎 ${esc(T('lensNoise'))}</button><button type="button" class="btn small" data-lens-mute="${esc(l.id)}">${esc(T('lensMute'))}</button></div></details>`;
}
function lensItemHtml(l){
 const custom=l.origin==='user';
 return `<div class="lens-item ${l.muted?'muted':''}"><div class="lens-item-head"><b>${esc(l.title)}</b><small class="muted">${esc(T('lensGroup_'+(l.group||'custom')))} · ${esc(sourceLabel(l))}${l.useful||l.noise?` · 👍 ${l.useful} / 👎 ${l.noise}`:''}</small></div><p class="lens-q"><b>${esc(T('lensQuestion'))}:</b> ${esc(l.question)}</p>${text(l.lookFor)?`<p class="lens-q"><b>${esc(T('lensLook'))}:</b> ${esc(l.lookFor)}</p>`:''}${text(l.example)?`<p class="lens-q muted"><b>${esc(T('lensExample'))}:</b> ${esc(l.example)}</p>`:''}${custom&&l.keywords?.length?`<p class="lens-q muted">${esc(T('lensFieldKeywords'))}: ${esc(l.keywords.join('، '))}</p>`:''}<div class="toolbar">${l.muted?`<button type="button" class="btn small" data-lens-unmute="${esc(l.id)}">${esc(T('lensUnmute'))}</button>`:`<button type="button" class="btn small" data-lens-mute="${esc(l.id)}">${esc(T('lensMute'))}</button>`}${custom?`<button type="button" class="btn small danger" data-lens-delete="${esc(l.id)}">${esc(T('lensDelete'))}</button>`:''}</div></div>`;
}
function formHtml(){
 const groups=['custom','focus','growth','evidence','people','method'].map(g=>`<option value="${g}">${esc(T('lensGroup_'+g))}</option>`).join('');
 return `<details class="lens-add" ${openPanels.add?'open':''}><summary>${esc(T('lensAdd'))}</summary><p class="muted">${esc(T('lensAddLead'))}</p><div class="lens-form"><label class="field"><span>${esc(T('lensFieldTitle'))}</span><input type="text" data-lens-field="title" maxlength="160"></label><label class="field"><span>${esc(T('lensFieldGroup'))}</span><select data-lens-field="group">${groups}</select></label><label class="field full"><span>${esc(T('lensFieldQuestion'))}</span><textarea rows="2" data-lens-field="question" maxlength="600"></textarea></label><label class="field full"><span>${esc(T('lensFieldLook'))}</span><textarea rows="2" data-lens-field="lookFor" maxlength="600"></textarea></label><label class="field full"><span>${esc(T('lensFieldKeywords'))}</span><input type="text" data-lens-field="keywords"></label></div><div class="toolbar"><button type="button" class="btn primary small" data-lens-save>${esc(T('lensSave'))}</button><button type="button" class="btn small" data-lens-cancel>${esc(T('lensCancel'))}</button></div></details>`;
}
function notesHtml(){
 const cands=candidates.length?`<h4>${esc(T('lensCandidates'))}</h4><ul class="lens-cands">${candidates.map((c,i)=>`<li><div><b>${esc(c.title)}</b><div class="lens-q">${esc(c.question)}</div>${c.keywords?.length?`<small class="muted">${esc(c.keywords.join('، '))}</small>`:''}</div><span class="toolbar"><button type="button" class="btn small primary" data-lens-keep="${i}">${esc(T('lensKeep'))}</button><button type="button" class="btn small" data-lens-drop="${i}">${esc(T('lensDrop'))}</button></span></li>`).join('')}</ul><div class="toolbar"><button type="button" class="btn small" data-lens-keep-all>${esc(T('lensKeepAll'))}</button></div>`:'';
 return `<details class="lens-notes" ${openPanels.notes?'open':''}><summary>${esc(T('lensNotes'))}</summary><p class="muted">${esc(T('lensNotesLead'))}</p><textarea rows="6" data-lens-notes placeholder="${esc(T('lensNotesPlaceholder'))}">${esc(notes)}</textarea><div class="toolbar"><button type="button" class="btn small primary" data-lens-extract>${esc(T('lensExtract'))}</button>${AI?`<button type="button" class="btn small" data-lens-extract-ai ${AI.configured()?'':'disabled'}>✦ ${esc(T('lensExtractAI'))}</button>`:''}</div><div class="gw-progress" data-lens-progress hidden></div>${cands}</details>`;
}
function cardHtml(p){
 const all=Lens.all(),active=all.filter(l=>!l.muted),hs=Lens.hints(p),m=Lens.mem();
 const byLens=new Map();for(const h of hs){if(!byLens.has(h.lens))byLens.set(h.lens,[]);byLens.get(h.lens).push(h);}
 const groups=[...byLens.entries()].map(([id,list])=>{const l=all.find(x=>x.id===id);return l?groupHtml(l,list):'';}).join('');
 const builtin=all.filter(l=>l.origin!=='user'),mine=all.filter(l=>l.origin==='user'),muted=all.filter(l=>l.muted).length;
 return `<article class="card lens-card"><div class="feature-head"><h2>◎ ${esc(T('lensTitle'))}</h2><span class="muted">${active.length} · ${esc(Tf('lensHintCount',[hs.length]))}${muted?` · ${esc(Tf('lensMutedCount',[muted]))}`:''}</span></div><p class="muted">${esc(T('lensLead'))}</p><p class="help">${esc(T('lensApplied'))}</p><div class="lens-hints">${groups||`<p class="hint">${esc(T('lensNone'))}</p>`}</div>
 <details class="lens-all" ${openPanels.all?'open':''}><summary>${esc(T('lensBuiltin'))} (${builtin.length}) · ${esc(T('lensMine'))} (${mine.length})</summary><div class="lens-list">${mine.length?`<h4>${esc(T('lensMine'))}</h4>${mine.map(lensItemHtml).join('')}`:''}<h4>${esc(T('lensBuiltin'))}</h4>${builtin.map(lensItemHtml).join('')}</div></details>
 ${formHtml()}${notesHtml()}
 <div class="toolbar lens-footer"><label class="lens-include"><input type="checkbox" data-lens-include ${m.includeInAI?'checked':''}> ${esc(T('lensIncludeAI'))}</label><button type="button" class="btn small" data-lens-export>${esc(T('lensExport'))}</button><label class="btn small">${esc(T('lensImport'))}<input type="file" accept="application/json,.json" hidden data-lens-import></label></div><p class="help">${esc(T('lensDisclaimer'))}</p></article>`;
}
function render(force,attempt=0){
 const s=section(),content=document.getElementById('content');if(!content)return;
 if(s==='review'){
  const p=project();if(!p)return;
  /* The AI review card is inserted by the guided layer in its own render pass; wait briefly for it so the lens card follows it and its findings can be decorated. */
  if(!content.querySelector('.ai-review')&&attempt<6){setTimeout(()=>render(force,attempt+1),40);return;}
  decorateReview(p,content);
  const old=content.querySelector('.lens-card');if(old&&!force)return;if(old)old.remove();
  const html=cardHtml(p);const anchor=content.querySelector('.ai-review')||content.querySelector('.semantic-hints')||content.querySelector('.review-executive')||content.querySelector('.heading');
  if(anchor)anchor.insertAdjacentHTML('afterend',html);else content.insertAdjacentHTML('afterbegin',html);
 }else if(s==='guide'){
  const build=content.querySelector('.gw-build');if(build&&!build.querySelector('.lens-step-note')){const n=Lens.active().length;const lead=build.querySelector('p.muted');const html=`<p class="hint lens-step-note">◎ ${esc(Tf('lensStep5',[n]))}</p>`;if(lead)lead.insertAdjacentHTML('afterend',html);else build.insertAdjacentHTML('afterbegin',html);}
 }
}
/* AI review findings: show the lens that produced a finding and let the expert keep it as a pattern. */
function decorateReview(p,content){
 const items=p.context?.reviews?.at(-1)?.items||[];const lis=content.querySelectorAll('.ai-review-items > li');
 lis.forEach((li,i)=>{if(li.querySelector('[data-lens-learn]'))return;const it=items[i];if(!it)return;if(text(it.lens)){const pill=document.createElement('span');pill.className='lens-pill';pill.textContent=T('lensAiLabel')+': '+Lens.label(it.lens);li.insertBefore(pill,li.querySelector('button'));}const b=document.createElement('button');b.type='button';b.className='btn small';b.dataset.lensLearn=String(i);b.textContent=T('lensMakePattern');li.append(b);});
}
function readForm(card){const v=k=>card.querySelector(`[data-lens-field="${k}"]`)?.value||'';return {title:v('title'),question:v('question'),lookFor:v('lookFor'),keywords:v('keywords'),group:v('group')||'custom',source:'user'};}
function rerender(){render(true);}
document.addEventListener('toggle',e=>{const d=e.target;if(!(d instanceof HTMLDetailsElement))return;if(d.matches('.lens-add'))openPanels.add=d.open;else if(d.matches('.lens-notes'))openPanels.notes=d.open;else if(d.matches('.lens-all'))openPanels.all=d.open;else if(d.dataset.lensGroup)openPanels[d.dataset.lensGroup]=d.open;},true);
document.addEventListener('input',e=>{if(e.target.matches('[data-lens-notes]'))notes=e.target.value;});
document.addEventListener('change',e=>{
 const inc=e.target.closest('[data-lens-include]');if(inc){Lens.setIncludeInAI(inc.checked);return;}
 const imp=e.target.closest('[data-lens-import]');if(imp&&imp.files?.[0]){const f=imp.files[0];f.text().then(txt=>{try{Lens.importJson(txt);toast(T('lensImported'));rerender();}catch{toast(T('lensImportFailed'));}});}
});
document.addEventListener('click',async e=>{
 const card=e.target.closest('.lens-card');
 const fb=e.target.closest('[data-lens-fb]');if(fb){Lens.feedback(fb.dataset.lensId,fb.dataset.lensFb);toast(T('lensFeedbackSaved'));rerender();return;}
 const mute=e.target.closest('[data-lens-mute]');if(mute){Lens.setEnabled(mute.dataset.lensMute,false);rerender();return;}
 const un=e.target.closest('[data-lens-unmute]');if(un){Lens.setEnabled(un.dataset.lensUnmute,true);rerender();return;}
 const del=e.target.closest('[data-lens-delete]');if(del){Lens.forget(del.dataset.lensDelete);rerender();return;}
 if(e.target.closest('[data-lens-save]')&&card){const f=readForm(card);if(!text(f.title)&&!text(f.question))return;if(!text(f.title))f.title=f.question.slice(0,90);const l=Lens.learn(f);if(l){openPanels.add=false;toast(T('lensSaved'));rerender();}return;}
 if(e.target.closest('[data-lens-cancel]')&&card){openPanels.add=false;rerender();return;}
 const learn=e.target.closest('[data-lens-learn]');if(learn){const p=project();const it=p?.context?.reviews?.at(-1)?.items?.[Number(learn.dataset.lensLearn)];if(it&&Lens.fromFinding(it,'ai-review')){toast(T('lensLearned'));learn.disabled=true;rerender();}return;}
 if(e.target.closest('[data-lens-extract]')&&card){candidates=Lens.extract(notes);openPanels.notes=true;if(!candidates.length)toast(T('lensNoCandidates'));rerender();return;}
 const ai=e.target.closest('[data-lens-extract-ai]');if(ai&&card){if(!AI?.configured()){root.SultanGuided?.openAISettings?.();return;}const box=card.querySelector('[data-lens-progress]');box.hidden=false;box.innerHTML=`<span class="gw-spinner" aria-hidden="true"></span><span>${esc(T('lensExtracting'))}</span>`;ai.disabled=true;
  try{const r=await AI.extractLenses({text:notes});candidates=(r.data?.lenses||[]).map(c=>({title:c.title,question:c.question,lookFor:c.lookFor,keywords:c.keywords||[],group:c.group||'custom',source:'notes'}));openPanels.notes=true;const p=project();if(p&&E.recordAiUse){E.recordAiUse(p,{model:r.usage.model,purpose:'lenses',inputTokens:r.usage.inputTokens,outputTokens:r.usage.outputTokens});root.SultanApp.setProject(p);}if(!candidates.length)toast(T('lensNoCandidates'));rerender();}
  catch(err){box.innerHTML=`<p class="fg-ai-error">${esc(err?.message||String(err))}</p>`;ai.disabled=false;}
  return;}
 const keep=e.target.closest('[data-lens-keep]');if(keep){const c=candidates[Number(keep.dataset.lensKeep)];if(c)Lens.learn(c);candidates.splice(Number(keep.dataset.lensKeep),1);toast(T('lensSaved'));rerender();return;}
 const drop=e.target.closest('[data-lens-drop]');if(drop){candidates.splice(Number(drop.dataset.lensDrop),1);rerender();return;}
 if(e.target.closest('[data-lens-keep-all]')){for(const c of candidates)Lens.learn(c);candidates=[];toast(T('lensSaved'));rerender();return;}
 if(e.target.closest('[data-lens-export]')){dl('SULTAN_expert_lenses.json',Lens.exportJson());return;}
});
document.addEventListener('sultan:render',()=>setTimeout(()=>render(false),0));setTimeout(()=>render(false),0);
root.SultanLensUI={render:rerender};
})(typeof globalThis!=='undefined'?globalThis:this);
