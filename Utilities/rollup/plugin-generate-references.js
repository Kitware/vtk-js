import * as fs from 'fs';
import path from 'path';

export function generateDtsReferences(pluginOptions) {

  const rootDts = 'index.d.ts';
  const dtsReferences = [
    '/// <reference path="./types.d.ts" />',
    '/// <reference path="./interfaces.d.ts" />',
  ];

  return {
    name: 'generate-references',
    generateBundle(outputOptions, bundle, isWrite) {
      const files = Object.keys(bundle);

      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        let filename = file.replace('.js', '.d.ts');

        const dts = path.join(pluginOptions['dest'], filename);

        if (fs.existsSync(dts) && filename !== rootDts) {
          filename = filename.replace(/\\/g, '/');
          dtsReferences.push(`/// <reference path="./${filename}" />`);
        }
      }

      this.emitFile({
        type: 'asset',
        fileName: rootDts,
        source: dtsReferences.join("\r\n")
      });
    }
  };
}
