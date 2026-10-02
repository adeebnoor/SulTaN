/* Planning jurisdiction is independent of the interface language. */
(function(root){
'use strict';
const key='sultan.market',valid=x=>['sa','global'].includes(x);
let preferred='sa';
try{const query=new URLSearchParams(location.search).get('market');const saved=localStorage.getItem(key);preferred=valid(query)?query:valid(saved)?saved:'sa';if(valid(query))localStorage.setItem(key,query);}catch{}
const api={preferred:()=>preferred,setPreferred(value){if(!valid(value))return;preferred=value;try{localStorage.setItem(key,value);}catch{}},isGlobal:p=>p?.context?.market==='global',currency:p=>p?.context?.currency||'',describe(p){const c=p?.context||{};return `Planning jurisdiction: ${c.market==='global'?'international':'Saudi Arabia'}; country: ${c.country||'unspecified'}; currency: ${c.currency||'unspecified'}. Never infer applicable law from the interface language. Do not assume an unspecified country or currency. Existing references still require an applicability check.`;}};
root.SultanMarket=api;
const E=root.Sultan;if(E){const blank=E.blank;E.blank=()=>{const p=blank();if(p.context&&preferred==='global')Object.assign(p.context,{market:'global',country:'',currency:''});return p;};}
if(typeof module!=='undefined'&&module.exports)module.exports=api;
})(globalThis);
