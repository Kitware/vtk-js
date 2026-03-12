#! /usr/bin/env node

/* eslint-disable no-console */
const { program } = require('commander');
const path = require('path');
const fs = require('fs');

const REPO_ROOT = path.resolve(__dirname, '../..');
const SOURCES_ROOT = path.join(REPO_ROOT, 'Sources');
const EXAMPLES_ROOT = path.join(REPO_ROOT, 'Examples');
const VITE_CONFIG_PATH = path.join(
  REPO_ROOT,
  'Utilities',
  'ExampleRunner',
  'vite.example.config.mjs'
);
const DEFAULT_HOST = '0.0.0.0';
const DEFAULT_PORT = '9999';

program
  .option('--no-browser', 'Do not open the browser')
  .option(
    '--server-type <type>',
    'Specify http (default) or self-signed https for serving examples',
    'http'
  )
  .parse(process.argv);

const options = program.opts();

function normalizePath(filePath) {
  return filePath.replace(/\\/g, '/');
}

function isClassExample(relPath) {
  return /\/example\/index\.js$/.test(relPath);
}

function isStandaloneExample(relPath) {
  const parts = relPath.split('/');
  return parts.length === 3 && parts[2] === 'index.js';
}

function walkFiles(dirPath, onFile) {
  if (!fs.existsSync(dirPath)) {
    return;
  }
  const entries = fs.readdirSync(dirPath, { withFileTypes: true });
  entries.forEach((entry) => {
    const fullPath = path.join(dirPath, entry.name);
    if (entry.isDirectory()) {
      walkFiles(fullPath, onFile);
      return;
    }
    onFile(fullPath);
  });
}

function collectExamples() {
  const examples = {};

  walkFiles(SOURCES_ROOT, (fullPath) => {
    if (!fullPath.endsWith('index.js')) {
      return;
    }
    const relPath = normalizePath(path.relative(SOURCES_ROOT, fullPath));
    if (
      relPath.startsWith('Testing/') ||
      relPath === 'Testing' ||
      !isClassExample(relPath)
    ) {
      return;
    }
    const exampleName = path.basename(path.dirname(path.dirname(fullPath)));
    examples[exampleName] = fullPath;
  });

  walkFiles(EXAMPLES_ROOT, (fullPath) => {
    if (!fullPath.endsWith('index.js')) {
      return;
    }
    const relPath = normalizePath(path.relative(EXAMPLES_ROOT, fullPath));
    if (!isStandaloneExample(relPath)) {
      return;
    }
    const exampleName = path.basename(path.dirname(fullPath));
    examples[exampleName] = fullPath;
  });

  return examples;
}

function printExamples(examples) {
  const names = Object.keys(examples).sort((a, b) => a.localeCompare(b));
  if (!names.length) {
    console.log('=> No examples found');
    return;
  }

  console.log('\n=> Available examples\n');
  names.forEach((name) => {
    const relPath = normalizePath(path.relative(REPO_ROOT, examples[name]));
    console.log(` - ${name}: ${relPath}`);
  });
  console.log('\n=> To run an example:');
  console.log('  $ npm run example -- PUT_YOUR_EXAMPLE_NAME_HERE\n');
}

async function runExample(exampleName, entryPath) {
  const env = { ...process.env };
  env.EXAMPLE_ENTRY = entryPath;
  env.EXAMPLE_NAME = exampleName;
  env.EXAMPLE_REPO_ROOT = REPO_ROOT;
  env.EXAMPLE_HOST = env.EXAMPLE_HOST || DEFAULT_HOST;
  env.EXAMPLE_PORT = env.EXAMPLE_PORT || DEFAULT_PORT;
  env.EXAMPLE_OPEN = options.browser ? '1' : '0';
  env.EXAMPLE_HTTPS = options.serverType === 'https' ? '1' : '0';

  console.log(`\n=> Running example "${exampleName}"`);
  console.log(
    `=> Entry: ${normalizePath(path.relative(REPO_ROOT, entryPath))}\n`
  );

  Object.assign(process.env, env);

  const { createServer } = await import('vite');
  const server = await createServer({
    configFile: VITE_CONFIG_PATH,
  });
  await server.listen();
  server.printUrls();

  const closeServer = async () => {
    await server.close();
    process.exit(0);
  };

  process.on('SIGINT', closeServer);
  process.on('SIGTERM', closeServer);
}

const examples = collectExamples();
const requestedExample = (program.args || []).find((arg) => !!arg);

if (!requestedExample) {
  printExamples(examples);
  process.exit(0);
}

const entryPath = examples[requestedExample];
if (!entryPath) {
  console.error(
    `=> Error: Did not find any examples matching ${requestedExample}`
  );
  process.exit(1);
}

runExample(requestedExample, entryPath).catch((err) => {
  console.error(err);
  process.exit(1);
});
