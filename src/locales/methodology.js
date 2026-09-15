/* SULTAN Decision Accountability Method — bilingual public methodology copy. */
(function(root){
'use strict';
root.SultanLocales=root.SultanLocales||{};
Object.assign(root.SultanLocales.en=root.SultanLocales.en||{}, {
  smEyebrow:'SULTAN DECISION ACCOUNTABILITY METHOD',
  smTitle:'A strategy is not decision-ready until its logic, authority, uncertainty and release conditions are visible.',
  smLead:'SULTAN treats strategy as an auditable decision system rather than a document. Five constructs make the decision inspectable; five advisory rules challenge internal coherence without silently changing approval status.',
  smChain:'The decision chain',
  smMandate:'Mandate',smChoice:'Choice',smEvidence:'Evidence',smAuthority:'Authority',smInitiative:'Initiative',smFunding:'Funding gate',smOutcome:'Outcome',
  smConstructs:'Five SULTAN constructs',
  smC1:'Auditable Choice',smC1D:'A preferred option must expose the reason, trade-off and supporting evidence — not only a score.',
  smC2:'Authority Space',smC2D:'Ownership clarity, status clarity and decision clearance are separate dimensions. A named owner does not prove executable authority.',
  smC3:'Decision Break-even',smC3D:'Show the criterion weight at which the preferred option changes, so decision robustness is visible rather than implied.',
  smC4:'Unknown ≠ Zero',smC4D:'Missing evidence, no declared initiative, no reading and unconfirmed funding remain distinct states. Absence is never converted into zero or readiness.',
  smC5:'Evidence-Gated Funding',smC5D:'Release resources only when the named evidence or acceptance condition is met; funding status is part of the decision, not an afterthought.',
  smRules:'R1–R5 coherence hints',
  smRulesLead:'These deterministic hints are advisory. They sit outside check() and never become approval blockers by themselves.',
  smR1:'R1 · Advantage grounding',smR1D:'Flag a selected discretionary choice when its “why us” has no visible anchor in the institution’s assets or context.',
  smR2:'R2 · Trade-off connection',smR2D:'Flag a stated “not doing” boundary when no option trade-off visibly carries that boundary into the choice set.',
  smR3:'R3 · Boundary contradiction',smR3D:'Flag when something declared as “not doing” materially overlaps a selected choice, outcome or rationale.',
  smR4:'R4 · Choice distinctiveness',smR4D:'Flag selected choices whose outcomes are so similar that they may be duplicates rather than real alternatives.',
  smR5:'R5 · Reference fitness',smR5D:'Flag a numeric target that relies on a reference not explicitly classified for use or adaptation in the institution’s context.',
  smReady:'Decision-ready means',
  smReady1:'The choice and its trade-off are explicit.',
  smReady2:'The evidence is relevant to this context.',
  smReady3:'Authority to act is visible, not assumed.',
  smReady4:'Unknowns remain visible and named.',
  smReady5:'Resource release has an evidence condition.',
  smNote:'SULTAN does not replace executive judgement. It makes the reasoning, authority and uncertainty behind that judgement inspectable.'
});
Object.assign(root.SultanLocales.ar=root.SultanLocales.ar||{}, {
  smEyebrow:'منهج سلطان لمساءلة القرار الاستراتيجي',
  smTitle:'لا تصبح الاستراتيجية جاهزة للقرار حتى يظهر منطقها وصلاحيتها ومجهولاتها وشروط إطلاق الموارد.',
  smLead:'يتعامل سلطان مع الاستراتيجية كنظام قرار قابل للفحص، لا كوثيقة. خمسة مفاهيم تجعل القرار قابلًا للتدقيق، وخمس قواعد استشارية تختبر الاتساق الداخلي دون أن تغيّر حالة الاعتماد خفيةً.',
  smChain:'سلسلة القرار',
  smMandate:'التكليف',smChoice:'الاختيار',smEvidence:'الدليل',smAuthority:'الصلاحية',smInitiative:'المبادرة',smFunding:'شرط التمويل',smOutcome:'النتيجة',
  smConstructs:'المفاهيم الخمسة في سلطان',
  smC1:'الاختيار القابل للفحص',smC1D:'الخيار المفضل يكشف السبب والمفاضلة والدليل الداعم — لا الدرجة النهائية فقط.',
  smC2:'مساحة الصلاحية',smC2D:'وضوح الملكية ووضوح الحالة وخلوص القرار أبعاد منفصلة. وجود مالك مسمّى لا يثبت وحده أن التنفيذ ممكن.',
  smC3:'نقطة تعادل القرار',smC3D:'يُظهر وزن المعيار الذي عنده يتغير الخيار المفضل، فتظهر متانة القرار بدل أن تبقى مفترضة.',
  smC4:'المجهول ≠ صفر',smC4D:'الدليل المفقود، وعدم إعلان مبادرة، وعدم وجود قراءة، والتمويل غير المؤكد تبقى حالات مختلفة؛ الغياب لا يتحول إلى صفر أو جاهزية.',
  smC5:'التمويل المشروط بالدليل',smC5D:'لا تُطلق الموارد إلا عند تحقق الدليل أو شرط القبول المسمّى؛ حالة التمويل جزء من القرار وليست خطوة لاحقة.',
  smRules:'قواعد الاتساق R1–R5',
  smRulesLead:'هذه إشارات حتمية استشارية. تبقى خارج check() ولا تتحول وحدها إلى موانع اعتماد.',
  smR1:'R1 · تأصيل الميزة',smR1D:'ينبّه إذا كان الاختيار التقديري المحدد يذكر «لماذا نحن» دون ارتكاز ظاهر على أصول الجهة أو سياقها.',
  smR2:'R2 · اتصال المفاضلة',smR2D:'ينبّه إذا أعلنت الجهة ما لن تفعله ولم يظهر هذا الحد داخل مفاضلات الخيارات.',
  smR3:'R3 · تناقض الحدود',smR3D:'ينبّه إذا تداخل ما أُعلن أنه «لن يُفعل» بصورة جوهرية مع اختيار محدد أو نتيجته أو مبرره.',
  smR4:'R4 · تمايز الخيارات',smR4D:'ينبّه إذا كانت نتائج خيارين محددين متشابهة جدًا لدرجة قد تعني أنهما تكرار لا بديلان حقيقيان.',
  smR5:'R5 · ملاءمة المرجع',smR5D:'ينبّه إذا استند مستهدف رقمي إلى مرجع لم يُصنّف صراحة للاستخدام أو التكييف في سياق الجهة.',
  smReady:'القرار الجاهز يعني',
  smReady1:'الاختيار ومفاضلته معلنان.',
  smReady2:'الدليل ملائم لهذا السياق.',
  smReady3:'صلاحية الفعل ظاهرة وليست مفترضة.',
  smReady4:'المجهولات ظاهرة ومسمّاة.',
  smReady5:'إطلاق الموارد له شرط دليل.',
  smNote:'سلطان لا يستبدل الحكم التنفيذي؛ بل يجعل المنطق والصلاحية وعدم اليقين وراء ذلك الحكم قابلة للفحص.'
});
})(globalThis);
