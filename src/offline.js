(function(root){
'use strict';
let prompt,pending,state='online';
function update(next){state=next;document.dispatchEvent(new CustomEvent('sultan:offline'));}
addEventListener('beforeinstallprompt',e=>{e.preventDefault();prompt=e;});
async function register(){const T=k=>root.SultanI18n.t(k);if(!('serviceWorker'in navigator)||!['https:','http:'].includes(location.protocol))throw Error(T('coOfflineUnavailable'));const registration=await navigator.serviceWorker.register('sw.js'),worker=registration.installing||registration.waiting||registration.active;if(!worker)throw Error(T('coOfflineUnavailable'));if(worker.state!=='activated')await new Promise((resolve,reject)=>{const timer=setTimeout(()=>reject(Error(T('coOfflineUnavailable'))),45000);const check=()=>{if(worker.state==='activated'){clearTimeout(timer);resolve();}else if(worker.state==='redundant'){clearTimeout(timer);reject(Error(T('coOfflineUnavailable')));}};worker.addEventListener('statechange',check);check();});await navigator.serviceWorker.ready;if(!navigator.serviceWorker.controller)await new Promise((resolve,reject)=>{const timer=setTimeout(()=>reject(Error(T('coOfflineUnavailable'))),10000);navigator.serviceWorker.addEventListener('controllerchange',()=>{clearTimeout(timer);resolve();},{once:true});if(navigator.serviceWorker.controller){clearTimeout(timer);resolve();}});update('ready');}
async function prepare(install=true){if(!pending){update('preparing');pending=register().catch(error=>{pending=null;update('error');throw error;});}await pending;if(install&&prompt){await prompt.prompt();await prompt.userChoice;prompt=null;}}
root.SultanOffline={prepare,get state(){return state;}};
// Cache only public application files, after the first render. Never cache project data.
function schedule(){if(!['http:','https:'].includes(location.protocol))return;const run=()=>prepare(false).catch(()=>{});if(root.requestIdleCallback)root.requestIdleCallback(run,{timeout:3000});else setTimeout(run,500);}
if(document.readyState==='complete')schedule();else addEventListener('load',schedule,{once:true});
})(globalThis);
