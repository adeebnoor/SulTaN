/* Experimental exact break-even solver. Not loaded by the application until equivalence testing passes. */
(function(root){
'use strict';
const E=typeof module!=='undefined'&&module.exports?require('./import.js'):root.Sultan;
const EPS=1e-9, TOP_EPS=1e-7;
const num=x=>typeof x==='number'&&Number.isFinite(x);
const utility=(c,x)=>(c.polarity==='cost'?100-x:x)/100;
const topKey=r=>r.length?r.filter(x=>Math.abs(x.value-r[0].value)<TOP_EPS).map(x=>x.id).sort().join(','):'';

function scanRow(p,criterionId){return E.breakEven(p).find(x=>x.criterionId===criterionId)||null;}
function lineSet(p,c){
 const others=p.criteria.filter(k=>k.id!==c.id),baseOther=others.reduce((a,k)=>a+k.weight,0);
 if(p.criteria.length<2||c.weight<=EPS||c.weight>=100-EPS||baseOther<=EPS)return null;
 const lines=[];
 for(const o of p.options){
  if(o.type==='requirement')continue;
  const raw=o.scores?.[c.id]?.value;
  if(!num(raw)||raw<0||raw>100)continue;
  let weighted=0,valid=true;
  for(const k of others){
   if(k.weight<=EPS)continue;
   const x=o.scores?.[k.id]?.value;
   if(!num(x)||x<0||x>100){valid=false;break;}
   weighted+=k.weight*utility(k,x);
  }
  if(!valid)continue;
  const A=utility(c,raw),B=weighted/baseOther;
  lines.push({id:o.id,title:o.title||'',b:100*B,m:A-B});
 }
 return lines;
}
function exactRow(p,c,base){
 const fallback=()=>scanRow(p,c.id)||{criterionId:c.id,criterion:c.name,current:c.weight,threshold:null,distance:null,newTop:null};
 const lines=lineSet(p,c);if(!lines||lines.length<2)return fallback();
 const baseIds=new Set(base.filter(x=>Math.abs(x.value-base[0].value)<TOP_EPS).map(x=>x.id));
 if(baseIds.size!==1)return fallback();
 const leader=lines.find(x=>baseIds.has(x.id));if(!leader)return fallback();
 const w0=c.weight,candidates=[];
 for(const x of lines){
  if(x.id===leader.id)continue;
  const dm=leader.m-x.m;if(Math.abs(dm)<=EPS)continue;
  const root=(x.b-leader.b)/dm;
  if(root<=EPS||root>=100-EPS||Math.abs(root-w0)<=EPS)continue;
  candidates.push({root,distance:Math.abs(root-w0),challenger:x});
 }
 candidates.sort((a,b)=>a.distance-b.distance||a.root-b.root||a.challenger.id.localeCompare(b.challenger.id));
 for(const cand of candidates){
  const at=cand.root,leaderAt=leader.b+leader.m*at;
  let max=-Infinity;for(const x of lines)max=Math.max(max,x.b+x.m*at);
  if(max-leaderAt>1e-6)continue; // not an upper-envelope crossing
  const direction=at>w0?1:-1;
  const tied=lines.filter(x=>Math.abs((x.b+x.m*at)-max)<=1e-6);
  const targetSlope=direction>0?Math.max(...tied.map(x=>x.m)):Math.min(...tied.map(x=>x.m));
  const winners=tied.filter(x=>Math.abs(x.m-targetSlope)<=1e-9).sort((a,b)=>a.id.localeCompare(b.id));
  const newLeader=winners.find(x=>x.id!==leader.id)||winners[0];
  if(!newLeader||newLeader.id===leader.id)continue;
  return {criterionId:c.id,criterion:c.name,current:w0,threshold:at,distance:Math.abs(at-w0),newTop:newLeader.title};
 }
 return {criterionId:c.id,criterion:c.name,current:w0,threshold:null,distance:null,newTop:null};
}
function breakEvenAnalytic(p){
 const base=E.ranking(p);if(base.length<2||!E.weightInfo(p).valid)return [];
 return p.criteria.map(c=>exactRow(p,c,base));
}
E.breakEvenAnalytic=breakEvenAnalytic;
if(typeof module!=='undefined'&&module.exports)module.exports=E;
})(typeof globalThis!=='undefined'?globalThis:this);
