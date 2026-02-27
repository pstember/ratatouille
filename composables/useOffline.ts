import { ref, onMounted, onUnmounted, readonly } from 'vue'

export function useOffline() {
  const isOnline = ref(true)
  const lastOnline = ref<Date | null>(null)
  const lastOffline = ref<Date | null>(null)

  const updateOnlineStatus = () => {
    const wasOnline = isOnline.value
    isOnline.value = navigator.onLine
    
    if (isOnline.value && !wasOnline) {
      lastOnline.value = new Date()
    } else if (!isOnline.value && wasOnline) {
      lastOffline.value = new Date()
    }
  }

  const checkConnectivity = async (): Promise<boolean> => {
    try {
      // Try to fetch a small resource to test connectivity
      const response = await fetch('/api/health', { 
        method: 'HEAD',
        cache: 'no-cache'
      })
      return response.ok
    } catch {
      return false
    }
  }

  const waitForConnection = (): Promise<void> => {
    return new Promise((resolve) => {
      if (isOnline.value) {
        resolve()
        return
      }

      const handleOnline = () => {
        window.removeEventListener('online', handleOnline)
        resolve()
      }

      window.addEventListener('online', handleOnline)
    })
  }

  onMounted(() => {
    updateOnlineStatus()
    window.addEventListener('online', updateOnlineStatus)
    window.addEventListener('offline', updateOnlineStatus)
  })

  onUnmounted(() => {
    window.removeEventListener('online', updateOnlineStatus)
    window.removeEventListener('offline', updateOnlineStatus)
  })

  return {
    isOnline: readonly(isOnline),
    lastOnline: readonly(lastOnline),
    lastOffline: readonly(lastOffline),
    checkConnectivity,
    waitForConnection
  }
}
