
var replaceConfig = JSON.stringify({
  multiple: [
     { search: 'vtkDebugMacro', replace: 'console.debug', flags: 'g' },
     { search: 'vtkErrorMacro', replace: 'console.error', flags: 'g' },
     { search: 'vtkWarningMacro', replace: 'console.warn', flags: 'g' },
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
    exclude: /baseline/,
    loader: 'url-loader?limit=8192',
  }, {
    test: /baseline[^\.]*\.(png|jpg)$/,
    loader: 'url-loader?limit=1048576',
  }, {
    test: /\.css$/,
    loader: 'style!css!postcss',
  }, {
    test: /\.mcss$/,
    loader: 'style!css?modules&importLoaders=1&localIdentName=[name]_[local]_[hash:base64:5]!postcss',
  }, {
    test: /\.c$/i,
    loader: 'shader',
  }, {
    test: /\.glsl$/i,
    loader: 'shader',
  }, {
    test: /\.json$/,
    loader: 'json-loader',
  }, {
    test: /\.html$/,
    loader: 'html-loader',
  }, {
    test: /\.js$/,
    include: /node_modules(\/|\\)vtk\.js(\/|\\)/,
    loader: 'babel?presets[]=es2015,presets[]=react!string-replace?' + replaceConfig,
  }, {
    test: /\.js$/,
    exclude: /node_modules/,
    loader: 'babel?presets[]=es2015,presets[]=react!string-replace?' + replaceConfig,
  },
];
