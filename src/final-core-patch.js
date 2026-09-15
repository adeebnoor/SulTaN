/* Normalize objects created by legacy in-module demo factories through the final extension schema. */
(function(root){
'use strict';
const E=root.Sultan;if(!E||!E.normalizeFinalProject)return;const baseDemo=E.demo;
E.demo=function(){
 const p=E.normalizeFinalProject(baseDemo());
 p.institution.liabilities=root.SultanI18n.language==='ar'?'التزامات تشغيلية قائمة وقدرة تنفيذية محدودة في بعض المسارات.':'Existing operating commitments and constrained execution capacity in selected paths.';
 p.options.forEach((o,i)=>{
  if(!o.riskSource&&typeof o.risks==='string'&&o.risks.trim())o.riskSource=o.risks;
  if(!o.riskSource)o.riskSource=root.SultanI18n.language==='ar'?'سجل مخاطر افتراضي — بند '+(i+1):'Fictional risk register — item '+(i+1);
  o.riskDate='2026-09-15';
  if(o.type==='moonshot'&&!o.stopEvidence)o.stopEvidence=root.SultanI18n.language==='ar'?'إيقاف المسار إذا لم يتحقق دليل القبول المحدد عند بوابة التعلم.':'Stop the path if the defined acceptance evidence is not met at the learning gate.';
  o.assumptions=(o.assumptions||[]).map((a,j)=>Object.assign(a,{expectedPersistence:a.expectedPersistence||'24 months',owner:a.owner||(root.SultanI18n.language==='ar'?'مالك الاختيار':'Choice owner'),testDate:a.testDate||'2027-06-30',testEvidence:a.testEvidence||(root.SultanI18n.language==='ar'?'دليل تحقق موثق':'Documented validation evidence'),failureImpact:a.failureImpact||(root.SultanI18n.language==='ar'?'إعادة فتح الاختيار وإعادة تخصيص الموارد':'Reopen the choice and reallocate resources')}));
 });
 p.initiatives.forEach(i=>{if(i.kind==='learn')i.budget.forEach(b=>{if(typeof b.amount==='number'&&b.amount>0&&!b.releaseEvidence)b.releaseEvidence=root.SultanI18n.language==='ar'?'تحقق دليل القبول قبل فتح الدفعة.':'Acceptance evidence verified before release.';});});
 return p;
};
})(globalThis);
