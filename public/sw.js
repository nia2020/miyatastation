/* global self */
self.addEventListener("push", function (event) {
  var data = {
    title: "ミヤタステーション",
    body: "新しい投稿があります",
    url: "/dashboard/chat",
  };
  if (event.data) {
    try {
      var json = event.data.json();
      if (json.title) data.title = json.title;
      if (json.body) data.body = json.body;
      if (json.url) data.url = json.url;
    } catch (_e) {
      /* ignore */
    }
  }
  event.waitUntil(
    self.registration.showNotification(data.title, {
      body: data.body,
      icon: "/mascot.png",
      badge: "/mascot.png",
      data: { url: data.url },
    })
  );
});

self.addEventListener("notificationclick", function (event) {
  event.notification.close();
  var url = (event.notification.data && event.notification.data.url) || "/dashboard/chat";
  var fullUrl =
    url.indexOf("http") === 0
      ? url
      : self.location.origin + (url.indexOf("/") === 0 ? url : "/" + url);
  event.waitUntil(self.clients.openWindow(fullUrl));
});
