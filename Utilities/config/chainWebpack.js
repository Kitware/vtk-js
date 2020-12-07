module.exports = function chainWebpack(config) {
  config.module
    .rule('vtk-glsl')
    .test(/\.glsl$/i)
    .include.add(/vtk\.js[/\\]Sources/)
    .end()
    .use('shader-loader')
    .loader('shader-loader')
    .end();

  config.module
    .rule('vtk-js')
    .test(/\.js$/i)
    .include.add(/vtk\.js[/\\]Sources/)
    .end()
    .use('babel-loader')
    .loader('babel-loader')
    .end();

  config.module
    .rule('vtk-worker')
    .test(/\.worker\.js$/)
    .include.add(/vtk\.js[/\\]Sources/)
    .end()
    .use('worker-loader')
    .loader('worker-loader')
    .options({ inline: 'no-fallback' })
    .end();

  config.module
    .rule('vtk-css')
    .test(/\.css$/)
    .exclude.add(/\.module\.css$/)
    .end()
    .include.add(/vtk\.js[/\\]Sources/)
    .end()
    .use('styles')
    .loader('style-loader')
    .loader('css-loader')
    .loader('postcss-loader')
    .end();

  config.module
    .rule('vtk-svg')
    .test(/\.svg$/)
    .include.add(/vtk\.js[/\\]Sources/)
    .end()
    .use('raw-loader')
    .loader('raw-loader')
    .end();

  config.module
    .rule('vtk-module-css')
    .test(/\.css$/)
    .include.add(/vtk\.js[/\\]Sources/)
    .add(/\.module\.css$/)
    .end()
    .use('styles')
    .loader('style-loader')
    .loader('css-loader')
    .options({
      modules: {
        localIdentName: '[name]-[local]_[sha512:hash:base64:5]',
      },
    })
    .loader('postcss-loader')
    .end();
}
