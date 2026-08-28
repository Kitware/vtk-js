import macro from 'vtk.js/Sources/macros';
import vtkPolyData from 'vtk.js/Sources/Common/DataModel/PolyData';
import vtkPoints from 'vtk.js/Sources/Common/Core/Points';
import vtkCellArray from 'vtk.js/Sources/Common/Core/CellArray';

// ---------------------------------------------------------------------------
// vtkArmatureSource methods
// ---------------------------------------------------------------------------

function vtkArmatureSource(publicAPI, model) {
  // Set our className
  model.classHierarchy.push('vtkArmatureSource');

  publicAPI.requestData = (inData, outData) => {
    if (!model.skeleton) {
      return;
    }

    let output = outData[0];
    output = output?.initialize() || vtkPolyData.newInstance();
    const skeleton = model.skeleton;
    const boneCount = skeleton.getNumberOfBones();

    if (boneCount === 0) {
      return;
    }

    // the armature sizes this array to hold one matrix per bone, and fills
    // the matrix of a bone that was never posed with the identity
    const worldMatrices = skeleton.getWorldMatrices();

    const totalPoints = boneCount;
    const pointsArray = new Float32Array(totalPoints * 3);
    const verts = vtkCellArray.newInstance();
    const lines = vtkCellArray.newInstance();

    // Generate joint points and bone links
    for (let i = 0; i < boneCount; i++) {
      const bone = skeleton.getBone(i);
      const parentIdx = bone.parentIndex;

      const baseIndex = i * 3;
      pointsArray[baseIndex] = worldMatrices[i * 16 + 12];
      pointsArray[baseIndex + 1] = worldMatrices[i * 16 + 13];
      pointsArray[baseIndex + 2] = worldMatrices[i * 16 + 14];

      verts.insertNextCell([i]);

      // If has parent, draw line from parent to this bone
      if (parentIdx !== -1) {
        lines.insertNextCell([parentIdx, i]);
      }
    }

    // Create vtkPoints and vtkCellArray
    const points = vtkPoints.newInstance({ numberOfComponents: 3 });
    points.setData(pointsArray, 3);

    output.setPoints(points);
    output.setVerts(verts);
    output.setLines(lines);
    outData[0] = output;
  };
}

// ---------------------------------------------------------------------------
// Object factory
// ---------------------------------------------------------------------------

const ARMATURE_SOURCE_FIELDS = ['skeleton', 'boneRadius', 'jointRadius'];

const DEFAULT_VALUES = {
  skeleton: null,
  boneRadius: 0.1,
  jointRadius: 0.15,
};

// ---------------------------------------------------------------------------

export function extend(publicAPI, model, initialValues = {}) {
  Object.assign(model, DEFAULT_VALUES, initialValues);

  macro.obj(publicAPI, model);
  macro.algo(publicAPI, model, 0, 1);

  // Getters and setters
  macro.setGet(publicAPI, model, ARMATURE_SOURCE_FIELDS);

  // Object specific methods
  vtkArmatureSource(publicAPI, model);
}

// ---------------------------------------------------------------------------

export const newInstance = macro.newInstance(extend, 'vtkArmatureSource');

// ---------------------------------------------------------------------------

export default { newInstance, extend };
