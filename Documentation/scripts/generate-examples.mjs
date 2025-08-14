import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import HtmlWebpackPlugin from 'html-webpack-plugin';
import webpack from 'webpack';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const SOURCE_ROOT = path.resolve(__dirname, '../../Sources');
const EXAMPLES_ROOT = path.resolve(__dirname, '../../');

const templatePath = path.resolve(__dirname, './example.html');
const BASE_URL = '/';

async function walkExamples(dir, category = null, results = []) {
  const entries = await fs.readdir(dir, { withFileTypes: true });
  await Promise.all(
    entries.map(async (entry) => {
      const fullPath = path.join(dir, entry.name);
      if (entry.name === 'node_modules') {
        // Skip node_modules directories
        return;
      }
      if (entry.isDirectory()) {
        await walkExamples(fullPath, category || entry.name, results);
      } else if (entry.name === 'index.js') {
        // Only include if path matches /example/index.js$/
        const relPath = path
          .relative(EXAMPLES_ROOT, fullPath)
          .replace(/\\/g, '/');

        if (
          !(/example\/index\.js$/.test(relPath) || /^Examples\//.test(relPath))
        )
          return;

        // Example name is the parent directory
        const exampleName = path.basename(path.dirname(path.dirname(fullPath)));
        const exampleCategory = category || 'Uncategorized';
        // Link convention
        results.push({
          name: exampleName,
          category: exampleCategory,
          sourcePath: fullPath,
          destPath: path.join(
            EXAMPLES_ROOT,
            'dist',
            exampleCategory,
            `${exampleName}.js`
          ),
        });
      }
    })
  );
  return results;
}

function buildWebpackConfiguration(
  name,
  baseURL,
  sourcePath,
  destPath,
  compress
) {
  const examplePlugins = [
    new HtmlWebpackPlugin({
      template: templatePath,
      inject: 'body',
      title: name,
    }),
    new webpack.DefinePlugin({
      __BASE_PATH__: `'${baseURL}'`,
    }),
  ];

  const config = {
    plugins: [],
    mode: compress ? 'production' : 'development',
    entry: sourcePath,
    output: {
      path: destPath,
      filename: `${name}.js`,
    },
  };

  // Add our plugins
  config.plugins = [].concat(config.plugins, examplePlugins);

  // // Expose build module
  // if (config.module.loaders) {
  //   config.module.loaders.unshift({
  //     test: sourcePath,
  //     loader: 'expose-loader',
  //     options: {
  //       exposes: name,
  //     },
  //   });
  // } else if (config.module.rules) {
  //   config.module.rules.unshift({
  //     test: sourcePath,
  //     loader: 'expose-loader',
  //     options: {
  //       exposes: name,
  //     },
  //   });
  // }

  return config;
}
async function buildExamples(examples) {
  // Build all examples sequentially to avoid "Unexpected `await` inside a loop" warning
  function buildOne(i) {
    if (i >= examples.length) return Promise.resolve();
    const example = examples[i];
    const { name, category, sourcePath, destPath } = example;
    console.log(
      `Building Example: ${name}, Category: ${category}, Path: ${sourcePath}`
    );
    const config = buildWebpackConfiguration(
      name,
      BASE_URL,
      sourcePath,
      destPath
    );

    return new Promise((resolve) => {
      webpack(config, (err, stats) => {
        if (err || stats.hasErrors()) {
          console.error(`Failed to build ${name}:`, err || stats.toString());
        } else {
          console.log(`Built: ${destPath}`);
        }
        resolve(buildOne(i + 1));
      });
    });
  }
  return buildOne(0);
}

async function main() {
  const examples = await walkExamples(EXAMPLES_ROOT);
  await buildExamples(examples);
  // console.log(JSON.stringify(examples, null, 2));
}

main();
