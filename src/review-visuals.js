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

/* V-layer: make the strategic method, decision evidence, outputs and Vision 2030
   reference visible without changing the project schema or making network calls. */
(function(root){
'use strict';
const E=root.Sultan,I=root.SultanI18n,T=I.t;
const esc=x=>String(x??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const bi=(ar,en)=>I.language==='ar'?ar:en;

function addStyles(){
 if(document.getElementById('sultan-v-layer-styles'))return;
 const style=document.createElement('style');style.id='sultan-v-layer-styles';
 style.textContent=`
 .v-legacy-action{display:none!important}.v-public-anchor{display:none;color:#315c59;text-decoration:none;font-size:13px;min-height:44px;align-items:center;padding:8px 0;border-bottom:2px solid transparent}.is-home .v-public-anchor{display:inline-flex}.v-public-anchor:hover,.v-public-anchor:focus-visible{color:var(--teal);border-color:#b79d59}.v-home-feedback{display:none}.is-home .v-home-feedback{display:inline-flex}
 .v-chart-grid{display:grid;grid-template-columns:1fr 1fr;gap:20px}.v-chart-card,.v-output-grid article{border:1px solid #dce7df;border-radius:13px;padding:24px;background:#fff;position:relative}.v-chart-card>div:first-child p{color:#60786d;font-size:12px}.v-svg{width:100%;height:auto;display:block;margin-top:16px;background:#f8faf6;border-radius:10px}.v-grid{stroke:#dce6df;stroke-width:1}.v-track{fill:#e5ece6}.v-fill{fill:#2d7867}.v-axis{stroke:#9fb3a9;stroke-width:1.2}.v-line-a{stroke:#264d72;stroke-width:3;fill:none}.v-line-b{stroke:#b28f39;stroke-width:3;fill:none}.v-current{stroke:#c4a95a;stroke-width:1.5;stroke-dasharray:5 5}.v-threshold{stroke:#9d4c48;stroke-width:1.7;stroke-dasharray:5 4}.v-dot{fill:#9d4c48}.v-label,.v-note,.v-value{font-family:Tahoma,Arial,sans-serif;fill:#315b54;font-size:13px}.v-note{font-size:11px;fill:#63796d}.v-value{font-weight:700}
 .v-output-grid{display:grid;grid-template-columns:repeat(4,1fr);gap:16px}.v-output-grid h3{font-size:17px;margin-top:14px}.v-output-grid p{font-size:13px;color:#597166;margin:0}.vision-reference{background:#12363b;color:#fff;padding-block:58px}.vision-head{display:grid;grid-template-columns:1fr auto;gap:36px;align-items:end}.vision-head h2{font-size:31px;line-height:1.6;margin:8px 0}.vision-head p{color:#c8d8d2;max-width:760px}.vision-source{color:#163d36!important;background:#e8d28d;border-radius:8px;padding:11px 15px;text-decoration:none;font-weight:700}.vision-programs{display:flex;flex-wrap:wrap;gap:9px;margin-top:28px}.vision-programs span{border:1px solid #56776f;background:#ffffff0d;border-radius:999px;padding:7px 11px;font-size:11px}.vision-disclaimer{font-size:10px;color:#b9cec6;margin:20px 0 0}
 .about-grid{display:grid;grid-template-columns:.8fr 1.2fr;gap:70px;border-top:1px solid #dce7df;padding-top:34px}.about-grid h2{font-size:30px;line-height:1.6}.about-grid h3{font-size:20px}.about-grid p{color:#587167}.vision-workspace-note,.pristine-note{border:1px solid #d5e2d8;background:#f7faf4;border-radius:10px;padding:14px 16px;margin:0 0 18px;display:grid;gap:5px}.vision-workspace-note b{color:#1d5c4d}.vision-workspace-note span,.vision-workspace-note small{color:#60756c}.pristine-note{border-color:#e5d5a2;background:#fffbef;color:#6d5a28}
 .annual-details{border:1px solid #dce5df;border-radius:9px;padding:0!important;margin:10px 0;background:#fbfcf9}.annual-details>summary{display:flex;align-items:center;gap:12px;cursor:pointer;padding:11px 13px;min-height:44px}.annual-details[open]>summary{border-bottom:1px solid #e2e9e3}.annual-details>.grid2{padding:14px}.annual-summary{font-size:12px;color:#63786d;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}.is-pristine .issue.missing,.is-pristine .issue.blocking{border-color:#e5d5a2!important;background:#fffbef!important;color:#6d5a28!important}.is-pristine .issue.missing .dot,.is-pristine .issue.blocking .dot{background:#c7a64b!important}
 @media(max-width:980px){.v-chart-grid,.about-grid{grid-template-columns:1fr}.v-output-grid{grid-template-columns:1fr 1fr}.vision-head{grid-template-columns:1fr}.header-links{gap:12px}.v-public-anchor{font-size:11px}}@media(max-width:760px){.header-links{order:3;width:100%;overflow:auto;justify-content:flex-start}.v-public-anchor{white-space:nowrap}.v-output-grid{grid-template-columns:1fr}.v-chart-card{padding:15px}.vision-reference{padding-block:40px}.vision-head h2{font-size:25px}}
 `;
 document.head.append(style);
}

function enhanceHeader(){
 const nav=document.querySelector('.public-header .header-links'),actions=document.querySelector('.public-header .header-actions');if(!nav||!actions)return;
 const method=document.getElementById('publicMethod');if(method)method.classList.add('v-legacy-action');
 const start=document.getElementById('publicStart');if(start)start.classList.add('v-legacy-action');
 let feedback=nav.querySelector('[data-beta="feedback"]');if(feedback){feedback.classList.add('v-home-feedback','btn','small');actions.append(feedback);}
 const labels=I.language==='ar'?{methodology:'المنهجية',outputs:'المخرجات','privacy-limits':'الخصوصية والحدود','about-sultan':'من نحن'}:{methodology:'Method',outputs:'Outputs','privacy-limits':'Privacy & limits','about-sultan':'About'};
 for(const id of ['methodology','outputs','privacy-limits','about-sultan'])if(!nav.querySelector(`[data-v-anchor="${id}"]`)){const a=document.createElement('a');a.href='#'+id;a.dataset.vAnchor=id;a.className='v-public-anchor';a.textContent=labels[id];nav.append(a);}
 if(feedback)feedback.textContent=bi('شاركنا ملاحظاتك','Share feedback');
}

function authorityVisual(p){
 const selected=p.options.find(o=>o.decision==='select')||p.options[0];if(!selected)return '';
 const a=E.authoritySpace?.(p)?.find(x=>x.optionId===selected.id)||{ownershipClarity:0,statusClarity:0,clearance:0,total:0,nextDue:null};
 const bars=[[bi('وضوح الملكية','Ownership clarity'),a.ownershipClarity??0],[bi('وضوح الحالة','Status clarity'),a.statusClarity??0],[bi('خلوص القرار','Decision clearance'),a.clearance??0]];
 const svg=`<svg class="v-svg" viewBox="0 0 720 245" role="img" aria-label="${esc(bi('مساحة الصلاحية','Authority space'))}">${bars.map((m,k)=>{const y=35+k*63,w=5*m[1];return `<text x="16" y="${y+21}" class="v-label">${esc(m[0])}</text><rect x="176" y="${y}" width="500" height="22" rx="11" class="v-track"/><rect x="176" y="${y}" width="${w}" height="22" rx="11" class="v-fill"/><text x="${Math.min(650,190+w)}" y="${y+17}" class="v-value">${Math.round(m[1])}%</text>`;}).join('')}<text x="16" y="225" class="v-note">${esc(bi('أقرب موعد قرار','Next decision'))}: ${esc(a.nextDue??'—')}</text></svg>`;
 return `<article class="v-chart-card"><div><span class="feature-index">01</span><h3>${esc(bi('مساحة الصلاحية','Authority space'))}</h3><p>${esc(selected.title)} · ${a.total||0} ${esc(bi('ممكّنات','enablers'))}</p></div>${svg}</article>`;
}

function breakEvenVisual(p){
 const rows=E.breakEven?.(p)||[],r=rows.find(x=>x.threshold!==null)||rows[0],ranking=E.ranking?.(p)||[];if(!r)return '';
 const cur=Number(r.current)||0,thr=r.threshold===null?null:Number(r.threshold),cx=92+cur*5.15,tx=thr===null?607:92+thr*5.15;
 const svg=`<svg class="v-svg" viewBox="0 0 720 245" role="img" aria-label="${esc(bi('منحنى نقطة التبادل','Break-even curve'))}"><line x1="92" y1="198" x2="648" y2="198" class="v-axis"/><line x1="92" y1="28" x2="92" y2="198" class="v-axis"/><line x1="110" y1="62" x2="622" y2="174" class="v-line-a"/><line x1="110" y1="142" x2="622" y2="82" class="v-line-b"/><line x1="${cx}" y1="35" x2="${cx}" y2="198" class="v-current"/><line x1="${tx}" y1="35" x2="${tx}" y2="198" class="v-threshold"/><circle cx="${tx}" cy="119" r="7" class="v-dot"/><text x="${Math.max(96,cx-22)}" y="222" class="v-note">${cur.toFixed(1)}%</text><text x="${Math.max(96,tx-25)}" y="45" class="v-value">${thr===null?esc(bi('محصّن','No switch')):thr.toFixed(1)+'%'}</text><text x="118" y="55" class="v-label">${esc(ranking[0]?.title||'')}</text><text x="390" y="176" class="v-label">${esc(ranking[1]?.title||'')}</text></svg>`;
 return `<article class="v-chart-card"><div><span class="feature-index">02</span><h3>${esc(bi('نقطة التبادل','Break-even point'))}</h3><p>${esc(r.criterion||'')} · ${cur.toFixed(1)}% → ${thr===null?esc(bi('لا نقطة تبادل','no switch')):thr.toFixed(1)+'%'}</p></div>${svg}</article>`;
}

function visualsSection(){
 let p;try{p=E.demo();}catch{return '';}const cards=authorityVisual(p)+breakEvenVisual(p);if(!cards)return '';
 return `<section class="landing-wrap product-section v-visuals" id="decision-visuals"><div class="section-intro"><span class="eyebrow">SULTAN / DECISION EVIDENCE</span><h2>${esc(bi('لا تعرض استراتيجية فقط — اعرض أين يمكن تنفيذها وأين تنقلب المفاضلة','Do not just show a strategy — show where it can execute and where the choice flips'))}</h2><p>${esc(bi('الرسمان محسوبان من المثال المضمّن نفسه، بلا مكتبة رسوم وبلا اتصال شبكي.','Both views are computed from the bundled example itself, with no chart library and no network call.'))}</p></div><div class="v-chart-grid">${cards}</div></section>`;
}

function outputsSection(){
 const items=I.language==='ar'?[['وثيقة عميل','قرار وخيارات ومفاضلات ومسارات قابلة للتسليم.'],['تقرير داخلي','تفاصيل العمل والملاحظات والحواجز قبل الاعتماد.'],['حزمة تصعيد','ما يحتاج قرارًا خارجيًا، ومن يملكه، ومتى يلزم.'],['ملف JSON','نسخة قابلة للاستيراد والمراجعة دون حبس البيانات.']]:[['Client document','Decision, choices, trade-offs and executable paths.'],['Internal report','Working detail, issues and blockers before approval.'],['Escalation pack','What needs an external decision, who owns it and by when.'],['JSON file','A portable, reviewable project without data lock-in.']];
 return `<section class="landing-wrap product-section" id="outputs"><div class="section-intro"><span class="eyebrow">SULTAN / OUTPUTS</span><h2>${esc(bi('مخرجات يقرأها صانع القرار — لا لوحة جميلة فقط','Decision-ready outputs — not just a polished dashboard'))}</h2></div><div class="v-output-grid">${items.map((x,i)=>`<article><span class="feature-index">0${i+1}</span><h3>${esc(x[0])}</h3><p>${esc(x[1])}</p></article>`).join('')}</div></section>`;
}

function visionSection(){
 const V=root.SultanVision;if(!V)return '';
 return `<section class="vision-reference"><div class="landing-wrap"><div class="vision-head"><div><span class="eyebrow">VISION 2030 / REFERENCE</span><h2>${esc(bi('سمِّ مساهمتك في برامج تحقيق رؤية ٢٠٣٠ — من دون إجبارك على قائمة مغلقة','Name your contribution to Vision 2030 programs — without forcing a closed list'))}</h2><p>${esc(bi('القائمة مرجع اقتراحات داخل سلطان. تستطيع كتابة برنامج، أو أمر سامٍ، أو قرار مجلس، أو مطلب تنظيمي آخر.','The list is a suggestion reference inside SULTAN. You can still enter a programme, royal decree, board resolution or other regulatory mandate.'))}</p></div><a class="vision-source" href="${esc(V.source)}" target="_blank" rel="noopener noreferrer">${esc(bi('المصدر الرسمي لرؤية ٢٠٣٠ ↗','Official Vision 2030 source ↗'))}</a></div><div class="vision-programs">${V.programs.map(x=>`<span>${esc(I.language==='ar'?x.ar:x.en)}</span>`).join('')}</div><p class="vision-disclaimer">${esc((I.language==='ar'?'قائمة مضمّنة، متحقق منها في ':'Bundled reference, verified ')+V.verifiedOn+(I.language==='ar'?'. سلطان غير مرتبط بأي برنامج ولا يمثله.':'. SULTAN is not affiliated with and does not represent any programme.'))}</p></div></section>`;
}

function aboutSection(){
 return `<section class="landing-wrap product-section about-sultan" id="about-sultan"><div class="about-grid"><div><span class="eyebrow">SULTAN / ORIGIN</span><h2>${esc(bi('منهج استراتيجي له صاحب — لا صندوق أسود','A strategy method with accountable authorship — not a black box'))}</h2></div><div><h3>${esc(T('creator'))}</h3><p>${esc(bi('سلطان يحوّل منهجًا استشاريًا وأكاديميًا منشورًا إلى مساحة عمل عملية: يفرض المفاضلة، يوضح الصلاحية، ويُبقي المجهول ظاهرًا بدل إخفائه في درجة جاهزية واحدة.','SULTAN turns a published academic and advisory method into a working tool: it forces trade-offs, makes authority explicit, and keeps unknowns visible instead of hiding them inside one readiness score.'))}</p><p class="muted">${esc(bi('النسخة العامة مجانية للتجربة وجمع الملاحظات.','Free public beta for use and feedback.'))}</p></div></div></section>`;
}

function enhanceHome(){
 if(!document.body.classList.contains('is-home'))return;
 enhanceHeader();
 const features=document.getElementById('features');if(features)features.id='methodology';
 const method=document.getElementById('methodology');if(method&&!method.querySelector('.v-method-note')){const n=document.createElement('p');n.className='v-method-note muted';n.textContent=bi('سبعة أقسام مترابطة، والمستهدف المستعار مرفوض: كل انتقال يحتاج مرجعية وسياقًا ودليلًا.','Seven linked sections, with borrowed targets rejected: every transition needs a reference, context and evidence.');method.querySelector('.section-intro')?.append(n);}
 const quick=document.querySelector('.quick-section');if(quick&&!document.getElementById('decision-visuals'))quick.insertAdjacentHTML('beforebegin',visualsSection()+outputsSection()+visionSection());
 const faq=document.querySelector('.faq-grid');if(faq)faq.id='privacy-limits';
 const bottom=document.querySelector('.bottom-cta');if(bottom&&!document.getElementById('about-sultan'))bottom.insertAdjacentHTML('beforebegin',aboutSection());
}

function wrapAnnuals(){
 const content=document.getElementById('content');if(!content)return;
 for(const annual of [...content.querySelectorAll('.annual:not(.annual-details)')]){
  const parent=annual.parentElement,first=!parent?.querySelector('.annual-details'),year=annual.querySelector('.yearbadge');
  const details=document.createElement('details');details.className='annual annual-details';details.open=first;
  const summary=document.createElement('summary');const badge=document.createElement('span');badge.className='yearbadge';badge.textContent=year?.textContent||'';const text=document.createElement('span');text.className='annual-summary';text.textContent=bi('المستهدف والدليل — اضغط للتفاصيل','Milestone and evidence — open for details');summary.append(badge,text);details.append(summary);
  for(const child of [...annual.childNodes])if(child!==year)details.append(child);
  annual.replaceWith(details);
 }
}

function enhanceWorkspace(section){
 const p=root.SultanApp?.getProject?.();const pristine=Boolean(p&&!p.isDemo&&(p.revision||0)===0);document.body.classList.toggle('is-pristine',pristine);
 const content=document.getElementById('content');if(!content)return;
 if(pristine&&!content.querySelector('.pristine-note')){const n=document.createElement('div');n.className='pristine-note';n.textContent=bi('هذه ملاحظات بدء وليست أخطاء ارتكبتها. تصبح الشروط حاجبة فقط عند محاولة اعتماد الاستراتيجية.','These are start-up prompts, not mistakes. Blocking conditions matter when you attempt approval.');content.querySelector('.heading')?.insertAdjacentElement('afterend',n);}
 if(section==='identity'&&root.SultanVision&&!content.querySelector('.vision-workspace-note')){const V=root.SultanVision,n=document.createElement('div');n.className='vision-workspace-note';n.innerHTML=`<b>${esc(bi('برامج تحقيق رؤية ٢٠٣٠','Vision 2030 realization programs'))}</b><span>${esc(bi('اقتراحات فقط — يمكنك كتابة برنامج أو أمر سامٍ أو قرار مجلس أو مطلب تنظيمي آخر.','Suggestions only — you can enter a programme, royal decree, board resolution or another regulatory mandate.'))}</span><small>${esc(bi('قائمة مضمّنة، متحقق منها في ','Bundled reference, verified ')+V.verifiedOn+bi('. سلطان غير مرتبط بأي برنامج ولا يمثله.','. SULTAN is not affiliated with and does not represent any programme.'))}</small>`;content.querySelector('.card')?.insertAdjacentElement('beforebegin',n);}
 if(section==='references')wrapAnnuals();
}

function enhance(section){addStyles();enhanceHeader();if(section==='home'||document.body.classList.contains('is-home'))enhanceHome();enhanceWorkspace(section||location.hash.slice(1)||'home');}
document.addEventListener('sultan:render',e=>setTimeout(()=>enhance(e.detail?.section),0));
document.addEventListener('click',e=>{const a=e.target.closest('[data-v-anchor]');if(!a)return;e.preventDefault();document.getElementById(a.dataset.vAnchor)?.scrollIntoView({behavior:'smooth',block:'start'});});
setTimeout(()=>enhance(location.hash.slice(1)||'home'),0);
})(globalThis);
