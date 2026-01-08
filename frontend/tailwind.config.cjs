/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        // LokaClean - Tropical Clean Hospitality Theme
        tropical: {
          // Primary: Teal/Tropical Green (#1ABC9C, #16A085)
          DEFAULT: "#1ABC9C",
          50: "#E8F8F5",
          100: "#D1F2EB",
          200: "#A3E4D7",
          300: "#76D7C4",
          400: "#48C9B0",
          500: "#1ABC9C", // Primary
          600: "#16A085", // Primary Dark
          700: "#138D75",
          800: "#117A65",
          900: "#0E6655"
        },
        ocean: {
          // Secondary: Ocean Blue (#3498DB, #5DADE2)
          DEFAULT: "#3498DB",
          50: "#EBF5FB",
          100: "#D6EAF8",
          200: "#AED6F1",
          300: "#85C1E9",
          400: "#5DADE2", // Light
          500: "#3498DB", // Secondary
          600: "#2E86C1",
          700: "#2874A6",
          800: "#21618C",
          900: "#1B4F72"
        },
        sun: {
          // Accent: Sun Yellow/Sand Beige (#F4D03F, #FAD7A0)
          DEFAULT: "#F4D03F",
          50: "#FEF9E7",
          100: "#FEF3C7",
          200: "#FDE68A",
          300: "#FCD34D",
          400: "#F4D03F", // Accent
          500: "#FBBF24",
          600: "#F59E0B",
          700: "#D97706",
          800: "#B45309",
          900: "#92400E"
        },
        sand: {
          // Sand Beige
          DEFAULT: "#FAD7A0",
          50: "#FEFBF3",
          100: "#FDF6E6",
          200: "#FBEDCD",
          300: "#F9E4B4",
          400: "#FAD7A0", // Sand
          500: "#F7DC6F",
          600: "#F4D03F",
          700: "#F1C40F",
          800: "#D4AC0D",
          900: "#B7950B"
        },
        // Keep lombok for backward compatibility
        lombok: {
          ocean: {
            50: "#EBF5FB",
            100: "#D6EAF8",
            200: "#AED6F1",
            300: "#85C1E9",
            400: "#5DADE2",
            500: "#3498DB",
            600: "#2E86C1",
            700: "#2874A6",
            800: "#21618C",
            900: "#1B4F72"
          },
          tropical: {
            50: "#E8F8F5",
            100: "#D1F2EB",
            200: "#A3E4D7",
            300: "#76D7C4",
            400: "#48C9B0",
            500: "#1ABC9C",
            600: "#16A085",
            700: "#138D75",
            800: "#117A65",
            900: "#0E6655"
          },
          sunset: {
            50: "#FEF9E7",
            100: "#FEF3C7",
            200: "#FDE68A",
            300: "#FCD34D",
            400: "#F4D03F",
            500: "#FBBF24",
            600: "#F59E0B",
            700: "#D97706",
            800: "#B45309",
            900: "#92400E"
          }
        }
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'sans-serif'],
        display: ['Inter', 'system-ui', 'sans-serif'],
      },
      animation: {
        "fade-in": "fadeIn 0.5s ease-in-out",
        "fade-in-up": "fadeInUp 0.5s ease-out",
        "fade-in-down": "fadeInDown 0.5s ease-out",
        "fade-in-left": "fadeInLeft 0.5s ease-out",
        "fade-in-right": "fadeInRight 0.5s ease-out",
        "slide-up": "slideUp 0.4s ease-out",
        "slide-down": "slideDown 0.4s ease-out",
        "scale-in": "scaleIn 0.3s ease-out",
        "bounce-in": "bounceIn 0.6s ease-out",
        "shimmer": "shimmer 2s infinite",
        "pulse-slow": "pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite",
        "float": "float 3s ease-in-out infinite"
      },
      keyframes: {
        fadeIn: {
          "0%": { opacity: "0" },
          "100%": { opacity: "1" }
        },
        fadeInUp: {
          "0%": { opacity: "0", transform: "translateY(20px)" },
          "100%": { opacity: "1", transform: "translateY(0)" }
        },
        fadeInDown: {
          "0%": { opacity: "0", transform: "translateY(-20px)" },
          "100%": { opacity: "1", transform: "translateY(0)" }
        },
        fadeInLeft: {
          "0%": { opacity: "0", transform: "translateX(-20px)" },
          "100%": { opacity: "1", transform: "translateX(0)" }
        },
        fadeInRight: {
          "0%": { opacity: "0", transform: "translateX(20px)" },
          "100%": { opacity: "1", transform: "translateX(0)" }
        },
        slideUp: {
          "0%": { transform: "translateY(100%)" },
          "100%": { transform: "translateY(0)" }
        },
        slideDown: {
          "0%": { transform: "translateY(-100%)" },
          "100%": { transform: "translateY(0)" }
        },
        scaleIn: {
          "0%": { opacity: "0", transform: "scale(0.9)" },
          "100%": { opacity: "1", transform: "scale(1)" }
        },
        bounceIn: {
          "0%, 20%, 40%, 60%, 80%, 100%": { transform: "translateY(0)" },
          "10%": { transform: "translateY(-10px)" },
          "30%": { transform: "translateY(-5px)" },
          "50%": { transform: "translateY(-3px)" }
        },
        shimmer: {
          "0%": { backgroundPosition: "-1000px 0" },
          "100%": { backgroundPosition: "1000px 0" }
        },
        float: {
          "0%, 100%": { transform: "translateY(0px)" },
          "50%": { transform: "translateY(-10px)" }
        }
      },
      backgroundImage: {
        // Tropical Clean Hospitality Gradients
        "tropical-gradient": "linear-gradient(135deg, #1ABC9C 0%, #16A085 100%)",
        "ocean-gradient": "linear-gradient(135deg, #3498DB 0%, #5DADE2 100%)",
        "sun-gradient": "linear-gradient(135deg, #F4D03F 0%, #FAD7A0 100%)",
        "hospitality-gradient": "linear-gradient(135deg, #1ABC9C 0%, #3498DB 50%, #F4D03F 100%)",
        "hospitality-light": "linear-gradient(135deg, rgba(26, 188, 156, 0.1) 0%, rgba(52, 152, 219, 0.1) 50%, rgba(244, 208, 63, 0.1) 100%)",
        // Backward compatibility
        "lombok-gradient": "linear-gradient(135deg, #1ABC9C 0%, #3498DB 50%, #F4D03F 100%)",
        "lombok-gradient-light": "linear-gradient(135deg, rgba(26, 188, 156, 0.1) 0%, rgba(52, 152, 219, 0.1) 50%, rgba(244, 208, 63, 0.1) 100%)",
        "lombok-ocean-gradient": "linear-gradient(135deg, #3498DB 0%, #5DADE2 100%)",
        "lombok-tropical-gradient": "linear-gradient(135deg, #1ABC9C 0%, #16A085 100%)",
        "lombok-sunset-gradient": "linear-gradient(135deg, #F4D03F 0%, #FAD7A0 100%)"
      },
      boxShadow: {
        "tropical-sm": "0 2px 8px rgba(26, 188, 156, 0.1)",
        "tropical-md": "0 4px 16px rgba(26, 188, 156, 0.15)",
        "tropical-lg": "0 8px 32px rgba(26, 188, 156, 0.2)",
        "tropical-xl": "0 16px 48px rgba(26, 188, 156, 0.25)",
        // Backward compatibility
        "lombok-sm": "0 2px 8px rgba(26, 188, 156, 0.1)",
        "lombok-md": "0 4px 16px rgba(26, 188, 156, 0.15)",
        "lombok-lg": "0 8px 32px rgba(26, 188, 156, 0.2)",
        "lombok-xl": "0 16px 48px rgba(26, 188, 156, 0.25)"
      }
    }
  },
  plugins: []
};


