/* SULTAN 0.7.3 performance hardening: cache break-even analysis until scoring inputs change. */
(function(root){
'use strict';
const E=root.Sultan;
if(!E||typeof E.breakEven!=='function')return;
const compute=E.breakEven.bind(E);
let cache={sig:null,val:null};
function signature(p){
 return JSON.stringify({
  criteria:(p.criteria||[]).map(c=>[c.id,c.name,c.weight,c.polarity||'benefit']),
  options:(p.options||[]).map(o=>[o.id,o.title,o.type,(p.criteria||[]).map(c=>o.scores?.[c.id]?.value??null)])
 });
}
E.breakEven=function(p){
 const sig=signature(p);
 if(cache.sig===sig&&cache.val!==null)return cache.val;
 const val=compute(p);
 cache={sig,val};
 return val;
};
E.breakEvenCacheSignature=signature;
})(globalThis);
