import * as vtkMath from 'vtk.js/Sources/Common/Core/Math/';

export function calculateTextPosition(model) {
  const vector = [0, 0, 0];
  const handle1WorldPos = model.widgetState.getHandle1().getOrigin();
  const handle2WorldPos = model.widgetState.getHandle2().getOrigin();
  let statePositionOnLine = model.widgetState.getPositionOnLine();
  statePositionOnLine = 1 - statePositionOnLine;
  vtkMath.subtract(handle1WorldPos, handle2WorldPos, vector);
  vtkMath.multiplyScalar(vector, statePositionOnLine);
  vtkMath.add(vector, handle2WorldPos, vector);
  return vector;
}

export function updateTextPosition(model) {
  const SVGTextState = model.widgetState.getText();
  SVGTextState.setOrigin(calculateTextPosition(model));
}
