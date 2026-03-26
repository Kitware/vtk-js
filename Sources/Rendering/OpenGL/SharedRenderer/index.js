import macro from 'vtk.js/Sources/macros';
import { extend as extendOpenGLRenderer } from 'vtk.js/Sources/Rendering/OpenGL/Renderer';

function vtkSharedRenderer(publicAPI, model) {
  model.classHierarchy.push('vtkSharedRenderer');

  publicAPI.clear = () => {
    const gl = model.context;
    const openGLRenderWindow = model._openGLRenderWindow;

    const autoClear = openGLRenderWindow?.getAutoClear?.() ?? true;
    if (autoClear === false) {
      const ts = publicAPI.getTiledSizeAndOrigin();
      gl.enable(gl.SCISSOR_TEST);
      gl.scissor(ts.lowerLeftU, ts.lowerLeftV, ts.usize, ts.vsize);
      gl.viewport(ts.lowerLeftU, ts.lowerLeftV, ts.usize, ts.vsize);
      gl.enable(gl.DEPTH_TEST);
      return;
    }

    const shouldClearColor = openGLRenderWindow?.getAutoClearColor?.() ?? true;
    const shouldClearDepth = openGLRenderWindow?.getAutoClearDepth?.() ?? true;

    let clearMask = 0;

    if (!model.renderable.getTransparent() && shouldClearColor) {
      const background = model.renderable.getBackgroundByReference();
      gl.clearColor(background[0], background[1], background[2], background[3]);
      // eslint-disable-next-line no-bitwise
      clearMask |= gl.COLOR_BUFFER_BIT;
    }

    if (!model.renderable.getPreserveDepthBuffer() && shouldClearDepth) {
      gl.clearDepth(1.0);
      // eslint-disable-next-line no-bitwise
      clearMask |= gl.DEPTH_BUFFER_BIT;
      gl.depthMask(true);
    }

    gl.colorMask(true, true, true, true);

    const ts = publicAPI.getTiledSizeAndOrigin();
    gl.enable(gl.SCISSOR_TEST);
    gl.scissor(ts.lowerLeftU, ts.lowerLeftV, ts.usize, ts.vsize);
    gl.viewport(ts.lowerLeftU, ts.lowerLeftV, ts.usize, ts.vsize);

    if (clearMask) {
      gl.clear(clearMask);
    }

    gl.enable(gl.DEPTH_TEST);
  };
}

export function extend(publicAPI, model, initialValues = {}) {
  extendOpenGLRenderer(publicAPI, model, initialValues);
  vtkSharedRenderer(publicAPI, model);
}

export const newInstance = macro.newInstance(extend, 'vtkSharedRenderer');

export default { newInstance, extend };
