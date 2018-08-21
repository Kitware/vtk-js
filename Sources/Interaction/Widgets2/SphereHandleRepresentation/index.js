import macro from 'vtk.js/Sources/macro';
import vtkHandleRepresentation from 'vtk.js/Sources/Interaction/Widgets2/HandleRepresentation';

import vtkActor from 'vtk.js/Sources/Rendering/Core/Actor';
import vtkSphereSource from 'vtk.js/Sources/Filters/Sources/SphereSource';
import vtkPolyData from 'vtk.js/Sources/Common/DataModel/PolyData';
import vtkGlyph3DMapper from 'vtk.js/Sources/Rendering/Core/Glyph3DMapper';

// import { AttributeTypes } from 'vtk.js/Sources/Common/DataModel/DataSetAttributes/Constants';
// import { FieldDataTypes } from 'vtk.js/Sources/Common/DataModel/DataSet/Constants';

// ----------------------------------------------------------------------------
// vtkSphereHandleRepresentation methods
// ----------------------------------------------------------------------------

function vtkSphereHandleRepresentation(publicAPI, model) {
  // Set our className
  model.classHierarchy.push('vtkSphereHandleRepresentation');

  // Generic rendering pipeline setup
  model.handlePolyData = vtkPolyData.newInstance();
  model.mapper = vtkGlyph3DMapper.newInstance();
  model.actor = vtkActor.newInstance();
  model.glyph = vtkSphereSource.newInstance();

  model.mapper.setInputData(model.handlePolyData, 0);
  model.mapper.setInputConnection(model.glyph.getOutputPort(), 1);
  model.actor.setMapper(model.mapper);
  model.actors.push(model.actor);

  function updatePolyData() {}

  function unsubscribe() {
    if (model.stateSubscription) {
      model.stateSubscription.unsubscribe();
    }
  }

  publicAPI.setWidgetState = (state, mapping = ['']) => {
    unsubscribe();
    model.state = state;
    model.stateMapping = mapping;

    if (model.state) {
      updatePolyData();
      model.stateSubscription = model.state.onModified(updatePolyData);
    }

    publicAPI.modified();
  };

  publicAPI.delete = macro.chain(unsubscribe, publicAPI.delete);
}

// ----------------------------------------------------------------------------
// Object factory
// ----------------------------------------------------------------------------

const DEFAULT_VALUES = {};

// ----------------------------------------------------------------------------

export function extend(publicAPI, model, initialValues = {}) {
  Object.assign(model, DEFAULT_VALUES, initialValues);

  vtkHandleRepresentation.extend(publicAPI, model, initialValues);

  // Object specific methods
  vtkSphereHandleRepresentation(publicAPI, model);
}

// ----------------------------------------------------------------------------

export const newInstance = macro.newInstance(
  extend,
  'vtkSphereHandleRepresentation'
);

// ----------------------------------------------------------------------------

export default { newInstance, extend };
