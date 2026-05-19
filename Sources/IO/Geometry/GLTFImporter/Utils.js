import macro from 'vtk.js/Sources/macros';
import vtkTexture from 'vtk.js/Sources/Rendering/Core/Texture';
import {
  BYTES,
  COMPONENTS,
  ARRAY_TYPES,
  GL_SAMPLER,
} from 'vtk.js/Sources/IO/Geometry/GLTFImporter/Constants';

const { vtkErrorMacro } = macro;
const imageBufferViewCache = new WeakMap();
const imageUriCache = new Map();

/**
 * Get GL enum from sampler parameter
 * @param {*} parameter The sampler parameter
 * @returns The GL enum
 */
export function getGLEnumFromSamplerParameter(parameter) {
  const GL_TEXTURE_MAG_FILTER = 0x2800;
  const GL_TEXTURE_MIN_FILTER = 0x2801;
  const GL_TEXTURE_WRAP_S = 0x2802;
  const GL_TEXTURE_WRAP_T = 0x2803;

  const Mapping = {
    magFilter: GL_TEXTURE_MAG_FILTER,
    minFilter: GL_TEXTURE_MIN_FILTER,
    wrapS: GL_TEXTURE_WRAP_S,
    wrapT: GL_TEXTURE_WRAP_T,
  };

  return Mapping[parameter];
}

export function getAccessorArrayTypeAndLength(accessor, bufferView) {
  const ArrayType = ARRAY_TYPES[accessor.componentType];
  const components = COMPONENTS[accessor.type];
  const bytesPerComponent = BYTES[accessor.componentType];
  const length = accessor.count * components;
  const byteLength = accessor.count * components * bytesPerComponent;
  return { ArrayType, length, byteLength };
}

/**
 * Resolves a URL based on the original path
 * @param {*} url The URL to resolve
 * @param {*} originalPath The original path to resolve the URL against
 * @returns The resolved URL or an empty string if the URL is invalid
 */
export function resolveUrl(url, originalPath) {
  // Invalid URL
  if (typeof url !== 'string' || url === '') return '';

  try {
    // Data URI
    if (url.startsWith('data:')) return url;

    // Blob URL
    if (url.startsWith('blob:')) return url;

    // Create URL object from the original path
    const baseUrl = new URL(originalPath);
    if (!baseUrl.pathname.includes('.') && !baseUrl.pathname.endsWith('/')) {
      baseUrl.pathname += '/';
    }

    // Absolute URL (http://, https://, //)
    if (
      url.startsWith('http:') ||
      url.startsWith('https:') ||
      url.startsWith('//')
    ) {
      return new URL(url, baseUrl).href;
    }

    // Host Relative URL
    if (url.startsWith('/')) {
      return new URL(url, baseUrl).href;
    }

    // Relative URL
    return new URL(url, baseUrl).href;
  } catch (error) {
    vtkErrorMacro('Error resolving URL:', error);
    return '';
  }
}

/**
 * Loads image from buffer or URI
 * @param {*} image
 * @returns
 */
export async function loadImage(image) {
  if (!image) {
    return null;
  }

  const cacheKey = image.bufferView || image.uri || null;
  if (cacheKey) {
    const cache = image.bufferView ? imageBufferViewCache : imageUriCache;
    if (cache.has(cacheKey)) {
      const cachedValue = cache.get(cacheKey);
      if (cachedValue && typeof cachedValue.then === 'function') {
        return cachedValue;
      }
      if (cachedValue && typeof cachedValue.deref === 'function') {
        const cachedImage = cachedValue.deref();
        if (cachedImage) {
          return cachedImage;
        }
        cache.delete(cacheKey);
      }
    }
  }

  const loadPromise = (async () => {
    if (image.bufferView) {
      const blob = new Blob([image.bufferView.data], { type: image.mimeType });
      return createImageBitmap(blob, {
        premultiplyAlpha: 'none',
        colorSpaceConversion: 'none',
        imageOrientation: 'flipY',
      });
    }

    if (image.uri) {
      return new Promise((resolve, reject) => {
        const img = new Image();
        img.crossOrigin = 'Anonymous';
        img.onload = () => {
          createImageBitmap(img, {
            premultiplyAlpha: 'none',
            colorSpaceConversion: 'none',
            imageOrientation: 'flipY',
          }).then(resolve, reject);
        };
        img.onerror = reject;
        img.src = image.uri;
      });
    }

    return null;
  })();

  if (cacheKey) {
    const cache = image.bufferView ? imageBufferViewCache : imageUriCache;
    cache.set(cacheKey, loadPromise);
  }

  try {
    const loadedImage = await loadPromise;
    if (cacheKey && loadedImage) {
      const cache = image.bufferView ? imageBufferViewCache : imageUriCache;
      if (typeof WeakRef === 'function') {
        /* eslint-disable no-undef */
        cache.set(cacheKey, new WeakRef(loadedImage));
      } else {
        cache.delete(cacheKey);
      }
    }
    return loadedImage;
  } catch (error) {
    if (cacheKey) {
      const cache = image.bufferView ? imageBufferViewCache : imageUriCache;
      cache.delete(cacheKey);
    }
    throw error;
  }
}

export function clearImageCaches() {
  imageUriCache.clear();
}

/**
 *
 * @param {*} image
 * @param {*} sampler
 * @param {*} extensions
 * @returns
 */
export function createVTKTextureFromGLTFTexture(image, sampler, extensions) {
  const texture = vtkTexture.newInstance();
  // Apply sampler settings
  if (sampler) {
    if (
      ('wrapS' in sampler && 'wrapT' in sampler) ||
      ('minFilter' in sampler && 'magFilter' in sampler)
    ) {
      // Per-axis wrap mode: default to REPEAT per glTF spec when not specified
      const wrapS = sampler.wrapS ?? GL_SAMPLER.REPEAT;
      const wrapT = sampler.wrapT ?? GL_SAMPLER.REPEAT;

      // Map glTF wrap constants to WebGPU address mode strings
      const glWrapToAddressMode = (w) => {
        if (w === GL_SAMPLER.CLAMP_TO_EDGE) return 'clamp-to-edge';
        if (w === GL_SAMPLER.MIRRORED_REPEAT) return 'mirror-repeat';
        return 'repeat';
      };
      texture.setWrapS(glWrapToAddressMode(wrapS));
      texture.setWrapT(glWrapToAddressMode(wrapT));

      // Legacy flags for backward compatibility with OpenGL backend
      const hasClamp =
        wrapS === GL_SAMPLER.CLAMP_TO_EDGE ||
        wrapT === GL_SAMPLER.CLAMP_TO_EDGE;
      const hasRepeat =
        wrapS === GL_SAMPLER.REPEAT || wrapT === GL_SAMPLER.REPEAT;
      texture.setEdgeClamp(hasClamp);
      texture.setRepeat(hasRepeat && !hasClamp);

      const linearFilters = [
        GL_SAMPLER.LINEAR,
        GL_SAMPLER.LINEAR_MIPMAP_NEAREST,
        GL_SAMPLER.NEAREST_MIPMAP_LINEAR,
        GL_SAMPLER.LINEAR_MIPMAP_LINEAR,
      ];

      if (
        linearFilters.includes(sampler.minFilter) ||
        linearFilters.includes(sampler.magFilter)
      ) {
        texture.setInterpolate(true);
      }

      // Enable mipmaps when sampler minFilter uses mipmap variants
      const mipmapFilters = [
        GL_SAMPLER.NEAREST_MIPMAP_NEAREST,
        GL_SAMPLER.LINEAR_MIPMAP_NEAREST,
        GL_SAMPLER.NEAREST_MIPMAP_LINEAR,
        GL_SAMPLER.LINEAR_MIPMAP_LINEAR,
      ];
      if (mipmapFilters.includes(sampler.minFilter)) {
        texture.setMipLevel(8);
      }
    } else {
      // Empty sampler: glTF defaults → REPEAT wrap, LINEAR filter
      texture.setMipLevel(8);
      texture.setInterpolate(true);
      texture.setRepeat(true);
      texture.setEdgeClamp(false);
      texture.setWrapS('repeat');
      texture.setWrapT('repeat');
    }
  }
  texture.setImageBitmap(image);
  return texture;
}
