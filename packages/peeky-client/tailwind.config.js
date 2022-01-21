// @ts-nocheck
/* eslint-disable @typescript-eslint/no-var-requires */

const defaultTheme = require('tailwindcss/defaultTheme')

module.exports = {
  theme: {
    colors: {
      white: '#fff',
      black: '#000',
      dark: '#1e1e25',
      transparent: 'transparent',
      current: 'currentColor',

      gray: {
        50: '#f6f7f7',
        100: '#edeeef',
        200: '#d2d5d8',
        300: '#b7bbc1',
        400: '#818892',
        500: '#4b5563',
        600: '#444d59',
        700: '#38404a',
        800: '#2d333b',
        900: '#252a31',
        950: '#1f2329',
      },

      primary: {
        50: '#f9f5fd',
        100: '#f2eafc',
        200: '#dfcbf7',
        300: '#cbacf2',
        400: '#a56de9',
        500: '#7e2fdf',
        600: '#712ac9',
        700: '#5f23a7',
        800: '#4c1c86',
        900: '#3e176d',
      },

      red: {
        50: '#fef5f7',
        100: '#feeaee',
        200: '#fccbd6',
        300: '#f9abbd',
        400: '#f56d8b',
        500: '#f12e59',
        600: '#c9284b',
        700: '#9e1f3b',
        800: '#681527',
        900: '#4f111e',
      },

      orange: {
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

      yellow: {
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
        50: '#e8f8f6',
        100: '#c9f7ee',
        200: '#95f3d9',
        300: '#53ebc0',
        400: '#15de99',
        500: '#06cb70',
        600: '#06b457',
        700: '#0b964c',
        800: '#0f7743',
        900: '#0f613a',
      },

      cyan: {
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

      blue: {
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
    },

    extend: {
      maxWidth: theme => ({
        ...theme('width'),
      }),

      maxHeight: theme => ({
        ...theme('height'),
      }),

      minWidth: theme => ({
        ...theme('width'),
      }),

      minHeight: theme => ({
        ...theme('height'),
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

      cursor: {
        'ew-resize': 'ew-resize',
        'ns-resize': 'ns-resize',
        'cursor-not-allowed': 'cursor-not-allowed',
      },
    },
  },
  content: [
    './index.html',
    './src/**/*.{vue,js,ts,jsx,tsx}',
  ],
  darkMode: 'class', // or 'media' or 'class'
  plugins: [],
}
