import { VtkDataTypes } from 'vtk.js/Sources/Common/Core/DataArray/Constants';
import macro from 'vtk.js/Sources/macros';
import { registerViewConstructor } from 'vtk.js/Sources/Rendering/Core/RenderWindow';
import vtkForwardPass from 'vtk.js/Sources/Rendering/OpenGL/ForwardPass';
import vtkOpenGLHardwareSelector from 'vtk.js/Sources/Rendering/OpenGL/HardwareSelector';
import vtkShaderCache from 'vtk.js/Sources/Rendering/OpenGL/ShaderCache';
import vtkOpenGLTextureUnitManager from 'vtk.js/Sources/Rendering/OpenGL/TextureUnitManager';
import vtkOpenGLViewNodeFactory from 'vtk.js/Sources/Rendering/OpenGL/ViewNodeFactory';
import vtkRenderPass from 'vtk.js/Sources/Rendering/SceneGraph/RenderPass';
import vtkRenderWindowViewNode from 'vtk.js/Sources/Rendering/SceneGraph/RenderWindowViewNode';

const { vtkDebugMacro, vtkErrorMacro } = macro;

const SCREENSHOT_PLACEHOLDER = {
  position: 'absolute',
  top: 0,
  left: 0,
  width: '100%',
  height: '100%',
};

const DEFAULT_RESET_FACTORS = {
  vr: {
    rescaleFactor: 1.0,
    translateZ: -0.7, // 0.7 m forward from the camera
  },
  ar: {
    rescaleFactor: 0.25, // scale down AR for viewing comfort by default
    translateZ: -0.5, // 0.5 m forward from the camera
  },
};

function checkRenderTargetSupport(gl, format, type) {
  // create temporary frame buffer and texture
  const framebuffer = gl.createFramebuffer();
  const texture = gl.createTexture();

  gl.bindTexture(gl.TEXTURE_2D, texture);
  gl.texImage2D(gl.TEXTURE_2D, 0, format, 2, 2, 0, format, type, null);

  gl.bindFramebuffer(gl.FRAMEBUFFER, framebuffer);
  gl.framebufferTexture2D(
    gl.FRAMEBUFFER,
    gl.COLOR_ATTACHMENT0,
    gl.TEXTURE_2D,
    texture,
    0
  );

  // check frame buffer status
  const status = gl.checkFramebufferStatus(gl.FRAMEBUFFER);

  // clean up
  gl.bindFramebuffer(gl.FRAMEBUFFER, null);
  gl.bindTexture(gl.TEXTURE_2D, null);

  return status === gl.FRAMEBUFFER_COMPLETE;
}

// ----------------------------------------------------------------------------
// Monitor the usage of GL context across vtkOpenGLRenderWindow instances
// ----------------------------------------------------------------------------

let GL_CONTEXT_COUNT = 0;
const GL_CONTEXT_LISTENERS = [];

function createGLContext() {
  GL_CONTEXT_COUNT++;
  GL_CONTEXT_LISTENERS.forEach((cb) => cb(GL_CONTEXT_COUNT));
}

function deleteGLContext() {
  GL_CONTEXT_COUNT--;
  GL_CONTEXT_LISTENERS.forEach((cb) => cb(GL_CONTEXT_COUNT));
}

export function pushMonitorGLContextCount(cb) {
  GL_CONTEXT_LISTENERS.push(cb);
}

export function popMonitorGLContextCount(cb) {
  return GL_CONTEXT_LISTENERS.pop();
}

// ----------------------------------------------------------------------------
// vtkOpenGLRenderWindow methods
// ----------------------------------------------------------------------------

function vtkOpenGLRenderWindow(publicAPI, model) {
  // Set our className
  model.classHierarchy.push('vtkOpenGLRenderWindow');

  publicAPI.getViewNodeFactory = () => model.myFactory;

  // Auto update style
  const previousSize = [0, 0];
  function updateWindow() {
    // Canvas size
    if (model.renderable) {
      if (
        model.size[0] !== previousSize[0] ||
        model.size[1] !== previousSize[1]
      ) {
        previousSize[0] = model.size[0];
        previousSize[1] = model.size[1];
        model.canvas.setAttribute('width', model.size[0]);
        model.canvas.setAttribute('height', model.size[1]);
      }
    }

    // ImageStream size
    if (model.viewStream) {
      // If same size that's a NoOp
      model.viewStream.setSize(model.size[0], model.size[1]);
    }

    // Offscreen ?
    model.canvas.style.display = model.useOffScreen ? 'none' : 'block';

    // Cursor type
    if (model.el) {
      model.el.style.cursor = model.cursorVisibility ? model.cursor : 'none';
    }

    // Invalidate cached DOM container size
    model.containerSize = null;
  }
  publicAPI.onModified(updateWindow);

  // Builds myself.
  publicAPI.buildPass = (prepass) => {
    if (prepass) {
      if (!model.renderable) {
        return;
      }

      publicAPI.prepareNodes();
      publicAPI.addMissingNodes(model.renderable.getRenderersByReference());
      publicAPI.removeUnusedNodes();

      publicAPI.initialize();
      model.children.forEach((child) => {
        child.setOpenGLRenderWindow(publicAPI);
      });
    }
  };

  publicAPI.initialize = () => {
    if (!model.initialized) {
      model.context = publicAPI.get3DContext();
      model.textureUnitManager = vtkOpenGLTextureUnitManager.newInstance();
      model.textureUnitManager.setContext(model.context);
      model.shaderCache.setContext(model.context);
      // initialize blending for transparency
      const gl = model.context;
      gl.blendFuncSeparate(
        gl.SRC_ALPHA,
        gl.ONE_MINUS_SRC_ALPHA,
        gl.ONE,
        gl.ONE_MINUS_SRC_ALPHA
      );
      gl.depthFunc(gl.LEQUAL);
      gl.enable(gl.BLEND);
      model.initialized = true;
    }
  };

  publicAPI.makeCurrent = () => {
    model.context.makeCurrent();
  };

  publicAPI.setContainer = (el) => {
    if (model.el && model.el !== el) {
      if (model.canvas.parentNode !== model.el) {
        vtkErrorMacro('Error: canvas parent node does not match container');
      }

      // Remove canvas from previous container
      model.el.removeChild(model.canvas);

      // If the renderer has previously added
      // a background image, remove it from the DOM.
      if (model.el.contains(model.bgImage)) {
        model.el.removeChild(model.bgImage);
      }
    }

    if (model.el !== el) {
      model.el = el;
      if (model.el) {
        model.el.appendChild(model.canvas);

        // If the renderer is set to use a background
        // image, attach it to the DOM.
        if (model.useBackgroundImage) {
          model.el.appendChild(model.bgImage);
        }
      }

      // Trigger modified()
      publicAPI.modified();
    }
  };

  publicAPI.getContainer = () => model.el;

  publicAPI.getContainerSize = () => {
    if (!model.containerSize && model.el) {
      const { width, height } = model.el.getBoundingClientRect();
      model.containerSize = [width, height];
    }
    return model.containerSize || model.size;
  };

  publicAPI.getFramebufferSize = () => {
    if (model.activeFramebuffer) {
      return model.activeFramebuffer.getSize();
    }
    return model.size;
  };

  publicAPI.getPixelData = (x1, y1, x2, y2) => {
    const pixels = new Uint8Array((x2 - x1 + 1) * (y2 - y1 + 1) * 4);
    model.context.readPixels(
      x1,
      y1,
      x2 - x1 + 1,
      y2 - y1 + 1,
      model.context.RGBA,
      model.context.UNSIGNED_BYTE,
      pixels
    );
    return pixels;
  };

  publicAPI.get3DContext = (
    options = {
      preserveDrawingBuffer: false,
      depth: true,
      alpha: true,
      powerPreference: 'high-performance',
    }
  ) => {
    let result = null;

    // Do we have webxr support
    if (
      navigator.xr !== undefined &&
      navigator.xr.isSessionSupported('immersive-vr')
    ) {
      publicAPI.invokeHaveVRDisplay();
    }

    const webgl2Supported = typeof WebGL2RenderingContext !== 'undefined';
    model.webgl2 = false;
    if (model.defaultToWebgl2 && webgl2Supported) {
      result = model.canvas.getContext('webgl2', options);
      if (result) {
        model.webgl2 = true;
        vtkDebugMacro('using webgl2');
      }
    }
    if (!result) {
      vtkDebugMacro('using webgl1');
      result =
        model.canvas.getContext('webgl', options) ||
        model.canvas.getContext('experimental-webgl', options);
    }

    // prevent default context lost handler
    model.canvas.addEventListener(
      'webglcontextlost',
      (event) => {
        event.preventDefault();
      },
      false
    );

    model.canvas.addEventListener(
      'webglcontextrestored',
      publicAPI.restoreContext,
      false
    );

    return result;
  };

  // Request an XR session on the user device with WebXR,
  // typically in response to a user request such as a button press
  publicAPI.startXR = (isAR) => {
    if (navigator.xr === undefined) {
      throw new Error('WebXR is not available');
    }

    model.xrSessionIsAR = isAR;
    const sessionType = isAR ? 'immersive-ar' : 'immersive-vr';
    if (!navigator.xr.isSessionSupported(sessionType)) {
      if (isAR) {
        throw new Error('Device does not support AR session');
      } else {
        throw new Error('VR display is not available');
      }
    }
    if (model.xrSession === null) {
      navigator.xr.requestSession(sessionType).then(publicAPI.enterXR, () => {
        throw new Error('Failed to create XR session!');
      });
    } else {
      throw new Error('XR Session already exists!');
    }
  };

  // When an XR session is available, set up the XRWebGLLayer
  // and request the first animation frame for the device
  publicAPI.enterXR = async (xrSession) => {
    model.xrSession = xrSession;
    model.oldCanvasSize = model.size.slice();

    if (model.xrSession !== null) {
      const gl = publicAPI.get3DContext();
      await gl.makeXRCompatible();

      const glLayer = new global.XRWebGLLayer(model.xrSession, gl);
      publicAPI.setSize(glLayer.framebufferWidth, glLayer.framebufferHeight);

      model.xrSession.updateRenderState({
        baseLayer: glLayer,
      });

      model.xrSession.requestReferenceSpace('local').then((refSpace) => {
        model.xrReferenceSpace = refSpace;
      });

      publicAPI.resetXRScene();

      model.renderable.getInteractor().switchToXRAnimation();
      model.xrSceneFrame = model.xrSession.requestAnimationFrame(
        publicAPI.xrRender
      );
    } else {
      throw new Error('Failed to enter VR with a null xrSession.');
    }
  };

  publicAPI.resetXRScene = (
    inputRescaleFactor = DEFAULT_RESET_FACTORS.vr.rescaleFactor,
    inputTranslateZ = DEFAULT_RESET_FACTORS.vr.translateZ
  ) => {
    // Adjust world-to-physical parameters for different modalities
    // Default parameter values are for VR (model.xrSessionIsAR == false)
    let rescaleFactor = inputRescaleFactor;
    let translateZ = inputTranslateZ;

    if (
      model.xrSessionIsAR &&
      rescaleFactor === DEFAULT_RESET_FACTORS.vr.rescaleFactor
    ) {
      // Scale down by default in AR
      rescaleFactor = DEFAULT_RESET_FACTORS.ar.rescaleFactor;
    }

    if (
      model.xrSessionIsAR &&
      translateZ === DEFAULT_RESET_FACTORS.vr.translateZ
    ) {
      // Default closer to the camera in AR
      translateZ = DEFAULT_RESET_FACTORS.ar.translateZ;
    }

    const ren = model.renderable.getRenderers()[0];
    ren.resetCamera();

    const camera = ren.getActiveCamera();
    let physicalScale = camera.getPhysicalScale();
    const physicalTranslation = camera.getPhysicalTranslation();

    physicalScale /= rescaleFactor;
    translateZ *= physicalScale;
    physicalTranslation[2] += translateZ;

    camera.setPhysicalScale(physicalScale);
    camera.setPhysicalTranslation(physicalTranslation);
    // Clip at 0.1m, 100.0m in physical space by default
    camera.setClippingRange(0.1 * physicalScale, 100.0 * physicalScale);
  };

  publicAPI.stopXR = async () => {
    if (navigator.xr === undefined) {
      // WebXR polyfill not available so nothing to do
      return;
    }

    if (model.xrSession !== null) {
      model.xrSession.cancelAnimationFrame(model.xrSceneFrame);
      model.renderable.getInteractor().returnFromXRAnimation();
      const gl = publicAPI.get3DContext();
      gl.bindFramebuffer(gl.FRAMEBUFFER, null);

      await model.xrSession.end().catch((error) => {
        if (!(error instanceof DOMException)) {
          throw error;
        }
      });
      model.xrSession = null;
    }

    if (model.oldCanvasSize !== undefined) {
      publicAPI.setSize(...model.oldCanvasSize);
    }

    // Reset to default canvas
    const ren = model.renderable.getRenderers()[0];
    ren.getActiveCamera().setProjectionMatrix(null);
    ren.resetCamera();

    ren.setViewport(0.0, 0, 1.0, 1.0);
    publicAPI.traverseAllPasses();
  };

  publicAPI.xrRender = async (t, frame) => {
    const xrSession = frame.session;

    model.renderable
      .getInteractor()
      .updateXRGamepads(xrSession, frame, model.xrReferenceSpace);

    model.xrSceneFrame = model.xrSession.requestAnimationFrame(
      publicAPI.xrRender
    );

    const xrPose = frame.getViewerPose(model.xrReferenceSpace);

    if (xrPose) {
      const gl = publicAPI.get3DContext();

      if (model.xrSessionIsAR && model.oldCanvasSize !== undefined) {
        gl.canvas.width = model.oldCanvasSize[0];
        gl.canvas.height = model.oldCanvasSize[1];
      }

      const glLayer = xrSession.renderState.baseLayer;
      gl.bindFramebuffer(gl.FRAMEBUFFER, glLayer.framebuffer);
      gl.clear(gl.COLOR_BUFFER_BIT);
      gl.clear(gl.DEPTH_BUFFER_BIT);

      // get the first renderer
      const ren = model.renderable.getRenderers()[0];

      // Do a render pass for each eye
      xrPose.views.forEach((view) => {
        const viewport = glLayer.getViewport(view);

        gl.viewport(viewport.x, viewport.y, viewport.width, viewport.height);

        // TODO: Appropriate handling for AR passthrough on HMDs
        // with two eyes will require further investigation.
        if (!model.xrSessionIsAR) {
          if (view.eye === 'left') {
            ren.setViewport(0, 0, 0.5, 1.0);
          } else if (view.eye === 'right') {
            ren.setViewport(0.5, 0, 1.0, 1.0);
          } else {
            // No handling for non-eye viewport
            return;
          }
        }

        ren
          .getActiveCamera()
          .computeViewParametersFromPhysicalMatrix(
            view.transform.inverse.matrix
          );
        ren.getActiveCamera().setProjectionMatrix(view.projectionMatrix);

        publicAPI.traverseAllPasses();
      });
    }
  };

  publicAPI.restoreContext = () => {
    const rp = vtkRenderPass.newInstance();
    rp.setCurrentOperation('Release');
    rp.traverse(publicAPI, null);
  };

  publicAPI.activateTexture = (texture) => {
    // Only add if it isn't already there
    const result = model._textureResourceIds.get(texture);
    if (result !== undefined) {
      model.context.activeTexture(model.context.TEXTURE0 + result);
      return;
    }

    const activeUnit = publicAPI.getTextureUnitManager().allocate();
    if (activeUnit < 0) {
      vtkErrorMacro(
        'Hardware does not support the number of textures defined.'
      );
      return;
    }

    model._textureResourceIds.set(texture, activeUnit);
    model.context.activeTexture(model.context.TEXTURE0 + activeUnit);
  };

  publicAPI.deactivateTexture = (texture) => {
    // Only deactivate if it isn't already there
    const result = model._textureResourceIds.get(texture);
    if (result !== undefined) {
      publicAPI.getTextureUnitManager().free(result);
      delete model._textureResourceIds.delete(texture);
    }
  };

  publicAPI.getTextureUnitForTexture = (texture) => {
    const result = model._textureResourceIds.get(texture);
    if (result !== undefined) {
      return result;
    }
    return -1;
  };

  publicAPI.getDefaultTextureInternalFormat = (vtktype, numComps, useFloat) => {
    if (model.webgl2) {
      switch (vtktype) {
        case VtkDataTypes.UNSIGNED_CHAR:
          switch (numComps) {
            case 1:
              return model.context.R8;
            case 2:
              return model.context.RG8;
            case 3:
              return model.context.RGB8;
            case 4:
            default:
              return model.context.RGBA8;
          }
        case VtkDataTypes.FLOAT:
        default:
          switch (numComps) {
            case 1:
              return model.context.R16F;
            case 2:
              return model.context.RG16F;
            case 3:
              return model.context.RGB16F;
            case 4:
            default:
              return model.context.RGBA16F;
          }
      }
    }

    // webgl1 only supports four types
    switch (numComps) {
      case 1:
        return model.context.LUMINANCE;
      case 2:
        return model.context.LUMINANCE_ALPHA;
      case 3:
        return model.context.RGB;
      case 4:
      default:
        return model.context.RGBA;
    }
  };

  publicAPI.setBackgroundImage = (img) => {
    model.bgImage.src = img.src;
  };

  publicAPI.setUseBackgroundImage = (value) => {
    model.useBackgroundImage = value;

    // Add or remove the background image from the
    // DOM as specified.
    if (model.useBackgroundImage && !model.el.contains(model.bgImage)) {
      model.el.appendChild(model.bgImage);
    } else if (!model.useBackgroundImage && model.el.contains(model.bgImage)) {
      model.el.removeChild(model.bgImage);
    }
  };

  function getCanvasDataURL(format = model.imageFormat) {
    // Copy current canvas to not modify the original
    const temporaryCanvas = document.createElement('canvas');
    const temporaryContext = temporaryCanvas.getContext('2d');
    temporaryCanvas.width = model.canvas.width;
    temporaryCanvas.height = model.canvas.height;
    temporaryContext.drawImage(model.canvas, 0, 0);

    // Get current client rect to place canvas
    const mainBoundingClientRect = model.canvas.getBoundingClientRect();

    const renderWindow = model.renderable;
    const renderers = renderWindow.getRenderers();
    renderers.forEach((renderer) => {
      const viewProps = renderer.getViewProps();
      viewProps.forEach((viewProp) => {
        // Check if the prop has a container that should have canvas
        if (viewProp.getContainer) {
          const container = viewProp.getContainer();
          const canvasList = container.getElementsByTagName('canvas');
          // Go throughout all canvas and copy it into temporary main canvas
          for (let i = 0; i < canvasList.length; i++) {
            const currentCanvas = canvasList[i];
            const boundingClientRect = currentCanvas.getBoundingClientRect();
            const newXPosition =
              boundingClientRect.x - mainBoundingClientRect.x;
            const newYPosition =
              boundingClientRect.y - mainBoundingClientRect.y;
            temporaryContext.drawImage(
              currentCanvas,
              newXPosition,
              newYPosition
            );
          }
        }
      });
    });

    const screenshot = temporaryCanvas.toDataURL(format);
    temporaryCanvas.remove();
    publicAPI.invokeImageReady(screenshot);
  }

  publicAPI.captureNextImage = (
    format = 'image/png',
    { resetCamera = false, size = null, scale = 1 } = {}
  ) => {
    if (model.deleted) {
      return null;
    }
    model.imageFormat = format;
    const previous = model.notifyStartCaptureImage;
    model.notifyStartCaptureImage = true;

    model._screenshot = {
      size:
        !!size || scale !== 1
          ? size || model.size.map((val) => val * scale)
          : null,
    };

    return new Promise((resolve, reject) => {
      const subscription = publicAPI.onImageReady((imageURL) => {
        if (model._screenshot.size === null) {
          model.notifyStartCaptureImage = previous;
          subscription.unsubscribe();
          if (model._screenshot.placeHolder) {
            // resize the main canvas back to its original size and show it
            model.size = model._screenshot.originalSize;

            // process the resize
            publicAPI.modified();

            // restore the saved camera parameters, if applicable
            if (model._screenshot.cameras) {
              model._screenshot.cameras.forEach(({ restoreParamsFn, arg }) =>
                restoreParamsFn(arg)
              );
            }

            // Trigger a render at the original size
            publicAPI.traverseAllPasses();

            // Remove and clean up the placeholder, revealing the original
            model.el.removeChild(model._screenshot.placeHolder);
            model._screenshot.placeHolder.remove();
            model._screenshot = null;
          }
          resolve(imageURL);
        } else {
          // Create a placeholder image overlay while we resize and render
          const tmpImg = document.createElement('img');
          tmpImg.style = SCREENSHOT_PLACEHOLDER;
          tmpImg.src = imageURL;
          model._screenshot.placeHolder = model.el.appendChild(tmpImg);

          // hide the main canvas
          model.canvas.style.display = 'none';

          // remember the main canvas original size, then resize it
          model._screenshot.originalSize = model.size;
          model.size = model._screenshot.size;
          model._screenshot.size = null;

          // process the resize
          publicAPI.modified();

          if (resetCamera) {
            const isUserResetCamera = resetCamera !== true;

            // If resetCamera was requested, we first save camera parameters
            // from all the renderers, so we can restore them later
            model._screenshot.cameras = model.renderable
              .getRenderers()
              .map((renderer) => {
                const camera = renderer.getActiveCamera();
                const params = camera.get(
                  'focalPoint',
                  'position',
                  'parallelScale'
                );

                return {
                  resetCameraArgs: isUserResetCamera ? { renderer } : undefined,
                  resetCameraFn: isUserResetCamera
                    ? resetCamera
                    : renderer.resetCamera,
                  restoreParamsFn: camera.set,
                  // "clone" the params so we don't keep refs to properties
                  arg: JSON.parse(JSON.stringify(params)),
                };
              });

            // Perform the resetCamera() on each renderer only after capturing
            // the params from all active cameras, in case there happen to be
            // linked cameras among the renderers.
            model._screenshot.cameras.forEach(
              ({ resetCameraFn, resetCameraArgs }) =>
                resetCameraFn(resetCameraArgs)
            );
          }

          // Trigger a render at the custom size
          publicAPI.traverseAllPasses();
        }
      });
    });
  };

  publicAPI.getHardwareMaximumLineWidth = () => {
    const gl = publicAPI.get3DContext();
    const lineWidthRange = gl.getParameter(gl.ALIASED_LINE_WIDTH_RANGE);
    return lineWidthRange[1];
  };

  publicAPI.getGLInformations = () => {
    const gl = publicAPI.get3DContext();

    const glTextureFloat = gl.getExtension('OES_texture_float');
    const glTextureHalfFloat = gl.getExtension('OES_texture_half_float');
    const glDebugRendererInfo = gl.getExtension('WEBGL_debug_renderer_info');
    const glDrawBuffers = gl.getExtension('WEBGL_draw_buffers');
    const glAnisotropic =
      gl.getExtension('EXT_texture_filter_anisotropic') ||
      gl.getExtension('WEBKIT_EXT_texture_filter_anisotropic');

    const params = [
      [
        'Max Vertex Attributes',
        'MAX_VERTEX_ATTRIBS',
        gl.getParameter(gl.MAX_VERTEX_ATTRIBS),
      ],
      [
        'Max Varying Vectors',
        'MAX_VARYING_VECTORS',
        gl.getParameter(gl.MAX_VARYING_VECTORS),
      ],
      [
        'Max Vertex Uniform Vectors',
        'MAX_VERTEX_UNIFORM_VECTORS',
        gl.getParameter(gl.MAX_VERTEX_UNIFORM_VECTORS),
      ],
      [
        'Max Fragment Uniform Vectors',
        'MAX_FRAGMENT_UNIFORM_VECTORS',
        gl.getParameter(gl.MAX_FRAGMENT_UNIFORM_VECTORS),
      ],
      [
        'Max Fragment Texture Image Units',
        'MAX_TEXTURE_IMAGE_UNITS',
        gl.getParameter(gl.MAX_TEXTURE_IMAGE_UNITS),
      ],
      [
        'Max Vertex Texture Image Units',
        'MAX_VERTEX_TEXTURE_IMAGE_UNITS',
        gl.getParameter(gl.MAX_VERTEX_TEXTURE_IMAGE_UNITS),
      ],
      [
        'Max Combined Texture Image Units',
        'MAX_COMBINED_TEXTURE_IMAGE_UNITS',
        gl.getParameter(gl.MAX_COMBINED_TEXTURE_IMAGE_UNITS),
      ],
      [
        'Max 2D Texture Size',
        'MAX_TEXTURE_SIZE',
        gl.getParameter(gl.MAX_TEXTURE_SIZE),
      ],
      [
        'Max Cube Texture Size',
        'MAX_CUBE_MAP_TEXTURE_SIZE',
        gl.getParameter(gl.MAX_CUBE_MAP_TEXTURE_SIZE),
      ],
      [
        'Max Texture Anisotropy',
        'MAX_TEXTURE_MAX_ANISOTROPY_EXT',
        glAnisotropic &&
          gl.getParameter(glAnisotropic.MAX_TEXTURE_MAX_ANISOTROPY_EXT),
      ],
      [
        'Point Size Range',
        'ALIASED_POINT_SIZE_RANGE',
        gl.getParameter(gl.ALIASED_POINT_SIZE_RANGE).join(' - '),
      ],
      [
        'Line Width Range',
        'ALIASED_LINE_WIDTH_RANGE',
        gl.getParameter(gl.ALIASED_LINE_WIDTH_RANGE).join(' - '),
      ],
      [
        'Max Viewport Dimensions',
        'MAX_VIEWPORT_DIMS',
        gl.getParameter(gl.MAX_VIEWPORT_DIMS).join(' - '),
      ],
      [
        'Max Renderbuffer Size',
        'MAX_RENDERBUFFER_SIZE',
        gl.getParameter(gl.MAX_RENDERBUFFER_SIZE),
      ],
      ['Framebuffer Red Bits', 'RED_BITS', gl.getParameter(gl.RED_BITS)],
      ['Framebuffer Green Bits', 'GREEN_BITS', gl.getParameter(gl.GREEN_BITS)],
      ['Framebuffer Blue Bits', 'BLUE_BITS', gl.getParameter(gl.BLUE_BITS)],
      ['Framebuffer Alpha Bits', 'ALPHA_BITS', gl.getParameter(gl.ALPHA_BITS)],
      ['Framebuffer Depth Bits', 'DEPTH_BITS', gl.getParameter(gl.DEPTH_BITS)],
      [
        'Framebuffer Stencil Bits',
        'STENCIL_BITS',
        gl.getParameter(gl.STENCIL_BITS),
      ],
      [
        'Framebuffer Subpixel Bits',
        'SUBPIXEL_BITS',
        gl.getParameter(gl.SUBPIXEL_BITS),
      ],
      ['MSAA Samples', 'SAMPLES', gl.getParameter(gl.SAMPLES)],
      [
        'MSAA Sample Buffers',
        'SAMPLE_BUFFERS',
        gl.getParameter(gl.SAMPLE_BUFFERS),
      ],
      [
        'Supported Formats for UByte Render Targets     ',
        'UNSIGNED_BYTE RENDER TARGET FORMATS',
        [
          glTextureFloat &&
          checkRenderTargetSupport(gl, gl.RGBA, gl.UNSIGNED_BYTE)
            ? 'RGBA'
            : '',
          glTextureFloat &&
          checkRenderTargetSupport(gl, gl.RGB, gl.UNSIGNED_BYTE)
            ? 'RGB'
            : '',
          glTextureFloat &&
          checkRenderTargetSupport(gl, gl.LUMINANCE, gl.UNSIGNED_BYTE)
            ? 'LUMINANCE'
            : '',
          glTextureFloat &&
          checkRenderTargetSupport(gl, gl.ALPHA, gl.UNSIGNED_BYTE)
            ? 'ALPHA'
            : '',
          glTextureFloat &&
          checkRenderTargetSupport(gl, gl.LUMINANCE_ALPHA, gl.UNSIGNED_BYTE)
            ? 'LUMINANCE_ALPHA'
            : '',
        ].join(' '),
      ],
      [
        'Supported Formats for Half Float Render Targets',
        'HALF FLOAT RENDER TARGET FORMATS',
        [
          glTextureHalfFloat &&
          checkRenderTargetSupport(
            gl,
            gl.RGBA,
            glTextureHalfFloat.HALF_FLOAT_OES
          )
            ? 'RGBA'
            : '',
          glTextureHalfFloat &&
          checkRenderTargetSupport(
            gl,
            gl.RGB,
            glTextureHalfFloat.HALF_FLOAT_OES
          )
            ? 'RGB'
            : '',
          glTextureHalfFloat &&
          checkRenderTargetSupport(
            gl,
            gl.LUMINANCE,
            glTextureHalfFloat.HALF_FLOAT_OES
          )
            ? 'LUMINANCE'
            : '',
          glTextureHalfFloat &&
          checkRenderTargetSupport(
            gl,
            gl.ALPHA,
            glTextureHalfFloat.HALF_FLOAT_OES
          )
            ? 'ALPHA'
            : '',
          glTextureHalfFloat &&
          checkRenderTargetSupport(
            gl,
            gl.LUMINANCE_ALPHA,
            glTextureHalfFloat.HALF_FLOAT_OES
          )
            ? 'LUMINANCE_ALPHA'
            : '',
        ].join(' '),
      ],
      [
        'Supported Formats for Full Float Render Targets',
        'FLOAT RENDER TARGET FORMATS',
        [
          glTextureFloat && checkRenderTargetSupport(gl, gl.RGBA, gl.FLOAT)
            ? 'RGBA'
            : '',
          glTextureFloat && checkRenderTargetSupport(gl, gl.RGB, gl.FLOAT)
            ? 'RGB'
            : '',
          glTextureFloat && checkRenderTargetSupport(gl, gl.LUMINANCE, gl.FLOAT)
            ? 'LUMINANCE'
            : '',
          glTextureFloat && checkRenderTargetSupport(gl, gl.ALPHA, gl.FLOAT)
            ? 'ALPHA'
            : '',
          glTextureFloat &&
          checkRenderTargetSupport(gl, gl.LUMINANCE_ALPHA, gl.FLOAT)
            ? 'LUMINANCE_ALPHA'
            : '',
        ].join(' '),
      ],
      [
        'Max Multiple Render Targets Buffers',
        'MAX_DRAW_BUFFERS_WEBGL',
        glDrawBuffers
          ? gl.getParameter(glDrawBuffers.MAX_DRAW_BUFFERS_WEBGL)
          : 0,
      ],
      [
        'High Float Precision in Vertex Shader',
        'HIGH_FLOAT VERTEX_SHADER',
        [
          gl.getShaderPrecisionFormat(gl.VERTEX_SHADER, gl.HIGH_FLOAT)
            .precision,
          ' (-2<sup>',
          gl.getShaderPrecisionFormat(gl.VERTEX_SHADER, gl.HIGH_FLOAT).rangeMin,
          '</sup> - 2<sup>',
          gl.getShaderPrecisionFormat(gl.VERTEX_SHADER, gl.HIGH_FLOAT).rangeMax,
          '</sup>)',
        ].join(''),
      ],
      [
        'Medium Float Precision in Vertex Shader',
        'MEDIUM_FLOAT VERTEX_SHADER',
        [
          gl.getShaderPrecisionFormat(gl.VERTEX_SHADER, gl.MEDIUM_FLOAT)
            .precision,
          ' (-2<sup>',
          gl.getShaderPrecisionFormat(gl.VERTEX_SHADER, gl.MEDIUM_FLOAT)
            .rangeMin,
          '</sup> - 2<sup>',
          gl.getShaderPrecisionFormat(gl.VERTEX_SHADER, gl.MEDIUM_FLOAT)
            .rangeMax,
          '</sup>)',
        ].join(''),
      ],
      [
        'Low Float Precision in Vertex Shader',
        'LOW_FLOAT VERTEX_SHADER',
        [
          gl.getShaderPrecisionFormat(gl.VERTEX_SHADER, gl.LOW_FLOAT).precision,
          ' (-2<sup>',
          gl.getShaderPrecisionFormat(gl.VERTEX_SHADER, gl.LOW_FLOAT).rangeMin,
          '</sup> - 2<sup>',
          gl.getShaderPrecisionFormat(gl.VERTEX_SHADER, gl.LOW_FLOAT).rangeMax,
          '</sup>)',
        ].join(''),
      ],
      [
        'High Float Precision in Fragment Shader',
        'HIGH_FLOAT FRAGMENT_SHADER',
        [
          gl.getShaderPrecisionFormat(gl.FRAGMENT_SHADER, gl.HIGH_FLOAT)
            .precision,
          ' (-2<sup>',
          gl.getShaderPrecisionFormat(gl.FRAGMENT_SHADER, gl.HIGH_FLOAT)
            .rangeMin,
          '</sup> - 2<sup>',
          gl.getShaderPrecisionFormat(gl.FRAGMENT_SHADER, gl.HIGH_FLOAT)
            .rangeMax,
          '</sup>)',
        ].join(''),
      ],
      [
        'Medium Float Precision in Fragment Shader',
        'MEDIUM_FLOAT FRAGMENT_SHADER',
        [
          gl.getShaderPrecisionFormat(gl.FRAGMENT_SHADER, gl.MEDIUM_FLOAT)
            .precision,
          ' (-2<sup>',
          gl.getShaderPrecisionFormat(gl.FRAGMENT_SHADER, gl.MEDIUM_FLOAT)
            .rangeMin,
          '</sup> - 2<sup>',
          gl.getShaderPrecisionFormat(gl.FRAGMENT_SHADER, gl.MEDIUM_FLOAT)
            .rangeMax,
          '</sup>)',
        ].join(''),
      ],
      [
        'Low Float Precision in Fragment Shader',
        'LOW_FLOAT FRAGMENT_SHADER',
        [
          gl.getShaderPrecisionFormat(gl.FRAGMENT_SHADER, gl.LOW_FLOAT)
            .precision,
          ' (-2<sup>',
          gl.getShaderPrecisionFormat(gl.FRAGMENT_SHADER, gl.LOW_FLOAT)
            .rangeMin,
          '</sup> - 2<sup>',
          gl.getShaderPrecisionFormat(gl.FRAGMENT_SHADER, gl.LOW_FLOAT)
            .rangeMax,
          '</sup>)',
        ].join(''),
      ],
      [
        'High Int Precision in Vertex Shader',
        'HIGH_INT VERTEX_SHADER',
        [
          gl.getShaderPrecisionFormat(gl.VERTEX_SHADER, gl.HIGH_INT).precision,
          ' (-2<sup>',
          gl.getShaderPrecisionFormat(gl.VERTEX_SHADER, gl.HIGH_INT).rangeMin,
          '</sup> - 2<sup>',
          gl.getShaderPrecisionFormat(gl.VERTEX_SHADER, gl.HIGH_INT).rangeMax,
          '</sup>)',
        ].join(''),
      ],
      [
        'Medium Int Precision in Vertex Shader',
        'MEDIUM_INT VERTEX_SHADER',
        [
          gl.getShaderPrecisionFormat(gl.VERTEX_SHADER, gl.MEDIUM_INT)
            .precision,
          ' (-2<sup>',
          gl.getShaderPrecisionFormat(gl.VERTEX_SHADER, gl.MEDIUM_INT).rangeMin,
          '</sup> - 2<sup>',
          gl.getShaderPrecisionFormat(gl.VERTEX_SHADER, gl.MEDIUM_INT).rangeMax,
          '</sup>)',
        ].join(''),
      ],
      [
        'Low Int Precision in Vertex Shader',
        'LOW_INT VERTEX_SHADER',
        [
          gl.getShaderPrecisionFormat(gl.VERTEX_SHADER, gl.LOW_INT).precision,
          ' (-2<sup>',
          gl.getShaderPrecisionFormat(gl.VERTEX_SHADER, gl.LOW_INT).rangeMin,
          '</sup> - 2<sup>',
          gl.getShaderPrecisionFormat(gl.VERTEX_SHADER, gl.LOW_INT).rangeMax,
          '</sup>)',
        ].join(''),
      ],
      [
        'High Int Precision in Fragment Shader',
        'HIGH_INT FRAGMENT_SHADER',
        [
          gl.getShaderPrecisionFormat(gl.FRAGMENT_SHADER, gl.HIGH_INT)
            .precision,
          ' (-2<sup>',
          gl.getShaderPrecisionFormat(gl.FRAGMENT_SHADER, gl.HIGH_INT).rangeMin,
          '</sup> - 2<sup>',
          gl.getShaderPrecisionFormat(gl.FRAGMENT_SHADER, gl.HIGH_INT).rangeMax,
          '</sup>)',
        ].join(''),
      ],
      [
        'Medium Int Precision in Fragment Shader',
        'MEDIUM_INT FRAGMENT_SHADER',
        [
          gl.getShaderPrecisionFormat(gl.FRAGMENT_SHADER, gl.MEDIUM_INT)
            .precision,
          ' (-2<sup>',
          gl.getShaderPrecisionFormat(gl.FRAGMENT_SHADER, gl.MEDIUM_INT)
            .rangeMin,
          '</sup> - 2<sup>',
          gl.getShaderPrecisionFormat(gl.FRAGMENT_SHADER, gl.MEDIUM_INT)
            .rangeMax,
          '</sup>)',
        ].join(''),
      ],
      [
        'Low Int Precision in Fragment Shader',
        'LOW_INT FRAGMENT_SHADER',
        [
          gl.getShaderPrecisionFormat(gl.FRAGMENT_SHADER, gl.LOW_INT).precision,
          ' (-2<sup>',
          gl.getShaderPrecisionFormat(gl.FRAGMENT_SHADER, gl.LOW_INT).rangeMin,
          '</sup> - 2<sup>',
          gl.getShaderPrecisionFormat(gl.FRAGMENT_SHADER, gl.LOW_INT).rangeMax,
          '</sup>)',
        ].join(''),
      ],
      [
        'Supported Extensions',
        'EXTENSIONS',
        gl.getSupportedExtensions().join('<br/>\t\t\t\t\t    '),
      ],
      ['WebGL Renderer', 'RENDERER', gl.getParameter(gl.RENDERER)],
      ['WebGL Vendor', 'VENDOR', gl.getParameter(gl.VENDOR)],
      ['WebGL Version', 'VERSION', gl.getParameter(gl.VERSION)],
      [
        'Shading Language Version',
        'SHADING_LANGUAGE_VERSION',
        gl.getParameter(gl.SHADING_LANGUAGE_VERSION),
      ],
      [
        'Unmasked Renderer',
        'UNMASKED_RENDERER',
        glDebugRendererInfo &&
          gl.getParameter(glDebugRendererInfo.UNMASKED_RENDERER_WEBGL),
      ],
      [
        'Unmasked Vendor',
        'UNMASKED_VENDOR',
        glDebugRendererInfo &&
          gl.getParameter(glDebugRendererInfo.UNMASKED_VENDOR_WEBGL),
      ],
      ['WebGL Version', 'WEBGL_VERSION', model.webgl2 ? 2 : 1],
    ];

    const result = {};
    while (params.length) {
      const [label, key, value] = params.pop();
      if (key) {
        result[key] = { label, value };
      }
    }
    return result;
  };

  publicAPI.traverseAllPasses = () => {
    if (model.renderPasses) {
      for (let index = 0; index < model.renderPasses.length; ++index) {
        model.renderPasses[index].traverse(publicAPI, null);
      }
    }
    if (model.notifyStartCaptureImage) {
      getCanvasDataURL();
    }
  };

  publicAPI.disableCullFace = () => {
    if (model.cullFaceEnabled) {
      model.context.disable(model.context.CULL_FACE);
      model.cullFaceEnabled = false;
    }
  };

  publicAPI.enableCullFace = () => {
    if (!model.cullFaceEnabled) {
      model.context.enable(model.context.CULL_FACE);
      model.cullFaceEnabled = true;
    }
  };

  publicAPI.setViewStream = (stream) => {
    if (model.viewStream === stream) {
      return false;
    }
    if (model.subscription) {
      model.subscription.unsubscribe();
      model.subscription = null;
    }
    model.viewStream = stream;
    if (model.viewStream) {
      // Force background to be transparent + render
      const mainRenderer = model.renderable.getRenderers()[0];
      mainRenderer.getBackgroundByReference()[3] = 0;

      // Enable display of the background image
      publicAPI.setUseBackgroundImage(true);

      // Bind to remote stream
      model.subscription = model.viewStream.onImageReady((e) =>
        publicAPI.setBackgroundImage(e.image)
      );
      model.viewStream.setSize(model.size[0], model.size[1]);
      model.viewStream.invalidateCache();
      model.viewStream.render();

      publicAPI.modified();
    }
    return true;
  };

  publicAPI.createSelector = () => {
    const ret = vtkOpenGLHardwareSelector.newInstance();
    ret.setOpenGLRenderWindow(publicAPI);
    return ret;
  };

  publicAPI.delete = macro.chain(
    publicAPI.delete,
    publicAPI.setViewStream,
    deleteGLContext
  );
}

// ----------------------------------------------------------------------------
// Object factory
// ----------------------------------------------------------------------------

const DEFAULT_VALUES = {
  cullFaceEnabled: false,
  shaderCache: null,
  initialized: false,
  context: null,
  canvas: null,
  cursorVisibility: true,
  cursor: 'pointer',
  textureUnitManager: null,
  textureResourceIds: null,
  containerSize: null,
  renderPasses: [],
  notifyStartCaptureImage: false,
  webgl2: false,
  defaultToWebgl2: true, // attempt webgl2 on by default
  activeFramebuffer: null,
  xrSession: null,
  xrSessionIsAR: false,
  xrReferenceSpace: null,
  xrSupported: true,
  imageFormat: 'image/png',
  useOffScreen: false,
  useBackgroundImage: false,
};

// ----------------------------------------------------------------------------

export function extend(publicAPI, model, initialValues = {}) {
  Object.assign(model, DEFAULT_VALUES, initialValues);

  // Inheritance
  vtkRenderWindowViewNode.extend(publicAPI, model, initialValues);

  // Create internal instances
  model.canvas = document.createElement('canvas');
  model.canvas.style.width = '100%';
  createGLContext();

  if (!model.selector) {
    model.selector = vtkOpenGLHardwareSelector.newInstance();
    model.selector.setOpenGLRenderWindow(publicAPI);
  }

  // Create internal bgImage
  model.bgImage = new Image();
  model.bgImage.style.position = 'absolute';
  model.bgImage.style.left = '0';
  model.bgImage.style.top = '0';
  model.bgImage.style.width = '100%';
  model.bgImage.style.height = '100%';
  model.bgImage.style.zIndex = '-1';

  model._textureResourceIds = new Map();

  model.myFactory = vtkOpenGLViewNodeFactory.newInstance();
  /* eslint-disable no-use-before-define */
  model.myFactory.registerOverride('vtkRenderWindow', newInstance);
  /* eslint-enable no-use-before-define */

  model.shaderCache = vtkShaderCache.newInstance();
  model.shaderCache.setOpenGLRenderWindow(publicAPI);

  // setup default forward pass rendering
  model.renderPasses[0] = vtkForwardPass.newInstance();

  macro.event(publicAPI, model, 'imageReady');
  macro.event(publicAPI, model, 'haveVRDisplay');

  // Build VTK API
  macro.get(publicAPI, model, [
    'shaderCache',
    'textureUnitManager',
    'webgl2',
    'vrDisplay',
    'useBackgroundImage',
    'xrSupported',
  ]);

  macro.setGet(publicAPI, model, [
    'initialized',
    'context',
    'canvas',
    'renderPasses',
    'notifyStartCaptureImage',
    'defaultToWebgl2',
    'cursor',
    'useOffScreen',
    // might want to make this not call modified as
    // we change the active framebuffer a lot. Or maybe
    // only mark modified if the size or depth
    // of the buffer has changed
    'activeFramebuffer',
  ]);

  macro.setGetArray(publicAPI, model, ['size'], 2);

  // Object methods
  vtkOpenGLRenderWindow(publicAPI, model);
}

// ----------------------------------------------------------------------------

export const newInstance = macro.newInstance(extend, 'vtkOpenGLRenderWindow');

// ----------------------------------------------------------------------------
// Register API specific RenderWindow implementation
// ----------------------------------------------------------------------------

registerViewConstructor('WebGL', newInstance);

// ----------------------------------------------------------------------------

export default {
  newInstance,
  extend,
  pushMonitorGLContextCount,
  popMonitorGLContextCount,
};
