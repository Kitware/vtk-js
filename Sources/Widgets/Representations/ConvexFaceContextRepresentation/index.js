import macro from 'vtk.js/Sources/macros';
import vtkActor from 'vtk.js/Sources/Rendering/Core/Actor';
import vtkContextRepresentation from 'vtk.js/Sources/Widgets/Representations/ContextRepresentation';
import vtkMapper from 'vtk.js/Sources/Rendering/Core/Mapper';
import vtkPolyData from 'vtk.js/Sources/Common/DataModel/PolyData';

import { Behavior } from 'vtk.js/Sources/Widgets/Representations/WidgetRepresentation/Constants';
import { RenderingTypes } from 'vtk.js/Sources/Widgets/Core/WidgetManager/Constants';

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
  model.actor = vtkActor.newInstance({ parentProp: publicAPI });
  model.actor.getProperty().setOpacity(model.opacity);

  model.mapper.setInputConnection(publicAPI.getOutputPort());
  model.actor.setMapper(model.mapper);

  publicAPI.addActor(model.actor);

  // --------------------------------------------------------------------------

  publicAPI.requestData = (inData, outData) => {
    const list = publicAPI.getRepresentationStates(inData[0]);
    const validState = list.filter((state) => state.getOrigin());

    const points = allocateSize(validState.length);

    for (let i = 0; i < validState.length; i++) {
      const coords = validState[i].getOrigin();
      points[i * 3] = coords[0];
      points[i * 3 + 1] = coords[1];
      points[i * 3 + 2] = coords[2];
    }

    model.internalPolyData.modified();
    outData[0] = model.internalPolyData;
  };

  // --------------------------------------------------------------------------

  publicAPI.getSelectedState = (prop, compositeID) => {
    const state = model.inputData[0];
    const list = publicAPI.getRepresentationStates(state);

    // Update state orientation based on face
    if (state.updateFromOriginRightUp) {
      state.updateFromOriginRightUp(
        list[0].getOrigin(),
        list[list.length - 1].getOrigin(),
        list[1].getOrigin()
      );
    }

    return state;
  };

  // --------------------------------------------------------------------------

  const superUpdateActorVisibility = publicAPI.updateActorVisibility;
  publicAPI.updateActorVisibility = (
    renderingType = RenderingTypes.FRONT_BUFFER,
    ctxVisible = true,
    handleVisible = true
  ) => {
    switch (model.behavior) {
      case Behavior.HANDLE:
        if (renderingType === RenderingTypes.PICKING_BUFFER) {
          model.actor.getProperty().setOpacity(1);
        } else {
          model.actor.getProperty().setOpacity(model.opacity);
        }
        break;
      case Behavior.CONTEXT:
      default:
        model.actor.getProperty().setOpacity(model.opacity);
        break;
    }
    superUpdateActorVisibility(renderingType, ctxVisible, handleVisible);
  };
}

// ----------------------------------------------------------------------------
// Object factory
// ----------------------------------------------------------------------------

const DEFAULT_VALUES = {
  defaultColor: [1, 0, 0.5],
  opacity: 0.2,
};

// ----------------------------------------------------------------------------

export function extend(publicAPI, model, initialValues = {}) {
  Object.assign(model, DEFAULT_VALUES, initialValues);

  vtkContextRepresentation.extend(publicAPI, model, initialValues);
  macro.setGetArray(publicAPI, model, ['defaultColor'], 3);
  macro.get(publicAPI, model, ['mapper', 'actor']);
  macro.setGet(publicAPI, model, ['opacity']);

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
