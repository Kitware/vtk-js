var prettierConf = require('./prettier.config.js');

module.exports = {
  extends: ['airbnb', 'prettier'],
  rules: {
    'no-multi-spaces': ["error", { exceptions: { "ImportDeclaration": true } }],
    'no-param-reassign': ["error", { props: false }],
    'no-unused-vars': ["error", { args: 'none' }],
    // 'no-mixed-operators': 'error',

    // Should fix that at some point
    'no-nested-ternary': 0,
    'prefer-destructuring': 0,
    'import/no-named-as-default': 0,
    'import/no-named-as-default-member': 0,
    'no-restricted-properties': 0,
    'no-multi-spaces': 0,
    'prefer-promise-reject-errors': 0,
    'spaced-comment': 0,
    'no-var': 0,
    'import/extensions': 0,

    // Not for us ;-)
    'jsx-a11y/label-has-for': 0,
    'no-console': 0,
    'no-plusplus': 0,

    'prettier/prettier': ['error', prettierConf],
  },
  plugins: [
    'prettier'
  ],
  globals: {
    __BASE_PATH__: false,
    VRFrameData: true,
  },
  'settings': {
    'import/resolver': 'webpack'
  },
  env: {
    es6: true,
    browser: true,
  },
};
