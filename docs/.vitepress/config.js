module.exports = {
  title: 'Peeky',
  description: 'A test framework for the curious minds',

  head: [
    ['link', { rel: 'stylesheet', href: 'https://cdn.rawgit.com/luizbills/feather-icon-font/v4.7.0/dist/feather.css' }],
  ],

  themeConfig: {
    repo: 'Akryum/peeky',
    docsDir: 'docs',
    docsBranch: 'main',
    editLinks: true,
    editLinkText: 'Suggest changes to this page',
    logo: 'logo.svg',

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
            {
              text: 'Writing tests',
              link: '/guide/writing-tests',
            },
            {
              text: 'Configuration',
              link: '/guide/config',
            },
          ],
        },
      ],
    },
  },
}
