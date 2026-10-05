import macro from 'vtk.js/Sources/macros';
import vtkHardwareSelector from 'vtk.js/Sources/Rendering/Core/HardwareSelector';
import PixelSelectionHelper from 'vtk.js/Sources/Rendering/Core/HardwareSelector/PixelSelectionHelper';
import vtkWebGPUBuffer from 'vtk.js/Sources/Rendering/WebGPU/Buffer';
import vtkWebGPUHardwareSelectionPass from 'vtk.js/Sources/Rendering/WebGPU/HardwareSelectionPass';

const { vtkErrorMacro } = macro;

// The buffers hold only the captured area. Display y goes up and texture
// rows go down, so the first buffer row is the top row of the area.
function isInArea(xx, yy, buffdata) {
  const area = buffdata.area;
  return xx >= area[0] && xx <= area[2] && yy >= area[1] && yy <= area[3];
}

function getPixelIndex(xx, yy, buffdata, rowWidth) {
  return (buffdata.area[3] - yy) * rowWidth + (xx - buffdata.area[0]);
}

function convert(xx, yy, buffdata, channel) {
  const index = getPixelIndex(xx, yy, buffdata, buffdata.colorBufferWidth);
  return buffdata.colorValues[index * 4 + channel];
}

// Decode one pixel of the read back buffers.
function readPixel(buffdata, inDisplayPosition) {
  if (!isInArea(inDisplayPosition[0], inDisplayPosition[1], buffdata)) {
    return null;
  }

  const actorid = convert(
    inDisplayPosition[0],
    inDisplayPosition[1],
    buffdata,
    0
  );

  if (actorid <= 0 || actorid - 1 >= (buffdata.props?.length ?? 0)) {
    // the pixel did not hit any actor.
    return null;
  }

  const info = { valid: true };

  info.propID = actorid - 1;
  info.prop = buffdata.props?.[info.propID];

  let compositeID = convert(
    inDisplayPosition[0],
    inDisplayPosition[1],
    buffdata,
    1
  );
  if (compositeID < 0 || compositeID > 0xffffff) {
    compositeID = 0;
  }
  info.compositeID = compositeID - 1;
  // attributeID is stored with a +1 offset in the selection buffer so that
  // 0 means "no data" while 0 remains a valid decoded attribute index.
  // A buffer value < 1 means no attribute was written, fall back to compositeID.
  // After fallback, subtract 1 to recover the original 0 based index.
  let attributeID = convert(
    inDisplayPosition[0],
    inDisplayPosition[1],
    buffdata,
    2
  );
  if (attributeID < 1) {
    attributeID = compositeID;
  }
  info.attributeID = attributeID - 1;

  if (buffdata.captureZValues) {
    // A copy from a depth texture must use the full texture, so the depth
    // buffer holds all the window.
    const offset =
      (buffdata.height - inDisplayPosition[1] - 1) *
        buffdata.zbufferBufferWidth +
      inDisplayPosition[0];
    info.zValue = buffdata.depthValues[offset];
    info.zValue = buffdata.webGPURenderer.convertToOpenGLDepth(info.zValue);
    info.displayPosition = [inDisplayPosition[0], inDisplayPosition[1]];
  }
  return info;
}

//----------------------------------------------------------------------------
// Give the read back buffers the functions that use them. The fields are
// area, width, height, colorValues, colorBufferWidth, props,
// fieldAssociation and captureZValues. With captureZValues, also
// depthValues, zbufferBufferWidth, renderer, webGPURenderer and
// webGPURenderWindow.
export function newSourceData(fields) {
  const result = { ...fields };
  const read = (position) => readPixel(result, position);
  result.generateSelection = (fx1, fy1, fx2, fy2) =>
    PixelSelectionHelper.generateSelection(read, fx1, fy1, fx2, fy2, {
      fieldAssociation: result.fieldAssociation,
      captureZValues: result.captureZValues,
      displayToWorld: (x, y, z) =>
        result.webGPURenderWindow.displayToWorld(x, y, z, result.renderer),
    });
  result.getPixelInformation = (
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
  result.isPropHit = (propID) => {
    if (!result.hitProps) {
      result.hitProps = new Set();
      const values = result.colorValues;
      for (let i = 0; i < values.length; i += 4) {
        if (values[i] > 0) {
          result.hitProps.add(values[i] - 1);
        }
      }
    }
    return result.hitProps.has(propID);
  };
  return result;
}

// ----------------------------------------------------------------------------
// vtkWebGPUHardwareSelector methods
// ----------------------------------------------------------------------------

function vtkWebGPUHardwareSelector(publicAPI, model) {
  // Set our className
  model.classHierarchy.push('vtkWebGPUHardwareSelector');

  publicAPI.attach = (webGPURenderWindow, renderer) => {
    model._WebGPURenderWindow = webGPURenderWindow;
    model._renderer = renderer;
  };

  publicAPI.getPropIDForSelection = (runtimePropID, prop = null) => {
    if (model._selectionPropMap.has(runtimePropID)) {
      return model._selectionPropMap.get(runtimePropID);
    }

    const selectionPropID = model._selectionProps.length;
    model._selectionPropMap.set(runtimePropID, selectionPropID);
    model._selectionProps.push(prop);
    return selectionPropID;
  };

  //----------------------------------------------------------------------------
  publicAPI.endSelection = () => {
    model._WebGPURenderWindow
      ?.getViewNodeFor(model._renderer)
      ?.setSelector(null);
  };

  //----------------------------------------------------------------------------
  // The area is in display pixels, with y up. setArea rounds it down.
  const superSetArea = publicAPI.setArea;
  publicAPI.setArea = (...args) => {
    if (superSetArea(...args)) {
      for (let i = 0; i < 4; i++) {
        model.area[i] = Math.floor(model.area[i]);
      }
      return true;
    }
    return false;
  };

  //----------------------------------------------------------------------------
  // WebGPU reads the GPU buffers back asynchronously, so there is no
  // synchronous captureBuffers() or select(). captureBuffersAsync() reads
  // the area of setArea() and keeps the data. Then getPixelInformation(),
  // generateSelection() and isPropHit() read the kept data synchronously.
  // With no area set, all the window is read.
  publicAPI.captureBuffersAsync = async () => {
    const area = model.area;
    let data = null;
    // An area of all zeros is the default value, which means all the window.
    if (area.some((v) => v !== 0)) {
      data = await publicAPI.getSourceDataAsync(
        model._renderer,
        area[0],
        area[1],
        area[2],
        area[3]
      );
    } else {
      data = await publicAPI.getSourceDataAsync(model._renderer);
    }
    model._capturedData = data || null;
    return !!data;
  };

  publicAPI.getCapturedData = () => model._capturedData;

  publicAPI.releasePixBuffers = () => {
    model._capturedData = null;
  };

  publicAPI.releaseGraphicsResources = () => {
    publicAPI.releasePixBuffers();
  };

  publicAPI.getPixelInformation = (
    inDisplayPosition,
    maxDistance,
    outSelectedPosition
  ) => {
    if (!model._capturedData) {
      vtkErrorMacro('Call captureBuffersAsync before getPixelInformation.');
      return null;
    }
    return model._capturedData.getPixelInformation(
      inDisplayPosition,
      maxDistance,
      outSelectedPosition
    );
  };

  publicAPI.generateSelection = (fx1, fy1, fx2, fy2) => {
    if (!model._capturedData) {
      vtkErrorMacro('Call captureBuffersAsync before generateSelection.');
      return [];
    }
    return model._capturedData.generateSelection(fx1, fy1, fx2, fy2);
  };

  publicAPI.isPropHit = (propID) => !!model._capturedData?.isPropHit(propID);

  //----------------------------------------------------------------------------
  // The selection pass renders the full window. Only the pixels of the area
  // fx1, fy1, fx2, fy2 (display pixels, y up) are copied back to the CPU.
  // With no area, all the window is copied.
  publicAPI.getSourceDataAsync = async (
    renderer = model._renderer,
    fx1 = undefined,
    fy1 = undefined,
    fx2 = undefined,
    fy2 = undefined
  ) => {
    if (!publicAPI.prepareCapture(model._WebGPURenderWindow, renderer)) {
      return false;
    }

    if (!model._WebGPURenderWindow.getInitialized()) {
      model._WebGPURenderWindow.initialize();
      await new Promise((resolve) => {
        model._WebGPURenderWindow.onInitialized(resolve);
      });
    }

    const webGPURenderer = model._WebGPURenderWindow.getViewNodeFor(renderer);

    if (!webGPURenderer) {
      return false;
    }

    // Initialize renderer for selection.
    // change the renderer's background to black, which will indicate a miss
    const originalSuppress = webGPURenderer.getSuppressClear();
    const originalSelector = webGPURenderer.getSelector();
    model._selectionPropMap.clear();
    model._selectionProps = [];
    webGPURenderer.setSuppressClear(true);
    webGPURenderer.setSelector(publicAPI);

    try {
      model._selectionPass.traverse(model._WebGPURenderWindow, webGPURenderer);
    } finally {
      // restore original renderer state
      webGPURenderer.setSelector(originalSelector);
      webGPURenderer.setSuppressClear(originalSuppress);
    }

    const device = model._WebGPURenderWindow.getDevice();
    const texture = model._selectionPass.getColorTexture();
    const depthTexture = model._selectionPass.getDepthTexture();

    // as this is async we really don't want to store things in
    // the class as multiple calls may start before resolving
    // so anything specific to this request gets put into the
    // result object (by value in most cases)
    const width = texture.getWidth();
    const height = texture.getHeight();
    const area = [0, 0, width - 1, height - 1];
    if (fx1 !== undefined) {
      area[0] = Math.max(0, Math.floor(Math.min(fx1, fx2)));
      area[1] = Math.max(0, Math.floor(Math.min(fy1, fy2)));
      area[2] = Math.min(width - 1, Math.floor(Math.max(fx1, fx2)));
      area[3] = Math.min(height - 1, Math.floor(Math.max(fy1, fy2)));
    }
    if (area[2] < area[0] || area[3] < area[1]) {
      return false;
    }
    const copyWidth = area[2] - area[0] + 1;
    const copyHeight = area[3] - area[1] + 1;
    const copyOrigin = { x: area[0], y: height - 1 - area[3] };

    const result = {
      area,
      captureZValues: model.captureZValues,
      fieldAssociation: model.fieldAssociation,
      props: [...model._selectionProps],
      renderer,
      webGPURenderer,
      webGPURenderWindow: model._WebGPURenderWindow,
      width,
      height,
    };

    // must be a multiple of 256 bytes, so 16 texels with rgba32uint
    result.colorBufferWidth = 16 * Math.floor((copyWidth + 15) / 16);
    result.colorBufferSizeInBytes =
      result.colorBufferWidth * copyHeight * 4 * 4;
    const colorBuffer = vtkWebGPUBuffer.newInstance({
      label: 'hardwareSelectColorBuffer',
    });
    colorBuffer.setDevice(device);
    /* eslint-disable no-bitwise */
    /* eslint-disable no-undef */
    colorBuffer.create(
      result.colorBufferSizeInBytes,
      GPUBufferUsage.MAP_READ | GPUBufferUsage.COPY_DST
    );
    /* eslint-enable no-bitwise */
    /* eslint-enable no-undef */

    const cmdEnc = model._WebGPURenderWindow.getCommandEncoder();
    cmdEnc.copyTextureToBuffer(
      {
        texture: texture.getHandle(),
        origin: copyOrigin,
      },
      {
        buffer: colorBuffer.getHandle(),
        bytesPerRow: 16 * result.colorBufferWidth,
        rowsPerImage: copyHeight,
      },
      {
        width: copyWidth,
        height: copyHeight,
        depthOrArrayLayers: 1,
      }
    );

    let zbuffer;
    if (model.captureZValues) {
      result.zbufferBufferWidth = 64 * Math.floor((width + 63) / 64);
      zbuffer = vtkWebGPUBuffer.newInstance({
        label: 'hardwareSelectDepthBuffer',
      });
      zbuffer.setDevice(device);
      result.zbufferSizeInBytes = height * result.zbufferBufferWidth * 4;
      /* eslint-disable no-bitwise */
      /* eslint-disable no-undef */
      zbuffer.create(
        result.zbufferSizeInBytes,
        GPUBufferUsage.MAP_READ | GPUBufferUsage.COPY_DST
      );
      /* eslint-enable no-bitwise */
      /* eslint-enable no-undef */

      cmdEnc.copyTextureToBuffer(
        {
          texture: depthTexture.getHandle(),
          aspect: 'depth-only',
        },
        {
          buffer: zbuffer.getHandle(),
          bytesPerRow: 4 * result.zbufferBufferWidth,
          rowsPerImage: height,
        },
        {
          width,
          height,
          depthOrArrayLayers: 1,
        }
      );
    }
    device.submitCommandEncoder(cmdEnc);

    /* eslint-disable no-undef */
    const cLoad = colorBuffer.mapAsync(GPUMapMode.READ);
    if (model.captureZValues) {
      const zLoad = zbuffer.mapAsync(GPUMapMode.READ);
      await Promise.all([cLoad, zLoad]);
      result.depthValues = new Float32Array(zbuffer.getMappedRange().slice());
      zbuffer.unmap();
      zbuffer.getHandle().destroy();
    } else {
      await cLoad;
    }
    /* eslint-enable no-undef */

    result.colorValues = new Uint32Array(colorBuffer.getMappedRange().slice());
    colorBuffer.unmap();
    // the read back buffers are used one time only
    colorBuffer.getHandle().destroy();

    return newSourceData(result);
  };
}

// ----------------------------------------------------------------------------
// Object factory
// ----------------------------------------------------------------------------

const DEFAULT_VALUES = {
  // WebGPURenderWindow: null,
  area: undefined,
  _selectionPropMap: null,
  _selectionProps: null,
  _capturedData: null,
};

// ----------------------------------------------------------------------------

export function extend(publicAPI, model, initialValues = {}) {
  Object.assign(model, DEFAULT_VALUES, initialValues);

  // Build VTK API
  vtkHardwareSelector.extend(publicAPI, model, initialValues);

  model._selectionPass = vtkWebGPUHardwareSelectionPass.newInstance();
  model._selectionPropMap = new Map();
  model._selectionProps = [];
  if (!model.area) {
    model.area = [0, 0, 0, 0];
  }

  macro.setGetArray(publicAPI, model, ['area'], 4);
  macro.setGet(publicAPI, model, ['_WebGPURenderWindow']);
  macro.moveToProtected(publicAPI, model, ['WebGPURenderWindow']);

  // Object methods
  vtkWebGPUHardwareSelector(publicAPI, model);
}

// ----------------------------------------------------------------------------

export const newInstance = macro.newInstance(
  extend,
  'vtkWebGPUHardwareSelector'
);

// ----------------------------------------------------------------------------

export default { newInstance, extend, newSourceData };
