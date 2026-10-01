/* Expert lenses — the method owner's thinking patterns, applied to any strategy.
   The built-in lenses are distilled from Prof. Adeeb Noor's critical analysis of a university's strategic
   transformation (July 2025) and from his growth notes for a technology company (partnering, selective
   acquisitions, recurring business, reciprocity, vertical focus by ticket size and national agenda, AI in
   banking and security, security for AI). Each lens asks the question the adviser habitually asks, says what
   a good answer looks like, and, where it can be decided from the project itself, runs a deterministic
   advisory check. Lenses are advisory: they never enter check(), navigation badges or approval.
   The lens memory (the expert's own patterns, usefulness feedback, muting) lives in browser storage so the
   thinking carries across projects; it is never written into project files. */
(function(root){
'use strict';
const isNode=typeof module!=='undefined'&&module.exports;
const E=root.Sultan,I=root.SultanI18n;
const lang=()=>I?.language==='en'?'en':'ar';
const t=(ar,en)=>({ar,en});
const pick=x=>x&&typeof x==='object'&&'ar' in x?(lang()==='en'?x.en:x.ar):String(x??'');
const text=x=>typeof x==='string'&&x.trim().length>0;
const num=x=>typeof x==='number'&&Number.isFinite(x);
const KEY='sultan.lens.v1';
const GROUPS=['focus','growth','evidence','people','method','custom'];
let storage={get(k){try{return localStorage.getItem(k);}catch{return null;}},set(k,v){try{localStorage.setItem(k,v);}catch{}}};

/* ---------------------------------------------------------------- signals */
const RE={
 placeholder:/\[أكمل\]|\[Complete\]|\[قالب|\[Template/i,
 partner:/شراك|تحالف|استحواذ|اندماج|درجة مزدوجة|برنامج مشترك|partner|allianc|acqui|merger|joint venture|dual.degree|consorti/i,
 bring:/نقدم|نجلب|نضيف|ما لدينا|قيمتنا للشريك|لماذا يشاركنا|يشاركوننا|bring to the table|we bring|we offer|we contribute|our value to|why would they/i,
 recurring:/متكرر|اشتراك|متجدد|تجديد|خدمة مدارة|خدمات مدارة|تشغيل وصيانة|عقد سنوي|recurr|subscri|managed service|retainer|renewal|annuity|as.a.service|saas|multi-year/i,
 revenue:/إيراد|دخل|تذاكر|تذكرة|عقود|revenue|income|ticket|contract value|\barr\b|\bmrr\b|sales/i,
 index:/تصنيف|ترتيب|مؤشر دولي|مرتبة|rank|\bqs\b|shanghai|times higher|pisa|timss|index score/i,
 funder:/ممول|تمويل|منح|صندوق|هيئة البحث|grant|funder|funding|rdia|donor/i,
 ai:/ذكاء اصطناعي|الذكاء الاصطناعي|نموذج لغوي|تعلم آلي|\bai\b|\bllm|machine learning|generative/i,
 aiSecurity:/أمن الذكاء|حقن الأوامر|تسريب البيانات عبر|prompt injection|prompt|security for ai|ai security|data leak/i,
 vertical:/قطاع|عمودي|fintech|بنوك|بنك|مصرف|bfsi|bank|insur|تأمين|telecom|اتصالات|retail|تجزئة|utilit|oil|طاقة|energy/i,
 national:/رؤية 2030|برنامج وطني|أجندة|استراتيجية وطنية|التحول الرقمي|رقمنة|الحكومة الرقمية|national|vision 2030|digiti[sz]|transformation program/i,
 tech:/تقني|برمج|سيبران|معلومات|رقمي|software|\bit\b|technolog|cyber|fintech|digital|data|cloud/i
};
function strings(x,out=[]){if(typeof x==='string'){if(x.trim())out.push(x);}else if(Array.isArray(x))x.forEach(v=>strings(v,out));else if(x&&typeof x==='object')Object.values(x).forEach(v=>strings(v,out));return out;}
const allText=p=>strings(p).join(' ');
const selected=p=>(p.options||[]).filter(o=>o.decision==='select');
const growth=p=>selected(p).filter(o=>o.type==='differentiation'||o.type==='moonshot');
const trsOf=(p,o)=>(p.transitions||[]).filter(x=>x.optionId===o.id);
const insOf=(p,o)=>(p.initiatives||[]).filter(x=>x.optionId===o.id);
const ensOf=(p,o)=>(p.enablers||[]).filter(x=>x.optionId===o.id);
const refsOf=(p,o)=>{const ids=new Set(trsOf(p,o).map(x=>x.referenceId));return (p.references||[]).filter(r=>ids.has(r.id));};
const optionText=(p,o)=>[o.title,o.outcome,o.whyUs,o.tradeoff,o.decisionReason,o.foothold,...trsOf(p,o).flatMap(x=>[x.kpi,x.domain,x.targetState,x.unit]),...insOf(p,o).flatMap(x=>[x.title,x.output,x.kind]),...ensOf(p,o).flatMap(x=>[x.title,x.route,x.action]),...refsOf(p,o).map(r=>r.name)].filter(text).join(' ');
const isTech=p=>p?.context?.sectorId==='tech'||RE.tech.test(p?.institution?.sector||'');
const name=o=>o.title||'—';
const H=(lens,section,message,entity='')=>({lens,section,level:'lens',message:pick(message),entity});

/* ---------------------------------------------------------------- built-in lenses */
const LENSES=[
 {id:'unique',group:'focus',source:'kau',
  title:t('ما الذي نملكه نحن دون غيرنا؟','What do we have that no one else has?'),
  question:t('هل يمكن أن تنتمي هذه الاستراتيجية إلى أي جهة في العالم؟ سمِّ الأصول الفريدة (الموقع، الجمهور، الشركاء، البيانات) واستعملها في «لماذا نحن».','Could this strategy belong to any institution in the world? Name the assets only we have (location, population, partners, data) and use them in "why us".'),
  lookFor:t('أصول محددة بالاسم في الهوية، وكل اتجاه مختار يستند إليها صراحةً.','Assets named specifically in the identity, and every selected direction leaning on them explicitly.'),
  example:t('جامعة في جدة: الميناء، قرب مكة وملايين الزوار، لا «جامعة بحثية عالمية» عامة.','A university in Jeddah: the port, proximity to Makkah and its millions of visitors, not a generic "world-class research university".'),
  check(p){const out=[];if(!text(p.institution?.assets))out.push(H('unique','identity',t('الأصول المميزة فارغة: بدونها تصلح الاستراتيجية لأي جهة.','Distinctive assets are empty: without them this strategy fits any institution.')));for(const o of selected(p).filter(o=>o.type!=='requirement').slice(0,6))if(!text(o.whyUs)||RE.placeholder.test(o.whyUs))out.push(H('unique','choices',t('«لماذا نحن» غير مكتملة في: ','"Why us" is incomplete in: '),o.id)),out[out.length-1].message+=name(o);return out;}},
 {id:'concentrate',group:'focus',source:'kau',
  title:t('ركّز الموارد ولا توزعها','Concentrate resources, do not spread them'),
  question:t('أين يذهب المال إلى الوحدات الناجحة، وما الذي يُوقف أو يُدمج لتحرير الموارد؟ التوزيع المتساوي ليس استراتيجية.','Where does money flow to the proven performers, and what is stopped or merged to release it? Equal distribution is not a strategy.'),
  lookFor:t('اختيار «إيقاف/دمج» واحد على الأقل مع وجهة الموارد المحررة، و«ما لن نفعله» مكتوب.','At least one stop/merge choice with a destination for the released resources, and "what we will not do" written down.'),
  example:t('أربعة مراكز بحثية بدل عشرات؛ إغلاق أو دمج ما لا يُنتج وإعادة تخصيص موارده لمن يُنتج.','Four research centres instead of dozens; close or merge what does not deliver and reallocate to those who do.'),
  check(p){const sel=selected(p).filter(o=>o.type!=='requirement');const divest=(p.options||[]).some(o=>o.type==='divest');if(sel.length>=4&&!divest)return [H('concentrate','choices',t(`${sel.length} اتجاهات مختارة ولا شيء يُوقف أو يُدمج: ما الذي يُحرر الموارد لها؟`,`${sel.length} directions selected and nothing stopped or merged: what releases the resources for them?`))];if(sel.length>=3&&!text(p.institution?.notDoing))return [H('concentrate','identity',t('«ما لن نفعله» فارغ مع عدة اتجاهات: التركيز يحتاج قرار استبعاد صريح.','"What we will not do" is empty while several directions are selected: focus needs an explicit exclusion.'))];return [];}},
 {id:'evaluate-first',group:'evidence',source:'kau',
  title:t('قيّم داخليًا قبل القطع','Evaluate internally before you cut'),
  question:t('كيف نعرف من يُنتج ومن لا يُنتج؟ تقييم داخلي (6–12 شهرًا) يسبق أي إيقاف أو دمج — ولا ندع الخارج يملي علينا ذلك.','How do we know who delivers and who does not? An internal evaluation (6–12 months) precedes any closure or merger, and outsiders must not dictate it for us.'),
  lookFor:t('لكل قرار إيقاف مبادرة تعلّم تُنتج الدليل، ودليل الإيقاف مسمّى.','Every stop decision has a learning initiative that produces the evidence, and the stop evidence is named.'),
  example:t('6–12 شهرًا لتقييم الوحدات القائمة، ثم قطع غير المجدي ودمج الناجح.','6–12 months to evaluate existing units, then cut the useless and merge the successful.'),
  check(p){const out=[];for(const o of (p.options||[]).filter(o=>o.type==='divest')){const hasLearn=insOf(p,o).some(i=>i.kind==='learn');const evidence=text(o.divestEvidence)||text(o.stopEvidence);if(!hasLearn||!evidence)out.push(H('evaluate-first','roadmap',t('قرار إيقاف بلا تقييم داخلي يسبقه (مبادرة تعلّم + دليل مسمّى): ','A stop decision without an internal evaluation before it (a learning initiative and named evidence): '),o.id)),out.length&&(out[out.length-1].message+=name(o));}return out;}},
 {id:'stabilize',group:'method',source:'kau',
  title:t('ثبّت قبل أن تصعد','Stabilize before you climb'),
  question:t('إذا كان الوضع في تراجع، فالهدف الأول للأفق كاملًا قد يكون التثبيت لا القفز. ولمَ لا نصوغ الهدف «زيادة بمقدار» بدل «الوصول إلى»؟','If the position is slipping, the first goal for the whole horizon may be to stabilize, not to leap. And why not phrase the goal as an increase "by" rather than "to"?'),
  lookFor:t('مستهدفات بحجم القدرة، ومسار سنوي يبدأ بوقف التراجع.','Targets sized to capability and an annual path that starts by stopping the decline.'),
  example:t('في التصنيفات: الهدف الأول (خمس سنوات!) ألا نهبط أكثر.','In rankings: the first goal (five years!) is not to drop further.'),
  check(p){const out=[];for(const x of (p.transitions||[])){if(!num(x.baseline)||!num(x.target)||Math.abs(x.baseline)<5||x.trackType==='maturity')continue;const jump=Math.abs(x.target-x.baseline)/Math.abs(x.baseline);if(jump>0.5)out.push(H('stabilize','references',t(`قفزة ${Math.round(jump*100)}٪ على «${x.kpi||''}»: هل التثبيت أولًا أواقعي أكثر؟ وهل الصياغة «زيادة بمقدار» أصدق؟`,`A ${Math.round(jump*100)}% jump on "${x.kpi||''}": is stabilizing first more realistic, and is "increase by" the more honest phrasing?`),x.id));}return out.slice(0,4);}},
 {id:'controllable',group:'method',source:'kau',
  title:t('فكّك المؤشر الخارجي','Decompose the external index'),
  question:t('كيف يُحسب التصنيف أو المؤشر؟ ما مكوناته التي نتحكم بها الآن، وما الذي يعتمد على الماضي (كالاستشهادات) ولا يتغير سريعًا؟ اعمل على ما تتحكم به.','How is the ranking or index computed? Which components can we move now, and which depend on the past (citations) and will not move quickly? Act on what you control.'),
  lookFor:t('المؤشر الخارجي مفكك إلى مكونات بمؤشرات داخلية قابلة للتحريك.','The external index broken into components with internal, movable indicators.'),
  example:t('نسبة الطلاب الدوليين وهيئة التدريس الدولية تتحرك الآن؛ الاستشهادات تحتاج سنوات.','International-student and international-faculty ratios move now; citations take years.'),
  check(p){const out=[];for(const x of (p.transitions||[]))if(RE.index.test([x.kpi,x.domain,x.targetState].filter(text).join(' ')))out.push(H('controllable','references',t('مؤشر خارجي: فكّكه إلى ما نتحكم به الآن وما يتأخر: ','External index: decompose it into what we control now and what lags: '),x.id)),out[out.length-1].message+=(x.kpi||'');return out.slice(0,3);}},
 {id:'critical-mass',group:'focus',source:'kau',
  title:t('كتلة حرجة لا تجزئة','Critical mass, not fragmentation'),
  question:t('كم ركيزة أو قطاعًا نستطيع أن نملك فيه كتلة حرجة فعلًا؟ أربع ركائز بقوة خير من عشر بلا أثر.','In how many pillars or verticals can we really hold critical mass? Four strong pillars beat ten with no impact.'),
  lookFor:t('خمسة اتجاهات تمييز/طموح مختارة على الأكثر، لكلٍ موارد كافية.','At most five differentiation/moonshot directions selected, each with enough resources.'),
  example:t('أربعة مراكز بحثية، واحد لكل ركيزة، وإغلاق أو دمج البقية.','Four research centres, one per pillar, and the rest closed or merged.'),
  check(p){const g=growth(p);return g.length>5?[H('critical-mass','choices',t(`${g.length} اتجاهات نمو مختارة تُبدد الكتلة الحرجة؛ قاعدة الخبير: أربع ركائز على الأكثر.`,`${g.length} growth directions selected dilute critical mass; the adviser's rule: four pillars at most.`))]:[];}},
 {id:'moonshot-scale',group:'growth',source:'kau',
  title:t('موونشوت واحد بحجمنا','One moonshot, scaled to us'),
  question:t('أين المشروع الكبير؟ «الموونشوت» نسبي لنا ولبلدنا لا للعالم. مبادرة كبيرة أو اثنتان (لا نقدر على أكثر) مع منح داخلية صغيرة لأفكار الناس، ثم ننقل الناجح إلى مال أكبر.','Where is the big project? A "moonshot" is relative to us and our country, not to the world. One or two large initiatives (we cannot afford more) plus small internal grants for people\'s ideas, then move the successful ones to more money.'),
  lookFor:t('موونشوت واحد أو اثنان بموطئ قدم وبوابة إيقاف، ومسار تعلّم صغير يغذيهما.','One or two moonshots with a foothold and a stop gate, fed by a small learning track.'),
  example:t('مشروع كبير واحد للمراكز البحثية، ومنح داخلية بنحو 15 ألف دولار للباحثين.','One big project for the research centres and internal grants of about 15k USD for researchers.'),
  check(p){const m=(p.options||[]).filter(o=>o.type==='moonshot');if(!m.length&&(p.options||[]).length>=2)return [H('moonshot-scale','choices',t('لا موونشوت في الاستراتيجية: أين المشروع الكبير الذي يُحرك الجهة، بحجمها هي؟','No moonshot in the strategy: where is the big project that moves the institution, at its own scale?'))];if(m.filter(o=>o.decision==='select').length>2)return [H('moonshot-scale','choices',t('أكثر من موونشوتين مختارين: لا نقدر على تمويل أكثر من مبادرة كبيرة أو اثنتين.','More than two moonshots selected: we cannot fund more than one or two large bets.'))];return [];}},
 {id:'bottom-up',group:'people',source:'kau',
  title:t('يقودها أصحاب الأداء من الداخل','Led by our own high performers'),
  question:t('من الداخل يقود كل اتجاه؟ القرار من الأعلى وحده لا يعمل؛ الخبراء في مجالهم يعرفون ما الخطوة التالية. كافئ من فهم ولا تشتت الجهد على من لم يفهم.','Who inside leads each direction? Top-down alone will not work; experts in their field know the next step better than anyone. Reward those who already understood and do not spread effort on those who have not.'),
  lookFor:t('مالك مسمّى لكل اتجاه، وممكّن ثقافي/بشري واحد على الأقل.','A named owner for every direction and at least one culture/people enabler.'),
  example:t('ادعم من يحصل على التمويل أصلًا بمزيد من الدعم؛ هم من سيقود التغيير.','Support those who already win funding with more support; they will drive the change.'),
  check(p){const out=[];const sel=selected(p);const noOwner=sel.filter(o=>!text(o.owner));if(sel.length&&noOwner.length>=Math.ceil(sel.length/2))out.push(H('bottom-up','choices',t(`${noOwner.length} من ${sel.length} اتجاهات بلا مالك داخلي مسمّى.`,`${noOwner.length} of ${sel.length} directions have no named internal owner.`)));if(sel.filter(o=>o.type!=='requirement').length>=2&&!(p.enablers||[]).some(e=>e.kind==='culture'))out.push(H('bottom-up','enablers',t('لا ممكّن ثقافي/بشري: من الداخل يتبنى التغيير وكيف يُكافأ؟','No culture/people enabler: who inside adopts the change and how are they rewarded?')));return out;}},
 {id:'partner-route',group:'growth',source:'ejada',
  title:t('شراكة أو استحواذ — ولماذا يشاركوننا؟','Partner or acquire, and why would they partner with us?'),
  question:t('لكل اتجاه نمو: هل درسنا طريق الشراكة أو الاستحواذ بدل البناء وحدنا؟ وإن كانت شراكة: لماذا يختاروننا — ماذا نضع نحن على الطاولة؟ وأي هيكل يجعلهم يأتون إلينا لا إلى المنافس؟','For every growth direction: did we weigh a partnership or acquisition route instead of building alone? And if it is a partnership: why would they choose us, what do we bring to the table, and what structure makes them come to us rather than to the competitor?'),
  lookFor:t('مسار ابنِ/شارك/استحوذ مذكور صراحةً، وقيمة الجهة للشريك مكتوبة.','An explicit build/partner/acquire route and the institution\'s value to the partner written down.'),
  example:t('لماذا تشارك شركةُ أمن سيبراني شركةَ تكامل أنظمة؟ عملاؤها، قدرتها التشغيلية، تراخيصها.','Why would a cybersecurity firm partner with a systems integrator? Its clients, delivery capacity and licences.'),
  check(p){const out=[];for(const o of growth(p).slice(0,6)){const s=optionText(p,o);if(!RE.partner.test(s))out.push(H('partner-route','choices',t('لم يُدرس طريق الشراكة أو الاستحواذ لهذا الاتجاه: ','No partnership or acquisition route weighed for this direction: '),o.id)),out[out.length-1].message+=name(o);else if(!RE.bring.test([o.whyUs,o.outcome,o.decisionReason].filter(text).join(' ')))out.push(H('partner-route','choices',t('يذكر شراكة دون أن يقول ماذا نقدم للشريك ولماذا يختارنا: ','Mentions a partnership without saying what we bring and why they would choose us: '),o.id)),out[out.length-1].message+=name(o);}return out.slice(0,4);}},
 {id:'recurring',group:'growth',source:'ejada',
  title:t('ابحث عن الأعمال المتكررة','Find the recurring business'),
  question:t('هل هذا عمل متكرر (اشتراك، خدمة مدارة، تجديد سنوي) أم تذاكر لمرة واحدة؟ فضّل ما يتكرر: كشف الاحتيال للبنوك عمل متكرر.','Is this recurring business (subscription, managed service, annual renewal) or one-off tickets? Prefer what recurs: fraud detection for banks is recurring business.'),
  lookFor:t('مؤشر للإيراد المتكرر أو التجديد، ونموذج تسعير متجدد في الاتجاهات الإيرادية.','An indicator for recurring revenue or renewal, and a renewing pricing model in revenue directions.'),
  example:t('مراقبة الاحتيال كخدمة بعقد سنوي بدل مشروع تطبيق يُسلَّم مرة.','Fraud monitoring as an annually renewed service instead of a one-time implementation project.'),
  check(p){const out=[];for(const o of selected(p).filter(o=>o.type!=='requirement')){const trs=trsOf(p,o);const rev=trs.some(x=>RE.revenue.test([x.kpi,x.domain,x.unit].filter(text).join(' '))||/ريال|SAR/i.test(x.unit||''));if(rev&&!RE.recurring.test(optionText(p,o)))out.push(H('recurring','choices',t('اتجاه إيرادي لا يقول إن كان متكررًا أم لمرة واحدة: ','A revenue direction that does not say whether it recurs or is one-off: '),o.id)),out[out.length-1].message+=name(o);}return out.slice(0,3);}},
 {id:'vertical-focus',group:'focus',source:'ejada',
  title:t('قطاعات قليلة، تذاكر كبيرة، أجندة وطنية','Few verticals, large tickets, a national agenda'),
  question:t('لماذا نركز على قطاع تذاكره صغيرة؟ اختر قطاعات قليلة تذاكرها كبيرة ولها أجندة رقمنة وطنية، واربط الاتجاه بتلك الأجندة.','Why focus on a vertical whose tickets are small? Choose a few verticals where tickets are large and a national digitization agenda exists, and tie the direction to that agenda.'),
  lookFor:t('حجم التذكرة ومرجع الأجندة الوطنية مذكوران لكل قطاع مستهدف.','Ticket size and the national-agenda reference stated for every targeted vertical.'),
  example:t('التقنية المالية تذاكرها صغيرة؛ قطاعات ذات تحول رقمي وطني أكبر تذاكرها أكبر.','Fintech tickets are small; verticals carrying a national digital-transformation programme have larger tickets.'),
  check(p){const out=[];for(const o of growth(p).slice(0,6)){const s=optionText(p,o);if(RE.vertical.test(s)&&!RE.national.test(s))out.push(H('vertical-focus','choices',t('يستهدف قطاعًا دون ربطه بأجندة رقمنة وطنية أو بحجم تذكرته: ','Targets a vertical without tying it to a national digitization agenda or its ticket size: '),o.id)),out[out.length-1].message+=name(o);}if(!out.length&&isTech(p)&&growth(p).length&&!growth(p).some(o=>RE.vertical.test(optionText(p,o))))out.push(H('vertical-focus','choices',t('لا اتجاه يسمّي القطاعات المستهدفة: أيها كبيرة التذاكر وذات أجندة وطنية؟','No direction names the target verticals: which have large tickets and a national agenda?')));return out.slice(0,3);}},
 {id:'follow-funding',group:'evidence',source:'kau',
  title:t('اتبع الممول','Follow the funder'),
  question:t('من يمول هذا؟ واءم مع أولويات الممول الوطني، وضع مستهدفات واقعية لما نستطيع جذبه، وتعلّم لماذا فشلت الطلبات السابقة (كتابة المقترحات، الدعم الإداري).','Who funds this? Align with the national funder\'s priorities, set realistic targets for what we can attract, and learn why earlier bids failed (proposal writing, administrative support).'),
  lookFor:t('الممول مسمّى في المرجعيات أو الممكنات، وتمويل سنوي معروف أو مبادرة لتأمينه.','The funder named in references or enablers, and annual funding known or an initiative to secure it.'),
  example:t('المواءمة مع هيئة البحث والتطوير والابتكار كمصدر تمويل رئيسي، وتدريب على كتابة المنح.','Aligning with the national research funder as the main source, with grant-writing training.'),
  check(p){const big=selected(p).filter(o=>o.type==='moonshot');if(!big.length)return [];const fundingKnown=(p.funding||[]).some(f=>num(f.available));if(!fundingKnown&&!RE.funder.test(allText(p)))return [H('follow-funding','roadmap',t('موونشوت مختار بلا ممول مسمّى ولا تمويل سنوي معروف: من يدفع ولماذا يوافق؟','A selected moonshot with no named funder and no known annual funding: who pays and why would they agree?'))];return [];}},
 {id:'time-capacity',group:'people',source:'kau',
  title:t('من أين يأتي الوقت؟','Where does the time come from?'),
  question:t('من سينفذ فعلًا، ومتى؟ الاستراتيجية التي لا تسمّي القدرة التنفيذية لكل مبادرة تفترض وقتًا غير موجود.','Who will actually do the work, and when? A strategy that does not name delivery capacity per initiative assumes time that does not exist.'),
  lookFor:t('حقل القدرة التنفيذية معبأ لكل مبادرة مختارة.','The capacity field filled for every initiative of a selected direction.'),
  example:t('كيف نجد الوقت لعمل البحث نفسه؟','How do we find the TIME to actually do the research?'),
  check(p){const sel=new Set(selected(p).map(o=>o.id));const missing=(p.initiatives||[]).filter(i=>sel.has(i.optionId)&&!text(i.capacity));return missing.length?[H('time-capacity','roadmap',t(`${missing.length} مبادرة بلا قدرة تنفيذية مسمّاة (من ينفذ وبأي وقت).`,`${missing.length} initiative(s) with no named delivery capacity (who delivers, with what time).`))]:[];}},
 {id:'persistence',group:'evidence',source:'kau',
  title:t('كم تدوم الظروف الخارجية؟','How long will external conditions hold?'),
  question:t('ما الموارد والشروط الخارجية المفترضة، وما توقعنا لاستمرارها؟ وما خطة التكيف إذا تغيرت البيئة الأوسع التي لا نتحكم بها؟','What external resources and conditions are assumed, what is their expected persistence, and what is the adaptation plan if the wider environment we do not control changes?'),
  lookFor:t('لكل افتراض مدة استمرار متوقعة وأثر فشل.','Every assumption carries an expected persistence and a failure impact.'),
  example:t('الاستفسار الرابع في منهجية التحول: شروط خارجية، استمرارها، وخطة التكيف.','Inquiry four of the transformation method: external conditions, their persistence, the adaptation plan.'),
  check(p){let n=0;for(const o of selected(p))for(const a of o.assumptions||[])if(text(a.text)&&!text(a.expectedPersistence))n++;return n?[H('persistence','choices',t(`${n} افتراضًا بلا مدة استمرار متوقعة: إلى متى نراهن عليه؟`,`${n} assumption(s) without an expected persistence: how long are we betting on it?`))]:[];}},
 {id:'liabilities',group:'evidence',source:'kau',
  title:t('الالتزامات رأس مال أيضًا','Liabilities are capital too'),
  question:t('ما أصول الجهة والتزاماتها كرأس مال نحو أهدافها؟ هل يمكن زيادة الأصول وخفض الالتزامات بشكل ذي معنى؟','What are the institution\'s assets and liabilities as capital towards its goals? Can the assets be meaningfully increased and the liabilities reduced?'),
  lookFor:t('الالتزامات مكتوبة في الهوية، واتجاه واحد على الأقل يخفض التزامًا.','Liabilities written in the identity and at least one direction reducing one.'),
  example:t('الاستفسار الخامس: الأصول والالتزامات كرأس مال، لا كقائمة جرد.','Inquiry five: assets and liabilities as capital, not as an inventory.'),
  check(p){return text(p.institution?.liabilities)?[]:[H('liabilities','identity',t('الالتزامات فارغة: ما الذي يجب خفضه حتى تتحرر الموارد؟','Liabilities are empty: what must be reduced for resources to come free?'))];}},
 {id:'ecosystem',group:'method',source:'kau',
  title:t('مستدامة في بيئتها لا متطفلة عليها','Sustainable within its ecosystem, not parasitic'),
  question:t('ما الضمانات التي تجعل الجهة مستدامة بيئيًا داخل منظومتها الأكبر — لا تستنزف الوطن ولا الشركاء — مع استقلال معقول؟','What safeguards make the institution ecologically sustainable within the larger system, draining neither the country nor its partners, with reasonable autonomy?'),
  lookFor:t('أثر الاتجاهات على الشركاء والمنظومة مذكور في المقايضات.','The effect of the directions on partners and the system stated in the trade-offs.'),
  example:t('الاستفسار السابع في منهجية التحول.','Inquiry seven of the transformation method.')},
 {id:'unknowns',group:'method',source:'kau',
  title:t('المجهولات المجهولة','Unknown unknowns'),
  question:t('ما الاستفسارات الإضافية اللازمة لضمان تحقيق الأهداف، وما الموارد التي تضمن اكتمالها؟ اكتب ما لا نعرفه بعد.','What additional inquiries are needed to secure the goals, and what resources make those inquiries complete? Write down what we do not yet know.'),
  lookFor:t('ملاحظة المراجعة تحتوي الأسئلة المفتوحة ومن يجيب عنها ومتى.','The review note holds the open questions, who answers them and when.'),
  example:t('الاستفسار الثامن: الوعي بالمجهولات المجهولة.','Inquiry eight: gaining awareness of unknown unknowns.'),
  check(p){return text(p.reviewNote)||(p.options||[]).length<2?[]:[H('unknowns','review',t('لا أسئلة مفتوحة مسجلة: استراتيجية بلا مجهولات معلنة تخفيها.','No open questions recorded: a strategy with no declared unknowns is hiding them.'))];}},
 {id:'ai-service',group:'growth',source:'ejada',
  title:t('الذكاء الاصطناعي خط خدمة — وأمنه سوق جديدة','AI as a service line, and securing it as a new market'),
  question:t('أين يصنع الذكاء الاصطناعي خدمة متكررة يمكن الدفاع عنها (كشف الاحتيال في البنوك مثلًا)؟ ومع تزايد استخدام المؤسسات للنماذج اللغوية، كيف نحمي بياناتها من الاستغلال عبر الأوامر (prompts)؟ أمن الذكاء الاصطناعي عرضٌ بحد ذاته.','Where does AI create a recurring, defensible service (fraud detection in banking, for example)? And as organizations increasingly use language models, how do we protect their data from exploitation through prompts? Security for AI is an offering in itself.'),
  lookFor:t('خدمة ذكاء اصطناعي متكررة واحدة على الأقل، وعرض لأمن الذكاء الاصطناعي حيث يناسب.','At least one recurring AI service, and a security-for-AI offering where it fits.'),
  example:t('تطبيقات كثيرة للذكاء الاصطناعي في المصرفية والأمن؛ الاحتيال حالة جيدة لأنها عمل متكرر.','Many AI applications in banking and security; fraud is a good case because it is recurring business.'),
  check(p){if(!isTech(p))return [];const s=growth(p).map(o=>optionText(p,o)).join(' ');if(!RE.ai.test(s))return [H('ai-service','choices',t('شركة تقنية بلا اتجاه للذكاء الاصطناعي: أين الخدمة المتكررة التي يصنعها (الاحتيال، الأمن)؟','A technology company with no AI direction: where is the recurring service it creates (fraud, security)?'))];if(!RE.aiSecurity.test(s))return [H('ai-service','choices',t('الذكاء الاصطناعي حاضر دون «أمن الذكاء الاصطناعي»: حماية بيانات العملاء في الأوامر سوق متنامية.','AI is present without "security for AI": protecting client data inside prompts is a growing market.'))];return [];}}
];

/* ---------------------------------------------------------------- memory (the expert's own thinking, across projects) */
const uid=()=>'my-'+Math.random().toString(36).slice(2,8)+Date.now().toString(36).slice(-3);
function normCustom(x){if(!x||typeof x!=='object'||!text(x.title))return null;return {id:text(x.id)?String(x.id).slice(0,60):uid(),origin:'user',group:GROUPS.includes(x.group)?x.group:'custom',title:String(x.title).trim().slice(0,160),question:String(x.question||x.title).trim().slice(0,600),lookFor:String(x.lookFor||'').trim().slice(0,600),keywords:(Array.isArray(x.keywords)?x.keywords:String(x.keywords||'').split(/[,،\n]/)).map(k=>String(k).trim()).filter(Boolean).slice(0,24),source:String(x.source||'').slice(0,160),createdAt:text(x.createdAt)?x.createdAt:new Date().toISOString()};}
function mem(){let m={};try{m=JSON.parse(storage.get(KEY)||'{}')||{};}catch{m={};}return {version:1,includeInAI:m.includeInAI!==false,custom:(Array.isArray(m.custom)?m.custom:[]).map(normCustom).filter(Boolean).slice(0,200),state:m.state&&typeof m.state==='object'&&!Array.isArray(m.state)?m.state:{}};}
function save(m){storage.set(KEY,JSON.stringify(m));return m;}
function stateOf(m,id){const s=m.state[id]||{};return {useful:num(s.useful)?s.useful:0,noise:num(s.noise)?s.noise:0,enabled:s.enabled!==false};}
function isMuted(id,m=mem()){const s=stateOf(m,id);return !s.enabled||(s.noise>=3&&s.noise>=s.useful*2);}
function learn(x){const m=mem();const l=normCustom(x);if(!l)return null;const dup=m.custom.find(c=>c.title.toLowerCase()===l.title.toLowerCase());if(dup)return dup;m.custom.push(l);save(m);return l;}
function forget(id){const m=mem();m.custom=m.custom.filter(c=>c.id!==id);delete m.state[id];save(m);}
function setEnabled(id,on){const m=mem();m.state[id]=Object.assign(stateOf(m,id),{enabled:!!on});if(on){m.state[id].noise=0;}save(m);}
function feedback(id,kind){const m=mem();const s=stateOf(m,id);if(kind==='useful')s.useful++;else if(kind==='noise')s.noise++;m.state[id]=s;save(m);return s;}
function setIncludeInAI(on){const m=mem();m.includeInAI=!!on;save(m);}
function fromFinding(item,source=''){if(!item||!text(item.message))return null;return learn({title:String(item.message).slice(0,120),question:text(item.fix)?item.fix:item.message,lookFor:text(item.fix)?item.fix:'',group:'custom',source:source||'ai-review'});}
/* Deterministic extraction of candidate patterns from pasted notes: one candidate per meaningful line. */
function extract(notes){const lines=String(notes||'').split(/\r?\n|(?<=[.؟?!])\s+(?=[A-Z؀-ۿ])/).map(l=>l.replace(/^[\s\-•*–—\d.)]+/,'').trim()).filter(l=>l.length>=20&&l.length<=400);const seen=new Set();const out=[];for(const l of lines){const k=l.toLowerCase();if(seen.has(k))continue;seen.add(k);out.push({title:l.slice(0,90),question:l,lookFor:'',keywords:[],group:'custom'});}return out.slice(0,40);}
function exportJson(){return JSON.stringify(Object.assign({kind:'sultan.lenses.v1',exportedAt:new Date().toISOString()},mem()),null,2);}
function importJson(json){const x=typeof json==='string'?JSON.parse(json):json;if(!x||typeof x!=='object'||x.kind!=='sultan.lenses.v1')throw Error('invalid');const m=mem();for(const c of (Array.isArray(x.custom)?x.custom:[]).map(normCustom).filter(Boolean))if(!m.custom.some(o=>o.id===c.id||o.title.toLowerCase()===c.title.toLowerCase()))m.custom.push(c);if(x.state&&typeof x.state==='object')for(const [id,s] of Object.entries(x.state))if(!m.state[id])m.state[id]=s;if(typeof x.includeInAI==='boolean')m.includeInAI=x.includeInAI;save(m);return m;}

/* ---------------------------------------------------------------- views */
function plain(l,m){const s=stateOf(m,l.id);return {id:l.id,group:l.group,source:l.source||'',origin:'method',title:pick(l.title),question:pick(l.question),lookFor:pick(l.lookFor),example:pick(l.example),hasCheck:typeof l.check==='function',useful:s.useful,noise:s.noise,enabled:s.enabled,muted:isMuted(l.id,m)};}
function all(){const m=mem();return [...LENSES.map(l=>plain(l,m)),...m.custom.map(c=>{const s=stateOf(m,c.id);return Object.assign({},c,{hasCheck:c.keywords.length>0,useful:s.useful,noise:s.noise,enabled:s.enabled,muted:isMuted(c.id,m),example:''});})];}
function active(){return all().filter(l=>!l.muted).sort((a,b)=>(b.useful-b.noise)-(a.useful-a.noise));}
function hints(p){if(!p)return [];const m=mem();const out=[];for(const l of LENSES){if(!l.check||isMuted(l.id,m))continue;try{out.push(...(l.check(p)||[]));}catch{}}const corpus=allText(p).toLowerCase();for(const c of m.custom){if(isMuted(c.id,m)||!c.keywords.length)continue;if(!c.keywords.some(k=>corpus.includes(k.toLowerCase())))out.push({lens:c.id,section:'review',level:'lens',message:I.t('lensPatternUnaddressed',[c.question]),entity:''});}return out;}
function promptBlock(){const m=mem();if(!m.includeInAI)return '';const list=active().slice(0,30);if(!list.length)return '';const head=lang()==='ar'?'عدسات الخبير — أنماط تفكير صاحب المنهج (مستشار استراتيجي بخبرة أربعين عامًا). طبّق كل عدسة أثناء الصياغة والمراجعة، وحين تغيّر عدسةٌ توصيةً فاذكر أيها.':'Expert lenses — the thinking patterns of the method owner (a strategy adviser with forty years of practice). Apply every lens while drafting and reviewing; when a lens changes a recommendation, say which one.';return head+'\n'+list.map(l=>`- (${l.id}) ${l.title}: ${l.question}${text(l.lookFor)?' '+(lang()==='ar'?'ما يبدو عليه الجواب الجيد: ':'What good looks like: ')+l.lookFor:''}`).join('\n');}
function reviewQuestions(){return mem().includeInAI?active().slice(0,30).map(l=>({id:l.id,question:l.question})):[];}
function label(id){const l=all().find(x=>x.id===id);return l?l.title:id;}
/* The built-in catalogue in one language, for documentation and tests. */
function catalogue(lg){const k=lg==='en'?'en':'ar';return LENSES.map(l=>({id:l.id,group:l.group,source:l.source,title:l.title[k],question:l.question[k],lookFor:l.lookFor[k],example:l.example[k],hasCheck:typeof l.check==='function'}));}
/* Report fragment appended to the context section: the lenses applied and what they flagged. */
function reportHtml(p){const esc=x=>String(x??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));const list=active();if(!list.length)return '';const hs=hints(p);const rows=hs.map(h=>`<tr><td>${esc(label(h.lens))}</td><td>${esc(I.t('s2'+({identity:'08',choices:'09',references:'10',priorities:'11',enablers:'12',roadmap:'13',review:'14'}[h.section]||'14')))}</td><td>${esc(h.message)}</td></tr>`).join('');return `<h3>${esc(I.t('lensReportTitle'))}</h3><p>${esc(I.t('lensReportLead',[String(list.length)]))}</p>${hs.length?`<table><thead><tr><th>${esc(I.t('lensColLens'))}</th><th>${esc(I.t('lensColSection'))}</th><th>${esc(I.t('lensColHint'))}</th></tr></thead><tbody>${rows}</tbody></table>`:`<p>${esc(I.t('lensReportNone'))}</p>`}`;}
if(E&&typeof E.contextReportHtml==='function'){const base=E.contextReportHtml;E.contextReportHtml=function(p){const b=base(p);return b?b+reportHtml(p):b;};}

root.SultanLens={KEY,GROUPS,builtins:()=>LENSES.map(l=>l.id),catalogue,all,active,hints,promptBlock,reviewQuestions,label,mem,learn,forget,setEnabled,feedback,setIncludeInAI,isMuted,fromFinding,extract,exportJson,importJson,reportHtml,_setStorage(s){storage=s;}};
if(isNode)module.exports=root.SultanLens;
})(typeof globalThis!=='undefined'?globalThis:this);
