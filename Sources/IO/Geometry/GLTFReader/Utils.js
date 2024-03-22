/* eslint-disable no-debugger */
/* eslint-disable no-useless-escape */
import { BYTES, COMPONENTS, ARRAY_TYPES } from './Contants';

export function getBytesFromComponentType(componentType) {
  return BYTES[componentType];
}

export function getSizeFromAccessorType(type) {
  return COMPONENTS[type];
}

// When undefined, a sampler with repeat wrapping and auto filtering should be used.
// https://github.com/KhronosGroup/glTF/tree/master/specification/2.0#texture
export function getGLEnumFromSamplerParameter(parameter) {
  const GL_TEXTURE_MAG_FILTER = 0x2800;
  const GL_TEXTURE_MIN_FILTER = 0x2801;
  const GL_TEXTURE_WRAP_S = 0x2802;
  const GL_TEXTURE_WRAP_T = 0x2803;

  // Sampler default values
  // const GL_REPEAT = 0x2901;
  // const GL_RLINEAR = 0x2601;
  // const GL_RNEAREST_MIPMAP_LINEAR = 0x2702;

  const PARAMETER_MAP = {
    magFilter: GL_TEXTURE_MAG_FILTER,
    minFilter: GL_TEXTURE_MIN_FILTER,
    wrapS: GL_TEXTURE_WRAP_S,
    wrapT: GL_TEXTURE_WRAP_T,
  };

  return PARAMETER_MAP[parameter];
}

export function getAccessorArrayTypeAndLength(accessor, bufferView) {
  const ArrayType = ARRAY_TYPES[accessor.componentType];
  const components = COMPONENTS[accessor.type];
  const bytesPerComponent = BYTES[accessor.componentType];
  const length = accessor.count * components;
  const byteLength = accessor.count * components * bytesPerComponent;
  return { ArrayType, length, byteLength };
}

export function resolveUrl(url, orginalPath) {
  let path = orginalPath;

  // Invalid URL
  if (typeof url !== 'string' || url === '') return '';

  // Host Relative URL
  if (/^https?:\/\//i.test(path) && /^\//.test(url)) {
    path = path.replace(/(^https?:\/\/[^\/]+).*/i, '$1');
  }

  // Absolute URL http://,https://,//
  if (/^(https?:)?\/\//i.test(url)) return url;

  // Data URI
  if (/^data:.*,.*$/i.test(url)) return url;

  // Blob URL
  if (/^blob:.*$/i.test(url)) return url;

  // Relative URL
  return path + url;
}
