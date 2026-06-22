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

function computeFnToString(property, fn, numberOfComponents) {
  const pwfun = fn.apply(property);
  if (pwfun) {
    const iComps = property.getIndependentComponents();
    return `${property.getMTime()}-${iComps}-${numberOfComponents}`;
  }
  return '0';
}

export {
  computeFnToString,
  getLUTRowCenterExpression,
  getTextureChannelMode,
  getUseLabelOutline,
  textureSamplerMatches,
};
