import MagicString from 'magic-string';

/**
 * find: RegExp | String
 * replace: String
 */
/* eslint-disable import/prefer-default-export */
export function rewriteFilenames(pluginOptions) {
  const opts = {
    ...pluginOptions,
    find: new RegExp(pluginOptions.find),
  };
  return {
    name: 'rewrite-filenames',
    generateBundle(outputOptions, bundle, isWrite) {
      const files = Object.keys(bundle);
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        const info = bundle[file];

        if (opts.find.test(file)) {
          const newFileName = file.replace(opts.find, opts.replace);
          info.fileName = newFileName;
          bundle[newFileName] = info;
          delete bundle[file];
        }

        // search contents for offending import filenames
        const importRe = new RegExp(
          '(import .+? from\\s*["\'])(.+?)(["\']\\s*;?)',
          'g'
        );

        let match;
        do {
          match = importRe.exec(info.code);
          if (match) {
            const target = match[2];
            const start = match.index + match[1].length;
            const end = start + target.length;
            if (opts.find.test(target)) {
              const magicCode = new MagicString(info.code);
              const newTarget = target.replace(opts.find, opts.replace);
              magicCode.overwrite(start, end, newTarget);
              info.code = magicCode.toString();
            }
          }
        } while (match);
      }
    },
  };
}
