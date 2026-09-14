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
  exportNeedsWork:'Add project content before exporting a strategy.'
});
Object.assign(root.SultanLocales.ar=root.SultanLocales.ar||{}, {
  executionProgress:'تبادل القسم والتقدم',sectionExport:'تصدير هذا القسم',sectionImport:'استيراد / دمج قسم',
  breakEvenTitle:'نقاط انقلاب القرار',breakEvenIntro:'بدل عدّ سيناريوهات ±5٪ فقط، يقدّر سلطان أقرب وزن للمعيار ينقلب عنده الخيار المتصدر مع إعادة توزيع بقية الأوزان نسبيًا.',breakEvenSwitch:'المتصدر الجديد',breakEvenNone:'لم يظهر انقلاب في الترتيب ضمن نطاق وزن 0–100٪ للبدائل المكتملة الحالية.',
  sensitivityLab:'مختبر الحساسية المباشر',sensitivityLabHelp:'حرّك وزن معيار واحد لترى تغير الترتيب مباشرة. يعاد توزيع بقية الأوزان نسبيًا ولا يتغير المشروع الأصلي.',
  timelineTitle:'الخط الزمني للتنفيذ',timelineHelp:'عرض بصري للمبادرات المختارة عبر أفق الاستراتيجية. هذا ترتيب سنوي وليس جدولة مهام تفصيلية.',timelineEmpty:'لا توجد مبادرات مختارة لعرضها زمنيًا بعد.',
  assumptionsLabel:'الافتراضات الرئيسة',risksLabel:'المخاطر الاستراتيجية',assumptionsHelp:'ما الذي يجب أن يكون صحيحًا كي يحقق هذا الخيار قيمته المقصودة؟',risksHelp:'ما الذي قد يقوض هذا الخيار جوهريًا حتى لو تم التنفيذ كما خُطط؟',assumptionRegister:'الافتراضات والمخاطر',
  portfolioMatrix:'عرض القيمة × الصلاحية',portfolioMatrixHelp:'عرض للنقاش فقط. القيمة الاستراتيجية تبقى منفصلة عن حسم الصلاحية ولا يُضرب أحد المحورين في الآخر.',strategicValue:'القيمة الاستراتيجية',authorityAxis:'حسم الصلاحية',
  valueFunding:'القيمة والاستثمار المعلن',declaredInvestment:'تكلفة المبادرات المعلنة',fundingState:'حالة التمويل',fundingConfirmed:'كل ميزانيات المبادرات المرتبطة مسجلة كمؤكدة',fundingMixed:'ميزانية مبادرة مرتبطة واحدة أو أكثر غير مؤكدة',
  exportNeedsWork:'أضف محتوى للمشروع قبل تصدير الاستراتيجية.'
});
})(globalThis);
