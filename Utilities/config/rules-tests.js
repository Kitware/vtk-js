module.exports = [
  { test: /\.cjson$/, loader: 'hson-loader' },
  {
    test: /test[^\.]*\.(png|jpg)$/,
    type: 'asset',
    parser: {
      dataUrlCondition: {
        maxSize: 1024 * 1024,
      },
    },
  },
  { test: /\.glsl$/i, loader: 'shader-loader' },
  {
    test: /\.worker\.js$/,
    use: [
      { loader: 'worker-loader', options: { inline: 'no-fallback' } },
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
    test: /\.js$/,
    use: [
      { loader: 'babel-loader' },
      {
        loader: 'string-replace-loader',
        options: {
          multiple: [
            {
              search: 'test.onlyIfWebGL',
              replace: process.env.NO_WEBGL ? 'test.skip' : 'test',
              flags: 'g',
            },
            {
              search: 'test.onlyIfWebGPU',
              replace: process.env.WEBGPU ? 'test' : 'test.skip',
              flags: 'g',
            },
          ],
        },
      },
    ],
  },
];
