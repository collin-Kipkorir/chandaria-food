/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './index.html',
    './src/**/*.{js,ts,jsx,tsx,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        'brand-green': 'var(--color-brand-green)',
        'brand-green-dark': 'var(--color-brand-green-dark)',
        'brand-green-deep': 'var(--color-brand-green-deep)',
        'brand-gold': 'var(--color-brand-gold)',
        'brand-gold-dark': 'var(--color-brand-gold-dark)',
        'brand-cream': 'var(--color-brand-cream)',
      },
    },
  },
  // Ensure utilities like bg-brand-gold/10 and text-brand-* are generated even when
  // Tailwind's scanner doesn't pick them up (dynamic class names in templates).
  safelist: [
    { pattern: /^(bg|text|border|ring)-brand-[a-z-]+(?:\/\d+)?$/ },
    { pattern: /^bg-brand-(green|green-dark|green-deep|gold|gold-dark|cream)(?:\/\d+)?$/ },
  ],
  plugins: [],
};
