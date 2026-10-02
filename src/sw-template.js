/* Generated allow-list. No user data, AI calls or cross-origin requests are cached. */
const CACHE=__CACHE__,FILES=__FILES__;
const urls=new Set(FILES.map(p=>new URL(p,self.registration.scope).href));
self.addEventListener('install',e=>e.waitUntil(caches.open(CACHE).then(c=>c.addAll(FILES)).then(()=>self.skipWaiting())));
self.addEventListener('activate',e=>e.waitUntil((async()=>{const keys=(await caches.keys()).filter(k=>k.startsWith('sultan-app-'));for(const k of keys.slice(0,-3))await caches.delete(k);await self.clients.claim();})()));
self.addEventListener('fetch',e=>{const u=new URL(e.request.url);if(e.request.method!=='GET'||u.origin!==location.origin)return;if(e.request.mode==='navigate'){e.respondWith(fetch(e.request).catch(()=>caches.open(CACHE).then(c=>c.match(u.pathname.endsWith('share.html')?'share.html':'index.html'))));return;}if(urls.has(u.href))e.respondWith(caches.match(e.request).then(r=>r||fetch(e.request)));});
