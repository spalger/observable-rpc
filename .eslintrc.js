module.exports = {
  parser: 'babel-eslint',

  plugins: ['import', 'prefer-object-spread', 'jest', 'prettier', 'babel'],

  extends: ['eslint:recommended', 'prettier'],

  env: {
    es6: true,
  },

  parserOptions: {
    ecmaVersion: '2018',
    sourceType: 'module',
    ecmaFeatures: {
      globalReturn: false,
      impliedStrict: true,
      jsx: false,
    },
  },

  rules: {
    'prettier/prettier': 'error',

    quotes: ['error', 'single', { avoidEscape: true }],
    'import/no-unresolved': ['error', { amd: true, commonjs: true }],
    'import/named': 'error',
    'import/namespace': 'error',
    'import/default': 'error',
    'import/export': 'error',
    'import/no-named-as-default': 'error',
    'import/no-named-as-default-member': 'error',
    'import/no-duplicates': 'error',
    'import/no-extraneous-dependencies': [
      'error',
      {
        devDependencies: false,
        optionalDependencies: true,
        peerDependencies: true,
      },
    ],

    'prefer-object-spread/prefer-object-spread': 'error',
  },

  overrides: [
    /**
     * Files that are not transpiled
     */
    {
      files: ['.eslintrc.js', 'scripts/**', 'projects/babel-preset/**'],
      parserOptions: {
        sourceType: 'script',
      },
      rules: {
        'import/no-commonjs': 'off',
        'no-restricted-syntax': [
          'error',
          'ImportDeclaration',
          'ExportNamedDeclaration',
          'ExportDefaultDeclaration',
          'ExportAllDeclaration',
        ],
      },
    },

    /**
     * Node.js files
     */
    {
      files: ['**/.*.js', '**/*.js'],
      env: {
        node: true,
      },
    },

    /**
     * Allow console in certain non-shipping components
     */
    {
      files: ['scripts/**/*', 'projects/example/**/*'],
      rules: {
        'no-console': 'off',
      },
    },

    /**
     * Browser compatible files
     */
    {
      files: ['projects/client/src/**/*.js'],
      env: {
        node: true,
      },
    },

    /**
     * Files that can load dev dependencies
     */
    {
      files: ['**/*.test.js', '**/__fixtures__/**/*'],
      rules: {
        'import/no-extraneous-dependencies': [
          'error',
          {
            devDependencies: true,
            optionalDependencies: true,
            peerDependencies: true,
          },
        ],
      },
    },

    /**
     * Jest test files
     */
    {
      files: ['**/*.test.js', '**/__fixtures__/**/*'],
      plugins: ['jest'],
      env: {
        jest: true,
      },
      rules: {
        'jest/no-disabled-tests': 'warn',
        'jest/no-focused-tests': 'error',
        'jest/no-identical-title': 'error',
        'jest/prefer-to-have-length': 'warn',
        'jest/valid-expect': 'error',
      },
    },
  ],
}
