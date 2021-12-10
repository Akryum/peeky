import { ModuleFilterOption, PeekyConfig } from './types.js'

export function processConfig (config: PeekyConfig): PeekyConfig {
  config.buildInclude = normalizeModuleFilters(config.buildInclude)
  config.buildExclude = normalizeModuleFilters(config.buildExclude)
  return config
}

function normalizeModuleFilters (filters: ModuleFilterOption) {
  const filtersList = Array.isArray(filters) ? filters : [filters]
  return filtersList.map(filter => {
    if (typeof filter === 'string' && !filter.includes('node_modules')) {
      filter = `/node_modules/${filter}`
    }
    return filter
  })
}
