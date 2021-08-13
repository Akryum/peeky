const config = module.exports = require('./packages/peeky-client/tailwind.config')
config.purge = [
  './docs/**/*.{vue,js,ts,jsx,tsx,md}',
  './docs/.vitepress/**/*.{vue,js,ts,jsx,tsx,md}',
]
config.corePlugins = {
  preflight: false,
}
