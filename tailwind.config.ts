
import type { Config } from "tailwindcss";

export default {
	darkMode: ["class"],
	content: [
		"./pages/**/*.{ts,tsx}",
		"./components/**/*.{ts,tsx}",
		"./app/**/*.{ts,tsx}",
		"./src/**/*.{ts,tsx}",
	],
	prefix: "",
	theme: {
		container: {
			center: true,
			padding: '2rem',
			screens: {
				'2xl': '1400px'
			}
		},
		extend: {
			colors: {
				border: 'hsl(var(--border))',
				input: 'hsl(var(--input))',
				ring: 'hsl(var(--ring))',
				background: 'hsl(var(--background))',
				foreground: 'hsl(var(--foreground))',
				primary: {
					DEFAULT: 'hsl(var(--primary))',
					foreground: 'hsl(var(--primary-foreground))'
				},
				secondary: {
					DEFAULT: 'hsl(var(--secondary))',
					foreground: 'hsl(var(--secondary-foreground))'
				},
				destructive: {
					DEFAULT: 'hsl(var(--destructive))',
					foreground: 'hsl(var(--destructive-foreground))'
				},
				muted: {
					DEFAULT: 'hsl(var(--muted))',
					foreground: 'hsl(var(--muted-foreground))'
				},
				accent: {
					DEFAULT: 'hsl(var(--accent))',
					foreground: 'hsl(var(--accent-foreground))'
				},
				popover: {
					DEFAULT: 'hsl(var(--popover))',
					foreground: 'hsl(var(--popover-foreground))'
				},
				card: {
					DEFAULT: 'hsl(var(--card))',
					foreground: 'hsl(var(--card-foreground))'
				},
				sidebar: {
					DEFAULT: 'hsl(var(--sidebar-background))',
					foreground: 'hsl(var(--sidebar-foreground))',
					primary: 'hsl(var(--sidebar-primary))',
					'primary-foreground': 'hsl(var(--sidebar-primary-foreground))',
					accent: 'hsl(var(--sidebar-accent))',
					'accent-foreground': 'hsl(var(--sidebar-accent-foreground))',
					border: 'hsl(var(--sidebar-border))',
					ring: 'hsl(var(--sidebar-ring))'
				},
				// Custom cyberpunk colors
				cyber: {
					'bg': '#0d0e19',
					'accent': '#00ffc8',
					'neon': '#fe53bb',
					'highlight': '#09a8fa',
					'warning': '#ffcc00',
					'dark': '#131426',
					// Add the new cyber theme colors
					'darker': '#050508',
					'accent-purple': '#8b5cf6',
					'accent-bright': '#a855f7',
					'secondary': '#f59e0b',
					'secondary-bright': '#fbbf24',
					'text': '#e2e8f0',
					'text-muted': '#94a3b8',
					'border': '#1e293b',
					'grid': '#1a1a2e'
				}
			},
			borderRadius: {
				lg: 'var(--radius)',
				md: 'calc(var(--radius) - 2px)',
				sm: 'calc(var(--radius) - 4px)'
			},
			keyframes: {
				'accordion-down': {
					from: {
						height: '0'
					},
					to: {
						height: 'var(--radix-accordion-content-height)'
					}
				},
				'accordion-up': {
					from: {
						height: 'var(--radix-accordion-content-height)'
					},
					to: {
						height: '0'
					}
				},
				'pulse-neon': {
					'0%, 100%': { 
						boxShadow: '0 0 5px #00ffc8, 0 0 10px #00ffc8' 
					},
					'50%': { 
						boxShadow: '0 0 20px #00ffc8, 0 0 30px #00ffc8' 
					},
				},
				'glow': {
					'0%, 100%': { opacity: 0.8 },
					'50%': { opacity: 1 },
				},
				'cyber-scan': {
					'0%': { left: '-100%' },
					'100%': { left: '100%' }
				}
			},
			animation: {
				'accordion-down': 'accordion-down 0.2s ease-out',
				'accordion-up': 'accordion-up 0.2s ease-out',
				'pulse-neon': 'pulse-neon 2s ease-in-out infinite',
				'glow': 'glow 1.5s ease-in-out infinite',
				'cyber-scan': 'cyber-scan 3s infinite',
			},
			fontFamily: {
				'mono': ['JetBrains Mono', 'monospace'],
				'sans': ['Inter', 'sans-serif'],
			},
			boxShadow: {
				'neon': '0 0 5px #00ffc8, 0 0 10px #00ffc8',
				'neon-strong': '0 0 10px #00ffc8, 0 0 20px #00ffc8',
				'cyber-accent': '0 0 20px rgba(139, 92, 246, 0.3)',
			},
		}
	},
	plugins: [require("tailwindcss-animate")],
} satisfies Config;
