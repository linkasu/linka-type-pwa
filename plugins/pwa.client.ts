// PWA manifest and service worker registration
export default defineNuxtPlugin(() => {
  // Add manifest link if not present
  if (typeof document !== 'undefined') {
    const existingManifest = document.querySelector('link[rel="manifest"]')
    if (!existingManifest) {
      const link = document.createElement('link')
      link.rel = 'manifest'
      link.href = '/manifest.webmanifest'
      document.head.appendChild(link)
    }
  }

  // Register service worker
  if ('serviceWorker' in navigator) {
    window.addEventListener('load', async () => {
      try {
        const registration = await navigator.serviceWorker.register('/sw.js', {
          scope: '/',
        })

        registration.addEventListener('updatefound', () => {
          const newWorker = registration.installing
          if (newWorker) {
            newWorker.addEventListener('statechange', () => {
              if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                // New content is available, refresh to update
                console.log('New content available, refresh to update')
              }
            })
          }
        })

        console.log('Service worker registered successfully')
      } catch (error) {
        console.error('Service worker registration failed:', error)
      }
    })
  }
})
