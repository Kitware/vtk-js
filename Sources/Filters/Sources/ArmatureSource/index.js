import macro from 'vtk.js/Sources/macros';
import vtkPolyData from '../../../Common/DataModel/PolyData';
import vtkPoints from '../../../Common/Core/Points';
import vtkCellArray from '../../../Common/Core/CellArray';

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

    // Get pose or use rest pose
    let worldMatrices = null;
    if (boneCount > 0 && skeleton.getWorldMatrices().length >= boneCount * 16) {
      worldMatrices = skeleton.getWorldMatrices();
    } else {
      // Use inverse bind matrices as fallback
      worldMatrices = new Float32Array(boneCount * 16);
      for (let i = 0; i < boneCount; i++) {
        const bone = skeleton.getBone(i);
        const m = bone.inverseBindMatrix;
        for (let j = 0; j < 16; j++) {
          worldMatrices[i * 16 + j] = m[j];
        }
      }
    }

    const totalPoints = boneCount;
    const pointsArray = new Float32Array(totalPoints * 3);
    const verts = vtkCellArray.newInstance();
    const lines = vtkCellArray.newInstance();

    // Generate joint points and bone links
    let lineCount = 0;
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
        lineCount++;
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
