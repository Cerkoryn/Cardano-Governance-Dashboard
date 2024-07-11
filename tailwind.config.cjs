/** @type {import('tailwindcss').Config} */
export default {
  content: [
    './src/**/*.{html,js,svelte,ts,css}', 
    './static/**/*.{html,js,svelte,ts,css}',
    './build/**/*.{html,js,svelte,ts,css}',
    './.svelte-kit/**/*.{html,js,svelte,ts,css}'
  ],
  theme: {
    extend: {},
  },
  plugins: [],
}

