import fs from 'fs';
import path from 'path';

function stripQueryAndHash(id) {
  return id.replace(/[?#].*$/, '');
}

/**
 * Load .glsl files as raw strings.
 */
export function glslPlugin() {
  return {
    name: 'vtk-glsl',
    load(id) {
      const fileId = stripQueryAndHash(id);
      if (fileId.endsWith('.glsl')) {
        const content = fs.readFileSync(fileId, 'utf-8');
        return {
          code: `export default ${JSON.stringify(content)};`,
          moduleType: 'js',
        };
      }
    },
  };
}

/**
 * Load .svg files as raw strings.
 */
export function svgRawPlugin() {
  const VIRTUAL_PREFIX = '\0vtk-svg-raw:';

  return {
    name: 'vtk-svg-raw',
    enforce: 'pre',
    async resolveId(source, importer, options) {
      if (!source.endsWith('.svg') || source.includes('?')) {
        return null;
      }

      const resolved = await this.resolve(source, importer, {
        ...options,
        skipSelf: true,
      });
      if (!resolved) {
        return null;
      }

      return `${VIRTUAL_PREFIX}${resolved.id}`;
    },
    load(id) {
      if (!id.startsWith(VIRTUAL_PREFIX)) {
        return null;
      }

      const fileId = stripQueryAndHash(id.slice(VIRTUAL_PREFIX.length));
      if (fileId.endsWith('.svg')) {
        const content = fs.readFileSync(fileId, 'utf-8');
        return {
          code: `export default ${JSON.stringify(content)};`,
          moduleType: 'js',
        };
      }
    },
  };
}

/**
 * Load .cjson files as JSON modules.
 */
export function cjsonPlugin() {
  return {
    name: 'vtk-cjson',
    load(id) {
      const fileId = stripQueryAndHash(id);
      if (fileId.endsWith('.cjson')) {
        const content = fs.readFileSync(fileId, 'utf-8');
        return {
          code: `export default ${content};`,
          moduleType: 'js',
        };
      }
    },
  };
}

/**
 * Resolve .worker imports using Vite native inline workers.
 */
export function workerInlinePlugin() {
  return {
    name: 'vtk-worker-inline',
    enforce: 'pre',
    async resolveId(source, importer, options) {
      if (/\.worker(?:\.js)?$/.test(source) && !source.includes('?')) {
        const actualSource = source.endsWith('.js') ? source : `${source}.js`;
        const resolved = await this.resolve(actualSource, importer, {
          ...options,
          skipSelf: true,
        });
        if (resolved) {
          return `${resolved.id}?worker&inline`;
        }
      }
    },
  };
}

/**
 * Ignore specific modules (e.g. crypto) by replacing them with empty exports.
 */
export function ignorePlugin(modules) {
  return {
    name: 'vtk-ignore',
    resolveId(source) {
      if (modules.includes(source)) {
        return { id: `\0ignore:${source}`, moduleSideEffects: false };
      }
    },
    load(id) {
      if (id.startsWith('\0ignore:')) {
        return { code: 'export default {};', moduleType: 'js' };
      }
    },
  };
}

/**
 * Serve a directory as static files via the Vite dev server.
 */
export function serveStaticDataPlugin(rootDir) {
  return {
    name: 'vtk-serve-data',
    configureServer(server) {
      server.middlewares.use('/Data', (req, res, next) => {
        const filePath = path.join(rootDir, 'Data', req.url);
        if (fs.existsSync(filePath) && fs.statSync(filePath).isFile()) {
          res.writeHead(200);
          res.end(fs.readFileSync(filePath));
        } else {
          next();
        }
      });
    },
  };
}

export function createVtkPlugins({
  includeCjson = false,
  includeStaticData = false,
  staticDataRootDir,
} = {}) {
  const plugins = [workerInlinePlugin(), glslPlugin(), svgRawPlugin()];

  if (includeCjson) {
    plugins.push(cjsonPlugin());
  }

  plugins.push(ignorePlugin(['crypto']));

  if (includeStaticData && staticDataRootDir) {
    plugins.push(serveStaticDataPlugin(staticDataRootDir));
  }

  return plugins;
}
