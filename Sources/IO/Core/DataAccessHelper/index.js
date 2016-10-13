import HttpDataAccessHelper from './HttpDataAccessHelper';
import JSZipDataAccessHelper from './JSZipDataAccessHelper';

const TYPE_MAPPING = {
  http: options => HttpDataAccessHelper,
  zip: options => JSZipDataAccessHelper.create(options),
};

export default function getDataAccessHelper(type = 'http', options = {}) {
  return TYPE_MAPPING[type](options);
}
