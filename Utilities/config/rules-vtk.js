module.exports = [
  { test: /\.glsl$/i, loader: 'shader-loader' },
  { test: /\.js$/,
    use: [
      { loader: 'babel-loader', options: { presets: ['es2015'] } },
    ],
  },
];
