import * as htmlWebpackPlugin from 'html-webpack-plugin';
import { DefinePlugin } from 'webpack';
declare const _WebpackConfig: _WebpackConfig.T110;
declare namespace _WebpackConfig {
  export interface T100 {
    path: string;
    filename: string;
  }
  export interface T101 {
    rules: any[];
  }
  export interface T102 {
    "vtk.js": string;
  }
  export interface T103 {
    alias: _WebpackConfig.T102;
  }
  export interface T104 {
    fs: string;
  }
  export interface T105 {
    colors: boolean;
  }
  export interface T106 {
    "^/data": string;
  }
  export interface T107 {
    target: string;
    pathRewrite: _WebpackConfig.T106;
  }
  export interface T108 {
    "/data/**": _WebpackConfig.T107;
  }
  export interface T109 {
    contentBase: string;
    port: number;
    host: string;
    disableHostCheck: boolean;
    hot: boolean;
    quiet: boolean;
    noInfo: boolean;
    stats: _WebpackConfig.T105;
    proxy: _WebpackConfig.T108;
  }
  export interface T110 {
    mode: string;
    devtool: string;
    plugins: Array<htmlWebpackPlugin | DefinePlugin>;
    entry: string;
    output: _WebpackConfig.T100;
    module: _WebpackConfig.T101;
    resolve: _WebpackConfig.T103;
    node: _WebpackConfig.T104;
    devServer: _WebpackConfig.T109;
  }
}
export = _WebpackConfig;
