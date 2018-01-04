import HtmlDataAccessHelper from './HtmlDataAccessHelper';
import HttpDataAccessHelper from './HttpDataAccessHelper';
import JSZipDataAccessHelper from './JSZipDataAccessHelper';

const TYPE_MAPPING = {
  http: (options) => HttpDataAccessHelper,
  zip: (options) => JSZipDataAccessHelper.create(options),
  html: (options) => HtmlDataAccessHelper,
};

function get(type = 'http', options = {}) {
  return TYPE_MAPPING[type](options);
}

export default {
  get,
};
