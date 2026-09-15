/* Complete C2/D1 dashboard visuals without adding external chart libraries. */
(function(root){
'use strict';
if(!root.SultanApp||!root.SultanI18n)return;
const T=root.SultanI18n.t;
const esc=x=>String(x??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const num=x=>typeof x==='number'&&Number.isFinite(x);
const clamp=(x,a,b)=>Math.max(a,Math.min(b,x));

function ensureStyle(){
 if(document.getElementById('final-dashboard-polish-style'))return;
 const style=document.createElement('style');style.id='final-dashboard-polish-style';
 style.textContent=`
 .track-status-bar{display:grid;grid-template-columns:repeat(4,1fr);gap:4px;margin:8px 0 12px}
 .track-status-bar span{height:8px;border-radius:999px;background:#e6e9ef;opacity:.52}
 .track-status-bar span.active{opacity:1;box-shadow:0 0 0 1px rgba(11,45,99,.08)}
 .track-status-bar .ahead.active{background:#3d8a64}.track-status-bar .onTrack.active{background:#315b97}
 .track-status-bar .behind.active{background:#b44848}.track-status-bar .noReading.active{background:#8a93a0}
 .maturity-visuals{display:grid;gap:16px}.maturity-row{border:1px solid #e2e7ef;border-radius:10px;padding:12px;background:#fff}
 .maturity-row-head{display:flex;justify-content:space-between;gap:12px;align-items:center;margin-bottom:8px}
 .maturity-row-head small{color:#667085}.maturity-scale{position:relative;height:34px;border-radius:8px;background:linear-gradient(90deg,#eef1f6 0 20%,#e6ebf3 20% 40%,#dde5f0 40% 60%,#d5dfed 60% 80%,#ccd9e9 80% 100%);overflow:visible}
 .maturity-scale:before{content:"";position:absolute;inset:0;background:repeating-linear-gradient(90deg,transparent 0 calc(20% - 1px),rgba(11,45,99,.12) calc(20% - 1px) 20%);pointer-events:none}
 .maturity-current,.maturity-target{position:absolute;top:50%;transform:translate(-50%,-50%);width:13px;height:13px;border-radius:50%;z-index:2}
 [dir="rtl"] .maturity-current,[dir="rtl"] .maturity-target{transform:translate(50%,-50%)}
 .maturity-current{background:#0b2d63;box-shadow:0 0 0 3px #fff,0 0 0 4px rgba(11,45,99,.25)}
 .maturity-target{background:#caa85e;box-shadow:0 0 0 3px #fff,0 0 0 4px rgba(202,168,94,.35)}
 .maturity-legend{display:flex;gap:14px;flex-wrap:wrap;margin-top:8px;font-size:11px;color:#697386}
 .maturity-legend i{display:inline-block;width:9px;height:9px;border-radius:50%;margin-inline-end:5px}.maturity-legend .cur i{background:#0b2d63}.maturity-legend .tar i{background:#caa85e}
 `;
 document.head.append(style);
}

function addStatusBars(){
 const dashboard=document.querySelector('.final-dashboard');if(!dashboard)return;
 dashboard.querySelectorAll('.track-card').forEach(card=>{
  if(card.querySelector('.track-status-bar'))return;
  const status=card.querySelector('.status');if(!status)return;
  const state=status.classList.contains('observed')?'observed':(['ahead','onTrack','behind','noReading'].find(k=>status.classList.contains(k))||'noReading');
  if(state==='observed')return;
  const keys=['ahead','onTrack','behind','noReading'];
  const bar=document.createElement('div');bar.className='track-status-bar';bar.setAttribute('role','img');bar.setAttribute('aria-label',T(state));
  bar.innerHTML=keys.map(k=>`<span class="${k}${k===state?' active':''}" title="${esc(T(k))}"></span>`).join('');
  const svg=card.querySelector('.track-svg');if(svg)svg.insertAdjacentElement('beforebegin',bar);else card.append(bar);
 });
}

function addMaturityCharts(){
 const dashboard=document.querySelector('.final-dashboard');if(!dashboard)return;
 const p=root.SultanApp.getProject();
 const rows=(p.transitions||[]).filter(t=>t.trackType==='maturity');
 if(!rows.length)return;
 const heading=Array.from(dashboard.querySelectorAll('h3')).find(h=>h.textContent.trim()===T('dashboardMaturity'));
 const section=heading?.closest('section');if(!section||section.querySelector('.maturity-visuals'))return;
 Array.from(section.querySelectorAll(':scope > p')).forEach(x=>x.remove());
 const wrap=document.createElement('div');wrap.className='maturity-visuals';
 wrap.innerHTML=rows.map(t=>{
  const current=num(t.baseline)?clamp(t.baseline,0,5):null,target=num(t.target)?clamp(t.target,0,5):null;
  const pos=v=>root.SultanI18n.direction==='rtl'?(100-v/5*100):(v/5*100);
  return `<div class="maturity-row"><div class="maturity-row-head"><b>${esc(t.maturityFamily||t.domain||T('maturity'))}</b><small>${current==null?'—':current} → ${target==null?'—':target} / 5</small></div><div class="maturity-scale" aria-label="${esc(T('dashboardMaturity'))}">${current==null?'':`<i class="maturity-current" style="left:${pos(current)}%" title="${esc(String(current))}"></i>`}${target==null?'':`<i class="maturity-target" style="left:${pos(target)}%" title="${esc(String(target))}"></i>`}</div><div class="maturity-legend"><span class="cur"><i></i>${esc(T('s341'))}: ${current==null?'—':current}</span><span class="tar"><i></i>${esc(T('s343'))}: ${target==null?'—':target}</span></div></div>`;
 }).join('');
 section.append(wrap);
}

function run(){if(location.hash!=='#review')return;setTimeout(()=>{ensureStyle();addStatusBars();addMaturityCharts();},0);}
document.addEventListener('sultan:render',run);run();
})(globalThis);
