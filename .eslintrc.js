module.exports = {
  extends: ['airbnb'], // , 'prettier'
  rules: {
    'max-len': ["warn", 160, 4, {"ignoreUrls": true}],
    'no-multi-spaces': ["error", { exceptions: { "ImportDeclaration": true } }],
    'no-param-reassign': ["error", { props: false }],
    'no-unused-vars': ["error", { args: 'none' }],
    'react/jsx-filename-extension': ["error", { "extensions": [".js"] }],
    'no-mixed-operators': ["error", {"allowSamePrecedence": true}],

    // Should fix that at some point but too much work...
    'react/no-is-mounted': "warn",
    'no-var': 0,
    'one-var': 0,
    'react/prefer-es6-class': 0,
    'no-nested-ternary': 0,

    // Not for us ;-)
    'jsx-a11y/label-has-for': 0,
    'no-console': 0,
    'no-plusplus': 0,
    'linebreak-style': 0,

    // Not for vtk.js
    // 'import/no-extraneous-dependencies': ["error", { "devDependencies": true }],
    'import/no-extraneous-dependencies': 0,
    'import/no-unresolved': 0,
    'import/extensions': 0,
    'import/no-named-as-default': 0,
    'import/no-named-as-default-member': 0,

    // May want to remove at some point
    'no-restricted-properties': 0,
  },
  // plugins: [
  //   'prettier'
  // ],
  globals: {
    __BASE_PATH__: false,
  },
  'settings': {
    'import/resolver': 'webpack'
  },
  env: {
    browser: true,
  },
  // rules: {
  //   'prettier/prettier': [
  //     'error', {
  //       printWidth: 100,
  //       singleQuote: true,
  //       trailingComma: "es5"
  //     }
  //   ],
  // }
};
