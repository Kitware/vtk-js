module.exports = {
  webpack: {
    v1: {
      loaders: [
        {
          test: /\.glsl$/i,
          loader: 'shader-loader',
        },
        {
          test: /\.js$/,
          include: /node_modules(\/|\\)vtk\.js(\/|\\)/,
          loader: 'babel-loader?presets[]=env',
        },
        {
          test: /\.worker\.js$/,
          include: /node_modules(\/|\\)vtk\.js(\/|\\)/,
          loader: 'babel-loader?inline=true&fallback=false',
        },
      ],
    },
    v2: {
      rules: [
        {
          test: /\.glsl$/i,
          include: /node_modules(\/|\\)vtk\.js(\/|\\)/,
          loader: 'shader-loader',
        },
        {
          test: /\.js$/,
          include: /node_modules(\/|\\)vtk\.js(\/|\\)/,
          loader: 'babel-loader?presets[]=env',
        },
        {
          test: /\.worker\.js$/,
          include: /node_modules(\/|\\)vtk\.js(\/|\\)/,
          use: [
            {
              loader: 'worker-loader',
              options: { inline: true, fallback: false },
            },
          ],
        },
      ],
    },
  },
};
