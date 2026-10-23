export function isMobileDevice() {
  if (typeof navigator === 'undefined') return false
  const userAgent = navigator.userAgent.toLowerCase()
  return /android|iphone|ipad|ipod|mobile/.test(userAgent)
    || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1)
}

export function openAppWithFallback(appHref: string, fallbackHref?: string) {
  if (typeof window === 'undefined' || typeof document === 'undefined') return

  let leftPage = false
  let fallbackTimer = 0
  const cleanup = () => {
    window.clearTimeout(fallbackTimer)
    document.removeEventListener('visibilitychange', onVisibilityChange)
    window.removeEventListener('pagehide', onPageHide)
  }
  const onVisibilityChange = () => {
    if (document.hidden) {
      leftPage = true
      cleanup()
    }
  }
  const onPageHide = () => {
    leftPage = true
    cleanup()
  }

  document.addEventListener('visibilitychange', onVisibilityChange)
  window.addEventListener('pagehide', onPageHide, { once: true })
  window.location.href = appHref
  fallbackTimer = window.setTimeout(() => {
    cleanup()
    if (fallbackHref && !leftPage && !document.hidden) window.location.href = fallbackHref
  }, 1400)
}

export async function copyText(value: string) {
  if (typeof navigator === 'undefined' || typeof document === 'undefined') return false

  try {
    if (navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(value)
      return true
    }
  } catch {
    // Fall through to the temporary selection fallback.
  }

  const input = document.createElement('textarea')
  input.value = value
  input.setAttribute('readonly', '')
  input.style.position = 'fixed'
  input.style.left = '-9999px'
  input.style.opacity = '0'
  document.body.append(input)
  input.select()
  try {
    return document.execCommand('copy')
  } finally {
    input.remove()
  }
}
