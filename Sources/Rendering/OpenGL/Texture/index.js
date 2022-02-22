import Constants from 'vtk.js/Sources/Rendering/OpenGL/Texture/Constants';
import HalfFloat from 'vtk.js/Sources/Common/Core/HalfFloat';
import * as macro from 'vtk.js/Sources/macros';
import vtkDataArray from 'vtk.js/Sources/Common/Core/DataArray';
import * as vtkMath from 'vtk.js/Sources/Common/Core/Math';
import vtkViewNode from 'vtk.js/Sources/Rendering/SceneGraph/ViewNode';

import { registerOverride } from 'vtk.js/Sources/Rendering/OpenGL/ViewNodeFactory';

const { Wrap, Filter } = Constants;
const { VtkDataTypes } = vtkDataArray;
const { vtkDebugMacro, vtkErrorMacro, vtkWarningMacro } = macro;

// ----------------------------------------------------------------------------
// vtkOpenGLTexture methods
// ----------------------------------------------------------------------------

function vtkOpenGLTexture(publicAPI, model) {
  // Set our className
  model.classHierarchy.push('vtkOpenGLTexture');
  // Renders myself
  publicAPI.render = (renWin = null) => {
    if (renWin) {
      model._openGLRenderWindow = renWin;
    } else {
      model.openGLRenderer =
        publicAPI.getFirstAncestorOfType('vtkOpenGLRenderer');
      // sync renderable properties
      model._openGLRenderWindow = model.openGLRenderer.getParent();
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
        publicAPI.create2DFromRaw(
          canvas.width,
          canvas.height,
          4,
          VtkDataTypes.UNSIGNED_CHAR,
          canvas,
          true
        );
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
        publicAPI.create2DFromRaw(
          jsid.width,
          jsid.height,
          4,
          VtkDataTypes.UNSIGNED_CHAR,
          jsid.data,
          true
        );
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
          publicAPI.createCubeFromRaw(
            ext[1] - ext[0] + 1,
            ext[3] - ext[2] + 1,
            inScalars.getNumberOfComponents(),
            inScalars.getDataType(),
            data
          );
        } else {
          publicAPI.create2DFromRaw(
            ext[1] - ext[0] + 1,
            ext[3] - ext[2] + 1,
            inScalars.getNumberOfComponents(),
            inScalars.getDataType(),
            inScalars.getData()
          );
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

  //----------------------------------------------------------------------------
  publicAPI.destroyTexture = () => {
    // deactivate it first
    publicAPI.deactivate();

    if (model.context && model.handle) {
      model.context.deleteTexture(model.handle);
    }
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
    if (!model.internalFormat) {
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

    return model.internalFormat;
  };

  //----------------------------------------------------------------------------
  publicAPI.getDefaultInternalFormat = (vtktype, numComps) => {
    let result = 0;

    // try default next
    result = model._openGLRenderWindow.getDefaultTextureInternalFormat(
      vtktype,
      numComps,
      false
    );
    if (result) {
      return result;
    }

    // try floating point
    result = this._openGLRenderWindow.getDefaultTextureInternalFormat(
      vtktype,
      numComps,
      true
    );

    if (!result) {
      vtkDebugMacro('Unsupported internal texture type!');
      vtkDebugMacro(
        `Unable to find suitable internal format for T=${vtktype} NC= ${numComps}`
      );
    }

    return result;
  };

  //----------------------------------------------------------------------------
  publicAPI.setInternalFormat = (iFormat) => {
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
    model.format = 0;
    model.internalFormat = 0;
    model.openGLDataType = 0;
  };

  //----------------------------------------------------------------------------
  publicAPI.getDefaultDataType = (vtkScalarType, useHalfFloatType = false) => {
    // DON'T DEAL with VTK_CHAR as this is platform dependent.
    if (model._openGLRenderWindow.getWebgl2()) {
      switch (vtkScalarType) {
        // case VtkDataTypes.SIGNED_CHAR:
        //   return model.context.BYTE;
        case VtkDataTypes.UNSIGNED_CHAR:
          return model.context.UNSIGNED_BYTE;
        case useHalfFloatType && VtkDataTypes.SHORT:
          return model.context.HALF_FLOAT;
        case useHalfFloatType && VtkDataTypes.UNSIGNED_SHORT:
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
  publicAPI.getOpenGLDataType = (vtkScalarType, useHalfFloatType = false) => {
    if (!model.openGLDataType) {
      model.openGLDataType = publicAPI.getDefaultDataType(
        vtkScalarType,
        useHalfFloatType
      );
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
  function updateArrayDataType(dataType, data, depth = false) {
    const pixData = [];

    let pixCount = model.width * model.height * model.components;
    if (depth) {
      pixCount *= model.depth;
    }

    // if the opengl data type is float
    // then the data array must be float
    if (
      dataType !== VtkDataTypes.FLOAT &&
      model.openGLDataType === model.context.FLOAT
    ) {
      for (let idx = 0; idx < data.length; idx++) {
        if (data[idx]) {
          const newArray = new Float32Array(pixCount);
          for (let i = 0; i < pixCount; i++) {
            newArray[i] = data[idx][i];
          }
          pixData.push(newArray);
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
          const newArray = new Uint8Array(pixCount);
          for (let i = 0; i < pixCount; i++) {
            newArray[i] = data[idx][i];
          }
          pixData.push(newArray);
        } else {
          pixData.push(null);
        }
      }
    }

    // if the opengl data type is half float
    // then the data array must be u16
    const halfFloatExt = model.context.getExtension('OES_texture_half_float');
    const halfFloat = model._openGLRenderWindow.getWebgl2()
      ? model.openGLDataType === model.context.HALF_FLOAT
      : halfFloatExt && model.openGLDataType === halfFloatExt.HALF_FLOAT_OES;

    if (halfFloat) {
      for (let idx = 0; idx < data.length; idx++) {
        if (data[idx]) {
          const newArray = new Uint16Array(pixCount);
          for (let i = 0; i < pixCount; i++) {
            newArray[i] = HalfFloat.toHalf(data[idx][i]);
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
        pixData.push(data[i]);
      }
    }

    return pixData;
  }

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
  publicAPI.create2DFromRaw = (
    width,
    height,
    numComps,
    dataType,
    data,
    flip = false
  ) => {
    // Now determine the texture parameters using the arguments.
    publicAPI.getOpenGLDataType(dataType);
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
    const pixData = updateArrayDataType(dataType, dataArray);
    const scaledData = scaleTextureToHighestPowerOfTwo(pixData);

    // Source texture data from the PBO.
    model.context.pixelStorei(model.context.UNPACK_FLIP_Y_WEBGL, flip);
    model.context.pixelStorei(model.context.UNPACK_ALIGNMENT, 1);

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

    if (model.generateMipmap) {
      model.context.generateMipmap(model.target);
    }

    // always reset the flip
    if (flip) {
      model.context.pixelStorei(model.context.UNPACK_FLIP_Y_WEBGL, false);
    }

    publicAPI.deactivate();
    return true;
  };

  //----------------------------------------------------------------------------
  publicAPI.createCubeFromRaw = (width, height, numComps, dataType, data) => {
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

    const pixData = updateArrayDataType(dataType, data);
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
        j++;
        w /= 2;
        h /= 2;
      }
    }

    // generateMipmap must not be called here because we manually upload all levels
    // if it is called, all levels will be overwritten

    publicAPI.deactivate();
    return true;
  };

  //----------------------------------------------------------------------------
  publicAPI.createDepthFromRaw = (width, height, dataType, data) => {
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

    if (model.generateMipmap) {
      model.context.generateMipmap(model.target);
    }

    publicAPI.deactivate();
    return true;
  };

  //----------------------------------------------------------------------------
  publicAPI.create2DFromImage = (image) => {
    // Now determine the texture parameters using the arguments.
    publicAPI.getOpenGLDataType(VtkDataTypes.UNSIGNED_CHAR);
    publicAPI.getInternalFormat(VtkDataTypes.UNSIGNED_CHAR, 4);
    publicAPI.getFormat(VtkDataTypes.UNSIGNED_CHAR, 4);

    if (!model.internalFormat || !model.format || !model.openGLDataType) {
      vtkErrorMacro('Failed to determine texture parameters.');
      return false;
    }

    model.target = model.context.TEXTURE_2D;
    model.components = 4;
    model.width = image.width;
    model.height = image.height;
    model.depth = 1;
    model.numberOfDimensions = 2;
    model._openGLRenderWindow.activateTexture(publicAPI);
    publicAPI.createTexture();
    publicAPI.bind();

    // Source texture data from the PBO.
    // model.context.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);
    model.context.pixelStorei(model.context.UNPACK_ALIGNMENT, 1);

    // Scale up the texture to the next highest power of two dimensions (if needed) and flip y.
    const needNearestPowerOfTwo =
      !vtkMath.isPowerOfTwo(image.width) || !vtkMath.isPowerOfTwo(image.height);
    const canvas = document.createElement('canvas');
    canvas.width = needNearestPowerOfTwo
      ? vtkMath.nearestPowerOfTwo(image.width)
      : image.width;
    canvas.height = needNearestPowerOfTwo
      ? vtkMath.nearestPowerOfTwo(image.height)
      : image.height;
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
    const safeImage = canvas;

    model.context.texImage2D(
      model.target,
      0,
      model.internalFormat,
      model.format,
      model.openGLDataType,
      safeImage
    );

    if (model.generateMipmap) {
      model.context.generateMipmap(model.target);
    }

    publicAPI.deactivate();
    return true;
  };

  function computeScaleOffsets(numComps, numPixelsIn, data) {
    // compute min and max values per component
    const min = [];
    const max = [];
    for (let c = 0; c < numComps; ++c) {
      min[c] = data[c];
      max[c] = data[c];
    }
    let count = 0;
    for (let i = 0; i < numPixelsIn; ++i) {
      for (let c = 0; c < numComps; ++c) {
        if (data[count] < min[c]) {
          min[c] = data[count];
        }
        if (data[count] > max[c]) {
          max[c] = data[count];
        }
        count++;
      }
    }
    const offset = [];
    const scale = [];
    for (let c = 0; c < numComps; ++c) {
      if (min[c] === max[c]) {
        max[c] = min[c] + 1.0;
      }
      offset[c] = min[c];
      scale[c] = max[c] - min[c];
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

  function checkUseHalfFloat(dataType, offset, scale, preferSizeOverAccuracy) {
    const useHalfFloatType = true;
    publicAPI.getOpenGLDataType(dataType, useHalfFloatType);

    const halfFloatExt = model.context.getExtension('OES_texture_half_float');
    const useHalfFloat = model._openGLRenderWindow.getWebgl2()
      ? model.openGLDataType === model.context.HALF_FLOAT
      : halfFloatExt && model.openGLDataType === halfFloatExt.HALF_FLOAT_OES;

    if (!useHalfFloat) {
      return false;
    }

    // Don't consider halfFloat and convert back to Float when the range of data does not generate an accurate halfFloat
    // AND it is not preferable to have a smaller texture than an exact texture.
    if (!hasExactHalfFloat(offset, scale) && !preferSizeOverAccuracy) {
      return false;
    }

    return true;
  }

  //----------------------------------------------------------------------------
  publicAPI.create3DFromRaw = (
    width,
    height,
    depth,
    numComps,
    dataType,
    data
  ) => {
    // Permit OpenGLDataType to be half float, if applicable, for 3D
    const useHalfFloatType = true;
    publicAPI.getOpenGLDataType(dataType, useHalfFloatType);

    // Now determine the texture parameters using the arguments.
    publicAPI.getInternalFormat(dataType, numComps);
    publicAPI.getFormat(dataType, numComps);

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
    // Create an array of texture with one texture
    const dataArray = [data];
    const is3DArray = true;
    const pixData = updateArrayDataType(dataType, dataArray, is3DArray);
    const scaledData = scaleTextureToHighestPowerOfTwo(pixData);

    // Source texture data from the PBO.
    // model.context.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);
    // model.context.pixelStorei(model.context.UNPACK_ALIGNMENT, 1);

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

    if (model.generateMipmap) {
      model.context.generateMipmap(model.target);
    }

    publicAPI.deactivate();
    return true;
  };

  //----------------------------------------------------------------------------
  // This method simulates a 3D texture using 2D
  publicAPI.create3DFilterableFromRaw = (
    width,
    height,
    depth,
    numComps,
    dataType,
    data,
    preferSizeOverAccuracy = false
  ) => {
    const numPixelsIn = width * height * depth;

    // initialize offset/scale
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
    model.volumeInfo = { scale, offset, width, height, depth };

    // Check if we can accurately use halfFloat or whether it is preferred to have a smaller size texture
    // compute min and max values
    const { offset: computedOffset, scale: computedScale } =
      computeScaleOffsets(numComps, numPixelsIn, data);
    model.volumeInfo.dataComputedScale = computedScale;
    model.volumeInfo.dataComputedOffset = computedOffset;

    const useHalfFloat = checkUseHalfFloat(
      dataType,
      computedOffset,
      computedScale,
      preferSizeOverAccuracy
    );

    // WebGL2 path, we have 3d textures etc
    if (model._openGLRenderWindow.getWebgl2()) {
      if (
        dataType === VtkDataTypes.FLOAT ||
        (useHalfFloat &&
          (dataType === VtkDataTypes.SHORT ||
            dataType === VtkDataTypes.UNSIGNED_SHORT))
      ) {
        return publicAPI.create3DFromRaw(
          width,
          height,
          depth,
          numComps,
          dataType,
          data
        );
      }
      if (dataType === VtkDataTypes.UNSIGNED_CHAR) {
        for (let c = 0; c < numComps; ++c) {
          model.volumeInfo.scale[c] = 255.0;
        }
        return publicAPI.create3DFromRaw(
          width,
          height,
          depth,
          numComps,
          dataType,
          data
        );
      }
      // otherwise convert to float
      const newArray = new Float32Array(numPixelsIn * numComps);
      // compute min and max values
      model.volumeInfo.offset = computedOffset;
      model.volumeInfo.scale = computedScale;
      let count = 0;
      const scaleInverse = computedScale.map((s) => 1 / s);
      for (let i = 0; i < numPixelsIn; i++) {
        for (let nc = 0; nc < numComps; nc++) {
          newArray[count] =
            (data[count] - computedOffset[nc]) * scaleInverse[nc];
          count++;
        }
      }
      return publicAPI.create3DFromRaw(
        width,
        height,
        depth,
        numComps,
        VtkDataTypes.FLOAT,
        newArray
      );
    }

    // not webgl2, deal with webgl1, no 3d textures
    // and maybe no float textures

    // compute min and max values
    const res = computeScaleOffsets(numComps, numPixelsIn, data);

    let volCopyData = (outArray, outIdx, inValue, smin, smax) => {
      outArray[outIdx] = inValue;
    };
    let dataTypeToUse = VtkDataTypes.UNSIGNED_CHAR;
    // unsigned char gets used as is
    if (dataType === VtkDataTypes.UNSIGNED_CHAR) {
      for (let c = 0; c < numComps; ++c) {
        res.offset[c] = 0.0;
        res.scale[c] = 255.0;
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
    model.volumeInfo.offset = res.offset;
    model.volumeInfo.scale = res.scale;

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
                res.offset[nc],
                res.scale[nc]
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
}

// ----------------------------------------------------------------------------
// Object factory
// ----------------------------------------------------------------------------

const DEFAULT_VALUES = {
  _openGLRenderWindow: null,
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
  ]);

  macro.get(publicAPI, model, [
    'width',
    'height',
    'volumeInfo',
    'components',
    'handle',
    'target',
  ]);

  // Object methods
  vtkOpenGLTexture(publicAPI, model);
}

// ----------------------------------------------------------------------------

export const newInstance = macro.newInstance(extend, 'vtkOpenGLTexture');

// ----------------------------------------------------------------------------

export default { newInstance, extend, ...Constants };

// Register ourself to OpenGL backend if imported
registerOverride('vtkTexture', newInstance);
