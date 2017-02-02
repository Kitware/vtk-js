import macro        from 'vtk.js/Sources/macro';
import vtkPolyData  from 'vtk.js/Sources/Common/DataModel/PolyData';
import vtkDataArray from 'vtk.js/Sources/Common/Core/DataArray';
import vtkMath      from 'vtk.js/Sources/Common/Core/Math';

import atomElem     from 'vtk.js/Utilities/XMLConverter/chemistry/elements.json';

const { vtkErrorMacro } = macro;


// ----------------------------------------------------------------------------
// Globals
// ----------------------------------------------------------------------------

const ATOMS = {};
atomElem.atoms.forEach((a) => { ATOMS[a.atomicNumber] = a; });


// ----------------------------------------------------------------------------
// vtkMoleculeToRepresentation methods
// ----------------------------------------------------------------------------

export function vtkMoleculeToRepresentation(publicAPI, model) {
  // Set our className
  model.classHierarchy.push('vtkMoleculeToRepresentation');

  publicAPI.requestData = (inData, outData) => {
    // input
    const moleculedata = inData[0];

    if (!moleculedata) {
      vtkErrorMacro('Invalid or missing input');
      return 1;
    }

    // output
    const SphereData = vtkPolyData.newInstance();
    const StickData = vtkPolyData.newInstance();

    // Fetch from input molecule data
    let numPts = 0;
    let numBonds = 0;
    let pointsArray = null;
    let atomicNumber = null;
    let bondIndex = null;
    let bondOrder = null;

    if (moleculedata.getAtoms()) {
      if (moleculedata.getAtoms().coords !== undefined) {
        if (moleculedata.getAtoms().coords['3d'] !== undefined) {
          pointsArray = moleculedata.getAtoms().coords['3d'];
          numPts = pointsArray.length / 3;
        }
      }
      if (moleculedata.getAtoms().elements !== undefined) {
        if (moleculedata.getAtoms().elements.number !== undefined) {
          atomicNumber = moleculedata.getAtoms().elements.number;
        }
      }
    }
    if (moleculedata.getBonds()) {
      if (moleculedata.getBonds().connections !== undefined) {
        if (moleculedata.getBonds().connections.index !== undefined) {
          bondIndex = moleculedata.getBonds().connections.index;
          numBonds = bondIndex.length / 2;
        }
      }
      if (moleculedata.getBonds().order !== undefined) {
        bondOrder = moleculedata.getBonds().order;
      }
    }

    const pointsData = [];
    const scaleData = [];
    const colorData = [];

    const radiusArray = [];
    const covalentArray = [];
    const colorArray = [];

    const bondPositionData = [];
    const bondScaleData = [];
    const bondOrientationData = [];

    vtkDebugMacro('Checking for bonds with tolerance ', model.tolerance);

    // go through each points and fill from elements.json
    /* eslint-disable no-continue */
    let ptsIdx = 0;
    for (let i = 0; i < numPts; i++) {
      // fetch from elements.json
      if (atomicNumber) {
        radiusArray.push(ATOMS[atomicNumber[i]][model.radiusType]);
        covalentArray.push(ATOMS[atomicNumber[i]].radiusCovalent);
        colorArray.push(ATOMS[atomicNumber[i]].elementColor[0]);
        colorArray.push(ATOMS[atomicNumber[i]].elementColor[1]);
        colorArray.push(ATOMS[atomicNumber[i]].elementColor[2]);
      }

      // skip atoms specified by hideElement
      // model.hideHydrogen = false; // show hydrogen
      if (model.hideElement.includes(ATOMS[atomicNumber[i]].id)) {
        continue;
      }

      // points
      ptsIdx = i * 3;
      pointsData.push(pointsArray[ptsIdx]);
      pointsData.push(pointsArray[ptsIdx + 1]);
      pointsData.push(pointsArray[ptsIdx + 2]);

      // radius
      if (radiusArray) {
        scaleData.push(radiusArray[i] * model.atomicRadiusScaleFactor);
      }

      // colors
      if (colorArray) {
        ptsIdx = i * 3;
        colorData.push(colorArray[ptsIdx] * 255);
        colorData.push(colorArray[ptsIdx + 1] * 255);
        colorData.push(colorArray[ptsIdx + 2] * 255);
      }
    }

    // if we don't have Bonds provided
    // we fill up a bondIndex and a bondOrder
    if (!bondIndex) {
      bondIndex = [];
      bondOrder = [];
      // default bond display
      /* eslint-disable no-continue */
      for (let i = 0; i < numPts; i++) {
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
              Math.abs(diff[2]) > cutoff) {
            continue;
          }

          // Check radius and add bond if needed
          const cutoffSq = cutoff * cutoff;
          const diffsq = (diff[0] * diff[0]) + (diff[1] * diff[1]) + (diff[2] * diff[2]);
          if (diffsq < cutoffSq && diffsq > 0.1) {
            // appendBond between i and j
            bondIndex.push(i);
            bondIndex.push(j);
            bondOrder.push(1);
          }
        }
      }
      numBonds = bondIndex.length / 2;
    }

    // now we have the bonds, draw them
    for (let index = 0; index < numBonds; index++) {
      // appendBond between i and j
      const i = bondIndex[index * 2];
      const j = bondIndex[(index * 2) + 1];

      // Do not append if i or j belong to element to not display
      if (model.hideElement.includes(ATOMS[atomicNumber[i]].id) ||
        model.hideElement.includes(ATOMS[atomicNumber[j]].id)) {
        continue;
      }

      const jPtsIdx = j * 3;
      const iPtsIdx = i * 3;
      const diff = [pointsArray[jPtsIdx],
        pointsArray[jPtsIdx + 1],
        pointsArray[jPtsIdx + 2]];
      diff[0] -= pointsArray[iPtsIdx];
      diff[1] -= pointsArray[iPtsIdx + 1];
      diff[2] -= pointsArray[iPtsIdx + 2];
      const diffsq = (diff[0] * diff[0]) + (diff[1] * diff[1]) + (diff[2] * diff[2]);

      // offset between center of SphereJ (resp. SphereI) and the start of the bond
      const bondRadiusSq = model.bondRadius * model.bondRadius;
      const radiusJsq = radiusArray[j] * model.atomicRadiusScaleFactor * radiusArray[j] * model.atomicRadiusScaleFactor;
      const radiusIsq = radiusArray[i] * model.atomicRadiusScaleFactor * radiusArray[i] * model.atomicRadiusScaleFactor;
      const offsetJ = Math.sqrt(radiusJsq - bondRadiusSq);
      const offsetI = Math.sqrt(radiusIsq - bondRadiusSq);

      // Display one bond
      if (bondOrder[index] >= 1) {
        bondScaleData.push(Math.sqrt(diffsq) - offsetJ - offsetI);
        bondScaleData.push(model.bondRadius);

        const vectUnitJI = [diff[0] / Math.sqrt(diffsq),
          diff[1] / Math.sqrt(diffsq),
          diff[2] / Math.sqrt(diffsq)];

        bondOrientationData.push(vectUnitJI[0]);
        bondOrientationData.push(vectUnitJI[1]);
        bondOrientationData.push(vectUnitJI[2]);

        bondPositionData.push(pointsArray[jPtsIdx] - (((offsetJ - offsetI) * vectUnitJI[0]) / 2.0) - (diff[0] / 2.0));
        bondPositionData.push(pointsArray[jPtsIdx + 1] - (((offsetJ - offsetI) * vectUnitJI[1]) / 2.0) - (diff[1] / 2.0));
        bondPositionData.push(pointsArray[jPtsIdx + 2] - (((offsetJ - offsetI) * vectUnitJI[2]) / 2.0) - (diff[2] / 2.0));
      }
    }

    SphereData.getPoints().setData(pointsData, 3);

    if (radiusArray) {
      const scales = vtkDataArray.newInstance({ numberOfComponents: 1, values: scaleData, name: publicAPI.getSphereScaleArrayName() });
      SphereData.getPointData().addArray(scales);
    }

    if (colorArray) {
      const colors = vtkDataArray.newInstance({ numberOfComponents: 3, values: Uint8Array.from(colorData), name: 'colors' });
      SphereData.getPointData().setScalars(colors);
    }


    StickData.getPoints().setData(bondPositionData, 3);

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
  hideElement: [],
};

// ----------------------------------------------------------------------------

export function extend(publicAPI, model, initialValues = {}) {
  Object.assign(model, DEFAULT_VALUES, initialValues);

  // Build VTK API
  macro.obj(publicAPI, model);
  macro.setGet(publicAPI, model, [
    'sphereScaleArrayName',
    'radiusType',
    'hideElement',
  ]);
  macro.algo(publicAPI, model, 1, 2);
  vtkMoleculeToRepresentation(publicAPI, model);
}

// ----------------------------------------------------------------------------

export const newInstance = macro.newInstance(extend, 'vtkMoleculeToRepresentation');

// ----------------------------------------------------------------------------

export default { newInstance, extend };
