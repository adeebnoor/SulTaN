/* SULTAN final programmatic upgrades: resilient recovery, schema extensions and decision logic. */
(function(root){
'use strict';
const E=root.Sultan;
if(!E)return;
const T=()=>root.SultanI18n;
const KEY='sultan.strategy.builder.v0.5';
const clone=x=>JSON.parse(JSON.stringify(x));
const num=x=>typeof x==='number'&&Number.isFinite(x);
const text=x=>typeof x==='string'&&x.trim().length>0;
const normalizeRiskDate=x=>{
 if(x===null||x===undefined||x==='')return '';
 if(Number.isInteger(x)&&x>=1900&&x<=2200)return String(x)+'-01-01';
 if(typeof x!=='string')return null;const v=x.trim();
 if(/^\d{4}$/.test(v))return v+'-01-01';
 if(/^\d{4}-\d{2}$/.test(v))return v+'-01';
 if(/^\d{4}-\d{2}-\d{2}$/.test(v))return v;
 return null;
};
const SECTIONS=['identity','choices','references','priorities','enablers','roadmap','review'];
const optionDefaults=()=>({
 stopEvidence:'',riskSource:'',riskDate:'',
 divestStop:'',releasedResources:null,redeployTo:'',divestEvidence:'',divestImpact:'',
 assumptions:[]
});
const transitionDefaults=()=>({trackType:'outcome',maturityFamily:'',indicatorType:'performance'});
const collaborationDefaults=()=>({owners:Object.fromEntries(SECTIONS.map(k=>[k,''])),contributions:[]});
function normalizeAssumptions(v){
 if(Array.isArray(v))return v.map(a=>({id:String(a?.id||E.uid('asm')),text:String(a?.text||''),expectedPersistence:String(a?.expectedPersistence||''),owner:String(a?.owner||''),testDate:String(a?.testDate||''),testEvidence:String(a?.testEvidence||''),failureImpact:String(a?.failureImpact||'')}));
 if(typeof v==='string'&&v.trim())return [{id:E.uid('asm'),text:v,expectedPersistence:'',owner:'',testDate:'',testEvidence:'',failureImpact:''}];
 return [];
}
function normalizeProject(p){
 p.documentNumber=Number.isInteger(p.documentNumber)&&p.documentNumber>0?p.documentNumber:1;
 p.institution=p.institution||{};
 if(typeof p.institution.liabilities!=='string')p.institution.liabilities='';
 p.collaboration=p.collaboration&&typeof p.collaboration==='object'?p.collaboration:collaborationDefaults();
 p.collaboration.owners=p.collaboration.owners&&typeof p.collaboration.owners==='object'?p.collaboration.owners:{};
 for(const k of SECTIONS)if(typeof p.collaboration.owners[k]!=='string')p.collaboration.owners[k]='';
 if(!Array.isArray(p.collaboration.contributions))p.collaboration.contributions=[];
 p.collaboration.contributions=p.collaboration.contributions.slice(-250).map(x=>({at:String(x?.at||''),section:SECTIONS.includes(x?.section)?x.section:'review',name:String(x?.name||''),note:String(x?.note||'')}));
 for(const o of p.options||[]){for(const [k,v] of Object.entries(optionDefaults()))if(o[k]===undefined)o[k]=clone(v);o.assumptions=normalizeAssumptions(o.assumptions);const rd=normalizeRiskDate(o.riskDate);o.riskDate=rd===null?'':rd;if(o.type==='divest'&&o.releasedResources===undefined)o.releasedResources=null;}
 for(const t of p.transitions||[]){for(const [k,v] of Object.entries(transitionDefaults()))if(t[k]===undefined)t[k]=v;}
 for(const i of p.initiatives||[])for(const b of i.budget||[])if(typeof b.releaseEvidence!=='string')b.releaseEvidence='';
 return p;
}
/* Extend factories without changing the stable v0.5 base schema identifier. */
const baseBlank=E.blank,baseOption=E.option,baseTransition=E.transition,baseInitiative=E.initiative;
E.blank=function(){return normalizeProject(baseBlank());};
E.option=function(){return Object.assign(baseOption(),optionDefaults());};
E.transition=function(p){return Object.assign(baseTransition(p),transitionDefaults());};
E.initiative=function(p){const i=baseInitiative(p);for(const b of i.budget)b.releaseEvidence='';return i;};

/* Validate extension fields, temporarily remove them for the hardened base whitelist, then restore them. */
const baseValidate=E.validateImport;
function extractExtensions(raw){
 const x={documentNumber:raw?.documentNumber,institutionLiabilities:raw?.institution?.liabilities,collaboration:clone(raw?.collaboration||collaborationDefaults()),options:[],transitions:[],budgets:[]};
 for(const o of raw?.options||[])x.options.push({stopEvidence:o?.stopEvidence,riskSource:o?.riskSource,riskDate:normalizeRiskDate(o?.riskDate),divestStop:o?.divestStop,releasedResources:o?.releasedResources,redeployTo:o?.redeployTo,divestEvidence:o?.divestEvidence,divestImpact:o?.divestImpact,assumptions:clone(o?.assumptions)});
 for(const t of raw?.transitions||[])x.transitions.push({trackType:t?.trackType,maturityFamily:t?.maturityFamily,indicatorType:t?.indicatorType});
 for(const i of raw?.initiatives||[])x.budgets.push((i?.budget||[]).map(b=>b?.releaseEvidence));
 return x;
}
function cleanForBase(raw){
 const p=clone(raw);delete p.documentNumber;delete p.collaboration;if(p.institution)delete p.institution.liabilities;
 for(const o of p.options||[]){for(const k of Object.keys(optionDefaults()))delete o[k];if(o.type==='divest')o.type='differentiation';}
 for(const t of p.transitions||[]){delete t.trackType;delete t.maturityFamily;delete t.indicatorType;if(t.direction==='delta')t.direction='up';}
 for(const i of p.initiatives||[])for(const b of i.budget||[])delete b.releaseEvidence;
 return p;
}
function validateExtensionShape(raw,x){
 if(x.documentNumber!==undefined&&(!Number.isInteger(x.documentNumber)||x.documentNumber<1))throw Error('Invalid documentNumber');
 if(x.institutionLiabilities!==undefined&&typeof x.institutionLiabilities!=='string')throw Error('Invalid liabilities');
 if(raw?.collaboration!==undefined&&(!raw.collaboration||typeof raw.collaboration!=='object'||Array.isArray(raw.collaboration)))throw Error('Invalid collaboration');
 for(let i=0;i<(raw?.options||[]).length;i++){
  const o=raw.options[i],e=x.options[i]||{};
  if(!['requirement','differentiation','moonshot','divest'].includes(o.type))throw Error('Invalid option type');
  for(const k of ['stopEvidence','riskSource','divestStop','redeployTo','divestEvidence','divestImpact'])if(e[k]!==undefined&&typeof e[k]!=='string')throw Error('Invalid option '+(i+1)+' field '+k);
  if(e.riskDate===null)throw Error('Invalid option '+(i+1)+' field riskDate; use YYYY, YYYY-MM, or YYYY-MM-DD');
  if(e.releasedResources!==undefined&&e.releasedResources!==null&&(!num(e.releasedResources)||e.releasedResources<0))throw Error('Invalid releasedResources');
  if(e.assumptions!==undefined&&!Array.isArray(e.assumptions)&&typeof e.assumptions!=='string')throw Error('Invalid assumptions');
 }
 for(let i=0;i<(raw?.transitions||[]).length;i++){
  const t=raw.transitions[i],e=x.transitions[i]||{};
  if(!['up','down','qualitative','delta'].includes(t.direction))throw Error('Invalid transition direction');
  if(e.trackType!==undefined&&!['outcome','maturity'].includes(e.trackType))throw Error('Invalid trackType');
  if(e.indicatorType!==undefined&&!['performance','risk'].includes(e.indicatorType))throw Error('Invalid indicatorType');
  if(e.maturityFamily!==undefined&&typeof e.maturityFamily!=='string')throw Error('Invalid maturityFamily');
 }
 for(let i=0;i<(raw?.initiatives||[]).length;i++)for(let j=0;j<(raw.initiatives[i]?.budget||[]).length;j++){const v=x.budgets[i]?.[j];if(v!==undefined&&typeof v!=='string')throw Error('Invalid releaseEvidence');}
}
E.validateImport=function(raw){
 const x=extractExtensions(raw);validateExtensionShape(raw,x);const clean=cleanForBase(raw);const p=baseValidate(clean);
 p.documentNumber=x.documentNumber??1;p.institution.liabilities=x.institutionLiabilities??'';p.collaboration=x.collaboration;
 for(let i=0;i<p.options.length;i++)Object.assign(p.options[i],optionDefaults(),x.options[i]||{}, {type:raw.options[i].type});
 for(let i=0;i<p.transitions.length;i++)Object.assign(p.transitions[i],transitionDefaults(),x.transitions[i]||{}, {direction:raw.transitions[i].direction});
 for(let i=0;i<p.initiatives.length;i++)for(let j=0;j<p.initiatives[i].budget.length;j++)p.initiatives[i].budget[j].releaseEvidence=x.budgets[i]?.[j]??'';
 return normalizeProject(p);
};

/* Preserve extension fields when the horizon changes. */
const baseSyncYears=E.syncYears;
E.syncYears=function(p){
 const old=Object.fromEntries((p.initiatives||[]).map(i=>[i.id,Object.fromEntries((i.budget||[]).map(b=>[b.year,b.releaseEvidence||'']))]));
 baseSyncYears(p);
 for(const i of p.initiatives||[])for(const b of i.budget||[])b.releaseEvidence=old[i.id]?.[b.year]||b.releaseEvidence||'';
 return normalizeProject(p);
};

/* Delta targets remain expressed as changes from baseline; the engine derives absolute targets when comparing actuals. */
const baseProgress=E.progress;
E.absoluteTarget=function(t,row){if(t?.direction!=='delta')return row?.target;return num(t?.baseline)&&num(row?.target)?t.baseline+row.target:null;};
E.progress=function(t,row){
 if(t?.direction!=='delta')return baseProgress(t,row);
 const target=E.absoluteTarget(t,row);if(!num(t?.baseline)||!num(row?.actual)||!num(target))return null;const d=target-t.baseline;if(d===0)return null;return 100*(row.actual-t.baseline)/d;
};
E.indicatorStatus=function(t,row){
 if(!row||!num(row.actual))return 'noReading';
 let target=t?.direction==='delta'?E.absoluteTarget(t,row):row.target;if(!num(target))return 'noReading';
 const eps=Math.max(1e-9,Math.abs(target)*0.02);
 if(t?.indicatorType==='risk')return row.actual<target-eps?'ahead':row.actual>target+eps?'behind':'onTrack';
 if(t?.direction==='down')return row.actual<target-eps?'ahead':row.actual>target+eps?'behind':'onTrack';
 return row.actual>target+eps?'ahead':row.actual<target-eps?'behind':'onTrack';
};

/* Divest is a scored strategic choice; released resources are surfaced as a positive value, never as a cost. */
const baseScore=E.score,baseRanking=E.ranking;
E.score=function(p,o,weights){const r=baseScore(p,o,weights);if(o?.type==='divest')r.releasedResources=num(o.releasedResources)?o.releasedResources:null;return r;};
E.ranking=function(p,weights){return baseRanking(p,weights).map(r=>{const o=p.options.find(x=>x.id===r.id);return Object.assign(r,{releasedResources:o?.type==='divest'&&num(o.releasedResources)?o.releasedResources:null});});};

/* Additional methodological checks. */
const baseCheck=E.check;
E.check=function(p){
 const out=baseCheck(p),add=(section,level,message,entity='')=>out.push({section,level,message,entity});
 const tr=k=>{try{return T().t(k);}catch{return k;}};
 if(text(p.institution?.assets)&&!text(p.institution?.liabilities))add('identity','missing',tr('liabilityMissing'));
 for(const c of p.criteria||[])if((num(c.weight)&&(c.weight<0||c.weight>100)))add('priorities','blocking',tr('invalidBounded'),c.id);
 for(const o of p.options||[]){
  for(const s of Object.values(o.scores||{}))if(num(s?.value)&&(s.value<0||s.value>100))add('priorities','blocking',tr('invalidBounded'),o.id);
  if(o.type==='moonshot'&&o.decision==='select'&&!text(o.stopEvidence))add('choices','missing',tr('moonshotStopMissing'),o.id);
  if(o.decision==='select'&&o.type!=='requirement'&&(!text(o.riskSource)||!text(o.riskDate)))add('choices','missing',tr('riskSourceMissing'),o.id);
  if(o.type==='divest'){
   if(!text(o.divestStop)||!num(o.releasedResources)||!text(o.redeployTo)||!text(o.divestEvidence)||!text(o.divestImpact))add('choices','missing',tr('divestHelp'),o.id);
  }
  for(const a of normalizeAssumptions(o.assumptions))if(!text(a.text)||!text(a.expectedPersistence)||!text(a.owner)||!text(a.testDate)||!text(a.testEvidence)||!text(a.failureImpact))add('choices','missing',tr('assumptionIncomplete'),o.id);
 }
 for(const t of p.transitions||[]){
  if(num(t.rf)&&(t.rf<=0||t.rf>1))add('references','blocking',tr('invalidBounded'),t.id);
  if(t.trackType==='maturity'&&(!text(t.maturityFamily)||!num(t.baseline)||!num(t.target)||t.baseline<0||t.target<0||t.baseline>5||t.target>5))add('references','missing',tr('dashboardMaturity'),t.id);
  if(t.direction==='delta'&&!num(t.baseline))add('references','missing',tr('delta'),t.id);
 }
 for(const i of p.initiatives||[])if(i.kind==='learn')for(const b of i.budget||[])if(num(b.amount)&&b.amount>0&&!text(b.releaseEvidence))add('roadmap','missing',tr('learnFundingEvidenceMissing'),i.id);
 return out;
};

/* Deterministic semantic hints. These are advisory and intentionally excluded from check(). */
function words(v){return new Set(String(v||'').toLowerCase().replace(/[^\p{L}\p{N}]+/gu,' ').split(/\s+/).filter(w=>w.length>=4));}
function overlap(a,b){const A=words(a),B=words(b);let n=0;for(const w of A)if(B.has(w))n++;return n;}
E.semanticIssues=function(p){
 const hints=[],push=(rule,message,entity='')=>hints.push({level:'hint',rule,section:'review',message,entity});
 const tr=k=>{try{return T().t(k);}catch{return k;}};
 const selected=(p.options||[]).filter(o=>o.decision==='select');
 for(const t of p.transitions||[]){const r=(p.references||[]).find(x=>x.id===t.referenceId);if(t.direction!=='qualitative'&&num(t.target)&&r&&!['use','adapt'].includes(r.status))push('S5',tr('semanticS5')+' '+(t.domain||''),t.id);}
 if(text(p.institution?.notDoing)){
  const nd=p.institution.notDoing;
  for(const o of selected)if(overlap(nd,[o.title,o.outcome,o.whyUs].join(' '))>=2)push('S3',tr('semanticS3')+' '+(o.title||''),o.id);
  if(!(p.options||[]).some(o=>overlap(nd,o.tradeoff)>=2))push('S2',tr('semanticS2'));
 }
 for(let i=0;i<selected.length;i++)for(let j=i+1;j<selected.length;j++){const a=selected[i],b=selected[j],A=words(a.outcome),B=words(b.outcome);if(A.size&&B.size){let inter=0;for(const w of A)if(B.has(w))inter++;const union=new Set([...A,...B]).size;if(inter/union>=.75)push('S4',tr('semanticS4')+' '+(a.title||'')+' / '+(b.title||''),a.id);}}
 const anchor=[p.institution?.assets,p.institution?.context].join(' ');if(text(anchor))for(const o of selected.filter(x=>x.type!=='requirement'))if(text(o.whyUs)&&overlap(o.whyUs,anchor)===0)push('S1',tr('semanticS1')+' '+(o.title||''),o.id);
 return hints;
};

/* Recovery shield: if the saved draft fails validation, never expose it to the app as a writable blank project. */
(function installRecovery(){
 if(typeof window==='undefined'||typeof Storage==='undefined')return;
 const proto=Storage.prototype,nativeGet=proto.getItem,nativeSet=proto.setItem,nativeRemove=proto.removeItem;
 let raw=null,error=null;
 try{raw=nativeGet.call(localStorage,KEY);if(raw)E.validateImport(JSON.parse(raw));}catch(e){error=e;}
 const state={pending:!!(raw&&error),raw:raw||'',error:error?String(error.message||error):'',
  download(){if(!state.raw)return;const blob=new Blob([state.raw],{type:'application/json;charset=utf-8'}),url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download='SULTAN_Unrestored_Raw_Draft.json';document.body.append(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),2000);},
  startNew(){nativeRemove.call(localStorage,KEY);state.pending=false;if(root.SultanApp){const p=E.blank();E.syncYears(p);root.SultanApp.setProject(p);root.SultanApp.navigate('identity');}location.hash='#identity';},
  nativeSet:(value)=>nativeSet.call(localStorage,KEY,value)
 };
 if(state.pending){
  proto.getItem=function(k){if(this===localStorage&&k===KEY&&state.pending)return null;return nativeGet.call(this,k);};
  proto.setItem=function(k,v){if(this===localStorage&&k===KEY&&state.pending)return;return nativeSet.call(this,k,v);};
 }
 root.SultanRecovery=state;
})();

E.nextDocumentNumber=function(p){p.documentNumber=(Number.isInteger(p.documentNumber)&&p.documentNumber>0?p.documentNumber:1)+1;return p.documentNumber;};
E.recordContribution=function(p,section,name,note){normalizeProject(p);p.collaboration.contributions.push({at:new Date().toISOString(),section:SECTIONS.includes(section)?section:'review',name:String(name||''),note:String(note||'')});p.collaboration.contributions=p.collaboration.contributions.slice(-250);return p;};
E.normalizeFinalProject=normalizeProject;

/* Normalize the legacy demo factory through the final extension schema in one core layer. */
const baseDemo=E.demo;
E.demo=function(){
 const p=normalizeProject(baseDemo()),ar=root.SultanI18n.language==='ar';
 p.institution.liabilities=ar?'التزامات تشغيلية قائمة وقدرة تنفيذية محدودة في بعض المسارات.':'Existing operating commitments and constrained execution capacity in selected paths.';
 p.options.forEach((o,i)=>{
  if(!o.riskSource&&typeof o.risks==='string'&&o.risks.trim())o.riskSource=o.risks;
  if(!o.riskSource)o.riskSource=ar?'سجل مخاطر افتراضي — بند '+(i+1):'Fictional risk register — item '+(i+1);
  o.riskDate='2026-09-15';
  if(o.type==='moonshot'&&!o.stopEvidence)o.stopEvidence=ar?'إيقاف المسار إذا لم يتحقق دليل القبول المحدد عند بوابة التعلم.':'Stop the path if the defined acceptance evidence is not met at the learning gate.';
  o.assumptions=(o.assumptions||[]).map(a=>Object.assign(a,{expectedPersistence:a.expectedPersistence||'24 months',owner:a.owner||(ar?'مالك الاختيار':'Choice owner'),testDate:a.testDate||'2027-06-30',testEvidence:a.testEvidence||(ar?'دليل تحقق موثق':'Documented validation evidence'),failureImpact:a.failureImpact||(ar?'إعادة فتح الاختيار وإعادة تخصيص الموارد':'Reopen the choice and reallocate resources')}));
 });
 if(p.options[2])Object.assign(p.options[2],{
  type:'divest',decision:'select',
  title:ar?'إيقاف وحدتين منخفضتي الأثر ودمج الدعم المتكرر':'Stop two low-impact legacy units and merge duplicated support',
  outcome:ar?'تحرير موارد لإعادة توجيهها إلى تجربة الزائر ذات الأولوية':'Release resources for the priority visitor-experience strategy',
  whyUs:ar?'بيانات الاستخدام والأداء الداخلي تظهر تشتتًا وازدواجية يمكن إيقافهما':'Internal utilization and performance data show duplication that can be stopped',
  tradeoff:ar?'انتقال منظم للموظفين والخدمات المتأثرة':'Managed transition for affected staff and services',
  decisionReason:ar?'ثلاث سنوات من انخفاض الاستخدام وتكرار الوظائف':'Three years of low utilization and duplicated functions',
  divestStop:ar?'إيقاف وحدتين قديمتين ودمج خدمات الدعم المتكررة':'Stop two legacy units and merge duplicated support services',
  releasedResources:1800000,
  redeployTo:ar?'فرق تجربة الزائر والتحليلات التطبيقية':'Visitor-experience teams and applied analytics',
  divestEvidence:ar?'مراجعة أداء ثلاثية السنوات وقياس ازدواجية الخدمات':'Three-year performance review and service-duplication analysis',
  divestImpact:ar?'نقل الموظفين المتأثرين بخطة انتقال ومهارات معلنة':'Transition affected staff through a published redeployment and reskilling plan'
 });
 /* Keep the base demo's conditional no-initiative choice visible so the product still demonstrates
   that 'unknown/not declared' is different from zero cost. Add the mandatory requirement as a
   separate fifth option instead of replacing that diagnostic example. */
 const requirement=E.option();Object.assign(requirement,{
  id:'o5',type:'requirement',decision:'select',
  title:ar?'استيفاء متطلبات الحوكمة والموافقة الإلزامية':'Meet mandatory governance and consent obligations',
  outcome:ar?'تشغيل أي شراكة أو استخدام بيانات ضمن الموافقات النظامية':'Operate any partnership or data use within mandatory approvals',
  whyUs:ar?'التكليف النظامي يسبق أي توسع اختياري':'The regulatory mandate precedes discretionary expansion',
  tradeoff:ar?'قد يؤخر بعض التجارب لكنه يمنع التزامًا غير مشروع':'May slow some experiments while preventing unlawful commitments',
  owner:ar?'مالك الحوكمة':'Governance owner',
  decisionReason:ar?'متطلب واجب لا يخضع للمفاضلة':'Mandatory requirement; not a discretionary alternative'
 });
 p.options.push(requirement);
 if(p.transitions[0]){const t=p.transitions[0];t.direction='delta';t.baseline=1;t.target=5;t.targetState=ar?'من 1 إلى 6 فرق قادرة على التشغيل المشترك':'From 1 to 6 teams able to operate jointly';const ds=[1,3,4,5];t.annual.forEach((a,k)=>a.target=ds[k]??ds.at(-1));}
 const maturity=E.transition(p);Object.assign(maturity,{id:'t3',optionId:requirement.id,referenceId:p.references[0]?.id||'',domain:ar?'نضج ضوابط الحوكمة والموافقة':'Governance and consent control maturity',current:ar?'ضوابط متفرقة وغير موحدة':'Fragmented, non-standardized controls',currentSource:ar?'تقييم داخلي افتراضي':'Fictional internal assessment',targetState:ar?'ضوابط موحدة قابلة للتدقيق':'Standardized, auditable controls',kpi:ar?'مستوى النضج':'Maturity level',unit:ar?'مستوى':'level',direction:'up',baseline:2,target:4,owner:ar?'مالك الحوكمة':'Governance owner',dataSource:ar?'سجل الضوابط':'Control register',frequency:ar?'سنوي':'Annual',trackType:'maturity',maturityFamily:ar?'حوكمة البيانات والأدلة':'Data governance and evidence controls',indicatorType:'performance'});maturity.annual.forEach((a,k)=>{a.milestone=ar?'رفع نضج الضوابط تدريجيًا':'Raise control maturity progressively';a.evidence=ar?'تقييم ضوابط موثق':'Documented control assessment';a.target=[2.5,3,3.5,4][k]??4;a.actual=k===0?2.4:null;a.actualSource=k===0?(ar?'تقييم تجريبي':'Fictional assessment'):'';});
 const kri=E.transition(p);Object.assign(kri,{id:'t4',optionId:p.options[0]?.id||'o1',referenceId:p.references[0]?.id||'',domain:ar?'خطر تأخر الموافقات الخارجية':'External-approval delay risk',current:ar?'احتمال تأخر مرتفع':'High probability of delay',currentSource:ar?'سجل مخاطر افتراضي':'Fictional risk register',targetState:ar?'خطر متبقٍ منخفض ومراقب':'Low, monitored residual risk',kpi:ar?'احتمال التأخر':'Delay probability',unit:'%',direction:'down',baseline:30,target:10,owner:ar?'مالك الشراكة':'Partnership owner',dataSource:ar?'سجل المخاطر':'Risk register',frequency:ar?'ربع سنوي':'Quarterly',trackType:'outcome',maturityFamily:'',indicatorType:'risk'});kri.annual.forEach((a,k)=>{a.milestone=ar?'خفض خطر التأخر قبل الالتزام':'Reduce delay risk before commitment';a.evidence=ar?'تحديث موثق لسجل المخاطر':'Documented risk-register update';a.target=[25,20,15,10][k]??10;a.actual=k===0?28:null;a.actualSource=k===0?(ar?'قراءة افتراضية':'Fictional reading'):'';});
 p.transitions.push(maturity,kri);
 p.initiatives.forEach(i=>{if(i.kind==='learn')i.budget.forEach(b=>{if(num(b.amount)&&b.amount>0&&!b.releaseEvidence)b.releaseEvidence=ar?'تحقق دليل القبول قبل فتح الدفعة.':'Acceptance evidence verified before release.';});});
 return normalizeProject(p);
};
})(globalThis);
