// See typescript header for documentation

export function getTransferFunctionHash(
  transferFunction,
  useIndependentComponents,
  numberOfComponents
) {
  return transferFunction
    ? `${transferFunction.getMTime()}-${useIndependentComponents}-${numberOfComponents}`
    : '0';
}

export default { getTransferFunctionHash };
