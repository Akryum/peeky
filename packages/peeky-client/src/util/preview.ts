export function getIframeHtml (html: string, previewImports: string[]) {
  let result = html
  if (previewImports) {
    // Import module
    result += previewImports.map(i => `<script type="module" src="${i}"></script>`).join('\n')
  }
  return result
}
