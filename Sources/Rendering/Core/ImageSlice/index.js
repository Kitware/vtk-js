import { vec3, mat4 } from 'gl-matrix';
import macro from 'vtk.js/Sources/macro';
import vtkProp3D from 'vtk.js/Sources/Rendering/Core/Prop3D';
import vtkImageProperty from 'vtk.js/Sources/Rendering/Core/ImageProperty';

const { vtkDebugMacro } = macro;

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
    if (!model.property) {
      // force creation of a property
      publicAPI.getProperty();
    }

    let isOpaque = model.property.getOpacity() >= 1.0;

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

  publicAPI.getProperty = () => {
    if (model.property === null) {
      model.property = publicAPI.makeProperty();
    }
    return model.property;
  };

  publicAPI.getBounds = () => {
    if (model.mapper === null) {
      return model.bounds;
    }

    // Check for the special case when the mapper's bounds are unknown
    const bds = model.mapper.getBounds();
    if (!bds || bds.length !== 6) {
      return bds;
    }

    // Check for the special case when the actor is empty.
    if (bds[0] > bds[1]) {
      model.mapperBounds = bds.concat(); // copy the mapper's bounds
      model.bounds = [1, -1, 1, -1, 1, -1];
      model.boundsMTime.modified();
      return bds;
    }

    // Check if we have cached values for these bounds - we cache the
    // values returned by model.mapper.getBounds() and we store the time
    // of caching. If the values returned this time are different, or
    // the modified time of this class is newer than the cached time,
    // then we need to rebuild.
    const zip = (rows) => rows[0].map((_, c) => rows.map((row) => row[c]));
    if (
      !model.mapperBounds ||
      !zip([bds, model.mapperBounds]).reduce(
        (a, b) => a && b[0] === b[1],
        true
      ) ||
      publicAPI.getMTime() > model.boundsMTime.getMTime()
    ) {
      vtkDebugMacro('Recomputing bounds...');
      model.mapperBounds = bds.map((x) => x);
      const bbox = [
        vec3.fromValues(bds[1], bds[3], bds[5]),
        vec3.fromValues(bds[1], bds[2], bds[5]),
        vec3.fromValues(bds[0], bds[2], bds[5]),
        vec3.fromValues(bds[0], bds[3], bds[5]),
        vec3.fromValues(bds[1], bds[3], bds[4]),
        vec3.fromValues(bds[1], bds[2], bds[4]),
        vec3.fromValues(bds[0], bds[2], bds[4]),
        vec3.fromValues(bds[0], bds[3], bds[4]),
      ];

      publicAPI.computeMatrix();
      const tmp4 = mat4.create();
      mat4.transpose(tmp4, model.matrix);
      bbox.forEach((pt) => vec3.transformMat4(pt, pt, tmp4));

      /* eslint-disable no-multi-assign */
      model.bounds[0] = model.bounds[2] = model.bounds[4] = Number.MAX_VALUE;
      model.bounds[1] = model.bounds[3] = model.bounds[5] = -Number.MAX_VALUE;
      /* eslint-enable no-multi-assign */
      model.bounds = model.bounds.map(
        (d, i) =>
          i % 2 === 0
            ? bbox.reduce((a, b) => (a > b[i / 2] ? b[i / 2] : a), d)
            : bbox.reduce(
                (a, b) => (a < b[(i - 1) / 2] ? b[(i - 1) / 2] : a),
                d
              )
      );
      model.boundsMTime.modified();
    }
    return model.bounds;
  };

  publicAPI.getBoundsForSlice = (slice, thickness = 0) => {
    // Check for the special case when the mapper's bounds are unknown
    const bds = model.mapper.getBoundsForSlice(slice, thickness);
    if (!bds || bds.length !== 6) {
      return bds;
    }

    // Check for the special case when the actor is empty.
    if (bds[0] > bds[1]) {
      return bds;
    }

    const bbox = [
      vec3.fromValues(bds[1], bds[3], bds[5]),
      vec3.fromValues(bds[1], bds[2], bds[5]),
      vec3.fromValues(bds[0], bds[2], bds[5]),
      vec3.fromValues(bds[0], bds[3], bds[5]),
      vec3.fromValues(bds[1], bds[3], bds[4]),
      vec3.fromValues(bds[1], bds[2], bds[4]),
      vec3.fromValues(bds[0], bds[2], bds[4]),
      vec3.fromValues(bds[0], bds[3], bds[4]),
    ];

    publicAPI.computeMatrix();
    const tmp4 = mat4.create();
    mat4.transpose(tmp4, model.matrix);
    bbox.forEach((pt) => vec3.transformMat4(pt, pt, tmp4));

    let newBounds = [
      Number.MAX_VALUE,
      -Number.MAX_VALUE,
      Number.MAX_VALUE,
      -Number.MAX_VALUE,
      Number.MAX_VALUE,
      -Number.MAX_VALUE,
    ];
    newBounds = newBounds.map(
      (d, i) =>
        i % 2 === 0
          ? bbox.reduce((a, b) => (a > b[i / 2] ? b[i / 2] : a), d)
          : bbox.reduce((a, b) => (a < b[(i - 1) / 2] ? b[(i - 1) / 2] : a), d)
    );
    return newBounds;
  };

  //----------------------------------------------------------------------------
  // Get the minimum X bound
  publicAPI.getMinXBound = () => {
    publicAPI.getBounds();
    return model.bounds[0];
  };

  // Get the maximum X bound
  publicAPI.getMaxXBound = () => {
    publicAPI.getBounds();
    return model.bounds[1];
  };

  // Get the minimum Y bound
  publicAPI.getMinYBound = () => {
    publicAPI.getBounds();
    return model.bounds[2];
  };

  // Get the maximum Y bound
  publicAPI.getMaxYBound = () => {
    publicAPI.getBounds();
    return model.bounds[3];
  };

  // Get the minimum Z bound
  publicAPI.getMinZBound = () => {
    publicAPI.getBounds();
    return model.bounds[4];
  };

  // Get the maximum Z bound
  publicAPI.getMaxZBound = () => {
    publicAPI.getBounds();
    return model.bounds[5];
  };

  publicAPI.getMTime = () => {
    let mt = model.mtime;
    if (model.property !== null) {
      const time = model.property.getMTime();
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
    if (model.property !== null) {
      let time = model.property.getMTime();
      mt = time > mt ? time : mt;
      if (model.property.getRGBTransferFunction() !== null) {
        time = model.property.getRGBTransferFunction().getMTime();
        mt = time > mt ? time : mt;
      }
    }
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
  property: null,

  bounds: [1, -1, 1, -1, 1, -1],
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
  macro.set(publicAPI, model, ['property']);
  macro.setGet(publicAPI, model, ['mapper']);
  macro.getArray(publicAPI, model, ['bounds'], 6);

  // Object methods
  vtkImageSlice(publicAPI, model);
}

// ----------------------------------------------------------------------------

export const newInstance = macro.newInstance(extend, 'vtkImageSlice');

// ----------------------------------------------------------------------------

export default { newInstance, extend };
