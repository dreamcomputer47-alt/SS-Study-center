self.addEventListener('install',()=>self.skipWaiting());
self.addEventListener('activate',event=>event.waitUntil(self.clients.claim()));
self.addEventListener('push',event=>{
  let data={title:'SS Study Centre',body:'নতুন update এসেছে',url:'/'};
  try{ if(event.data) data={...data,...event.data.json()}; }catch{}
  event.waitUntil(self.registration.showNotification(data.title,{body:data.body,icon:'/uploads/surajit-sir.jpg',badge:'/uploads/surajit-sir.jpg',tag:data.tag||'ss-study-centre',data:{url:data.url||'/'},renotify:true}));
});
self.addEventListener('notificationclick',event=>{
  event.notification.close();
  const url=event.notification.data?.url||'/';
  event.waitUntil(clients.matchAll({type:'window',includeUncontrolled:true}).then(list=>{
    for(const client of list){ if('focus' in client){ client.navigate(url); return client.focus(); } }
    return clients.openWindow(url);
  }));
});
