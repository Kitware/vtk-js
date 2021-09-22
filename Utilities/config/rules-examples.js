module.exports = [
  { test: /\.(png|jpg)$/, type: 'asset' },
  { test: /\.html$/, loader: 'html-loader' },
  { test: /\.cjson$/, loader: 'hson-loader' },
  { test: /\.hson$/, loader: 'hson-loader' },
];
