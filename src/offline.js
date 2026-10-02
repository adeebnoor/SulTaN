(function(root){
'use strict';
let prompt;
addEventListener('beforeinstallprompt',e=>{e.preventDefault();prompt=e;});
async function prepare(){const T=k=>root.SultanI18n.t(k);if(!('serviceWorker'in navigator)||!['https:','http:'].includes(location.protocol))throw Error(T('coOfflineUnavailable'));const registration=await navigator.serviceWorker.register('sw.js'),worker=registration.installing||registration.waiting||registration.active;if(!worker)throw Error(T('coOfflineUnavailable'));if(worker.state!=='activated')await new Promise((resolve,reject)=>{const timer=setTimeout(()=>reject(Error(T('coOfflineUnavailable'))),45000);const check=()=>{if(worker.state==='activated'){clearTimeout(timer);resolve();}else if(worker.state==='redundant'){clearTimeout(timer);reject(Error(T('coOfflineUnavailable')));}};worker.addEventListener('statechange',check);check();});await navigator.serviceWorker.ready;if(prompt){await prompt.prompt();await prompt.userChoice;prompt=null;}else root.SultanApp?.toast?.(T('coInstallHelp'));}
root.SultanOffline={prepare};
})(globalThis);
