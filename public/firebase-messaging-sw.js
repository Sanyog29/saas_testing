importScripts('https://www.gstatic.com/firebasejs/10.12.2/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.12.2/firebase-messaging-compat.js');

firebase.initializeApp({
    apiKey: "AIzaSyBcZ3cFsWiLfp7QFUcwOwjvSeM5Y-0hRZk",
    authDomain: "web-notification-52467.firebaseapp.com",
    projectId: "web-notification-52467",
    messagingSenderId: "758776193487",
    appId: "1:758776193487:web:37aded7039fffec6a432ba",
});

const messaging = firebase.messaging();

messaging.onBackgroundMessage(function (payload) {
    console.log('[firebase-messaging-sw.js] Received background message ', payload);

    const notificationTitle = payload.notification.title.includes('Autopilot FMS')
        ? payload.notification.title
        : `Autopilot FMS | ${payload.notification.title}`;

    const notificationOptions = {
        body: payload.notification.body,
        icon: '/autopilot-logo.png',
        badge: '/autopilot-logo.png', // Small icon for mobile status bar
        data: payload.data,
        vibrate: [100, 50, 100],
        tag: payload.data?.notification_id || 'autopilot-fms-notification'
    };

    self.registration.showNotification(notificationTitle, notificationOptions);
});

self.addEventListener('notificationclick', function (event) {
    event.notification.close();
    const url = event.notification.data?.deep_link || event.notification.data?.url || '/';
    const targetUrl = new URL(url, self.location.origin).href;

    event.waitUntil(
        clients.matchAll({ type: 'window', includeUncontrolled: true }).then(windowClients => {
            // 1. Check if any window is already open at the target URL
            for (let client of windowClients) {
                if (client.url === targetUrl && 'focus' in client) {
                    return client.focus();
                }
            }
            // 2. Check if any window is open at the same origin
            for (let client of windowClients) {
                if ('navigate' in client && 'focus' in client) {
                    return client.navigate(targetUrl).then(c => c.focus());
                }
            }
            // 3. Otherwise, open a new window
            if (clients.openWindow) {
                return clients.openWindow(targetUrl);
            }
        })
    );
});
