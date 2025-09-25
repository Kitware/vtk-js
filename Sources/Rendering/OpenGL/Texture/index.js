import deepEqual from 'fast-deep-equal';
import Constants from 'vtk.js/Sources/Rendering/OpenGL/Texture/Constants';
import HalfFloat from 'vtk.js/Sources/Common/Core/HalfFloat';
import * as macro from 'vtk.js/Sources/macros';
import vtkDataArray from 'vtk.js/Sources/Common/Core/DataArray';
import * as vtkMath from 'vtk.js/Sources/Common/Core/Math';
import vtkViewNode from 'vtk.js/Sources/Rendering/SceneGraph/ViewNode';

import { registerOverride } from 'vtk.js/Sources/Rendering/OpenGL/ViewNodeFactory';

import supportsNorm16Linear from './supportsNorm16Linear';

const { Wrap, Filter } = Constants;
const { VtkDataTypes } = vtkDataArray;
const { vtkDebugMacro, vtkErrorMacro, vtkWarningMacro, requiredParam } = macro;
const { toHalf } = HalfFloat;

// ----------------------------------------------------------------------------
// vtkOpenGLTexture methods
// ----------------------------------------------------------------------------

function vtkOpenGLTexture(publicAPI, model) {
  // Set our className
  model.classHierarchy.push('vtkOpenGLTexture');

  function getTexParams() {
    return {
      internalFormat: model.internalFormat,
      format: model.format,
      openGLDataType: model.openGLDataType,
      width: model.width,
      height: model.height,
    };
  }

  // Renders myself
  publicAPI.render = (renWin = null) => {
    if (renWin) {
      model._openGLRenderWindow = renWin;
    } else {
      model._openGLRenderer =
        publicAPI.getFirstAncestorOfType('vtkOpenGLRenderer');
      // sync renderable properties
      model._openGLRenderWindow = model._openGLRenderer.getLastAncestorOfType(
        'vtkOpenGLRenderWindow'
      );
    }
    model.context = model._openGLRenderWindow.getContext();
    if (model.renderable.getInterpolate()) {
      if (model.generateMipmap) {
        publicAPI.setMinificationFilter(Filter.LINEAR_MIPMAP_LINEAR);
      } else {
        publicAPI.setMinificationFilter(Filter.LINEAR);
      }
      publicAPI.setMagnificationFilter(Filter.LINEAR);
    } else {
      publicAPI.setMinificationFilter(Filter.NEAREST);
      publicAPI.setMagnificationFilter(Filter.NEAREST);
    }
    if (model.renderable.getRepeat()) {
      publicAPI.setWrapR(Wrap.REPEAT);
      publicAPI.setWrapS(Wrap.REPEAT);
      publicAPI.setWrapT(Wrap.REPEAT);
    }
    // clear image if input data is set
    if (model.renderable.getInputData()) {
      model.renderable.setImage(null);
    }
    // create the texture if it is not done already
    if (
      !model.handle ||
      model.renderable.getMTime() > model.textureBuildTime.getMTime()
    ) {
      if (model.renderable.getImageBitmap() !== null) {
        if (model.renderable.getInterpolate()) {
          model.generateMipmap = true;
          publicAPI.setMinificationFilter(Filter.LINEAR_MIPMAP_LINEAR);
        }
        // Have an Image which may not be complete
        if (
          model.renderable.getImageBitmap() &&
          model.renderable.getImageLoaded()
        ) {
          publicAPI.create2DFromImageBitmap(model.renderable.getImageBitmap());
          publicAPI.activate();
          publicAPI.sendParameters();
          model.textureBuildTime.modified();
        }
      }
      // if we have an Image
      if (model.renderable.getImage() !== null) {
        if (model.renderable.getInterpolate()) {
          model.generateMipmap = true;
          publicAPI.setMinificationFilter(Filter.LINEAR_MIPMAP_LINEAR);
        }
        // Have an Image which may not be complete
        if (model.renderable.getImage() && model.renderable.getImageLoaded()) {
          publicAPI.create2DFromImage(model.renderable.getImage());
          publicAPI.activate();
          publicAPI.sendParameters();
          model.textureBuildTime.modified();
        }
      }
      // if we have a canvas
      if (model.renderable.getCanvas() !== null) {
        if (model.renderable.getInterpolate()) {
          model.generateMipmap = true;
          publicAPI.setMinificationFilter(Filter.LINEAR_MIPMAP_LINEAR);
        }
        const canvas = model.renderable.getCanvas();
        publicAPI.create2DFromRaw({
          width: canvas.width,
          height: canvas.height,
          numComps: 4,
          dataType: VtkDataTypes.UNSIGNED_CHAR,
          data: canvas,
          flip: true,
        });
        publicAPI.activate();
        publicAPI.sendParameters();
        model.textureBuildTime.modified();
      }
      // if we have jsImageData
      if (model.renderable.getJsImageData() !== null) {
        const jsid = model.renderable.getJsImageData();
        if (model.renderable.getInterpolate()) {
          model.generateMipmap = true;
          publicAPI.setMinificationFilter(Filter.LINEAR_MIPMAP_LINEAR);
        }
        publicAPI.create2DFromRaw({
          width: jsid.width,
          height: jsid.height,
          numComps: 4,
          dataType: VtkDataTypes.UNSIGNED_CHAR,
          data: jsid.data,
          flip: true,
        });
        publicAPI.activate();
        publicAPI.sendParameters();
        model.textureBuildTime.modified();
      }
      // if we have InputData
      const input = model.renderable.getInputData(0);
      if (input && input.getPointData().getScalars()) {
        const ext = input.getExtent();
        const inScalars = input.getPointData().getScalars();

        // do we have a cube map? Six inputs
        const data = [];
        for (let i = 0; i < model.renderable.getNumberOfInputPorts(); ++i) {
          const indata = model.renderable.getInputData(i);
          const scalars = indata
            ? indata.getPointData().getScalars().getData()
            : null;
          if (scalars) {
            data.push(scalars);
          }
        }
        if (
          model.renderable.getInterpolate() &&
          inScalars.getNumberOfComponents() === 4
        ) {
          model.generateMipmap = true;
          publicAPI.setMinificationFilter(Filter.LINEAR_MIPMAP_LINEAR);
        }
        if (data.length % 6 === 0) {
          publicAPI.createCubeFromRaw({
            width: ext[1] - ext[0] + 1,
            height: ext[3] - ext[2] + 1,
            numComps: inScalars.getNumberOfComponents(),
            dataType: inScalars.getDataType(),
            data,
          });
        } else {
          publicAPI.create2DFromRaw({
            width: ext[1] - ext[0] + 1,
            height: ext[3] - ext[2] + 1,
            numComps: inScalars.getNumberOfComponents(),
            dataType: inScalars.getDataType(),
            data: inScalars.getData(),
          });
        }
        publicAPI.activate();
        publicAPI.sendParameters();
        model.textureBuildTime.modified();
      }
    }
    if (model.handle) {
      publicAPI.activate();
    }
  };

  const getNorm16Ext = () => {
    if (
      (model.minificationFilter === Filter.LINEAR ||
        model.magnificationFilter === Filter.LINEAR) &&
      !supportsNorm16Linear()
    ) {
      return undefined;
    }
    return model.oglNorm16Ext;
  };

  //----------------------------------------------------------------------------
  publicAPI.destroyTexture = () => {
    // deactivate it first
    publicAPI.deactivate();

    if (model.context && model.handle) {
      model.context.deleteTexture(model.handle);
    }
    model._prevTexParams = null;
    model.handle = 0;
    model.numberOfDimensions = 0;
    model.target = 0;
    model.components = 0;
    model.width = 0;
    model.height = 0;
    model.depth = 0;
    publicAPI.resetFormatAndType();
  };

  //----------------------------------------------------------------------------
  publicAPI.createTexture = () => {
    // reuse the existing handle if we have one
    if (!model.handle) {
      model.handle = model.context.createTexture();

      if (model.target) {
        model.context.bindTexture(model.target, model.handle);

        // See: http://www.openmodel.context..org/wiki/Common_Mistakes#Creating_a_complete_texture
        // turn off mip map filter or set the base and max level correctly. here
        // both are done.
        model.context.texParameteri(
          model.target,
          model.context.TEXTURE_MIN_FILTER,
          publicAPI.getOpenGLFilterMode(model.minificationFilter)
        );
        model.context.texParameteri(
          model.target,
          model.context.TEXTURE_MAG_FILTER,
          publicAPI.getOpenGLFilterMode(model.magnificationFilter)
        );

        model.context.texParameteri(
          model.target,
          model.context.TEXTURE_WRAP_S,
          publicAPI.getOpenGLWrapMode(model.wrapS)
        );
        model.context.texParameteri(
          model.target,
          model.context.TEXTURE_WRAP_T,
          publicAPI.getOpenGLWrapMode(model.wrapT)
        );
        if (model._openGLRenderWindow.getWebgl2()) {
          model.context.texParameteri(
            model.target,
            model.context.TEXTURE_WRAP_R,
            publicAPI.getOpenGLWrapMode(model.wrapR)
          );
        }

        model.context.bindTexture(model.target, null);
      }
    }
  };

  //---------------------------------------------------------------------------
  publicAPI.getTextureUnit = () => {
    if (model._openGLRenderWindow) {
      return model._openGLRenderWindow.getTextureUnitForTexture(publicAPI);
    }
    return -1;
  };

  //---------------------------------------------------------------------------
  publicAPI.activate = () => {
    // activate a free texture unit for this texture
    model._openGLRenderWindow.activateTexture(publicAPI);
    publicAPI.bind();
  };

  //---------------------------------------------------------------------------
  publicAPI.deactivate = () => {
    if (model._openGLRenderWindow) {
      model._openGLRenderWindow.deactivateTexture(publicAPI);
    }
  };

  //---------------------------------------------------------------------------
  publicAPI.releaseGraphicsResources = (rwin) => {
    if (rwin && model.handle) {
      rwin.activateTexture(publicAPI);
      rwin.deactivateTexture(publicAPI);
      model.context.deleteTexture(model.handle);
      model._prevTexParams = null;
      model.handle = 0;
      model.numberOfDimensions = 0;
      model.target = 0;
      model.internalFormat = 0;
      model.format = 0;
      model.openGLDataType = 0;
      model.components = 0;
      model.width = 0;
      model.height = 0;
      model.depth = 0;
      model.allocatedGPUMemoryInBytes = 0;
    }
    if (model.shaderProgram) {
      model.shaderProgram.releaseGraphicsResources(rwin);
      model.shaderProgram = null;
    }
  };

  //----------------------------------------------------------------------------
  publicAPI.bind = () => {
    model.context.bindTexture(model.target, model.handle);
    if (
      model.autoParameters &&
      publicAPI.getMTime() > model.sendParametersTime.getMTime()
    ) {
      publicAPI.sendParameters();
    }
  };

  //----------------------------------------------------------------------------
  publicAPI.isBound = () => {
    let result = false;
    if (model.context && model.handle) {
      let target = 0;
      switch (model.target) {
        case model.context.TEXTURE_2D:
          target = model.context.TEXTURE_BINDING_2D;
          break;
        default:
          vtkWarningMacro('impossible case');
          break;
      }
      const oid = model.context.getIntegerv(target);
      result = oid === model.handle;
    }
    return result;
  };

  //----------------------------------------------------------------------------
  publicAPI.sendParameters = () => {
    model.context.texParameteri(
      model.target,
      model.context.TEXTURE_WRAP_S,
      publicAPI.getOpenGLWrapMode(model.wrapS)
    );
    model.context.texParameteri(
      model.target,
      model.context.TEXTURE_WRAP_T,
      publicAPI.getOpenGLWrapMode(model.wrapT)
    );
    if (model._openGLRenderWindow.getWebgl2()) {
      model.context.texParameteri(
        model.target,
        model.context.TEXTURE_WRAP_R,
        publicAPI.getOpenGLWrapMode(model.wrapR)
      );
    }

    model.context.texParameteri(
      model.target,
      model.context.TEXTURE_MIN_FILTER,
      publicAPI.getOpenGLFilterMode(model.minificationFilter)
    );

    model.context.texParameteri(
      model.target,
      model.context.TEXTURE_MAG_FILTER,
      publicAPI.getOpenGLFilterMode(model.magnificationFilter)
    );

    if (model._openGLRenderWindow.getWebgl2()) {
      model.context.texParameteri(
        model.target,
        model.context.TEXTURE_BASE_LEVEL,
        model.baseLevel
      );

      model.context.texParameteri(
        model.target,
        model.context.TEXTURE_MAX_LEVEL,
        model.maxLevel
      );
    }

    // model.context.texParameterf(model.target, model.context.TEXTURE_MIN_LOD, model.minLOD);
    // model.context.texParameterf(model.target, model.context.TEXTURE_MAX_LOD, model.maxLOD);

    model.sendParametersTime.modified();
  };

  //----------------------------------------------------------------------------
  publicAPI.getInternalFormat = (vtktype, numComps) => {
    if (!model._forceInternalFormat) {
      model.internalFormat = publicAPI.getDefaultInternalFormat(
        vtktype,
        numComps
      );
    }

    if (!model.internalFormat) {
      vtkDebugMacro(
        `Unable to find suitable internal format for T=${vtktype} NC= ${numComps}`
      );
    }

    if (
      [
        model.context.R32F,
        model.context.RG32F,
        model.context.RGB32F,
        model.context.RGBA32F,
      ].includes(model.internalFormat) &&
      !model.context.getExtension('OES_texture_float_linear')
    ) {
      vtkWarningMacro(
        'Failed to load OES_texture_float_linear. Texture filtering is not available for *32F internal formats.'
      );
    }

    return model.internalFormat;
  };

  //----------------------------------------------------------------------------
  publicAPI.getDefaultInternalFormat = (vtktype, numComps) => {
    let result = 0;
    // try default next
    result = model._openGLRenderWindow.getDefaultTextureInternalFormat(
      vtktype,
      numComps,
      getNorm16Ext(),
      publicAPI.useHalfFloat()
    );
    if (result) {
      return result;
    }

    if (!result) {
      vtkDebugMacro('Unsupported internal texture type!');
      vtkDebugMacro(
        `Unable to find suitable internal format for T=${vtktype} NC= ${numComps}`
      );
    }

    return result;
  };

  publicAPI.useHalfFloat = () =>
    model.enableUseHalfFloat && model.canUseHalfFloat;

  //----------------------------------------------------------------------------
  publicAPI.setInternalFormat = (iFormat) => {
    model._forceInternalFormat = true;
    if (iFormat !== model.internalFormat) {
      model.internalFormat = iFormat;
      publicAPI.modified();
    }
  };

  //----------------------------------------------------------------------------
  publicAPI.getFormat = (vtktype, numComps) => {
    model.format = publicAPI.getDefaultFormat(vtktype, numComps);
    return model.format;
  };

  //----------------------------------------------------------------------------
  publicAPI.getDefaultFormat = (vtktype, numComps) => {
    if (model._openGLRenderWindow.getWebgl2()) {
      switch (numComps) {
        case 1:
          return model.context.RED;
        case 2:
          return model.context.RG;
        case 3:
          return model.context.RGB;
        case 4:
          return model.context.RGBA;
        default:
          return model.context.RGB;
      }
    } else {
      // webgl1
      switch (numComps) {
        case 1:
          return model.context.LUMINANCE;
        case 2:
          return model.context.LUMINANCE_ALPHA;
        case 3:
          return model.context.RGB;
        case 4:
          return model.context.RGBA;
        default:
          return model.context.RGB;
      }
    }
  };

  //----------------------------------------------------------------------------
  publicAPI.resetFormatAndType = () => {
    model._prevTexParams = null;
    model.format = 0;
    model.internalFormat = 0;
    model._forceInternalFormat = false;
    model.openGLDataType = 0;
  };

  //----------------------------------------------------------------------------
  publicAPI.getDefaultDataType = (vtkScalarType) => {
    const useHalfFloat = publicAPI.useHalfFloat();
    // DON'T DEAL with VTK_CHAR as this is platform dependent.
    if (model._openGLRenderWindow.getWebgl2()) {
      switch (vtkScalarType) {
        // case VtkDataTypes.SIGNED_CHAR:
        //   return model.context.BYTE;
        case VtkDataTypes.UNSIGNED_CHAR:
          return model.context.UNSIGNED_BYTE;
        // prefer norm16 since that is accurate compared to
        // half float which is not
        case getNorm16Ext() && !useHalfFloat && VtkDataTypes.SHORT:
          return model.context.SHORT;
        case getNorm16Ext() && !useHalfFloat && VtkDataTypes.UNSIGNED_SHORT:
          return model.context.UNSIGNED_SHORT;
        // use half float type
        case useHalfFloat && VtkDataTypes.SHORT:
          return model.context.HALF_FLOAT;
        case useHalfFloat && VtkDataTypes.UNSIGNED_SHORT:
          return model.context.HALF_FLOAT;
        // case VtkDataTypes.INT:
        //   return model.context.INT;
        // case VtkDataTypes.UNSIGNED_INT:
        //   return model.context.UNSIGNED_INT;
        case VtkDataTypes.FLOAT:
        case VtkDataTypes.VOID: // used for depth component textures.
        default:
          return model.context.FLOAT;
      }
    }

    switch (vtkScalarType) {
      // case VtkDataTypes.SIGNED_CHAR:
      //   return model.context.BYTE;
      case VtkDataTypes.UNSIGNED_CHAR:
        return model.context.UNSIGNED_BYTE;
      // case VtkDataTypes.SHORT:
      //   return model.context.SHORT;
      // case VtkDataTypes.UNSIGNED_SHORT:
      //   return model.context.UNSIGNED_SHORT;
      // case VtkDataTypes.INT:
      //   return model.context.INT;
      // case VtkDataTypes.UNSIGNED_INT:
      //   return model.context.UNSIGNED_INT;
      case VtkDataTypes.FLOAT:
      case VtkDataTypes.VOID: // used for depth component textures.
      default:
        if (
          model.context.getExtension('OES_texture_float') &&
          model.context.getExtension('OES_texture_float_linear')
        ) {
          return model.context.FLOAT;
        }
        {
          const halfFloat = model.context.getExtension(
            'OES_texture_half_float'
          );
          if (
            halfFloat &&
            model.context.getExtension('OES_texture_half_float_linear')
          ) {
            return halfFloat.HALF_FLOAT_OES;
          }
        }
        return model.context.UNSIGNED_BYTE;
    }
  };

  //----------------------------------------------------------------------------
  publicAPI.getOpenGLDataType = (vtkScalarType, forceUpdate = false) => {
    if (!model.openGLDataType || forceUpdate) {
      model.openGLDataType = publicAPI.getDefaultDataType(vtkScalarType);
    }
    return model.openGLDataType;
  };

  publicAPI.getShiftAndScale = () => {
    let shift = 0.0;
    let scale = 1.0;

    // for all float type internal formats
    switch (model.openGLDataType) {
      case model.context.BYTE:
        scale = 127.5;
        shift = scale - 128.0;
        break;
      case model.context.UNSIGNED_BYTE:
        scale = 255.0;
        shift = 0.0;
        break;
      case model.context.SHORT:
        scale = 32767.5;
        shift = scale - 32768.0;
        break;
      case model.context.UNSIGNED_SHORT:
        scale = 65536.0;
        shift = 0.0;
        break;
      case model.context.INT:
        scale = 2147483647.5;
        shift = scale - 2147483648.0;
        break;
      case model.context.UNSIGNED_INT:
        scale = 4294967295.0;
        shift = 0.0;
        break;
      case model.context.FLOAT:
      default:
        break;
    }
    return { shift, scale };
  };

  //----------------------------------------------------------------------------
  publicAPI.getOpenGLFilterMode = (emode) => {
    switch (emode) {
      case Filter.NEAREST:
        return model.context.NEAREST;
      case Filter.LINEAR:
        return model.context.LINEAR;
      case Filter.NEAREST_MIPMAP_NEAREST:
        return model.context.NEAREST_MIPMAP_NEAREST;
      case Filter.NEAREST_MIPMAP_LINEAR:
        return model.context.NEAREST_MIPMAP_LINEAR;
      case Filter.LINEAR_MIPMAP_NEAREST:
        return model.context.LINEAR_MIPMAP_NEAREST;
      case Filter.LINEAR_MIPMAP_LINEAR:
        return model.context.LINEAR_MIPMAP_LINEAR;
      default:
        return model.context.NEAREST;
    }
  };

  //----------------------------------------------------------------------------
  publicAPI.getOpenGLWrapMode = (vtktype) => {
    switch (vtktype) {
      case Wrap.CLAMP_TO_EDGE:
        return model.context.CLAMP_TO_EDGE;
      case Wrap.REPEAT:
        return model.context.REPEAT;
      case Wrap.MIRRORED_REPEAT:
        return model.context.MIRRORED_REPEAT;
      default:
        return model.context.CLAMP_TO_EDGE;
    }
  };

  //----------------------------------------------------------------------------

  /**
   * Gets the extent's size.
   * @param {Extent} extent
   */
  function getExtentSize(extent) {
    const [xmin, xmax, ymin, ymax, zmin, zmax] = extent;
    return [xmax - xmin + 1, ymax - ymin + 1, zmax - zmin + 1];
  }

  //----------------------------------------------------------------------------

  /**
   * Gets the number of pixels in the extent.
   * @param {Extent} extent
   */
  function getExtentPixelCount(extent) {
    const [sx, sy, sz] = getExtentSize(extent);
    return sx * sy * sz;
  }

  //----------------------------------------------------------------------------

  /**
   * Reads a flattened extent from the image data and writes to the given output array.
   *
   * Assumes X varies the fastest and Z varies the slowest.
   *
   * @param {*} data
   * @param {*} dataDims
   * @param {Extent} extent
   * @param {TypedArray} outArray
   * @param {number} outOffset
   * @returns
   */
  function readExtentIntoArray(data, dataDims, extent, outArray, outOffset) {
    const [xmin, xmax, ymin, ymax, zmin, zmax] = extent;
    const [dx, dy] = dataDims;
    const sxy = dx * dy;

    let writeOffset = outOffset;
    for (let zi = zmin; zi <= zmax; zi++) {
      const zOffset = zi * sxy;
      for (let yi = ymin; yi <= ymax; yi++) {
        const zyOffset = zOffset + yi * dx;
        // explicit alternative to data.subarray,
        // due to potential perf issues on v8
        for (
          let readOffset = zyOffset + xmin, end = zyOffset + xmax;
          readOffset <= end;
          readOffset++, writeOffset++
        ) {
          outArray[writeOffset] = data[readOffset];
        }
      }
    }
  }

  //----------------------------------------------------------------------------

  /**
   * Reads several image extents into a contiguous pixel array.
   *
   * @param {*} data
   * @param {Extent[]} extent
   * @param {TypedArrayConstructor} typedArrayConstructor optional typed array constructor
   * @returns
   */
  function readExtents(data, extents, typedArrayConstructor = null) {
    const constructor = typedArrayConstructor || data.constructor;
    const numPixels = extents.reduce(
      (count, extent) => count + getExtentPixelCount(extent),
      0
    );
    const extentPixels = new constructor(numPixels);
    const dataDims = [model.width, model.height, model.depth];

    let writeOffset = 0;
    extents.forEach((extent) => {
      readExtentIntoArray(data, dataDims, extent, extentPixels, writeOffset);
      writeOffset += getExtentPixelCount(extent);
    });

    return extentPixels;
  }

  //----------------------------------------------------------------------------

  /**
   * Updates the data array to match the required data type for OpenGL.
   *
   * This function takes the input data and converts it to the appropriate
   * format required by the OpenGL texture, based on the specified data type.
   *
   * @param {string} dataType - The original data type of the input data.
   * @param {Array} data - The input data array that needs to be updated.
   * @param {boolean} [depth=false] - Indicates whether the data is a 3D array.
   * @param {Array<Extent>} imageExtents only consider these image extents (default: [])
   * @returns {Array} The updated data array that matches the OpenGL data type.
   */
  publicAPI.updateArrayDataTypeForGL = (
    dataType,
    data,
    depth = false,
    imageExtents = []
  ) => {
    const pixData = [];
    let pixCount = model.width * model.height * model.components;
    if (depth) {
      pixCount *= model.depth;
    }

    const onlyUpdateExtents = !!imageExtents.length;

    // if the opengl data type is float
    // then the data array must be float
    if (
      dataType !== VtkDataTypes.FLOAT &&
      model.openGLDataType === model.context.FLOAT
    ) {
      for (let idx = 0; idx < data.length; idx++) {
        if (data[idx]) {
          if (onlyUpdateExtents) {
            pixData.push(readExtents(data[idx], imageExtents, Float32Array));
          } else {
            const dataArrayToCopy =
              data[idx].length > pixCount
                ? data[idx].subarray(0, pixCount)
                : data[idx];
            pixData.push(new Float32Array(dataArrayToCopy));
          }
        } else {
          pixData.push(null);
        }
      }
    }

    // if the opengl data type is ubyte
    // then the data array must be u8, we currently simply truncate the data
    if (
      dataType !== VtkDataTypes.UNSIGNED_CHAR &&
      model.openGLDataType === model.context.UNSIGNED_BYTE
    ) {
      for (let idx = 0; idx < data.length; idx++) {
        if (data[idx]) {
          if (onlyUpdateExtents) {
            pixData.push(readExtents(data[idx], imageExtents, Uint8Array));
          } else {
            const dataArrayToCopy =
              data[idx].length > pixCount
                ? data[idx].subarray(0, pixCount)
                : data[idx];
            pixData.push(new Uint8Array(dataArrayToCopy));
          }
        } else {
          pixData.push(null);
        }
      }
    }

    // if the opengl data type is half float
    // then the data array must be u16
    let halfFloat = false;
    if (model._openGLRenderWindow.getWebgl2()) {
      halfFloat = model.openGLDataType === model.context.HALF_FLOAT;
    } else {
      const halfFloatExt = model.context.getExtension('OES_texture_half_float');
      halfFloat =
        halfFloatExt && model.openGLDataType === halfFloatExt.HALF_FLOAT_OES;
    }

    if (halfFloat) {
      for (let idx = 0; idx < data.length; idx++) {
        if (data[idx]) {
          const src = onlyUpdateExtents
            ? readExtents(data[idx], imageExtents)
            : data[idx];
          const newArray = new Uint16Array(
            onlyUpdateExtents ? src.length : pixCount
          );
          const newArrayLen = newArray.length;
          for (let i = 0; i < newArrayLen; i++) {
            newArray[i] = toHalf(src[i]);
          }
          pixData.push(newArray);
        } else {
          pixData.push(null);
        }
      }
    }

    // The output has to be filled
    if (pixData.length === 0) {
      for (let i = 0; i < data.length; i++) {
        pixData.push(
          onlyUpdateExtents && data[i]
            ? readExtents(data[i], imageExtents)
            : data[i]
        );
      }
    }

    return pixData;
  };

  //----------------------------------------------------------------------------
  function scaleTextureToHighestPowerOfTwo(data) {
    if (model._openGLRenderWindow.getWebgl2()) {
      // No need if webGL2
      return data;
    }
    const pixData = [];
    const width = model.width;
    const height = model.height;
    const numComps = model.components;
    if (
      data &&
      (!vtkMath.isPowerOfTwo(width) || !vtkMath.isPowerOfTwo(height))
    ) {
      // Scale up the texture to the next highest power of two dimensions.
      const halfFloat = model.context.getExtension('OES_texture_half_float');
      const newWidth = vtkMath.nearestPowerOfTwo(width);
      const newHeight = vtkMath.nearestPowerOfTwo(height);
      const pixCount = newWidth * newHeight * model.components;
      for (let idx = 0; idx < data.length; idx++) {
        if (data[idx] !== null) {
          let newArray = null;
          const jFactor = height / newHeight;
          const iFactor = width / newWidth;
          let usingHalf = false;
          if (model.openGLDataType === model.context.FLOAT) {
            newArray = new Float32Array(pixCount);
          } else if (
            halfFloat &&
            model.openGLDataType === halfFloat.HALF_FLOAT_OES
          ) {
            newArray = new Uint16Array(pixCount);
            usingHalf = true;
          } else {
            newArray = new Uint8Array(pixCount);
          }
          for (let j = 0; j < newHeight; j++) {
            const joff = j * newWidth * numComps;
            const jidx = j * jFactor;
            let jlow = Math.floor(jidx);
            let jhi = Math.ceil(jidx);
            if (jhi >= height) {
              jhi = height - 1;
            }
            const jmix = jidx - jlow;
            const jmix1 = 1.0 - jmix;
            jlow = jlow * width * numComps;
            jhi = jhi * width * numComps;
            for (let i = 0; i < newWidth; i++) {
              const ioff = i * numComps;
              const iidx = i * iFactor;
              let ilow = Math.floor(iidx);
              let ihi = Math.ceil(iidx);
              if (ihi >= width) {
                ihi = width - 1;
              }
              const imix = iidx - ilow;
              ilow *= numComps;
              ihi *= numComps;
              for (let c = 0; c < numComps; c++) {
                if (usingHalf) {
                  newArray[joff + ioff + c] = HalfFloat.toHalf(
                    HalfFloat.fromHalf(data[idx][jlow + ilow + c]) *
                      jmix1 *
                      (1.0 - imix) +
                      HalfFloat.fromHalf(data[idx][jlow + ihi + c]) *
                        jmix1 *
                        imix +
                      HalfFloat.fromHalf(data[idx][jhi + ilow + c]) *
                        jmix *
                        (1.0 - imix) +
                      HalfFloat.fromHalf(data[idx][jhi + ihi + c]) * jmix * imix
                  );
                } else {
                  newArray[joff + ioff + c] =
                    data[idx][jlow + ilow + c] * jmix1 * (1.0 - imix) +
                    data[idx][jlow + ihi + c] * jmix1 * imix +
                    data[idx][jhi + ilow + c] * jmix * (1.0 - imix) +
                    data[idx][jhi + ihi + c] * jmix * imix;
                }
              }
            }
          }
          pixData.push(newArray);
          model.width = newWidth;
          model.height = newHeight;
        } else {
          pixData.push(null);
        }
      }
    }

    // The output has to be filled
    if (pixData.length === 0) {
      for (let i = 0; i < data.length; i++) {
        pixData.push(data[i]);
      }
    }

    return pixData;
  }

  //----------------------------------------------------------------------------
  function useTexStorage(dataType) {
    if (model._openGLRenderWindow) {
      if (model.resizable || model.renderable?.getResizable()) {
        // Cannot use texStorage if the texture is supposed to be resizable.
        return false;
      }
      if (model._openGLRenderWindow.getWebgl2()) {
        const webGLInfo = model._openGLRenderWindow.getGLInformations();
        if (
          webGLInfo.RENDERER.value.match(/WebKit/gi) &&
          navigator.platform.match(/Mac/gi) &&
          getNorm16Ext() &&
          (dataType === VtkDataTypes.UNSIGNED_SHORT ||
            dataType === VtkDataTypes.SHORT)
        ) {
          // Cannot use texStorage with EXT_texture_norm16 textures on Mac M1 GPU.
          // No errors reported but the texture is unusable.
          return false;
        }
        // Use texStorage for WebGL2
        return true;
      }
      return false;
    }
    return false;
  }

  //----------------------------------------------------------------------------

  publicAPI.create2DFromRaw = ({
    width = requiredParam('width'),
    height = requiredParam('height'),
    numComps = requiredParam('numComps'),
    dataType = requiredParam('dataType'),
    data = requiredParam('data'),
    flip = false,
  } = {}) => {
    // Now determine the texture parameters using the arguments.
    publicAPI.getOpenGLDataType(dataType, true);
    publicAPI.getInternalFormat(dataType, numComps);
    publicAPI.getFormat(dataType, numComps);

    if (!model.internalFormat || !model.format || !model.openGLDataType) {
      vtkErrorMacro('Failed to determine texture parameters.');
      return false;
    }

    model.target = model.context.TEXTURE_2D;
    model.components = numComps;
    model.width = width;
    model.height = height;
    model.depth = 1;
    model.numberOfDimensions = 2;
    model._openGLRenderWindow.activateTexture(publicAPI);
    publicAPI.createTexture();
    publicAPI.bind();

    // Create an array of texture with one texture
    const dataArray = [data];
    const pixData = publicAPI.updateArrayDataTypeForGL(dataType, dataArray);
    const scaledData = scaleTextureToHighestPowerOfTwo(pixData);

    // Source texture data from the PBO.
    model.context.pixelStorei(model.context.UNPACK_FLIP_Y_WEBGL, flip);
    model.context.pixelStorei(model.context.UNPACK_ALIGNMENT, 1);

    if (useTexStorage(dataType)) {
      model.context.texStorage2D(
        model.target,
        1,
        model.internalFormat,
        model.width,
        model.height
      );
      if (scaledData[0] != null) {
        model.context.texSubImage2D(
          model.target,
          0,
          0,
          0,
          model.width,
          model.height,
          model.format,
          model.openGLDataType,
          scaledData[0]
        );
      }
    } else {
      model.context.texImage2D(
        model.target,
        0,
        model.internalFormat,
        model.width,
        model.height,
        0,
        model.format,
        model.openGLDataType,
        scaledData[0]
      );
    }

    if (model.generateMipmap) {
      model.context.generateMipmap(model.target);
    }

    // always reset the flip
    if (flip) {
      model.context.pixelStorei(model.context.UNPACK_FLIP_Y_WEBGL, false);
    }

    model.allocatedGPUMemoryInBytes =
      model.width *
      model.height *
      model.depth *
      numComps *
      model._openGLRenderWindow.getDefaultTextureByteSize(
        dataType,
        getNorm16Ext(),
        publicAPI.useHalfFloat()
      );
    publicAPI.deactivate();
    return true;
  };

  //----------------------------------------------------------------------------
  publicAPI.createCubeFromRaw = ({
    width = requiredParam('width'),
    height = requiredParam('height'),
    numComps = requiredParam('numComps'),
    dataType = requiredParam('dataType'),
    data = requiredParam('data'),
  } = {}) => {
    // Now determine the texture parameters using the arguments.
    publicAPI.getOpenGLDataType(dataType);
    publicAPI.getInternalFormat(dataType, numComps);
    publicAPI.getFormat(dataType, numComps);

    if (!model.internalFormat || !model.format || !model.openGLDataType) {
      vtkErrorMacro('Failed to determine texture parameters.');
      return false;
    }

    model.target = model.context.TEXTURE_CUBE_MAP;
    model.components = numComps;
    model.width = width;
    model.height = height;
    model.depth = 1;
    model.numberOfDimensions = 2;
    model._openGLRenderWindow.activateTexture(publicAPI);
    model.maxLevel = data.length / 6 - 1;
    publicAPI.createTexture();
    publicAPI.bind();

    const pixData = publicAPI.updateArrayDataTypeForGL(dataType, data);
    const scaledData = scaleTextureToHighestPowerOfTwo(pixData);

    // invert the data because opengl is messed up with cube maps
    // and uses the old renderman standard with Y going down
    // even though it is completely at odds with OpenGL standards
    const invertedData = [];
    let widthLevel = model.width;
    let heightLevel = model.height;
    for (let i = 0; i < scaledData.length; i++) {
      if (i % 6 === 0 && i !== 0) {
        widthLevel /= 2;
        heightLevel /= 2;
      }
      invertedData[i] = macro.newTypedArray(
        dataType,
        heightLevel * widthLevel * model.components
      );
      for (let y = 0; y < heightLevel; ++y) {
        const row1 = y * widthLevel * model.components;
        const row2 = (heightLevel - y - 1) * widthLevel * model.components;
        invertedData[i].set(
          scaledData[i].slice(row2, row2 + widthLevel * model.components),
          row1
        );
      }
    }

    // Source texture data from the PBO.
    model.context.pixelStorei(model.context.UNPACK_ALIGNMENT, 1);

    if (useTexStorage(dataType)) {
      model.context.texStorage2D(
        model.target,
        6,
        model.internalFormat,
        model.width,
        model.height
      );
    }
    // We get the 6 images
    for (let i = 0; i < 6; i++) {
      // For each mipmap level
      let j = 0;
      let w = model.width;
      let h = model.height;
      while (w >= 1 && h >= 1) {
        // In webgl 1, all levels need to be defined. So if the latest level size is
        // 8x8, we have to add 3 more null textures (4x4, 2x2, 1x1)
        // In webgl 2, the attribute maxLevel will be use.
        let tempData = null;
        if (j <= model.maxLevel) {
          tempData = invertedData[6 * j + i];
        }
        if (useTexStorage(dataType)) {
          if (tempData != null) {
            model.context.texSubImage2D(
              model.context.TEXTURE_CUBE_MAP_POSITIVE_X + i,
              j,
              0,
              0,
              w,
              h,
              model.format,
              model.openGLDataType,
              tempData
            );
          }
        } else {
          model.context.texImage2D(
            model.context.TEXTURE_CUBE_MAP_POSITIVE_X + i,
            j,
            model.internalFormat,
            w,
            h,
            0,
            model.format,
            model.openGLDataType,
            tempData
          );
        }
        j++;
        w /= 2;
        h /= 2;
      }
    }

    model.allocatedGPUMemoryInBytes =
      model.width *
      model.height *
      model.depth *
      numComps *
      model._openGLRenderWindow.getDefaultTextureByteSize(
        dataType,
        getNorm16Ext(),
        publicAPI.useHalfFloat()
      );
    // generateMipmap must not be called here because we manually upload all levels
    // if it is called, all levels will be overwritten

    publicAPI.deactivate();
    return true;
  };

  //----------------------------------------------------------------------------
  publicAPI.createDepthFromRaw = ({
    width = requiredParam('width'),
    height = requiredParam('height'),
    dataType = requiredParam('dataType'),
    data = requiredParam('data'),
  } = {}) => {
    // Now determine the texture parameters using the arguments.
    publicAPI.getOpenGLDataType(dataType);
    model.format = model.context.DEPTH_COMPONENT;
    if (model._openGLRenderWindow.getWebgl2()) {
      if (dataType === VtkDataTypes.FLOAT) {
        model.internalFormat = model.context.DEPTH_COMPONENT32F;
      } else {
        model.internalFormat = model.context.DEPTH_COMPONENT16;
      }
    } else {
      model.internalFormat = model.context.DEPTH_COMPONENT;
    }

    if (!model.internalFormat || !model.format || !model.openGLDataType) {
      vtkErrorMacro('Failed to determine texture parameters.');
      return false;
    }

    model.target = model.context.TEXTURE_2D;
    model.components = 1;
    model.width = width;
    model.height = height;
    model.depth = 1;
    model.numberOfDimensions = 2;
    model._openGLRenderWindow.activateTexture(publicAPI);
    publicAPI.createTexture();
    publicAPI.bind();

    // Source texture data from the PBO.
    // model.context.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);
    model.context.pixelStorei(model.context.UNPACK_ALIGNMENT, 1);

    if (useTexStorage(dataType)) {
      model.context.texStorage2D(
        model.target,
        1,
        model.internalFormat,
        model.width,
        model.height
      );
      if (data != null) {
        model.context.texSubImage2D(
          model.target,
          0,
          0,
          0,
          model.width,
          model.height,
          model.format,
          model.openGLDataType,
          data
        );
      }
    } else {
      model.context.texImage2D(
        model.target,
        0,
        model.internalFormat,
        model.width,
        model.height,
        0,
        model.format,
        model.openGLDataType,
        data
      );
    }
    if (model.generateMipmap) {
      model.context.generateMipmap(model.target);
    }

    model.allocatedGPUMemoryInBytes =
      model.width *
      model.height *
      model.depth *
      model.components *
      model._openGLRenderWindow.getDefaultTextureByteSize(
        dataType,
        getNorm16Ext(),
        publicAPI.useHalfFloat()
      );

    publicAPI.deactivate();
    return true;
  };

  //----------------------------------------------------------------------------
  publicAPI.create2DFromImage = (image) => {
    // Determine the texture parameters using the arguments.
    publicAPI.getOpenGLDataType(VtkDataTypes.UNSIGNED_CHAR);
    publicAPI.getInternalFormat(VtkDataTypes.UNSIGNED_CHAR, 4);
    publicAPI.getFormat(VtkDataTypes.UNSIGNED_CHAR, 4);

    if (!model.internalFormat || !model.format || !model.openGLDataType) {
      vtkErrorMacro('Failed to determine texture parameters.');
      return false;
    }

    model.target = model.context.TEXTURE_2D;
    model.components = 4;
    model.depth = 1;
    model.numberOfDimensions = 2;
    model._openGLRenderWindow.activateTexture(publicAPI);
    publicAPI.createTexture();
    publicAPI.bind();

    const needNearestPowerOfTwo =
      !model._openGLRenderWindow.getWebgl2() &&
      (!vtkMath.isPowerOfTwo(image.width) ||
        !vtkMath.isPowerOfTwo(image.height));

    let textureSource = image;
    let targetWidth = image.width;
    let targetHeight = image.height;

    let flipY = true;

    // For WebGL1, we need to scale the image to the nearest power of two
    // dimensions if the image is not already a power of two. For WebGL2, we can
    // use the image as is. Note: Chrome has a perf issue where the path
    // HTMLImageElement -> Canvas -> texSubImage2D is faster than
    // HTMLImageElement -> texSubImage2D directly. See
    // https://issues.chromium.org/issues/41311312#comment7
    // Tested on Chrome 137.0.7151.104 Windows 11
    const isChrome = window.chrome;

    if (needNearestPowerOfTwo || isChrome) {
      const canvas = new OffscreenCanvas(
        vtkMath.nearestPowerOfTwo(image.width),
        vtkMath.nearestPowerOfTwo(image.height)
      );
      targetWidth = canvas.width;
      targetHeight = canvas.height;

      const ctx = canvas.getContext('2d');
      ctx.translate(0, canvas.height);
      ctx.scale(1, -1);
      ctx.drawImage(
        image,
        0,
        0,
        image.width,
        image.height,
        0,
        0,
        canvas.width,
        canvas.height
      );
      textureSource = canvas;
      flipY = false; // we are flipping the image manually using translate/scale
    }

    model.width = targetWidth;
    model.height = targetHeight;

    // Source texture data from the PBO.
    model.context.pixelStorei(model.context.UNPACK_FLIP_Y_WEBGL, flipY);
    model.context.pixelStorei(model.context.UNPACK_ALIGNMENT, 1);

    if (useTexStorage(VtkDataTypes.UNSIGNED_CHAR)) {
      model.context.texStorage2D(
        model.target,
        1,
        model.internalFormat,
        model.width,
        model.height
      );
      model.context.texSubImage2D(
        model.target,
        0,
        0,
        0,
        model.width,
        model.height,
        model.format,
        model.openGLDataType,
        textureSource
      );
    } else {
      model.context.texImage2D(
        model.target,
        0,
        model.internalFormat,
        model.width,
        model.height,
        0,
        model.format,
        model.openGLDataType,
        textureSource
      );
    }

    if (model.generateMipmap) {
      model.context.generateMipmap(model.target);
    }

    model.allocatedGPUMemoryInBytes =
      model.width *
      model.height *
      model.depth *
      model.components *
      model._openGLRenderWindow.getDefaultTextureByteSize(
        VtkDataTypes.UNSIGNED_CHAR,
        getNorm16Ext(),
        publicAPI.useHalfFloat()
      );

    publicAPI.deactivate();
    return true;
  };

  //----------------------------------------------------------------------------
  publicAPI.create2DFromImageBitmap = (imageBitmap) => {
    // Determine the texture parameters.
    publicAPI.getOpenGLDataType(VtkDataTypes.UNSIGNED_CHAR);
    publicAPI.getInternalFormat(VtkDataTypes.UNSIGNED_CHAR, 4);
    publicAPI.getFormat(VtkDataTypes.UNSIGNED_CHAR, 4);

    if (!model.internalFormat || !model.format || !model.openGLDataType) {
      vtkErrorMacro('Failed to determine texture parameters.');
      return false;
    }

    model.target = model.context.TEXTURE_2D;
    model.components = 4;
    model.depth = 1;
    model.numberOfDimensions = 2;
    model._openGLRenderWindow.activateTexture(publicAPI);
    publicAPI.createTexture();
    publicAPI.bind();

    // Prepare texture unpack alignment
    model.context.pixelStorei(model.context.UNPACK_ALIGNMENT, 1);

    model.width = imageBitmap.width;
    model.height = imageBitmap.height;

    if (useTexStorage(VtkDataTypes.UNSIGNED_CHAR)) {
      model.context.texStorage2D(
        model.target,
        1,
        model.internalFormat,
        model.width,
        model.height
      );
      model.context.texSubImage2D(
        model.target,
        0,
        0,
        0,
        model.width,
        model.height,
        model.format,
        model.openGLDataType,
        imageBitmap
      );
    } else {
      model.context.texImage2D(
        model.target,
        0,
        model.internalFormat,
        model.width,
        model.height,
        0,
        model.format,
        model.openGLDataType,
        imageBitmap
      );
    }

    if (model.generateMipmap) {
      model.context.generateMipmap(model.target);
    }

    model.allocatedGPUMemoryInBytes =
      model.width *
      model.height *
      model.depth *
      model.components *
      model._openGLRenderWindow.getDefaultTextureByteSize(
        VtkDataTypes.UNSIGNED_CHAR,
        getNorm16Ext(),
        publicAPI.useHalfFloat()
      );

    publicAPI.deactivate();
    return true;
  };

  // Compute scale and offset per component from min and max per component
  function computeScaleOffsets(min, max, numComps) {
    const offset = new Array(numComps);
    const scale = new Array(numComps);
    for (let c = 0; c < numComps; ++c) {
      offset[c] = min[c];
      scale[c] = max[c] - min[c] || 1.0;
    }
    return { scale, offset };
  }

  // HalfFloat only represents numbers between [-2048, 2048] exactly accurate,
  // for numbers outside of this range there is a precision limitation
  function hasExactHalfFloat(offset, scale) {
    // Per Component
    for (let c = 0; c < offset.length; c++) {
      const min = offset[c];
      const max = scale[c] + min;

      if (min < -2048 || min > 2048 || max < -2048 || max > 2048) {
        return false;
      }
    }
    return true;
  }

  function setCanUseHalfFloat(dataType, offset, scale, preferSizeOverAccuracy) {
    publicAPI.getOpenGLDataType(dataType);

    // Don't consider halfFloat and convert back to Float when the range of data does not generate an accurate halfFloat
    // AND it is not preferable to have a smaller texture than an exact texture.
    const isExactHalfFloat =
      hasExactHalfFloat(offset, scale) || preferSizeOverAccuracy;

    let useHalfFloat = false;
    if (model._openGLRenderWindow.getWebgl2()) {
      // If OES_texture_float_linear is not available, and using a half float would still be exact, force half floats
      // This is because half floats are always texture filterable in webgl2, while full *32F floats are not (unless the extension is present)
      const forceHalfFloat =
        model.openGLDataType === model.context.FLOAT &&
        model.context.getExtension('OES_texture_float_linear') === null &&
        isExactHalfFloat;
      useHalfFloat =
        forceHalfFloat || model.openGLDataType === model.context.HALF_FLOAT;
    } else {
      const halfFloatExt = model.context.getExtension('OES_texture_half_float');
      useHalfFloat =
        halfFloatExt && model.openGLDataType === halfFloatExt.HALF_FLOAT_OES;
    }

    model.canUseHalfFloat = useHalfFloat && isExactHalfFloat;
  }

  function processDataArray(dataArray, preferSizeOverAccuracy) {
    const numComps = dataArray.getNumberOfComponents();
    const dataType = dataArray.getDataType();
    const data = dataArray.getData();

    // Compute min max from array
    // Using the vtkDataArray.getRange() enables caching
    const minArray = new Array(numComps);
    const maxArray = new Array(numComps);
    for (let c = 0; c < numComps; ++c) {
      const [min, max] = dataArray.getRange(c);
      minArray[c] = min;
      maxArray[c] = max;
    }

    const scaleOffsets = computeScaleOffsets(minArray, maxArray, numComps);

    // preferSizeOverAccuracy will override norm16 due to bug with norm16 implementation
    // https://bugs.chromium.org/p/chromium/issues/detail?id=1408247
    setCanUseHalfFloat(
      dataType,
      scaleOffsets.offset,
      scaleOffsets.scale,
      preferSizeOverAccuracy
    );

    // since our default is to use half float, in case that we can't use it
    // we need to use another type
    if (!publicAPI.useHalfFloat()) {
      publicAPI.getOpenGLDataType(dataType, true);
    }

    return {
      numComps,
      dataType,
      data,
      scaleOffsets,
    };
  }

  publicAPI.create2DFilterableFromRaw = ({
    width = requiredParam('width'),
    height = requiredParam('height'),
    numComps = requiredParam('numComps'),
    dataType = requiredParam('dataType'),
    data = requiredParam('data'),
    preferSizeOverAccuracy = false,
    ranges = undefined,
  } = {}) =>
    publicAPI.create2DFilterableFromDataArray({
      width,
      height,
      dataArray: vtkDataArray.newInstance({
        numComps,
        dataType,
        values: data,
        ranges,
      }),
      preferSizeOverAccuracy,
    });

  publicAPI.create2DFilterableFromDataArray = ({
    width = requiredParam('width'),
    height = requiredParam('height'),
    dataArray = requiredParam('dataArray'),
    preferSizeOverAccuracy = false,
  } = {}) => {
    const { numComps, dataType, data } = processDataArray(
      dataArray,
      preferSizeOverAccuracy
    );

    publicAPI.create2DFromRaw({ width, height, numComps, dataType, data });
  };

  publicAPI.updateVolumeInfoForGL = (dataType, numComps) => {
    let isScalingApplied = false;
    const useHalfFloat = publicAPI.useHalfFloat();

    // Initialize volume info if it doesn't exist
    if (!model.volumeInfo?.scale || !model.volumeInfo?.offset) {
      model.volumeInfo = {
        scale: new Array(numComps),
        offset: new Array(numComps),
      };
    }

    // Default scaling and offset
    for (let c = 0; c < numComps; ++c) {
      model.volumeInfo.scale[c] = 1.0;
      model.volumeInfo.offset[c] = 0.0;
    }

    // Handle SHORT data type with EXT_texture_norm16 extension
    if (getNorm16Ext() && !useHalfFloat && dataType === VtkDataTypes.SHORT) {
      for (let c = 0; c < numComps; ++c) {
        model.volumeInfo.scale[c] = 32767.0; // Scale to [-1, 1] range
      }
      isScalingApplied = true;
    }

    // Handle UNSIGNED_SHORT data type with EXT_texture_norm16 extension
    if (
      getNorm16Ext() &&
      !useHalfFloat &&
      dataType === VtkDataTypes.UNSIGNED_SHORT
    ) {
      for (let c = 0; c < numComps; ++c) {
        model.volumeInfo.scale[c] = 65535.0; // Scale to [0, 1] range
      }
      isScalingApplied = true;
    }

    // Handle UNSIGNED_CHAR data type
    if (dataType === VtkDataTypes.UNSIGNED_CHAR) {
      for (let c = 0; c < numComps; ++c) {
        model.volumeInfo.scale[c] = 255.0; // Scale to [0, 1] range
      }
      isScalingApplied = true;
    }

    // No scaling needed for FLOAT or HalfFloat (SHORT/UNSIGNED_SHORT)
    if (
      dataType === VtkDataTypes.FLOAT ||
      (useHalfFloat &&
        (dataType === VtkDataTypes.SHORT ||
          dataType === VtkDataTypes.UNSIGNED_SHORT))
    ) {
      isScalingApplied = true;
    }

    return isScalingApplied;
  };

  //----------------------------------------------------------------------------
  publicAPI.create3DFromRaw = ({
    width = requiredParam('width'),
    height = requiredParam('height'),
    depth = requiredParam('depth'),
    numComps = requiredParam('numComps'),
    dataType = requiredParam('dataType'),
    data = requiredParam('data'),
    updatedExtents = [],
  } = {}) => {
    let dataTypeToUse = dataType;
    let dataToUse = data;

    if (
      !publicAPI.updateVolumeInfoForGL(dataTypeToUse, numComps) &&
      dataToUse
    ) {
      const numPixelsIn = width * height * depth;
      const scaleOffsetsCopy = structuredClone(model.volumeInfo);
      // otherwise convert to float
      const newArray = new Float32Array(numPixelsIn * numComps);
      // use computed scale and offset
      model.volumeInfo.offset = scaleOffsetsCopy.offset;
      model.volumeInfo.scale = scaleOffsetsCopy.scale;
      let count = 0;
      const scaleInverse = scaleOffsetsCopy.scale.map((s) => 1 / s);
      for (let i = 0; i < numPixelsIn; i++) {
        for (let nc = 0; nc < numComps; nc++) {
          newArray[count] =
            (dataToUse[count] - scaleOffsetsCopy.offset[nc]) * scaleInverse[nc];
          count++;
        }
      }

      dataTypeToUse = VtkDataTypes.FLOAT;
      dataToUse = newArray;
    }

    // Permit OpenGLDataType to be half float, if applicable, for 3D
    publicAPI.getOpenGLDataType(dataTypeToUse);

    // Now determine the texture parameters using the arguments.
    publicAPI.getInternalFormat(dataTypeToUse, numComps);
    publicAPI.getFormat(dataTypeToUse, numComps);

    if (!model.internalFormat || !model.format || !model.openGLDataType) {
      vtkErrorMacro('Failed to determine texture parameters.');
      return false;
    }

    model.target = model.context.TEXTURE_3D;
    model.components = numComps;
    model.width = width;
    model.height = height;
    model.depth = depth;
    model.numberOfDimensions = 3;
    model._openGLRenderWindow.activateTexture(publicAPI);
    publicAPI.createTexture();
    publicAPI.bind();

    const hasUpdatedExtents = updatedExtents.length > 0;

    // It's possible for the texture parameters to change while
    // streaming, so check for such a change.
    const rebuildEntireTexture =
      !hasUpdatedExtents || !deepEqual(model._prevTexParams, getTexParams());

    // Create an array of texture with one texture
    const dataArray = [dataToUse];
    const is3DArray = true;
    const pixData = publicAPI.updateArrayDataTypeForGL(
      dataTypeToUse,
      dataArray,
      is3DArray,
      rebuildEntireTexture ? [] : updatedExtents
    );
    const scaledData = scaleTextureToHighestPowerOfTwo(pixData);

    // Source texture data from the PBO.
    // model.context.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);
    model.context.pixelStorei(model.context.UNPACK_ALIGNMENT, 1);

    if (rebuildEntireTexture) {
      if (useTexStorage(dataTypeToUse)) {
        model.context.texStorage3D(
          model.target,
          1,
          model.internalFormat,
          model.width,
          model.height,
          model.depth
        );
        if (scaledData[0] != null) {
          model.context.texSubImage3D(
            model.target,
            0,
            0,
            0,
            0,
            model.width,
            model.height,
            model.depth,
            model.format,
            model.openGLDataType,
            scaledData[0]
          );
        }
      } else {
        model.context.texImage3D(
          model.target,
          0,
          model.internalFormat,
          model.width,
          model.height,
          model.depth,
          0,
          model.format,
          model.openGLDataType,
          scaledData[0]
        );
      }

      model._prevTexParams = getTexParams();
    } else if (hasUpdatedExtents) {
      const extentPixels = scaledData[0];
      let readOffset = 0;
      for (let i = 0; i < updatedExtents.length; i++) {
        const extent = updatedExtents[i];
        const extentSize = getExtentSize(extent);
        const extentPixelCount = getExtentPixelCount(extent);
        const textureData = new extentPixels.constructor(
          extentPixels.buffer,
          readOffset,
          extentPixelCount
        );
        readOffset += textureData.byteLength;

        model.context.texSubImage3D(
          model.target,
          0,
          extent[0],
          extent[2],
          extent[4],
          extentSize[0],
          extentSize[1],
          extentSize[2],
          model.format,
          model.openGLDataType,
          textureData
        );
      }
    }

    if (model.generateMipmap) {
      model.context.generateMipmap(model.target);
    }

    model.allocatedGPUMemoryInBytes =
      model.width *
      model.height *
      model.depth *
      model.components *
      model._openGLRenderWindow.getDefaultTextureByteSize(
        dataTypeToUse,
        getNorm16Ext(),
        publicAPI.useHalfFloat()
      );

    publicAPI.deactivate();
    return true;
  };

  //----------------------------------------------------------------------------
  // This method simulates a 3D texture using 2D
  // Prefer create3DFilterableFromDataArray to enable caching of min and max values
  publicAPI.create3DFilterableFromRaw = ({
    width = requiredParam('width'),
    height = requiredParam('height'),
    depth = requiredParam('depth'),
    numComps = requiredParam('numComps'),
    dataType = requiredParam('dataType'),
    data = requiredParam('data'),
    preferSizeOverAccuracy = false,
    ranges = undefined,
    updatedExtents = [],
  } = {}) =>
    publicAPI.create3DFilterableFromDataArray({
      width,
      height,
      depth,
      dataArray: vtkDataArray.newInstance({
        numComps,
        dataType,
        values: data,
        ranges,
      }),
      preferSizeOverAccuracy,
      updatedExtents,
    });

  //----------------------------------------------------------------------------
  // This method create a 3D texture from dimensions and a DataArray
  publicAPI.create3DFilterableFromDataArray = ({
    width = requiredParam('width'),
    height = requiredParam('height'),
    depth = requiredParam('depth'),
    dataArray = requiredParam('dataArray'),
    preferSizeOverAccuracy = false,
    updatedExtents = [],
  } = {}) => {
    const { numComps, dataType, data, scaleOffsets } = processDataArray(
      dataArray,
      preferSizeOverAccuracy
    );

    const offset = [];
    const scale = [];
    for (let c = 0; c < numComps; ++c) {
      offset[c] = 0.0;
      scale[c] = 1.0;
    }

    // store the information, we will need it later
    // offset and scale are the offset and scale required to get
    // the texture value back to data values ala
    // data = texture * scale + offset
    // and texture = (data - offset)/scale
    model.volumeInfo = {
      scale,
      offset,
      dataComputedScale: scaleOffsets.scale,
      dataComputedOffset: scaleOffsets.offset,
      width,
      height,
      depth,
    };

    // Create a copy of scale and offset to avoid aliasing issues
    // Original is read only, copy is read/write
    // Use the copy as volumeInfo.scale and volumeInfo.offset

    // WebGL2 path, we have 3d textures etc
    if (model._openGLRenderWindow.getWebgl2()) {
      return publicAPI.create3DFromRaw({
        width,
        height,
        depth,
        numComps,
        dataType,
        data,
        updatedExtents,
      });
    }

    const numPixelsIn = width * height * depth;
    const scaleOffsetsCopy = structuredClone(scaleOffsets);

    // not webgl2, deal with webgl1, no 3d textures
    // and maybe no float textures

    let volCopyData = (outArray, outIdx, inValue, smin, smax) => {
      outArray[outIdx] = inValue;
    };
    let dataTypeToUse = VtkDataTypes.UNSIGNED_CHAR;
    // unsigned char gets used as is
    if (dataType === VtkDataTypes.UNSIGNED_CHAR) {
      for (let c = 0; c < numComps; ++c) {
        scaleOffsetsCopy.offset[c] = 0.0;
        scaleOffsetsCopy.scale[c] = 255.0;
      }
    } else if (
      model.context.getExtension('OES_texture_float') &&
      model.context.getExtension('OES_texture_float_linear')
    ) {
      // use float textures scaled to 0.0 to 1.0
      dataTypeToUse = VtkDataTypes.FLOAT;
      volCopyData = (outArray, outIdx, inValue, soffset, sscale) => {
        outArray[outIdx] = (inValue - soffset) / sscale;
      };
    } else {
      // worst case, scale data to uchar
      dataTypeToUse = VtkDataTypes.UNSIGNED_CHAR;
      volCopyData = (outArray, outIdx, inValue, soffset, sscale) => {
        outArray[outIdx] = (255.0 * (inValue - soffset)) / sscale;
      };
    }

    // Now determine the texture parameters using the arguments.
    publicAPI.getOpenGLDataType(dataTypeToUse);
    publicAPI.getInternalFormat(dataTypeToUse, numComps);
    publicAPI.getFormat(dataTypeToUse, numComps);

    if (!model.internalFormat || !model.format || !model.openGLDataType) {
      vtkErrorMacro('Failed to determine texture parameters.');
      return false;
    }

    // have to pack this 3D texture into pot 2D texture
    model.target = model.context.TEXTURE_2D;
    model.components = numComps;
    model.depth = 1;
    model.numberOfDimensions = 2;

    // MAX_TEXTURE_SIZE gives the max dimensions that can be supported by the GPU,
    // but it doesn't mean it will fit in memory. If we have to use a float data type
    // or 4 components, there are good chances that the texture size will blow up
    // and could not fit in the GPU memory. Use a smaller texture size in that case,
    // which will force a downsampling of the dataset.
    // That problem does not occur when using webGL2 since we can pack the data in
    // denser textures based on our data type.
    // TODO: try to fit in the biggest supported texture, catch the gl error if it
    // does not fix (OUT_OF_MEMORY), then attempt with smaller texture
    let maxTexDim = model.context.getParameter(model.context.MAX_TEXTURE_SIZE);
    if (
      maxTexDim > 4096 &&
      (dataTypeToUse === VtkDataTypes.FLOAT || numComps >= 3)
    ) {
      maxTexDim = 4096;
    }

    // compute estimate for XY subsample
    let xstride = 1;
    let ystride = 1;
    if (numPixelsIn > maxTexDim * maxTexDim) {
      xstride = Math.ceil(Math.sqrt(numPixelsIn / (maxTexDim * maxTexDim)));
      ystride = xstride;
    }
    let targetWidth = Math.sqrt(numPixelsIn) / xstride;
    targetWidth = vtkMath.nearestPowerOfTwo(targetWidth);
    // determine X reps
    const xreps = Math.floor((targetWidth * xstride) / width);
    const yreps = Math.ceil(depth / xreps);
    const targetHeight = vtkMath.nearestPowerOfTwo((height * yreps) / ystride);

    model.width = targetWidth;
    model.height = targetHeight;
    model._openGLRenderWindow.activateTexture(publicAPI);
    publicAPI.createTexture();
    publicAPI.bind();

    // store the information, we will need it later
    model.volumeInfo.xreps = xreps;
    model.volumeInfo.yreps = yreps;
    model.volumeInfo.xstride = xstride;
    model.volumeInfo.ystride = ystride;
    model.volumeInfo.offset = scaleOffsetsCopy.offset;
    model.volumeInfo.scale = scaleOffsetsCopy.scale;

    // OK stuff the data into the 2d TEXTURE

    // first allocate the new texture
    let newArray;
    const pixCount = targetWidth * targetHeight * numComps;
    if (dataTypeToUse === VtkDataTypes.FLOAT) {
      newArray = new Float32Array(pixCount);
    } else {
      newArray = new Uint8Array(pixCount);
    }

    // then stuff the data into it, nothing fancy right now
    // for stride
    let outIdx = 0;

    const tileWidth = Math.floor(width / xstride);
    const tileHeight = Math.floor(height / ystride);

    for (let yRep = 0; yRep < yreps; yRep++) {
      const xrepsThisRow = Math.min(xreps, depth - yRep * xreps);
      const outXContIncr =
        numComps * (model.width - xrepsThisRow * Math.floor(width / xstride));
      for (let tileY = 0; tileY < tileHeight; tileY++) {
        for (let xRep = 0; xRep < xrepsThisRow; xRep++) {
          const inOffset =
            numComps *
            ((yRep * xreps + xRep) * width * height + ystride * tileY * width);

          for (let tileX = 0; tileX < tileWidth; tileX++) {
            // copy value
            for (let nc = 0; nc < numComps; nc++) {
              volCopyData(
                newArray,
                outIdx,
                data[inOffset + xstride * tileX * numComps + nc],
                scaleOffsetsCopy.offset[nc],
                scaleOffsetsCopy.scale[nc]
              );
              outIdx++;
            }
          }
        }
        outIdx += outXContIncr;
      }
    }

    // Source texture data from the PBO.
    // model.context.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);
    model.context.pixelStorei(model.context.UNPACK_ALIGNMENT, 1);

    if (useTexStorage(dataTypeToUse)) {
      model.context.texStorage2D(
        model.target,
        1,
        model.internalFormat,
        model.width,
        model.height
      );
      if (newArray != null) {
        model.context.texSubImage2D(
          model.target,
          0,
          0,
          0,
          model.width,
          model.height,
          model.format,
          model.openGLDataType,
          newArray
        );
      }
    } else {
      model.context.texImage2D(
        model.target,
        0,
        model.internalFormat,
        model.width,
        model.height,
        0,
        model.format,
        model.openGLDataType,
        newArray
      );
    }

    publicAPI.deactivate();
    return true;
  };

  publicAPI.setOpenGLRenderWindow = (rw) => {
    if (model._openGLRenderWindow === rw) {
      return;
    }
    publicAPI.releaseGraphicsResources();
    model._openGLRenderWindow = rw;
    model.context = null;
    if (rw) {
      model.context = model._openGLRenderWindow.getContext();
    }
  };

  //----------------------------------------------------------------------------
  publicAPI.getMaximumTextureSize = (ctx) => {
    if (ctx && ctx.isCurrent()) {
      return ctx.getIntegerv(ctx.MAX_TEXTURE_SIZE);
    }

    return -1;
  };

  // set use half float
  publicAPI.enableUseHalfFloat = (use) => {
    model.enableUseHalfFloat = use;
  };
}

// ----------------------------------------------------------------------------
// Object factory
// ----------------------------------------------------------------------------

const DEFAULT_VALUES = {
  _openGLRenderWindow: null,
  _forceInternalFormat: false,
  _prevTexParams: null,
  context: null,
  handle: 0,
  sendParametersTime: null,
  textureBuildTime: null,
  numberOfDimensions: 0,
  target: 0,
  format: 0,
  openGLDataType: 0,
  components: 0,
  width: 0,
  height: 0,
  depth: 0,
  autoParameters: true,
  wrapS: Wrap.CLAMP_TO_EDGE,
  wrapT: Wrap.CLAMP_TO_EDGE,
  wrapR: Wrap.CLAMP_TO_EDGE,
  minificationFilter: Filter.NEAREST,
  magnificationFilter: Filter.NEAREST,
  minLOD: -1000.0,
  maxLOD: 1000.0,
  baseLevel: 0,
  maxLevel: 1000,
  generateMipmap: false,
  oglNorm16Ext: null,
  allocatedGPUMemoryInBytes: 0,
  // by default it is enabled
  enableUseHalfFloat: true,
  // but by default we don't know if we can use half float base on the data range
  canUseHalfFloat: false,
};

// ----------------------------------------------------------------------------

export function extend(publicAPI, model, initialValues = {}) {
  Object.assign(model, DEFAULT_VALUES, initialValues);

  // Inheritance
  vtkViewNode.extend(publicAPI, model, initialValues);

  model.sendParametersTime = {};
  macro.obj(model.sendParametersTime, { mtime: 0 });

  model.textureBuildTime = {};
  macro.obj(model.textureBuildTime, { mtime: 0 });

  // Build VTK API
  macro.set(publicAPI, model, ['format', 'openGLDataType']);

  macro.setGet(publicAPI, model, [
    'keyMatrixTime',
    'minificationFilter',
    'magnificationFilter',
    'wrapS',
    'wrapT',
    'wrapR',
    'generateMipmap',
    'oglNorm16Ext',
  ]);

  macro.get(publicAPI, model, [
    'width',
    'height',
    'volumeInfo',
    'components',
    'handle',
    'target',
    'allocatedGPUMemoryInBytes',
  ]);
  macro.moveToProtected(publicAPI, model, ['openGLRenderWindow']);

  // Object methods
  vtkOpenGLTexture(publicAPI, model);
}

// ----------------------------------------------------------------------------

export const newInstance = macro.newInstance(extend, 'vtkOpenGLTexture');

// ----------------------------------------------------------------------------

export default { newInstance, extend, ...Constants };

// Register ourself to OpenGL backend if imported
registerOverride('vtkTexture', newInstance);
