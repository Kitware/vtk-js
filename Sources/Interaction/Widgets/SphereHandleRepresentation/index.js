import macro from 'vtk.js/Sources/macro';
import vtkActor from 'vtk.js/Sources/Rendering/Core/Actor';
import vtkCellPicker from 'vtk.js/Sources/Rendering/Core/CellPicker';
import vtkHandleRepresentation from 'vtk.js/Sources/Interaction/Widgets/HandleRepresentation';
import vtkMapper from 'vtk.js/Sources/Rendering/Core/Mapper';
import vtkProperty from 'vtk.js/Sources/Rendering/Core/Property';
import vtkSphereSource from 'vtk.js/Sources/Filters/Sources/SphereSource';
import { IntersectionState } from '../HandleRepresentation/Constants';

// ----------------------------------------------------------------------------
// vtkSphereHandleRepresentation methods
// ----------------------------------------------------------------------------

function vtkSphereHandleRepresentation(publicAPI, model) {
  // Set our className
  model.classHierarchy.push('vtkSphereHandleRepresentation');

  const superClass = Object.assign({}, publicAPI);

  publicAPI.getActors = () => model.actor;
  publicAPI.getNestedProps = () => publicAPI.getActors();

  publicAPI.placeWidget = (...bounds) => {
    let boundsArray = [];

    if (Array.isArray(bounds[0])) {
      boundsArray = bounds[0];
    } else {
      for (let i = 0; i < bounds.length; i++) {
        boundsArray.push(bounds[i]);
      }
    }

    if (boundsArray.length !== 6) {
      return;
    }

    const newBounds = [];
    const center = [];
    publicAPI.adjustBounds(boundsArray, newBounds, center);
    publicAPI.setWorldPosition(center);
    for (let i = 0; i < 6; i++) {
      model.initialBounds[i] = newBounds[i];
    }
    model.initialLength = Math.sqrt(
      (newBounds[1] - newBounds[0]) * (newBounds[1] - newBounds[0]) +
        (newBounds[3] - newBounds[2]) * (newBounds[3] - newBounds[2]) +
        (newBounds[5] - newBounds[4]) * (newBounds[5] - newBounds[4])
    );
  };

  publicAPI.getBounds = () => {
    const radius = model.sphere.getRadius();
    const center = model.sphere.getCenter();
    const bounds = [];
    bounds[0] = model.placeFactor * (center[0] - radius);
    bounds[1] = model.placeFactor * (center[0] + radius);
    bounds[2] = model.placeFactor * (center[1] - radius);
    bounds[3] = model.placeFactor * (center[1] + radius);
    bounds[4] = model.placeFactor * (center[2] - radius);
    bounds[5] = model.placeFactor * (center[2] + radius);
    return bounds;
  };

  publicAPI.setWorldPosition = (position) => {
    model.sphere.setCenter(position);
    superClass.setWorldPosition(position);
  };

  publicAPI.setDisplayPosition = (position) => {
    superClass.setDisplayPosition(position);
    publicAPI.setWorldPosition(model.worldPosition.getValue());
  };

  publicAPI.setHandleSize = (size) => {
    superClass.setHandleSize(size);

    publicAPI.updateSphereRadius();
  };

  publicAPI.getIntersectionState = (position, renderer) => {
    const pos3d = [position.x, position.y, 0.0];
    model.cursorPicker.pick(pos3d, renderer);
    const pickedActor = model.cursorPicker.getActors()[0];
    if (pickedActor) {
      return IntersectionState.HANDLE;
    }
    return IntersectionState.OUTSIDE;
  };

  publicAPI.updateSphereRadius = () => {
    // const center = model.sphere.getCenter();
    // const radius = publicAPI.sizeHandlesInPixels(1.0, center);
    const radius = publicAPI.getHandleSize();
    model.sphere.setRadius(radius);
  };

  publicAPI.setSelected = (selected) => {
    if (selected) {
      model.actor.setProperty(model.selectProperty);
    } else {
      model.actor.setProperty(model.property);
    }
  };

  publicAPI.buildRepresentation = () => {
    if (!model.placed) {
      model.validPick = 1;
      model.placed = 1;
    }

    publicAPI.updateSphereRadius();
    model.sphere.update();
    publicAPI.modified();
  };

  publicAPI.setProperty = (property) => {
    if (property === model.property) {
      return;
    }
    if (model.actor.getProperty() === model.property) {
      model.actor.setProperty(property);
    }
    model.property = property;
    publicAPI.modified();
  };

  publicAPI.setSelectProperty = (property) => {
    if (property === model.selectProperty) {
      return;
    }
    if (model.actor.getProperty() === model.selectProperty) {
      model.actor.setProperty(property);
    }
    model.selectProperty = property;
    publicAPI.modified();
  };

  publicAPI.setResolution = (resolution) => {
    model.sphere.setThetaResolution(resolution);
    model.sphere.setPhiResolution(resolution);
    publicAPI.modified();
  };
}

// ----------------------------------------------------------------------------
// Object factory
// ----------------------------------------------------------------------------

const DEFAULT_VALUES = {
  actor: null,
  mapper: null,
  sphere: null,
  cursorPicker: null,
  lastPickPosition: [0, 0, 0],
  lastEventPosition: [0, 0],
  constraintAxis: -1,
  translationMode: 1,
  property: null,
  selectProperty: null,
  placeFactor: 1,
  waitingForMotion: 0,
  hotSpotSize: 0.05,
};

// ----------------------------------------------------------------------------

export function extend(publicAPI, model, initialValues = {}) {
  Object.assign(model, DEFAULT_VALUES, initialValues);

  // Inheritance
  vtkHandleRepresentation.extend(publicAPI, model, initialValues);

  macro.setGet(publicAPI, model, ['translationMode']);
  macro.get(publicAPI, model, ['actor']);

  model.sphere = vtkSphereSource.newInstance();
  model.sphere.setThetaResolution(16);
  model.sphere.setPhiResolution(8);
  model.mapper = vtkMapper.newInstance();
  model.mapper.setInputConnection(model.sphere.getOutputPort());
  model.actor = vtkActor.newInstance();
  model.actor.setMapper(model.mapper);

  publicAPI.setHandleSize(15);
  model.currentHandleSize = model.handleSize;

  model.cursorPicker = vtkCellPicker.newInstance();
  model.cursorPicker.setPickFromList(1);
  model.cursorPicker.initializePickList();
  model.cursorPicker.addPickList(model.actor);

  model.property = vtkProperty.newInstance();
  model.property.setColor(1, 1, 1);
  model.selectProperty = vtkProperty.newInstance();
  model.selectProperty.setColor(0, 1, 0);
  model.actor.setProperty(model.property);

  // Object methods
  vtkSphereHandleRepresentation(publicAPI, model);
}

// ----------------------------------------------------------------------------

export const newInstance = macro.newInstance(
  extend,
  'vtkSphereHandleRepresentation'
);

// ----------------------------------------------------------------------------

export default { newInstance, extend };
