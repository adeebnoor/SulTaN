/* Post-integration correctness hardening for findings discovered after the V layer shipped.
   Loaded last so it can harden UI integration without changing the stable project schema. */
(function(root){
'use strict';
const E=root.Sultan;
if(!E)return;
const text=x=>typeof x==='string'&&x.trim().length>0;

/* final-ui memoizes check() by edit metadata. Imported projects can legitimately share
   that metadata while containing different evidence. Add a deterministic content
   fingerprint to the memoization-facing clone so correctness never depends on cache
   identity. The user's project object is not mutated. */
const cachedCheck=E.check;
function fingerprint(value){
 let s='';
 try{s=JSON.stringify(value);}catch{return 'unserializable';}
 let h=2166136261;
 for(let i=0;i<s.length;i++){h^=s.charCodeAt(i);h=Math.imul(h,16777619);}
 return (h>>>0).toString(16).padStart(8,'0');
}
E.check=function(p){
 if(!p||typeof p!=='object')return cachedCheck(p);
 const probe=Object.assign({},p,{updatedAt:String(p.updatedAt||'')+'#'+fingerprint(p)});
 return cachedCheck(probe);
};

/* Tighten the fictional teaching case: assumptions have accountable role owners,
   and liabilities name concrete commitments rather than a generic constraint. */
const baseDemo=E.demo;
if(typeof baseDemo==='function')E.demo=function(){
 const p=baseDemo(),ar=root.SultanI18n?.language==='ar';
 if(p?.institution)p.institution.liabilities=ar
  ?'التزامان تشغيليان يضغطان على التنفيذ: استمرار وحدتين منخفضتي الأثر في استهلاك موارد تشغيلية، وعدم تخصيص وقت الفرق المشتركة قبل قرار إعادة التوزيع.'
  :'Two operating commitments constrain execution: two low-impact legacy units still consume recurring resources, and cross-functional team time is not yet allocated before the redeployment decision.';
 const roles={
  differentiation:ar?'قائد البحث التطبيقي':'Applied research lead',
  moonshot:ar?'قائد الابتكار والتجارب':'Innovation and experiments lead',
  divest:ar?'مالك إعادة تخصيص الموارد':'Resource reallocation owner',
  requirement:ar?'مالك الحوكمة':'Governance owner'
 };
 for(const o of p?.options||[])for(const a of o.assumptions||[])a.owner=roles[o.type]||(text(o.owner)?o.owner:(ar?'مالك الاستراتيجية':'Strategy owner'));
 return p;
};

/* The specification names the five advisory semantic rules R1–R5. Preserve their
   existing heuristic behavior and exclusion from check(), but expose the canonical
   identifiers so reports and tests use one vocabulary. */
const baseSemantic=E.semanticIssues;
if(typeof baseSemantic==='function')E.semanticIssues=function(p){
 return baseSemantic(p).map(issue=>Object.assign({},issue,{rule:/^S[1-5]$/.test(issue.rule)?'R'+issue.rule.slice(1):issue.rule}));
};

root.SultanAuditFixes={fingerprint,cacheShield:true,demoTightened:true,semanticRuleIds:'R1-R5'};
})(globalThis);
