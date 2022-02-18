import { ModuleFilterOption, PeekyConfig } from './types.js'

export function processConfig (config: PeekyConfig): PeekyConfig {
  config.buildInclude = normalizeModuleFilters(config.buildInclude)
  config.buildExclude = normalizeModuleFilters(config.buildExclude)
  if (config.coverageOptions?.reporter && !Array.isArray(config.coverageOptions.reporter)) {
    config.coverageOptions.reporter = [config.coverageOptions.reporter]
  }
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
