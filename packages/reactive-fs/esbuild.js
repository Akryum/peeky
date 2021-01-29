require('esbuild').buildSync({
  entryPoints: ['./src/index.ts'],
  bundle: true,
  platform: 'node',
  outdir: 'dist',
  external: [
    'fsevents',
  ],
  sourcemap: true,
})
