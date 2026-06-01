import { mat4 } from 'gl-matrix';

import * as macro from 'vtk.js/Sources/macros';

import vtkBufferObject from 'vtk.js/Sources/Rendering/OpenGL/BufferObject';
import vtkProperty from 'vtk.js/Sources/Rendering/Core/Property';
import vtkOpenGLPolyDataMapper from 'vtk.js/Sources/Rendering/OpenGL/PolyDataMapper';
import vtkShaderProgram from 'vtk.js/Sources/Rendering/OpenGL/ShaderProgram';
import {
  computeCoordShiftAndScale,
  computeInverseShiftAndScaleMatrix,
} from 'vtk.js/Sources/Rendering/OpenGL/CellArrayBufferObject/helpers';

import { registerOverride } from 'vtk.js/Sources/Rendering/OpenGL/ViewNodeFactory';
import { primTypes } from '../Helper';

const { vtkErrorMacro } = macro;
const { Representation } = vtkProperty;
const { ObjectType } = vtkBufferObject;

const StartEvent = { type: 'StartEvent' };
const EndEvent = { type: 'EndEvent' };

const MAT4_BYTE_SIZE = 64;
const MAT4_ELEMENT_COUNT = 16;

// ----------------------------------------------------------------------------
// vtkOpenGLSphereMapper methods
// ----------------------------------------------------------------------------

function vtkOpenGLGlyph3DMapper(publicAPI, model) {
  // Set our className
  model.classHierarchy.push('vtkOpenGLGlyph3DMapper');

  // Capture 'parentClass' api for internal use
  const superClass = { ...publicAPI };

  publicAPI.renderPiece = (ren, actor) => {
    publicAPI.invokeEvent(StartEvent);
    if (!model.renderable.getStatic()) {
      model.renderable.update();
    }
    model.currentInput = model.renderable.getInputData(1);
    publicAPI.invokeEvent(EndEvent);

    if (!model.currentInput) {
      vtkErrorMacro('No input!');
      return;
    }

    // if there are no points then we are done
    if (
      !model.currentInput.getPoints ||
      !model.currentInput.getPoints().getNumberOfValues()
    ) {
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
      model._openGLRenderWindow.setCullFaceMode(gl.FRONT);
    } else {
      model._openGLRenderWindow.enableCullFace();
      model._openGLRenderWindow.setCullFaceMode(gl.BACK);
    }

    publicAPI.renderPieceStart(ren, actor);
    publicAPI.renderPieceDraw(ren, actor);
    publicAPI.renderPieceFinish(ren, actor);
  };

  publicAPI.replaceShaderNormal = (shaders, ren, actor) => {
    const lastLightComplexity = model.lastBoundBO.getReferenceByName(
      'lastLightComplexity'
    );

    if (lastLightComplexity > 0) {
      let VSSource = shaders.Vertex;

      if (model.lastBoundBO.getCABO().getNormalOffset()) {
        VSSource = vtkShaderProgram.substitute(VSSource, '//VTK::Normal::Dec', [
          'attribute vec3 normalMC;',
          'attribute mat3 gNormal;',
          'uniform mat3 normalMatrix;',
          'varying vec3 normalVCVSOutput;',
        ]).result;
        VSSource = vtkShaderProgram.substitute(
          VSSource,
          '//VTK::Normal::Impl',
          ['normalVCVSOutput = normalMatrix * gNormal * normalMC;']
        ).result;
      }
      shaders.Vertex = VSSource;
    }
    superClass.replaceShaderNormal(shaders, ren, actor);
  };

  publicAPI.replaceShaderClip = (shaders, ren, actor) => {
    let VSSource = shaders.Vertex;
    let FSSource = shaders.Fragment;

    if (model.renderable.getNumberOfClippingPlanes()) {
      const numClipPlanes = model.renderable.getNumberOfClippingPlanes();
      VSSource = vtkShaderProgram.substitute(VSSource, '//VTK::Clip::Dec', [
        'uniform int numClipPlanes;',
        `uniform vec4 clipPlanes[${numClipPlanes}];`,
        `varying float clipDistancesVSOutput[${numClipPlanes}];`,
      ]).result;

      VSSource = vtkShaderProgram.substitute(VSSource, '//VTK::Clip::Impl', [
        `for (int planeNum = 0; planeNum < ${numClipPlanes}; planeNum++)`,
        '    {',
        '    if (planeNum >= numClipPlanes)',
        '        {',
        '        break;',
        '        }',
        '    vec4 gVertex = gMatrix * vertexMC;',
        '    clipDistancesVSOutput[planeNum] = dot(clipPlanes[planeNum], gVertex);',
        '    }',
      ]).result;
      FSSource = vtkShaderProgram.substitute(FSSource, '//VTK::Clip::Dec', [
        'uniform int numClipPlanes;',
        `varying float clipDistancesVSOutput[${numClipPlanes}];`,
      ]).result;

      FSSource = vtkShaderProgram.substitute(FSSource, '//VTK::Clip::Impl', [
        `for (int planeNum = 0; planeNum < ${numClipPlanes}; planeNum++)`,
        '    {',
        '    if (planeNum >= numClipPlanes)',
        '        {',
        '        break;',
        '        }',
        '    if (clipDistancesVSOutput[planeNum] < 0.0) discard;',
        '    }',
      ]).result;
    }
    shaders.Vertex = VSSource;
    shaders.Fragment = FSSource;
    superClass.replaceShaderClip(shaders, ren, actor);
  };

  publicAPI.replaceShaderColor = (shaders, ren, actor) => {
    if (model.renderable.getColorArray()) {
      let VSSource = shaders.Vertex;
      let GSSource = shaders.Geometry;
      let FSSource = shaders.Fragment;

      const lastLightComplexity = model.lastBoundBO.getReferenceByName(
        'lastLightComplexity'
      );

      // create the material/color property declarations, and VS implementation
      // these are always defined
      let colorDec = [
        'uniform float ambient;',
        'uniform float diffuse;',
        'uniform float specular;',
        'uniform float opacityUniform; // the fragment opacity',
      ];
      // add more for specular
      if (lastLightComplexity) {
        colorDec = colorDec.concat([
          'uniform vec3 specularColorUniform;',
          'uniform float specularPowerUniform;',
        ]);
      }

      // now handle the more complex fragment shader implementation
      // the following are always defined variables.  We start
      // by assigning a default value from the uniform
      let colorImpl = [
        'vec3 ambientColor;',
        '  vec3 diffuseColor;',
        '  float opacity;',
      ];
      if (lastLightComplexity) {
        colorImpl = colorImpl.concat([
          '  vec3 specularColor;',
          '  float specularPower;',
        ]);
      }
      colorImpl = colorImpl.concat(['  opacity = opacityUniform;']);
      if (lastLightComplexity) {
        colorImpl = colorImpl.concat([
          '  specularColor = specularColorUniform;',
          '  specularPower = specularPowerUniform;',
        ]);
      }

      if (!model.drawingEdges) {
        colorDec = colorDec.concat(['varying vec4 vertexColorVSOutput;']);
        VSSource = vtkShaderProgram.substitute(VSSource, '//VTK::Color::Dec', [
          'attribute vec4 gColor;',
          'varying vec4 vertexColorVSOutput;',
        ]).result;
        VSSource = vtkShaderProgram.substitute(VSSource, '//VTK::Color::Impl', [
          'vertexColorVSOutput = gColor;',
        ]).result;
        GSSource = vtkShaderProgram.substitute(GSSource, '//VTK::Color::Dec', [
          'in vec4 vertexColorVSOutput[];',
          'out vec4 vertexColorGSOutput;',
        ]).result;
        GSSource = vtkShaderProgram.substitute(GSSource, '//VTK::Color::Impl', [
          'vertexColorGSOutput = vertexColorVSOutput[i];',
        ]).result;

        colorImpl = colorImpl.concat([
          '  diffuseColor = vertexColorVSOutput.rgb;',
          '  ambientColor = vertexColorVSOutput.rgb;',
          '  opacity = opacity*vertexColorVSOutput.a;',
        ]);
      }

      FSSource = vtkShaderProgram.substitute(
        FSSource,
        '//VTK::Color::Impl',
        colorImpl
      ).result;

      FSSource = vtkShaderProgram.substitute(
        FSSource,
        '//VTK::Color::Dec',
        colorDec
      ).result;

      shaders.Vertex = VSSource;
      shaders.Geometry = GSSource;
      shaders.Fragment = FSSource;
    }
    superClass.replaceShaderColor(shaders, ren, actor);
  };

  publicAPI.replaceShaderPositionVC = (shaders, ren, actor) => {
    let VSSource = shaders.Vertex;

    // do we need the vertex in the shader in View Coordinates
    const lastLightComplexity = model.lastBoundBO.getReferenceByName(
      'lastLightComplexity'
    );
    if (lastLightComplexity > 0) {
      VSSource = vtkShaderProgram.substitute(
        VSSource,
        '//VTK::PositionVC::Impl',
        [
          'vec4 gVertexMC = gMatrix * vertexMC;',
          'vertexVCVSOutput = MCVCMatrix * gVertexMC;',
          '  gl_Position = MCPCMatrix * gVertexMC;',
        ]
      ).result;
      VSSource = vtkShaderProgram.substitute(VSSource, '//VTK::Camera::Dec', [
        'attribute mat4 gMatrix;',
        'uniform mat4 MCPCMatrix;',
        'uniform mat4 MCVCMatrix;',
      ]).result;
    } else {
      VSSource = vtkShaderProgram.substitute(VSSource, '//VTK::Camera::Dec', [
        'attribute mat4 gMatrix;',
        'uniform mat4 MCPCMatrix;',
      ]).result;
      VSSource = vtkShaderProgram.substitute(
        VSSource,
        '//VTK::PositionVC::Impl',
        [
          'vec4 gVertexMC = gMatrix * vertexMC;',
          '  gl_Position = MCPCMatrix * gVertexMC;',
        ]
      ).result;
    }
    shaders.Vertex = VSSource;
    superClass.replaceShaderPositionVC(shaders, ren, actor);
  };

  publicAPI.replaceShaderPicking = (shaders, ren, actor) => {
    let FSSource = shaders.Fragment;
    let VSSource = shaders.Vertex;
    VSSource = vtkShaderProgram.substitute(VSSource, '//VTK::Picking::Dec', [
      'attribute vec3 mapperIndexVS;',
      'varying vec3 mapperIndexVSOutput;',
    ]).result;
    VSSource = vtkShaderProgram.substitute(
      VSSource,
      '//VTK::Picking::Impl',
      '  mapperIndexVSOutput = mapperIndexVS;'
    ).result;
    shaders.Vertex = VSSource;
    FSSource = vtkShaderProgram.substitute(FSSource, '//VTK::Picking::Dec', [
      'varying vec3 mapperIndexVSOutput;',
      'uniform vec3 mapperIndex;',
      'uniform int picking;',
    ]).result;
    FSSource = vtkShaderProgram.substitute(FSSource, '//VTK::Picking::Impl', [
      '  vec4 pickColor = picking == 2 ? vec4(mapperIndexVSOutput,1.0) : vec4(mapperIndex,1.0);',
      '  gl_FragData[0] = picking != 0 ? pickColor : gl_FragData[0];',
    ]).result;
    shaders.Fragment = FSSource;
  };

  publicAPI.renderPieceDraw = (ren, actor) => {
    const representation = actor.getProperty().getRepresentation();

    const gl = model.context;

    const drawSurfaceWithEdges =
      actor.getProperty().getEdgeVisibility() &&
      representation === Representation.SURFACE;

    const garray = model.renderable.getMatrixArray();
    const numPts = garray.length / 16;

    // for every primitive type
    for (let i = model.primTypes.Start; i < model.primTypes.End; i++) {
      // if there are entries
      const cabo = model.primitives[i].getCABO();
      if (cabo.getElementCount()) {
        // are we drawing edges
        model.drawingEdges =
          drawSurfaceWithEdges &&
          (i === model.primTypes.TrisEdges ||
            i === model.primTypes.TriStripsEdges);
        model.lastBoundBO = model.primitives[i];
        model.primitives[i].updateShaders(ren, actor, publicAPI);

        const mode = model.primitives[i].getOpenGLMode(representation);

        if (cabo.getIndexed()) {
          cabo.getIndexBO().bind();
          gl.drawElementsInstanced(
            mode,
            cabo.getElementCount(),
            cabo.getIndexElementType(),
            0,
            numPts
          );
        } else {
          gl.drawArraysInstanced(mode, 0, cabo.getElementCount(), numPts);
        }
      }
    }
  };

  publicAPI.setMapperShaderParameters = (cellBO, ren, actor) => {
    if (
      cellBO.getCABO().getElementCount() &&
      (model.glyphBOBuildTime.getMTime() >
        cellBO.getAttributeUpdateTime().getMTime() ||
        cellBO.getShaderSourceTime().getMTime() >
          cellBO.getAttributeUpdateTime().getMTime())
    ) {
      if (cellBO.getProgram().isAttributeUsed('gMatrix')) {
        if (
          !cellBO
            .getVAO()
            .addAttributeMatrixWithDivisor(
              cellBO.getProgram(),
              model.matrixBuffer,
              'gMatrix',
              0,
              64,
              model.context.FLOAT,
              4,
              false,
              1
            )
        ) {
          vtkErrorMacro('Error setting gMatrix in shader VAO.');
        }
      } else {
        cellBO.getVAO().removeAttributeArray('gMatrix');
      }
      if (cellBO.getProgram().isAttributeUsed('gNormal')) {
        if (
          !cellBO
            .getVAO()
            .addAttributeMatrixWithDivisor(
              cellBO.getProgram(),
              model.normalBuffer,
              'gNormal',
              0,
              36,
              model.context.FLOAT,
              3,
              false,
              1
            )
        ) {
          vtkErrorMacro('Error setting gNormal in shader VAO.');
        }
      } else {
        cellBO.getVAO().removeAttributeArray('gNormal');
      }
      if (cellBO.getProgram().isAttributeUsed('gColor')) {
        if (
          !cellBO
            .getVAO()
            .addAttributeArrayWithDivisor(
              cellBO.getProgram(),
              model.colorBuffer,
              'gColor',
              0,
              4,
              model.context.UNSIGNED_BYTE,
              4,
              true,
              1,
              false
            )
        ) {
          vtkErrorMacro('Error setting gColor in shader VAO.');
        }
      } else {
        cellBO.getVAO().removeAttributeArray('gColor');
      }
      if (cellBO.getProgram().isAttributeUsed('mapperIndexVS')) {
        if (
          !cellBO
            .getVAO()
            .addAttributeArrayWithDivisor(
              cellBO.getProgram(),
              model.pickBuffer,
              'mapperIndexVS',
              0,
              4,
              model.context.UNSIGNED_BYTE,
              4,
              true,
              1,
              false
            )
        ) {
          vtkErrorMacro('Error setting mapperIndexVS in shader VAO.');
        }
      } else {
        cellBO.getVAO().removeAttributeArray('mapperIndexVS');
      }
      superClass.setMapperShaderParameters(cellBO, ren, actor);
      cellBO.getAttributeUpdateTime().modified();
      return;
    }

    superClass.setMapperShaderParameters(cellBO, ren, actor);
  };

  publicAPI.getNeedToRebuildBufferObjects = (ren, actor) => {
    model.renderable.buildArrays();

    // first do a coarse check
    // Note that the actor's mtime includes it's properties mtime
    const vmtime = model.VBOBuildTime.getMTime();
    if (vmtime < model.renderable.getBuildTime().getMTime()) {
      return true;
    }
    return superClass.getNeedToRebuildBufferObjects(ren, actor);
  };

  publicAPI.getNeedToRebuildShaders = (cellBO, ren, actor) => {
    if (
      superClass.getNeedToRebuildShaders(cellBO, ren, actor) ||
      cellBO.getShaderSourceTime().getMTime() < model.renderable.getMTime() ||
      cellBO.getShaderSourceTime().getMTime() < model.currentInput.getMTime()
    ) {
      return true;
    }
    return false;
  };

  publicAPI.buildBufferObjects = (ren, actor) => {
    const garray = model.renderable.getMatrixArray();

    const pts = model.renderable.getInputData(0).getPoints();
    const { useShiftAndScale, coordShift, coordScale } =
      computeCoordShiftAndScale(pts);

    // update the buffer objects if needed
    const narray = model.renderable.getNormalArray();
    const carray = model.renderable.getColorArray();
    if (!model.matrixBuffer) {
      model.matrixBuffer = vtkBufferObject.newInstance();
      model.matrixBuffer.setOpenGLRenderWindow(model._openGLRenderWindow);
      model.normalBuffer = vtkBufferObject.newInstance();
      model.normalBuffer.setOpenGLRenderWindow(model._openGLRenderWindow);
      model.colorBuffer = vtkBufferObject.newInstance();
      model.colorBuffer.setOpenGLRenderWindow(model._openGLRenderWindow);
      model.pickBuffer = vtkBufferObject.newInstance();
      model.pickBuffer.setOpenGLRenderWindow(model._openGLRenderWindow);
    }

    if (useShiftAndScale) {
      const buf = garray.buffer;
      const shiftScaleMat = computeInverseShiftAndScaleMatrix(
        coordShift,
        coordScale
      );
      mat4.invert(shiftScaleMat, shiftScaleMat);
      for (let ptIdx = 0; ptIdx < garray.byteLength; ptIdx += MAT4_BYTE_SIZE) {
        const mat = new Float32Array(buf, ptIdx, MAT4_ELEMENT_COUNT);
        mat4.multiply(mat, shiftScaleMat, mat);
      }
    }

    if (
      model.renderable.getBuildTime().getMTime() >
      model.glyphBOBuildTime.getMTime()
    ) {
      model.matrixBuffer.upload(garray, ObjectType.ARRAY_BUFFER);
      model.normalBuffer.upload(narray, ObjectType.ARRAY_BUFFER);
      if (carray) {
        model.colorBuffer.upload(carray.getData(), ObjectType.ARRAY_BUFFER);
      } else {
        model.colorBuffer.releaseGraphicsResources();
      }
      const numPts = garray.length / 16;
      const parray = new Uint8Array(4 * numPts);
      for (let i = 0; i < numPts; ++i) {
        let value = i + 1;
        const offset = i * 4;
        parray[offset] = value % 256;
        value -= parray[offset];
        value /= 256;
        parray[offset + 1] = value % 256;
        value -= parray[offset + 1];
        value /= 256;
        parray[offset + 2] = value % 256;
        parray[offset + 3] = 255;
      }
      model.pickBuffer.upload(parray, ObjectType.ARRAY_BUFFER);
      model.glyphBOBuildTime.modified();
    }

    superClass.buildBufferObjects(ren, actor);

    // apply shift + scale to primitives AFTER vtkOpenGLPolyDataMapper.buildBufferObjects
    // so that the Glyph3DMapper gets the last say in the shift + scale
    for (let i = primTypes.Start; i < primTypes.End; i++) {
      model.primitives[i]
        .getCABO()
        .setCoordShiftAndScale(
          useShiftAndScale ? coordShift : null,
          useShiftAndScale ? coordScale : null
        );
    }
  };
}

// ----------------------------------------------------------------------------
// Object factory
// ----------------------------------------------------------------------------

const DEFAULT_VALUES = {};

// ----------------------------------------------------------------------------

export function extend(publicAPI, model, initialValues = {}) {
  Object.assign(model, DEFAULT_VALUES, initialValues);

  // Inheritance
  vtkOpenGLPolyDataMapper.extend(publicAPI, model, initialValues);

  model.glyphBOBuildTime = {};
  macro.obj(model.glyphBOBuildTime, { mtime: 0 });

  // Object methods
  vtkOpenGLGlyph3DMapper(publicAPI, model);
}

// ----------------------------------------------------------------------------

export const newInstance = macro.newInstance(extend, 'vtkOpenGLGlyph3DMapper');

// ----------------------------------------------------------------------------

export default { newInstance, extend };

// Register ourself to OpenGL backend if imported
registerOverride('vtkGlyph3DMapper', newInstance);
