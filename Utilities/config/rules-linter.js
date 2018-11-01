const path = require('path');

const eslintrcPath = path.join(__dirname, '../../.eslintrc.js');

module.exports = [
  {
    test: /\.js$/,
    loader: 'eslint-loader',
    exclude: /node_modules/,
    enforce: 'pre',
    options: { configFile: eslintrcPath },
  },
];
