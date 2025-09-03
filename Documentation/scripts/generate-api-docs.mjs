import dox from 'dox';
import fs from 'fs/promises';
import fsSync from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { Eta } from 'eta';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const cwd = path.join(__dirname, '..', '..', 'Sources');
const eta = new Eta();

const readSource = async (file) => (await fs.readFile(file)).toString();

function parseComments(source) {
  return dox.parseComments(source, { raw: true, skipSingleStar: true });
}

function getIntroduction(comments) {
  return comments.filter(
    (item) =>
      !item.ctx && item.code && item.code.startsWith('export declare const vtk')
  )[0];
}

function stripPTags(str) {
  return str.replace(/<p>([\S\s]+?)<\/?p>/g, `$1`);
}

function isDeprecated(item) {
  return item.tags.find((tag) => tag.type === `deprecated`);
}

function walkSync(dir, filelist = []) {
  const entries = fsSync.readdirSync(dir, { withFileTypes: true });
  return entries
    .reduce((acc, entry) => {
      const fullPath = path.join(dir, entry.name);
      return entry.isDirectory() ? walkSync(fullPath, acc) : [...acc, fullPath];
    }, filelist)
    .filter((file) => file.toLowerCase().endsWith('index.d.ts'));
}

const files = walkSync(cwd);

async function main() {
  await Promise.all(
    files.map(async (dts) => {
      const relPath = path.relative(cwd, dts);
      const dtsGhLink = `https://github.com/Kitware/vtk-js/tree/master/Sources/${relPath.replace(
        /\\/g,
        '/'
      )}`;

      const jsGhLink = dtsGhLink.replace('.d.ts', '.js');

      // check if parent folder has an example/index.js
      const exampleIndex = dts.replace('index.d.ts', 'example\\index.js');
      let exampleLink = null;

      if (fsSync.existsSync(exampleIndex)) {
        const exampleName = path.basename(
          path.dirname(path.dirname(exampleIndex))
        );
        exampleLink = `https://kitware.github.io/vtk-js/examples/${exampleName}.html`;
      }

      const parts = relPath.split(path.sep);
      parts.pop();
      const mdFile = `${parts.join('_')}.md`;
      const contents = await readSource(dts);
      const items = parseComments(contents);
      const introductionElm = getIntroduction(items);

      const elements = items
        // filter down to public methods of the current namespace/class
        .filter((item) => !item.isPrivate && item.ctx && !isDeprecated(item))

        // sort by method name within each namespace
        .sort((a, b) => (a.ctx.name > b.ctx.name ? 1 : -1))
        // transform each method's data into the format we want (for instance stripping out
        // <p> tags and adding a `required` field rather than [] around param names)
        .map((item) => ({
          name: `${item.ctx.name}`,
          arguments: item.tags
            .filter((arg) => !!arg.name)
            .map((arg) => ({
              name: arg.name,
              description: stripPTags(arg.description),
              required: !arg.name.startsWith(`[`),
              types:
                arg.typesDescription === `<code>*</code>`
                  ? `any`
                  : arg.types.join(` or `),
            })),
          returns: item.tags
            .filter((tag) => tag.type === `returns`)
            .map((tag) => ({
              description: stripPTags(tag.description),
              types: tag.types.join(` or `),
            })),
          description: item.description.full,
        }));

      let introduction;
      let usage;
      let seeAlso;
      if (
        introductionElm &&
        introductionElm.description &&
        introductionElm.description.full
      ) {
        introduction = introductionElm.description.full;
        usage = introductionElm.tags.find((tag) => tag.type === 'example');
        seeAlso = introductionElm.tags.filter((tag) => tag.type === 'see');
      }
      const markdown = eta.renderString(
        await readSource('./scripts/templates/api.md'),
        {
          title: parts[parts.length - 1],
          jsGhLink,
          dtsGhLink,
          exampleLink,
          introduction,
          usage: usage ? usage.string : null,
          seeAlso: seeAlso || null,
          elements,
        }
      );
      await fs.writeFile(path.join('api', mdFile), markdown);
      console.log(mdFile, 'has been generated!');
    })
  );
}

main();
