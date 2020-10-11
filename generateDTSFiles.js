const fs = require('fs');
const path = require('path');
const walk = require('walkdir');
const { create } = require('js2dts');

const generateDTS = (filepath) => {
  walk(filepath, (file) => {
    // If a matching .d.ts file doesn't exist, make one
    if (file.endsWith('.js') && !fs.existsSync(file.replace('.js', '.d.ts'))) {
      const env = create(file, {});
      env.write();
    }
  });
};

generateDTS(path.join(__dirname, 'Sources'));
generateDTS(path.join(__dirname, 'Utilities'));