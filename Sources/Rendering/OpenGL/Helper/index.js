import macro from 'vtk.js/Sources/macros';
import vtkCellArrayBufferObject from 'vtk.js/Sources/Rendering/OpenGL/CellArrayBufferObject';
import vtkShaderProgram from 'vtk.js/Sources/Rendering/OpenGL/ShaderProgram';
import vtkVertexArrayObject from 'vtk.js/Sources/Rendering/OpenGL/VertexArrayObject';

import { Representation } from 'vtk.js/Sources/Rendering/Core/Property/Constants';

export const primTypes = {
  Start: 0,
  Points: 0,
  Lines: 1,
  Tris: 2,
  TriStrips: 3,
  TrisEdges: 4,
  TriStripsEdges: 5,
  End: 6,
};

// ----------------------------------------------------------------------------
// vtkOpenGLHelper methods
// ----------------------------------------------------------------------------

function vtkOpenGLHelper(publicAPI, model) {
  // Set our className
  model.classHierarchy.push('vtkOpenGLHelper');

  publicAPI.setOpenGLRenderWindow = (win) => {
    model.context = win.getContext();
    model.program.setContext(model.context);
    model.VAO.setOpenGLRenderWindow(win);
    model.CABO.setOpenGLRenderWindow(win);
  };

  publicAPI.releaseGraphicsResources = (oglwin) => {
    model.VAO.releaseGraphicsResources();
    model.CABO.releaseGraphicsResources();
    model.CABO.setElementCount(0);
  };

  publicAPI.drawArrays = (ren, actor, rep, oglMapper) => {
    // Are there any entries
    if (model.CABO.getElementCount()) {
      // are we drawing edges
      const mode = publicAPI.getOpenGLMode(rep);
      const wideLines = publicAPI.haveWideLines(ren, actor);
      const gl = model.context;
      const depthMask = gl.getParameter(gl.DEPTH_WRITEMASK);
      if (model.pointPicking) {
        gl.depthMask(false);
      }
      const drawingLines = mode === gl.LINES;
      if (drawingLines && wideLines) {
        publicAPI.updateShaders(ren, actor, oglMapper);
        gl.drawArraysInstanced(
          mode,
          0,
          model.CABO.getElementCount(),
          2 * Math.ceil(actor.getProperty().getLineWidth())
        );
      } else {
        gl.lineWidth(actor.getProperty().getLineWidth());
        publicAPI.updateShaders(ren, actor, oglMapper);
        gl.drawArrays(mode, 0, model.CABO.getElementCount());
        // reset the line width
        gl.lineWidth(1);
      }
      const stride =
        (mode === gl.POINTS ? 1 : 0) || (mode === gl.LINES ? 2 : 3);
      if (model.pointPicking) {
        gl.depthMask(depthMask);
      }
      return model.CABO.getElementCount() / stride;
    }
    return 0;
  };

  publicAPI.getOpenGLMode = (rep) => {
    if (model.pointPicking) {
      return model.context.POINTS;
    }
    const type = model.primitiveType;
    if (rep === Representation.POINTS || type === primTypes.Points) {
      return model.context.POINTS;
    }
    if (
      rep === Representation.WIREFRAME ||
      type === primTypes.Lines ||
      type === primTypes.TrisEdges ||
      type === primTypes.TriStripsEdges
    ) {
      return model.context.LINES;
    }
    return model.context.TRIANGLES;
  };

  publicAPI.haveWideLines = (ren, actor) => {
    if (actor.getProperty().getLineWidth() > 1.0) {
      // we have wide lines, but the OpenGL implementation may
      // actually support them, check the range to see if we
      // really need have to implement our own wide lines
      if (model.CABO.getOpenGLRenderWindow()) {
        if (
          model.CABO.getOpenGLRenderWindow().getHardwareMaximumLineWidth() >=
          actor.getProperty().getLineWidth()
        ) {
          return false;
        }
      }
      return true;
    }
    return false;
  };

  publicAPI.getNeedToRebuildShaders = (ren, actor, oglMapper) => {
    // has something changed that would require us to recreate the shader?
    // candidates are
    // property modified (representation interpolation and lighting)
    // input modified
    // mapper modified (lighting complexity)
    if (
      oglMapper.getNeedToRebuildShaders(publicAPI, ren, actor) ||
      publicAPI.getProgram() === 0 ||
      publicAPI.getShaderSourceTime().getMTime() < oglMapper.getMTime() ||
      publicAPI.getShaderSourceTime().getMTime() < actor.getMTime()
    ) {
      return true;
    }
    return false;
  };

  publicAPI.updateShaders = (ren, actor, oglMapper) => {
    // has something changed that would require us to recreate the shader?
    if (publicAPI.getNeedToRebuildShaders(ren, actor, oglMapper)) {
      const shaders = { Vertex: null, Fragment: null, Geometry: null };
      oglMapper.buildShaders(shaders, ren, actor);

      // compile and bind the program if needed
      const newShader = model.CABO.getOpenGLRenderWindow()
        .getShaderCache()
        .readyShaderProgramArray(
          shaders.Vertex,
          shaders.Fragment,
          shaders.Geometry
        );

      // if the shader changed reinitialize the VAO
      if (newShader !== publicAPI.getProgram()) {
        publicAPI.setProgram(newShader);
        // reset the VAO as the shader has changed
        publicAPI.getVAO().releaseGraphicsResources();
      }

      publicAPI.getShaderSourceTime().modified();
    } else {
      model.CABO.getOpenGLRenderWindow()
        .getShaderCache()
        .readyShaderProgram(publicAPI.getProgram());
    }

    publicAPI.getVAO().bind();

    oglMapper.setMapperShaderParameters(publicAPI, ren, actor);
    oglMapper.setPropertyShaderParameters(publicAPI, ren, actor);
    oglMapper.setCameraShaderParameters(publicAPI, ren, actor);
    oglMapper.setLightingShaderParameters(publicAPI, ren, actor);

    oglMapper.invokeShaderCallbacks(publicAPI, ren, actor);
  };

  publicAPI.setMapperShaderParameters = (ren, actor, size) => {
    if (publicAPI.haveWideLines(ren, actor)) {
      publicAPI
        .getProgram()
        .setUniform2f('viewportSize', size.usize, size.vsize);
      const lineWidth = parseFloat(actor.getProperty().getLineWidth());
      const halfLineWidth = lineWidth / 2.0;
      publicAPI
        .getProgram()
        .setUniformf('lineWidthStepSize', lineWidth / Math.ceil(lineWidth));
      publicAPI.getProgram().setUniformf('halfLineWidth', halfLineWidth);
    }
    if (
      model.primitiveType === primTypes.Points ||
      actor.getProperty().getRepresentation() === Representation.POINTS
    ) {
      publicAPI
        .getProgram()
        .setUniformf('pointSize', actor.getProperty().getPointSize());
    } else if (model.pointPicking) {
      publicAPI
        .getProgram()
        .setUniformf('pointSize', publicAPI.getPointPickingPrimitiveSize());
    }
  };

  publicAPI.replaceShaderPositionVC = (shaders, ren, actor) => {
    let VSSource = shaders.Vertex;

    // Always set point size in case we need picking
    VSSource = vtkShaderProgram.substitute(VSSource, '//VTK::PositionVC::Dec', [
      '//VTK::PositionVC::Dec',
      'uniform float pointSize;',
    ]).result;
    VSSource = vtkShaderProgram.substitute(
      VSSource,
      '//VTK::PositionVC::Impl',
      ['//VTK::PositionVC::Impl', '  gl_PointSize = pointSize;'],
      false
    ).result;

    // for lines, make sure we add the width code
    if (
      publicAPI.getOpenGLMode(actor.getProperty().getRepresentation()) ===
        model.context.LINES &&
      publicAPI.haveWideLines(ren, actor)
    ) {
      VSSource = vtkShaderProgram.substitute(
        VSSource,
        '//VTK::PositionVC::Dec',
        [
          '//VTK::PositionVC::Dec',
          'uniform vec2 viewportSize;',
          'uniform float lineWidthStepSize;',
          'uniform float halfLineWidth;',
        ]
      ).result;
      VSSource = vtkShaderProgram.substitute(
        VSSource,
        '//VTK::PositionVC::Impl',
        [
          '//VTK::PositionVC::Impl',
          ' if (halfLineWidth > 0.0)',
          '   {',
          '   float offset = float(gl_InstanceID / 2) * lineWidthStepSize - halfLineWidth;',
          '   vec4 tmpPos = gl_Position;',
          '   vec3 tmpPos2 = tmpPos.xyz / tmpPos.w;',
          '   tmpPos2.x = tmpPos2.x + 2.0 * mod(float(gl_InstanceID), 2.0) * offset / viewportSize[0];',
          '   tmpPos2.y = tmpPos2.y + 2.0 * mod(float(gl_InstanceID + 1), 2.0) * offset / viewportSize[1];',
          '   gl_Position = vec4(tmpPos2.xyz * tmpPos.w, tmpPos.w);',
          '   }',
        ]
      ).result;
    }
    shaders.Vertex = VSSource;
  };

  publicAPI.getPointPickingPrimitiveSize = () => {
    if (model.primitiveType === primTypes.Points) {
      return 2;
    }
    if (model.primitiveType === primTypes.Lines) {
      return 4;
    }
    return 6;
  };
}

// ----------------------------------------------------------------------------
// Object factory
// ----------------------------------------------------------------------------

const DEFAULT_VALUES = {
  context: null,
  program: null,
  shaderSourceTime: null,
  VAO: null,
  attributeUpdateTime: null,
  CABO: null,
  primitiveType: 0,
  pointPicking: false,
};

// ----------------------------------------------------------------------------

export function extend(publicAPI, model, initialValues = {}) {
  Object.assign(model, DEFAULT_VALUES, initialValues);

  // Build VTK API
  macro.obj(publicAPI, model);

  model.shaderSourceTime = {};
  macro.obj(model.shaderSourceTime);

  model.attributeUpdateTime = {};
  macro.obj(model.attributeUpdateTime);

  macro.setGet(publicAPI, model, [
    'program',
    'shaderSourceTime',
    'VAO',
    'attributeUpdateTime',
    'CABO',
    'primitiveType',
    'pointPicking',
  ]);

  model.program = vtkShaderProgram.newInstance();
  model.VAO = vtkVertexArrayObject.newInstance();
  model.CABO = vtkCellArrayBufferObject.newInstance();

  // Object methods
  vtkOpenGLHelper(publicAPI, model);
}

// ----------------------------------------------------------------------------

export const newInstance = macro.newInstance(extend);

// ----------------------------------------------------------------------------

export default { newInstance, extend, primTypes };
