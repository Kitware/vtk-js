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
    // 'no-mixed-operators': 'error', // Wish we can put it back with prettier

    // Not for us
    'jsx-a11y/label-has-for': 0,
    'no-console': 0,
    'no-plusplus': 0,
    'import/no-named-as-default': 0,
    'import/no-named-as-default-member': 0,
    'prefer-destructuring': 0, // Can have unwanted side effect

    // Introduced with new eslint
    // and no time to fix them...
    // [...]
    'linebreak-style': 0,
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
