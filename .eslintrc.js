const prettierConf = require('./prettier.config.js');

module.exports = {
  parserOptions: {
    ecmaVersion: 2022,
    sourceType: 'module',
  },
  extends: ['airbnb/base', 'prettier'],
  rules: {
    'prettier/prettier': ['error', prettierConf],

    // But we want the following
    'no-multi-spaces': ['error', { exceptions: { ImportDeclaration: true } }],
    'no-param-reassign': ['error', { props: false }],
    'no-unused-vars': ['error', { args: 'none' }],
    'prefer-destructuring': 0,
    'import/no-extraneous-dependencies': 0, // Needed for tests
    // 'no-mixed-operators': 'error', // Wish we can put it back with prettier

    // Not for us
    'jsx-a11y/label-has-for': 0,
    'no-console': 0,
    'no-plusplus': 0,
    'no-underscore-dangle': 0,
    'import/no-named-as-default': 0,
    'import/no-named-as-default-member': 0,

    // Introduced with new eslint
    // and no time to fix them...
    // [...]
    'linebreak-style': 0,
  },
  plugins: ['prettier'],
  globals: {
    __BASE_PATH__: false,
    __VTK_TEST_NO_WEBGL__: false,
    __VTK_TEST_WEBGPU__: false,
    VRFrameData: true,
  },
  settings: {
    'import/resolver': {
      alias: {
        map: [
          ['vtk.js/Data', './Data'],
          ['vtk.js/Examples', './Examples'],
          ['vtk.js/Utilities', './Utilities'],
          ['vtk.js/Sources', './Sources'],
          ['vtk.js', './Sources'],
          ['@kitware/vtk.js', './Sources'],
        ],
        extensions: ['.js', '.json'],
      },
    },
  },
  env: {
    es2020: true,
    es6: true,
    browser: true,
  },
  ignorePatterns: [
    // ignore old Actor example
    '**/example_/*.js',
    // ignore js files in utilities
    'Utilities/**/*.js',
    // ignore configs
    'vite.config.js',
    'vitest.config.js',
    '.eslintrc.js',
  ],
};
