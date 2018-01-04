var prettierConf = require('./prettier.config.js');

module.exports = {
  extends: ['airbnb', 'prettier'],
  rules: {
    'prettier/prettier': ['error', prettierConf],

    // But we want the following
    'no-multi-spaces': ["error", { exceptions: { "ImportDeclaration": true } }],
    'no-param-reassign': ["error", { props: false }],
    'no-unused-vars': ["error", { args: 'none' }],
    'prefer-destructuring': ["error", { VariableDeclarator: { array: false, object: true }, AssignmentExpression: { array: false, object: false } }, { enforceForRenamedProperties: false }],
    'import/no-extraneous-dependencies': 0, // Needed for tests
    // 'no-mixed-operators': 'error',

    // Not for us
    'jsx-a11y/label-has-for': 0,
    'no-console': 0,
    'no-plusplus': 0,
    'import/no-named-as-default': 0,
    'import/no-named-as-default-member': 0,

    // Introduced with new eslint
    // and no time to fix them...

    // 'no-nested-ternary': 0,
    // 'no-restricted-properties': 0,
    // 'no-multi-spaces': 0,
    // 'prefer-promise-reject-errors': 0,
    // 'spaced-comment': 0,
    // 'no-var': 0,
    // 'import/extensions': 0,
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
