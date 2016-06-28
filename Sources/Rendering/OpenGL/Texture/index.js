import * as macro from '../../../macro';
import { VTK_WRAP, VTK_FILTER } from './Constants';
import { VTK_DATATYPES } from '../../../Common/Core/DataArray/Constants';
import vtkViewNode from '../../SceneGraph/ViewNode';

// ----------------------------------------------------------------------------
// vtkOpenGLTexture methods
// ----------------------------------------------------------------------------

function vtkOpenGLTexture(publicAPI, model) {
  // Set our className
  model.classHierarchy.push('vtkOpenGLTexture');

  // Builds myself.
  publicAPI.build = (prepass) => {
    if (prepass) {
      if (!model.renderable) {
        return;
      }
    }
  };

  // Renders myself
  publicAPI.render = (prepass) => {
    if (prepass) {
      model.window = publicAPI.getFirstAncestorOfType('vtkOpenGLRenderWindow');
      model.context = model.window.getContext();
      const ren = publicAPI.getFirstAncestorOfType('vtkOpenGLRenderer');
      publicAPI.preRender(ren);
    }
  };

  publicAPI.preRender = (ren) => {
    // sync renderable properties
    if (model.renderable.getInterpolate()) {
      if (model.generateMipmap) {
        publicAPI.setMinificationFilter(VTK_FILTER.LINEAR_MIPMAP_LINEAR);
      } else {
        publicAPI.setMinificationFilter(VTK_FILTER.LINEAR);
      }
      publicAPI.setMagnificationFilter(VTK_FILTER.LINEAR);
    } else {
      publicAPI.setMinificationFilter(VTK_FILTER.NEAREST);
      publicAPI.setMagnificationFilter(VTK_FILTER.NEAREST);
    }
    // create the texture if it is not done already
    if (!model.handle) {
      const input = model.renderable.getInputData();
      const ext = input.getExtent();
      const inScalars = input.getPointData().getScalars();
      if (model.renderable.getInterpolate()) {
        model.generateMipmap = true;
        publicAPI.setMinificationFilter(VTK_FILTER.LINEAR_MIPMAP_LINEAR);
      }
      publicAPI.create2DFromRaw(ext[1] - ext[0] + 1, ext[3] - ext[2] + 1,
        inScalars.getNumberOfComponents(), inScalars.getDataType(), inScalars.getData());
      publicAPI.activate();
      publicAPI.sendParameters();
    } else {
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
  publicAPI.getDefaultDataType = vtkScalarType => {
    // DON'T DEAL with VTK_CHAR as this is platform dependent.
    switch (vtkScalarType) {
      case VTK_DATATYPES.SIGNED_CHAR:
        return model.context.BYTE;
      case VTK_DATATYPES.UNSIGNED_CHAR:
        return model.context.UNSIGNED_BYTE;
      case VTK_DATATYPES.SHORT:
        return model.context.SHORT;
      case VTK_DATATYPES.UNSIGNED_SHORT:
        return model.context.UNSIGNED_SHORT;
      case VTK_DATATYPES.INT:
        return model.context.INT;
      case VTK_DATATYPES.UNSIGNED_INT:
        return model.context.UNSIGNED_INT;
      case VTK_DATATYPES.FLOAT:
      case VTK_DATATYPES.VOID: // used for depth component textures.
      default:
        return model.context.FLOAT;
    }
  };

  //----------------------------------------------------------------------------
  publicAPI.getOpenGLDataType = vtkScalarType => {
    if (!model.openGLDataType) {
      model.openGLDataType = publicAPI.getDefaultDataType(vtkScalarType);
    }

    return model.openGLDataType;
  };

  //----------------------------------------------------------------------------
  publicAPI.getOpenGLFilterMode = (emode) => {
    switch (emode) {
      case VTK_FILTER.NEAREST:
        return model.context.NEAREST;
      case VTK_FILTER.LINEAR:
        return model.context.LINEAR;
      case VTK_FILTER.NEAREST_MIPMAP_NEAREST:
        return model.context.NEAREST_MIPMAP_NEAREST;
      case VTK_FILTER.NEAREST_MIPMAP_LINEAR:
        return model.context.NEAREST_MIPMAP_LINEAR;
      case VTK_FILTER.LINEAR_MIPMAP_NEAREST:
        return model.context.LINEAR_MIPMAP_NEAREST;
      case VTK_FILTER.LINEAR_MIPMAP_LINEAR:
        return model.context.LINEAR_MIPMAP_LINEAR;
      default:
        return model.context.NEAREST;
    }
  };

  //----------------------------------------------------------------------------
  publicAPI.getOpenGLWrapMode = (vtktype) => {
    switch (vtktype) {
      case VTK_WRAP.CLAMP_TO_EDGE:
        return model.context.CLAMP_TO_EDGE;
      case VTK_WRAP.REPEAT:
        return model.context.REPEAT;
      case VTK_WRAP.MIRRORED_REPEAT:
        return model.context.MIRRORED_REPEAT;
      default:
        return model.context.CLAMP_TO_EDGE;
    }
  };

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
  wrapS: VTK_WRAP.REPEAT,
  wrapT: VTK_WRAP.REPEAT,
  wrapR: VTK_WRAP.REPEAT,
  minificationFilter: VTK_FILTER.NEAREST,
  magnificationFilter: VTK_FILTER.NEAREST,
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
  vtkViewNode.extend(publicAPI, model);

  model.sendParametersTime = {};
  macro.obj(model.sendParametersTime);

  // Build VTK API
  macro.set(publicAPI, model, [
    'format',
    'openGLDataType',
  ]);

  macro.setGet(publicAPI, model, [
    'context',
    'keyMatrixTime',
    'minificationFilter',
    'magnificationFilter',
  ]);

  macro.get(publicAPI, model, [
    'components',
  ]);

  // Object methods
  vtkOpenGLTexture(publicAPI, model);
}

// ----------------------------------------------------------------------------

export const newInstance = macro.newInstance(extend);

// ----------------------------------------------------------------------------

export default { newInstance, extend };
