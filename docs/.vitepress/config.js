module.exports = {
  title: 'Peeky',
  description: 'A test framework for the curious minds',
  themeConfig: {
    repo: 'Akryum/peeky',
    docsDir: 'docs',
    docsBranch: 'main',
    editLinks: true,
    editLinkText: 'Suggest changes to this page',

    nav: [
      { text: 'Guide', link: '/guide/' },
      {
        text: '💜️ Sponsor',
        link: 'https://github.com/sponsors/Akryum',
      },
    ],

    sidebar: {
      // catch-all fallback
      '/': [
        {
          text: 'Guide',
          children: [
            {
              text: 'Introduction',
              link: '/guide/introduction',
            },
            {
              text: 'Getting Started',
              link: '/guide/',
            },
          ],
        },
      ],
    },
  },
}
