import Constants    from 'vtk.js/Sources/Rendering/OpenGL/Texture/Constants';
import macro        from 'vtk.js/Sources/macro';
import vtkDataArray from 'vtk.js/Sources/Common/Core/DataArray';
import vtkMath      from 'vtk.js/Sources/Common/Core/Math';
import vtkViewNode  from 'vtk.js/Sources/Rendering/SceneGraph/ViewNode';
import { vec3 }     from 'gl-matrix';

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
    if (!model.handle ||
        model.renderable.getMTime() > model.textureBuildTime.getMTime()) {
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
      // if we have Inputdata
      const input = model.renderable.getInputData(0);
      if (input && input.getPointData().getScalars()) {
        const ext = input.getExtent();
        const inScalars = input.getPointData().getScalars();

        // do we have a cube map? Six inputs
        const data = [];
        for (let i = 0; i < 6; ++i) {
          const indata = model.renderable.getInputData(i);
          const scalars = indata ? indata.getPointData().getScalars().getData() : null;
          if (scalars) {
            data.push(scalars);
          }
        }
        if (data.length === 6) {
          publicAPI.createCubeFromRaw(ext[1] - ext[0] + 1, ext[3] - ext[2] + 1,
            inScalars.getNumberOfComponents(), inScalars.getDataType(), data);
        } else {
          if (model.renderable.getInterpolate() && inScalars.getNumberOfComponents() === 4) {
            model.generateMipmap = true;
            publicAPI.setMinificationFilter(Filter.LINEAR_MIPMAP_LINEAR);
          }
          publicAPI.create2DFromRaw(ext[1] - ext[0] + 1, ext[3] - ext[2] + 1,
            inScalars.getNumberOfComponents(), inScalars.getDataType(), inScalars.getData());
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
    if (model.window.getWebgl2()) {
      model.context.texParameteri(model.target, model.context.TEXTURE_WRAP_R,
        publicAPI.getOpenGLWrapMode(model.wrapR));
    }

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
    if (model.window.getWebgl2()) {
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
  publicAPI.getDefaultDataType = (vtkScalarType) => {
    // DON'T DEAL with VTK_CHAR as this is platform dependent.
    if (model.window.getWebgl2()) {
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

    return pixData;
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
        if (data[idx] !== null) {
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
          scaledData[0]);

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
  publicAPI.create3DFromRaw = (width, height, depth, numComps, dataType, data) => {
    // Now determine the texture parameters using the arguments.
    publicAPI.getOpenGLDataType(dataType);
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
    model.window.activateTexture(publicAPI);
    publicAPI.createTexture();
    publicAPI.bind();

    // Source texture data from the PBO.
    // model.context.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);
    // model.context.pixelStorei(model.context.UNPACK_ALIGNMENT, 1);

    model.context.texImage3D(
          model.target,
          0,
          model.internalFormat,
          model.width, model.height, model.depth,
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
  // This method simulates a 3D texture using 2D
  publicAPI.create3DOneComponentFromRaw = (width, height, depth, dataType, data) => {
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

    // store the information, we will need it later
    model.volumeInfo = { min, max, width, height, depth };

    let volCopyData = (outArray, outIdx, inValue, smin, smax) => {
      outArray[outIdx] = inValue;
    };
    let dataTypeToUse = VtkDataTypes.UNSIGNED_CHAR;
    let numCompsToUse = 1;
    let encodedScalars = false;
    if (dataType === VtkDataTypes.UNSIGNED_CHAR) {
      model.volumeInfo.min = 0.0;
      model.volumeInfo.max = 255.0;
    } else if (model.window.getWebgl2() ||
        (model.context.getExtension('OES_texture_float') &&
         model.context.getExtension('OES_texture_float_linear'))) {
      dataTypeToUse = VtkDataTypes.FLOAT;
      volCopyData = (outArray, outIdx, inValue, smin, smax) => {
        outArray[outIdx] = (inValue - smin) / (smax - smin);
      };
    } else {
      encodedScalars = true;
      dataTypeToUse = VtkDataTypes.UNSIGNED_CHAR;
      numCompsToUse = 4;
      volCopyData = (outArray, outIdx, inValue, smin, smax) => {
        let fval = (inValue - smin) / (smax - smin);
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

    if (model.window.getWebgl2()) {
      if (dataType !== VtkDataTypes.UNSIGNED_CHAR) {
        const newArray = new Float32Array(numPixelsIn);
        for (let i = 0; i < numPixelsIn; ++i) {
          newArray[i] = (data[i] - min) / (max - min);
        }
        return publicAPI.create3DFromRaw(width, height, depth, 1, VtkDataTypes.FLOAT, newArray);
      }
      return publicAPI.create3DFromRaw(width, height, depth, 1, dataType, data);
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
  // This method creates a normal/gradient texture for 3D volume
  // rendering
  publicAPI.create3DLighting = (scalarTexture, data, spacing) => {
    const vinfo = scalarTexture.getVolumeInfo();

    const width = vinfo.width;
    const height = vinfo.height;
    const depth = vinfo.depth;

    // have to compute the gradient to get the normal
    // and magnitude
    const tmpArray = new Float32Array(width * height * depth * 4);

    let inPtr = 0;
    let outPtr = 0;
    const sliceSize = width * height;
    const grad = vec3.create();
    vec3.set(grad,
      (data[inPtr + 1] - data[inPtr]) / spacing[0],
      (data[inPtr + width] - data[inPtr]) / spacing[1],
      (data[inPtr + sliceSize] - data[inPtr]) / spacing[2]);
    let minMag = vec3.length(grad);
    let maxMag = -1.0;
    for (let z = 0; z < depth; ++z) {
      let zedge = 0;
      if (z === depth - 1) {
        zedge = -sliceSize;
      }
      for (let y = 0; y < height; ++y) {
        let yedge = 0;
        if (y === height - 1) {
          yedge = -width;
        }
        for (let x = 0; x < width; ++x) {
          let edge = inPtr + zedge + yedge;
          if (x === width - 1) {
            edge--;
          }
          vec3.set(grad,
            (data[edge + 1] - data[edge]) / spacing[0],
            (data[edge + width] - data[edge]) / spacing[1],
            (data[edge + sliceSize] - data[edge]) / spacing[2]);

          const mag = vec3.length(grad);
          minMag = Math.min(mag, minMag);
          maxMag = Math.max(mag, maxMag);

          vec3.normalize(grad, grad);
          tmpArray[outPtr++] = grad[0];
          tmpArray[outPtr++] = grad[1];
          tmpArray[outPtr++] = grad[2];
          tmpArray[outPtr++] = mag;
          inPtr++;
        }
      }
    }

    // store the information, we will need it later
    model.volumeInfo = { min: minMag, max: maxMag };
    let outIdx = 0;

    if (model.window.getWebgl2()) {
      const numPixelsIn = width * height * depth;
      const newArray = new Uint8Array(numPixelsIn * 4);
      for (let p = 0; p < numPixelsIn; ++p) {
        const pp = p * 4;
        newArray[outIdx++] = 127.5 + (127.5 * tmpArray[pp]);
        newArray[outIdx++] = 127.5 + (127.5 * tmpArray[pp + 1]);
        newArray[outIdx++] = 127.5 + (127.5 * tmpArray[pp + 2]);
        // we encode gradient magnitude using sqrt so that
        // we have nonlinear resolution
        newArray[outIdx++] = 255.0 *
          (Math.sqrt(tmpArray[pp + 3] / maxMag));
      }
      return publicAPI.create3DFromRaw(width, height, depth, 4,
        VtkDataTypes.UNSIGNED_CHAR, newArray);
    }

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
    model.depth = 1;
    model.numberOfDimensions = 2;


    // now store the computed values into the packed 2D
    // texture using the same packing as volumeInfo
    model.width = scalarTexture.getWidth();
    model.height = scalarTexture.getHeight();
    const newArray = new Uint8Array(model.width * model.height * 4);

    for (let yRep = 0; yRep < vinfo.yreps; yRep++) {
      const xrepsThisRow = Math.min(vinfo.xreps, depth - (yRep * vinfo.xreps));
      const outXContIncr = model.width - (xrepsThisRow * Math.floor(width / vinfo.xstride));
      for (let inY = 0; inY < height; inY += vinfo.ystride) {
        for (let xRep = 0; xRep < xrepsThisRow; xRep++) {
          const inOffset = 4 * ((((yRep * vinfo.xreps) + xRep) * width * height)
           + (inY * width));
          for (let inX = 0; inX < width; inX += vinfo.xstride) {
            // copy value
            newArray[outIdx++] = 127.5 + (127.5 * tmpArray[inOffset + (inX * 4)]);
            newArray[outIdx++] = 127.5 + (127.5 * tmpArray[inOffset + (inX * 4) + 1]);
            newArray[outIdx++] = 127.5 + (127.5 * tmpArray[inOffset + (inX * 4) + 2]);
            // we encode gradient magnitude using sqrt so that
            // we have nonlinear resolution
            newArray[outIdx++] = 255.0 *
              (Math.sqrt(tmpArray[inOffset + (inX * 4) + 3] / maxMag));
          }
        }
        outIdx += (outXContIncr * 4);
      }
    }

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
  maxLevel: 0,
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
    'target',
  ]);

  // Object methods
  vtkOpenGLTexture(publicAPI, model);
}

// ----------------------------------------------------------------------------

export const newInstance = macro.newInstance(extend, 'vtkOpenGLTexture');

// ----------------------------------------------------------------------------

export default Object.assign({ newInstance, extend }, Constants);
