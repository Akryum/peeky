/// <reference types="@peeky/test" />

import path from "path"
import { defineConfig } from "vite"
import { createVuePlugin } from "vite-plugin-vue2"
import WindiCSS from "vite-plugin-windicss"

// console.log('loaded vite config', new Error().stack)

const config = defineConfig({
  resolve: {
    alias: {
      "@": `${path.resolve(__dirname, "src")}`,
    },
    dedupe: ["vue-demi"],
  },

  plugins: [
    createVuePlugin(),
    WindiCSS(),
  ],

  test: {
    runtimeEnv: "dom",
    buildExclude: ["vue-template-compiler"],
  },
})

export default config
