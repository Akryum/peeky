require('esbuild').buildSync({
  entryPoints: ['./src/index.ts', './src/standalone.ts'],
  bundle: true,
  platform: 'node',
  outdir: 'dist',
  external: [
    'fsevents',
    '@peeky/*',
  ],
  sourcemap: true,
})
