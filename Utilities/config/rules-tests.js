module.exports = [
  { test: /\.cjson$/, loader: 'hson-loader' },
  { test: /test[^\.]*\.(png|jpg)$/, use: 'url-loader?limit=1048576' },
  { test: /\.glsl$/i, loader: 'shader-loader' },
  { test: /\.js$/,
    use: [
      { loader: 'babel-loader', options: { presets: ['es2015'] } },
      { loader: 'string-replace-loader',
        options: {
          multiple: [{ search: 'test.onlyIfWebGL', replace: process.env.TRAVIS ? 'test.skip' : 'test', flags: 'g' }],
        },
      },
    ],
  },
];
