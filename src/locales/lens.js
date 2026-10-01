/* Expert lenses — bilingual interface copy. The lens content itself is bilingual inside src/expert-lens.js. */
(function(root){
'use strict';
root.SultanLocales=root.SultanLocales||{};
const en={
 lensTitle:'Expert lenses — the method owner\'s thinking patterns',
 lensLead:'Questions a strategy adviser with forty years of practice asks of every strategy. They run as advisory checks here, travel with every AI drafting and review prompt, and learn from you: add your own patterns, tell the lenses when they are useful or not, and turn any review finding into a pattern.',
 lensApplied:'Applied in: AI drafting · AI expert review · these advisory hints · the report.',
 lensNone:'No lens flagged anything in this project. The questions still apply; read them before approval.',
 lensHintCount:'%{0} hint(s)',
 lensGroup_focus:'Focus and concentration',lensGroup_growth:'Growth routes',lensGroup_evidence:'Evidence and resources',lensGroup_people:'People and capacity',lensGroup_method:'Method inquiries',lensGroup_custom:'Your patterns',
 lensSource_kau:'From the critical analysis of a university transformation (2025)',lensSource_ejada:'From growth notes for a technology company',lensSource_method:'SULTAN method',lensSource_user:'Added by you',lensSource_ai:'Learned from an AI review finding',
 lensQuestion:'The question',lensLook:'What good looks like',lensExample:'Example',
 lensUseful:'Useful',lensNoise:'Not here',lensFeedbackSaved:'Noted. Lenses you mark as useful lead the AI prompts; a lens marked "not here" three times is muted.',
 lensMute:'Mute',lensUnmute:'Unmute',lensMutedCount:'%{0} muted lens(es)',lensDelete:'Delete',
 lensMine:'Your patterns',lensBuiltin:'Built-in patterns',
 lensAdd:'Add a thinking pattern',lensAddLead:'Write the question you always ask. Keywords are optional: when none of them appears anywhere in a project, the lens raises a hint.',
 lensFieldTitle:'Title',lensFieldQuestion:'The question, as you would ask it',lensFieldLook:'What a good answer looks like (optional)',lensFieldKeywords:'Keywords, comma-separated (optional)',lensFieldGroup:'Group',
 lensSave:'Save pattern',lensCancel:'Cancel',lensSaved:'Pattern saved to the lens memory. It now applies to every project in this browser.',
 lensMakePattern:'Make it a pattern',lensLearned:'Learned: the finding is now a lens of yours.',
 lensNotes:'Teach the lenses from your notes',lensNotesLead:'Paste feedback notes you wrote on any strategy. SULTAN extracts candidate patterns (one per idea); with the AI assistant enabled it extracts them as structured questions with keywords. Keep the ones that express your thinking.',
 lensNotesPlaceholder:'Paste your notes here…',lensExtract:'Extract patterns',lensExtractAI:'Extract with AI',lensExtracting:'Reading your notes…',
 lensCandidates:'Candidate patterns — keep what expresses your thinking',lensKeep:'Keep',lensDrop:'Drop',lensKeepAll:'Keep all',lensNoCandidates:'No pattern could be extracted from these notes.',
 lensExport:'Export lens memory',lensImport:'Import lens memory',lensImported:'Lens memory imported.',lensImportFailed:'This file is not a SULTAN lens memory.',
 lensIncludeAI:'Include the lenses in AI drafting and review prompts',
 lensReportTitle:'Expert lenses applied',lensReportLead:'%{0} thinking pattern(s) of the method owner were applied to this draft as advisory questions. Hints below are not approval conditions.',lensReportNone:'No lens flagged anything in this draft.',
 lensColLens:'Lens',lensColSection:'Section',lensColHint:'Hint',
 lensPatternUnaddressed:'Your pattern is not visibly addressed in this project: %{0}',
 lensStep5:'The draft will be read through %{0} expert lenses (concentration, partner or acquire routes, recurring business, funder alignment…). Their hints appear in the Review section.',
 lensAiLabel:'Lens',lensDisclaimer:'Lenses are the adviser\'s judgement patterns, not rules of the method. They may not fit your case; mark them "not here" and they go quiet.'
};
const ar={
 lensTitle:'عدسات الخبير — أنماط تفكير صاحب المنهج',
 lensLead:'أسئلة يطرحها مستشار استراتيجي بخبرة أربعين عامًا على كل استراتيجية. تعمل هنا كفحوص استرشادية، وتسافر مع كل مطالبة توليد ومراجعة للذكاء الاصطناعي، وتتعلم منك: أضف أنماطك، وأخبر العدسات متى تكون مفيدة أو لا، وحوّل أي ملاحظة مراجعة إلى نمط.',
 lensApplied:'تُطبَّق في: توليد المسودة بالذكاء الاصطناعي · مراجعة الخبير الذكية · هذه التنبيهات الاسترشادية · التقرير.',
 lensNone:'لم تُنبّه أي عدسة على شيء في هذا المشروع. الأسئلة قائمة مع ذلك؛ اقرأها قبل الاعتماد.',
 lensHintCount:'%{0} تنبيه',
 lensGroup_focus:'التركيز وتركيز الموارد',lensGroup_growth:'طرق النمو',lensGroup_evidence:'الدليل والموارد',lensGroup_people:'الناس والقدرة',lensGroup_method:'استفسارات المنهج',lensGroup_custom:'أنماطك',
 lensSource_kau:'من التحليل النقدي لتحوّل جامعي (2025)',lensSource_ejada:'من ملاحظات نمو شركة تقنية',lensSource_method:'منهج سلطان',lensSource_user:'أضفته أنت',lensSource_ai:'تعلّمته من ملاحظة مراجعة ذكية',
 lensQuestion:'السؤال',lensLook:'ما يبدو عليه الجواب الجيد',lensExample:'مثال',
 lensUseful:'مفيد',lensNoise:'ليس هنا',lensFeedbackSaved:'سُجّل. العدسات التي تَصِفها بالمفيدة تتصدر مطالبات الذكاء الاصطناعي، والعدسة الموصوفة بـ«ليس هنا» ثلاث مرات تُكتم.',
 lensMute:'اكتم',lensUnmute:'أعد التفعيل',lensMutedCount:'%{0} عدسة مكتومة',lensDelete:'احذف',
 lensMine:'أنماطك',lensBuiltin:'الأنماط المدمجة',
 lensAdd:'أضف نمط تفكير',lensAddLead:'اكتب السؤال الذي تطرحه دائمًا. الكلمات المفتاحية اختيارية: إن لم تظهر أيٌّ منها في المشروع رفعت العدسة تنبيهًا.',
 lensFieldTitle:'العنوان',lensFieldQuestion:'السؤال كما تطرحه',lensFieldLook:'ما يبدو عليه الجواب الجيد (اختياري)',lensFieldKeywords:'كلمات مفتاحية مفصولة بفواصل (اختياري)',lensFieldGroup:'المجموعة',
 lensSave:'احفظ النمط',lensCancel:'إلغاء',lensSaved:'حُفظ النمط في ذاكرة العدسات، وسيُطبَّق على كل مشروع في هذا المتصفح.',
 lensMakePattern:'اجعله نمطًا',lensLearned:'تعلّمتُ: أصبحت الملاحظة عدسة من عدساتك.',
 lensNotes:'علّم العدسات من ملاحظاتك',lensNotesLead:'ألصق ملاحظات كتبتها على أي استراتيجية. يستخرج سلطان أنماطًا مرشحة (نمطًا لكل فكرة)، ومع تفعيل المساعد الذكي يستخرجها كأسئلة منظمة بكلمات مفتاحية. احتفظ بما يعبّر عن تفكيرك.',
 lensNotesPlaceholder:'ألصق ملاحظاتك هنا…',lensExtract:'استخرج الأنماط',lensExtractAI:'استخرج بالذكاء الاصطناعي',lensExtracting:'أقرأ ملاحظاتك…',
 lensCandidates:'أنماط مرشحة — احتفظ بما يعبّر عن تفكيرك',lensKeep:'احتفظ',lensDrop:'أسقط',lensKeepAll:'احتفظ بالكل',lensNoCandidates:'لم يُستخرج أي نمط من هذه الملاحظات.',
 lensExport:'صدّر ذاكرة العدسات',lensImport:'استورد ذاكرة العدسات',lensImported:'استُوردت ذاكرة العدسات.',lensImportFailed:'هذا الملف ليس ذاكرة عدسات من سلطان.',
 lensIncludeAI:'ضمّن العدسات في مطالبات التوليد والمراجعة للذكاء الاصطناعي',
 lensReportTitle:'عدسات الخبير المطبَّقة',lensReportLead:'طُبّق %{0} من أنماط تفكير صاحب المنهج على هذه المسودة كأسئلة استرشادية. التنبيهات أدناه ليست شروط اعتماد.',lensReportNone:'لم تُنبّه أي عدسة على شيء في هذه المسودة.',
 lensColLens:'العدسة',lensColSection:'القسم',lensColHint:'التنبيه',
 lensPatternUnaddressed:'نمطك غير ملموس في هذا المشروع: %{0}',
 lensStep5:'ستُقرأ المسودة عبر %{0} عدسة من عدسات الخبير (تركيز الموارد، طرق الشراكة أو الاستحواذ، الأعمال المتكررة، المواءمة مع الممول…). تظهر تنبيهاتها في قسم المراجعة.',
 lensAiLabel:'عدسة',lensDisclaimer:'العدسات أنماط حكم المستشار لا قواعد المنهج. قد لا تناسب حالتك؛ صِفها بـ«ليس هنا» فتسكت.'
};
root.SultanLocales.en=Object.assign(root.SultanLocales.en||{},en);
root.SultanLocales.ar=Object.assign(root.SultanLocales.ar||{},ar);
if(typeof module!=='undefined'&&module.exports)module.exports={en,ar};
})(typeof globalThis!=='undefined'?globalThis:this);
