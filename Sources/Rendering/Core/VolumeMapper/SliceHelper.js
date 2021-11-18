import macro from 'vtk.js/Sources/macros';
import * as vtkMath from 'vtk.js/Sources/Common/Core/Math';
import vtkPlane from 'vtk.js/Sources/Common/DataModel/Plane';

function vtkSliceHelper(publicAPI, model) {
  model.classHierarchy.push('vtkSliceHelper');

  model._clipPlane1 = vtkPlane.newInstance();
  model._clipPlane2 = vtkPlane.newInstance();

  const superClass = { ...publicAPI };

  function update() {
    const n1 = model._clipPlane1.getNormalByReference();
    n1[0] = model.normal[0];
    n1[1] = model.normal[1];
    n1[2] = model.normal[2];

    const n2 = model._clipPlane2.getNormalByReference();
    n2[0] = -model.normal[0];
    n2[1] = -model.normal[1];
    n2[2] = -model.normal[2];

    vtkMath.multiplyAccumulate(
      model.origin,
      model.normal,
      -model.thickness / 2,
      model._clipPlane1.getOriginByReference()
    );

    vtkMath.multiplyAccumulate(
      model.origin,
      model.normal,
      model.thickness / 2,
      model._clipPlane2.getOriginByReference()
    );

    model._clipPlane1.modified();
    model._clipPlane2.modified();
  }

  const subscription = publicAPI.onModified(update);
  publicAPI.delete = () => {
    superClass.delete();
    subscription.unsubscribe();
  };

  publicAPI.registerClipPlanesToMapper = (mapper) => {
    if (!mapper || !mapper.isA('vtkAbstractMapper')) {
      return false;
    }

    let changeDetected = mapper.addClippingPlane(model._clipPlane1);
    changeDetected =
      mapper.addClippingPlane(model._clipPlane2) || changeDetected;

    return changeDetected;
  };

  publicAPI.unregisterClipPlanesFromMapper = (mapper) => {
    if (!mapper || !mapper.isA('vtkAbstractMapper')) {
      return false;
    }

    const planes = mapper.getClippingPlanes();
    let changeDetected = mapper.removeClippingPlane(
      planes.indexOf(model._clipPlane1)
    );
    changeDetected =
      mapper.removeClippingPlane(planes.indexOf(model._clipPlane2)) ||
      changeDetected;

    return changeDetected;
  };
}

// ----------------------------------------------------------------------------
// Object factory
// ----------------------------------------------------------------------------

const DEFAULT_VALUES = {
  thickness: 0,
  origin: [0, 0, 0],
  normal: [1, 0, 0],
};

export function extend(publicAPI, model, initialValues = {}) {
  Object.assign(model, DEFAULT_VALUES, initialValues);

  // Build VTK API
  macro.obj(publicAPI, model);
  macro.setGet(publicAPI, model, ['thickness']);
  macro.setGetArray(publicAPI, model, ['origin', 'normal'], 3);

  // Object methods
  vtkSliceHelper(publicAPI, model);
}

// ----------------------------------------------------------------------------

export const newInstance = macro.newInstance(extend, 'vtkSliceHelper');

// ----------------------------------------------------------------------------

export default { newInstance, extend };
