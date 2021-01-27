// @ts-nocheck
/* eslint-disable @typescript-eslint/no-var-requires */

const defaultTheme = require('tailwindcss/defaultTheme')

module.exports = {
  theme: {
    colors: {
      white: '#fff',
      black: '#000',

      gray: {
        50: '#fafafa',
        100: '#f4f4f5',
        200: '#e4e4e7',
        300: '#d4d4d8',
        400: '#a1a1aa',
        500: '#71717a',
        600: '#52525b',
        700: '#3f3f46',
        800: '#27272a',
        900: '#18181b',
      },

      flamingo: {
        50: '#f3f4fa',
        100: '#eae5fb',
        200: '#d7c7fa',
        300: '#c4a8fa',
        400: '#b47dfa',
        500: '#a451fb',
        600: '#8c34f8',
        700: '#6414ff',
        800: '#5724c8',
        900: '#4720a4',
      },
      orchid: {
        50: '#faf8fa',
        100: '#f8eef8',
        200: '#f2d1f3',
        300: '#ecaeee',
        400: '#ea7be6',
        500: '#e84fdd',
        600: '#d331c8',
        700: '#a526a4',
        800: '#792078',
        900: '#5d1b5b',
      },
      blush: {
        50: '#fcf9f8',
        100: '#fcf0f3',
        200: '#fad5e5',
        300: '#f8b0cf',
        400: '#f979a8',
        500: '#f94c7f',
        600: '#f12e59',
        700: '#cf2348',
        800: '#9f1d39',
        900: '#7c192e',
      },
      tomato: {
        50: '#fcf8f5',
        100: '#fcf0eb',
        200: '#fad9d3',
        300: '#f8b8ac',
        400: '#f88670',
        500: '#f85b43',
        600: '#ef392b',
        700: '#ce2b29',
        800: '#a22327',
        900: '#801d22',
      },
      chocolate: {
        50: '#fbf8f2',
        100: '#fbf2df',
        200: '#f8e3b5',
        300: '#f5ca78',
        400: '#f1a238',
        500: '#ee7a19',
        600: '#de5510',
        700: '#b73f13',
        800: '#8e3118',
        900: '#6f2817',
      },
      carrot: {
        50: '#fbf9f4',
        100: '#faf6df',
        200: '#f5ecad',
        300: '#eeda6a',
        400: '#e1b82a',
        500: '#d19510',
        600: '#b06f09',
        700: '#86540d',
        800: '#633f11',
        900: '#4c3212',
      },
      green: {
        50: '#f9faf7',
        100: '#f5f9eb',
        200: '#e8f1c7',
        300: '#d3e395',
        400: '#a2c850',
        500: '#6ba924',
        600: '#4b8616',
        700: '#3d6817',
        800: '#304e1a',
        900: '#263d19',
      },
      pacific: {
        50: '#f4f9fa',
        100: '#e6f7f6',
        200: '#c7eded',
        300: '#9cdde2',
        400: '#57c1d0',
        500: '#299fb8',
        600: '#1e7d99',
        700: '#206279',
        800: '#1e4b5b',
        900: '#1a3c48',
      },
      denim: {
        50: '#f4fafc',
        100: '#e4f6fb',
        200: '#c1e8f8',
        300: '#97d4f6',
        400: '#5baff4',
        500: '#2d86f1',
        600: '#2062e6',
        700: '#204dc7',
        800: '#1c3b95',
        900: '#183072',
      },
      royalblue: {
        50: '#f5fafd',
        100: '#e6f6fc',
        200: '#c4e5fa',
        300: '#9ecef9',
        400: '#68a5f9',
        500: '#3979f7',
        600: '#2755f1',
        700: '#2343d8',
        800: '#1e34a7',
        900: '#192b80',
      },
    },

    extend: {
      maxWidth: theme => ({
        ...theme('width'),
      }),

      screens: Object.keys(defaultTheme.screens).reduce((obj, key) => {
        const [rawMin] = defaultTheme.screens[key].split('px')
        const max = parseInt(rawMin) - 1
        obj[`!${key}`] = { max: `${max}px` }
        return obj
      }, {}),

      borderRadius: {
        sm: '0.25rem',
        DEFAULT: '0.375rem',
        md: '0.5rem',
        lg: '0.75rem',
        xl: '1rem',
        '2xl': '1.5rem',
        '3xl': '2rem',
      },
    },
  },
  variants: {
    extend: {},
  },
  purge: {
    content: [
      './docs/**/*.{vue,js,ts,jsx,tsx,md}',
      './docs/.vitepress/**/*.{vue,js,ts,jsx,tsx,md}',
    ],
    options: {
      safelist: ['html', 'body'],
    },
  },
  // darkMode: 'class', // or 'media' or 'class'
  plugins: [],
  corePlugins: {
    preflight: false,
  },
}
