// TAKT service worker — wygenerowany przez build.mjs. NIE edytować w dist.
var CACHE='takt-demo-v202609111147', PREFIX='takt-demo-';
var SHELL=["/takt-panel.html","/manifest.webmanifest","/apple-touch-icon.png","/app-icon-192.png","/app-icon-512.png"];
self.addEventListener('install',function(e){self.skipWaiting();e.waitUntil(caches.open(CACHE).then(function(c){return c.addAll(SHELL).catch(function(){});}));});
self.addEventListener('activate',function(e){e.waitUntil(caches.keys().then(function(ks){return Promise.all(ks.filter(function(k){return k!==CACHE&&k.indexOf(PREFIX)===0;}).map(function(k){return caches.delete(k);}));}).then(function(){return self.clients.claim();}));});
self.addEventListener('fetch',function(e){
  var req=e.request; if(req.method!=='GET') return;
  var url; try{url=new URL(req.url);}catch(_){return;}
  if(url.origin!==self.location.origin) return;            // Supabase itd. — nie ruszamy
  if(req.mode==='navigate'){
    e.respondWith(fetch(req).then(function(res){var cp=res.clone();caches.open(CACHE).then(function(c){c.put(req,cp);});return res;})
      .catch(function(){return caches.match(req).then(function(m){return m||caches.match("/takt-panel.html");});}));
    return;
  }
  e.respondWith(caches.match(req).then(function(cached){
    var net=fetch(req).then(function(res){if(res&&res.status===200){var cp=res.clone();caches.open(CACHE).then(function(c){c.put(req,cp);});}return res;}).catch(function(){return cached;});
    return cached||net;
  }));
});
