/* Normalize incomplete score entries without turning missing evidence into facts. */
(function(root){
'use strict';
const E=typeof module!=='undefined'&&module.exports?require('./engine.js'):root.Sultan;
const validate=E.validateImport;
E.validateImport=function(raw){
 if(!raw||typeof raw!=='object')return validate(raw);
 const p=JSON.parse(JSON.stringify(raw));
 if(Array.isArray(p.options))for(const o of p.options){if(!o||!o.scores||typeof o.scores!=='object'||Array.isArray(o.scores))continue;for(const s of Object.values(o.scores)){if(!s||typeof s!=='object'||Array.isArray(s))continue;if(s.value===undefined)s.value=null;if(s.note===undefined)s.note='';}}
 return validate(p);
};
if(typeof module!=='undefined'&&module.exports)module.exports=E;
})(typeof globalThis!=='undefined'?globalThis:this);
