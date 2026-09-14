/* Execution upgrade localization add-on. */
(function(root){
'use strict';
root.SultanLocales=root.SultanLocales||{};
Object.assign(root.SultanLocales.en=root.SultanLocales.en||{}, {
  executionProgress:'Section exchange & progress',
  sectionExport:'Export this section',
  sectionImport:'Import / merge section',
  breakEvenTitle:'Decision switch points',
  breakEvenIntro:'Instead of counting ±5% scenarios, SULTAN estimates the nearest criterion weight at which the leading option changes while other weights are redistributed proportionally.',
  breakEvenSwitch:'new leader',
  breakEvenNone:'No ranking switch was found within the 0–100% weight range for the current complete alternatives.',
  exportNeedsWork:'Add project content before exporting a strategy.'
});
Object.assign(root.SultanLocales.ar=root.SultanLocales.ar||{}, {
  executionProgress:'تبادل القسم والتقدم',
  sectionExport:'تصدير هذا القسم',
  sectionImport:'استيراد / دمج قسم',
  breakEvenTitle:'نقاط انقلاب القرار',
  breakEvenIntro:'بدل عدّ سيناريوهات ±5٪ فقط، يقدّر سلطان أقرب وزن للمعيار ينقلب عنده الخيار المتصدر مع إعادة توزيع بقية الأوزان نسبيًا.',
  breakEvenSwitch:'المتصدر الجديد',
  breakEvenNone:'لم يظهر انقلاب في الترتيب ضمن نطاق وزن 0–100٪ للبدائل المكتملة الحالية.',
  exportNeedsWork:'أضف محتوى للمشروع قبل تصدير الاستراتيجية.'
});
})(globalThis);
