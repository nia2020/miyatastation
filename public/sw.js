/* global self */
self.addEventListener("push", function (event) {
  var data = {
    title: "ミヤタステーション",
    body: "サイトを開いて内容を確認してください",
    url: "/dashboard/notifications",
    tag: "miyata-push-fallback",
    image: "",
  };
  if (event.data) {
    try {
      var json = event.data.json();
      if (json.title) data.title = json.title;
      if (json.body) data.body = json.body;
      if (json.url) data.url = json.url;
      if (json.tag) data.tag = json.tag;
      if (json.image) data.image = json.image;
    } catch (_e) {
      /* ignore */
    }
  }
  var opts = {
    body: data.body,
    icon: "/mascot.png",
    badge: "/mascot.png",
    data: { url: data.url },
    tag: data.tag,
    renotify: true,
  };
  if (data.image && data.image.indexOf("http") === 0) {
    opts.image = data.image;
  }
  event.waitUntil(
    self.registration.showNotification(data.title, opts)
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
