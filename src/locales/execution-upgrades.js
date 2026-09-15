/* Execution upgrade localization add-on. */
(function(root){
'use strict';
root.SultanLocales=root.SultanLocales||{};
Object.assign(root.SultanLocales.en=root.SultanLocales.en||{}, {
  executionProgress:'Section exchange & progress',sectionExport:'Export this section',sectionImport:'Import / merge section',
  breakEvenTitle:'Decision switch points',breakEvenIntro:'Instead of counting ±5% scenarios, SULTAN estimates the nearest criterion weight at which the leading option changes while other weights are redistributed proportionally.',breakEvenSwitch:'new leader',breakEvenNone:'No ranking switch was found within the 0–100% weight range for the current complete alternatives.',
  sensitivityLab:'Live sensitivity lab',sensitivityLabHelp:'Move one criterion weight to preview how the ranking changes. Other weights are redistributed proportionally; the project itself is not changed.',
  timelineTitle:'Execution timeline',timelineHelp:'A visual view of selected initiatives across the strategy horizon. This is annual sequencing, not task-level scheduling.',timelineEmpty:'No selected initiatives are available to plot yet.',
  assumptionsLabel:'Key assumptions',risksLabel:'Strategic risks',assumptionsHelp:'What must be true for this choice to create the intended value?',risksHelp:'What could materially undermine this choice even if execution follows plan?',assumptionRegister:'Assumptions & risks',
  portfolioMatrix:'Value × Authority view',portfolioMatrixHelp:'A discussion view only. Strategic value remains separate from authority clearance; neither axis multiplies the other.',strategicValue:'Strategic value',authorityAxis:'Authority clearance',
  valueFunding:'Value and declared investment',declaredInvestment:'Declared initiative cost',fundingState:'Funding status',fundingConfirmed:'all linked initiative budgets reported confirmed',fundingMixed:'one or more linked initiative budgets unconfirmed',
  criterionDirection:'Criterion direction',benefitCriterion:'Benefit — higher raw score is better',costCriterion:'Cost / burden — lower raw score is better',costCriterionHelp:'Cost criteria use 100 − raw score before weighting. Define the 0 and 100 anchors accordingly.',equalWeightsApplied:'All weights were zero, so SULTAN distributed 100% equally.',
  exportNeedsWork:'Add project content before exporting a strategy.',
  breakEvenNoSwitch:'No switch within the meaningful 0.5–99.5% range.',unplottedAuthority:'Not plotted — authority data is insufficient',unestimatedYears:'(+ %{0} unestimated year(s))',currencySAR:'SAR',
  polarityAnchorWarning:'Changing criterion direction reverses the meaning of the scale. Review and rewrite the 0 and 100 anchors before relying on the ranking. Continue?',
  externalEscalations:'External / shared decisions requiring action',internalPendingDecisions:'Internal decisions still unresolved',affectedWork:'Affected initiative / start year',
  gregorianLabel:'Gregorian',hijriLabel:'Hijri',preparedBy:'Prepared by',generatedOn:'Generated on',exportMenu:'Export',projectDataExport:'Reusable project JSON',strategyDraftExport:'Strategy draft',leadershipExport:'Leadership report',internalExport:'Internal report',escalationExport:'Escalation pack',sectionFileExport:'Section file'
});
Object.assign(root.SultanLocales.ar=root.SultanLocales.ar||{}, {
  executionProgress:'تبادل القسم والتقدم',sectionExport:'تصدير هذا القسم',sectionImport:'استيراد / دمج قسم',
  breakEvenTitle:'نقاط انقلاب القرار',breakEvenIntro:'بدل عدّ سيناريوهات ±5٪ فقط، يقدّر سلطان أقرب وزن للمعيار ينقلب عنده الخيار المتصدر مع إعادة توزيع بقية الأوزان نسبيًا.',breakEvenSwitch:'المتصدر الجديد',breakEvenNone:'لم يظهر انقلاب في الترتيب ضمن نطاق وزن 0–100٪ للبدائل المكتملة الحالية.',
  sensitivityLab:'مختبر الحساسية المباشر',sensitivityLabHelp:'حرّك وزن معيار واحد لترى تغير الترتيب مباشرة. يعاد توزيع بقية الأوزان نسبيًا ولا يتغير المشروع الأصلي.',
  timelineTitle:'الخط الزمني للتنفيذ',timelineHelp:'عرض بصري للمبادرات المختارة عبر أفق الاستراتيجية. هذا ترتيب سنوي وليس جدولة مهام تفصيلية.',timelineEmpty:'لا توجد مبادرات مختارة لعرضها زمنيًا بعد.',
  assumptionsLabel:'الافتراضات الرئيسة',risksLabel:'المخاطر الاستراتيجية',assumptionsHelp:'ما الذي يجب أن يكون صحيحًا كي يحقق هذا الخيار قيمته المقصودة؟',risksHelp:'ما الذي قد يقوض هذا الخيار جوهريًا حتى لو تم التنفيذ كما خُطط؟',assumptionRegister:'الافتراضات والمخاطر',
  portfolioMatrix:'عرض القيمة × الصلاحية',portfolioMatrixHelp:'عرض للنقاش فقط. القيمة الاستراتيجية تبقى منفصلة عن حسم الصلاحية ولا يُضرب أحد المحورين في الآخر.',strategicValue:'القيمة الاستراتيجية',authorityAxis:'حسم الصلاحية',
  valueFunding:'القيمة والاستثمار المعلن',declaredInvestment:'تكلفة المبادرات المعلنة',fundingState:'حالة التمويل',fundingConfirmed:'كل ميزانيات المبادرات المرتبطة مسجلة كمؤكدة',fundingMixed:'ميزانية مبادرة مرتبطة واحدة أو أكثر غير مؤكدة',
  criterionDirection:'اتجاه المعيار',benefitCriterion:'منفعة — الدرجة الخام الأعلى أفضل',costCriterion:'تكلفة / عبء — الدرجة الخام الأقل أفضل',costCriterionHelp:'في معيار التكلفة يستخدم سلطان 100 − الدرجة الخام قبل الوزن. عرّف مرساتي 0 و100 على هذا الأساس.',equalWeightsApplied:'كانت جميع الأوزان صفرًا، لذلك وزّع سلطان 100٪ بالتساوي.',
  exportNeedsWork:'أضف محتوى للمشروع قبل تصدير الاستراتيجية.',
  breakEvenNoSwitch:'لا يوجد انقلاب ضمن المدى ذي المعنى 0.5–99.5٪.',unplottedAuthority:'غير مرسوم — بيانات الصلاحية غير كافية',unestimatedYears:'(+ %{0} سنة/سنوات غير مقدّرة)',currencySAR:'ريال',
  polarityAnchorWarning:'تغيير اتجاه المعيار يعكس معنى المقياس. راجع وأعد صياغة مرساتي 0 و100 قبل الاعتماد على الترتيب. هل تريد المتابعة؟',
  externalEscalations:'قرارات خارجية / مشتركة تتطلب إجراء',internalPendingDecisions:'قرارات داخلية لم تُحسم بعد',affectedWork:'المبادرة / سنة البدء المتأثرة',
  gregorianLabel:'ميلادي',hijriLabel:'هجري',preparedBy:'أُعد بواسطة',generatedOn:'تاريخ الإنشاء',exportMenu:'تصدير',projectDataExport:'ملف مشروع قابل للاستكمال',strategyDraftExport:'مسودة الاستراتيجية',leadershipExport:'تقرير القيادة',internalExport:'التقرير الداخلي',escalationExport:'حزمة التصعيد',sectionFileExport:'ملف القسم'
});
Object.assign(root.SultanLocales.en,{
  "noInitiatives": "No initiatives declared",
  "fundingNotApplicable": "Not assessed — no linked initiatives",
  "costUnestimated": "Cost not yet estimated",
  "revisionLabel": "Revision",
  "printInternal": "Print / PDF — internal report",
  "printPopupBlocked": "Allow the report window, then try printing again.",
  "internalExport": "Internal strategy — details & issues",
  "leadershipExport": "Leadership strategy — presentation",
  "matrixLowLow": "Lower value · lower clearance",
  "matrixHighLow": "Higher value · lower clearance",
  "matrixLowHigh": "Lower value · higher clearance",
  "matrixHighHigh": "Higher value · higher clearance",
  "matrixGuide": "Axes run from 0 to 100. Midlines at 50 are visual guides, not approval thresholds. Higher strategic value is to the right; higher clearance is up. Unmapped choices stay outside the chart.",
  "valueDirection": "Higher value →",
  "authorityDirection": "Higher clearance ↑",
  "unplottedAuthority": "Not plotted — value or authority data is insufficient"
});
Object.assign(root.SultanLocales.ar,{
  "noInitiatives": "لم تُعلن مبادرات",
  "fundingNotApplicable": "لم يُقيّم التمويل — لا توجد مبادرات مرتبطة",
  "costUnestimated": "لم تُقدّر التكلفة بعد",
  "revisionLabel": "النسخة",
  "printInternal": "طباعة / PDF — النسخة الداخلية",
  "printPopupBlocked": "اسمح بفتح نافذة التقرير، ثم أعد الطباعة.",
  "internalExport": "استراتيجية داخلية — التفاصيل والملاحظات",
  "leadershipExport": "استراتيجية للقيادة — للعرض",
  "matrixLowLow": "قيمة أقل · حسم أقل",
  "matrixHighLow": "قيمة أعلى · حسم أقل",
  "matrixLowHigh": "قيمة أقل · حسم أعلى",
  "matrixHighHigh": "قيمة أعلى · حسم أعلى",
  "matrixGuide": "يمتد كل محور من 0 إلى 100. خطا المنتصف عند 50 دليل بصري وليسا عتبة اعتماد. القيمة الأعلى إلى اليسار، والحسم الأعلى إلى الأعلى. تبقى الخيارات غير المرسومة خارج المصفوفة.",
  "valueDirection": "← قيمة أعلى",
  "authorityDirection": "حسم أعلى ↑",
  "unplottedAuthority": "غير مرسوم — بيانات القيمة أو الصلاحية غير كافية"
});
})(globalThis);
