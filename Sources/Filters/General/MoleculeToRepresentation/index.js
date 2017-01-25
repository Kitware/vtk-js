import * as macro     from '../../../macro';

import vtkPolyData    from '../../../Common/DataModel/PolyData';
import vtkDataArray   from '../../../Common/Core/DataArray';


// ----------------------------------------------------------------------------
// vtkMoleculeToRepresentation methods
// ----------------------------------------------------------------------------

export function vtkMoleculeToRepresentation(publicAPI, model) {
  // Set our className
  model.classHierarchy.push('vtkMoleculeToRepresentation');

  publicAPI.requestData = (inData, outData) => {
    // input
    const polydata = inData[0];

    if (!polydata) {
      vtkErrorMacro('Invalid or missing input');
      return 1;
    }

    // output
    const SphereData = vtkPolyData.newInstance();
    const StickData = vtkPolyData.newInstance();


    // First, copy the input to the output as a starting point
    // output->CopyStructure( input );
    const points = polydata.getPoints();
    const pointsArray = points.getData();
    const numPts = points.getNumberOfPoints();

    const pointdata = polydata.getPointData();
    let radiusCovalent = null;
    let scaleData = null;
    let elementColor = null;
    let colorData = null;

    if (pointdata.hasArray('radiusCovalent')) {
      radiusCovalent = pointdata.getArray('radiusCovalent').getData();
      scaleData = new Float32Array(numPts);
    }
    if (pointdata.hasArray('elementColor')) {
      elementColor = pointdata.getArray('elementColor').getData();
      colorData = new Uint8Array(numPts * 3);
    }

    const pos = new Float32Array(numPts * 3);

    // go trhough each points
    let ptsIdx = 0;
    for (let i = 0; i < numPts; i++) {
      // points
      ptsIdx = i * 3;
      pos[ptsIdx] = pointsArray[ptsIdx];
      pos[ptsIdx + 1] = pointsArray[ptsIdx + 1];
      pos[ptsIdx + 2] = pointsArray[ptsIdx + 2];

      // radius
      if (radiusCovalent) {
        scaleData[i] = radiusCovalent[i];
      }

      // colors
      if (elementColor) {
        ptsIdx = i * 3;
        colorData[ptsIdx] = elementColor[ptsIdx] * 255;
        colorData[ptsIdx + 1] = elementColor[ptsIdx + 1] * 255;
        colorData[ptsIdx + 2] = elementColor[ptsIdx + 2] * 255;
      }
    }

    SphereData.getPoints().setData(pos, 3);

    if (radiusCovalent) {
      const scales = vtkDataArray.newInstance({ numberOfComponents: 1, values: scaleData, name: publicAPI.getSphereScaleArrayName() });
      SphereData.getPointData().addArray(scales);
    }

    if (elementColor) {
      const colors = vtkDataArray.newInstance({ numberOfComponents: 3, values: colorData, name: 'colors' });
      SphereData.getPointData().setScalars(colors);
    }

    // Update output
    outData[0] = SphereData;
    outData[1] = StickData;

    return 1;
  };
}

// ----------------------------------------------------------------------------
// Object factory
// ----------------------------------------------------------------------------

const DEFAULT_VALUES = {
  sphereScaleArrayName: 'radius',
};

// ----------------------------------------------------------------------------

export function extend(publicAPI, model, initialValues = {}) {
  Object.assign(model, DEFAULT_VALUES, initialValues);

  // Build VTK API
  macro.obj(publicAPI, model);
  macro.setGet(publicAPI, model, [
    'sphereScaleArrayName',
  ]);
  macro.algo(publicAPI, model, 1, 2);
  vtkMoleculeToRepresentation(publicAPI, model);
}

// ----------------------------------------------------------------------------

export const newInstance = macro.newInstance(extend, 'vtkMoleculeToRepresentation');

// ----------------------------------------------------------------------------

export default { newInstance, extend };
