const autoprefixer = require('autoprefixer');

module.exports = [
  { test: /\.glsl$/i, loader: 'shader-loader' },
  { test: /\.js$/,
    use: [
      { loader: 'babel-loader', options: { presets: ['es2015'] } },
    ],
  },
  { test: /\.mcss$/,
    use: [
      { loader: 'style-loader' },
      { loader: 'css-loader', options: { localIdentName: '[sha512:hash:base32:5]-[name]-[local]', modules: true } },
      { loader: 'postcss-loader', options: { plugins: () => [autoprefixer('last 3 version', 'ie >= 10')] } },
    ],
  },
  { test: /\.svg$/,
    use: [
      { loader: 'raw-loader' },
    ],
  },
];
