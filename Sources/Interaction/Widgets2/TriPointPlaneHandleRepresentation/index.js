import macro from 'vtk.js/Sources/macro';
import vtkActor from 'vtk.js/Sources/Rendering/Core/Actor';
import vtkMapper from 'vtk.js/Sources/Rendering/Core/Mapper';
import vtkHandleRepresentation from 'vtk.js/Sources/Interaction/Widgets2/HandleRepresentation';
import vtkPlaneSource from 'vtk.js/Sources/Filters/Sources/PlaneSource';

// ----------------------------------------------------------------------------
// vtkPlaneHandleRepresentation methods
// ----------------------------------------------------------------------------

function vtkTriPointPlaneHandleRepresentation(publicAPI, model) {
  // Set our className
  model.classHierarchy.push('vtkTriPointPlaneHandleRepresentation');

  // --------------------------------------------------------------------------
  // Generic rendering pipeline
  // --------------------------------------------------------------------------

  model.mapper = vtkMapper.newInstance({
    scalarVisibility: false,
  });
  model.actor = vtkActor.newInstance();
  model.actor.getProperty().setOpacity(0.2);
  model.plane = vtkPlaneSource.newInstance({
    xResolution: 1,
    yResolution: 1,
    origin: [0, -0.5, -0.5],
    point1: [0, -0.5, 0.5],
    point2: [0, 0.5, -0.5],
  });

  model.mapper.setInputConnection(model.plane.getOutputPort());
  model.actor.setMapper(model.mapper);

  model.actors.push(model.actor);

  // --------------------------------------------------------------------------

  publicAPI.requestData = (inData, outData) => {
    const list = publicAPI.getRepresentationStates(inData[0]);

    console.log(list[0].getOrigin(), list[1].getOrigin(), list[2].getOrigin());
    model.plane.setOrigin(list[0].getOrigin());
    model.plane.setPoint1(list[1].getOrigin());
    model.plane.setPoint2(list[2].getOrigin());

    model.actor.getProperty().setColor(model.defaultColor); // FIXME

    outData[0] = model.plane.getOutputData();
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

  vtkHandleRepresentation.extend(publicAPI, model, initialValues);
  macro.setGetArray(publicAPI, model, ['defaultColor'], 3);
  macro.get(publicAPI, model, ['plane', 'mapper', 'actor']);

  // Object specific methods
  vtkTriPointPlaneHandleRepresentation(publicAPI, model);
}

// ----------------------------------------------------------------------------

export const newInstance = macro.newInstance(
  extend,
  'vtkTriPointPlaneHandleRepresentation'
);

// ----------------------------------------------------------------------------

export default { newInstance, extend };
