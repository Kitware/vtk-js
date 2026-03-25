module.exports = [
  {
    test: /\.glsl$/i,
    loader: 'shader-loader',
  },
  {
    test: /\.js$/,
    use: [
      {
        loader: 'babel-loader',
        options: {
          presets: [
            [
              '@babel/preset-env',
              {
                debug: false,
                useBuiltIns: false,
              },
            ],
          ],
        },
      },
    ],
  },
  {
    test: /\.css$/,
    exclude: /\.module\.css$/,
    use: [
      { loader: 'style-loader' },
      { loader: 'css-loader' },
      { loader: 'postcss-loader' },
    ],
  },
  {
    test: /\.module\.css$/,
    use: [
      { loader: 'style-loader' },
      {
        loader: 'css-loader',
        options: {
          modules: {
            localIdentName: '[name]-[local]_[sha512:hash:base64:5]',
          },
        },
      },
      { loader: 'postcss-loader' },
    ],
  },
  {
    test: /\.svg$/,
    type: 'asset/source',
  },
  {
    test: /\.worker\.js$/,
    use: [
      { loader: 'worker-loader', options: { inline: 'no-fallback' } },
    ],
  },
];
