const { colors, radius, fonts, fontSize } = require('./src/shared/theme/tokens');

const px = (obj) => Object.fromEntries(Object.entries(obj).map(([k, v]) => [k, `${v}px`]));

/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./src/**/*.{js,jsx,ts,tsx}'],
  presets: [require('nativewind/preset')],
  // Hiện chỉ có chế độ sáng; 'class' để không tự đổi theo hệ điều hành.
  darkMode: 'class',
  theme: {
    extend: {
      screens: { roomy: '400px' },
      colors,
      borderRadius: px(radius),
      fontFamily: {
        sans: [fonts.regular],
        'sans-medium': [fonts.medium],
        'sans-semibold': [fonts.semibold],
        'sans-bold': [fonts.bold],
        'sans-extrabold': [fonts.extrabold],
      },
      fontSize: Object.fromEntries(
        Object.entries(fontSize).map(([k, [size, lh]]) => [k, [`${size}px`, { lineHeight: `${lh}px` }]]),
      ),
    },
  },
  plugins: [],
};
