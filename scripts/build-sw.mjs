import { readdir, readFile, writeFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
const assets = ['index.html','manifest.json',...(await readdir('dist/assets')).map(file=>`assets/${file}`),...(await readdir('dist/icons')).map(file=>`icons/${file}`)];
const hash=createHash('sha256');
for(const file of assets) hash.update(await readFile(`dist/${file}`));
const version=hash.digest('hex').slice(0,16);
await writeFile('dist/sw.js', `
const CACHE = 'aiomobile-static-${version}';
const FILES = ${JSON.stringify(assets.map(file=>`/mobile/${file}`))};
self.addEventListener('install', event => event.waitUntil((async()=>{
  const cache=await caches.open(CACHE);
  for(const file of FILES){
    const response=await fetch(new Request(file,{cache:'reload',redirect:'error'}));
    if(!response.ok) throw new Error('Static asset unavailable');
    await cache.put(file,response);
  }
})()));
self.addEventListener('message', event => {if(event.data?.type==='SKIP_WAITING')self.skipWaiting();});
self.addEventListener('activate',event=>event.waitUntil((async()=>{
  for(const key of await caches.keys())if(key.startsWith('aiomobile-static-') && key!==CACHE)await caches.delete(key);
  await self.clients.claim();
})()));
self.addEventListener('fetch', event=>{
  const url=new URL(event.request.url);
  if(event.request.method!=='GET' || url.origin!==self.location.origin || !url.pathname.startsWith('/mobile/'))return;
  if(event.request.mode==='navigate'){
    event.respondWith(fetch(event.request).catch(()=>caches.match('/mobile/index.html')));
  } else if(FILES.includes(url.pathname) && !url.search){
    event.respondWith(caches.match(url.pathname).then(cached=>cached || fetch(event.request)));
  }
});
`);
console.log(`Static-only service worker generated (${assets.length} assets, ${version}).`);
