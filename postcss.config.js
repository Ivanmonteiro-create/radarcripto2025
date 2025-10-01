// postcss.config.js  (CommonJS — o que o Next espera)
module.exports = {
  plugins: {
    // Se você usa classes utilitárias do Tailwind, deixe a linha abaixo.
    // Se NÃO usa Tailwind, remova a linha 'tailwindcss: {}' (deixe só autoprefixer).
    tailwindcss: {},
    autoprefixer: {},
  },
};
