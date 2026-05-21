#! /usr/bin/env node

import { program } from 'commander';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { createServer } from 'vite';
import { createExampleConfig } from './vite.example.config.mjs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const REPO_ROOT = path.resolve(__dirname, '../..');
const SOURCES_ROOT = path.join(REPO_ROOT, 'Sources');
const EXAMPLES_ROOT = path.join(REPO_ROOT, 'Examples');
const DEFAULT_HOST = '0.0.0.0';
const DEFAULT_PORT = 9999;

program
  .option('--no-browser', 'Do not open the browser')
  .option(
    '--server-type <type>',
    'Specify http (default) or self-signed https for serving examples',
    'http'
  )
  .option('--host <host>', 'Server host', DEFAULT_HOST)
  .option('--port <port>', 'Server port', String(DEFAULT_PORT))
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
  if (!fs.existsSync(dirPath)) return;
  for (const entry of fs.readdirSync(dirPath, { withFileTypes: true })) {
    const fullPath = path.join(dirPath, entry.name);
    if (entry.isDirectory()) {
      walkFiles(fullPath, onFile);
    } else {
      onFile(fullPath);
    }
  }
}

function collectExamples() {
  const examples = {};

  walkFiles(SOURCES_ROOT, (fullPath) => {
    if (!fullPath.endsWith('index.js')) return;
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
    if (!fullPath.endsWith('index.js')) return;
    const relPath = normalizePath(path.relative(EXAMPLES_ROOT, fullPath));
    if (!isStandaloneExample(relPath)) return;
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
  console.log(`\n=> Running example "${exampleName}"`);
  console.log(
    `=> Entry: ${normalizePath(path.relative(REPO_ROOT, entryPath))}\n`
  );

  const server = await createServer(
    createExampleConfig({
      repoRoot: REPO_ROOT,
      entry: entryPath,
      name: exampleName,
      host: options.host,
      port: Number(options.port),
      openBrowser: options.browser,
      useHttps: options.serverType === 'https',
    })
  );
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
