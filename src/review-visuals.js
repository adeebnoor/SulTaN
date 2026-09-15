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

/* Public evidence layer: presentation only; the project schema and check() stay unchanged. */
(function(root){
'use strict';
const E=root.Sultan,I=root.SultanI18n,T=I.t;
const esc=x=>String(x??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const num=x=>typeof x==='number'&&Number.isFinite(x);
const text=x=>typeof x==='string'&&x.trim().length>0;
const fmt=x=>num(x)?x.toLocaleString('en-US',{maximumFractionDigits:1}):'—';
const anchors={methodology:'vNavMethod',outputs:'vNavOutputs','privacy-limits':'vNavPrivacy','about-sultan':'vNavAbout'};
const annualState=new Map();
let pendingAnchor=root.SultanVision?.initialAnchor||'';

function addStyles(){
 if(document.getElementById('sultan-v-layer-styles'))return;
 const style=document.createElement('style');style.id='sultan-v-layer-styles';
 style.textContent=`
 .v-legacy-action{display:none!important}.v-public-anchor{display:none;align-items:center;color:var(--brand-navy,#0b2d63);text-decoration:none;font-size:14px;min-height:44px;padding:8px 0;border-bottom:2px solid transparent}.is-home .v-public-anchor{display:inline-flex}.v-public-anchor:hover,.v-public-anchor:focus-visible,.v-public-anchor[aria-current]{border-color:#b79d59}.v-home-feedback{display:inline-flex!important}.v-home-feedback.btn{min-height:44px}.v-public-section{scroll-margin-top:24px}
 .v-chart-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:20px}.v-chart-card,.v-output-grid article{min-width:0;border:1px solid #ddd3bf;border-radius:14px;padding:24px;background:#fffdf8;position:relative}.v-chart-card h3{font-size:22px;color:#0b2d63;line-height:1.55;padding-inline-end:20px}.v-chart-card p{font-size:14px;color:#526177;line-height:1.8}.v-chart-card .v-caption{margin:16px 0 0}.v-svg{display:block;width:100%;height:auto;direction:ltr;overflow:visible;background:#f9f6ef;border-radius:10px}.v-svg text{font-family:Tahoma,Arial,sans-serif;fill:#203e62;font-size:17px}.v-svg .v-axis-title{font-size:16px}.v-grid{stroke:#e4dccd;stroke-width:1}.v-axis{stroke:#9d9d95;stroke-width:1}.v-series{fill:none;stroke-width:3}.v-current{stroke:#967729;stroke-width:1.5;stroke-dasharray:4 5}.v-threshold{stroke:#934540;stroke-width:2;stroke-dasharray:6 4}.v-crossing{fill:#934540;stroke:#fffdf8;stroke-width:2}.v-point{stroke:#fffdf8;stroke-width:1.5}
 .v-chart-legend{display:flex;flex-wrap:wrap;gap:8px 18px;margin-top:14px;font-size:13px;line-height:1.7}.v-chart-legend span{display:flex;align-items:center;gap:7px;overflow-wrap:anywhere;min-width:0}.v-chart-legend i{display:block;width:20px;height:3px;flex:none}.v-metrics{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:8px;margin:16px 0}.v-metrics div{min-width:0;border-inline-start:2px solid #caa85e;padding-inline-start:10px}.v-metrics dt{font-size:12px;color:#526177;line-height:1.6}.v-metrics dd{font-size:24px;font-weight:bold;color:#0b2d63;margin:6px 0 0}.v-authority-grid .v-cell{fill:#eee9df;stroke:#fffdf8;stroke-width:3}.v-authority-grid .v-cell.known-ready{fill:#ddebe3}.v-authority-grid .v-cell.pending{fill:#f1e5c7}.v-authority-grid .v-cell.blocked{fill:#efdbd7}.v-authority-grid .v-cell-value{font-size:23px;font-weight:bold}.v-unknown{padding:12px;border:1px dashed #a79879;background:#fbf7ee}
 .v-wide{grid-column:1/-1}.v-chain{display:grid;grid-template-columns:repeat(5,minmax(0,1fr));gap:12px;padding:0;list-style:none;margin:20px 0 0}.v-chain li{min-width:0;border-top:3px solid #b79d59;background:#f5f0e5;padding:14px;font-size:12px;overflow-wrap:anywhere}.v-chain b{display:block;font-size:14px;color:#0b2d63;margin-bottom:8px}.v-chain p{font-size:12px;margin:0}.v-chain small{display:block;color:#526177;margin-top:10px}.v-block-number{display:flex;align-items:baseline;gap:10px}.v-block-number strong{font:600 52px/1.2 Georgia,serif;color:#87502f}.v-block-number span{font-size:14px}.v-block-items{font-size:13px;padding-inline-start:20px;line-height:1.8}.v-block-items li{margin:8px 0}
 .v-output-grid{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:16px}.v-output-grid h3{font-size:20px;margin-top:14px;color:#0b2d63}.v-output-grid p{font-size:14px;color:#526177;margin:0}.vision-reference{background:#0b234d;color:#fff;padding-block:58px}.vision-head{display:grid;grid-template-columns:minmax(0,1fr) auto;gap:28px;align-items:end}.vision-head h2{font-size:32px;line-height:1.6;color:#fff;margin:8px 0}.vision-head p{color:#d0d9e8;max-width:760px}.vision-reference .eyebrow{color:#e8d28d}.vision-source{display:inline-flex;align-items:center;min-height:44px;color:#09234e!important;background:#e8d28d;border-radius:8px;padding:11px 15px;text-decoration:none;font-weight:700;white-space:normal}.vision-programs{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:10px;margin:28px 0 0;padding:0;list-style:none}.vision-programs li{border:1px solid #557095;background:#ffffff08;border-radius:9px;padding:16px;font-size:14px;min-width:0;display:flex;flex-direction:column;justify-content:space-between;gap:8px}.vision-programs .program-completed{border-style:dashed}.vision-programs small{color:#ead393;font-size:12px}.vision-disclaimer{font-size:13px;color:#cbd7e8;margin:22px 0 0;line-height:1.9}.vision-status-source{display:inline-flex;color:#ead393!important;min-height:44px;align-items:center;font-size:13px}
 .about-grid{display:grid;grid-template-columns:.8fr 1.2fr;gap:60px;border-top:1px solid #ddd3bf;padding-top:34px}.about-grid h2{font-size:32px;line-height:1.6}.about-grid h3{font-size:22px}.about-grid p{color:#526177}.v-about-link{display:inline-flex;min-height:44px;align-items:center;color:#0b2d63!important}.v-privacy-limits{border-inline-start:3px solid #b79d59;padding:12px 18px;background:#f4efe4;margin-top:20px}.v-demo-label{display:inline-block;color:#715923;background:#f3e8c9;padding:5px 11px;border-radius:5px;font-size:12px;margin-bottom:14px}
 .vision-workspace-note,.pristine-note{border:1px solid #ddd3bf;background:#fcf8ed;border-radius:10px;padding:16px;margin:0 0 18px;display:grid;gap:8px;font-size:14px}.vision-workspace-note b{color:#0b2d63}.vision-workspace-note small{color:#526177;line-height:1.8}.pristine-note{color:#6d5a28}.is-pristine .issue.missing,.is-pristine .issue.blocking{border-color:#e5d5a2!important;background:#fffbef!important;color:#6d5a28!important}.is-pristine .issue.missing .dot,.is-pristine .issue.blocking .dot{background:#c7a64b!important}
 .annual-details{display:block!important;width:100%;min-width:0;max-width:100%;border:1px solid #ddd3bf;border-radius:9px;padding:0!important;margin:10px 0;background:#fffdf8;overflow:hidden}.annual-details>summary{display:grid!important;grid-template-columns:auto minmax(0,1fr);align-items:center;gap:12px;padding:12px;min-height:48px;margin:0!important;min-width:0}.annual-details>summary:after{content:'+';grid-column:2;font-size:18px;line-height:1;text-align:end}.annual-details[open]>summary:after{content:'−'}.annual-details[open]>summary{border-bottom:1px solid #e4dccd}.annual-details>.grid2{padding:14px;min-width:0;margin:0}.annual-summary{font-size:13px;line-height:1.7;color:#526177;min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}.v-annual-overview{font-size:13px;background:#f4efe4;padding:10px 14px;border-radius:8px;color:#526177;margin:12px 0}
 @media(max-width:1100px){.v-chain{grid-template-columns:repeat(3,minmax(0,1fr))}.v-output-grid{grid-template-columns:repeat(2,minmax(0,1fr))}.header-links{gap:14px}.v-public-anchor{font-size:12px}}
 @media(max-width:900px){.v-chart-grid,.about-grid{grid-template-columns:1fr}.v-wide{grid-column:auto}.vision-head{grid-template-columns:1fr}.vision-programs{grid-template-columns:repeat(2,minmax(0,1fr))}}
 @media(max-width:760px){.public-header .header-links{order:3;width:100%;overflow:auto;gap:16px}.v-public-anchor{white-space:nowrap;font-size:12px}.v-home-feedback.btn{font-size:11px;padding:8px}.v-output-grid,.v-chain,.vision-programs{grid-template-columns:1fr}.v-chart-card{padding:18px}.v-chart-card h3{font-size:21px}.vision-reference{padding-block:38px}.vision-head h2,.about-grid h2{font-size:27px}.v-metrics dd{font-size:21px}.v-chain li{border-top:0;border-inline-start:3px solid #b79d59}.v-chain li+li{margin-top:1px}}
 @media(prefers-reduced-motion:reduce){html{scroll-behavior:auto!important}}
 `;
 document.head.append(style);
}

function enhanceHeader(){
 const nav=document.querySelector('.public-header .header-links'),actions=document.querySelector('.public-header .header-actions');if(!nav||!actions)return;
 for(const id of ['publicMethod','publicStart'])document.getElementById(id)?.classList.add('v-legacy-action');
 const feedback=nav.querySelector('[data-beta="feedback"]')||actions.querySelector('[data-beta="feedback"]');
 if(feedback){feedback.classList.add('v-home-feedback','btn','small');feedback.textContent=T('vFeedback');actions.append(feedback);}
 for(const [id,key] of Object.entries(anchors)){
  let a=nav.querySelector(`[data-v-anchor="${id}"]`);if(!a){a=document.createElement('a');a.href='#'+id;a.dataset.vAnchor=id;a.className='v-public-anchor';nav.append(a);}a.textContent=T(key);
 }
}

function authorityVisual(p){
 const choice=p.options.find(o=>o.decision==='select'&&p.enablers.some(e=>e.optionId===o.id))||p.options.find(o=>o.decision==='select');
 if(!choice)return '';
 const a=E.authoritySpaceForOption(p,choice.id),items=p.enablers.filter(e=>e.optionId===choice.id);
 const cols=['internal','external','shared','unknown'],rows=['ready','pending','blocked','unknown'];
 const colLabels=[T('s236'),T('s237'),T('s238'),T('s239')],rowLabels=[T('s240'),T('s241'),T('s242'),T('s239')];
 let cells='';rows.forEach((status,j)=>cols.forEach((control,i)=>{
  const matching=items.filter(e=>e.status===status&&e.control===control),x=164+i*106,y=44+j*46;
  cells+=`<rect class="v-cell ${status==='ready'&&control!=='unknown'?'known-ready':status}" x="${x}" y="${y}" width="102" height="42" rx="6"/><text x="${x+51}" y="${y+28}" text-anchor="middle" class="v-cell-value" data-control="${control}" data-status="${status}" data-count="${matching.length}">${matching.length||'—'}</text>`;
 }));
 const svg=`<svg class="v-svg v-authority-grid" viewBox="0 0 620 245" role="img" aria-label="${esc(T('vAuthorityTitle'))}"><title>${esc(choice.title)}</title><desc>${esc(T('vAuthorityHelp'))}</desc>${colLabels.map((s,i)=>`<text x="${215+i*106}" y="28" text-anchor="middle" direction="${I.direction}">${esc(s)}</text>`).join('')}${rowLabels.map((s,j)=>`<text x="84" y="${73+j*46}" text-anchor="middle" direction="${I.direction}">${esc(s)}</text>`).join('')}${cells}</svg>`;
 const metrics=[['authorityOwnership',a.ownershipClarity],['authorityStatus',a.statusClarity],['authorityClearance',a.clearance]].map(([key,v])=>`<div><dt>${esc(T(key))}</dt><dd data-authority-metric="${key}">${v===null?'—':fmt(v)+'%'}</dd></div>`).join('');
 return `<article class="v-chart-card" data-evidence="authority"><span class="feature-index">01</span><h3>${esc(T('vAuthorityTitle'))}</h3><p>${esc(choice.title)} · ${items.length} ${esc(T('authorityCoverage'))}</p>${items.length?svg:`<p class="v-unknown">${esc(T('vNoEnablers'))}</p>`}<dl class="v-metrics">${metrics}</dl><p>${esc(T('authorityNextDue'))}: <b>${a.nextDue??'—'}</b></p><p class="v-caption">${esc(T('vAuthorityHelp'))}</p></article>`;
}

/* Generate every plotted coordinate from the existing engine, never from a sketch. */
function breakEvenData(p,criterionId){
 if(!E.weightInfo(p).valid)return null;
 const rows=E.breakEven(p),r=(criterionId?rows.find(x=>x.criterionId===criterionId):rows.find(x=>num(x.threshold))||rows[0]);
 if(!r)return null;
 const c=p.criteria.find(x=>x.id===r.criterionId),others=p.criteria.filter(x=>x.id!==c.id),sum=others.reduce((n,x)=>n+x.weight,0);
 if(sum<=0||!num(c.weight))return null;
 const ranking=E.ranking(p),eligible=new Set(ranking.map(x=>x.id));
 const weights=w=>Object.fromEntries(p.criteria.map(x=>[x.id,x.id===c.id?w:x.weight/sum*(100-w)]));
 const candidates=p.options.filter(o=>o.type!=='requirement');
 // A zero-weight criterion can hide an unknown raw score. Do not invent its line.
 const complete=candidates.filter(o=>p.criteria.every(k=>num(o.scores[k.id]?.value)&&o.scores[k.id].value>=0&&o.scores[k.id].value<=100));
 if(complete.length<2||complete.length!==candidates.length)return null;
 const series=complete.map(o=>({id:o.id,title:o.title,points:[0,100].map(w=>({weight:w,value:E.score(p,o,weights(w)).value})),current:E.score(p,o,weights(c.weight)).value}));
 if(series.some(s=>s.points.some(x=>!num(x.value))))return null;
 const leader=series.find(s=>s.id===ranking[0]?.id),valueAt=(s,w)=>s.points[0].value+(s.points[1].value-s.points[0].value)*w/100;
 let crossing=null;
 if(num(r.threshold)&&leader){
  const v=valueAt(leader,r.threshold),ties=series.filter(s=>s.id!==leader.id&&Math.abs(valueAt(s,r.threshold)-v)<1e-5),top=Math.max(...series.map(s=>valueAt(s,r.threshold)));
  if(ties.length&&Math.abs(top-v)<1e-5)crossing={weight:r.threshold,value:v};
 }
 return {criterion:c.name,criterionId:c.id,current:c.weight,threshold:crossing?.weight??null,crossing,series,range:[0,100]};
}
function breakEvenVisual(p){
 const data=breakEvenData(p);if(!data)return `<article class="v-chart-card" data-evidence="break-even"><h3>${esc(T('vBreakTitle'))}</h3><p class="v-unknown">${esc(T('vInsufficientChart'))}</p></article>`;
 const palette=['#173a6a','#a38131','#526d65','#846677','#9a613b'];
 const vals=data.series.flatMap(s=>s.points.map(x=>x.value)),pad=Math.max(3,(Math.max(...vals)-Math.min(...vals))*.12),lo=Math.max(0,Math.floor(Math.min(...vals)-pad)),hi=Math.min(100,Math.ceil(Math.max(...vals)+pad)),span=hi-lo||1;
 const x=w=>68+w*5.05,y=v=>44+(hi-v)/span*188;
 let svg=`<svg class="v-svg v-break-chart" viewBox="0 0 620 300" role="img" aria-label="${esc(T('vBreakTitle')+' — '+data.criterion)}" data-current="${data.current}" data-threshold="${data.threshold??''}"><title>${esc(data.criterion)}</title><desc>${esc(T('vBreakHelp'))}</desc>`;
 [0,.5,1].forEach(t=>{const v=lo+t*span;svg+=`<line x1="68" y1="${y(v)}" x2="573" y2="${y(v)}" class="v-grid"/><text x="58" y="${y(v)+5}" text-anchor="end">${fmt(v)}</text>`;});
 [0,25,50,75,100].forEach(w=>svg+=`<line x1="${x(w)}" y1="44" x2="${x(w)}" y2="232" class="v-grid"/><text x="${x(w)}" y="258" text-anchor="middle">${w}</text>`);
 svg+=`<text x="315" y="286" text-anchor="middle" direction="${I.direction}" class="v-axis-title">${esc(T('vWeightAxis'))}</text><text x="315" y="25" direction="${I.direction}" text-anchor="middle" class="v-axis-title">${esc(T('vValueAxis'))}</text>`;
 data.series.forEach((s,i)=>{const color=palette[i%palette.length];svg+=`<path class="v-series" data-option="${esc(s.id)}" data-start="${s.points[0].value}" data-end="${s.points[1].value}" stroke="${color}" d="M ${x(0)} ${y(s.points[0].value)} L ${x(100)} ${y(s.points[1].value)}"/><circle class="v-point" cx="${x(data.current)}" cy="${y(s.current)}" r="5" fill="${color}"/>`;});
 svg+=`<line x1="${x(data.current)}" y1="38" x2="${x(data.current)}" y2="236" class="v-current"/>`;
 if(data.crossing)svg+=`<line x1="${x(data.crossing.weight)}" y1="38" x2="${x(data.crossing.weight)}" y2="236" class="v-threshold"/><circle class="v-crossing" data-value="${data.crossing.value}" cx="${x(data.crossing.weight)}" cy="${y(data.crossing.value)}" r="7"/>`;
 svg+='</svg>';
 const legend=data.series.map((s,i)=>`<span><i style="background:${palette[i%palette.length]}"></i>${esc(s.title)} · ${fmt(s.current)}</span>`).join('');
 return `<article class="v-chart-card" data-evidence="break-even"><span class="feature-index">02</span><h3>${esc(T('vBreakTitle'))}</h3><p>${esc(data.criterion)}</p>${svg}<div class="v-chart-legend">${legend}</div><p class="v-caption">${esc(T('vCurrentWeight'))}: <b>${fmt(data.current)}%</b>${data.crossing?` · ${esc(T('vSwitch'))}: <b>${fmt(data.threshold)}%</b>`:`<br>${esc(T('vNoSwitch'))}`}</p><p class="v-caption">${esc(T('vBreakHelp'))}</p></article>`;
}

/* Established trajectory renderer, source-parity guarded against final-ui.js. */
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
function qualitativeTrack(){return `<p>${esc(T('vUnrecorded'))}</p>`;}
function trackVisual(p){
 const selected=new Set(p.options.filter(o=>o.decision==='select').map(o=>o.id));
 const t=p.transitions.find(t=>selected.has(t.optionId)&&t.direction!=='qualitative'&&t.trackType!=='maturity'&&t.indicatorType!=='risk');
 if(!t)return '';
 const legend=['trajectoryBaseline','trajectoryTarget','trajectoryActual'].map(k=>`<span>${esc(T(k))}</span>`).join(' · ');
 return `<article class="v-chart-card" data-evidence="trajectory"><span class="feature-index">03</span><h3>${esc(T('vTrackTitle'))}</h3><p>${esc(t.kpi||t.domain)}</p>${trackSvg(t,p)}<div class="v-chart-legend">${legend}</div><p class="v-caption">${esc(T('vTrackHelp'))}</p></article>`;
}
function approvalVisual(p){
 const issues=E.check(p),blockers=issues.filter(x=>['blocking','missing'].includes(x.level));
 return `<article class="v-chart-card" data-evidence="approval"><span class="feature-index">04</span><h3>${esc(T('vBlockTitle'))}</h3><div class="v-block-number"><strong data-blocking-count="${blockers.length}">${blockers.length}</strong><span>${esc(T('vBlockCount'))}</span></div><p>${esc(T('vBlockHelp'))}</p>${blockers.length?`<ul class="v-block-items">${blockers.slice(0,3).map(x=>`<li>${esc(x.message)}</li>`).join('')}</ul>`:`<p>${esc(T('vAllClear'))}</p>`}<p>${esc(T('vWarnings'))}: ${issues.filter(x=>x.level==='warning').length}</p></article>`;
}
function chainVisual(p){
 const selected=new Set(p.options.filter(o=>o.decision==='select').map(o=>o.id));
 const gated=p.initiatives.find(i=>selected.has(i.optionId)&&i.budget.some(b=>b.year>=i.startYear&&b.year<=i.endYear&&text(b.releaseEvidence))&&p.transitions.some(t=>t.id===i.transitionId&&t.optionId===i.optionId));
 const choice=(gated?p.options.find(o=>o.id===gated.optionId):null)||p.options.find(o=>o.decision==='select'&&text(o.riskSource)&&p.transitions.some(t=>t.optionId===o.id));if(!choice)return '';
 const tr=(gated?p.transitions.find(t=>t.id===gated.transitionId):null)||p.transitions.find(t=>t.optionId===choice.id);
 const ini=gated||p.initiatives.find(i=>i.optionId===choice.id&&i.transitionId===tr?.id),gate=ini?.budget?.find(b=>b.year>=ini.startYear&&b.year<=ini.endYear&&text(b.releaseEvidence));
 const rows=[['vRisk',choice.riskSource||T('vNoRisk'),choice.riskDate],['vChoice',choice.title,choice.owner],['vPath',tr?.domain||T('vUnrecorded'),tr?.kpi],['vInitiative',ini?.title||T('vUnrecorded'),ini?.owner],['vGate',gate?.releaseEvidence||T('vNoGate'),gate?`${gate.year} · ${fmt(gate.amount)} ${T('currencySAR')}`:'']];
 return `<article class="v-chart-card v-wide" data-evidence="chain"><span class="feature-index">05</span><h3>${esc(T('vChainTitle'))}</h3><ol class="v-chain">${rows.map(([k,value,note],i)=>`<li><b>${i+1}. ${esc(T(k))}</b><p>${esc(value)}</p>${note?`<small>${esc(note)}</small>`:''}</li>`).join('')}</ol></article>`;
}
function visualsSection(){
 const p=E.demo();return `<section class="landing-wrap product-section v-visuals v-public-section" id="decision-visuals"><div class="section-intro"><span class="v-demo-label">${esc(T('vDemoLabel'))}</span><h2>${esc(T('vEvidenceTitle'))}</h2><p>${esc(T('vEvidenceIntro'))}</p></div><div class="v-chart-grid">${authorityVisual(p)}${breakEvenVisual(p)}${trackVisual(p)}${approvalVisual(p)}${chainVisual(p)}</div></section>`;
}
function outputsSection(){return `<section class="landing-wrap product-section v-public-section" id="outputs"><div class="section-intro"><h2>${esc(T('vOutputsTitle'))}</h2></div><div class="v-output-grid">${[1,2,3,4].map(i=>`<article><span class="feature-index">0${i}</span><h3>${esc(T('vOutput'+i))}</h3><p>${esc(T('vOutput'+i+'Help'))}</p></article>`).join('')}</div></section>`;}
function visionSection(){
 const V=root.SultanVision;if(!V)return '';
 return `<section class="vision-reference"><div class="landing-wrap"><div class="vision-head"><div><span class="eyebrow">${esc(T('visionListLabel'))}</span><h2>${esc(T('vVisionTitle'))}</h2><p>${esc(T('vVisionIntro'))}</p></div><a class="vision-source" href="${esc(V.source)}" target="_blank" rel="noopener noreferrer">${esc(T('vVisionSource'))}</a></div><ul class="vision-programs">${V.programs.map(x=>`<li data-program="${x.id}" class="${x.status==='completed'?'program-completed':''}"><span>${esc(I.language==='ar'?x.ar:x.en)}</span>${x.status==='completed'?`<small>${esc(T('vCompleted'))}</small>`:''}</li>`).join('')}</ul><p class="vision-disclaimer">${esc(T('visionListDisclaimer',[V.verifiedOn]))}</p><a class="vision-status-source" href="${esc(V.statusSource)}" target="_blank" rel="noopener noreferrer">${esc(T('vVisionStatusSource'))}</a></div></section>`;
}
function aboutSection(){return `<section class="landing-wrap product-section about-sultan v-public-section" id="about-sultan"><div class="about-grid"><div><h2>${esc(T('vAboutTitle'))}</h2></div><div><h3>${esc(T('creator'))}</h3><p>${esc(T('vAboutText'))}</p><p>${esc(T('vAboutBeta'))}</p><a class="v-about-link" href="https://adeebnoor.github.io/" target="_blank" rel="noopener noreferrer">${esc(T('vAboutLink'))}</a></div></div></section>`;}
function scrollAnchor(id,updateHistory=false){
 const el=document.getElementById(id);if(!el)return;
 if(updateHistory)history.pushState(null,'','#'+id);
 const heading=el.querySelector('h2')||el;heading.tabIndex=-1;heading.focus({preventScroll:true});
 el.scrollIntoView({behavior:root.matchMedia?.('(prefers-reduced-motion: reduce)').matches?'auto':'smooth',block:'start'});
 document.querySelectorAll('[data-v-anchor]').forEach(a=>{if(a.dataset.vAnchor===id)a.setAttribute('aria-current','location');else a.removeAttribute('aria-current');});
}
function enhanceHome(){
 const features=document.getElementById('features');if(features)features.id='methodology';
 const method=document.getElementById('methodology');if(method){method.classList.add('v-public-section');if(!method.querySelector('.v-method-note')){const n=document.createElement('p');n.className='v-method-note muted';n.textContent=T('vMethodNote');method.querySelector('.section-intro')?.append(n);}}
 const quick=document.querySelector('.quick-section');if(quick&&!document.getElementById('decision-visuals'))quick.insertAdjacentHTML('beforebegin',visualsSection()+outputsSection()+visionSection());
 const faq=document.querySelector('.faq-grid');if(faq){faq.id='privacy-limits';faq.classList.add('v-public-section');if(!faq.querySelector('.v-privacy-limits')){const n=document.createElement('p');n.className='v-privacy-limits';n.textContent=T('vPrivacyLimits');faq.lastElementChild.append(n);}}
 const bottom=document.querySelector('.bottom-cta');if(bottom&&!document.getElementById('about-sultan'))bottom.insertAdjacentHTML('beforebegin',aboutSection());
 if(Object.hasOwn(anchors,pendingAnchor)){const id=pendingAnchor;pendingAnchor='';history.replaceState(null,'','#'+id);scrollAnchor(id);}
}

function annualSummary(annual){
 const value=annual.querySelector('[data-path$=".target"]')?.value,milestone=annual.querySelector('[data-path$=".milestone"]')?.value||'',evidence=annual.querySelector('[data-path$=".evidence"]')?.value||'';
 return [value?.trim()?value:milestone.trim()||T('vAnnualOpen'),evidence.trim()?T('vAnnualEvidence'):T('vAnnualMissing')].join(' · ');
}
function wrapAnnuals(p){
 const content=document.getElementById('content');if(!content)return;
 for(const annual of [...content.querySelectorAll('.annual:not(.annual-details)')]){
  const path=annual.querySelector('[data-path]')?.dataset.path||'',match=path.match(/^transitions\.(\d+)\.annual\.(\d+)\./),tr=match?p.transitions[Number(match[1])]:null,entry=match?tr?.annual[Number(match[2])]:null;
  const parent=annual.parentElement,year=annual.querySelector('.yearbadge'),key=[p.createdAt,tr?.id,entry?.year].join('|');
  const first=annualState.has(key)?annualState.get(key):!parent?.querySelector('.annual-details');
  const details=document.createElement('details');details.className='annual annual-details';details.dataset.annualKey=key;details.open=first;
  const summary=document.createElement('summary'),badge=document.createElement('span'),label=document.createElement('span');badge.className='yearbadge';badge.textContent=year?.textContent||'';label.className='annual-summary';label.textContent=annualSummary(annual);summary.append(badge,label);details.append(summary);
  for(const child of [...annual.childNodes])if(child!==year)details.append(child);annual.replaceWith(details);
  details.addEventListener('toggle',()=>{if(details.isConnected)annualState.set(key,details.open);});
 }
 p.transitions.forEach((t,i)=>{const node=content.querySelector(`[data-path="transitions.${i}.kpi"]`),card=node?.closest('article.card');if(!card||card.querySelector('.v-annual-overview'))return;
  const missing=t.annual.filter(a=>!text(a.evidence)).map(a=>a.year),count=t.annual.filter(a=>num(a.target)||text(a.milestone)).length;
  const n=document.createElement('p');n.className='v-annual-overview';n.textContent=`${t.annual[0]?.year??'—'} → ${t.annual.at(-1)?.year??'—'} · ${count} ${T('vAnnualTargets')}${missing.length?' · '+T('vAnnualMissingYears')+' '+missing.join(', '):''}`;
  card.querySelector('.annual-details')?.insertAdjacentElement('beforebegin',n);
 });
}
function suggestionList(input,values,id){
 if(!input||input.tagName!=='INPUT'||input.type!=='text')return;
 let list=document.getElementById(id);if(!list){list=document.createElement('datalist');list.id=id;document.getElementById('content').append(list);}list.replaceChildren(...values.map(value=>{const o=document.createElement('option');o.value=value;return o;}));input.setAttribute('list',id);input.autocomplete='off';
}
function enhanceSuggestions(p){
 const owners=[...new Set(['options','transitions','enablers','initiatives'].flatMap(k=>(p[k]||[]).map(x=>x.owner?.trim()).filter(Boolean)))].sort((a,b)=>a.localeCompare(b));
 document.querySelectorAll('#content input[data-path$=".owner"]').forEach(input=>{if(/^(options|transitions|enablers|initiatives)\.\d+\.owner$/.test(input.dataset.path))suggestionList(input,owners,'v-project-owners');});
 document.querySelectorAll('#content input[data-path$=".maturityFamily"]').forEach(input=>suggestionList(input,T('vMaturityList').split('|'),'v-maturity-families'));
}
function isPristine(p){return Boolean(p&&!p.isDemo&&!['name','mission','vision','beneficiaries','assets','context','notDoing','liabilities'].some(k=>text(p.institution[k]))&&!['options','references','transitions','enablers','initiatives','mandates'].some(k=>p[k].length));}
function enhanceWorkspace(section){
 const p=root.SultanApp?.getProject?.(),content=document.getElementById('content');if(!p||!content)return;
 const pristine=isPristine(p)&&section!=='review'&&section!=='home'&&section!=='about';document.body.classList.toggle('is-pristine',pristine);
 if(pristine&&!content.querySelector('.pristine-note')){const n=document.createElement('div');n.className='pristine-note';n.textContent=T('vPristine');content.querySelector('.heading')?.insertAdjacentElement('afterend',n);}
 if(section==='identity'&&root.SultanVision&&!content.querySelector('.vision-workspace-note')){const V=root.SultanVision,n=document.createElement('div');n.className='vision-workspace-note';n.innerHTML=`<b>${esc(T('visionListLabel'))}</b><span>${esc(T('visionListHint'))}</span><small>${esc(T('visionListDisclaimer',[V.verifiedOn]))}</small><a href="${esc(V.source)}" target="_blank" rel="noopener noreferrer">${esc(T('vVisionSource'))}</a>`;content.querySelector('[data-kind="mandates"]')?.closest('.card')?.prepend(n);}
 if(section==='references')wrapAnnuals(p);enhanceSuggestions(p);
}
function enhance(section){addStyles();enhanceHeader();if(document.body.classList.contains('is-home'))enhanceHome();enhanceWorkspace(section||location.hash.slice(1)||'home');}
// Run after the other section renderers have added their extension fields.
function scheduleEnhance(section){setTimeout(()=>setTimeout(()=>enhance(section),0),0);}
document.addEventListener('sultan:render',e=>scheduleEnhance(e.detail?.section));
document.addEventListener('click',e=>{const a=e.target.closest('[data-v-anchor]');if(!a||e.ctrlKey||e.metaKey||e.shiftKey||e.altKey||e.button!==0)return;e.preventDefault();scrollAnchor(a.dataset.vAnchor,true);});
root.addEventListener('popstate',()=>{const id=location.hash.slice(1);if(Object.hasOwn(anchors,id)){if(!document.body.classList.contains('is-home')){pendingAnchor=id;root.SultanApp.navigate('home');}else scrollAnchor(id);}else if(id==='home')root.SultanApp.navigate('home');});
document.addEventListener('input',e=>{const annual=e.target.closest('.annual-details');if(annual)annual.querySelector('.annual-summary').textContent=annualSummary(annual);});
root.SultanEvidence={breakEvenData,breakEvenVisual,authorityVisual,isPristine,trackSvg};
scheduleEnhance(location.hash.slice(1)||'home');
})(globalThis);
