<script lang="ts">
import 'xterm/css/xterm.css'

import { ref, onMounted, watch, onUnmounted, onActivated, computed, defineComponent, PropType } from 'vue'
import { IDisposable, Terminal } from 'xterm'
import { FitAddon } from 'xterm-addon-fit'
import { SearchAddon } from 'xterm-addon-search'
import { WebLinksAddon } from 'xterm-addon-web-links'
import { WebglAddon } from 'xterm-addon-webgl'
// @ts-ignore
import { ResizeObserver } from 'vue-resize'
import { useSettings } from '../settings'

const isWindows = ['Windows', 'Win16', 'Win32', 'WinCE'].includes(navigator.platform)

const isWebgl2Supported = (() => {
  let isSupported = window.WebGL2RenderingContext ? undefined : false
  return () => {
    if (isSupported === undefined) {
      const canvas = document.createElement('canvas')
      const gl = canvas.getContext('webgl2', { depth: false, antialias: false })
      isSupported = gl instanceof window.WebGL2RenderingContext
    }
    return isSupported
  }
})()

const defaultTheme = {
  foreground: '#1e1e25',
  background: '#fff',
  cursor: '#ccc',
  cursorAccent: '#ddd',
  selection: '#00000040',
  black: '#000000',
  red: '#e83030',
  brightRed: '#e83030',
  green: '#42b983',
  brightGreen: '#42b983',
  brightYellow: '#ea6e00',
  yellow: '#ea6e00',
  magenta: '#e83030',
  brightMagenta: '#e83030',
  cyan: '#03c2e6',
  brightBlue: '#03c2e6',
  brightCyan: '#03c2e6',
  blue: '#03c2e6',
  white: '#d0d0d0',
  brightBlack: '#808080',
  brightWhite: '#ffffff',
}

const darkTheme = {
  ...defaultTheme,
  foreground: '#fff',
  background: '#1e1e25',
  cursor: '#A0AEC0',
  selection: '#ffffff40',
  magenta: '#e83030',
  brightMagenta: '#e83030',
}

export default defineComponent({
  components: {
    ResizeObserver,
  },

  props: {
    logs: {
      type: Array as PropType<{ type: 'stdout' | 'stderr', text: string }[]>,
      required: true,
    },
  },

  setup (props) {
    const listeners: IDisposable[] = []

    // Theme
    const { settings } = useSettings()

    const currentTheme = computed(() => {
      if (settings.value?.darkMode) {
        return darkTheme
      }
      return defaultTheme
    })

    watch(currentTheme, value => {
      if (term) {
        term.options.theme = value
      }
    })

    // XTerminal

    const fitAddon = new FitAddon()
    const searchAddon = new SearchAddon()

    let term: Terminal

    const el = ref(null)
    const xtermTarget = ref<HTMLElement | null>(null)

    function createTerminal () {
      if (!term && xtermTarget.value) {
        term = new Terminal({
          theme: currentTheme.value,
          scrollback: 4000,
          windowsMode: isWindows,
          macOptionIsMeta: true,
          fontSize: 12,
          disableStdin: true,
          convertEol: true,
          fontFamily: 'Fira Code',
        })

        // Addons

        term.loadAddon(fitAddon)
        term.loadAddon(searchAddon)
        term.loadAddon(new WebLinksAddon(undefined, undefined, true))

        term.open(xtermTarget.value)

        if (isWebgl2Supported()) {
          term.loadAddon(new WebglAddon())
        }

        // Scroll
        // listeners.push(term.onScroll(position => {
        //   cached.scroll = position
        // }))

        term.attachCustomKeyEventHandler((key: KeyboardEvent) => {
          // Copy
          if (key.code === 'KeyC' && (key.ctrlKey || key.metaKey)) {
            navigator.clipboard.writeText(term.getSelection())
            return false
          }
          return true
        })
      }

      // Init
      fitAddon.fit()
      term.focus()
      // Initial size is undefined on the server

      term.options.theme = currentTheme.value

      // https://github.com/xtermjs/xterm.js/issues/291
      // term.scrollToLine(cached.scroll)
      // term._core._onScroll.fire(cached.scroll)

      for (const log of props.logs) {
        term.writeln(log.text)
      }
    }

    onMounted(() => {
      createTerminal()
    })

    onActivated(() => {
      createTerminal()
    })

    onUnmounted(() => {
      for (const off of listeners) {
        off.dispose()
      }
      listeners.length = 0
    })

    // Element resize
    function onElResize () {
      if (term) {
        fitAddon.fit()
      }
    }

    watch(() => props.logs, value => {
      term.clear()
      for (const log of props.logs) {
        term.writeln(log.text)
      }
    })

    return {
      el,
      xtermTarget,
      onElResize,
    }
  },
})
</script>

<template>
  <div
    ref="el"
    class="relative p-2 overflow-hidden"
  >
    <div
      ref="xtermTarget"
      class="w-full h-full"
    />

    <resize-observer @notify="onElResize()" />
  </div>
</template>
