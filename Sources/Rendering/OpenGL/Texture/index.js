import macro            from 'vtk.js/Sources/macro';
import { Wrap, Filter } from 'vtk.js/Sources/Rendering/OpenGL/Texture/Constants';
import { VtkDataTypes } from 'vtk.js/Sources/Common/Core/DataArray/Constants';
import vtkMath          from 'vtk.js/Sources/Common/Core/Math';
import vtkViewNode      from 'vtk.js/Sources/Rendering/SceneGraph/ViewNode';

const { vtkDebugMacro, vtkErrorMacro, vtkWarningMacro } = macro;

// ----------------------------------------------------------------------------
// vtkOpenGLTexture methods
// ----------------------------------------------------------------------------

function vtkOpenGLTexture(publicAPI, model) {
  // Set our className
  model.classHierarchy.push('vtkOpenGLTexture');
  // Renders myself
  publicAPI.render = () => {
    const oglren = publicAPI.getFirstAncestorOfType('vtkOpenGLRenderer');
    // sync renderable properties
    model.window = oglren.getParent();
    model.context = model.window.getContext();
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
    // clear image if input data is set
    if (model.renderable.getInputData()) {
      model.renderable.setImage(null);
    }
    // create the texture if it is not done already
    if (!model.handle) {
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
        }
      }
      // if we have Inputdata
      const input = model.renderable.getInputData();
      if (input && input.getPointData().getScalars()) {
        const ext = input.getExtent();
        const inScalars = input.getPointData().getScalars();
        if (model.renderable.getInterpolate()) {
          model.generateMipmap = true;
          publicAPI.setMinificationFilter(Filter.LINEAR_MIPMAP_LINEAR);
        }
        publicAPI.create2DFromRaw(ext[1] - ext[0] + 1, ext[3] - ext[2] + 1,
          inScalars.getNumberOfComponents(), inScalars.getDataType(), inScalars.getData());
        publicAPI.activate();
        publicAPI.sendParameters();
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
        model.context.texParameteri(model.target, model.context.TEXTURE_MIN_FILTER,
                        publicAPI.getOpenGLFilterMode(model.minificationFilter));
        model.context.texParameteri(model.target, model.context.TEXTURE_MAG_FILTER,
                        publicAPI.getOpenGLFilterMode(model.magnificationFilter));

        model.context.texParameteri(model.target, model.context.TEXTURE_WRAP_S,
                        publicAPI.getOpenGLWrapMode(model.wrapS));
        model.context.texParameteri(model.target, model.context.TEXTURE_WRAP_T,
                        publicAPI.getOpenGLWrapMode(model.wrapT));

        model.context.bindTexture(model.target, null);
      }
    }
  };

  //---------------------------------------------------------------------------
  publicAPI.getTextureUnit = () => {
    if (model.window) {
      return model.window.getTextureUnitForTexture(publicAPI);
    }
    return -1;
  };

  //---------------------------------------------------------------------------
  publicAPI.activate = () => {
    // activate a free texture unit for this texture
    model.window.activateTexture(publicAPI);
    publicAPI.bind();
  };

  //---------------------------------------------------------------------------
  publicAPI.deactivate = () => {
    if (model.window) {
      model.window.activateTexture(publicAPI);
      publicAPI.unBind();
      model.window.deactivateTexture(publicAPI);
    }
  };

  //---------------------------------------------------------------------------
  publicAPI.releaseGraphicsResources = (rwin) => {
    if (rwin && model.handle) {
      rwin.makeCurrent();

      rwin.activateTexture(publicAPI);
      publicAPI.unBind();
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
    if (model.autoParameters && (publicAPI.getMTime() > model.sendParametersTime.getMTime())) {
      publicAPI.sendParameters();
    }
  };

  //----------------------------------------------------------------------------
  publicAPI.unBind = () => {
    if (model.target) {
      model.context.bindTexture(model.target, null);
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
    model.context.texParameteri(model.target, model.context.TEXTURE_WRAP_S,
      publicAPI.getOpenGLWrapMode(model.wrapS));
    model.context.texParameteri(model.target, model.context.TEXTURE_WRAP_T,
      publicAPI.getOpenGLWrapMode(model.wrapT));

    model.context.texParameteri(
      model.target,
      model.context.TEXTURE_MIN_FILTER,
      publicAPI.getOpenGLFilterMode(model.minificationFilter));

    model.context.texParameteri(
      model.target,
      model.context.TEXTURE_MAG_FILTER,
      publicAPI.getOpenGLFilterMode(model.magnificationFilter));

    // model.context.texParameterf(model.target, model.context.TEXTURE_MIN_LOD, model.minLOD);
    // model.context.texParameterf(model.target, model.context.TEXTURE_MAX_LOD, model.maxLOD);
    // model.context.texParameteri(model.target, model.context.TEXTURE_BASE_LEVEL, model.baseLevel);
    // model.context.texParameteri(model.target, model.context.TEXTURE_MAX_LEVEL, model.maxLevel);

    model.sendParametersTime.modified();
  };

  //----------------------------------------------------------------------------
  publicAPI.getInternalFormat = (vtktype, numComps) => {
    if (model.internalFormat) {
      return model.internalFormat;
    }

    model.internalFormat =
      publicAPI.getDefaultInternalFormat(vtktype, numComps);

    if (!model.internalFormat) {
      vtkDebugMacro(`Unable to find suitable internal format for T=${vtktype} NC= ${numComps}`);
    }

    return model.internalFormat;
  };

  //----------------------------------------------------------------------------
  publicAPI.getDefaultInternalFormat = (vtktype, numComps) => {
    let result = 0;

    // try default next
    result = model.window.getDefaultTextureInternalFormat(
      vtktype, numComps, false);
    if (result) {
      return result;
    }

    // try floating point
    result = this.window.getDefaultTextureInternalFormat(
      vtktype, numComps, true);

    if (!result) {
      vtkDebugMacro('Unsupported internal texture type!');
      vtkDebugMacro(`Unable to find suitable internal format for T=${vtktype} NC= ${numComps}`);
    }

    return result;
  };


  //----------------------------------------------------------------------------
  publicAPI.setInternalFormat = (iFormat) => {
    if (iFormat !== model.context.InternalFormat) {
      model.internalFormat = iFormat;
      publicAPI.modified();
    }
  };

  //----------------------------------------------------------------------------
  publicAPI.getFormat = (vtktype, numComps) => {
    if (!model.format) {
      model.format = publicAPI.getDefaultFormat(vtktype, numComps);
    }
    return model.format;
  };

  //----------------------------------------------------------------------------
  publicAPI.getDefaultFormat = (vtktype, numComps) => {
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
  };

  //----------------------------------------------------------------------------
  publicAPI.resetFormatAndType = () => {
    model.format = 0;
    model.internalFormat = 0;
    model.openGLDataType = 0;
  };

  //----------------------------------------------------------------------------
  publicAPI.getDefaultDataType = (vtkScalarType) => {
    // DON'T DEAL with VTK_CHAR as this is platform dependent.
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
        if (model.context.getExtension('OES_texture_float') &&
            model.context.getExtension('OES_texture_float_linear')) {
          return model.context.FLOAT;
        }
        return model.context.UNSIGNED_BYTE;
    }
  };

  //----------------------------------------------------------------------------
  publicAPI.getOpenGLDataType = (vtkScalarType) => {
    if (!model.openGLDataType) {
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
  function updateArrayDataType(dataType, data) {
    const pixData = [];
    // if the opengl data type is float
    // then the data array must be float
    if (dataType !== VtkDataTypes.FLOAT && model.openGLDataType === model.context.FLOAT) {
      const pixCount = model.width * model.height * model.components;
      for (let idx = 0; idx < data.length; idx++) {
        const newArray = new Float32Array(pixCount);
        for (let i = 0; i < pixCount; i++) {
          newArray[i] = data[idx][i];
        }
        pixData.push(newArray);
      }
    }

    // if the opengl data type is ubyte
    // then the data array must be u8, we currently simply truncate the data
    if (dataType !== VtkDataTypes.UNSIGNED_CHAR && model.openGLDataType === model.context.UNSIGNED_BYTE) {
      const pixCount = model.width * model.height * model.components;
      for (let idx = 0; idx < data.length; idx++) {
        const newArray = new Uint8Array(pixCount);
        for (let i = 0; i < pixCount; i++) {
          newArray[i] = data[idx][i];
        }
        pixData.push(newArray);
      }
    }

    // The output has to be filled
    if (pixData.length === 0) {
      for (let i = 0; i < data.length; i++) {
        pixData.push(data[i]);
      }
    }
  }

  //----------------------------------------------------------------------------
  function scaleTextureToHighestPowerOfTwo(data) {
    const pixData = [];
    const width = model.width;
    const height = model.height;
    const numComps = model.components;
    if (data && (!vtkMath.isPowerOfTwo(width) || !vtkMath.isPowerOfTwo(height))) {
      // Scale up the texture to the next highest power of two dimensions.
      const newWidth = vtkMath.nearestPowerOfTwo(width);
      const newHeight = vtkMath.nearestPowerOfTwo(height);
      const pixCount = newWidth * newHeight * model.components;
      for (let idx = 0; idx < data.length; idx++) {
        let newArray = null;
        switch (model.openGLDataType) {
          case model.context.FLOAT:
            newArray = new Float32Array(pixCount);
            break;
          default:
          case model.context.UNSIGNED_BYTE:
            newArray = new Uint8Array(pixCount);
            break;
        }
        const jFactor = height / newHeight;
        const iFactor = width / newWidth;
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
              newArray[joff + ioff + c] =
                (data[idx][jlow + ilow + c] * jmix1 * (1.0 - imix)) +
                (data[idx][jlow + ihi + c] * jmix1 * imix) +
                (data[idx][jhi + ilow + c] * jmix * (1.0 - imix)) +
                (data[idx][jhi + ihi + c] * jmix * imix);
            }
          }
        }
        pixData.push(newArray);
      }
      model.width = newWidth;
      model.height = newHeight;
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
  publicAPI.create2DFromRaw = (width, height, numComps, dataType, data) => {
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
    model.window.activateTexture(publicAPI);
    publicAPI.createTexture();
    publicAPI.bind();

    // Create an array of texture with one texture
    const dataArray = [data];
    const pixData = updateArrayDataType(dataType, dataArray);
    const scaledData = scaleTextureToHighestPowerOfTwo(pixData);

    // Source texture data from the PBO.
    // model.context.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);
    model.context.pixelStorei(model.context.UNPACK_ALIGNMENT, 1);

    model.context.texImage2D(
          model.target,
          0,
          model.internalFormat,
          model.width, model.height,
          0,
          model.format,
          model.openGLDataType,
          scaledData);

    if (model.generateMipmap) {
      model.context.generateMipmap(model.target);
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
    model.window.activateTexture(publicAPI);
    publicAPI.createTexture();
    publicAPI.bind();

    const pixData = updateArrayDataType(dataType, data);
    const scaledData = scaleTextureToHighestPowerOfTwo(pixData);

    // Source texture data from the PBO.
    model.context.pixelStorei(model.context.UNPACK_ALIGNMENT, 1);

    for (let i = 0; i < 6; i++) {
      if (scaledData[i]) {
        model.context.texImage2D(
          model.context.TEXTURE_CUBE_MAP_POSITIVE_X + i,
          0,
          model.internalFormat,
          model.width, model.height,
          0,
          model.format,
          model.openGLDataType,
          scaledData[i]);
      }
    }

    publicAPI.deactivate();
    return true;
  };

  //----------------------------------------------------------------------------
  publicAPI.createDepthFromRaw = (width, height, dataType, data) => {
    // Now determine the texture parameters using the arguments.
    publicAPI.getOpenGLDataType(dataType);
    model.format = model.context.DEPTH_COMPONENT;
    model.internalFormat = model.context.DEPTH_COMPONENT;

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
    model.window.activateTexture(publicAPI);
    publicAPI.createTexture();
    publicAPI.bind();

    // Source texture data from the PBO.
    // model.context.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);
    model.context.pixelStorei(model.context.UNPACK_ALIGNMENT, 1);

    model.context.texImage2D(
          model.target,
          0,
          model.internalFormat,
          model.width, model.height,
          0,
          model.format,
          model.openGLDataType,
          data);

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
    model.window.activateTexture(publicAPI);
    publicAPI.createTexture();
    publicAPI.bind();

    // Source texture data from the PBO.
    // model.context.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);
    model.context.pixelStorei(model.context.UNPACK_ALIGNMENT, 1);

    // Scale up the texture to the next highest power of two dimensions (if needed) and flip y.
    const needNearestPowerOfTwo = (!vtkMath.isPowerOfTwo(image.width) || !vtkMath.isPowerOfTwo(image.height));
    const canvas = document.createElement('canvas');
    canvas.width = needNearestPowerOfTwo ? vtkMath.nearestPowerOfTwo(image.width) : image.width;
    canvas.height = needNearestPowerOfTwo ? vtkMath.nearestPowerOfTwo(image.height) : image.height;
    const ctx = canvas.getContext('2d');
    ctx.translate(0, canvas.height);
    ctx.scale(1, -1);
    ctx.drawImage(image, 0, 0, image.width, image.height, 0, 0, canvas.width, canvas.height);
    const safeImage = canvas;

    model.context.texImage2D(
          model.target,
          0,
          model.internalFormat,
          model.format,
          model.openGLDataType,
          safeImage);

    if (model.generateMipmap) {
      model.context.generateMipmap(model.target);
    }

    publicAPI.deactivate();
    return true;
  };

  //----------------------------------------------------------------------------
  // This method simulates a 3D texture using 2D
  publicAPI.create3DOneComponentFromRaw = (width, height, depth, dataType, data) => {
    let volCopyData = (outArray, outIdx, inValue, min, max) => {
      outArray[outIdx] = 255.0 * (inValue - min) / (max - min);
    };
    let dataTypeToUse = VtkDataTypes.UNSIGNED_CHAR;
    let numCompsToUse = 1;
    let encodedScalars = false;
    if (dataType !== VtkDataTypes.UNSIGNED_CHAR) {
      if (model.context.getExtension('OES_texture_float') &&
          model.context.getExtension('OES_texture_float_linear')) {
        dataTypeToUse = VtkDataTypes.FLOAT;
        volCopyData = (outArray, outIdx, inValue, min, max) => {
          outArray[outIdx] = (inValue - min) / (max - min);
        };
      } else {
        encodedScalars = true;
        dataTypeToUse = VtkDataTypes.UNSIGNED_CHAR;
        numCompsToUse = 4;
        volCopyData = (outArray, outIdx, inValue, min, max) => {
          let fval = (inValue - min) / (max - min);
          const r = Math.floor(fval * 255.0);
          fval = (fval * 255.0) - r;
          outArray[outIdx] = r;
          const g = Math.floor(fval * 255.0);
          fval = (fval * 255.0) - g;
          outArray[outIdx + 1] = g;
          const b = Math.floor(fval * 255.0);
          outArray[outIdx + 2] = b;
        };
      }
    }

    // Now determine the texture parameters using the arguments.
    publicAPI.getOpenGLDataType(dataTypeToUse);
    publicAPI.getInternalFormat(dataTypeToUse, numCompsToUse);
    publicAPI.getFormat(dataTypeToUse, numCompsToUse);

    if (!model.internalFormat || !model.format || !model.openGLDataType) {
      vtkErrorMacro('Failed to determine texture parameters.');
      return false;
    }

    model.target = model.context.TEXTURE_2D;
    model.components = numCompsToUse;
    model.depth = 1;
    model.numberOfDimensions = 2;

    // have to pack this 3D texture into pot 2D texture
    const maxTexDim = model.context.getParameter(model.context.MAX_TEXTURE_SIZE);
    const numPixelsIn = width * height * depth;

    // compute min and max values
    let min = data[0];
    let max = data[0];
    for (let i = 0; i < numPixelsIn; ++i) {
      min = Math.min(min, data[i]);
      max = Math.max(max, data[i]);
    }
    if (min === max) {
      max = min + 1.0;
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
    const xreps = Math.floor(targetWidth * xstride / width);
    const yreps = Math.ceil(depth / xreps);
    const targetHeight = vtkMath.nearestPowerOfTwo(height * yreps / ystride);

    model.width = targetWidth;
    model.height = targetHeight;
    model.window.activateTexture(publicAPI);
    publicAPI.createTexture();
    publicAPI.bind();

    // store the information, we will need it later
    model.volumeInfo = { encodedScalars, min, max, width, height, depth, xreps, yreps, xstride, ystride };

    // OK stuff the data into the 2d TEXTURE

    // first allocate the new texture
    let newArray;
    const pixCount = targetWidth * targetHeight * numCompsToUse;
    if (dataTypeToUse === VtkDataTypes.FLOAT) {
      newArray = new Float32Array(pixCount);
    } else {
      newArray = new Uint8Array(pixCount);
    }

    // then stuff the data into it, nothing fancy right now
    // for stride
    let outIdx = 0;

    for (let yRep = 0; yRep < yreps; yRep++) {
      const xrepsThisRow = Math.min(xreps, depth - (yRep * xreps));
      const outXContIncr = model.width - (xrepsThisRow * Math.floor(width / xstride));
      for (let inY = 0; inY < height; inY += ystride) {
        for (let xRep = 0; xRep < xrepsThisRow; xRep++) {
          const inOffset = (((yRep * xreps) + xRep) * width * height)
           + (inY * width);
          for (let inX = 0; inX < width; inX += xstride) {
            // copy value
            volCopyData(newArray, outIdx, data[inOffset + inX], min, max);
            outIdx += numCompsToUse;
          }
        }
        outIdx += (outXContIncr * numCompsToUse);
      }
    }

    // Source texture data from the PBO.
    // model.context.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);
    model.context.pixelStorei(model.context.UNPACK_ALIGNMENT, 1);

    model.context.texImage2D(
          model.target,
          0,
          model.internalFormat,
          model.width, model.height,
          0,
          model.format,
          model.openGLDataType,
          newArray);

    publicAPI.deactivate();
    return true;
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
  window: null,
  context: null,
  handle: 0,
  sendParametersTime: null,
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
  maxLevel: 0,
  generateMipmap: false,
};

// ----------------------------------------------------------------------------

export function extend(publicAPI, model, initialValues = {}) {
  Object.assign(model, DEFAULT_VALUES, initialValues);

  // Inheritance
  vtkViewNode.extend(publicAPI, model, initialValues);

  model.sendParametersTime = {};
  macro.obj(model.sendParametersTime);

  // Build VTK API
  macro.set(publicAPI, model, [
    'format',
    'openGLDataType',
  ]);

  macro.setGet(publicAPI, model, [
    'window',
    'context',
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
  ]);

  // Object methods
  vtkOpenGLTexture(publicAPI, model);
}

// ----------------------------------------------------------------------------

export const newInstance = macro.newInstance(extend, 'vtkOpenGLTexture');

// ----------------------------------------------------------------------------

export default { newInstance, extend };
