/* Executive review: absence, estimates and approvals remain different states. */
(function(root){
'use strict';
const E=root.Sultan,T=root.SultanI18n.t;
const esc=x=>String(x??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const money=n=>typeof n==='number'&&Number.isFinite(n)?Math.round(n).toLocaleString('en-US'):'—';
function costText(c){
 if(c.count===0)return esc(T('noInitiatives'));
 if(c.known===0)return esc(T('costUnestimated'));
 return `${money(c.total)} ${esc(T('currencySAR'))}${c.unknown?` ${esc(T('unestimatedYears',[c.unknown]))}`:''}`;
}
function fundingText(c){
 return esc(T(c.state==='no-initiatives'?'fundingNotApplicable':c.confirmed?'fundingConfirmed':'fundingMixed'));
}
function render(){
 if(location.hash!=='#review'||!root.SultanApp)return;
 const content=document.getElementById('content');
 if(!content||content.querySelector('.portfolio-review'))return;
 const p=root.SultanApp.getProject();
 const selected=p.options.filter(o=>o.decision==='select'&&o.type!=='requirement');
 const authority=Object.fromEntries(E.authoritySpace(p).map(x=>[x.optionId,x]));
 const rank=Object.fromEntries(E.ranking(p).map(x=>[x.id,x]));
 const plotted=[],unplotted=[];
 selected.forEach((o,i)=>{
  const v=rank[o.id]?.value,a=authority[o.id]?.clearance;
  if(v==null||a==null)unplotted.push({o,i});else plotted.push({o,i,v,a});
 });
 const dots=plotted.map(({o,i,v,a})=>{
  const label=`${o.title} · ${T('strategicValue')}: ${Math.round(v)} / 100 · ${T('authorityAxis')}: ${Math.round(a)} / 100`;
  return `<button type="button" class="matrix-dot" data-option-id="${esc(o.id)}" data-value="${v}" data-authority="${a}" style="--x:${v};--y:${a}" title="${esc(label)}" aria-label="${esc(label)}"><span>${i+1}</span></button>`;
 }).join('');
 const unknown=unplotted.length?`<div class="matrix-unplotted"><b>${esc(T('unplottedAuthority'))}</b>${unplotted.map(({o,i})=>`<span data-option-id="${esc(o.id)}"><b>${i+1}</b> ${esc(o.title)}</span>`).join('')}</div>`:'';
 const quadrants=[['low-high','matrixLowHigh'],['high-high','matrixHighHigh'],['low-low','matrixLowLow'],['high-low','matrixHighLow']].map(([pos,key])=>`<span class="matrix-quadrant ${pos}">${esc(T(key))}</span>`).join('');
 const card=document.createElement('article');card.className='card portfolio-review';
 card.innerHTML=`<h2>${esc(T('portfolioMatrix'))}</h2><p class="muted">${esc(T('portfolioMatrixHelp'))}</p>
 <p class="matrix-guide" id="matrix-guide">${esc(T('matrixGuide'))}</p>
 <div class="matrix-wrap"><span class="matrix-y">${esc(T('authorityAxis'))} · ${esc(T('authorityDirection'))}</span>
 <div class="matrix" role="group" aria-label="${esc(T('portfolioMatrix'))}" aria-describedby="matrix-guide">
 <i class="matrix-v" aria-hidden="true"></i><i class="matrix-h" aria-hidden="true"></i>
 <span class="matrix-tick x-min" data-axis="x" data-tick="0">0</span><span class="matrix-tick x-max" data-axis="x" data-tick="100">100</span>
 <span class="matrix-tick y-min" data-axis="y" data-tick="0">0</span><span class="matrix-tick y-max" data-axis="y" data-tick="100">100</span>
 ${quadrants}${dots}</div><span class="matrix-x">${esc(T('strategicValue'))} · ${esc(T('valueDirection'))}</span></div>
 ${unknown}<div class="matrix-legend">${selected.map((o,i)=>`<span><b>${i+1}</b> ${esc(o.title)}</span>`).join('')}</div>
 <h2>${esc(T('valueFunding'))}</h2><div class="tablewrap"><table class="value-funding-table"><thead><tr><th>${esc(T('authorityChoice'))}</th><th>${esc(T('strategicValue'))}</th><th>${esc(T('declaredInvestment'))}</th><th>${esc(T('fundingState'))}</th></tr></thead>
 <tbody>${selected.map(o=>{
  const c=E.choiceCost(p,o.id),v=rank[o.id]?.value;
  return `<tr data-option-id="${esc(o.id)}" data-funding-state="${c.state}"><td>${esc(o.title)}</td><td>${v==null?'—':Math.round(v)}</td><td class="declared-cost">${costText(c)}</td><td class="funding-state">${fundingText(c)}</td></tr>`;
 }).join('')}</tbody></table></div>`;
 const heading=content.querySelector('.heading');
 if(heading)heading.insertAdjacentElement('afterend',card);else content.prepend(card);
}
document.addEventListener('sultan:render',()=>setTimeout(render,0));setTimeout(render,0);
})(globalThis);
