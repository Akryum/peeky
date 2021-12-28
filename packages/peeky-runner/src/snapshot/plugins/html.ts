import beautify from 'diffable-html'

// Detection

const isHtmlString = received => received && typeof received === 'string' && received[0] === '<'

// Cleaning

const removeServerRenderedText = html => html.replace(/ data-server-rendered="true"/, '')
// [-\w]+ will catch 1 or more instances of a-z, A-Z, 0-9, hyphen (-), or underscore (_)
const removeDataTestAttributes = html => html.replace(/ data-test="[-\w]+"/g, '')

export default {
  test (received) {
    return isHtmlString(received)
  },
  print (received) {
    let html = received || ''
    html = removeServerRenderedText(html)
    html = removeDataTestAttributes(html)
    return beautify(html).trim()
  },
}
