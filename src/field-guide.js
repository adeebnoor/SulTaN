/* Field guidance and progressive disclosure.
   Answers two expert findings: "too many fields" and "no guidance on why a field exists".
   - Simple / Expert mode: in simple mode every record keeps only its essential fields visible; the rest
     move into one collapsed "advanced fields" group per record (nothing is deleted, hidden fields still
     save and still count in check()).
   - "Why this field?" toggles: every field gets a short why + example drawn from the field-guide catalogue.
   - AI drafting per field (✦) when the AI layer is configured; otherwise the button opens AI settings.
   - Provenance pills on records that came from the sector library or the AI draft. */
(function(root){
'use strict';
const E=root.Sultan,I=root.SultanI18n,T=I.t;
if(!E)return;
const esc=x=>String(x??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const text=x=>typeof x==='string'&&x.trim().length>0;
const MODE_KEY='sultan.ui.mode',GUIDE_KEY='sultan.ui.guide';
const store={get(k){try{return localStorage.getItem(k);}catch{return null;}},set(k,v){try{localStorage.setItem(k,v);}catch{}}};
const section=()=>location.hash.slice(1)||'home';
const project=()=>root.SultanApp?.getProject?.();

/* ---------------------------------------------------------------- mode */
function mode(){const saved=store.get(MODE_KEY);if(saved==='simple'||saved==='expert')return saved;const p=project();return p?.isDemo?'expert':'simple';}
function setMode(m){if(!['simple','expert'].includes(m))return;store.set(MODE_KEY,m);applyBodyClass();root.SultanApp?.navigate(section());}
function applyBodyClass(){const m=mode();document.body.classList.toggle('ux-simple',m==='simple');document.body.classList.toggle('ux-expert',m==='expert');}
function guideAll(){return store.get(GUIDE_KEY)==='1';}

/* ---------------------------------------------------------------- patterns */
function pattern(path){
 const parts=String(path||'').split('.').filter(x=>!/^\d+$/.test(x));
 const i=parts.indexOf('scores');if(i>=0&&parts.length>i+2)parts.splice(i+1,1);
 return parts.join('.');
}
const ADVANCED=new Set(['institution.assets','institution.liabilities','institution.context','institution.culture','institution.notDoing',
 'mandates.source','mandates.contribution',
 'options.owner','options.decisionReason','options.riskSource','options.riskDate','options.stopEvidence','options.scores.note',
 'references.purpose','references.context','references.adaptation',
 'transitions.referenceId','transitions.owner','transitions.current','transitions.currentSource','transitions.targetState','transitions.frequency','transitions.dataSource','transitions.rf','transitions.history.year','transitions.history.value','transitions.history.source','transitions.trackType','transitions.maturityFamily','transitions.indicatorType',
 'criteria.low','criteria.high',
 'enablers.action','enablers.source','enablers.route','enablers.fallback',
 'initiatives.kind','initiatives.status','initiatives.output','initiatives.acceptance','initiatives.capacity','initiatives.budgetStatus','initiatives.budget.releaseEvidence']);
const ESSENTIAL_IN_DETAILS=new Set(['transitions.kpi','transitions.unit','transitions.direction','transitions.baseline','transitions.target']);
function recordOf(path,p){const m=String(path||'').match(/^(options|references|transitions|enablers|initiatives|mandates|criteria)\.(\d+)/);if(!m)return null;return p?.[m[1]]?.[Number(m[2])]||null;}
function isAdvanced(path,p){const key=pattern(path);if(key==='options.foothold'){const o=recordOf(path,p);return !o||o.type!=='moonshot';}return ADVANCED.has(key);}
function containerOf(field){const path=field.querySelector('[data-path]')?.dataset.path||'';if(/^(mandates|references|criteria)\./.test(path)){const d=field.closest('details');if(d&&d.closest('#content'))return d;}return field.closest('article.card');}
function stableKey(path,p){let cur=p;return String(path).split('.').map(part=>{if(Array.isArray(cur)&&/^\d+$/.test(part)){const item=cur[Number(part)];cur=item;return '['+(item?.id??item?.year??part)+']';}cur=cur?.[part];return part;}).join('.');}
const advancedState=new Map();

/* ---------------------------------------------------------------- disclosure */
function disclose(){
 const p=project(),content=document.getElementById('content'),s=section();
 if(!p||!content||mode()!=='simple'||['home','about','guide','review','council'].includes(s))return;
 if(content.querySelector('.identity-starter'))return; // final-ui already discloses the empty identity form
 const groups=new Map();
 const add=(container,el)=>{if(!container||!el)return;if(!groups.has(container))groups.set(container,{fields:[],blocks:[]});if(el.classList.contains('field'))groups.get(container).fields.push(el);else groups.get(container).blocks.push(el);};
 // Essential KPI fields that the base template hides inside a closed details move up into the main grid.
 for(const ctrl of content.querySelectorAll('.field [data-path]')){
  const key=pattern(ctrl.dataset.path);if(!ESSENTIAL_IN_DETAILS.has(key))continue;
  const field=ctrl.closest('.field'),card=field?.closest('article.card'),details=field?.closest('details');
  if(!card||!details||!card.contains(details)||details.classList.contains('fx-advanced'))continue;
  const grid=card.querySelector(':scope > .grid2');if(grid)grid.append(field);
 }
 for(const ctrl of content.querySelectorAll('.field [data-path]')){
  const field=ctrl.closest('.field');if(!field||field.closest('.fx-advanced'))continue;
  if(!isAdvanced(ctrl.dataset.path,p))continue;
  add(containerOf(field),field);
 }
 for(const block of content.querySelectorAll('.assumption-register,.final-transition-fields,.criterion-polarity'))if(!block.closest('.fx-advanced'))add(block.closest('article.card')||block.closest('details'),block);
 for(const list of content.querySelectorAll('.checklist'))if(!list.closest('.fx-advanced')){const holder=list.closest('.field')||list;add(holder.closest('article.card'),holder);}
 for(const d of content.querySelectorAll('article.card > details'))if(!d.classList.contains('fx-advanced')&&!d.classList.contains('annual-details')&&!d.querySelector('[data-path$=".milestone"]')&&d.querySelector('[data-action="hist-add"]'))add(d.closest('article.card'),d);
 for(const [container,g] of groups){
  const total=g.fields.length+g.blocks.length;if(!total)continue;
  let details=container.querySelector(':scope > .fx-advanced');
  if(!details){details=document.createElement('details');details.className='fx-advanced';details.innerHTML=`<summary><span class="fx-adv-label"></span><small>${esc(T('uxAdvancedHint'))}</small></summary><div class="grid2 fx-adv-grid"></div><div class="fx-adv-blocks"></div>`;const toolbar=Array.from(container.children).find(c=>c.classList?.contains('toolbar'));if(toolbar)container.insertBefore(details,toolbar);else container.append(details);}
  const first=g.fields[0]?.querySelector('[data-path]')?.dataset.path||g.blocks[0]?.querySelector('[data-path]')?.dataset.path||'';
  const key=s+'|'+stableKey(first,p);details.dataset.fxKey=key;details.open=advancedState.get(key)===true;
  details.querySelector('.fx-adv-label').textContent=T('uxAdvancedFields',[total]);
  const grid=details.querySelector('.fx-adv-grid'),blocks=details.querySelector('.fx-adv-blocks');
  for(const f of g.fields)grid.append(f);for(const b of g.blocks)blocks.append(b);
  // Wrappers left without any field are noise.
  for(const d of Array.from(container.querySelectorAll('details')))if(d!==details&&!d.classList.contains('annual-details')&&!d.closest('.fx-advanced')&&!d.querySelector('[data-path],.btn,.annual-details'))d.remove();
  for(const gr of Array.from(container.querySelectorAll('.grid2,.grid3')))if(!gr.closest('.fx-advanced')&&!gr.children.length)gr.remove();
 }
}
document.addEventListener('toggle',e=>{const d=e.target;if(d?.classList?.contains('fx-advanced')&&d.dataset.fxKey)advancedState.set(d.dataset.fxKey,d.open);},true);

/* ---------------------------------------------------------------- why panels + AI buttons */
function guide(path){const key=pattern(path).replace(/\./g,'_');const dict=root.SultanLocales?.[I.language]||{};const why=dict['fgw_'+key],example=dict['fge_'+key];return why?{why,example:example||''}:null;}
function textual(ctrl){return ctrl.tagName==='TEXTAREA'||(ctrl.tagName==='INPUT'&&(ctrl.type==='text'||!ctrl.type));}
function decorate(){
 const content=document.getElementById('content');if(!content||['home','about','council'].includes(section()))return;
 const openAll=guideAll();
 for(const ctrl of content.querySelectorAll('.field [data-path]')){
  const field=ctrl.closest('.field');if(!field||field.dataset.fgDone)continue;field.dataset.fgDone='1';
  const label=field.querySelector(':scope > span:first-child');if(!label)continue;
  const g=guide(ctrl.dataset.path);
  let tools=field.querySelector('.fg-tools');if(!tools){tools=document.createElement('span');tools.className='fg-tools';label.append(tools);}
  if(g){const b=document.createElement('button');b.type='button';b.className='fg-toggle';b.setAttribute('aria-expanded',String(openAll));b.setAttribute('aria-label',T('uxWhyThisField'));b.title=T('uxWhyThisField');b.textContent='؟';if(I.language==='en')b.textContent='?';tools.append(b);
   const panel=document.createElement('div');panel.className='fg-panel';panel.hidden=!openAll;panel.innerHTML=`<p class="fg-why">${esc(g.why)}</p>${g.example?`<p class="fg-example"><b>${esc(T('uxExample'))}</b> ${esc(g.example)}</p>`:''}`;ctrl.insertAdjacentElement('afterend',panel);}
  if(textual(ctrl)&&root.SultanAI){const a=document.createElement('button');a.type='button';a.className='fg-ai';a.dataset.fgAi=ctrl.dataset.path;a.title=T(root.SultanAI.configured()?'uxAiSuggest':'localSuggest');a.setAttribute('aria-label',a.title);a.textContent='✦';tools.append(a);}
 }
}
function renderModeSwitch(){
 const bar=document.querySelector('.topbar .toolbar');if(!bar)return;
 let box=bar.querySelector('.ux-mode');
 if(!box){box=document.createElement('div');box.className='ux-mode';box.setAttribute('role','group');box.setAttribute('aria-label',T('uxModeLabel'));box.innerHTML=`<button type="button" data-ux-mode="simple">${esc(T('uxModeSimple'))}</button><button type="button" data-ux-mode="expert">${esc(T('uxModeExpert'))}</button>`;bar.prepend(box);}
 const m=mode();box.querySelectorAll('[data-ux-mode]').forEach(b=>{const on=b.dataset.uxMode===m;b.setAttribute('aria-pressed',String(on));b.title=on?'':(b.dataset.uxMode==='simple'?T('uxModeSimpleHelp'):T('uxModeExpertHelp'));});
}
function renderGuideSwitch(){
 const content=document.getElementById('content'),s=section();if(!content||['home','about','guide','council'].includes(s))return;
 const heading=content.querySelector('.heading');if(!heading||heading.querySelector('.fg-guide-switch'))return;
 const on=guideAll();const b=document.createElement('button');b.type='button';b.className='btn small fg-guide-switch';b.dataset.fgGuideAll='1';b.setAttribute('aria-pressed',String(on));b.textContent=on?T('uxGuideHide'):T('uxGuideShow');heading.append(b);
}
function renderProvenance(){
 const p=project(),content=document.getElementById('content'),D=root.SultanDraft;if(!p||!content||!D)return;
 for(const kind of ['options','references','transitions','enablers','initiatives','mandates']){
  (p[kind]||[]).forEach((rec,i)=>{
   const origin=D.origin(rec.id);if(!origin)return;
   const ctrl=content.querySelector(`[data-path^="${kind}.${i}."]`);if(!ctrl)return;
   const container=/^(mandates|references)\./.test(ctrl.dataset.path)?ctrl.closest('details'):ctrl.closest('article.card');
   const head=container?.querySelector(':scope > h2, :scope > summary');if(!head||head.querySelector('.fx-origin'))return;
   const pill=document.createElement('span');pill.className='pill fx-origin '+origin;pill.textContent=origin==='library'?T('uxOriginLibrary'):T('uxOriginAi');head.append(pill);
  });
 }
}
/* ---------------------------------------------------------------- AI field suggestion */
async function suggest(button){
 const path=button.dataset.fgAi,p=project(),AI=root.SultanAI;if(!p||!AI)return;
 const local=!AI.configured();
 /* The usage log triggers a re-render, so the field and its panel are located again by path after the call. */
 const locate=()=>{const c=document.querySelector(`#content [data-path="${path}"]`),f=c?.closest('.field');if(!f)return null;let b=f.querySelector('.fg-ai-panel');if(!b){b=document.createElement('div');b.className='fg-ai-panel';f.append(b);}return {field:f,ctrl:c,box:b};};
 let at=locate();if(!at)return;let {field,ctrl,box}=at;
 box.hidden=false;box.innerHTML=`<p class="muted">${esc(T('uxAiWorking'))}</p>`;button.disabled=true;
 try{
  const g=guide(path);const label=field.querySelector(':scope > span:first-child')?.childNodes[0]?.textContent?.trim()||path;
  const sector=(root.SultanLibrary?.forMarket?.(p.context?.market)||root.SultanLibrary)?.sector(p.context?.sectorId);const keys=path.split('.');const tpl=keys[0]==='institution'?sector?.templates?.[keys[1]]:null;const localText=tpl?root.SultanLibrary.pick(tpl,I.language):(g?.example||g?.why||label);const r=local?{text:localText,usage:{model:'local-library'}}:await AI.suggestField({project:p,path,label,why:g?.why||'',current:ctrl.value,section:section()});
  if(!local&&E.recordAiUse){const q=project();E.recordAiUse(q,{model:r.usage.model,purpose:'field',inputTokens:r.usage.inputTokens,outputTokens:r.usage.outputTokens});root.SultanApp.setProject(q);at=locate();if(!at)return;({ctrl,box}=at);}
  box.hidden=false;box.innerHTML=`<div class="fg-ai-text">${esc(r.text)}</div><div class="toolbar"><button type="button" class="btn small primary" data-fg-apply="replace">${esc(T('uxAiUse'))}</button>${text(ctrl.value)?`<button type="button" class="btn small" data-fg-apply="append">${esc(T('uxAiAppend'))}</button>`:''}<button type="button" class="btn small" data-fg-apply="dismiss">${esc(T('uxAiDismiss'))}</button></div><small class="muted">${esc(T(local?'localFieldDisclaimer':'uxAiDisclaimer'))}</small>`;
  box.dataset.text=r.text;
 }catch(err){box.innerHTML=`<p class="fg-ai-error">${esc(err?.message||String(err))}</p><div class="toolbar"><button type="button" class="btn small" data-fg-apply="dismiss">${esc(T('uxAiDismiss'))}</button></div>`;}
 finally{button.disabled=false;}
}
function applySuggestion(b){
 const box=b.closest('.fg-ai-panel'),field=b.closest('.field'),ctrl=field?.querySelector('[data-path]');if(!box||!ctrl)return;
 const how=b.dataset.fgApply;
 if(how!=='dismiss'){const value=how==='append'&&text(ctrl.value)?ctrl.value.trimEnd()+'\n'+box.dataset.text:box.dataset.text;ctrl.value=value;ctrl.dispatchEvent(new Event('input',{bubbles:true}));ctrl.dispatchEvent(new Event('change',{bubbles:true}));}
 box.remove();
}
document.addEventListener('click',e=>{
 const toggle=e.target.closest('.fg-toggle');
 if(toggle){e.preventDefault();const panel=toggle.closest('.field')?.querySelector('.fg-panel');if(panel){panel.hidden=!panel.hidden;toggle.setAttribute('aria-expanded',String(!panel.hidden));}return;}
 const ai=e.target.closest('[data-fg-ai]');if(ai){e.preventDefault();suggest(ai);return;}
 const apply=e.target.closest('[data-fg-apply]');if(apply){e.preventDefault();applySuggestion(apply);return;}
 const all=e.target.closest('[data-fg-guide-all]');if(all){const next=!guideAll();store.set(GUIDE_KEY,next?'1':'0');document.querySelectorAll('#content .fg-panel').forEach(p=>p.hidden=!next);document.querySelectorAll('#content .fg-toggle').forEach(t=>t.setAttribute('aria-expanded',String(next)));all.textContent=next?T('uxGuideHide'):T('uxGuideShow');all.setAttribute('aria-pressed',String(next));return;}
 const m=e.target.closest('[data-ux-mode]');if(m){setMode(m.dataset.uxMode);}
});
function afterRender(){setTimeout(()=>setTimeout(()=>{applyBodyClass();renderModeSwitch();disclose();decorate();renderGuideSwitch();renderProvenance();},0),0);}
document.addEventListener('sultan:render',afterRender);afterRender();
root.SultanUX={mode,setMode,pattern,isAdvanced,guide,ADVANCED,ESSENTIAL_IN_DETAILS,guideAll};
})(globalThis);
