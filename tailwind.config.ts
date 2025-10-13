import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      // Mobile-first breakpoints (defaults are already mobile-first)
      screens: {
        'xs': '475px',
        // sm: '640px' (default)
        // md: '768px' (default)
        // lg: '1024px' (default)
        // xl: '1280px' (default)
        // 2xl: '1536px' (default)
      },

      // Custom colors for map markers and status
      colors: {
        status: {
          prospect: '#3b82f6',      // Blue
          customer: '#22c55e',       // Green
          followup: '#eab308',       // Yellow
          notinterested: '#ef4444',  // Red
          revisit: '#f97316',        // Orange
          possibility: '#a855f7',    // Purple
        },
      },

      // Safe area insets for iOS
      spacing: {
        'safe-top': 'env(safe-area-inset-top)',
        'safe-bottom': 'env(safe-area-inset-bottom)',
        'safe-left': 'env(safe-area-inset-left)',
        'safe-right': 'env(safe-area-inset-right)',
      },

      // Touch-friendly sizes
      minHeight: {
        'touch': '44px', // iOS recommended minimum touch target
      },
      minWidth: {
        'touch': '44px',
      },
    },
  },
  plugins: [],
};

export default config;
