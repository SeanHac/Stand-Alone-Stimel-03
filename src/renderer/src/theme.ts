import { createTheme, rem, type MantineColorsTuple } from '@mantine/core'

/**
 * Motion Informatics brand theme.
 *
 * Colours are taken from the logo: a deep navy for primary actions and
 * headings, with a lighter teal used sparingly as an accent.
 */

const brand: MantineColorsTuple = [
  '#eef4fa',
  '#d8e6f2',
  '#aecae4',
  '#81acd5',
  '#5c92c8',
  '#4482c1',
  '#2c5f9e',
  '#234e85',
  '#1a3d69',
  '#0e3b54'
]

const teal: MantineColorsTuple = [
  '#e9f4f8',
  '#d3e7ee',
  '#a6cedd',
  '#75b3cb',
  '#4d9cbc',
  '#348eb3',
  '#2d7f9d',
  '#22687f',
  '#1a5266',
  '#123f5e'
]

export const theme = createTheme({
  primaryColor: 'brand',
  primaryShade: { light: 6, dark: 5 },

  colors: {
    brand,
    teal
  },

  // System stack. If the brand typeface is licensed for desktop use, add the
  // font files to src/renderer/src/assets/fonts and put its name first.
  fontFamily:
    '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',

  headings: {
    fontWeight: '600',
    sizes: {
      h1: { fontSize: rem(30), lineHeight: '1.3' },
      h2: { fontSize: rem(24), lineHeight: '1.35' },
      h3: { fontSize: rem(20), lineHeight: '1.4' },
      h4: { fontSize: rem(17), lineHeight: '1.45' }
    }
  },

  defaultRadius: 'md',

  components: {
    Button: {
      defaultProps: { radius: 'md' },
      styles: { root: { fontWeight: 600 } }
    },

    // Clinical tables carry a lot of rows. Tighter than Mantine's default.
    Table: {
      defaultProps: { verticalSpacing: 'xs', horizontalSpacing: 'md', fontSize: 'sm' }
    },

    Modal: {
      defaultProps: { radius: 'md', centered: true, overlayProps: { blur: 2 } },
      styles: { title: { fontWeight: 600, fontSize: rem(17) } }
    },

    TextInput: { defaultProps: { radius: 'md' } },
    PasswordInput: { defaultProps: { radius: 'md' } },
    Select: { defaultProps: { radius: 'md' } },
    Textarea: { defaultProps: { radius: 'md' } },
    DateInput: { defaultProps: { radius: 'md' } },

    Paper: { defaultProps: { radius: 'md' } }
  }
})
