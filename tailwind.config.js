/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        bg: '#0E0F12',
        surface: '#15171C',
        border: '#2A2D34',
        text: '#EDEFF2',
        'text-muted': '#AAB1BC',
        accent: '#FF8A00',
        accent2: '#FFC857',
        info: '#3BA0FF',
        success: '#37D67A',
        danger: '#EF4444',
      },
      borderRadius: {
        'radius': '14px',
      },
      boxShadow: {
        'shadow-1': '0 1px 2px rgba(0,0,0,.2)',
        'shadow-2': '0 12px 24px rgba(0,0,0,.24)',
      },
      backgroundImage: {
        'gradient-pill': 'linear-gradient(135deg,#FF8A00 0%,#FFC857 30%,#3BA0FF 70%,#37D67A 100%)',
        'btn-primary': 'linear-gradient(135deg,#FF8A00 0%,#FFC857 40%,#3BA0FF 100%)',
      },
    },
  },
  plugins: [],
}

