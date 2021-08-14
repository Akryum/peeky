import { onUnmounted, Ref, watch } from 'vue'

export function onResize (elRef: Ref<HTMLElement | undefined>, callback: () => void) {
  const observer = new ResizeObserver(() => {
    callback()
  })
  watch(elRef, (el, oldEl, onInvalidate) => {
    if (!el) return
    observer.observe(el)
    onInvalidate(() => {
      observer.unobserve(el)
    })
  }, {
    immediate: true,
  })

  onUnmounted(() => {
    observer.disconnect()
  })
}
