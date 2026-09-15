/* Fictional demo content, shared by the browser and deterministic model tests. */
(function(root){
'use strict';
const messages={
  "en": {
    "demoBurden": "Ongoing operating burden",
    "demoBurdenLow": "0: no additional recurring burden (best)",
    "demoBurdenHigh": "100: very high recurring burden (worst)",
    "demoAssumption1": "Local employers will co-design the learning offer and support a small pilot. Recheck commitments before the 2027 launch.",
    "demoRisk1": "A delayed partner approval would postpone the pilot; use a campus-only trial until approval is documented.",
    "demoAssumption2": "The research prototype can establish a measurable advantage. Review evidence at the end of the 2028 learning phase.",
    "demoRisk2": "External authority may not be granted and technical evidence may be weak. Do not commit to full deployment before both gates clear.",
    "demoAssumption3": "Demand would grow across all disciplines at the same pace; this assumption has not been validated.",
    "demoRisk3": "Spreading staff and funding too thin could weaken the distinctive areas. Keep this alternative deferred pending evidence.",
    "demoAssumption4": "A regional partner is willing to sponsor a limited pilot. The decision owner and delivery scope have not yet been mapped.",
    "demoRisk4": "An uncosted partnership could create hidden staffing commitments. Map authority and initiatives before promising delivery.",
    "demoPilot": "Regional partnership pilot",
    "demoPilotDecision": "Selected conditionally for scoping only. Authority and initiatives remain unmapped; no funding commitment is implied.",
    "demoPilotOutcome": "Test one regional learning partnership by 2029, subject to evidence, authority and a costed plan.",
    "demoPilotWhy": "Build on the university’s existing employer relationships.",
    "demoPilotTradeoff": "Defer a wider rollout until the pilot decision is reviewed.",
    "demoPilotOwner": "Fictional partnerships team",
    "demoScoreNote": "Illustrative workshop judgment only; not field evidence.",
    "demoBlocker": "Partner approval for the placement pilot",
    "demoBlockerOwner": "Fictional partner steering committee",
    "demoBlockerSource": "Fictional decision note: approval withheld until a supervision plan is agreed.",
    "demoBlockerRoute": "Submit the supervision plan to the partner committee before the 2027 launch.",
    "demoBlockerFallback": "Run a campus-only trial; do not announce partner placements before clearance.",
    "demoReady": "Campus pilot coordination team",
    "demoReadySource": "Fictional internal note assigning the pilot coordinator.",
    "demoReadyRoute": "Activate the coordinator after the external launch decision is resolved."
  },
  "ar": {
    "demoBurden": "عبء التشغيل المستمر",
    "demoBurdenLow": "0: لا يوجد عبء تشغيلي إضافي متكرر (الأفضل)",
    "demoBurdenHigh": "100: عبء تشغيلي متكرر مرتفع جدًا (الأسوأ)",
    "demoAssumption1": "سيشارك أصحاب العمل المحليون في تصميم التعلم ودعم تجربة محدودة. تُراجع الالتزامات قبل إطلاق 2027.",
    "demoRisk1": "تأخر موافقة الشريك يؤجل التجربة؛ يُستخدم اختبار داخل الجامعة حتى توثيق الموافقة.",
    "demoAssumption2": "يمكن للنموذج البحثي الأولي إثبات ميزة قابلة للقياس. تُراجع الأدلة بنهاية مرحلة التعلم في 2028.",
    "demoRisk2": "قد لا تُمنح الصلاحية الخارجية وقد تكون الأدلة التقنية ضعيفة. لا يُلتزم بالنشر الكامل قبل حسم الأمرين.",
    "demoAssumption3": "سينمو الطلب بالوتيرة نفسها عبر جميع التخصصات؛ هذا الافتراض لم يُتحقق منه.",
    "demoRisk3": "توزيع الكوادر والتمويل على نطاق واسع قد يضعف مجالات التميز. يبقى البديل مؤجلًا لحين ظهور الأدلة.",
    "demoAssumption4": "يوجد شريك إقليمي مستعد لدعم تجربة محدودة. لم تُحدد جهة القرار ونطاق التنفيذ بعد.",
    "demoRisk4": "قد تفرض الشراكة غير المقدرة التزامات كوادر خفية. تُرسم الصلاحيات والمبادرات قبل الوعد بالتنفيذ.",
    "demoPilot": "تجربة شراكة إقليمية",
    "demoPilotDecision": "مختار مشروطًا لتحديد النطاق فقط. لم تُرسم الصلاحيات والمبادرات بعد، ولا يعني الاختيار التزامًا بالتمويل.",
    "demoPilotOutcome": "اختبار شراكة تعلم إقليمية واحدة بحلول 2029، مشروطة بالأدلة والصلاحية وخطة مقدرة التكاليف.",
    "demoPilotWhy": "البناء على علاقات الجامعة القائمة مع أصحاب العمل.",
    "demoPilotTradeoff": "تأجيل التوسع حتى مراجعة قرار التجربة.",
    "demoPilotOwner": "فريق الشراكات الافتراضي",
    "demoScoreNote": "حكم توضيحي لورشة افتراضية فقط، وليس دليلًا ميدانيًا.",
    "demoBlocker": "موافقة الشريك على تجربة التدريب",
    "demoBlockerOwner": "اللجنة التوجيهية للشريك الافتراضي",
    "demoBlockerSource": "محضر افتراضي: حُجبت الموافقة حتى الاتفاق على خطة الإشراف.",
    "demoBlockerRoute": "تقديم خطة الإشراف للجنة الشريك قبل إطلاق 2027.",
    "demoBlockerFallback": "تنفيذ اختبار داخل الجامعة؛ لا يُعلن عن فرص لدى الشريك قبل حسم الموافقة.",
    "demoReady": "فريق تنسيق التجربة داخل الجامعة",
    "demoReadySource": "محضر داخلي افتراضي بتكليف منسق التجربة.",
    "demoReadyRoute": "تفعيل المنسق بعد حسم قرار الإطلاق الخارجي."
  }
};
if(typeof module!=='undefined'&&module.exports)module.exports=messages;
else {root.SultanLocales=root.SultanLocales||{};for(const lang of ['en','ar'])Object.assign(root.SultanLocales[lang]=root.SultanLocales[lang]||{},messages[lang]);}
})(globalThis);
