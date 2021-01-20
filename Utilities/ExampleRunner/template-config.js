const path = require('path');

const settings = require('../../webpack.settings.js');

// escapes backslashes
function escape(s) {
  return s.replace(/\\/g, '\\\\');
}

const vtkPaths = {
  Base: escape(path.resolve('.')),
  Examples: escape(path.resolve('Examples')),
  Utilities: escape(path.resolve('Utilities')),
  Sources: escape(path.resolve('Sources')),
};

module.exports = function buildConfig(
  name,
  relPath,
  destPath,
  root,
  exampleBasePath
) {
  return `
var rules = [].concat(require('../config/rules-vtk.js'), require('../config/rules-examples.js'), require('../config/rules-linter.js'));
var ESLintWebpackPlugin = require('eslint-webpack-plugin');
var HtmlWebpackPlugin = require('html-webpack-plugin');
var webpack = require('webpack');
var path = require('path');

module.exports = {
  mode: 'development',
  devtool: 'inline-source-map',
  plugins: [
    new ESLintWebpackPlugin({
      // override vtk.js alias
      overrideConfig: {
        settings: {
          'import/resolver': {
            webpack: {
              config: {
                resolve: {
                  alias: {
                    'vtk.js/Examples': '${vtkPaths.Examples}',
                    'vtk.js/Utilities': '${vtkPaths.Utilities}',
                    'vtk.js/Sources': '${vtkPaths.Sources}',
                    'vtk.js': '${vtkPaths.Sources}',
                  }
                }
              }
            }
          }
        }
      }
    }),
    new HtmlWebpackPlugin({
      template: '${escape(root)}/Utilities/ExampleRunner/template.html',
    }),
    new webpack.DefinePlugin({
      __BASE_PATH__: "''",
    }),
  ],
  entry: path.join('${escape(exampleBasePath)}', '${escape(relPath)}'),
  output: {
    path: '${escape(destPath)}',
    filename: '${name}.js',
  },
  module: {
    rules: rules,
  },
  resolve: {
    alias: {
      // Since vtk.js examples are written as if the vtk.js package is a dependency,
      // we need to resolve example imports as if they were referencing vtk.js/Sources.
      // the Examples/Utilities hack allows for imports from those folders, since our
      // last alias overrides vtk.js/* paths to point to vtk.js/Sources/*.

      'vtk.js/Examples': '${vtkPaths.Examples}',
      'vtk.js/Utilities': '${vtkPaths.Utilities}',
      'vtk.js/Sources': '${vtkPaths.Sources}',
      'vtk.js': '${vtkPaths.Sources}',
    },
    fallback: {
      fs: false,
      stream: require.resolve('stream-browserify'),
    },
  },

  devServer: {
    contentBase: '${escape(root)}',
    port: ${settings.devServerConfig.port()},
    host: '${settings.devServerConfig.host()}',
    disableHostCheck: true,
    hot: false,
    quiet: false,
    noInfo: false,
    stats: {
      colors: true,
    },
    proxy: {
      '/data/**': {
        target: 'http://${settings.devServerConfig.host()}:${settings.devServerConfig.port()}/Data',
        pathRewrite: {
          '^/data': ''
        },
      },
    },
  },
};
`;
};
