import { plugins as prettyFormatPlugins, format as prettyFormat } from 'pretty-format'
import type { Plugin } from 'pretty-format'
import HtmlFormat from './plugins/html.js'

const {
  DOMCollection,
  DOMElement,
  Immutable,
  ReactElement,
  ReactTestComponent,
  AsymmetricMatcher,
} = prettyFormatPlugins

const builtinPlugins: Plugin[] = [
  ReactTestComponent,
  ReactElement,
  DOMElement,
  DOMCollection,
  Immutable,
  AsymmetricMatcher,
  HtmlFormat,
]

export function format (value: any, plugins: Plugin[]) {
  return prettyFormat(value, {
    escapeRegex: true,
    printFunctionName: false,
    indent: 2,
    plugins: [...builtinPlugins, ...plugins],
  })
}
