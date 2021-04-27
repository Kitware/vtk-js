module.exports = [
  { test: /canvas.node/, loader: 'ignore-loader' },
  { test: /\.cjson$/, loader: 'hson-loader' },
  { test: /test[^\.]*\.(png|jpg)$/, use: 'url-loader?limit=1048576' },
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
