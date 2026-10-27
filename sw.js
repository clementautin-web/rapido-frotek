/* Rapido — service de fonctionnement hors connexion.
   À chaque nouvelle version de l'outil, changez le numéro ci-dessous : les téléphones se mettent à jour au prochain démarrage connecté. */
const VERSION="14.6";
const CACHE="rapido-v"+VERSION;
const CORE=["./","index.html","manifest.webmanifest","icons/icon-192.png","icons/icon-512.png","icons/icon-maskable-512.png","icons/apple-touch-icon.png","icons/favicon-32.png"];
self.addEventListener("install",e=>{e.waitUntil(caches.open(CACHE).then(c=>c.addAll(CORE)).then(()=>self.skipWaiting()));});
self.addEventListener("activate",e=>{e.waitUntil(caches.keys().then(ks=>Promise.all(ks.filter(k=>(k.startsWith("frotek-pi-")||k.startsWith("rapido-"))&&k!==CACHE).map(k=>caches.delete(k)))).then(()=>self.clients.claim()));});
const wait=ms=>new Promise((_,no)=>setTimeout(()=>no(new Error("délai dépassé")),ms));
self.addEventListener("fetch",e=>{
  const req=e.request;if(req.method!=="GET")return;
  const url=new URL(req.url);if(url.origin!==location.origin)return;   // sites externes (adresses, logos, polices) : inchangés
  if(req.mode==="navigate"){   // la page : version en ligne si le réseau répond vite, sinon version enregistrée
    e.respondWith((async()=>{const cache=await caches.open(CACHE);
      try{const res=await Promise.race([fetch(req),wait(4000)]);if(res&&res.ok){cache.put("index.html",res.clone());return res;}throw new Error("réponse");}
      catch(_){const c=(await cache.match("index.html"))||(await cache.match("./"));return c||new Response("Hors connexion : ouvrez l'application une première fois avec internet.",{status:503,headers:{"Content-Type":"text/plain; charset=utf-8"}});}})());
    return;}
  e.respondWith((async()=>{const cache=await caches.open(CACHE);const c=await cache.match(req);   // icônes et autres fichiers : copie enregistrée, mise à jour en arrière-plan
    const net=fetch(req).then(r=>{if(r&&r.ok)cache.put(req,r.clone());return r;}).catch(()=>null);
    return c||(await net)||new Response("",{status:504});})());
});
