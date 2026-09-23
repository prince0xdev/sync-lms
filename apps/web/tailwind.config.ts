import zenPreset from '@umami/react-zen/tailwind-preset';

export default {
  presets: [zenPreset],
  content: [
    './src/**/*.{ts,tsx}',
    './node_modules/@umami/react-zen/dist/**/*.{js,mjs}',
  ],
};