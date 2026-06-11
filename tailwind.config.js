/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      colors: {
        brand: {
          green: "#7DAD3F",
          greenDark: "#6B9836",
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
    },
  },
  plugins: [],
};
