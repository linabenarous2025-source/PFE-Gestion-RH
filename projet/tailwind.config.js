
export default {content: [
  './index.html',
  './src/**/*.{js,ts,jsx,tsx}'
],
  theme: {
    extend: {
      colors: {
        navy: {
          DEFAULT: '#0A1628',
          light: '#132039',
          dark: '#060E1A',
        },
        royal: {
          DEFAULT: '#1D4ED8',
          light: '#2563EB',
        },
        sky: {
          DEFAULT: '#38BDF8',
          light: '#7DD3FC',
        },
      },
      fontFamily: {
        sans: ['Inter', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'sans-serif'],
      },
    },
  },
}
