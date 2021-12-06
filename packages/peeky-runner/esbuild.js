require('esbuild').buildSync({
  entryPoints: ['./src/index.ts', './src/runtime/worker.ts'],
  bundle: true,
  platform: 'node',
  outdir: 'dist',
  external: [
    'fsevents',
    'esbuild',
    '@peeky/*',
    'expect',
    'sinon',
    'source-map',
    'source-map-support',
    'rollup-plugin-esbuild',
    'jsonc-parser',
  ],
  sourcemap: true,
})
