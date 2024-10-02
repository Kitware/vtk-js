import { mat4 } from 'gl-matrix';
import macro from 'vtk.js/Sources/macros';
import vtkBoundingBox from 'vtk.js/Sources/Common/DataModel/BoundingBox';
import vtkProp3D from 'vtk.js/Sources/Rendering/Core/Prop3D';
import vtkImageProperty from 'vtk.js/Sources/Rendering/Core/ImageProperty';

// ----------------------------------------------------------------------------
// vtkImageSlice methods
// ----------------------------------------------------------------------------

function vtkImageSlice(publicAPI, model) {
  // Set our className
  model.classHierarchy.push('vtkImageSlice');

  publicAPI.getActors = () => publicAPI;
  publicAPI.getImages = () => publicAPI;

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

    // are we using an opaque scalar array, if any?
    isOpaque = isOpaque && (!model.mapper || model.mapper.getIsOpaque());

    return isOpaque;
  };

  // Always render during opaque pass, to keep the behavior
  // predictable and because depth-peeling kills alpha-blending.
  // In the future, the Renderer should render images in layers,
  // i.e. where each image will have a layer number assigned to it,
  // and the Renderer will do the images in their own pass.
  publicAPI.hasTranslucentPolygonalGeometry = () => false;

  publicAPI.makeProperty = vtkImageProperty.newInstance;

  publicAPI.getBoundsForSlice = (slice, thickness) => {
    // Check for the special case when the mapper's bounds are unknown
    const bds = model.mapper.getBoundsForSlice(slice, thickness);
    // Check for the special case when the actor is empty.
    if (!vtkBoundingBox.isValid(bds)) {
      return bds;
    }

    publicAPI.computeMatrix();
    const tmp4 = new Float64Array(16);
    mat4.transpose(tmp4, model.matrix);
    const newBounds = vtkBoundingBox.transformBounds(bds, tmp4);
    return newBounds;
  };

  //----------------------------------------------------------------------------
  // Get the minimum X bound
  publicAPI.getMinXBound = () => publicAPI.getBounds()[0];

  // Get the maximum X bound
  publicAPI.getMaxXBound = () => publicAPI.getBounds()[1];

  // Get the minimum Y bound
  publicAPI.getMinYBound = () => publicAPI.getBounds()[2];

  // Get the maximum Y bound
  publicAPI.getMaxYBound = () => publicAPI.getBounds()[3];

  // Get the minimum Z bound
  publicAPI.getMinZBound = () => publicAPI.getBounds()[4];

  // Get the maximum Z bound
  publicAPI.getMaxZBound = () => publicAPI.getBounds()[5];

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
    model.properties.forEach((property) => {
      mt = Math.max(mt, property.getMTime());
      const rgbFunc = property.getRGBTransferFunction();
      if (rgbFunc !== null) {
        mt = Math.max(mt, rgbFunc.getMTime());
      }
    });
    return mt;
  };

  publicAPI.getSupportsSelection = () =>
    model.mapper ? model.mapper.getSupportsSelection() : false;
}

// ----------------------------------------------------------------------------
// Object factory
// ----------------------------------------------------------------------------

const DEFAULT_VALUES = {
  mapper: null,
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
  macro.setGet(publicAPI, model, ['mapper', 'forceOpaque', 'forceTranslucent']);

  // Object methods
  vtkImageSlice(publicAPI, model);
}

// ----------------------------------------------------------------------------

export const newInstance = macro.newInstance(extend, 'vtkImageSlice');

// ----------------------------------------------------------------------------

export default { newInstance, extend };
