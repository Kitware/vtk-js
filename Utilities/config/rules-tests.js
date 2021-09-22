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
