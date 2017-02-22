
var replaceConfig = JSON.stringify({
  multiple: [
     { search: 'test.onlyIfWebGL', replace: process.env.TRAVIS ? 'test.skip' : 'test', flags: 'g' },
  ],
});

module.exports = [
  {
    test: /\.svg$/,
    loader: 'svg-sprite',
    exclude: /fonts/,
  }, {
    test: /\.woff(2)?(\?v=[0-9]\.[0-9]\.[0-9])?$/,
    loader: 'url-loader?limit=60000&mimetype=application/font-woff',
  }, {
    test: /\.(ttf|eot|svg)(\?v=[0-9]\.[0-9]\.[0-9])?$/,
    loader: 'url-loader?limit=60000',
    include: /fonts/,
  }, {
    test: /\.(png|jpg)$/,
    exclude: /test[^\.]*\.(png|jpg)$/,
    loader: 'url-loader?limit=8192',
  }, {
    test: /test[^\.]*\.(png|jpg)$/,
    loader: 'url-loader?limit=1048576',
  }, {
    test: /\.css$/,
    loader: 'style-loader!css-loader!postcss-loader',
  }, {
    test: /\.mcss$/,
    loader: 'style-loader!css-loader?modules&importLoaders=1&localIdentName=[name]_[local]_[hash:base64:5]!postcss-loader',
  }, {
    test: /\.c$/i,
    loader: 'shader-loader',
  }, {
    test: /\.glsl$/i,
    loader: 'shader-loader',
  }, {
    test: /\.json$/,
    loader: 'json-loader',
  }, {
    test: /\.cjson$/,
    loader: 'json-loader',
  }, {
    test: /\.html$/,
    loader: 'html-loader',
  }, {
    test: /\.js$/,
    include: /node_modules(\/|\\)vtk\.js(\/|\\)/,
    loader: `babel-loader?presets[]=es2015,presets[]=react!string-replace-loader?${replaceConfig}`,
  }, {
    test: /\.js$/,
    exclude: /node_modules/,
    loader: `babel-loader?presets[]=es2015,presets[]=react!string-replace-loader?${replaceConfig}`,
  },
];
