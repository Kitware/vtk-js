const dox = require('dox');
const fs = require('fs');
const path = require('path');

const { template, trim } = require(`lodash`);

const cwd = path.join(__dirname, '..', 'Sources');

const readSource = (file) => fs.readFileSync(file).toString();

function parseComments(source) {
  return dox.parseComments(source, { raw: true, skipSingleStar: true });
}

/**
 * Get the list of index.d.ts file
 * @param dir
 * @param filelist
 */
function walkSync(dir, filelist = []) {
  fs.readdirSync(dir).forEach((file) => {
    // eslint-disable-next-line no-param-reassign
    filelist = fs.statSync(path.join(dir, file)).isDirectory()
      ? walkSync(path.join(dir, file), filelist)
      : filelist.concat(path.join(dir, file));
  });
  return filelist.filter((file) => file.toLowerCase().endsWith('index.d.ts'));
}

function stripPTags(str) {
  return str.replace(/<p>([\S\s]+?)<\/?p>/g, `$1`);
}

function isDeprecated(item) {
  return item.tags.find((tag) => tag.type === `deprecated`);
}

/**
 * Convert dox results to markdown then save them as api.md
 * @param items
 */
function doxToMD(items) {
  const renderMD = template(
    fs.readFileSync('./Documentation/api.md').toString()
  );
  const introductionElm = items.filter(
    (item) =>
      !item.ctx && item.code && item.code.startsWith('export declare const vtk')
  )[0];

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
          name: trim(arg.name, `[]`),
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
  return renderMD({
    introduction,
    usage: usage ? usage.string : null,
    seeAlso: seeAlso || null,
    elements,
  });
}

const files = walkSync(cwd);

files.forEach((dts) => {
  const apiFile = path.join(path.dirname(dts), 'api.md');
  const parsedDocumentation = parseComments(readSource(dts));
  const content = doxToMD(parsedDocumentation);
  fs.writeFile(apiFile, content, (err) => {
    if (err) {
      return console.log(err);
    }
    console.log(apiFile, 'has been generated!');
  });
});
