const TYPE_MAPPING = {};

export function get(type = 'http', options = {}) {
  return TYPE_MAPPING[type](options);
}

export function registerType(type, fn) {
  TYPE_MAPPING[type] = fn;
}

export default {
  get,
  registerType,
};
