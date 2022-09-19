import macro from 'vtk.js/Sources/macros';
import vtkActor from 'vtk.js/Sources/Rendering/Core/Actor';
import vtkContextRepresentation from 'vtk.js/Sources/Widgets/Representations/ContextRepresentation';
import vtkMapper from 'vtk.js/Sources/Rendering/Core/Mapper';

const { vtkErrorMacro } = macro;

// prettier-ignore
const OUTLINE_ARRAY = [
  2, 0, 1,
  2, 0, 2,
  2, 0, 4,
  2, 1, 3,
  2, 1, 5,
  2, 2, 3,
  2, 2, 6,
  2, 3, 7,
  2, 4, 5,
  2, 4, 6,
  2, 5, 7,
  2, 6, 7,
];

// ----------------------------------------------------------------------------
// vtkCroppingOutlineRepresentation methods
// ----------------------------------------------------------------------------

// Represents a box outline given 8 points as corners.
// Does not work with an arbitrary set of points. An oriented bounding box
// algorithm may be implemented in the future.
function vtkCroppingOutlineRepresentation(publicAPI, model) {
  // Set our className
  model.classHierarchy.push('vtkCroppingOutlineRepresentation');

  // --------------------------------------------------------------------------
  // Internal polydata dataset
  // --------------------------------------------------------------------------

  publicAPI
    .allocateArray('lines', 'Uint16Array', 1, OUTLINE_ARRAY.length)
    .set(OUTLINE_ARRAY);

  // --------------------------------------------------------------------------
  // Generic rendering pipeline
  // --------------------------------------------------------------------------

  model.mapper = vtkMapper.newInstance({
    scalarVisibility: false,
  });
  model.actor = vtkActor.newInstance({ parentProp: publicAPI });
  model.actor.getProperty().setEdgeColor(...model.edgeColor);
  model.mapper.setInputConnection(publicAPI.getOutputPort());
  model.actor.setMapper(model.mapper);

  publicAPI.addActor(model.actor);

  // --------------------------------------------------------------------------

  publicAPI.requestData = (inData, outData) => {
    const list = publicAPI
      .getRepresentationStates(inData[0])
      .filter((state) => state.getOrigin && state.getOrigin());
    if (list.length === 8) {
      const points = publicAPI
        .allocateArray('points', 'Float32Array', 3, 8)
        .getData();
      let pi = 0;
      for (let i = 0; i < list.length; i++) {
        const pt = list[i].getOrigin();
        points[pi++] = pt[0];
        points[pi++] = pt[1];
        points[pi++] = pt[2];
      }
      model.internalPolyData.getPoints().modified();
      model.internalPolyData.modified();

      outData[0] = model.internalPolyData;
    } else {
      vtkErrorMacro('CroppingOutlineRepresentation did not get 8 states');
    }
  };
}

// ----------------------------------------------------------------------------
// Object factory
// ----------------------------------------------------------------------------

const DEFAULT_VALUES = {
  edgeColor: [1, 1, 1],
};

// ----------------------------------------------------------------------------

export function extend(publicAPI, model, initialValues = {}) {
  Object.assign(model, DEFAULT_VALUES, initialValues);

  vtkContextRepresentation.extend(publicAPI, model, initialValues);
  macro.setGetArray(publicAPI, model, ['edgeColor'], 3);
  macro.get(publicAPI, model, ['mapper', 'actor']);

  // Object specific methods
  vtkCroppingOutlineRepresentation(publicAPI, model);
}

// ----------------------------------------------------------------------------

export const newInstance = macro.newInstance(
  extend,
  'vtkCroppingOutlineRepresentation'
);

// ----------------------------------------------------------------------------

export default { newInstance, extend };
