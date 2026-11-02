// Safree service worker — handles Web Push display + click routing.

self.addEventListener('install', (event) => {
  self.skipWaiting()
})

self.addEventListener('activate', (event) => {
  event.waitUntil(self.clients.claim())
})

self.addEventListener('push', (event) => {
  let data = { title: 'Safree', body: '', url: '/user/notifications', tag: 'safree' }
  try {
    if (event.data) data = { ...data, ...event.data.json() }
  } catch (e) {
    if (event.data) data.body = event.data.text()
  }

  const options = {
    body: data.body,
    icon: '/icon-192.png',
    badge: '/badge-72.png',
    tag: data.tag,
    data: { url: data.url },
    vibrate: [100, 50, 100],
  }

  event.waitUntil(self.registration.showNotification(data.title, options))
})

self.addEventListener('notificationclick', (event) => {
  event.notification.close()
  const url = event.notification.data?.url || '/user/notifications'

  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      // Focus an existing tab if one is open
      for (const client of clientList) {
        if ('focus' in client) {
          client.navigate(url)
          return client.focus()
        }
      }
      // Otherwise open a new one
      if (self.clients.openWindow) return self.clients.openWindow(url)
    })
  )
})
