const autoprefixer = require('autoprefixer');

module.exports = [
  { test: /\.glsl$/i, loader: 'shader-loader' },
  { test: /\.js$/,
    use: [
      { loader: 'babel-loader', options: { presets: ['env'] } },
    ],
  },
  { test: /\.mcss$/,
    use: [
      { loader: 'style-loader' },
      { loader: 'css-loader', options: { localIdentName: '[name]-[local]_[sha512:hash:base32:5]', modules: true } },
      { loader: 'postcss-loader', options: { plugins: () => [autoprefixer('last 2 version', 'ie >= 10')] } },
    ],
  },
  { test: /\.svg$/,
    use: [
      { loader: 'raw-loader' },
    ],
  },
];
