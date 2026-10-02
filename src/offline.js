(function(root){
'use strict';
let prompt;
addEventListener('beforeinstallprompt',e=>{e.preventDefault();prompt=e;});
async function prepare(){const T=k=>root.SultanI18n.t(k);if(!('serviceWorker'in navigator)||!['https:','http:'].includes(location.protocol))throw Error(T('coOfflineUnavailable'));await navigator.serviceWorker.register('sw.js');await navigator.serviceWorker.ready;if(prompt){await prompt.prompt();await prompt.userChoice;prompt=null;}else root.SultanApp?.toast?.(T('coInstallHelp'));}
root.SultanOffline={prepare};
})(globalThis);
