/** @type {import('tailwindcss').Config} */
export default {
    content: [
        "./index.html",
        "./src/**/*.{js,ts,jsx,tsx}",
    ],
    darkMode: 'class',
    theme: {
        extend: {
            fontFamily: {
                sans: ['Inter', 'system-ui', 'sans-serif'],
            },
            colors: {
                gray: {
                    750: '#2d3748',
                    850: '#1a202c',
                    950: '#0B0C10',
                }
            }
        },
    },
    plugins: [],
}
