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
			fontFamily: {
				'black-ops': ['Black Ops One', 'cursive'],
				'bebas': ['Bebas Neue', 'cursive'],
				'russo': ['Russo One', 'sans-serif'],
			},
			colors: {
				border: 'hsl(var(--border))',
				input: 'hsl(var(--input))',
				ring: 'hsl(var(--ring))',
				background: {
					DEFAULT: 'hsl(var(--background))',
					secondary: 'hsl(var(--background-secondary))',
					tertiary: 'hsl(var(--background-tertiary))'
				},
				foreground: 'hsl(var(--foreground))',
				primary: {
					DEFAULT: 'hsl(var(--primary))',
					foreground: 'hsl(var(--primary-foreground))',
					glow: 'hsl(var(--primary-glow))'
				},
				secondary: {
					DEFAULT: 'hsl(var(--secondary))',
					foreground: 'hsl(var(--secondary-foreground))',
					glow: 'hsl(var(--secondary-glow))'
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
				}
			},
			backgroundImage: {
				'gradient-primary': 'var(--gradient-primary)',
				'gradient-secondary': 'var(--gradient-secondary)',
				'gradient-success': 'var(--gradient-success)',
				'gradient-background': 'var(--gradient-background)'
			},
			boxShadow: {
				'punk-glow': 'var(--shadow-punk-glow)',
				'punk-secondary': 'var(--shadow-punk-secondary)',
				'elegant': 'var(--shadow-elegant)'
			},
			animation: {
				'punk-glow': 'punkGlow 4s ease-in-out infinite alternate',
				'punk-pulse': 'punkPulse 2s ease-in-out infinite',
				'punk-record': 'punkRecord 1s ease-in-out infinite',
				'punk-spin': 'punkSpin 1s linear infinite',
				'punk-slide-in': 'punkSlideIn 0.5s ease-out',
				'punk-fade-in': 'punkFadeIn 0.3s ease-out'
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
				'punkGlow': {
					'0%, 100%': { boxShadow: 'var(--shadow-punk-glow)' },
					'50%': { boxShadow: '0 0 40px hsl(var(--primary-glow) / 0.8)' }
				},
				'punkPulse': {
					'0%, 100%': { transform: 'scale(1)', opacity: '1' },
					'50%': { transform: 'scale(1.05)', opacity: '0.9' }
				},
				'punkRecord': {
					'0%, 100%': { background: 'hsl(var(--destructive))' },
					'50%': { background: 'hsl(var(--destructive) / 0.7)' }
				},
				'punkSpin': {
					'from': { transform: 'rotate(0deg)' },
					'to': { transform: 'rotate(360deg)' }
				},
				'punkSlideIn': {
					'from': { transform: 'translateY(20px)', opacity: '0' },
					'to': { transform: 'translateY(0)', opacity: '1' }
				},
				'punkFadeIn': {
					'from': { opacity: '0', transform: 'translateY(10px)' },
					'to': { opacity: '1', transform: 'translateY(0)' }
				}
			}
		}
	},
	plugins: [require("tailwindcss-animate")],
} satisfies Config;
