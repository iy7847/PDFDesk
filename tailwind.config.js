/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./index.html", "./app.js", "./js/**/*.js"],
  darkMode: "class",
  theme: {
      extend: {
          "colors": {
              "on-tertiary-container": "#ffb9a4",
              "primary-fixed": "#dbe1ff",
              "tertiary": "#751f00",
              "on-primary-fixed": "#00174b",
              "tertiary-fixed": "#ffdbd0",
              "surface-bright": "#f9f9ff",
              "error": "#ba1a1a",
              "on-surface-variant": "#434655",
              "surface-container-low": "#f0f3ff",
              "surface-container-lowest": "#ffffff",
              "on-surface": "#111c2d",
              "on-secondary-container": "#002c66",
              "surface-dim": "#cfdaf2",
              "warning-amber": "#f59e0b",
              "surface-container-highest": "#d8e3fb",
              "tertiary-fixed-dim": "#ffb59e",
              "error-container": "#ffdad6",
              "outline-variant": "#c3c6d7",
              "primary": "#003594",
              "on-primary-container": "#b8c8ff",
              "surface-variant": "#d8e3fb",
              "tertiary-container": "#9c2e02",
              "inverse-on-surface": "#ecf1ff",
              "primary-fixed-dim": "#b4c5ff",
              "on-tertiary-fixed-variant": "#842500",
              "success-green": "#10b981",
              "surface-container-high": "#dee8ff",
              "secondary-fixed": "#d8e2ff",
              "outline": "#737685",
              "background": "#f9f9ff",
              "on-secondary": "#ffffff",
              "inverse-surface": "#263143",
              "on-primary-fixed-variant": "#003ea8",
              "surface-container": "#e7eeff",
              "on-secondary-fixed-variant": "#004395",
              "primary-container": "#004ac6",
              "surface-tint": "#1b55d0",
              "surface": "#f9f9ff",
              "on-secondary-fixed": "#001a42",
              "on-tertiary-fixed": "#3a0b00",
              "on-primary": "#ffffff",
              "inverse-primary": "#b4c5ff",
              "secondary-fixed-dim": "#adc6ff",
              "secondary": "#085ac0",
              "secondary-container": "#5b94fd",
              "on-tertiary": "#ffffff",
              "on-error": "#ffffff",
              "on-background": "#111c2d",
              "on-error-container": "#93000a"
          },
          "borderRadius": {
              "DEFAULT": "0.125rem",
              "lg": "0.25rem",
              "xl": "0.5rem",
              "full": "0.75rem"
          },
          "spacing": {
              "header-height": "90px",
              "gutter": "24px",
              "margin-mobile": "16px",
              "section-gap": "64px",
              "container-max": "1280px"
          },
          "fontFamily": {
              "headline-xl-mobile": ["Inter", "sans-serif"],
              "body-md": ["Inter", "sans-serif"],
              "headline-md": ["Inter", "sans-serif"],
              "label-caps": ["Inter", "sans-serif"],
              "body-sm": ["Inter", "sans-serif"],
              "headline-xl": ["Inter", "sans-serif"],
              "body-lg": ["Inter", "sans-serif"],
              "headline-lg": ["Inter", "sans-serif"]
          },
          "fontSize": {
              "headline-xl-mobile": ["32px", {"lineHeight": "40px", "letterSpacing": "-0.02em", "fontWeight": "700"}],
              "body-md": ["16px", {"lineHeight": "24px", "fontWeight": "400"}],
              "headline-md": ["24px", {"lineHeight": "32px", "fontWeight": "600"}],
              "label-caps": ["12px", {"lineHeight": "16px", "letterSpacing": "0.05em", "fontWeight": "700"}],
              "body-sm": ["14px", {"lineHeight": "20px", "fontWeight": "400"}],
              "headline-xl": ["40px", {"lineHeight": "48px", "letterSpacing": "-0.02em", "fontWeight": "700"}],
              "body-lg": ["18px", {"lineHeight": "28px", "fontWeight": "400"}],
              "headline-lg": ["30px", {"lineHeight": "38px", "letterSpacing": "-0.01em", "fontWeight": "600"}]
          }
      }
  },
  plugins: [
    require('@tailwindcss/forms'),
    require('@tailwindcss/container-queries')
  ],
}
