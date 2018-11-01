module.exports = [
  { test: /\.(png|jpg)$/, use: 'url-loader?limit=81920' },
  { test: /\.html$/, loader: 'html-loader' },
  { test: /\.cjson$/, loader: 'hson-loader' },
  { test: /\.hson$/, loader: 'hson-loader' },
];
