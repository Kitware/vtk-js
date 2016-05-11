module.exports = {
  extends: 'airbnb',
  rules: {
    'max-len': [1, 160, 4, {"ignoreUrls": true}],
    'no-console': 0,
    'no-multi-spaces': [2, { exceptions: { "ImportDeclaration": true } }],
    'no-param-reassign': [2, { props: false }],
    'no-unused-vars': [2, { args: 'none' }],
  },
  globals: {
    vtkDebugMacro: false,
    vtkErrorMacro: false,
  }
};
