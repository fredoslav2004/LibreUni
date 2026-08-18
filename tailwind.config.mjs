/** @type {import('tailwindcss').Config} */
import typography from '@tailwindcss/typography';

export default {
  content: ['./src/**/*.{astro,html,js,jsx,md,mdx,ts,tsx,json}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        primary: 'rgb(var(--primary-rgb) / <alpha-value>)',
        'primary-dark': 'rgb(var(--primary-dark-rgb) / <alpha-value>)',
        'primary-foreground': 'rgb(var(--primary-foreground-rgb) / <alpha-value>)',
        secondary: 'rgb(var(--secondary-rgb) / <alpha-value>)',
        'secondary-dark': 'rgb(var(--secondary-dark-rgb) / <alpha-value>)',
        accent: 'rgb(var(--accent-rgb) / <alpha-value>)',
        'accent-dark': 'rgb(var(--accent-dark-rgb) / <alpha-value>)',
        dark: {
          bg: 'rgb(var(--dark-bg-rgb) / <alpha-value>)',
          surface: 'rgb(var(--dark-surface-rgb) / <alpha-value>)',
          border: 'rgb(var(--dark-border-rgb) / <alpha-value>)',
          text: 'rgb(var(--dark-text-rgb) / <alpha-value>)',
          muted: 'rgb(var(--dark-muted-rgb) / <alpha-value>)',
          accent: 'rgb(var(--dark-accent-rgb) / <alpha-value>)'
        },
        light: {
          bg: 'rgb(var(--light-bg-rgb) / <alpha-value>)',
          surface: 'rgb(var(--light-surface-rgb) / <alpha-value>)',
          border: 'rgb(var(--light-border-rgb) / <alpha-value>)',
          text: 'rgb(var(--light-text-rgb) / <alpha-value>)',
          muted: 'rgb(var(--light-muted-rgb) / <alpha-value>)',
          accent: 'rgb(var(--light-accent-rgb) / <alpha-value>)'
        }
      },
      fontFamily: {
        sans: ['var(--font-sans)', 'sans-serif'],
      },
      animation: {
        'gradient-x': 'gradient-x 15s ease infinite',
        'float': 'float 6s ease-in-out infinite',
        'pulse-soft': 'pulse-soft 4s ease-in-out infinite',
      },
      keyframes: {
        'gradient-x': {
          '0%, 100%': { 'background-size': '200% 200%', 'background-position': 'left center' },
          '50%': { 'background-size': '200% 200%', 'background-position': 'right center' },
        },
        'float': {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-20px)' },
        },
        'pulse-soft': {
          '0%, 100%': { opacity: 1 },
          '50%': { opacity: 0.8 },
        }
      },
      backgroundImage: {
        'gradient-radial': 'radial-gradient(var(--tw-gradient-stops))',
        'glass-gradient': 'linear-gradient(to bottom right, rgba(255, 255, 255, 0.1), rgba(255, 255, 255, 0.05))',
      }
    },
  },
  plugins: [
    typography,
  ],
}
