/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      colors: {
        brand: {
          green: "#5A7E2D",
          greenDark: "#4F7026",
          greenBright: "#7DAD3F",
          navy: "#173142",
          navyDeep: "#122046",
          tint: "#E8F0DD",
        },
        ink: "#1B2A33",
        muted: "#626E79",
      },
      fontFamily: {
        sans: ["Poppins", "ui-sans-serif", "system-ui", "sans-serif"],
      },
      boxShadow: {
        card: "0 6px 20px -8px rgba(23,49,66,0.18)",
        nav: "0 -2px 16px -6px rgba(0,0,0,0.25)",
      },
      maxWidth: { phone: "430px" },
      // Auth-screen motion: slow photo push-in, drifting mist, staggered entrance.
      keyframes: {
        "hero-zoom": { from: { transform: "scale(1.12)" }, to: { transform: "scale(1)" } },
        "mist-drift": { from: { transform: "translateX(-12%)" }, to: { transform: "translateX(12%)" } },
        rise: { from: { opacity: "0", transform: "translateY(14px)" }, to: { opacity: "1", transform: "none" } },
      },
      animation: {
        "hero-zoom": "hero-zoom 18s ease-out both",
        "mist-slow": "mist-drift 38s ease-in-out infinite alternate",
        "mist-fast": "mist-drift 24s ease-in-out infinite alternate-reverse",
        rise: "rise 0.9s cubic-bezier(0.2,0.7,0.2,1) both",
      },
    },
  },
  plugins: [],
};
