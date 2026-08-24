import { TextureChannelMode } from 'vtk.js/Sources/Rendering/WebGPU/ImageMapper/Constants';

function textureSamplerMatches(textureView, options) {
  const sampler = textureView?.getSampler?.();
  if (!sampler) {
    return false;
  }
  const current = sampler.getOptions();
  return (
    current.minFilter === options.minFilter &&
    current.magFilter === options.magFilter &&
    current.mipmapFilter === (options.mipmapFilter ?? 'nearest') &&
    current.addressModeU === (options.addressModeU ?? 'clamp-to-edge') &&
    current.addressModeV === (options.addressModeV ?? 'clamp-to-edge') &&
    current.addressModeW === (options.addressModeW ?? 'clamp-to-edge')
  );
}

function getTextureChannelMode(independentComponents, numberOfComponents) {
  if (independentComponents) {
    switch (numberOfComponents) {
      case 1:
        return TextureChannelMode.INDEPENDENT_1;
      case 2:
        return TextureChannelMode.INDEPENDENT_2;
      case 3:
        return TextureChannelMode.INDEPENDENT_3;
      default:
        return TextureChannelMode.INDEPENDENT_4;
    }
  }

  switch (numberOfComponents) {
    case 1:
      return TextureChannelMode.SINGLE;
    case 2:
      return TextureChannelMode.DEPENDENT_LA;
    case 3:
      return TextureChannelMode.DEPENDENT_RGB;
    default:
      return TextureChannelMode.DEPENDENT_RGBA;
  }
}

function getLUTRowCenterExpression(componentIndex, rowsVar = 'tfunRows') {
  return `${2 * componentIndex + 0.5} / ${rowsVar}`;
}

function getUseLabelOutline(
  property,
  independentComponents,
  numberOfComponents
) {
  return (
    property.getUseLabelOutline() &&
    !independentComponents &&
    numberOfComponents === 1
  );
}

/**
 * Compute a string that uniquely identifies the texture sampling function for a given property.
 * This is used to determine if a cached texture can be reused or if a new texture needs to be generated.
 * @param {*} property
 * @param {*} fn
 * @param {*} numberOfComponents
 * @param {*} options
 * @returns
 */
function computeFnToString(property, fn, numberOfComponents, options = {}) {
  // Shared textures must have the same layout and source functions. The cache
  // key contains both items to prevent an incorrect texture match.
  const parts = [
    options.label ?? 'tfun',
    options.rowLength ?? 0,
    numberOfComponents,
  ];
  for (let c = 0; c < numberOfComponents; c++) {
    const tf = fn.call(property, c);
    if (tf) {
      parts.push(`${tf.getMTime()}:${tf.getRange().join(',')}`);
    } else {
      parts.push('none');
    }
  }
  return parts.join('-');
}

export {
  computeFnToString,
  getLUTRowCenterExpression,
  getTextureChannelMode,
  getUseLabelOutline,
  textureSamplerMatches,
};
