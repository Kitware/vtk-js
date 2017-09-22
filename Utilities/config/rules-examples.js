const autoprefixer = require('autoprefixer');

module.exports = [
  { test: /\.(png|jpg)$/, use: 'url-loader?limit=81920', exclude: /test[^\.]*\.(png|jpg)$/ },
  { test: /\.html$/, loader: 'html-loader' },
  { test: /\.css$/, use: ['style-loader', 'css-loader', 'postcss-loader'] },
  { test: /\.mcss$/,
    use: [
      { loader: 'style-loader' },
      { loader: 'css-loader', options: { localIdentName: '[sha512:hash:base32]-[name]-[local]', modules: true } },
      { loader: 'postcss-loader', options: { plugins: () => [autoprefixer('last 3 version', 'ie >= 10')] } },
    ],
  },
  { test: /\.cjson$/, loader: 'hson-loader' },
  { test: /\.hson$/, loader: 'hson-loader' },
];
