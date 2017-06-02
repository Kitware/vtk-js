const path = require('path');

const eslintrcPath = path.join(__dirname, '../../.eslintrc.js');

module.exports = [
  { test: /\.js$/, loader: 'eslint-loader', exclude: /node_modules/, enforce: 'pre', options: { configFile: eslintrcPath } },
  { test: /\.(png|jpg)$/, use: 'url-loader?limit=8192' },
  { test: /\.html$/, loader: 'html-loader' },
  { test: /\.css$/, use: ['style-loader', 'css-loader', 'postcss-loader'] },
  { test: /\.mcss$/,
    use: [
      { loader: 'style-loader' },
      { loader: 'css-loader', options: { localIdentName: '[sha512:hash:base32]-[name]-[local]', modules: true } },
      { loader: 'postcss-loader' },
    ],
  },
  { test: /\.glsl$/i, loader: 'shader-loader' },
  { test: /\.cjson$/, loader: 'hson-loader' },
  { test: /\.hson$/, loader: 'hson-loader' },
  { test: /\.js$/,
    use: [
      { loader: 'babel-loader', options: { presets: ['es2015'] } },
      { loader: 'string-replace-loader',
        options: {
          multiple: [{ search: 'test.onlyIfWebGL', replace: process.env.TRAVIS ? 'test.skip' : 'test', flags: 'g' }],
        },
      },
    ],
  },
];
