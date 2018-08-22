import macro from 'vtk.js/Sources/macro';
import vtkHandleRepresentation from 'vtk.js/Sources/Interaction/Widgets2/HandleRepresentation';

import vtkActor from 'vtk.js/Sources/Rendering/Core/Actor';
import vtkSphereSource from 'vtk.js/Sources/Filters/Sources/SphereSource';
import vtkPolyData from 'vtk.js/Sources/Common/DataModel/PolyData';
import vtkDataArray from 'vtk.js/Sources/Common/Core/DataArray';
import vtkGlyph3DMapper from 'vtk.js/Sources/Rendering/Core/Glyph3DMapper';

// import { AttributeTypes } from 'vtk.js/Sources/Common/DataModel/DataSetAttributes/Constants';
// import { FieldDataTypes } from 'vtk.js/Sources/Common/DataModel/DataSet/Constants';

// ----------------------------------------------------------------------------
// vtkSphereHandleRepresentation methods
// ----------------------------------------------------------------------------

function vtkSphereHandleRepresentation(publicAPI, model) {
  // Set our className
  model.classHierarchy.push('vtkSphereHandleRepresentation');

  // Glyph datastructure
  model.handlePolyData = vtkPolyData.newInstance();
  model.points = model.handlePolyData.getPoints();
  model.handleScale = vtkDataArray.newInstance({
    name: 'scale',
    numberOfComponents: 1,
    empty: true,
  });
  model.handlePolyData.getPointData().addArray(model.handleScale);

  // Generic rendering pipeline setup
  model.mapper = vtkGlyph3DMapper.newInstance({
    scaleArray: 'scale',
  });
  model.actor = vtkActor.newInstance();
  model.glyph = vtkSphereSource.newInstance();

  model.mapper.setInputData(model.handlePolyData, 0);
  model.mapper.setInputConnection(model.glyph.getOutputPort(), 1);
  model.actor.setMapper(model.mapper);
  model.actors.push(model.actor);

  function updatePolyData() {
    console.log('updatePolyData', model.stateFields.length);
    if (model.points.getNumberOfValues() !== model.stateFields.length) {
      // Need to resize dataset
      model.points.setData(new Float32Array(3 * model.stateFields.length));
      model.handleScale.setData(new Float32Array(model.stateFields.length));
    }
    const points = model.points.getData();
    const scale = model.handleScale.getData();

    for (let i = 0; i < model.stateFields.length; i++) {
      const sphereState = model.state.getReferenceByName(model.stateFields[i]);

      const coord = sphereState.getPosition();
      points[i * 3 + 0] = coord[0];
      points[i * 3 + 1] = coord[1];
      points[i * 3 + 2] = coord[2];

      scale[i] = sphereState.getRadius();
    }
    model.points.modified();
    model.handleScale.modified();
    model.handlePolyData.modified();
    console.log('updatePolyData', points, scale);
  }

  function unsubscribe() {
    if (model.stateSubscription) {
      model.stateSubscription.unsubscribe();
    }
  }

  publicAPI.setWidgetState = (state, names = ['']) => {
    unsubscribe();
    model.state = state;
    model.stateFields = names;

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
