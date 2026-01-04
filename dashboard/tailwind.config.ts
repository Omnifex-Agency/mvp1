
import type { Config } from "tailwindcss";

const config: Config = {
    content: [
        "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
        "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
        "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
    ],
    theme: {
        extend: {
            colors: {
                background: "#09090b", // Deep Zinc
                surface: "#18181b",    // Lighter Zinc
                border: "#27272a",     // Subtle Border
                accent: "#7c3aed",     // Electric Violet
                "accent-hover": "#6d28d9",
                text: "#f4f4f5",       // Zinc 100
                muted: "#a1a1aa",      // Zinc 400
            },
            fontFamily: {
                sans: ['Inter', 'sans-serif'],
            },
            animation: {
                'fade-in': 'fadeIn 0.5s ease-out',
            },
            keyframes: {
                fadeIn: {
                    '0%': { opacity: '0', transform: 'translateY(10px)' },
                    '100%': { opacity: '1', transform: 'translateY(0)' },
                }
            }
        },
    },
    plugins: [],
};
export default config;
