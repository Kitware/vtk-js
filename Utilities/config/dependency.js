module.exports = {
  webpack: {
    v1: {
      loaders: [
        {
          test: /\.glsl$/i,
          loader: 'shader-loader',
        }, {
          test: /\.js$/,
          include: /node_modules(\/|\\)vtk\.js(\/|\\)/,
          loader: 'babel-loader?presets[]=es2015',
        },
      ],
    },
    v2: {
      rules: [
      ],
    },
  },
};
