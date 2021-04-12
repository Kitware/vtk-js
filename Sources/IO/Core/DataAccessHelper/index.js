const TYPE_MAPPING = {};

export function has(type) {
  return !!TYPE_MAPPING[type];
}

export function get(type = 'http', options = {}) {
  return TYPE_MAPPING[type](options);
}

export function registerType(type, fn) {
  TYPE_MAPPING[type] = fn;
}

export default {
  get,
  has,
  registerType,
};
