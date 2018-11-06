import macro from 'vtk.js/Sources/macro';
import vtkActor from 'vtk.js/Sources/Rendering/Core/Actor';
import vtkContextRepresentation from 'vtk.js/Sources/Widgets/Representations/ContextRepresentation';
import vtkMapper from 'vtk.js/Sources/Rendering/Core/Mapper';
import vtkPolyData from 'vtk.js/Sources/Common/DataModel/PolyData';

const { vtkErrorMacro } = macro;

// prettier-ignore
const OUTLINE_ARRAY = [
  2, 0, 1,
  2, 2, 3,
  2, 4, 5,
  2, 6, 7,
  2, 0, 4,
  2, 1, 5,
  2, 2, 6,
  2, 3, 7,
  2, 0, 2,
  2, 1, 3,
  2, 4, 6,
  2, 5, 7,
];

// ----------------------------------------------------------------------------
// vtkOutlineContextRepresentation methods
// ----------------------------------------------------------------------------

// Represents a box outline given 8 points as corners.
// Does not work with an arbitrary set of points. An oriented bounding box
// algorithm may be implemented in the future.
function vtkOutlineContextRepresentation(publicAPI, model) {
  // Set our className
  model.classHierarchy.push('vtkOutlineContextRepresentation');

  // --------------------------------------------------------------------------
  // Internal polydata dataset
  // --------------------------------------------------------------------------

  model.internalPolyData = vtkPolyData.newInstance({ mtime: 0 });
  model.points = new Float32Array(8 * 3);
  model.internalPolyData.getPoints().setData(model.points, 3);
  model.internalPolyData.getLines().setData(Uint16Array.from(OUTLINE_ARRAY));

  // --------------------------------------------------------------------------
  // Generic rendering pipeline
  // --------------------------------------------------------------------------

  model.mapper = vtkMapper.newInstance({
    scalarVisibility: false,
  });
  model.actor = vtkActor.newInstance();
  model.actor.getProperty().setEdgeColor(...model.edgeColor);
  model.mapper.setInputConnection(publicAPI.getOutputPort());
  model.actor.setMapper(model.mapper);

  model.actors.push(model.actor);

  // --------------------------------------------------------------------------

  publicAPI.requestData = (inData, outData) => {
    const list = publicAPI.getRepresentationStates(inData[0]);
    if (list.length === 8) {
      const points = list.map((p) => p.getOrigin());
      const sorted = points.sort((p1, p2) => {
        for (let i = 0; i < 3; i++) {
          if (p1[i] !== p2[i]) {
            return p1[i] - p2[i];
          }
        }
        return 0;
      });

      model.points = [].concat(...sorted);
      model.internalPolyData.getPoints().setData(model.points, 3);
      model.internalPolyData.modified();

      outData[0] = model.internalPolyData;
    } else {
      vtkErrorMacro('OutlineContextRepresentation did not get 8 states');
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
  vtkOutlineContextRepresentation(publicAPI, model);
}

// ----------------------------------------------------------------------------

export const newInstance = macro.newInstance(
  extend,
  'vtkOutlineContextRepresentation'
);

// ----------------------------------------------------------------------------

export default { newInstance, extend };
