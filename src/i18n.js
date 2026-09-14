/* Runtime localization is limited to interface messages, never project values. */
(function(root){
'use strict';
const isNode=typeof module!=='undefined'&&module.exports;
const dictionaries=isNode?{en:require('./locales/en.js'),ar:require('./locales/ar.js')}:root.SultanLocales;
let lang='en';
if(!isNode){let saved;try{saved=localStorage.getItem('sultan.language');}catch{}const requested=new URLSearchParams(location.search).get('lang');lang=['ar','en'].includes(requested)?requested:['ar','en'].includes(saved)?saved:document.documentElement.lang==='en'?'en':'ar';document.documentElement.lang=lang;document.documentElement.dir=lang==='ar'?'rtl':'ltr';}
function t(key,values=[]){const source=dictionaries[lang]?.[key]??dictionaries.en[key];if(source===undefined)throw Error('Missing translation: '+key);return source.replace(/%\{(\d+)\}/g,(_,index)=>String(values[Number(index)]??''));}
function apply(rootNode=document){rootNode.querySelectorAll('[data-i18n]').forEach(el=>el.textContent=t(el.dataset.i18n));rootNode.querySelectorAll('[data-i18n-label]').forEach(el=>el.setAttribute('aria-label',t(el.dataset.i18nLabel)));}
const api={t,get language(){return lang;},get direction(){return lang==='ar'?'rtl':'ltr';},get locale(){return lang==='ar'?'ar-SA':'en-US';},apply};
if(isNode)module.exports=api;else{root.SultanI18n=api;apply();}
})(globalThis);
