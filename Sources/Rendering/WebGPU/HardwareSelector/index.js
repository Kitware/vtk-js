import macro from 'vtk.js/Sources/macros';
import vtkHardwareSelector from 'vtk.js/Sources/Rendering/Core/HardwareSelector';
import vtkWebGPUBuffer from 'vtk.js/Sources/Rendering/WebGPU/Buffer';
import vtkWebGPUHardwareSelectionPass from 'vtk.js/Sources/Rendering/WebGPU/HardwareSelectionPass';
import vtkSelectionNode from 'vtk.js/Sources/Common/DataModel/SelectionNode';
import vtkDataSet from 'vtk.js/Sources/Common/DataModel/DataSet';

const { SelectionContent, SelectionField } = vtkSelectionNode;
const { FieldAssociations } = vtkDataSet;
const { vtkErrorMacro } = macro;

function getInfoHash(info) {
  return `${info.propID} ${info.compositeID}`;
}

function convert(xx, yy, buffdata, channel) {
  const offset =
    ((buffdata.height - yy - 1) * buffdata.colorBufferWidth + xx) * 4 + channel;
  return buffdata.colorValues[offset];
}

function getPixelInformationWithData(
  buffdata,
  inDisplayPosition,
  maxDistance,
  outSelectedPosition
) {
  // Base case
  const maxDist = maxDistance < 0 ? 0 : maxDistance;
  if (maxDist === 0) {
    outSelectedPosition[0] = inDisplayPosition[0];
    outSelectedPosition[1] = inDisplayPosition[1];
    if (
      inDisplayPosition[0] < 0 ||
      inDisplayPosition[0] >= buffdata.width ||
      inDisplayPosition[1] < 0 ||
      inDisplayPosition[1] >= buffdata.height
    ) {
      return null;
    }

    const actorid = convert(
      inDisplayPosition[0],
      inDisplayPosition[1],
      buffdata,
      0
    );

    if (actorid <= 0) {
      // the pixel did not hit any actor.
      return null;
    }

    const info = {};

    info.propID = actorid;

    let compositeID = convert(
      inDisplayPosition[0],
      inDisplayPosition[1],
      buffdata,
      1
    );
    if (compositeID < 0 || compositeID > 0xffffff) {
      compositeID = 0;
    }
    info.compositeID = compositeID;

    if (buffdata.captureZValues) {
      const offset =
        (buffdata.height - inDisplayPosition[1] - 1) *
          buffdata.zbufferBufferWidth +
        inDisplayPosition[0];
      info.zValue = buffdata.depthValues[offset];
      info.zValue = buffdata.webGPURenderer.convertToOpenGLDepth(info.zValue);
      info.displayPosition = inDisplayPosition;
    }
    return info;
  }

  // Iterate over successively growing boxes.
  // They recursively call the base case to handle single pixels.
  const dispPos = [inDisplayPosition[0], inDisplayPosition[1]];
  const curPos = [0, 0];
  let info = getPixelInformationWithData(
    buffdata,
    inDisplayPosition,
    0,
    outSelectedPosition
  );
  if (info) {
    return info;
  }
  for (let dist = 1; dist < maxDist; ++dist) {
    // Vertical sides of box.
    for (
      let y = dispPos[1] > dist ? dispPos[1] - dist : 0;
      y <= dispPos[1] + dist;
      ++y
    ) {
      curPos[1] = y;
      if (dispPos[0] >= dist) {
        curPos[0] = dispPos[0] - dist;
        info = getPixelInformationWithData(
          buffdata,
          curPos,
          0,
          outSelectedPosition
        );
        if (info) {
          return info;
        }
      }
      curPos[0] = dispPos[0] + dist;
      info = getPixelInformationWithData(
        buffdata,
        curPos,
        0,
        outSelectedPosition
      );
      if (info) {
        return info;
      }
    }
    // Horizontal sides of box.
    for (
      let x = dispPos[0] >= dist ? dispPos[0] - (dist - 1) : 0;
      x <= dispPos[0] + (dist - 1);
      ++x
    ) {
      curPos[0] = x;
      if (dispPos[1] >= dist) {
        curPos[1] = dispPos[1] - dist;
        info = getPixelInformationWithData(
          buffdata,
          curPos,
          0,
          outSelectedPosition
        );
        if (info) {
          return info;
        }
      }
      curPos[1] = dispPos[1] + dist;
      info = getPixelInformationWithData(
        buffdata,
        curPos,
        0,
        outSelectedPosition
      );
      if (info) {
        return info;
      }
    }
  }

  // nothing hit.
  outSelectedPosition[0] = inDisplayPosition[0];
  outSelectedPosition[1] = inDisplayPosition[1];
  return null;
}

//-----------------------------------------------------------------------------
function convertSelection(fieldassociation, dataMap, buffdata) {
  const sel = [];

  let count = 0;
  dataMap.forEach((value, key) => {
    const child = vtkSelectionNode.newInstance();
    child.setContentType(SelectionContent.INDICES);
    switch (fieldassociation) {
      case FieldAssociations.FIELD_ASSOCIATION_CELLS:
        child.setFieldType(SelectionField.CELL);
        break;
      case FieldAssociations.FIELD_ASSOCIATION_POINTS:
        child.setFieldType(SelectionField.POINT);
        break;
      default:
        vtkErrorMacro('Unknown field association');
    }
    child.getProperties().propID = value.info.propID;
    const wprop = buffdata.webGPURenderer.getPropFromID(value.info.propID);
    child.getProperties().prop = wprop.getRenderable();
    child.getProperties().compositeID = value.info.compositeID;
    child.getProperties().pixelCount = value.pixelCount;
    if (buffdata.captureZValues) {
      child.getProperties().displayPosition = [
        value.info.displayPosition[0],
        value.info.displayPosition[1],
        value.info.zValue,
      ];
      child.getProperties().worldPosition =
        buffdata.webGPURenderWindow.displayToWorld(
          value.info.displayPosition[0],
          value.info.displayPosition[1],
          value.info.zValue,
          buffdata.renderer
        );
    }

    child.setSelectionList(value.attributeIDs);
    sel[count] = child;
    count++;
  });

  return sel;
}

//----------------------------------------------------------------------------
function generateSelectionWithData(buffdata, fx1, fy1, fx2, fy2) {
  const x1 = Math.floor(fx1);
  const y1 = Math.floor(fy1);
  const x2 = Math.floor(fx2);
  const y2 = Math.floor(fy2);

  const dataMap = new Map();

  const outSelectedPosition = [0, 0];

  for (let yy = y1; yy <= y2; yy++) {
    for (let xx = x1; xx <= x2; xx++) {
      const pos = [xx, yy];
      const info = getPixelInformationWithData(
        buffdata,
        pos,
        0,
        outSelectedPosition
      );
      if (info) {
        const hash = getInfoHash(info);
        if (!dataMap.has(hash)) {
          dataMap.set(hash, {
            info,
            pixelCount: 1,
            attributeIDs: [info.attributeID],
          });
        } else {
          const dmv = dataMap.get(hash);
          dmv.pixelCount++;
          if (buffdata.captureZValues) {
            if (info.zValue < dmv.info.zValue) {
              dmv.info = info;
            }
          }
          if (dmv.attributeIDs.indexOf(info.attributeID) === -1) {
            dmv.attributeIDs.push(info.attributeID);
          }
        }
      }
    }
  }
  return convertSelection(buffdata.fieldAssociation, dataMap, buffdata);
}

// ----------------------------------------------------------------------------
// vtkWebGPUHardwareSelector methods
// ----------------------------------------------------------------------------

function vtkWebGPUHardwareSelector(publicAPI, model) {
  // Set our className
  model.classHierarchy.push('vtkWebGPUHardwareSelector');

  //----------------------------------------------------------------------------
  publicAPI.endSelection = () => {
    model.WebGPURenderer.setSelector(null);
  };

  //----------------------------------------------------------------------------
  // note we ignore the x,y arguments as WebGPU has to do buffer copies
  // of the entire depth bufer. We could realloc hardware selection textures
  // based on the passed in size etc but it gets messy so for now we always
  // render the full size window and copy it to the buffers.
  publicAPI.getSourceDataAsync = async (renderer) => {
    if (!renderer || !model.WebGPURenderWindow) {
      vtkErrorMacro('Renderer and view must be set before calling Select.');
      return false;
    }

    // todo revisit making selection part of core
    // then we can do this in core
    model.WebGPURenderWindow.getRenderable().preRender();

    if (!model.WebGPURenderWindow.getInitialized()) {
      model.WebGPURenderWindow.initialize();
      await new Promise((resolve) => {
        model.WebGPURenderWindow.onInitialized(resolve);
      });
    }

    const webGPURenderer = model.WebGPURenderWindow.getViewNodeFor(renderer);

    if (!webGPURenderer) {
      return false;
    }

    // Initialize renderer for selection.
    // change the renderer's background to black, which will indicate a miss
    const originalSuppress = webGPURenderer.getSuppressClear();
    webGPURenderer.setSuppressClear(true);

    model._selectionPass.traverse(model.WebGPURenderWindow, webGPURenderer);

    // restore original background
    webGPURenderer.setSuppressClear(originalSuppress);

    const device = model.WebGPURenderWindow.getDevice();
    const texture = model._selectionPass.getColorTexture();
    const depthTexture = model._selectionPass.getDepthTexture();

    // as this is async we really don't want to store things in
    // the class as multiple calls may start before resolving
    // so anything specific to this request gets put into the
    // result object (by value in most cases)
    const result = {
      area: [0, 0, texture.getWidth() - 1, texture.getHeight() - 1],
      captureZValues: model.captureZValues,
      fieldAssociation: model.fieldAssociation,
      renderer,
      webGPURenderer,
      webGPURenderWindow: model.WebGPURenderWindow,
      width: texture.getWidth(),
      height: texture.getHeight(),
    };

    // must be a multiple of 256 bytes, so 16 texels with rgba32uint
    result.colorBufferWidth = 16 * Math.floor((result.width + 15) / 16);
    result.colorBufferSizeInBytes =
      result.colorBufferWidth * result.height * 4 * 4;
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

    const cmdEnc = model.WebGPURenderWindow.getCommandEncoder();
    cmdEnc.copyTextureToBuffer(
      {
        texture: texture.getHandle(),
      },
      {
        buffer: colorBuffer.getHandle(),
        bytesPerRow: 16 * result.colorBufferWidth,
        rowsPerImage: result.height,
      },
      {
        width: result.width,
        height: result.height,
        depthOrArrayLayers: 1,
      }
    );

    let zbuffer;
    if (model.captureZValues) {
      result.zbufferBufferWidth = 64 * Math.floor((result.width + 63) / 64);
      zbuffer = vtkWebGPUBuffer.newInstance({
        label: 'hardwareSelectDepthBuffer',
      });
      zbuffer.setDevice(device);
      result.zbufferSizeInBytes = result.height * result.zbufferBufferWidth * 4;
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
          rowsPerImage: result.height,
        },
        {
          width: result.width,
          height: result.height,
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
    } else {
      await cLoad;
    }
    /* eslint-enable no-undef */

    result.colorValues = new Uint32Array(colorBuffer.getMappedRange().slice());
    colorBuffer.unmap();

    result.generateSelection = (fx1, fy1, fx2, fy2) =>
      generateSelectionWithData(result, fx1, fy1, fx2, fy2);
    return result;
  };
}

// ----------------------------------------------------------------------------
// Object factory
// ----------------------------------------------------------------------------

const DEFAULT_VALUES = {
  WebGPURenderWindow: null,
};

// ----------------------------------------------------------------------------

export function extend(publicAPI, model, initialValues = {}) {
  Object.assign(model, DEFAULT_VALUES, initialValues);

  // Build VTK API
  vtkHardwareSelector.extend(publicAPI, model, initialValues);

  model._selectionPass = vtkWebGPUHardwareSelectionPass.newInstance();

  macro.setGet(publicAPI, model, ['WebGPURenderWindow']);

  // Object methods
  vtkWebGPUHardwareSelector(publicAPI, model);
}

// ----------------------------------------------------------------------------

export const newInstance = macro.newInstance(
  extend,
  'vtkWebGPUHardwareSelector'
);

// ----------------------------------------------------------------------------

export default { newInstance, extend };
