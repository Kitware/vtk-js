import macro from 'vtk.js/Sources/macros';
import Constants from 'vtk.js/Sources/Rendering/Core/HardwareSelector/Constants';
import vtkHardwareSelector from 'vtk.js/Sources/Rendering/Core/HardwareSelector';
import vtkOpenGLFramebuffer from 'vtk.js/Sources/Rendering/OpenGL/Framebuffer';
import PixelSelectionHelper from 'vtk.js/Sources/Rendering/Core/HardwareSelector/PixelSelectionHelper';
import vtkDataSet from 'vtk.js/Sources/Common/DataModel/DataSet';

const { PassTypes } = Constants;
const { FieldAssociations } = vtkDataSet;

const idOffset = 1;

function getAlpha(xx, yy, pb, area) {
  if (!pb) {
    return 0;
  }
  const offset = (yy * (area[2] - area[0] + 1) + xx) * 4;
  return pb[offset + 3];
}

function convert(xx, yy, pb, area) {
  if (!pb) {
    return 0;
  }

  const offset = (yy * (area[2] - area[0] + 1) + xx) * 4;

  const r = pb[offset];
  const g = pb[offset + 1];
  const b = pb[offset + 2];
  return (b * 256 + g) * 256 + r;
}

function getID(low24, high8) {
  /* eslint-disable no-bitwise */
  let val = high8;
  val <<= 24;
  val |= low24;
  return val;
  /* eslint-enable no-bitwise */
}

// Decode one pixel of the pass buffers. buffdata has area, pixBuffer, props,
// captureZValues and zBuffer.
function readPixel(buffdata, inDisplayPosition) {
  if (
    inDisplayPosition[0] < buffdata.area[0] ||
    inDisplayPosition[0] > buffdata.area[2] ||
    inDisplayPosition[1] < buffdata.area[1] ||
    inDisplayPosition[1] > buffdata.area[3]
  ) {
    return null;
  }

  // offset inDisplayPosition based on the lower-left-corner of the Area.
  const displayPosition = [
    inDisplayPosition[0] - buffdata.area[0],
    inDisplayPosition[1] - buffdata.area[1],
  ];

  const actorid = convert(
    displayPosition[0],
    displayPosition[1],
    buffdata.pixBuffer[PassTypes.ACTOR_PASS],
    buffdata.area
  );
  if (actorid <= 0 || actorid - idOffset >= buffdata.props.length) {
    // the pixel did not hit any actor.
    return null;
  }

  const info = {};
  info.valid = true;

  info.propID = actorid - idOffset;
  info.prop = buffdata.props[info.propID];

  let compositeID = convert(
    displayPosition[0],
    displayPosition[1],
    buffdata.pixBuffer[PassTypes.COMPOSITE_INDEX_PASS],
    buffdata.area
  );
  if (compositeID < 0 || compositeID > 0xffffff) {
    compositeID = 0;
  }
  info.compositeID = compositeID - idOffset;
  if (buffdata.captureZValues) {
    const offset =
      (displayPosition[1] * (buffdata.area[2] - buffdata.area[0] + 1) +
        displayPosition[0]) *
      4;
    info.zValue =
      (256 * buffdata.zBuffer[offset] + buffdata.zBuffer[offset + 1]) / 65535.0;
    info.displayPosition = [inDisplayPosition[0], inDisplayPosition[1]];
  }

  // Skip attribute ids if alpha is zero (missed)
  if (buffdata.pixBuffer[PassTypes.ID_LOW24]) {
    if (
      getAlpha(
        displayPosition[0],
        displayPosition[1],
        buffdata.pixBuffer[PassTypes.ID_LOW24],
        buffdata.area
      ) === 0.0
    ) {
      return info;
    }
  }

  const low24 = convert(
    displayPosition[0],
    displayPosition[1],
    buffdata.pixBuffer[PassTypes.ID_LOW24],
    buffdata.area
  );
  const high24 = convert(
    displayPosition[0],
    displayPosition[1],
    buffdata.pixBuffer[PassTypes.ID_HIGH24],
    buffdata.area
  );
  info.attributeID = getID(low24, high24);

  return info;
}

// Give buffdata the functions that build selections from its pixels.
// buffdata also has fieldAssociation, renderer and openGLRenderWindow.
function addSelectionFunctions(buffdata) {
  const read = (position) => readPixel(buffdata, position);
  buffdata.getPixelInformation = (
    inDisplayPosition,
    maxDistance,
    outSelectedPosition
  ) =>
    PixelSelectionHelper.getPixelInformation(
      read,
      inDisplayPosition,
      maxDistance,
      outSelectedPosition
    );
  buffdata.generateSelection = (fx1, fy1, fx2, fy2) =>
    PixelSelectionHelper.generateSelection(read, fx1, fy1, fx2, fy2, {
      fieldAssociation: buffdata.fieldAssociation,
      captureZValues: buffdata.captureZValues,
      displayToWorld: (x, y, z) =>
        buffdata.openGLRenderWindow.displayToWorld(x, y, z, buffdata.renderer),
    });
  return buffdata;
}

// ----------------------------------------------------------------------------
// vtkOpenGLHardwareSelector methods
// ----------------------------------------------------------------------------

function vtkOpenGLHardwareSelector(publicAPI, model) {
  // Set our className
  model.classHierarchy.push('vtkOpenGLHardwareSelector');

  //----------------------------------------------------------------------------
  publicAPI.releasePixBuffers = () => {
    model.rawPixBuffer = [];
    model.pixBuffer = [];
    model.zBuffer = null;
  };

  publicAPI.releaseGraphicsResources = () => {
    publicAPI.releasePixBuffers();
    model.framebuffer?.delete();
    model.framebuffer = null;
  };

  //----------------------------------------------------------------------------
  publicAPI.beginSelection = () => {
    model._openGLRenderer = model._openGLRenderWindow.getViewNodeFor(
      model._renderer,
      model._openGLRenderer
    );
    model.maxAttributeId = 0;

    const size = model._openGLRenderWindow.getSize();
    if (!model.framebuffer) {
      model.framebuffer = vtkOpenGLFramebuffer.newInstance();
      model.framebuffer.setOpenGLRenderWindow(model._openGLRenderWindow);
      model.framebuffer.saveCurrentBindingsAndBuffers();
      model.framebuffer.create(size[0], size[1]);
      // this calls model.framebuffer.bind()
      model.framebuffer.populateFramebuffer();
    } else {
      model.framebuffer.setOpenGLRenderWindow(model._openGLRenderWindow);
      model.framebuffer.saveCurrentBindingsAndBuffers();
      const fbSize = model.framebuffer.getSize();
      if (!fbSize || fbSize[0] !== size[0] || fbSize[1] !== size[1]) {
        model.framebuffer.create(size[0], size[1]);
        // this calls model.framebuffer.bind()
        model.framebuffer.populateFramebuffer();
      } else {
        model.framebuffer.bind();
      }
    }

    model._openGLRenderer.clear();
    model._openGLRenderer.setSelector(publicAPI);
    model.hitProps = {};
    model.propPixels = {};
    model.props = [];
    publicAPI.releasePixBuffers();

    if (model.fieldAssociation === FieldAssociations.FIELD_ASSOCIATION_POINTS) {
      const gl = model._openGLRenderWindow.getContext();
      const originalBlending = gl.isEnabled(gl.BLEND);
      gl.disable(gl.BLEND);
      model._openGLRenderWindow.traverseAllPasses();
      if (originalBlending) {
        gl.enable(gl.BLEND);
      }
    }
  };

  //----------------------------------------------------------------------------
  publicAPI.endSelection = () => {
    model.hitProps = {};
    model._openGLRenderer.setSelector(null);
    model.framebuffer.restorePreviousBindingsAndBuffers();
  };

  publicAPI.preCapturePass = () => {
    const gl = model._openGLRenderWindow.getContext();
    // Disable blending
    model.originalBlending = gl.isEnabled(gl.BLEND);
    gl.disable(gl.BLEND);
  };

  publicAPI.postCapturePass = () => {
    const gl = model._openGLRenderWindow.getContext();
    // Restore blending if it was enabled prior to the capture
    if (model.originalBlending) {
      gl.enable(gl.BLEND);
    }
  };

  //----------------------------------------------------------------------------
  publicAPI.select = () => {
    let sel = null;
    if (publicAPI.captureBuffers()) {
      sel = publicAPI.generateSelection(
        model.area[0],
        model.area[1],
        model.area[2],
        model.area[3]
      );
      publicAPI.releasePixBuffers();
    }
    return sel;
  };

  publicAPI.getSourceDataAsync = async (renderer, fx1, fy1, fx2, fy2) => {
    // assign the renderer
    model._renderer = renderer;

    // set area to all if no arguments provided
    if (fx1 === undefined) {
      const size = model._openGLRenderWindow.getSize();
      publicAPI.setArea(0, 0, size[0] - 1, size[1] - 1);
    } else {
      publicAPI.setArea(fx1, fy1, fx2, fy2);
    }
    // just do capture buffers and package up the result
    if (!publicAPI.captureBuffers()) {
      return false;
    }
    const result = {
      area: [...model.area],
      pixBuffer: [...model.pixBuffer],
      captureZValues: model.captureZValues,
      zBuffer: model.zBuffer,
      props: [...model.props],
      fieldAssociation: model.fieldAssociation,
      renderer,
      openGLRenderWindow: model._openGLRenderWindow,
    };
    return addSelectionFunctions(result);
  };

  //----------------------------------------------------------------------------
  publicAPI.captureBuffers = () => {
    if (!publicAPI.prepareCapture(model._openGLRenderWindow, model._renderer)) {
      return false;
    }

    model._openGLRenderer = model._openGLRenderWindow.getViewNodeFor(
      model._renderer,
      model._openGLRenderer
    );

    // int rgba[4];
    // rwin.getColorBufferSizes(rgba);
    // if (rgba[0] < 8 || rgba[1] < 8 || rgba[2] < 8) {
    //   vtkErrorMacro("Color buffer depth must be at least 8 bit. "
    //     "Currently: " << rgba[0] << ", " << rgba[1] << ", " <<rgba[2]);
    //   return false;
    // }
    publicAPI.invokeEvent({ type: 'StartEvent' });

    // Initialize renderer for selection.
    // change the renderer's background to black, which will indicate a miss
    model.originalBackground = model._renderer.getBackgroundByReference();
    model._renderer.setBackground(0.0, 0.0, 0.0, 0.0);
    const rpasses = model._openGLRenderWindow.getRenderPasses();

    publicAPI.beginSelection();
    const pixelBufferSavedPasses = [];
    for (
      model.currentPass = PassTypes.MIN_KNOWN_PASS;
      model.currentPass <= PassTypes.MAX_KNOWN_PASS;
      model.currentPass++
    ) {
      if (publicAPI.passRequired(model.currentPass)) {
        publicAPI.preCapturePass(model.currentPass);
        if (
          model.captureZValues &&
          model.currentPass === PassTypes.ACTOR_PASS &&
          typeof rpasses[0].requestDepth === 'function' &&
          typeof rpasses[0].getFramebuffer === 'function'
        ) {
          rpasses[0].requestDepth();
          model._openGLRenderWindow.traverseAllPasses();
        } else {
          model._openGLRenderWindow.traverseAllPasses();
        }
        publicAPI.postCapturePass(model.currentPass);

        publicAPI.savePixelBuffer(model.currentPass);
        pixelBufferSavedPasses.push(model.currentPass);
      }
    }

    // Process pixel buffers
    pixelBufferSavedPasses.forEach((pass) => {
      model.currentPass = pass;
      publicAPI.processPixelBuffers();
    });
    model.currentPass = PassTypes.MAX_KNOWN_PASS;

    publicAPI.endSelection();

    // restore original background
    model._renderer.setBackground(model.originalBackground);
    publicAPI.invokeEvent({ type: 'EndEvent' });

    // restore image, not needed?
    // model._openGLRenderWindow.traverseAllPasses();
    return true;
  };

  publicAPI.processPixelBuffers = () => {
    model.props.forEach((prop, index) => {
      if (publicAPI.isPropHit(index)) {
        prop.processSelectorPixelBuffers(publicAPI, model.propPixels[index]);
      }
    });
  };

  //----------------------------------------------------------------------------
  publicAPI.passRequired = (pass) => {
    if (pass === PassTypes.ID_HIGH24) {
      if (
        model.fieldAssociation === FieldAssociations.FIELD_ASSOCIATION_POINTS
      ) {
        return model.maximumPointId > 0x00ffffff;
      }
      if (
        model.fieldAssociation === FieldAssociations.FIELD_ASSOCIATION_CELLS
      ) {
        return model.maximumCellId > 0x00ffffff;
      }
    }
    return true;
  };

  //----------------------------------------------------------------------------
  publicAPI.savePixelBuffer = (passNo) => {
    model.pixBuffer[passNo] = model._openGLRenderWindow.getPixelData(
      model.area[0],
      model.area[1],
      model.area[2],
      model.area[3]
    );

    if (!model.rawPixBuffer[passNo]) {
      const size =
        (model.area[2] - model.area[0] + 1) *
        (model.area[3] - model.area[1] + 1) *
        4;

      model.rawPixBuffer[passNo] = new Uint8Array(size);
      model.rawPixBuffer[passNo].set(model.pixBuffer[passNo]);
    }

    if (passNo === PassTypes.ACTOR_PASS) {
      if (model.captureZValues) {
        const rpasses = model._openGLRenderWindow.getRenderPasses();
        if (
          typeof rpasses[0].requestDepth === 'function' &&
          typeof rpasses[0].getFramebuffer === 'function'
        ) {
          const fb = rpasses[0].getFramebuffer();
          fb.saveCurrentBindingsAndBuffers();
          fb.bind();
          model.zBuffer = model._openGLRenderWindow.getPixelData(
            model.area[0],
            model.area[1],
            model.area[2],
            model.area[3]
          );
          fb.restorePreviousBindingsAndBuffers();
        }
      }
      publicAPI.buildPropHitList(model.rawPixBuffer[passNo]);
    }
  };

  //----------------------------------------------------------------------------
  publicAPI.buildPropHitList = (pixelbuffer) => {
    let offset = 0;
    for (let yy = 0; yy <= model.area[3] - model.area[1]; yy++) {
      for (let xx = 0; xx <= model.area[2] - model.area[0]; xx++) {
        let val = convert(xx, yy, pixelbuffer, model.area, 'buildPropHitList');
        if (val > 0) {
          val--;
          if (!(val in model.hitProps)) {
            model.hitProps[val] = true;
            model.propPixels[val] = [];
          }
          model.propPixels[val].push(offset * 4);
        }
        ++offset;
      }
    }
  };

  //----------------------------------------------------------------------------
  publicAPI.renderProp = (prop) => {
    if (model.currentPass === PassTypes.ACTOR_PASS) {
      publicAPI.setPropColorValueFromInt(model.props.length + idOffset);
      model.props.push(prop);
    }
  };

  //----------------------------------------------------------------------------
  publicAPI.renderCompositeIndex = (index) => {
    if (model.currentPass === PassTypes.COMPOSITE_INDEX_PASS) {
      publicAPI.setPropColorValueFromInt(index + idOffset);
    }
  };

  //----------------------------------------------------------------------------
  // Keeps the largest attribute id given. A negative id is valid and is
  // ignored: higher order cells add points to draw smooth surfaces.
  publicAPI.renderAttributeId = (attribid) => {
    if (attribid >= 0) {
      model.maxAttributeId = Math.max(model.maxAttributeId, attribid);
    }
  };

  //----------------------------------------------------------------------------
  publicAPI.passTypeToString = (type) => macro.enumToString(PassTypes, type);

  //----------------------------------------------------------------------------
  publicAPI.isPropHit = (id) => Boolean(model.hitProps[id]);

  publicAPI.setPropColorValueFromInt = (val) => {
    model.propColorValue[0] = (val % 256) / 255.0;
    model.propColorValue[1] = (Math.floor(val / 256) % 256) / 255.0;
    model.propColorValue[2] = (Math.floor(val / 65536) % 256) / 255.0;
  };

  publicAPI.delete = macro.chain(
    publicAPI.releaseGraphicsResources,
    publicAPI.delete
  );

  //----------------------------------------------------------------------------
  // The selection functions read the pass buffers of the last
  // captureBuffers() call. info has valid, propID, prop, compositeID and
  // attributeID.
  const getCapturedData = () =>
    addSelectionFunctions({
      area: model.area,
      pixBuffer: model.pixBuffer,
      captureZValues: model.captureZValues,
      zBuffer: model.zBuffer,
      props: model.props,
      fieldAssociation: model.fieldAssociation,
      renderer: model._renderer,
      openGLRenderWindow: model._openGLRenderWindow,
    });

  publicAPI.getPixelInformation = (
    inDisplayPosition,
    maxDistance,
    outSelectedPosition
  ) =>
    getCapturedData().getPixelInformation(
      inDisplayPosition,
      maxDistance,
      outSelectedPosition
    );

  publicAPI.generateSelection = (fx1, fy1, fx2, fy2) =>
    getCapturedData().generateSelection(fx1, fy1, fx2, fy2);

  publicAPI.getRawPixelBuffer = (passNo) => model.rawPixBuffer[passNo];
  publicAPI.getPixelBuffer = (passNo) => model.pixBuffer[passNo];

  //----------------------------------------------------------------------------

  publicAPI.attach = (openGLRenderWindow, renderer) => {
    model._openGLRenderWindow = openGLRenderWindow;
    model._renderer = renderer;
  };

  // override
  const superSetArea = publicAPI.setArea;
  publicAPI.setArea = (...args) => {
    if (superSetArea(...args)) {
      model.area[0] = Math.floor(model.area[0]);
      model.area[1] = Math.floor(model.area[1]);
      model.area[2] = Math.floor(model.area[2]);
      model.area[3] = Math.floor(model.area[3]);
      return true;
    }
    return false;
  };
}

// ----------------------------------------------------------------------------
// Object factory
// ----------------------------------------------------------------------------

const DEFAULT_VALUES = {
  area: undefined,
  // _renderer: null,
  // _openGLRenderWindow: null,
  // _openGLRenderer: null,
  currentPass: -1,
  propColorValue: null,
  props: null,
  maximumPointId: 0,
  maximumCellId: 0,
  idOffset: 1,
};

// ----------------------------------------------------------------------------

export function extend(publicAPI, model, initialValues = {}) {
  Object.assign(model, DEFAULT_VALUES, initialValues);

  // Build VTK API
  vtkHardwareSelector.extend(publicAPI, model, initialValues);

  model.propColorValue = [0, 0, 0];
  model.props = [];

  if (!model.area) {
    model.area = [0, 0, 0, 0];
  }

  macro.setGetArray(publicAPI, model, ['area'], 4);
  macro.setGet(publicAPI, model, [
    '_renderer',
    'currentPass',
    '_openGLRenderWindow',
    'maximumPointId',
    'maximumCellId',
  ]);

  macro.setGetArray(publicAPI, model, ['propColorValue'], 3);
  macro.moveToProtected(publicAPI, model, ['renderer', 'openGLRenderWindow']);
  macro.event(publicAPI, model, 'event');

  // Object methods
  vtkOpenGLHardwareSelector(publicAPI, model);
}

// ----------------------------------------------------------------------------

export const newInstance = macro.newInstance(
  extend,
  'vtkOpenGLHardwareSelector'
);

// ----------------------------------------------------------------------------

export default { newInstance, extend, ...Constants };
