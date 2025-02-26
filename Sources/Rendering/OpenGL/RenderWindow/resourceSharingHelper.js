// See typescript header for documentation

export function getTransferFunctionsHash(
  transferFunctions,
  useIndependentComponents,
  numberOfComponents
) {
  return transferFunctions.length > 0
    ? `${transferFunctions
        .map((tf) => tf?.getMTime() ?? 'x')
        .join('/')}-${useIndependentComponents}-${numberOfComponents}`
    : '0';
}

export function getImageDataHash(image, scalars) {
  // Don't use the image data, as the scalars will define the texture
  // If using the image data in the hash, it will cause issues when two image data
  // using the same scalars are in the same mapper (for example the VolumeMapper)
  return `${scalars.getMTime()}`;
}

export default { getTransferFunctionsHash, getImageDataHash };
