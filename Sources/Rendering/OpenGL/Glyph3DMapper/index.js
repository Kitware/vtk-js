import { mat3, mat4 } from 'gl-matrix';

import macro from 'vtk.js/Sources/macro';

import vtkBufferObject from 'vtk.js/Sources/Rendering/OpenGL/BufferObject';
import vtkHardwareSelector from 'vtk.js/Sources/Rendering/OpenGL/HardwareSelector';
import vtkProperty from 'vtk.js/Sources/Rendering/Core/Property';
import vtkOpenGLPolyDataMapper from 'vtk.js/Sources/Rendering/OpenGL/PolyDataMapper';
import vtkShaderProgram from 'vtk.js/Sources/Rendering/OpenGL/ShaderProgram';

const { vtkErrorMacro } = macro;
const { Representation } = vtkProperty;
const { ObjectType } = vtkBufferObject;
const { PassTypes } = vtkHardwareSelector;

const StartEvent = { type: 'StartEvent' };
const EndEvent = { type: 'EndEvent' };

// ----------------------------------------------------------------------------
// vtkOpenGLSphereMapper methods
// ----------------------------------------------------------------------------

function vtkOpenGLGlyph3DMapper(publicAPI, model) {
  // Set our className
  model.classHierarchy.push('vtkOpenGLGlyph3DMapper');

  // Capture 'parentClass' api for internal use
  const superClass = Object.assign({}, publicAPI);

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
    if (model.openGLRenderWindow.getWebgl2()) {
      model.hardwareSupport = true;
      model.extension = null;
    } else if (!model.extension) {
      model.extension = model.context.getExtension('ANGLE_instanced_arrays');
      model.hardwareSupport = !!model.extension;
    }
    // to test without extension support uncomment the next two lines
    // model.extension = null;
    // model.hardwareSupport = !!model.extension;

    const backfaceCulling = actor.getProperty().getBackfaceCulling();
    const frontfaceCulling = actor.getProperty().getFrontfaceCulling();
    if (!backfaceCulling && !frontfaceCulling) {
      model.openGLRenderWindow.disableCullFace();
    } else if (frontfaceCulling) {
      model.openGLRenderWindow.enableCullFace();
      gl.cullFace(gl.FRONT);
    } else {
      model.openGLRenderWindow.enableCullFace();
      gl.cullFace(gl.BACK);
    }

    publicAPI.renderPieceStart(ren, actor);
    publicAPI.renderPieceDraw(ren, actor);
    publicAPI.renderPieceFinish(ren, actor);
  };

  publicAPI.multiply4x4WithOffset = (out, a, b, off) => {
    const a00 = a[0];
    const a01 = a[1];
    const a02 = a[2];
    const a03 = a[3];
    const a10 = a[4];
    const a11 = a[5];
    const a12 = a[6];
    const a13 = a[7];
    const a20 = a[8];
    const a21 = a[9];
    const a22 = a[10];
    const a23 = a[11];
    const a30 = a[12];
    const a31 = a[13];
    const a32 = a[14];
    const a33 = a[15];

    // Cache only the current line of the second matrix
    let b0 = b[off];
    let b1 = b[off + 1];
    let b2 = b[off + 2];
    let b3 = b[off + 3];
    out[0] = b0 * a00 + b1 * a10 + b2 * a20 + b3 * a30;
    out[1] = b0 * a01 + b1 * a11 + b2 * a21 + b3 * a31;
    out[2] = b0 * a02 + b1 * a12 + b2 * a22 + b3 * a32;
    out[3] = b0 * a03 + b1 * a13 + b2 * a23 + b3 * a33;

    b0 = b[off + 4];
    b1 = b[off + 5];
    b2 = b[off + 6];
    b3 = b[off + 7];
    out[4] = b0 * a00 + b1 * a10 + b2 * a20 + b3 * a30;
    out[5] = b0 * a01 + b1 * a11 + b2 * a21 + b3 * a31;
    out[6] = b0 * a02 + b1 * a12 + b2 * a22 + b3 * a32;
    out[7] = b0 * a03 + b1 * a13 + b2 * a23 + b3 * a33;

    b0 = b[off + 8];
    b1 = b[off + 9];
    b2 = b[off + 10];
    b3 = b[off + 11];
    out[8] = b0 * a00 + b1 * a10 + b2 * a20 + b3 * a30;
    out[9] = b0 * a01 + b1 * a11 + b2 * a21 + b3 * a31;
    out[10] = b0 * a02 + b1 * a12 + b2 * a22 + b3 * a32;
    out[11] = b0 * a03 + b1 * a13 + b2 * a23 + b3 * a33;

    b0 = b[off + 12];
    b1 = b[off + 13];
    b2 = b[off + 14];
    b3 = b[off + 15];
    out[12] = b0 * a00 + b1 * a10 + b2 * a20 + b3 * a30;
    out[13] = b0 * a01 + b1 * a11 + b2 * a21 + b3 * a31;
    out[14] = b0 * a02 + b1 * a12 + b2 * a22 + b3 * a32;
    out[15] = b0 * a03 + b1 * a13 + b2 * a23 + b3 * a33;
  };

  publicAPI.replaceShaderNormal = (shaders, ren, actor) => {
    if (model.hardwareSupport) {
      const lastLightComplexity = model.lastBoundBO.getReferenceByName(
        'lastLightComplexity'
      );

      if (lastLightComplexity > 0) {
        let VSSource = shaders.Vertex;

        if (model.lastBoundBO.getCABO().getNormalOffset()) {
          VSSource = vtkShaderProgram.substitute(
            VSSource,
            '//VTK::Normal::Dec',
            [
              'attribute vec3 normalMC;',
              'attribute mat3 gNormal;',
              'uniform mat3 normalMatrix;',
              'varying vec3 normalVCVSOutput;',
            ]
          ).result;
          VSSource = vtkShaderProgram.substitute(
            VSSource,
            '//VTK::Normal::Impl',
            ['normalVCVSOutput = normalMatrix * gNormal * normalMC;']
          ).result;
        }
        shaders.Vertex = VSSource;
      }
    }
    superClass.replaceShaderNormal(shaders, ren, actor);
  };

  publicAPI.replaceShaderColor = (shaders, ren, actor) => {
    if (model.hardwareSupport && model.renderable.getColorArray()) {
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
      // by assiging a default value from the uniform
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
    if (model.hardwareSupport) {
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
            '  gl_Position = MCDCMatrix * gVertexMC;',
          ]
        ).result;
        VSSource = vtkShaderProgram.substitute(VSSource, '//VTK::Camera::Dec', [
          'attribute mat4 gMatrix;',
          'uniform mat4 MCDCMatrix;',
          'uniform mat4 MCVCMatrix;',
        ]).result;
      } else {
        VSSource = vtkShaderProgram.substitute(VSSource, '//VTK::Camera::Dec', [
          'attribute mat4 gMatrix;',
          'uniform mat4 MCDCMatrix;',
        ]).result;
        VSSource = vtkShaderProgram.substitute(
          VSSource,
          '//VTK::PositionVC::Impl',
          [
            'vec4 gVertexMC = gMatrix * vertexMC;',
            '  gl_Position = MCDCMatrix * gVertexMC;',
          ]
        ).result;
      }
      shaders.Vertex = VSSource;
    }
    superClass.replaceShaderPositionVC(shaders, ren, actor);
  };

  publicAPI.replaceShaderPicking = (shaders, ren, actor) => {
    if (model.hardwareSupport) {
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
    } else {
      superClass.replaceShaderPicking(shaders, ren, actor);
    }
  };

  publicAPI.updateGlyphShaderParameters = (
    normalMatrixUsed,
    mcvcMatrixUsed,
    cellBO,
    carray,
    garray,
    narray,
    p,
    selector
  ) => {
    const program = cellBO.getProgram();

    if (normalMatrixUsed) {
      const a = model.normalMatrix;
      const b = narray;
      const ofs = p * 9;
      const out = model.tmpMat3;

      const a00 = a[0];
      const a01 = a[1];
      const a02 = a[2];
      const a10 = a[3];
      const a11 = a[4];
      const a12 = a[5];
      const a20 = a[6];
      const a21 = a[7];
      const a22 = a[8];

      const b00 = b[ofs];
      const b01 = b[ofs + 1];
      const b02 = b[ofs + 2];
      const b10 = b[ofs + 3];
      const b11 = b[ofs + 4];
      const b12 = b[ofs + 5];
      const b20 = b[ofs + 6];
      const b21 = b[ofs + 7];
      const b22 = b[ofs + 8];

      out[0] = b00 * a00 + b01 * a10 + b02 * a20;
      out[1] = b00 * a01 + b01 * a11 + b02 * a21;
      out[2] = b00 * a02 + b01 * a12 + b02 * a22;

      out[3] = b10 * a00 + b11 * a10 + b12 * a20;
      out[4] = b10 * a01 + b11 * a11 + b12 * a21;
      out[5] = b10 * a02 + b11 * a12 + b12 * a22;

      out[6] = b20 * a00 + b21 * a10 + b22 * a20;
      out[7] = b20 * a01 + b21 * a11 + b22 * a21;
      out[8] = b20 * a02 + b21 * a12 + b22 * a22;

      program.setUniformMatrix3x3('normalMatrix', model.tmpMat3);
    }
    publicAPI.multiply4x4WithOffset(
      model.tmpMat4,
      model.mcdcMatrix,
      garray,
      p * 16
    );
    program.setUniformMatrix('MCDCMatrix', model.tmpMat4);
    if (mcvcMatrixUsed) {
      publicAPI.multiply4x4WithOffset(
        model.tmpMat4,
        model.mcvcMatrix,
        garray,
        p * 16
      );
      program.setUniformMatrix('MCVCMatrix', model.tmpMat4);
    }

    // set color
    if (carray) {
      const cdata = carray.getData();
      model.tmpColor[0] = cdata[p * 4] / 255.0;
      model.tmpColor[1] = cdata[p * 4 + 1] / 255.0;
      model.tmpColor[2] = cdata[p * 4 + 2] / 255.0;
      program.setUniform3fArray('ambientColorUniform', model.tmpColor);
      program.setUniform3fArray('diffuseColorUniform', model.tmpColor);
    }

    if (selector) {
      program.setUniform3fArray('mapperIndex', selector.getPropColorValue());
    }
  };

  publicAPI.renderPieceDraw = (ren, actor) => {
    const representation = actor.getProperty().getRepresentation();

    const gl = model.context;

    const drawSurfaceWithEdges =
      actor.getProperty().getEdgeVisibility() &&
      representation === Representation.SURFACE;

    // // [WMVD]C == {world, model, view, display} coordinates
    // // E.g., WCDC == world to display coordinate transformation
    const keyMats = model.openGLCamera.getKeyMatrices(ren);
    const actMats = model.openGLActor.getKeyMatrices();

    // precompute the actor+camera mats once
    mat3.multiply(
      model.normalMatrix,
      keyMats.normalMatrix,
      actMats.normalMatrix
    );
    mat4.multiply(model.mcdcMatrix, keyMats.wcdc, actMats.mcwc);
    mat4.multiply(model.mcvcMatrix, keyMats.wcvc, actMats.mcwc);

    const garray = model.renderable.getMatrixArray();
    const narray = model.renderable.getNormalArray();
    const carray = model.renderable.getColorArray();
    const numPts = garray.length / 16;

    let compositePass = false;
    if (model.openGLRenderer.getSelector()) {
      if (
        model.openGLRenderer.getSelector().getCurrentPass() ===
        PassTypes.COMPOSITE_INDEX_PASS
      ) {
        compositePass = true;
      }
    }

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
        publicAPI.updateShaders(model.primitives[i], ren, actor);
        const program = model.primitives[i].getProgram();

        const mode = publicAPI.getOpenGLMode(representation, i);
        const normalMatrixUsed = program.isUniformUsed('normalMatrix');
        const mcvcMatrixUsed = program.isUniformUsed('MCVCMatrix');

        if (model.hardwareSupport) {
          if (model.extension) {
            model.extension.drawArraysInstancedANGLE(
              mode,
              0,
              cabo.getElementCount(),
              numPts
            );
          } else {
            gl.drawArraysInstanced(mode, 0, cabo.getElementCount(), numPts);
          }
        } else {
          // draw the array multiple times with different cam matrix
          for (let p = 0; p < numPts; ++p) {
            if (compositePass) {
              model.openGLRenderer.getSelector().renderCompositeIndex(p);
            }
            publicAPI.updateGlyphShaderParameters(
              normalMatrixUsed,
              mcvcMatrixUsed,
              model.primitives[i],
              carray,
              garray,
              narray,
              p,
              compositePass ? model.openGLRenderer.getSelector() : null
            );
            gl.drawArrays(mode, 0, cabo.getElementCount());
          }
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

  publicAPI.buildBufferObjects = (ren, actor) => {
    if (model.hardwareSupport) {
      // update the buffer objects if needed
      const garray = model.renderable.getMatrixArray();
      const narray = model.renderable.getNormalArray();
      const carray = model.renderable.getColorArray();
      if (!model.matrixBuffer) {
        model.matrixBuffer = vtkBufferObject.newInstance();
        model.matrixBuffer.setOpenGLRenderWindow(model.openGLRenderWindow);
        model.normalBuffer = vtkBufferObject.newInstance();
        model.normalBuffer.setOpenGLRenderWindow(model.openGLRenderWindow);
        model.colorBuffer = vtkBufferObject.newInstance();
        model.colorBuffer.setOpenGLRenderWindow(model.openGLRenderWindow);
        model.pickBuffer = vtkBufferObject.newInstance();
        model.pickBuffer.setOpenGLRenderWindow(model.openGLRenderWindow);
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
    }
    return superClass.buildBufferObjects(ren, actor);
  };
}

// ----------------------------------------------------------------------------
// Object factory
// ----------------------------------------------------------------------------

const DEFAULT_VALUES = {
  normalMatrix: null,
  mcdcMatrix: null,
  mcwcMatrix: null,
};

// ----------------------------------------------------------------------------

export function extend(publicAPI, model, initialValues = {}) {
  Object.assign(model, DEFAULT_VALUES, initialValues);

  // Inheritance
  vtkOpenGLPolyDataMapper.extend(publicAPI, model, initialValues);

  model.tmpMat3 = mat3.create();
  model.normalMatrix = mat3.create();
  model.mcdcMatrix = mat4.create();
  model.mcvcMatrix = mat4.create();
  model.tmpColor = [];

  model.glyphBOBuildTime = {};
  macro.obj(model.glyphBOBuildTime, { mtime: 0 });

  // Object methods
  vtkOpenGLGlyph3DMapper(publicAPI, model);
}

// ----------------------------------------------------------------------------

export const newInstance = macro.newInstance(extend, 'vtkOpenGLGlyph3DMapper');

// ----------------------------------------------------------------------------

export default { newInstance, extend };
