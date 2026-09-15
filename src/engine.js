(function(root){
'use strict';
const T=(typeof module!=="undefined"&&module.exports?require('./i18n.js'):globalThis.SultanI18n).t;
const SCHEMA='sultan.strategy.v0.5';
const clone=x=>JSON.parse(JSON.stringify(x));
const num=x=>typeof x==='number'&&Number.isFinite(x);
const text=x=>typeof x==='string'&&x.trim().length>0;
const uid=p=>(p||'id')+'_'+(typeof crypto!=='undefined'&&crypto.randomUUID?crypto.randomUUID().slice(0,8):Math.random().toString(36).slice(2,10));
function years(p){const a=p.institution.startYear,b=p.institution.endYear;return Number.isInteger(a)&&Number.isInteger(b)&&b>=a&&b-a<=15?Array.from({length:b-a+1},(_,i)=>a+i):[];}
function criteria(){return [
 {id:'identity',name:T('s000'),weight:25,low:T('s001'),high:T('s002')},
 {id:'benefit',name:T('s003'),weight:35,low:T('s004'),high:T('s005')},
 {id:'distinct',name:T('s006'),weight:25,low:T('s007'),high:T('s008')},
 {id:'sustain',name:T('s009'),weight:15,low:T('s010'),high:T('s011')}
];}
function blank(){return {schema:SCHEMA,isDemo:false,revision:0,reviewedRevision:null,reviewNote:'',createdAt:new Date().toISOString(),updatedAt:new Date().toISOString(),institution:{name:'',sector:'',mission:'',beneficiaries:'',assets:'',context:'',culture:'',vision:'',notDoing:'',startYear:2027,endYear:2030},mandates:[],criteria:criteria(),weightRationale:'',options:[],references:[],transitions:[],enablers:[],initiatives:[],funding:[],log:[]};}
function option(){return {id:uid('opt'),title:'',type:'differentiation',outcome:'',whyUs:'',foothold:'',tradeoff:'',owner:'',decision:'consider',decisionReason:'',scores:{}};}
function reference(){return {id:uid('ref'),name:'',kind:'benchmark',source:'',purpose:'',context:'',adaptation:'',status:'unchecked'};}
function transition(p){return {id:uid('tr'),optionId:'',referenceId:'',domain:'',current:'',currentSource:'',targetState:'',kpi:'',unit:'',direction:'up',baseline:null,target:null,owner:'',dataSource:'',frequency:T('s012'),rf:0.75,history:[],annual:years(p).map(year=>({year,milestone:'',target:null,evidence:'',actual:null,actualSource:'',observation:''}))};}
function enabler(){return {id:uid('en'),optionId:'',title:'',kind:'capability',action:'add',control:'unknown',owner:'',status:'unknown',dueYear:null,source:'',route:'',fallback:''};}
function initiative(p){return {id:uid('in'),optionId:'',transitionId:'',title:'',kind:'build',owner:'',startYear:p.institution.startYear,endYear:p.institution.startYear,output:'',acceptance:'',capacity:'',budgetStatus:'unconfirmed',status:'design',dependsOn:[],enablerIds:[],budget:years(p).map(year=>({year,amount:null}))};}
function weightInfo(p){const vals=p.criteria.map(c=>c.weight);const sum=vals.reduce((a,b)=>a+(num(b)?b:0),0);return {sum,valid:vals.length>0&&vals.every(v=>num(v)&&v>=0&&v<=100)&&Math.abs(sum-100)<1e-6};}
function normalizedCriterion(c,x){return c.polarity==='cost'?100-x:x;}
function score(p,o,weights){const wi=weightInfo(p);if(!wi.valid&&!weights)return {value:null,low:null,high:null,coverage:0,reason:'weights'};if(weights){const ws=p.criteria.map(c=>weights[c.id]);if(!ws.every(w=>num(w)&&w>=0&&w<=100)||Math.abs(ws.reduce((a,b)=>a+b,0)-100)>1e-6)return {value:null,low:null,high:null,coverage:0,reason:'weights'};}let low=0,missing=0,coverage=0;for(const c of p.criteria){const w=weights?weights[c.id]:c.weight;const x=o.scores[c.id]?.value;if(num(x)&&x>=0&&x<=100){low+=w*normalizedCriterion(c,x)/100;coverage+=w;}else missing+=w;}return {value:missing>1e-8?null:low,low,high:low+missing,coverage,reason:missing?'incomplete':''};}
function ranking(p,weights){return p.options.filter(o=>o.type!=='requirement').map(o=>({id:o.id,title:o.title,...score(p,o,weights)})).filter(o=>o.value!==null).sort((a,b)=>b.value-a.value||a.id.localeCompare(b.id));}
function sensitivity(p){if(!weightInfo(p).valid)return {base:[],trials:[],switches:0};const base=ranking(p);if(base.length<2)return {base,trials:[],switches:0};const top=r=>r.length?r.filter(x=>Math.abs(x.value-r[0].value)<1e-7).map(x=>x.id).sort().join(','):'';let trials=[];for(const c of p.criteria){for(const delta of [-5,5]){const nw=c.weight+delta,remaining=100-c.weight;if(nw<0||nw>100||remaining<=0)continue;const w={};for(const k of p.criteria)w[k.id]=k.id===c.id?nw:k.weight*(100-nw)/remaining;const r=ranking(p,w);if(!r.length)continue;trials.push({criterion:c.name,delta,top:r.filter(x=>Math.abs(x.value-r[0].value)<1e-7).map(x=>x.title),changed:top(r)!==top(base)});}}return {base,trials,switches:trials.filter(t=>t.changed).length};}
function rankingAt(p,criterionId,w){const c=p.criteria.find(x=>x.id===criterionId);if(!c||!num(w)||w<0||w>100)return [];const others=p.criteria.filter(k=>k.id!==criterionId),baseOther=others.reduce((a,k)=>a+k.weight,0),weights={};weights[criterionId]=w;if(!others.length)return ranking(p,weights);if(baseOther<=0){const each=(100-w)/others.length;for(const k of others)weights[k.id]=each;}else for(const k of others)weights[k.id]=k.weight*(100-w)/baseOther;return ranking(p,weights);}
function topKey(r){return r.length?r.filter(x=>Math.abs(x.value-r[0].value)<1e-7).map(x=>x.id).sort().join(','):'';}
function breakEven(p){const base=ranking(p);if(base.length<2||!weightInfo(p).valid)return [];const baseTop=topKey(base);return p.criteria.map(c=>{let best=null;for(let n=1;n<200;n++){const w=n/2;if(w<=0||w>=100)continue;const r=rankingAt(p,c.id,w);if(!r.length||topKey(r)===baseTop)continue;const d=Math.abs(w-c.weight);if(!best||d<best.distance)best={criterionId:c.id,criterion:c.name,current:c.weight,threshold:w,distance:d,newTop:r[0].title};}return best||{criterionId:c.id,criterion:c.name,current:c.weight,threshold:null,distance:null,newTop:null};});}
function historySummary(t){if(!num(t.rf)||t.rf<=0||t.rf>1)return {value:null,error:T('s013')};const all=t.history||[];const valid=all.filter(h=>Number.isInteger(h.year)&&num(h.value));if(!valid.length)return {value:null,count:0,missing:all.length,latest:null};if(new Set(valid.map(h=>h.year)).size!==valid.length)return {value:null,error:T('s014')};const latest=Math.max(...valid.map(h=>h.year));let w=0,v=0;for(const h of valid){const a=Math.pow(t.rf,latest-h.year);w+=a;v+=a*h.value;}return {value:v/w,count:valid.length,missing:all.length-valid.length,latest,unreferenced:valid.filter(h=>!text(h.source)).length};}
function progress(t,row){if(!num(t.baseline)||!num(row?.actual)||!num(row?.target)||t.direction==='qualitative')return null;const d=row.target-t.baseline;if(d===0)return null;return 100*(row.actual-t.baseline)/d;}
function selected(p){return p.options.filter(o=>o.decision==='select');}
function selectedInitiatives(p){const ids=new Set(selected(p).map(o=>o.id));return p.initiatives.filter(i=>ids.has(i.optionId));}
function budgetSummary(p){const ins=selectedInitiatives(p);return years(p).map(year=>{let declared=0,unknown=0;for(const i of ins){if(year<i.startYear||year>i.endYear)continue;const b=i.budget.find(b=>b.year===year);if(num(b?.amount))declared+=b.amount;else unknown++;}const cap=p.funding.find(f=>f.year===year)?.available;return {year,declared,unknown,available:num(cap)?cap:null,gap:num(cap)?Math.max(0,declared-cap):null};});}
function choiceCost(p,optionId){
 const ins=p.initiatives.filter(i=>i.optionId===optionId);
 if(!ins.length)return {total:null,known:0,unknown:0,confirmed:null,count:0,state:'no-initiatives'};
 let total=0,known=0,unknown=0;
 for(const i of ins)for(const year of years(p)){
  if(year<i.startYear||year>i.endYear)continue;
  const amount=i.budget.find(b=>b.year===year)?.amount;
  if(num(amount)){total+=amount;known++;}else unknown++;
 }
 const confirmed=ins.every(i=>i.budgetStatus==='confirmed');
 return {total,known,unknown,confirmed,count:ins.length,state:confirmed?'confirmed':'unconfirmed'};
}
function cycles(p){const ids=new Set(p.initiatives.map(i=>i.id));const map=Object.fromEntries(p.initiatives.map(i=>[i.id,i.dependsOn.filter(x=>ids.has(x))]));const on=new Set(),done=new Set(),out=[];function visit(x,path){if(on.has(x)){out.push([...path,x]);return;}if(done.has(x))return;on.add(x);for(const d of map[x]||[])visit(d,[...path,x]);on.delete(x);done.add(x);}for(const id of ids)visit(id,[]);return out;}
function authorityIssues(p){const selectedSet=new Set(selected(p).map(o=>o.id)),out=[];for(const e of p.enablers){if(!selectedSet.has(e.optionId))continue;if(e.control==='unknown')out.push({section:'enablers',level:'missing',code:'authorityIssueUnknownControl',entity:e.id,title:e.title||''});if(e.status==='unknown')out.push({section:'enablers',level:'missing',code:'authorityIssueUnknownStatus',entity:e.id,title:e.title||''});if(e.status==='pending')out.push({section:'enablers',level:'warning',code:'authorityIssuePending',entity:e.id,title:e.title||''});if(e.status==='blocked')out.push({section:'enablers',level:'blocking',code:'authorityIssueBlocked',entity:e.id,title:e.title||''});}return out;}
function check(p){
 const out=[];const add=(section,level,message,entity='')=>out.push({section,level,message,entity});const I=p.institution;
 for(const [k,label] of [['name',T('s015')],['mission',T('s016')],['beneficiaries',T('s017')],['assets',T('s018')],['context',T('s019')],['culture',T('s020')],['vision',T('s021')]])if(!text(I[k]))add('identity','missing',T('s022')+label+'.');
 if(!years(p).length)add('identity','blocking',T('s023'));
 for(const m of p.mandates)if(!text(m.source)||m.relationship==='unknown')add('identity','missing',T('s024')+(m.title||T('s025')),m.id);
 if(!p.options.length)add('choices','missing',T('s026'));
 for(const o of p.options){if(!text(o.title)||!text(o.outcome)||!text(o.whyUs)||!text(o.tradeoff))add('choices','missing',T('s027')+(o.title||T('s028')),o.id);if(o.type==='moonshot'&&!text(o.foothold))add('choices','missing',T('s029')+(o.title||''),o.id);if(o.decision!=='consider'&&!text(o.decisionReason))add('choices','missing',T('s030')+(o.title||T('s031')),o.id);if(o.type==='requirement'&&o.decision!=='select')add('choices','warning',T('s032')+(o.title||''),o.id);}
 if(!weightInfo(p).valid)add('priorities','blocking',T('s033'));
 if(!selected(p).length)add('choices','missing',T('s034'));
 for(const c of p.criteria)if(!text(c.name)||!text(c.low)||!text(c.high))add('priorities','missing',T('s035')+(c.name||T('s036')),c.id);
 if(!text(p.weightRationale))add('priorities','missing',T('s037'));
 for(const o of p.options.filter(o=>o.type!=='requirement')){if(score(p,o).reason==='incomplete')add('priorities','missing',T('s038')+(o.title||T('s028')),o.id);for(const c of p.criteria){const s=o.scores[c.id];if(num(s?.value)&&c.weight>0&&!text(s.note))add('priorities','missing',T('s039')+c.name+T('s040')+(o.title||'')+'».',o.id);}}
 for(const r of p.references){if(r.status==='unchecked')add('references','missing',T('s041')+(r.name||T('s042')),r.id);if(['use','adapt'].includes(r.status)&&!text(r.context))add('references','missing',T('s043')+(r.name||''),r.id);if(!text(r.source)||!text(r.purpose))add('references','missing',T('s044')+(r.name||''),r.id);if(r.status==='adapt'&&!text(r.adaptation))add('references','missing',T('s045')+r.name,r.id);}
 const optIds=new Set(p.options.map(o=>o.id));const trIds=new Set(p.transitions.map(t=>t.id));const inMap=Object.fromEntries(p.initiatives.map(i=>[i.id,i]));const enMap=Object.fromEntries(p.enablers.map(e=>[e.id,e]));
 for(const t of p.transitions){
  if(!optIds.has(t.optionId))add('references','blocking',T('s046')+(t.domain||T('s047')),t.id);
  if(!text(t.current)||!text(t.currentSource)||!text(t.targetState))add('references','missing',T('s048')+(t.domain||''),t.id);
  const r=p.references.find(r=>r.id===t.referenceId);if(!r)add('references','missing',T('s049')+(t.domain||''),t.id);else if(r.status==='notApplicable')add('references','blocking',T('s050')+(t.domain||''),t.id);
  if(!text(t.kpi)||!text(t.dataSource)||!text(t.owner))add('references','missing',T('s051')+(t.domain||''),t.id);
  if(t.direction!=='qualitative'&&(!num(t.baseline)||!num(t.target)))add('references','missing',T('s052')+t.domain,t.id);
  if(num(t.baseline)&&num(t.target)&&((t.direction==='up'&&t.target<t.baseline)||(t.direction==='down'&&t.target>t.baseline)))add('references','blocking',T('s053')+t.domain,t.id);
  if(t.annual.some(a=>!text(a.milestone)||!text(a.evidence)||(t.direction!=='qualitative'&&!num(a.target))))add('references','missing',T('s054')+t.domain,t.id);
  const last=t.annual.find(a=>a.year===I.endYear);if(t.direction!=='qualitative'&&num(last?.target)&&num(t.target)&&Math.abs(last.target-t.target)>1e-8)add('references','warning',T('s055')+t.domain,t.id);
  if(t.annual.some(a=>num(a.actual)&&!text(a.actualSource)))add('review','missing',T('s056')+t.domain,t.id);
  const h=historySummary(t);if(h.error)add('references','blocking',h.error+' '+t.domain,t.id);
 }
 for(const o of selected(p))if(!p.transitions.some(t=>t.optionId===o.id))add('references','missing',T('s057')+o.title,o.id);
 for(const e of p.enablers){if(!optIds.has(e.optionId))add('enablers','blocking',T('s058')+(e.title||''),e.id);if(!text(e.owner)||!text(e.source)||!text(e.route))add('enablers','missing',T('s059')+(e.title||''),e.id);if(e.control!=='internal'&&!text(e.fallback))add('enablers','missing',T('s060')+e.title,e.id);}
 for(const issue of authorityIssues(p))add(issue.section,issue.level,T(issue.code)+(issue.title||T('s395')),issue.entity);
 for(const i of p.initiatives){
  if(!optIds.has(i.optionId))add('roadmap','blocking',T('s061')+(i.title||''),i.id);
  if(!trIds.has(i.transitionId))add('roadmap','missing',T('s062')+(i.title||''),i.id);else if(p.transitions.find(t=>t.id===i.transitionId).optionId!==i.optionId)add('roadmap','blocking',T('s063')+i.title,i.id);
  if(i.endYear<i.startYear||i.startYear<I.startYear||i.endYear>I.endYear)add('roadmap','blocking',T('s064')+i.title,i.id);
  if(!text(i.owner)||!text(i.output)||!text(i.acceptance)||!text(i.capacity))add('roadmap','missing',T('s065')+i.title,i.id);
  if(i.budgetStatus!=='confirmed')add('roadmap','warning',T('s066')+i.title,i.id);
  for(const d of i.dependsOn){if(!inMap[d])add('roadmap','blocking',T('s067')+i.title,i.id);else if(inMap[d].endYear>=i.startYear)add('roadmap','warning',T('s068')+i.title+T('s069')+inMap[d].title+T('s070'),i.id);}
  for(const id of i.enablerIds){const e=enMap[id];if(!e)add('roadmap','blocking',T('s071')+i.title,i.id);else{if(e.status!=='ready')add('roadmap',e.status==='blocked'?'blocking':'warning',T('s072')+i.title+T('s073')+e.title+'».',i.id);if(num(e.dueYear)&&e.dueYear>i.startYear)add('roadmap','warning',T('s074')+i.title,i.id);}}
  if(i.budget.some(b=>(b.year<i.startYear||b.year>i.endYear)&&num(b.amount)&&b.amount>0))add('roadmap','warning',T('s075')+i.title,i.id);
 }
 if(cycles(p).length)add('roadmap','blocking',T('s076'));
 for(const b of budgetSummary(p)){if(b.unknown)add('roadmap','missing',T('s077')+b.year+T('s078')+b.unknown+T('s079'));if(b.gap>0)add('roadmap','warning',T('s080')+b.year+T('s081')+b.gap.toLocaleString('en-US')+'.');}
 return out;
}
function syncYears(p){const ys=years(p);if(!ys.length)return;for(const t of p.transitions)t.annual=ys.map(year=>t.annual.find(a=>a.year===year)||{year,milestone:'',target:null,evidence:'',actual:null,actualSource:'',observation:''});for(const i of p.initiatives)i.budget=ys.map(year=>i.budget.find(b=>b.year===year)||{year,amount:null});p.funding=ys.map(year=>p.funding.find(f=>f.year===year)||{year,available:null});}
function validateImport(raw){
 if(!raw||typeof raw!=='object'||Array.isArray(raw))throw Error(T('s082'));
 let nodes=0;function scan(v,depth){if(++nodes>160000||depth>12)throw Error(T('s083'));if(typeof v==='string'&&v.length>24000)throw Error(T('s084'));if(v&&typeof v==='object')for(const k of Object.keys(v)){if(['__proto__','prototype','constructor'].includes(k))throw Error(T('s085'));scan(v[k],depth+1);}}scan(raw,0);
 if(raw.schema!==SCHEMA)throw Error(T('s086'));
 const p=clone(raw),b=blank();if(typeof p.isDemo!=='boolean')throw Error(T('s087'));
 if(!p.institution||typeof p.institution!=='object')throw Error(T('s088'));for(const k of Object.keys(b.institution))if(typeof p.institution[k]!==typeof b.institution[k])throw Error(T('s089')+k);if(!years(p).length)throw Error(T('s090'));
 for(const k of ['criteria','options','references','transitions','enablers','initiatives','mandates','funding','log'])if(!Array.isArray(p[k])||p[k].length>(k==='log'?1000:250))throw Error(T('s091')+k);
 const ids=new Set();for(const k of ['criteria','options','references','transitions','enablers','initiatives','mandates'])for(const obj of p[k]){if(!obj||!text(obj.id)||!/^[A-Za-z0-9_-]{1,80}$/.test(obj.id)||ids.has(obj.id))throw Error(T('s092'));ids.add(obj.id);}
 const field=(x,k,type,allowNull=false)=>{if(!x||typeof x!=='object')throw Error(T('s093'));if(allowNull&&x[k]===null)return;if(type==='number'?!num(x[k]):typeof x[k]!==type)throw Error(T('s094')+k);};
 for(const c of p.criteria){for(const k of ['name','low','high'])field(c,k,'string');field(c,'weight','number',true);if(num(c.weight)&&(c.weight<0||c.weight>100))throw Error(T('s095'));}
 for(const o of p.options){for(const k of ['title','type','outcome','whyUs','foothold','tradeoff','owner','decision','decisionReason'])field(o,k,'string');if(!['requirement','differentiation','moonshot'].includes(o.type)||!['consider','select','defer','reject'].includes(o.decision))throw Error(T('s096'));if(!o.scores||typeof o.scores!=='object'||Array.isArray(o.scores))throw Error(T('s097'));for(const s of Object.values(o.scores)){field(s,'value','number',true);field(s,'note','string');if(num(s.value)&&(s.value<0||s.value>100))throw Error(T('s098'));}}
 for(const r of p.references){for(const k of ['name','kind','source','purpose','context','adaptation','status'])field(r,k,'string');if(!['framework','benchmark','accreditation','internal'].includes(r.kind))throw Error(T('s099'));if(!['unchecked','use','adapt','notApplicable'].includes(r.status))throw Error(T('s100'));}
 for(const t of p.transitions){for(const k of ['optionId','referenceId','domain','current','currentSource','targetState','kpi','unit','direction','owner','dataSource','frequency'])field(t,k,'string');for(const k of ['baseline','target'])field(t,k,'number',true);field(t,'rf','number');if(t.rf<=0||t.rf>1)throw Error(T('s101'));if(!['up','down','qualitative'].includes(t.direction))throw Error(T('s102'));if(!Array.isArray(t.annual)||t.annual.length>16||!Array.isArray(t.history)||t.history.length>100)throw Error(T('s103'));if(new Set(t.annual.map(a=>a?.year)).size!==t.annual.length)throw Error(T('s104'));for(const a of t.annual){field(a,'year','number');if(!Number.isInteger(a.year)||!years(p).includes(a.year))throw Error(T('s105'));for(const k of ['target','actual'])field(a,k,'number',true);for(const k of ['milestone','evidence','actualSource','observation'])field(a,k,'string');}for(const h of t.history){field(h,'year','number',true);if(h.year!==null&&!Number.isInteger(h.year))throw Error(T('s106'));field(h,'value','number',true);field(h,'source','string');}}
 for(const e of p.enablers){for(const k of ['optionId','title','kind','action','control','owner','status','source','route','fallback'])field(e,k,'string');field(e,'dueYear','number',true);if(e.dueYear!==null&&!Number.isInteger(e.dueYear))throw Error(T('s107'));if(!['legislation','authority','capability','culture','operating'].includes(e.kind)||!['keep','activate','amend','add','remove'].includes(e.action))throw Error(T('s108'));if(!['ready','pending','blocked','unknown'].includes(e.status)||!['internal','external','shared','unknown'].includes(e.control))throw Error(T('s109'));}
 for(const i of p.initiatives){for(const k of ['optionId','transitionId','title','kind','owner','output','acceptance','capacity','budgetStatus','status'])field(i,k,'string');for(const k of ['startYear','endYear']){field(i,k,'number');if(!Number.isInteger(i[k]))throw Error(T('s110'));}if(!['learn','build','deliver'].includes(i.kind)||!['unconfirmed','confirmed'].includes(i.budgetStatus)||!['design','active','done'].includes(i.status))throw Error(T('s111'));if(!Array.isArray(i.budget)||i.budget.length>16||!Array.isArray(i.dependsOn)||!Array.isArray(i.enablerIds))throw Error(T('s112'));if(new Set(i.budget.map(b=>b?.year)).size!==i.budget.length)throw Error(T('s113'));for(const b of i.budget){field(b,'year','number');if(!Number.isInteger(b.year)||!years(p).includes(b.year))throw Error(T('s114'));field(b,'amount','number',true);if(num(b.amount)&&b.amount<0)throw Error(T('s115'));}if(![...i.dependsOn,...i.enablerIds].every(x=>typeof x==='string'))throw Error(T('s116'));}
 for(const m of p.mandates){for(const k of ['title','relationship','source','contribution'])field(m,k,'string');if(!['mandatory','contribution','outside','unknown'].includes(m.relationship))throw Error(T('s117'));}
 if(new Set(p.funding.map(f=>f?.year)).size!==p.funding.length)throw Error(T('s118'));for(const f of p.funding){field(f,'year','number');if(!Number.isInteger(f.year)||!years(p).includes(f.year))throw Error(T('s119'));field(f,'available','number',true);if(num(f.available)&&f.available<0)throw Error(T('s120'));}
 for(const l of p.log){if(!l||typeof l!=='object'||typeof l.at!=='string'||typeof l.action!=='string'||typeof l.path!=='string')throw Error(T('s121'));}
 for(const k of ['weightRationale','reviewNote','createdAt','updatedAt'])field(p,k,'string');if(!Number.isInteger(p.revision)||p.revision<0)throw Error(T('s122'));p.reviewedRevision=null;return p;
}
function demo(){
 const p=blank();p.isDemo=true;
 const D=typeof module!=='undefined'&&module.exports?require('./locales/demo.js').en:root.SultanLocales[root.SultanI18n.language];
 Object.assign(p.institution,{name:T('s123'),sector:T('s124'),mission:T('s125'),beneficiaries:T('s126'),assets:T('s127'),context:T('s128'),culture:T('s129'),vision:T('s130'),notDoing:T('s131')});
 p.weightRationale=T('s132');
 p.mandates=[{id:'m1',title:T('s133'),relationship:'contribution',source:T('s134'),contribution:T('s135')}];
 const titles=[T('s136'),T('s137'),T('s138')];
 p.options=titles.map((title,k)=>({...option(),id:'o'+(k+1),title,type:k===1?'moonshot':'differentiation',outcome:k===0?T('s139'):k===1?T('s140'):T('s141'),whyUs:k===2?T('s142'):T('s143'),foothold:k===1?T('s144'):'',tradeoff:k===2?T('s145'):T('s146'),owner:T('s147'),decision:k===2?'defer':'select',decisionReason:k===2?T('s148'):k===1?T('s149'):T('s150'),scores:Object.fromEntries(p.criteria.map((c,x)=>[c.id,{value:[[90,80,85,75],[90,95,95,65],[55,65,40,60]][k][x],note:T('s151')}]))}));
 p.references=[{id:'r1',name:T('s152'),kind:'internal',source:T('s153'),purpose:T('s154'),context:T('s155'),adaptation:'',status:'use'},{id:'r2',name:T('s156'),kind:'benchmark',source:T('s157'),purpose:T('s158'),context:T('s159'),adaptation:T('s160'),status:'unchecked'}];
 const t1=transition(p);Object.assign(t1,{id:'t1',optionId:'o1',referenceId:'r1',domain:T('s161'),current:T('s162'),currentSource:T('s163'),targetState:T('s164'),kpi:T('s165'),unit:T('s166'),baseline:1,target:6,owner:T('s167'),dataSource:T('s168'),history:[{year:2024,value:0,source:T('s169')},{year:2025,value:1,source:T('s169')},{year:2026,value:1,source:T('s169')}]});
 t1.annual=t1.annual.map((a,k)=>({...a,milestone:[T('s170'),T('s171'),T('s172'),T('s173')][k],target:[2,4,5,6][k],evidence:T('s174'),actual:k===0?1:null,actualSource:k===0?T('s175'):'',observation:''}));
 const t2=transition(p);Object.assign(t2,{id:'t2',optionId:'o2',referenceId:'r1',domain:T('s176'),direction:'qualitative',current:T('s177'),currentSource:T('s178'),targetState:T('s179'),kpi:T('s180'),unit:T('s181'),owner:T('s182'),dataSource:T('s183')});
 t2.annual=t2.annual.map((a,k)=>({...a,milestone:[T('s184'),T('s185'),T('s186'),T('s187')][k],evidence:T('s188')}));p.transitions=[t1,t2];
 p.enablers=[{...enabler(),id:'e1',optionId:'o1',title:T('s189'),kind:'operating',action:'amend',control:'internal',owner:T('s190'),status:'pending',dueYear:2027,source:T('s191'),route:T('s192'),fallback:T('s193')},{...enabler(),id:'e2',optionId:'o2',title:T('s194'),kind:'authority',action:'activate',control:'external',owner:T('s195'),status:'unknown',dueYear:2028,source:T('s196'),route:T('s197'),fallback:T('s198')}];
 const make=(id,opt,tr,title,start,end,amounts,deps=[],ens=[])=>({...initiative(p),id,optionId:opt,transitionId:tr,title,startYear:start,endYear:end,kind:id==='i2'?'learn':'build',owner:T('s199'),output:id==='i2'?T('s200'):T('s201'),acceptance:T('s202'),capacity:T('s203'),budgetStatus:'unconfirmed',dependsOn:deps,enablerIds:ens,budget:years(p).map(year=>({year,amount:amounts[year]??null}))});
 p.initiatives=[make('i1','o1','t1',T('s204'),2027,2028,{2027:200000,2028:300000},[],['e1']),make('i2','o2','t2',T('s205'),2027,2028,{2027:150000,2028:250000}),make('i3','o2','t2',T('s206'),2029,2030,{2029:1000000,2030:1200000},['i2'],['e2'])];
 p.funding=years(p).map((year,k)=>({year,available:[500000,500000,1000000,1300000][k]}));
 // A cost anchor is inverted with its raw scores, preserving the original preference values.
 Object.assign(p.criteria[3],{name:D.demoBurden,polarity:'cost',low:D.demoBurdenLow,high:D.demoBurdenHigh});
 p.options.forEach((o,k)=>{o.scores.sustain.value=100-o.scores.sustain.value;o.assumptions=D['demoAssumption'+(k+1)];o.risks=D['demoRisk'+(k+1)];});
 // A conditional choice deliberately lacks mapped authority and initiatives; neither is a zero cost.
 p.options.push({...option(),id:'o4',title:D.demoPilot,decision:'select',decisionReason:D.demoPilotDecision,outcome:D.demoPilotOutcome,whyUs:D.demoPilotWhy,tradeoff:D.demoPilotTradeoff,owner:D.demoPilotOwner,assumptions:D.demoAssumption4,risks:D.demoRisk4,scores:Object.fromEntries(p.criteria.map((c,k)=>[c.id,{value:[75,70,60,40][k],note:D.demoScoreNote}]))});
 p.enablers.push({...enabler(),id:'e3',optionId:'o1',title:D.demoBlocker,kind:'authority',control:'external',owner:D.demoBlockerOwner,status:'blocked',dueYear:2027,source:D.demoBlockerSource,route:D.demoBlockerRoute,fallback:D.demoBlockerFallback});
 p.enablers.push({...enabler(),id:'e4',optionId:'o1',title:D.demoReady,kind:'capability',control:'internal',owner:D.demoPilotOwner,status:'ready',dueYear:2027,source:D.demoReadySource,route:D.demoReadyRoute,fallback:''});
 p.initiatives[0].enablerIds.push('e3','e4');p.initiatives[0].budgetStatus='confirmed';
 return p;
}
const api={SCHEMA,clone,num,text,uid,years,blank,option,reference,transition,enabler,initiative,weightInfo,score,ranking,sensitivity,breakEven,rankingAt,authorityIssues,historySummary,progress,selected,selectedInitiatives,budgetSummary,choiceCost,cycles,check,syncYears,validateImport,demo};if(typeof module!=='undefined'&&module.exports)module.exports=api;root.Sultan=api;
})(typeof globalThis!=='undefined'?globalThis:this);
