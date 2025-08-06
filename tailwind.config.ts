import type { Config } from 'tailwindcss'

const config: Config = {
  darkMode: ["class"],
  content: [
    './pages/**/*.{ts,tsx}',
    './components/**/*.{ts,tsx}',
    './app/**/*.{ts,tsx}',
    './src/**/*.{ts,tsx}',
  ],
  theme: {
    container: {
      center: true,
      padding: "2rem",
      screens: {
        "2xl": "1400px",
      },
    },
    extend: {
      colors: {
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        primary: {
          DEFAULT: "#F7D774",
          foreground: "#2D2D2D",
        },
        secondary: {
          DEFAULT: "#2E5E4E",
          foreground: "#FFFFFF",
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
        },
        muted: {
          DEFAULT: "#F3F3F3",
          foreground: "#2D2D2D",
        },
        accent: {
          DEFAULT: "#AEE1F6",
          foreground: "#2D2D2D",
        },
        popover: {
          DEFAULT: "hsl(var(--popover))",
          foreground: "hsl(var(--popover-foreground))",
        },
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
        // Brand colors (Updated to match landing page)
        'brand-yellow': '#F7D774',
        'brand-green': '#2E5E4E',
        'brand-charcoal': '#c1d0d3',
        'brand-gray': '#F3F3F3',
        'brand-blue': '#63b5e4',
        // Additional colors from landing page
        'brand-tree-dark': '#2e5e4e',
        'brand-tree-medium': '#65962c',
        'brand-tree-light': '#80cc28',
        'brand-brown-dark': '#8d5b31',
        'brand-brown-light': '#9b6736',
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
      keyframes: {
        "accordion-down": {
          from: { height: "0" },
          to: { height: "var(--radix-accordion-content-height)" },
        },
        "accordion-up": {
          from: { height: "var(--radix-accordion-content-height)" },
          to: { height: "0" },
        },
        "gentle-pulse": {
          "0%, 100%": { opacity: "0.3", transform: "scale(1)" },
          "50%": { opacity: "0.8", transform: "scale(1.05)" },
        },
        "float": {
          "0%, 100%": { transform: "translateY(0px)" },
          "50%": { transform: "translateY(-10px)" },
        },
        "drift": {
          "0%, 100%": { transform: "translateX(0px) translateY(0px)" },
          "25%": { transform: "translateX(5px) translateY(-5px)" },
          "50%": { transform: "translateX(-5px) translateY(-10px)" },
          "75%": { transform: "translateX(-3px) translateY(-2px)" },
        },
        "shimmer": {
          "0%": { backgroundPosition: "-200% 0" },
          "100%": { backgroundPosition: "200% 0" },
        },
      },
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
        "gentle-pulse": "gentle-pulse 4s ease-in-out infinite",
        "float": "float 3s ease-in-out infinite",
        "drift": "drift 6s ease-in-out infinite",
        "shimmer": "shimmer 2s infinite linear",
      },
      fontFamily: {
        sans: ['var(--font-inter)', 'Inter', 'sans-serif'],
        heading: ['var(--font-poppins)', 'Poppins', 'sans-serif'],
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
}

export default config
