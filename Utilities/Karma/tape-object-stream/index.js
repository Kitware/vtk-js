const path = require('path');

function createPattern(pathPattern) {
  return { pattern: pathPattern, included: true, served: true, watched: false };
}

function initTapeObjectStream(files) {
  files.unshift(createPattern(path.join(__dirname, 'adapter.js')));
}

initTapeObjectStream.$inject = ['config.files'];

module.exports = {
  'framework:tape-object-stream': ['factory', initTapeObjectStream],
};
