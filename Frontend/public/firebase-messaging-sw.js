/* global importScripts, firebase */
importScripts(
  "https://www.gstatic.com/firebasejs/13.1.0/firebase-app-compat.js",
  "https://www.gstatic.com/firebasejs/13.1.0/firebase-messaging-compat.js",
);

const config = Object.fromEntries(
  new URLSearchParams(self.location.search).entries(),
);
firebase.initializeApp(config);

const messaging = firebase.messaging();
messaging.onBackgroundMessage((payload) => {
  const notification = payload.notification || {};
  const link = payload.data?.link || "/";
  self.registration.showNotification(notification.title || "WorkStation", {
    body: notification.body || "",
    icon: "/favicon.svg",
    data: { link },
  });
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const link = event.notification.data?.link || "/";
  event.waitUntil(
    self.clients
      .matchAll({ type: "window", includeUncontrolled: true })
      .then((clients) => {
        const client = clients.find((item) => "focus" in item);
        if (client) {
          client.navigate(link);
          return client.focus();
        }
        return self.clients.openWindow(link);
      }),
  );
});
