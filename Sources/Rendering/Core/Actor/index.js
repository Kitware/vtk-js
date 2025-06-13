import macro from 'vtk.js/Sources/macros';
import vtkProp3D from 'vtk.js/Sources/Rendering/Core/Prop3D';
import vtkProperty from 'vtk.js/Sources/Rendering/Core/Property';

// ----------------------------------------------------------------------------
// vtkActor methods
// ----------------------------------------------------------------------------

function vtkActor(publicAPI, model) {
  // Set our className
  model.classHierarchy.push('vtkActor');

  // Capture 'parentClass' api for internal use
  const superClass = { ...publicAPI };

  publicAPI.getActors = () => [publicAPI];

  publicAPI.getIsOpaque = () => {
    if (model.forceOpaque) {
      return true;
    }
    if (model.forceTranslucent) {
      return false;
    }
    // make sure we have a property
    if (!model.properties[0]) {
      // force creation of a property
      publicAPI.getProperty();
    }

    let isOpaque = model.properties[0].getOpacity() >= 1.0;

    // are we using an opaque texture, if any?
    isOpaque = isOpaque && (!model.texture || !model.texture.isTranslucent());

    // are we using an opaque scalar array, if any?
    isOpaque = isOpaque && (!model.mapper || model.mapper.getIsOpaque());

    return isOpaque;
  };

  publicAPI.hasTranslucentPolygonalGeometry = () => {
    if (model.mapper === null) {
      return false;
    }
    // make sure we have a property
    if (!model.properties[0]) {
      // force creation of a property
      publicAPI.getProperty();
    }

    // is this actor opaque ?
    return !publicAPI.getIsOpaque();
  };

  publicAPI.makeProperty = vtkProperty.newInstance;

  publicAPI.getMTime = () => {
    let mt = superClass.getMTime();

    if (model.backfaceProperty !== null) {
      const time = model.backfaceProperty.getMTime();
      mt = time > mt ? time : mt;
    }

    return mt;
  };

  publicAPI.getRedrawMTime = () => {
    let mt = model.mtime;
    if (model.mapper !== null) {
      let time = model.mapper.getMTime();
      mt = time > mt ? time : mt;
      if (model.mapper.getInput() !== null) {
        // FIXME !!! getInputAlgorithm / getInput
        model.mapper.getInputAlgorithm().update();
        time = model.mapper.getInput().getMTime();
        mt = time > mt ? time : mt;
      }
    }
    return mt;
  };

  publicAPI.getSupportsSelection = () =>
    model.mapper ? model.mapper.getSupportsSelection() : false;

  publicAPI.processSelectorPixelBuffers = (selector, pixelOffsets) => {
    if (model.mapper && model.mapper.processSelectorPixelBuffers) {
      model.mapper.processSelectorPixelBuffers(selector, pixelOffsets);
    }
  };
}

// ----------------------------------------------------------------------------
// Object factory
// ----------------------------------------------------------------------------

const DEFAULT_VALUES = {
  mapper: null,
  backfaceProperty: null,

  forceOpaque: false,
  forceTranslucent: false,
};

// ----------------------------------------------------------------------------

export function extend(publicAPI, model, initialValues = {}) {
  Object.assign(model, DEFAULT_VALUES, initialValues);

  // Inheritance
  vtkProp3D.extend(publicAPI, model, initialValues);

  // vtkTimeStamp
  model.boundsMTime = {};
  macro.obj(model.boundsMTime);

  // Build VTK API
  macro.setGet(publicAPI, model, [
    'backfaceProperty',
    'forceOpaque',
    'forceTranslucent',
    'mapper',
  ]);

  // Object methods
  vtkActor(publicAPI, model);
}

// ----------------------------------------------------------------------------

export const newInstance = macro.newInstance(extend, 'vtkActor');

// ----------------------------------------------------------------------------

export default { newInstance, extend };
