/* Active service worker navigation must not pick an older retained app cache. */
'use strict';
const assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm'),path=require('node:path');
const handlers={},current={version:'current'},old={version:'old'};let selected='';
const context={URL,location:{origin:'https://example.test'},self:{registration:{scope:'https://example.test/'},addEventListener:(name,fn)=>handlers[name]=fn},fetch:async()=>{throw Error('offline');},caches:{match:async()=>old,open:async name=>{assert.equal(name,'sultan-app-current');return {match:async resource=>{selected=resource;return current;}};}}};
vm.createContext(context);vm.runInContext(fs.readFileSync(path.join(__dirname,'../src/sw-template.js'),'utf8').replace('__CACHE__',JSON.stringify('sultan-app-current')).replace('__FILES__','["index.html","share.html"]'),context);
(async()=>{for(const [url,want] of [['https://example.test/?lang=ar','index.html'],['https://example.test/share.html','share.html']]){let result;handlers.fetch({request:{method:'GET',mode:'navigate',url},respondWith:p=>result=p});assert.equal(await result,current);assert.equal(selected,want);}console.log(JSON.stringify({suite:'offline-cache',tests:2,passed:2}));})().catch(e=>{console.error(e);process.exitCode=1;});
