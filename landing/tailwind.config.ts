import type { Config } from 'tailwindcss';

const config: Config = {
  content: ['./app/**/*.{ts,tsx}', './components/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        ink: '#0A0A0A',
        shell: '#000000',
        cream: '#F7F3EE',
        moss: '#48CD8A',
        mossBright: '#3AB87A',
        warm: '#F2B872',
        mist: 'rgba(255,255,255,0.6)',
        mistFaint: 'rgba(255,255,255,0.1)',
      },
      fontFamily: {
        sans: ['var(--font-outfit)', 'system-ui', 'sans-serif'],
      },
      borderRadius: {
        luku: '16px',
        'luku-lg': '12px',
      },
      letterSpacing: {
        tagwide: '0.2em',
        cta: '0.125em',
      },
    },
  },
  plugins: [],
};

export default config;
