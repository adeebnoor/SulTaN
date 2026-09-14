/* Keep a newly created record visible and keyboard-accessible after rendering. */
(function(){
'use strict';
let previous=null;
document.addEventListener('click',function(e){
 const b=e.target.closest('[data-action="add"]');
 if(!b||!window.SultanApp)return;
 const kind=b.dataset.kind,project=SultanApp.getProject();
 previous={kind,count:Array.isArray(project[kind])?project[kind].length:0};
},true);
document.addEventListener('click',function(e){
 const b=e.target.closest('[data-action="add"]');
 if(!b||!previous||previous.kind!==b.dataset.kind)return;
 const kind=previous.kind,items=SultanApp.getProject()[kind];
 if(!Array.isArray(items)||items.length<=previous.count)return;
 const removers=Array.from(document.querySelectorAll('[data-action="remove"]')).filter(x=>x.dataset.kind===kind);
 const last=removers.at(-1);if(!last)return;
 const record=last.closest('details')||last.closest('article');
 if(!record)return;
 let ancestor=record;while(ancestor){if(ancestor.tagName==='DETAILS')ancestor.open=true;ancestor=ancestor.parentElement;}
 record.scrollIntoView({block:'nearest',behavior:'auto'});
 const input=record.querySelector('input:not([type="checkbox"]),textarea,select');
 if(input)input.focus({preventScroll:true});
 previous=null;
});
})();
