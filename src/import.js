/* Normalize incomplete score entries and reject unexpected imported fields. */
(function(root){
'use strict';
const E=typeof module!=='undefined'&&module.exports?require('./engine.js'):root.Sultan;
const T=(typeof module!=='undefined'&&module.exports?require('./i18n.js'):root.SultanI18n).t;
const validate=E.validateImport;
const allowed={
 project:['schema','isDemo','revision','reviewedRevision','reviewNote','createdAt','updatedAt','institution','mandates','criteria','weightRationale','options','references','transitions','enablers','initiatives','funding','log'],
 institution:['name','sector','mission','beneficiaries','assets','context','culture','vision','notDoing','startYear','endYear'],
 criterion:['id','name','weight','low','high'],
 option:['id','title','type','outcome','whyUs','foothold','tradeoff','owner','decision','decisionReason','assumptions','risks','scores'],
 score:['value','note'],
 reference:['id','name','kind','source','purpose','context','adaptation','status'],
 transition:['id','optionId','referenceId','domain','current','currentSource','targetState','kpi','unit','direction','baseline','target','owner','dataSource','frequency','rf','history','annual'],
 annual:['year','milestone','target','evidence','actual','actualSource','observation'],
 history:['year','value','source'],
 enabler:['id','optionId','title','kind','action','control','owner','status','dueYear','source','route','fallback'],
 initiative:['id','optionId','transitionId','title','kind','owner','startYear','endYear','output','acceptance','capacity','budgetStatus','status','dependsOn','enablerIds','budget'],
 budget:['year','amount'],
 mandate:['id','title','relationship','source','contribution'],
 funding:['year','available'],
 log:['at','action','path','revision']
};
const sets=Object.fromEntries(Object.entries(allowed).map(([k,v])=>[k,new Set(v)]));
function only(obj,kind){if(!obj||typeof obj!=='object'||Array.isArray(obj))return;for(const key of Object.keys(obj))if(!sets[kind].has(key))throw Error(T('s085')+' '+key);}
function each(list,kind){if(Array.isArray(list))for(const item of list)only(item,kind);}
E.validateImport=function(raw){
 if(!raw||typeof raw!=='object'||Array.isArray(raw))return validate(raw);
 const p=JSON.parse(JSON.stringify(raw));
 only(p,'project');only(p.institution,'institution');each(p.criteria,'criterion');each(p.options,'option');each(p.references,'reference');each(p.transitions,'transition');each(p.enablers,'enabler');each(p.initiatives,'initiative');each(p.mandates,'mandate');each(p.funding,'funding');each(p.log,'log');
 if(Array.isArray(p.options))for(const o of p.options){if(o&&o.assumptions===undefined)o.assumptions='';if(o&&o.risks===undefined)o.risks='';if(!o||!o.scores||typeof o.scores!=='object'||Array.isArray(o.scores))continue;for(const [id,s] of Object.entries(o.scores)){if(!/^[A-Za-z0-9_-]{1,80}$/.test(id))throw Error(T('s085')+' '+id);only(s,'score');if(!s||typeof s!=='object'||Array.isArray(s))continue;if(s.value===undefined)s.value=null;if(s.note===undefined)s.note='';}}
 if(Array.isArray(p.transitions))for(const t of p.transitions){each(t?.annual,'annual');each(t?.history,'history');}
 if(Array.isArray(p.initiatives))for(const i of p.initiatives)each(i?.budget,'budget');
 return validate(p);
};
if(typeof module!=='undefined'&&module.exports)module.exports=E;
})(typeof globalThis!=='undefined'?globalThis:this);
