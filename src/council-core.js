/* Council evidence records and serverless snapshot integrity. No network access. */
(function(root){
'use strict';
const E=root.Sultan,T=(k,v)=>root.SultanI18n.t(k,v),clone=x=>JSON.parse(JSON.stringify(x));
const enc=new TextEncoder(),dec=new TextDecoder(),bytes=x=>enc.encode(JSON.stringify(x));
const cleanString=(s,n=12000)=>typeof s==='string'&&s.length<=n;
const defaults=()=>({version:1,decisions:[],reviews:[],contributions:[]});
function validate(raw){
 if(raw===undefined)return defaults();
 if(!raw||Array.isArray(raw)||raw.version!==1||Object.keys(raw).some(k=>!Object.hasOwn(defaults(),k)))throw Error('Invalid council record');
 const shapes={decisions:['id','at','basis','optionId','title','decision','rationale','owner','evidence','reviewDate'],reviews:['id','at','basis','mode','summary','items'],contributions:['id','at','basis','invitationId','owner','note','disposition','resolution']};
 for(const [key,fields] of Object.entries(shapes)){
  if(!Array.isArray(raw[key])||raw[key].length>200)throw Error('Council record limit');
  const seen=new Set();for(const row of raw[key]){
   if(!row||Object.keys(row).some(k=>!fields.includes(k))||fields.some(k=>!Object.hasOwn(row,k)))throw Error('Invalid council fields');
   for(const k of fields)if(k!=='items'&&!cleanString(row[k]))throw Error('Invalid council value');
   if(!/^[a-zA-Z0-9_-]{1,100}$/.test(row.id)||seen.has(row.id))throw Error('Invalid council identity');seen.add(row.id);
   if(!Number.isFinite(Date.parse(row.at)))throw Error('Invalid council timestamp');
   if(key==='reviews'&&(!['local','ai'].includes(row.mode)||!Array.isArray(row.items)||row.items.length>200||row.items.some(i=>!i||Object.keys(i).length!==3||['question','weakness','test'].some(k=>!cleanString(i[k])))))throw Error('Invalid council review');
   if(key==='contributions'&&!['pending','accepted','dismissed'].includes(row.disposition))throw Error('Invalid contribution disposition');
   if(key==='decisions'&&(!['select','consider','defer','reject'].includes(row.decision)||!validDate(row.reviewDate)))throw Error('Invalid council decision');
  }
 }
 return clone(raw);
}
function validDate(s){return /^\d{4}-\d{2}-\d{2}$/.test(s)&&Number.isFinite(Date.parse(s))&&new Date(s).toISOString().slice(0,10)===s;}
const baseBlank=E.blank,baseImport=E.validateImport,baseSync=E.syncYears;
E.blank=()=>({...baseBlank(),council:defaults()});
E.validateImport=raw=>{if(!raw||typeof raw!=='object')return baseImport(raw);const c=validate(raw.council),q=clone(raw);delete q.council;const p=baseImport(q);p.council=c;return p;};
E.syncYears=p=>{const q=baseSync(p)||p;if(!q.council)q.council=defaults();return q;};
if(root.SultanRecovery?.pending&&root.SultanRecovery.raw){try{E.validateImport(JSON.parse(root.SultanRecovery.raw));root.SultanRecovery.pending=false;root.SultanRecovery.error='';}catch{}}
function basis(p){const q=clone(p);delete q.council;return E.contextReviewBasis(q);}
function challenges(p){
 const items=[],add=(q,w,t,title)=>items.push({question:T(q)+' — '+title,weakness:T(w),test:T(t)});
 for(const o of E.selected(p)){
  const op=p.strategy?.opportunities.find(x=>x.optionId===o.id);
  if(!op?.demandEvidence)add('cChallengeEvidence','cNoEvidence','cResolveEvidence',o.title);
  if(!o.tradeoff?.trim())add('cChallengeTradeoff','cNoTradeoff','cResolveTradeoff',o.title);
  if(op?.route==='partner'&&(!op.partnerIncentive?.trim()||!op.partnerEvidence?.trim()))add('cChallengePartner','cNoPartner','cResolvePartner',o.title);
  if(op?.valueModel==='commercial'&&(!op.renewalDriver?.trim()||!op.valueEvidence?.trim()))add('cChallengeRenewal','cNoRenewal','cResolveRenewal',o.title);
  if((op||o.type==='moonshot')&&!op?.killCriterion?.trim())add('cChallengeStop','cNoStop','cResolveStop',o.title);
 }
 for(const t of p.transitions.filter(t=>E.selected(p).some(o=>o.id===t.optionId)))if(!E.num(t.baseline)||!t.baselineSource?.trim())add('cChallengeMetric','cNoBaseline','cResolveMetric',t.kpi||t.domain);
 return items.slice(0,200);
}
const value=x=>x===null||x===undefined||x===''?T('cUnknown'):String(x);
const decision=x=>T(({select:'cSelected',consider:'cConsider',defer:'cDeferred',reject:'cRejected'})[x]||'cUnknown');
function snapshot(p){
 const fields=(pairs)=>pairs.map(([k,v])=>T(k)+': '+value(v)).join('\n');
 const records=[];const add=(section,title,body)=>records.push({section,title:value(title),body:String(body)});
 for(const o of p.options)add(T('cChoices'),o.title,fields([['cDecision',decision(o.decision)],['cReason',o.decisionReason],['cOwner',o.owner],['cOutput',o.outcome],['cEvidence',o.whyUs]])+'\n'+T('cChallengeTradeoff')+' '+value(o.tradeoff));
 for(const t of p.transitions.filter(t=>E.selected(p).some(o=>o.id===t.optionId)))add(T('cKPIs'),t.kpi||t.domain,fields([['cBaseline',t.baseline],['cSource',t.baselineSource],['cTarget',t.target],['cOwner',t.owner]])+'\n'+t.annual.map(a=>a.year+': '+value(a.target)+' · '+value(a.milestone)+' · '+value(a.evidence)).join('\n'));
 for(const i of E.selectedInitiatives(p))add(T('cInitiatives'),i.title,fields([['cOwner',i.owner],['cOutput',i.output],['cAcceptance',i.acceptance],['cTime',i.startYear+'–'+i.endYear]])+'\n'+i.budget.map(b=>b.year+': '+value(b.amount)).join('\n'));
 for(const issue of E.check(p).filter(x=>x.entity!=='ai-review'))add(T('cOpenIssues'),issue.section,issue.message);
 for(const d of p.council?.decisions||[])add(T('cDecisions'),d.title,fields([['cDecision',decision(d.decision)],['cReason',d.rationale],['cOwner',d.owner],['cEvidence',d.evidence],['cDate',d.reviewDate],['cAt',d.at]]));
 for(const c of p.council?.contributions||[])add(T('cInbox'),c.owner,fields([['cAt',c.at],['cNote',c.note],['cDecision',T({pending:'cPending',accepted:'cAccepted',dismissed:'cDismissed'}[c.disposition])],['cResolution',c.resolution]])+'\n'+(c.basis===basis(p)?T('cFresh'):T('cStale')));
 const r=p.council?.reviews.at(-1);if(r){add(T('cReview'),r.mode==='ai'?T('cAIMode'):T('cLocalMode'),(r.basis===basis(p)?T('cFresh'):T('cStale'))+'\n'+r.summary);for(const i of r.items)add(T('cReview'),i.question,i.weakness+'\n'+i.test);}
 return {version:1,lang:root.SultanI18n.language,title:p.institution.name||T('cCover'),at:new Date().toISOString(),basis:basis(p),draft:T('cDraft'),mission:p.institution.mission||'',horizon:p.institution.startYear+'–'+p.institution.endYear,isDemo:!!p.isDemo,
 counts:{selected:E.selected(p).length,initiatives:E.selectedInitiatives(p).length,issues:E.check(p).filter(x=>x.entity!=='ai-review').length},funding:E.budgetSummary(p),records};
}
function validateSnapshot(s){
 if(!s||s.version!==1||!['ar','en'].includes(s.lang)||!['title','at','basis','draft','mission','horizon'].every(k=>cleanString(s[k],30000))||!Array.isArray(s.records)||s.records.length>2500||s.records.some(r=>!r||!['section','title','body'].every(k=>cleanString(r[k],50000)))||!s.counts||!['selected','initiatives','issues'].every(k=>Number.isSafeInteger(s.counts[k])&&s.counts[k]>=0)||!Array.isArray(s.funding)||s.funding.length>301||s.funding.some(f=>!f||!['year','declared','unknown','available','gap'].every(k=>f[k]===null||typeof f[k]==='number'&&Number.isFinite(f[k])&&f[k]>=0)))throw Error(T('cBadLink'));
 return s;
}
const b64=a=>{let s='';for(const b of new Uint8Array(a))s+=String.fromCharCode(b);return btoa(s).replaceAll('+','-').replaceAll('/','_').replaceAll('=','');};
const un64=s=>{if(typeof s!=='string'||!/^[A-Za-z0-9_-]*$/.test(s))throw Error('Invalid encoding');return Uint8Array.from(atob(s.replaceAll('-','+').replaceAll('_','/')),c=>c.charCodeAt(0));};
async function hash(x){return b64(await crypto.subtle.digest('SHA-256',bytes(x)));}
async function compress(x){const st=new Blob([bytes(x)]).stream().pipeThrough(new CompressionStream('deflate'));return b64(await new Response(st).arrayBuffer());}
async function expand(s){
 if(s.length>48000)throw Error(T('cTooBig'));
 const reader=new Blob([un64(s)]).stream().pipeThrough(new DecompressionStream('deflate')).getReader();let size=0;const chunks=[];
 try{for(;;){const {value,done}=await reader.read();if(done)break;size+=value.length;if(size>1000000)throw Error(T('cTooBig'));chunks.push(value);}}finally{await reader.cancel();}
 const all=new Uint8Array(size);let off=0;for(const c of chunks){all.set(c,off);off+=c.length;}return JSON.parse(dec.decode(all));
}
async function createLink(s,owner=''){
 validateSnapshot(s);const pair=await crypto.subtle.generateKey({name:'ECDSA',namedCurve:'P-256'},true,['sign','verify']);
 const invite=owner?{id:crypto.randomUUID(),owner,secret:b64(crypto.getRandomValues(new Uint8Array(32)))}:null;
 const payload={kind:'sultan-snapshot',version:1,snapshot:s,invite};
 const envelope={payload,pub:await crypto.subtle.exportKey('jwk',pair.publicKey),sig:b64(await crypto.subtle.sign({name:'ECDSA',hash:'SHA-256'},pair.privateKey,bytes(payload)))};
 const token=await compress(envelope);if(token.length>48000)throw Error(T('cTooBig'));
 return {token,invite:invite?{...invite,basis:s.basis,snapshotHash:await hash(s)}:null};
}
async function readLink(token){
 const x=await expand(token);if(x?.payload?.kind!=='sultan-snapshot'||x.payload.version!==1)throw Error(T('cBadLink'));
 const key=await crypto.subtle.importKey('jwk',x.pub,{name:'ECDSA',namedCurve:'P-256'},false,['verify']);
 if(!await crypto.subtle.verify({name:'ECDSA',hash:'SHA-256'},key,un64(x.sig),bytes(x.payload)))throw Error(T('cBadLink'));
 validateSnapshot(x.payload.snapshot);const i=x.payload.invite;
 if(i&&(!cleanString(i.id,100)||!cleanString(i.owner,120)||un64(i.secret).length!==32))throw Error(T('cBadLink'));
 return x.payload;
}
async function mac(secret,payload,signature){const key=await crypto.subtle.importKey('raw',un64(secret),{name:'HMAC',hash:'SHA-256'},false,['sign','verify']);return signature===undefined?b64(await crypto.subtle.sign('HMAC',key,bytes(payload))):crypto.subtle.verify('HMAC',key,un64(signature),bytes(payload));}
async function response(payload,note){if(!payload.invite||!cleanString(note)||!note.trim())throw Error(T('cInvalidResponse'));const body={kind:'sultan-owner-response',version:1,id:crypto.randomUUID(),invitationId:payload.invite.id,snapshotHash:await hash(payload.snapshot),at:new Date().toISOString(),note:note.trim()};return {body,signature:await mac(payload.invite.secret,body)};}
async function verifyResponse(x,invites,existing){
 const b=x?.body,i=invites.find(i=>i.id===b?.invitationId);if(!b||b.kind!=='sultan-owner-response'||b.version!==1||!i||b.snapshotHash!==i.snapshotHash||!cleanString(b.id,100)||!cleanString(b.note)||!b.note.trim()||!Number.isFinite(Date.parse(b.at))||!await mac(i.secret,b,x.signature))throw Error(T('cInvalidResponse'));
 if(existing.some(c=>c.invitationId===i.id))throw Error(T('cDuplicate'));
 return {id:E.uid('input'),invitationId:i.id,at:b.at,basis:i.basis,owner:i.owner,note:b.note,disposition:'pending',resolution:''};
}
root.SultanCouncil={defaults,validate,validDate,basis,challenges,snapshot,validateSnapshot,decision,value,createLink,readLink,response,verifyResponse,hash,compress,expand};
})(globalThis);
