const autoprefixer = require('autoprefixer');

module.exports = {
  webpack: {
    core: {
      rules: [
        {
          test: /\.glsl$/i,
          include: /vtk\.js[\/\\]Sources/,
          loader: 'shader-loader',
        },
        {
          test: /\.js$/,
          include: /vtk\.js[\/\\]Sources/,
          use: [
            {
              loader: 'babel-loader',
              options: {
                presets: ['@babel/preset-env'],
              },
            },
          ],
        },
        {
          test: /\.worker\.js$/,
          include: /vtk\.js[\/\\]Sources/,
          use: [
            {
              loader: 'worker-loader',
              options: { inline: 'no-fallback' },
            },
          ],
        },
      ],
    },
    css: {
      rules: [
        {
          test: /\.css$/,
          exclude: /\.module\.css$/,
          use: [
            'style-loader',
            'css-loader',
            {
              loader: 'postcss-loader',
              options: {
                postcssOptions: {
                  plugins: [autoprefixer('last 2 version', 'ie >= 10')],
                },
              },
            },
          ],
        },
        {
          test: /\.css$/,
          include: /\.module\.css$/,
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
            {
              loader: 'postcss-loader',
              options: {
                postcssOptions: {
                  plugins: [autoprefixer('last 2 version', 'ie >= 10')],
                },
              },
            },
          ],
        },
      ],
    },
  },
};
