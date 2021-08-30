require('esbuild').buildSync({
  entryPoints: ['./src/index.ts', './src/worker.ts'],
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
  ],
  sourcemap: true,
})
