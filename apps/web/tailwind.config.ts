import zenPreset from '@umami/react-zen/tailwind-preset';

export default {
  presets: [zenPreset],
  content: [
    './index.html',
    './src/**/*.{ts,tsx,js,jsx}',
    './node_modules/@umami/react-zen/dist/**/*.{js,mjs,css}',
  ],
  theme: {
    extend: {
      colors: {
        primary: '#D410AB'
      },
      fontFamily: {
        sans: ["Didact Gothic", 'Inter', 'ui-sans-serif', 'system-ui']
      }
    },
  },
  plugins: [],
};
