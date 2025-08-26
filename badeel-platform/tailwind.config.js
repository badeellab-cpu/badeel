/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          50: '#e6f4ff',
          100: '#bae7ff',
          200: '#91d5ff',
          300: '#69c0ff',
          400: '#40a9ff',
          500: '#1890ff',
          600: '#0077c2',
          700: '#096dd9',
          800: '#0050b3',
          900: '#003a8c',
        },
        secondary: {
          50: '#e6f9f3',
          100: '#b3eed9',
          200: '#80e0bf',
          300: '#69c69d',
          400: '#52cc99',
          500: '#3bb878',
          600: '#52c41a',
          700: '#389e0d',
          800: '#237804',
          900: '#135200',
        },
        accent: {
          50: '#f6f6f6',
          100: '#e7e7e7',
          200: '#d1d1d1',
          300: '#b0b0b0',
          400: '#888888',
          500: '#6d6d6d',
          600: '#5d5d5d',
          700: '#4f4f4f',
          800: '#454545',
          900: '#333333',
        },
        brand: {
          blue: '#0077c2',
          blueSecondary: '#0062a3',
          green: '#69c69d',
          dark: '#333333',
          lightBlue: '#40a9ff',
        },
        gold: '#ffd700',
        silver: '#c0c0c0',
        bronze: '#cd7f32'
      },
      fontFamily: {
        'arabic': ['Cairo', 'sans-serif'],
      },
      animation: {
        'fade-in': 'fadeIn 0.5s ease-in-out',
        'slide-up': 'slideUp 0.5s ease-out',
        'slide-down': 'slideDown 0.5s ease-out',
        'scale-up': 'scaleUp 0.3s ease-out',
        'bounce-slow': 'bounce 2s infinite',
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'float': 'float 6s ease-in-out infinite',
        'float-delayed': 'float 6s ease-in-out infinite 2s',
        'wiggle': 'wiggle 1s ease-in-out infinite',
        'glow': 'glow 2s ease-in-out infinite alternate',
        'spin-slow': 'spin 8s linear infinite',
        'ping-slow': 'ping 3s cubic-bezier(0, 0, 0.2, 1) infinite',
        'morph': 'morph 4s ease-in-out infinite',
        'dance': 'dance 2s ease-in-out infinite',
        'blob': 'blob 7s infinite',
        'tilt': 'tilt 10s infinite linear',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { transform: 'translateY(20px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        slideDown: {
          '0%': { transform: 'translateY(-20px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        scaleUp: {
          '0%': { transform: 'scale(0.9)', opacity: '0' },
          '100%': { transform: 'scale(1)', opacity: '1' },
        },
        float: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-20px)' },
        },
        wiggle: {
          '0%, 100%': { transform: 'rotate(-3deg)' },
          '50%': { transform: 'rotate(3deg)' },
        },
        glow: {
          '0%': { boxShadow: '0 0 20px rgba(20, 184, 166, 0.5)' },
          '100%': { boxShadow: '0 0 40px rgba(20, 184, 166, 0.8)' },
        },
        morph: {
          '0%, 100%': { borderRadius: '60% 40% 30% 70% / 60% 30% 70% 40%' },
          '50%': { borderRadius: '30% 60% 70% 40% / 50% 60% 30% 60%' },
        },
        dance: {
          '0%, 100%': { transform: 'translateX(0px) rotate(0deg)' },
          '25%': { transform: 'translateX(10px) rotate(1deg)' },
          '75%': { transform: 'translateX(-10px) rotate(-1deg)' },
        },
        blob: {
          '0%': { transform: 'translate(0px, 0px) scale(1)' },
          '33%': { transform: 'translate(30px, -50px) scale(1.1)' },
          '66%': { transform: 'translate(-20px, 20px) scale(0.9)' },
          '100%': { transform: 'translate(0px, 0px) scale(1)' },
        },
        tilt: {
          '0%, 50%, 100%': { transform: 'rotate(0deg)' },
          '25%': { transform: 'rotate(1deg)' },
          '75%': { transform: 'rotate(-1deg)' },
        },
      },
      backgroundImage: {
        'gradient-radial': 'radial-gradient(var(--tw-gradient-stops))',
        'gradient-conic': 'conic-gradient(from 180deg at 50% 50%, var(--tw-gradient-stops))',
        'brand-gradient': 'linear-gradient(135deg, #0077c2 0%, #0062a3 25%, #69c69d 75%, #40a9ff 100%)',
        'blue-gradient': 'linear-gradient(45deg, #0077c2, #0062a3, #40a9ff)',
        'brand-mesh': 'linear-gradient(135deg, #0077c2 0%, #69c69d 50%, #0062a3 100%)',
      },
    },
  },
  plugins: [
    require('@tailwindcss/forms'),
    require('@tailwindcss/typography'),
  ],
}