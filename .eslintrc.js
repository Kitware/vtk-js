module.exports = {
  extends: 'airbnb',
  rules: {
    'import/no-extraneous-dependencies': ["error", { "devDependencies": true }],
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

    // Not for vtk.js
    'import/no-named-as-default': 0,
    'import/no-named-as-default-member': 0,

    // eslint-3.3.0
    "no-global-assign": 0,
    "no-unsafe-negation": 0,
  },
  globals: {
    vtkDebugMacro: false,
    vtkErrorMacro: false,
    vtkWarningMacro: false,
  },
  env: {
    browser: true,
  },
};
