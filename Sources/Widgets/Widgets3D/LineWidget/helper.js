import * as vtkMath from 'vtk.js/Sources/Common/Core/Math/';

export function calculateTextPosition(model, linePos) {
  const vector = [0, 0, 0];
  const handle1WorldPos = model.widgetState.getHandle1List()[0].getOrigin();
  const handle2WorldPos = model.widgetState.getHandle2List()[0].getOrigin();
/*	console.log("sale affichage");
	console.log(handle1WorldPos);
	console.log(handle2WorldPos);
	console.log(model.linePos);*/
  linePos = 1 - model.linePos;
  vtkMath.subtract(handle1WorldPos, handle2WorldPos, vector);
  vtkMath.multiplyScalar(vector, linePos);
  vtkMath.add(vector, handle2WorldPos, vector);
  return vector;
}


export function updateTextPosition(model, linePos) {
	
	console.log("dans updateTextPosition linePos = " + linePos);
  const obj = model.widgetState.getTextList()[0];
  obj.setOrigin(
    calculateTextPosition(model, linePos)
  );
}
