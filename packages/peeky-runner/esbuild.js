require('esbuild').buildSync({
  entryPoints: ['./src/index.ts', './src/worker.ts'],
  bundle: true,
  platform: 'node',
  outdir: 'dist',
  external: [
    'fsevents',
    'esbuild',
    '@peeky/*',
    'must',
    'sinon',
  ],
  sourcemap: true,
})
