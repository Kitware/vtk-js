const path = require('path');
const prettierConf = require('./prettier.config.js');

module.exports = {
  parser: '@babel/eslint-parser',
  parserOptions: {
    babelOptions: {
      configFile: path.resolve(__dirname, '.babelrc.json'),
    },
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
    VRFrameData: true,
  },
  settings: {
    'import/resolver': {
      webpack: {
        config: {
          resolve: {
            alias: {
              // Since vtk.js examples are written as if the vtk.js package is a dependency,
              // we need to resolve example imports as if they were referencing vtk.js/Sources.
              // the Examples/Utilities hack allows for imports from those folders, since our
              // last alias overrides vtk.js/* paths to point to vtk.js/Sources/*.
              'vtk.js/Data': path.resolve(__dirname, 'Data'),
              'vtk.js/Examples': path.resolve(__dirname, 'Examples'),
              'vtk.js/Utilities': path.resolve(__dirname, 'Utilities'),
              'vtk.js/Sources': path.resolve(__dirname, 'Sources'),
              'vtk.js': path.resolve(__dirname, 'Sources'),
            },
          },
        },
      },
    },
  },
  env: {
    es6: true,
    browser: true,
  },
  ignorePatterns: [
    // ignore old Actor example
    '**/example_/*.js',
    // ignore js files in utilities
    'Utilities/**/*.js',
  ],
};
