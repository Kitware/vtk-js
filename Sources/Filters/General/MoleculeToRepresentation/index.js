import macro from 'vtk.js/Sources/macros';
import vtkPolyData from 'vtk.js/Sources/Common/DataModel/PolyData';
import vtkDataArray from 'vtk.js/Sources/Common/Core/DataArray';
import * as vtkMath from 'vtk.js/Sources/Common/Core/Math';

import atomElem from 'vtk.js/Utilities/XMLConverter/chemistry/elements.json';

const { vtkErrorMacro, vtkDebugMacro } = macro;

// ----------------------------------------------------------------------------
// Globals
// ----------------------------------------------------------------------------

const ATOMS = {};
atomElem.atoms.forEach((a) => {
  ATOMS[a.atomicNumber] = a;
});

// ----------------------------------------------------------------------------
// vtkMoleculeToRepresentation methods
// ----------------------------------------------------------------------------

function vtkMoleculeToRepresentation(publicAPI, model) {
  const bondPositionData = [];
  const bondScaleData = [];
  const bondOrientationData = [];
  const bondColorData = [];

  // Set our className
  model.classHierarchy.push('vtkMoleculeToRepresentation');

  function addBond(
    position,
    orientation,
    length,
    color = [1.0, 1.0, 1.0],
    radius = model.bondRadius
  ) {
    bondScaleData.push(length);
    bondScaleData.push(radius);

    bondOrientationData.push(orientation[0]);
    bondOrientationData.push(orientation[1]);
    bondOrientationData.push(orientation[2]);

    bondPositionData.push(position[0]);
    bondPositionData.push(position[1]);
    bondPositionData.push(position[2]);

    for (let i = 0; i < color.length; ++i) {
      bondColorData.push(color[i] * 255);
    }
  }

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

    // Empty arrays
    bondPositionData.length = 0;
    bondScaleData.length = 0;
    bondOrientationData.length = 0;
    bondColorData.length = 0;

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

      // skip atoms specified by hideElements
      // model.hideHydrogen = false; // show hydrogen
      if (model.hideElements.indexOf(ATOMS[atomicNumber[i]].id) !== -1) {
        continue;
      }

      // points
      ptsIdx = i * 3;
      pointsData.push(pointsArray[ptsIdx]);
      pointsData.push(pointsArray[ptsIdx + 1]);
      pointsData.push(pointsArray[ptsIdx + 2]);

      // radius
      if (radiusArray.length > 0) {
        scaleData.push(radiusArray[i] * model.atomicRadiusScaleFactor);
      }

      // colors
      if (colorArray.length > 0) {
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
          const diff = [
            pointsArray[jPtsIdx],
            pointsArray[jPtsIdx + 1],
            pointsArray[jPtsIdx + 2],
          ];
          diff[0] -= pointsArray[iPtsIdx];
          diff[1] -= pointsArray[iPtsIdx + 1];
          diff[2] -= pointsArray[iPtsIdx + 2];

          if (
            Math.abs(diff[0]) > cutoff ||
            Math.abs(diff[1]) > cutoff ||
            Math.abs(diff[2]) > cutoff
          ) {
            continue;
          }

          // Check radius and add bond if needed
          const cutoffSq = cutoff * cutoff;
          const diffsq =
            diff[0] * diff[0] + diff[1] * diff[1] + diff[2] * diff[2];
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
      const j = bondIndex[index * 2 + 1];

      // Do not append if i or j belong to element to not display
      if (
        model.hideElements.indexOf(ATOMS[atomicNumber[i]].id) !== -1 ||
        model.hideElements.indexOf(ATOMS[atomicNumber[j]].id) !== -1
      ) {
        continue;
      }

      const jPtsIdx = j * 3;
      const iPtsIdx = i * 3;
      const diff = [
        pointsArray[jPtsIdx],
        pointsArray[jPtsIdx + 1],
        pointsArray[jPtsIdx + 2],
      ];
      diff[0] -= pointsArray[iPtsIdx];
      diff[1] -= pointsArray[iPtsIdx + 1];
      diff[2] -= pointsArray[iPtsIdx + 2];
      const diffsq = diff[0] * diff[0] + diff[1] * diff[1] + diff[2] * diff[2];

      let bondDelta = (2 + model.deltaBondFactor) * model.bondRadius; // distance between 2 bonds

      // scale bonds if total distance from bonds is bigger than 2r*factor with r = min(r_i, r_j)
      const r = Math.min(
        radiusArray[i] * model.atomicRadiusScaleFactor,
        radiusArray[j] * model.atomicRadiusScaleFactor
      );
      const t = (bondOrder[index] - 1) * bondDelta + 2 * model.bondRadius;
      if (t > 2 * r * 0.6) {
        model.bondRadius *= (2 * r * 0.6) / t;
        // recompute bondDelta
        bondDelta = (2 + model.deltaBondFactor) * model.bondRadius; // distance between 2 bonds
      }

      // Display multiple bond
      // loop such as 0 11 22 if odd order / 00 11 22 33 if even order
      // To make:     0 22 44 66 88 ...      11 33 55 77 ....
      // because the offset has to be:
      // (with bd= bondDelta. Note the minus is added just before creating bondPos)
      //   - odd order: 0 2bd/2 -2bd/2 4bd/2 -4bd/2 ...
      //   - even order:  1bd/2 -1bd/2 3bd/2 -3bd/2 ...
      // Then, to transform loop to offset we have:
      //   - odd order: x * 2 <=> x * 2 + 1 - 1
      //   - even order: x * 2 + 1
      // (with x the loop <=> floor(k/2))
      const oddOrEven = bondOrder[index] % 2; // zero if even order / one if odd order
      for (let k = oddOrEven; k < bondOrder[index] + oddOrEven; k++) {
        // dist from center to bond depending of number of bond
        let offset = ((Math.floor(k / 2) * 2 + 1 - oddOrEven) * bondDelta) / 2;

        const vectUnitJI = [
          diff[0] / Math.sqrt(diffsq),
          diff[1] / Math.sqrt(diffsq),
          diff[2] / Math.sqrt(diffsq),
        ];
        const vectUnitJIperp = [0, 0, 0];
        // Search perp to vectUnitJI: find axis != 0 to create vectUnitJIperp such as dot(vectUnitJIperp,vectUnitJI) = 0
        for (let coord = 0; coord < 3; coord++) {
          if (Math.abs(vectUnitJI[coord]) < 0.000001) {
            continue;
          }
          vectUnitJIperp[coord] =
            -(
              vectUnitJI[(coord + 2) % 3] * vectUnitJI[(coord + 2) % 3] +
              vectUnitJI[(coord + 1) % 3] * vectUnitJI[(coord + 1) % 3]
            ) / vectUnitJI[coord];
          vectUnitJIperp[(coord + 1) % 3] = vectUnitJI[(coord + 1) % 3];
          vectUnitJIperp[(coord + 2) % 3] = vectUnitJI[(coord + 2) % 3];
          vtkMath.normalize(vectUnitJIperp);
          break;
        }

        offset *= (-1) ** (k % 2);
        /*
        If atoms have a color associated, and if the atoms involved in the bond
        are different species, then each bond will be represented by
        two sticks, so that they can be colored with the same color as the atoms
        involved in the bond.
        */
        let bondPos;

        if (
          atomicNumber &&
          atomicNumber[i] !== atomicNumber[j] &&
          colorArray.length > 0
        ) {
          const bondLength = Math.sqrt(diffsq) / 2.0;

          bondPos = [
            pointsArray[jPtsIdx] -
              (bondLength * vectUnitJI[0]) / 2.0 +
              offset * vectUnitJIperp[0],
            pointsArray[jPtsIdx + 1] -
              (bondLength * vectUnitJI[1]) / 2.0 +
              offset * vectUnitJIperp[1],
            pointsArray[jPtsIdx + 2] -
              (bondLength * vectUnitJI[2]) / 2.0 +
              offset * vectUnitJIperp[2],
          ];

          addBond(
            bondPos,
            vectUnitJI,
            bondLength,
            colorArray.slice(jPtsIdx, jPtsIdx + 3)
          );

          bondPos = [
            pointsArray[iPtsIdx] +
              (bondLength * vectUnitJI[0]) / 2.0 +
              offset * vectUnitJIperp[0],
            pointsArray[iPtsIdx + 1] +
              (bondLength * vectUnitJI[1]) / 2.0 +
              offset * vectUnitJIperp[1],
            pointsArray[iPtsIdx + 2] +
              (bondLength * vectUnitJI[2]) / 2.0 +
              offset * vectUnitJIperp[2],
          ];
          addBond(
            bondPos,
            vectUnitJI,
            bondLength,
            colorArray.slice(iPtsIdx, iPtsIdx + 3)
          );
        } else {
          const bondLength = Math.sqrt(diffsq);

          bondPos = [
            pointsArray[jPtsIdx] - diff[0] / 2.0 + offset * vectUnitJIperp[0],
            pointsArray[jPtsIdx + 1] -
              diff[1] / 2.0 +
              offset * vectUnitJIperp[1],
            pointsArray[jPtsIdx + 2] -
              diff[2] / 2.0 +
              offset * vectUnitJIperp[2],
          ];
          if (colorArray.length > 0) {
            addBond(
              bondPos,
              vectUnitJI,
              bondLength,
              colorArray.slice(iPtsIdx, iPtsIdx + 3)
            );
          } else {
            addBond(bondPos, vectUnitJI, bondLength);
          }
        }
      }
    }

    SphereData.getPoints().setData(pointsData, 3);

    if (radiusArray) {
      const scales = vtkDataArray.newInstance({
        numberOfComponents: 1,
        values: scaleData,
        name: publicAPI.getSphereScaleArrayName(),
      });
      SphereData.getPointData().addArray(scales);
    }

    if (colorArray.length > 0) {
      const colors = vtkDataArray.newInstance({
        numberOfComponents: 3,
        values: Uint8Array.from(colorData),
        name: 'colors',
      });
      SphereData.getPointData().setScalars(colors);
    }

    StickData.getPoints().setData(bondPositionData, 3);

    const stickScales = vtkDataArray.newInstance({
      numberOfComponents: 2,
      values: bondScaleData,
      name: 'stickScales',
    });
    StickData.getPointData().addArray(stickScales);

    const orientation = vtkDataArray.newInstance({
      numberOfComponents: 3,
      values: bondOrientationData,
      name: 'orientation',
    });
    StickData.getPointData().addArray(orientation);

    if (colorArray.length > 0) {
      const bondColors = vtkDataArray.newInstance({
        numberOfComponents: 3,
        values: Uint8Array.from(bondColorData),
        name: 'colors',
      });
      StickData.getPointData().setScalars(bondColors);
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
  deltaBondFactor: 0.6,
  radiusType: 'radiusVDW',
  hideElements: '',
};

// ----------------------------------------------------------------------------

export function extend(publicAPI, model, initialValues = {}) {
  Object.assign(model, DEFAULT_VALUES, initialValues);

  // Build VTK API
  macro.obj(publicAPI, model);
  macro.setGet(publicAPI, model, [
    'atomicRadiusScaleFactor',
    'bondRadius',
    'deltaBondFactor',
    'hideElements',
    'radiusType',
    'sphereScaleArrayName',
    'tolerance',
  ]);
  macro.algo(publicAPI, model, 1, 2);
  vtkMoleculeToRepresentation(publicAPI, model);
}

// ----------------------------------------------------------------------------

export const newInstance = macro.newInstance(
  extend,
  'vtkMoleculeToRepresentation'
);

// ----------------------------------------------------------------------------

export default { newInstance, extend };
