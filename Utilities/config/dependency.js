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
          loader: 'babel-loader?presets[]=env',
        },
      ],
    },
    v2: {
      rules: [
        {
          test: /\.glsl$/i,
          include: /node_modules(\/|\\)vtk\.js(\/|\\)/,
          loader: 'shader-loader',
        }, {
          test: /\.js$/,
          include: /node_modules(\/|\\)vtk\.js(\/|\\)/,
          loader: 'babel-loader?presets[]=env',
        },
      ],
    },
  },
};
