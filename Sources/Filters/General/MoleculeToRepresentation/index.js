import * as macro     from '../../../macro';

import vtkPolyData    from '../../../Common/DataModel/PolyData';
import vtkDataArray   from '../../../Common/Core/DataArray';

const { vtkDebugMacro } = macro;

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
    let radiusArray = null;
    let scaleData = null;
    let covalentArray = null;
    let elementColor = null;
    let colorData = null;
    let atomicNumber = null;

    const bondScaleData = [];
    const bondOrientationData = [];
    const bondPosition = [];
    if (pointdata.hasArray('atomicNumber')) {
      atomicNumber = pointdata.getArray('atomicNumber').getData();
    }
    if (pointdata.hasArray(model.radiusType)) {
      radiusArray = pointdata.getArray(model.radiusType).getData();
      scaleData = new Float32Array(numPts);
    }
    if (pointdata.hasArray('radiusCovalent')) {
      covalentArray = pointdata.getArray('radiusCovalent').getData();
    }
    if (pointdata.hasArray('elementColor')) {
      elementColor = pointdata.getArray('elementColor').getData();
      colorData = new Uint8Array(numPts * 3);
    }

    const pos = new Float32Array(numPts * 3);

    vtkDebugMacro('Checking for bonds with tolerance ', model.tolerance);

    // go trhough each points
    let ptsIdx = 0;
    for (let i = 0; i < numPts; i++) {
      // points
      ptsIdx = i * 3;
      pos[ptsIdx] = pointsArray[ptsIdx];
      pos[ptsIdx + 1] = pointsArray[ptsIdx + 1];
      pos[ptsIdx + 2] = pointsArray[ptsIdx + 2];

      // radius
      if (radiusArray) {
        scaleData[i] = radiusArray[i] * model.atomicRadiusScaleFactor;
      }

      // colors
      if (elementColor) {
        ptsIdx = i * 3;
        colorData[ptsIdx] = elementColor[ptsIdx] * 255;
        colorData[ptsIdx + 1] = elementColor[ptsIdx + 1] * 255;
        colorData[ptsIdx + 2] = elementColor[ptsIdx + 2] * 255;
      }

      // check for bonds
      /* eslint-disable no-continue */
      for (let j = i + 1; j < numPts; j++) {
        const cutoff = covalentArray[i] + covalentArray[j] + model.tolerance;
        const jPtsIdx = j * 3;
        const iPtsIdx = i * 3;
        const diff = [pointsArray[jPtsIdx],
          pointsArray[jPtsIdx + 1],
          pointsArray[jPtsIdx + 2]];
        diff[0] -= pointsArray[iPtsIdx];
        diff[1] -= pointsArray[iPtsIdx + 1];
        diff[2] -= pointsArray[iPtsIdx + 2];

        if (Math.abs(diff[0]) > cutoff ||
            Math.abs(diff[1]) > cutoff ||
            Math.abs(diff[2]) > cutoff ||
            (atomicNumber[i] === 1 && atomicNumber[j] === 1)) {
          continue;
        }
      // Check radius and add bond if needed
        const cutoffSq = cutoff * cutoff;
        const diffsq = (diff[0] * diff[0]) + (diff[1] * diff[1]) + (diff[2] * diff[2]);
        if (diffsq < cutoffSq && diffsq > 0.1) {
          // appendBond between i and j

          // offset between center of SphereJ (resp. SphereI) and the start of the bond
          const bondRadiusSq = model.bondRadius * model.bondRadius;
          const radiusJsq = radiusArray[j] * model.atomicRadiusScaleFactor * radiusArray[j] * model.atomicRadiusScaleFactor;
          const radiusIsq = radiusArray[i] * model.atomicRadiusScaleFactor * radiusArray[i] * model.atomicRadiusScaleFactor;
          const offsetJ = Math.sqrt(radiusJsq - bondRadiusSq);
          const offsetI = Math.sqrt(radiusIsq - bondRadiusSq);

          bondScaleData.push(Math.sqrt(diffsq) - offsetJ - offsetI);
          bondScaleData.push(model.bondRadius);

          const vectUnitJI = [diff[0] / Math.sqrt(diffsq),
            diff[1] / Math.sqrt(diffsq),
            diff[2] / Math.sqrt(diffsq)];

          bondOrientationData.push(vectUnitJI[0]);
          bondOrientationData.push(vectUnitJI[1]);
          bondOrientationData.push(vectUnitJI[2]);

          bondPosition.push(pointsArray[jPtsIdx] - (((offsetJ - offsetI) * vectUnitJI[0]) / 2.0) - (diff[0] / 2.0));
          bondPosition.push(pointsArray[jPtsIdx + 1] - (((offsetJ - offsetI) * vectUnitJI[1]) / 2.0) - (diff[1] / 2.0));
          bondPosition.push(pointsArray[jPtsIdx + 2] - (((offsetJ - offsetI) * vectUnitJI[2]) / 2.0) - (diff[2] / 2.0));
        }
      }
    }

    SphereData.getPoints().setData(pos, 3);

    if (radiusArray) {
      const scales = vtkDataArray.newInstance({ numberOfComponents: 1, values: scaleData, name: publicAPI.getSphereScaleArrayName() });
      SphereData.getPointData().addArray(scales);
    }

    if (elementColor) {
      const colors = vtkDataArray.newInstance({ numberOfComponents: 3, values: colorData, name: 'colors' });
      SphereData.getPointData().setScalars(colors);
    }


    StickData.getPoints().setData(bondPosition, 3);

    const test = true;
    if (test) {
      const stickScales = vtkDataArray.newInstance({ numberOfComponents: 2, values: bondScaleData, name: 'stickScales' });
      StickData.getPointData().addArray(stickScales);
    }

    if (test) {
      const orientation = vtkDataArray.newInstance({ numberOfComponents: 3, values: bondOrientationData, name: 'orientation' });
      StickData.getPointData().addArray(orientation);
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
  tolerance: 0.45,
  atomicRadiusScaleFactor: 0.3,
  bondRadius: 0.075,
  radiusType: 'radiusVDW',
};

// ----------------------------------------------------------------------------

export function extend(publicAPI, model, initialValues = {}) {
  Object.assign(model, DEFAULT_VALUES, initialValues);

  // Build VTK API
  macro.obj(publicAPI, model);
  macro.setGet(publicAPI, model, [
    'sphereScaleArrayName',
    'radiusType',
  ]);
  macro.algo(publicAPI, model, 1, 2);
  vtkMoleculeToRepresentation(publicAPI, model);
}

// ----------------------------------------------------------------------------

export const newInstance = macro.newInstance(extend, 'vtkMoleculeToRepresentation');

// ----------------------------------------------------------------------------

export default { newInstance, extend };
