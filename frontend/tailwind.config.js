/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: '#0A3D7A',
          light: '#1A5FA8',
          dark: '#062852',
        },
        accent: {
          DEFAULT: '#FF9500',
          dark: '#E07000',
          glow: '#FFA500',
        },
        success: '#1DB954',
        warning: '#F59E0B',
        danger: '#EF4444',
        neutral: {
          50: '#FFF8ED',
          100: '#F1F5F9',
          200: '#E2E8F0',
          300: '#CBD5E1',
          600: '#526071',
        },
        dark: '#0D1B2A',
        surface: {
          glass: 'rgba(255, 255, 255, 0.7)',
          glassDark: 'rgba(13, 27, 42, 0.7)',
        }
      },
      fontFamily: {
        display: ['"Baloo 2"', 'cursive'],
        body: ['"Noto Sans"', 'sans-serif'],
        mono: ['"Fira Code"', 'monospace'],
      },
      borderRadius: {
        card: '24px',
        badge: '20px',
        pill: '9999px',
        '2xl': '1rem',
        '3xl': '1.5rem',
        '4xl': '2rem',
      },
      boxShadow: {
        card: '0 4px 24px rgba(10,61,122,0.08)',
        glass: '0 8px 32px 0 rgba(31, 38, 135, 0.07)',
        premium: '0 20px 50px rgba(0,0,0,0.05)',
        glow: '0 0 20px rgba(255, 149, 0, 0.3)',
      },
      animation: {
        'fade-in': 'fadeIn 0.5s ease-out',
        'slide-up': 'slideUp 0.6s ease-out',
        'float': 'float 6s ease-in-out infinite',
        'pulse-slow': 'pulse 4s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'shimmer-sweep': 'shimmerSweep 2.4s ease-in-out infinite',
        'shimmer-fast': 'shimmerSweep 1.7s linear infinite',
        'confetti': 'confettiPop 2.8s ease-in-out infinite',
        'banner-sweep': 'bannerSweep 2.0s linear infinite',
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
        float: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-20px)' },
        },
        shimmerSweep: { '0%': { left: '-70%' }, '100%': { left: '140%' } },
        confettiPop: {
          '0%': { opacity: '0', transform: 'translateY(0)     scale(0)    rotate(0deg)' },
          '12%': { opacity: '1', transform: 'translateY(-8px)  scale(1)    rotate(30deg)' },
          '55%': { opacity: '0.8', transform: 'translateY(-30px) scale(0.75) rotate(200deg)' },
          '100%': { opacity: '0', transform: 'translateY(-52px) scale(0)    rotate(400deg)' }
        },
        bannerSweep: { '0%': { left: '-80%' }, '100%': { left: '160%' } },
      },
      backdropBlur: {
        xs: '2px',
      }
    },
  },
  safelist: [
    'animate-[closeGlow_3s_ease-in-out_infinite]',
    'animate-[readyGlow_2s_ease-in-out_infinite]',
    'animate-[prizeGlow_2s_ease-in-out_infinite]',
    'animate-[pulse_1.4s_ease-in-out_infinite]',
    'animate-[pulse_2s_ease-in-out_infinite]',
    'animate-[pulse_3s_ease-in-out_infinite]',
    'bg-[length:200%]',
  ],
  plugins: [],
}
