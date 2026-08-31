/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        brand: {
          DEFAULT: '#57224B',
          muted: '#AB90A4',
          soft: '#BCA7B7',
          border: '#CDBCC8',
          tint: '#EDE4EA',
          surface: '#FBF7F9',
        },
        accent: {
          DEFAULT: '#FF7959',
          hover: '#E76B4F',
          soft: '#FFF1ED',
          pastel: '#FFF4C7',
          panel: '#FFFBFA',
          warm: '#ED806B',
          ring: '#F3A28D',
        },
        surface: {
          base: '#FFFEFD',
          page: '#FFFFFF',
          map: '#F5F0EB',
        },
        feedback: {
          error: '#FF6B6B',
        },
      },
      fontFamily: {
        cool: ['Roboto', 'Arial', 'sans-serif'],
      },
      boxShadow: {
        'app-sm': '0 2px 8px 3px rgba(0,0,0,0.10)',
        'app-md': '0 8px 18.2px 3px rgba(87,34,75,0.15)',
        'app-lg': '0 9px 50px 0 rgba(87,34,75,0.30)',
        'app-accent': '0 2px 11px 3px rgba(255,121,89,0.5)',
        'app-inset-warm': 'inset 0 0 6px rgba(255,217,203,0.40)',
        'app-inset-accent': 'inset 0 -4px 5.5px 0 rgba(255,180,153,0.2)',
      },
    },
  },
  plugins: [],
};
