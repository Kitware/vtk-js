import * as macro from 'vtk.js/Sources/macros';
import vtkOpenGLPolyDataMapper from 'vtk.js/Sources/Rendering/OpenGL/PolyDataMapper';
import vtkShaderProgram from 'vtk.js/Sources/Rendering/OpenGL/ShaderProgram';
import vtkOpenGLSurfaceLICInterface from 'vtk.js/Sources/Rendering/OpenGL/SurfaceLIC/SurfaceLICInterface';
import vtkSurfaceLICInterface from 'vtk.js/Sources/Rendering/Core/SurfaceLICInterface';

import { registerOverride } from 'vtk.js/Sources/Rendering/OpenGL/ViewNodeFactory';

const { vtkErrorMacro } = macro;

// ----------------------------------------------------------------------------
// vtkOpenGLSurfaceLICMapper methods
// ----------------------------------------------------------------------------

function vtkOpenGLSurfaceLICMapper(publicAPI, model) {
  model.classHierarchy.push('vtkOpenGLSurfaceLICMapper');

  const superClass = { ...publicAPI };
  publicAPI.getNeedToRebuildShaders = (cellBO, ren, actor) =>
    model.rebuildLICShaders ||
    superClass.getNeedToRebuildShaders(cellBO, ren, actor);
  publicAPI.replaceShaderValues = (shaders, ren, actor) => {
    const prevComplexity = model.lastBoundBO.getReferenceByName(
      'lastLightComplexity'
    );

    // add some code to handle the LIC vectors and mask
    let VSSource = shaders.Vertex;
    let FSSource = shaders.Fragment;

    const array = model.renderable.getInputArrayToProcess(0);
    if (array && model.canDrawLIC) {
      FSSource = vtkShaderProgram.substitute(FSSource, '//VTK::Output::Dec', [
        '//VTK::Output::Dec',
        'layout(location = 1) out vec4 vectorTexture;',
        'layout(location = 2) out vec4 maskVectorTexture;',
      ]).result;

      const arrayName = array.getName();
      const attributeName = `${arrayName}MC`;

      // We need normals even with no lighting
      if (prevComplexity === 0) {
        model.lastBoundBO.set({ lastLightComplexity: 1 }, true);
      }

      VSSource = vtkShaderProgram.substitute(VSSource, '//VTK::TCoord::Dec', [
        `attribute vec3 ${attributeName};`,
        'out vec3 licOutput;',
        '//VTK::TCoord::Dec',
      ]).result;
      VSSource = vtkShaderProgram.substitute(VSSource, '//VTK::TCoord::Impl', [
        `licOutput = ${attributeName};`,
        '//VTK::TCoord::Impl',
      ]).result;

      // 0/1, when 1 V is projected to surface for |V| computation.
      FSSource = vtkShaderProgram.substitute(FSSource, '//VTK::TCoord::Dec', [
        'uniform int uMaskOnSurface;',
        'uniform mat3 normalMatrix;',
        'in vec3 licOutput;',
        '//VTK::TCoord::Dec',
      ]).result;

      FSSource = vtkShaderProgram.substitute(
        FSSource,
        '//VTK::TCoord::Impl',
        [
          '// projected vectors',
          '  vec3 tcoordLIC = normalMatrix * licOutput;',
          '  vec3 normN = normalize(normalVCVSOutput);',
          '  float k = dot(tcoordLIC, normN);',
          '  vec3 projected = (tcoordLIC - k*normN);',
          '  vectorTexture = vec4(projected.x, projected.y, 0.0 , 1.0);',
          '// vectors for fragment masking',
          '  if (uMaskOnSurface == 0)',
          '    {',
          '    maskVectorTexture = vec4(licOutput, 1.0);',
          '    }',
          '  else',
          '    {',
          '    maskVectorTexture = vec4(projected.x, projected.y, 0.0 , 1.0);',
          '    }',
          '//VTK::TCoord::Impl',
        ],
        false
      ).result;

      shaders.Vertex = VSSource;
    }

    model.rebuildLICShaders = false;

    shaders.Fragment = FSSource;
    superClass.replaceShaderValues(shaders, ren, actor);
    if (prevComplexity > 0) {
      model.lastBoundBO.set({ lastLightComplexity: prevComplexity }, true);
    }
  };

  publicAPI.setMapperShaderParameters = (cellBO, ren, actor) => {
    superClass.setMapperShaderParameters(cellBO, ren, actor);
    if (model.canDrawLIC) {
      cellBO.getProgram().setUniformi('uMaskOnSurface', model.maskOnSurface);
    }
  };

  publicAPI.getNeedToRebuildBufferObjects = (ren, actor) =>
    model.rebuildLICBuffers ||
    superClass.getNeedToRebuildBufferObjects(ren, actor);
  publicAPI.buildBufferObjects = (ren, actor) => {
    if (model.canDrawLIC) {
      const array = model.renderable.getInputArrayToProcess(0);
      if (array && array.getNumberOfComponents() > 1) {
        model.renderable.setCustomShaderAttributes([array.getName()]);
      }
    }
    model.rebuildLICBuffers = false;
    superClass.buildBufferObjects(ren, actor);
  };

  publicAPI.pushState = (gl) => {
    model.stateCache = {
      [gl.BLEND]: gl.isEnabled(gl.BLEND),
      [gl.DEPTH_TEST]: gl.isEnabled(gl.DEPTH_TEST),
      [gl.SCISSOR_TEST]: gl.isEnabled(gl.SCISSOR_TEST),
      [gl.CULL_FACE]: gl.isEnabled(gl.CULL_FACE),
    };
  };

  publicAPI.popState = (gl) => {
    const apply = (param) =>
      model.stateCache[param] ? gl.enable(param) : gl.disable(param);
    apply(gl.BLEND);
    apply(gl.DEPTH_TEST);
    apply(gl.SCISSOR_TEST);
    apply(gl.CULL_FACE);
  };

  publicAPI.renderPiece = (ren, actor) => {
    let canDrawLIC = true;
    // Check for gl compatibility
    const gl2 = model._openGLRenderWindow.getWebgl2();
    if (!gl2) {
      vtkErrorMacro('SurfaceLICMapper Requires WebGL 2');
      canDrawLIC = false;
    }

    // Check for required extensions
    if (
      !model.context.getExtension('EXT_color_buffer_float') ||
      !model.context.getExtension('OES_texture_float_linear')
    ) {
      vtkErrorMacro(
        'SurfaceLICMapper requires the EXT_color_buffer_float and OES_texture_float_linear WebGL2 extensions.'
      );
      canDrawLIC = false;
    }

    // Check for input
    model.currentInput = model.renderable.getInputData();
    if (!model.currentInput) {
      vtkErrorMacro('No input');
      canDrawLIC = false;
    }

    // Make sure LIC interfaces are present and configured
    let licInterface = model.renderable.getLicInterface();
    if (!licInterface) {
      licInterface = vtkSurfaceLICInterface.newInstance();
      model.renderable.setLicInterface(licInterface);
    }
    if (!model.openGLLicInterface) {
      model.openGLLicInterface = vtkOpenGLSurfaceLICInterface.newInstance();
    }
    if (licInterface !== model.openGLLicInterface.getLicInterface()) {
      model.openGLLicInterface.setLicInterface(licInterface);
    }

    // Check for input vectors
    const array = model.renderable.getInputArrayToProcess(0);

    if (
      licInterface.getEnableLIC() &&
      (!array || array.getNumberOfComponents() < 2)
    ) {
      vtkErrorMacro('No vector input array');
      canDrawLIC = false;
    }
    if (!licInterface.getEnableLIC()) {
      canDrawLIC = false;
    }

    if (model.canDrawLIC !== canDrawLIC) {
      model.rebuildLICShaders = true;
      model.rebuildLICBuffers = true;
    }
    model.canDrawLIC = canDrawLIC;

    // Necessary conditions are not met. Fallback to polydataMapper
    if (!canDrawLIC || !licInterface.getEnableLIC()) {
      superClass.renderPiece(ren, actor);
      return;
    }

    // apply faceCulling
    const gl = model.context;
    const backfaceCulling = actor.getProperty().getBackfaceCulling();
    const frontfaceCulling = actor.getProperty().getFrontfaceCulling();
    if (!backfaceCulling && !frontfaceCulling) {
      model._openGLRenderWindow.disableCullFace();
    } else if (frontfaceCulling) {
      model._openGLRenderWindow.enableCullFace();
      gl.cullFace(gl.FRONT);
    } else {
      model._openGLRenderWindow.enableCullFace();
      gl.cullFace(gl.BACK);
    }

    const windowSize = model._openGLRenderWindow.getSize();
    const size = windowSize.map((i) =>
      Math.round(i * licInterface.getViewPortScale())
    );

    model.openGLLicInterface.setSize(size);
    model.openGLLicInterface.setOpenGLRenderWindow(model._openGLRenderWindow);
    model.openGLLicInterface.setContext(model.context);

    // Pre-render
    publicAPI.pushState(model.context);
    model.openGLLicInterface.initializeResources();
    model.openGLLicInterface.prepareForGeometry();
    publicAPI.popState(model.context);

    // Render
    superClass.renderPieceStart(ren, actor);
    superClass.renderPieceDraw(ren, actor);
    superClass.renderPieceFinish(ren, actor);

    // Post
    publicAPI.pushState(model.context);
    model.VBOBuildTime.modified();
    model.openGLLicInterface.completedGeometry();
    model.context.disable(model.context.CULL_FACE);
    model.openGLLicInterface.applyLIC();
    model.openGLLicInterface.combineColorsAndLIC();
    model.openGLLicInterface.copyToScreen(windowSize);
    publicAPI.popState(model.context);
  };
}

const DEFAULT_VALUES = {
  canDrawLIC: false,
  rebuildLICShaders: false,
  rebuildLICBuffers: false,

  openGLLicInterface: null,
};

export function extend(publicAPI, model, initialValues = {}) {
  Object.assign(model, DEFAULT_VALUES, initialValues);

  // Inherit
  vtkOpenGLPolyDataMapper.extend(publicAPI, model, initialValues);

  // Object methods
  vtkOpenGLSurfaceLICMapper(publicAPI, model);

  macro.setGet(publicAPI, model, ['openGLLicInterface']);
}

// ----------------------------------------------------------------------------

export const newInstance = macro.newInstance(
  extend,
  'vtkOpenGLSurfaceLICMapper'
);

// ----------------------------------------------------------------------------

export default { newInstance, extend };

// Register ourself to OpenGL backend if imported
registerOverride('vtkSurfaceLICMapper', newInstance);
