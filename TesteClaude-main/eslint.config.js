const jsdoc = require('eslint-plugin-jsdoc');

module.exports = [
  {
    plugins: { jsdoc },
    rules: {
      // ── OPÇÃO A — Qualidade de código ──────────────────
      'no-unused-vars':    'error',   // variáveis declaradas e não usadas
      'no-undef':          'error',   // variáveis usadas sem declaração
      'eqeqeq':            'error',   // proíbe == em favor de ===
      'no-unreachable':    'error',   // código após return/throw
      'no-console':        'warn',    // console.log esquecido no código

      // ── OPÇÃO B — Padronização e nomenclatura ──────────
      'camelcase':         'warn',    // variáveis devem ser camelCase
      'semi':              ['warn', 'always'],  // ponto e vírgula obrigatório
      'quotes':            ['warn', 'single'],  // aspas simples
      'indent':            ['warn', 2],         // indentação de 2 espaços

      // ── OPÇÃO B — Documentação ─────────────────────────
      'jsdoc/require-jsdoc': ['warn', {
        require: { FunctionDeclaration: true, ArrowFunctionExpression: false }
      }],
    },
    languageOptions: {
      ecmaVersion: 2022,
      sourceType:  'commonjs',
      globals: {
        require:  'readonly',
        module:   'readonly',
        exports:  'readonly',
        process:  'readonly',
        __dirname:'readonly',
        console:  'readonly',
      }
    },
    ignores: ['node_modules/**', 'prisma/**']
  }
];