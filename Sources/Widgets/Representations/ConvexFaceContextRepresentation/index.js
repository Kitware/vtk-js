import macro from 'vtk.js/Sources/macro';
import vtkActor from 'vtk.js/Sources/Rendering/Core/Actor';
import vtkContextRepresentation from 'vtk.js/Sources/Widgets/Representations/ContextRepresentation';
import vtkMapper from 'vtk.js/Sources/Rendering/Core/Mapper';
import vtkPolyData from 'vtk.js/Sources/Common/DataModel/PolyData';

import vtkStateBuilder from 'vtk.js/Sources/Widgets/Core/StateBuilder';

// ----------------------------------------------------------------------------
// vtkPlaneHandleRepresentation methods
// ----------------------------------------------------------------------------

function vtkConvexFaceContextRepresentation(publicAPI, model) {
  // Set our className
  model.classHierarchy.push('vtkConvexFaceContextRepresentation');

  // --------------------------------------------------------------------------
  // Internal polydata dataset
  // --------------------------------------------------------------------------

  model.internalPolyData = vtkPolyData.newInstance({ mtime: 0 });
  model.points = new Float32Array(3 * 4);
  model.cells = new Uint8Array([4, 0, 1, 2, 3]);
  model.internalPolyData.getPoints().setData(model.points, 3);
  model.internalPolyData.getPolys().setData(model.cells);

  model.state = vtkStateBuilder.createBuilder().build('orientation');
  model.stateValues = [];

  function allocateSize(size) {
    if (model.cells.length - 1 !== size) {
      model.points = new Float32Array(size * 3);
      model.cells = new Uint8Array(size + 1);
      model.cells[0] = size;
      for (let i = 0; i < size; i++) {
        model.cells[i + 1] = i;
      }
      model.internalPolyData.getPoints().setData(model.points, 3);
      model.internalPolyData.getPolys().setData(model.cells);
    }
    return model.points;
  }

  // --------------------------------------------------------------------------
  // Generic rendering pipeline
  // --------------------------------------------------------------------------

  model.mapper = vtkMapper.newInstance({
    scalarVisibility: false,
  });
  model.actor = vtkActor.newInstance();
  model.actor.getProperty().setOpacity(0.2);

  model.mapper.setInputConnection(publicAPI.getOutputPort());
  model.actor.setMapper(model.mapper);

  model.actors.push(model.actor);

  // --------------------------------------------------------------------------

  publicAPI.requestData = (inData, outData) => {
    const list = publicAPI.getRepresentationStates(inData[0]);

    const points = allocateSize(list.length);

    for (let i = 0; i < list.length; i++) {
      const coords = list[i].getOrigin();
      points[i * 3] = coords[0];
      points[i * 3 + 1] = coords[1];
      points[i * 3 + 2] = coords[2];
    }

    if (inData[0].updateFromOriginRighUp) {
      console.log('swap state');
      model.state = inData[0];
    }
    model.state.updateFromOriginRighUp(
      list[0].getOrigin(),
      list[list.length - 1].getOrigin(),
      list[1].getOrigin()
    );

    model.internalPolyData.modified();
    outData[0] = model.internalPolyData;
  };

  // --------------------------------------------------------------------------

  publicAPI.getSelectedState = (prop, compositeID) => {
    return model.state;
  };
}

// ----------------------------------------------------------------------------
// Object factory
// ----------------------------------------------------------------------------

const DEFAULT_VALUES = {
  defaultColor: [1, 0, 0.5],
};

// ----------------------------------------------------------------------------

export function extend(publicAPI, model, initialValues = {}) {
  Object.assign(model, DEFAULT_VALUES, initialValues);

  vtkContextRepresentation.extend(publicAPI, model, initialValues);
  macro.setGetArray(publicAPI, model, ['defaultColor'], 3);
  macro.get(publicAPI, model, ['mapper', 'actor']);

  // Object specific methods
  vtkConvexFaceContextRepresentation(publicAPI, model);
}

// ----------------------------------------------------------------------------

export const newInstance = macro.newInstance(
  extend,
  'vtkConvexFaceContextRepresentation'
);

// ----------------------------------------------------------------------------

export default { newInstance, extend };
