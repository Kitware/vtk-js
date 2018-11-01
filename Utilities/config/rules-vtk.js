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
          localIdentName: '[name]-[local]_[sha512:hash:base64:5]',
          modules: true,
        },
      },
      { loader: 'postcss-loader' },
    ],
  },
  {
    test: /\.svg$/,
    use: [{ loader: 'raw-loader' }],
  },
  {
    test: /\.worker\.js$/,
    use: [
      { loader: 'worker-loader', options: { inline: true, fallback: false } },
    ],
  },
];
