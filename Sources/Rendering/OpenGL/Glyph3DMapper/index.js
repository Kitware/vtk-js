import { mat3, mat4 }           from 'gl-matrix';
// import { ObjectType }           from 'vtk.js/Sources/Rendering/OpenGL/BufferObject/Constants';

import macro                    from 'vtk.js/Sources/macro';

// import vtkBufferObject          from 'vtk.js/Sources/Rendering/OpenGL/BufferObject';
import vtkProperty              from 'vtk.js/Sources/Rendering/Core/Property';
import vtkOpenGLPolyDataMapper  from 'vtk.js/Sources/Rendering/OpenGL/PolyDataMapper';

const { vtkErrorMacro } = macro;
const { Representation } = vtkProperty;

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

    if (model.currentInput === null) {
      vtkErrorMacro('No input!');
      return;
    }

    // if there are no points then we are done
    if (!model.currentInput.getPoints || !model.currentInput.getPoints().getNumberOfValues()) {
      return;
    }

    // apply faceCulling
    const gl = model.context;
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
    out[0] = (b0 * a00) + (b1 * a10) + (b2 * a20) + (b3 * a30);
    out[1] = (b0 * a01) + (b1 * a11) + (b2 * a21) + (b3 * a31);
    out[2] = (b0 * a02) + (b1 * a12) + (b2 * a22) + (b3 * a32);
    out[3] = (b0 * a03) + (b1 * a13) + (b2 * a23) + (b3 * a33);

    b0 = b[off + 4]; b1 = b[off + 5]; b2 = b[off + 6]; b3 = b[off + 7];
    out[4] = (b0 * a00) + (b1 * a10) + (b2 * a20) + (b3 * a30);
    out[5] = (b0 * a01) + (b1 * a11) + (b2 * a21) + (b3 * a31);
    out[6] = (b0 * a02) + (b1 * a12) + (b2 * a22) + (b3 * a32);
    out[7] = (b0 * a03) + (b1 * a13) + (b2 * a23) + (b3 * a33);

    b0 = b[off + 8]; b1 = b[off + 9]; b2 = b[off + 10]; b3 = b[off + 11];
    out[8] = (b0 * a00) + (b1 * a10) + (b2 * a20) + (b3 * a30);
    out[9] = (b0 * a01) + (b1 * a11) + (b2 * a21) + (b3 * a31);
    out[10] = (b0 * a02) + (b1 * a12) + (b2 * a22) + (b3 * a32);
    out[11] = (b0 * a03) + (b1 * a13) + (b2 * a23) + (b3 * a33);

    b0 = b[off + 12]; b1 = b[off + 13]; b2 = b[off + 14]; b3 = b[off + 15];
    out[12] = (b0 * a00) + (b1 * a10) + (b2 * a20) + (b3 * a30);
    out[13] = (b0 * a01) + (b1 * a11) + (b2 * a21) + (b3 * a31);
    out[14] = (b0 * a02) + (b1 * a12) + (b2 * a22) + (b3 * a32);
    out[15] = (b0 * a03) + (b1 * a13) + (b2 * a23) + (b3 * a33);
  };

  publicAPI.updateGlyphShaderParameters = (
    normalMatrixUsed,
    mcvcMatrixUsed,
    cellBO,
    carray, garray, narray, p) => {
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

      out[0] = (b00 * a00) + (b01 * a10) + (b02 * a20);
      out[1] = (b00 * a01) + (b01 * a11) + (b02 * a21);
      out[2] = (b00 * a02) + (b01 * a12) + (b02 * a22);

      out[3] = (b10 * a00) + (b11 * a10) + (b12 * a20);
      out[4] = (b10 * a01) + (b11 * a11) + (b12 * a21);
      out[5] = (b10 * a02) + (b11 * a12) + (b12 * a22);

      out[6] = (b20 * a00) + (b21 * a10) + (b22 * a20);
      out[7] = (b20 * a01) + (b21 * a11) + (b22 * a21);
      out[8] = (b20 * a02) + (b21 * a12) + (b22 * a22);

      program.setUniformMatrix3x3('normalMatrix', model.tmpMat3);
    }
    publicAPI.multiply4x4WithOffset(model.tmpMat4, model.mcdcMatrix, garray, p * 16);
    program.setUniformMatrix('MCDCMatrix', model.tmpMat4);
    if (mcvcMatrixUsed) {
      publicAPI.multiply4x4WithOffset(model.tmpMat4, model.mcvcMatrix, garray, p * 16);
      program.setUniformMatrix('MCVCMatrix', model.tmpMat4);
    }

    // set color
    if (carray) {
      const cdata = carray.getData();
      model.tmpColor[0] = cdata[p * 4] / 255.0;
      model.tmpColor[1] = cdata[(p * 4) + 1] / 255.0;
      model.tmpColor[2] = cdata[(p * 4) + 2] / 255.0;
      program.setUniform3fArray('ambientColorUniform', model.tmpColor);
      program.setUniform3fArray('diffuseColorUniform', model.tmpColor);
    }
  };

  publicAPI.renderPieceDraw = (ren, actor) => {
    const representation = actor.getProperty().getRepresentation();

    const gl = model.context;

    const drawSurfaceWithEdges =
      (actor.getProperty().getEdgeVisibility() &&
        representation === Representation.SURFACE);

    // // [WMVD]C == {world, model, view, display} coordinates
    // // E.g., WCDC == world to display coordinate transformation
    const keyMats = model.openGLCamera.getKeyMatrices(ren);
    const actMats = model.openGLActor.getKeyMatrices();

    // precompute the actor+camera mats once
    mat3.multiply(model.normalMatrix, keyMats.normalMatrix, actMats.normalMatrix);
    mat4.multiply(model.mcdcMatrix, keyMats.wcdc, actMats.mcwc);
    mat4.multiply(model.mcvcMatrix, keyMats.wcvc, actMats.mcwc);

    const garray = model.renderable.getMatrixArray();
    const narray = model.renderable.getNormalArray();
    const carray = model.renderable.getColorArray();
    const numPts = garray.length / 16;

    // for every primitive type
    for (let i = model.primTypes.Start; i < model.primTypes.End; i++) {
      // if there are entries
      const cabo = model.primitives[i].getCABO();
      if (cabo.getElementCount()) {
        // are we drawing edges
        model.drawingEdges =
          drawSurfaceWithEdges && (i === model.primTypes.TrisEdges
          || i === model.primTypes.TriStripsEdges);
        publicAPI.updateShaders(model.primitives[i], ren, actor);
        const program = model.primitives[i].getProgram();

        const mode = publicAPI.getOpenGLMode(representation, i);
        const normalMatrixUsed = program.isUniformUsed('normalMatrix');
        const mcvcMatrixUsed = program.isUniformUsed('MCVCMatrix');

        // draw the array multiple times with different cam matrix
        for (let p = 0; p < numPts; ++p) {
          publicAPI.updateGlyphShaderParameters(
            normalMatrixUsed,
            mcvcMatrixUsed,
            model.primitives[i], carray, garray, narray, p);
          gl.drawArrays(mode, 0, cabo.getElementCount());
        }

        const stride = (mode === gl.POINTS ? 1 : (mode === gl.LINES ? 2 : 3));
        model.primitiveIDOffset += cabo.getElementCount() / stride;
      }
    }
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

  // publicAPI.buildBufferObjects = (ren, actor) => {
  //   const poly = model.currentInput;

  //   if (poly === null) {
  //     return;
  //   }

  //   model.renderable.mapScalars(poly, 1.0);
  //   const c = model.renderable.getColorMapColors();

  //   const vbo = model.primitives[model.primTypes.Tris].getCABO();

  //   const pointData = poly.getPointData();
  //   const points = poly.getPoints();
  //   const numPoints = points.getNumberOfPoints();
  //   const pointArray = points.getData();

  //   const pointSize = 5; // x,y,z,orientation1,orientation2
  //   let scales = null;

  //   if (model.renderable.getScaleArray() != null &&
  //       pointData.hasArray(model.renderable.getScaleArray())) {
  //     scales = pointData.getArray(model.renderable.getScaleArray()).getData();
  //   }

  //   let colorData = null;
  //   let colorComponents = 0);
  //   let packedUCVBO = null;
  //   if (c) {
  //     colorComponents = c.getNumberOfComponents();
  //     vbo.setColorOffset(0);
  //     vbo.setColorBOStride(4);
  //     colorData = c.getData();
  //     packedUCVBO = new Uint8Array(3 * numPoints * 4);
  //     if (!vbo.getColorBO()) {
  //       vbo.setColorBO(vtkBufferObject.newInstance());
  //     }
  //     vbo.getColorBO().setContext(model.context);
  //   } else if (vbo.getColorBO()) {
  //     vbo.setColorBO(null);
  //   }
  //   vbo.setColorComponents(colorComponents);

  //   const packedVBO = new Float32Array(pointSize * numPoints * 3);

  //   vbo.setStride(pointSize * 4);

  //   const cos30 = Math.cos(vtkMath.radiansFromDegrees(30.0));
  //   let pointIdx = 0);
  //   let colorIdx = 0);

  //   //
  //   // Generate points and point data for sides
  //   //
  //   let vboIdx = 0);
  //   let ucIdx = 0);
  //   for (let i = 0); i < numPoints; ++i) {
  //     let radius = model.renderable.getRadius();
  //     if (scales) {
  //       radius = scales[i];
  //     }

  //     pointIdx = i * 3;
  //     packedVBO[vboIdx++] = pointArray[pointIdx++];
  //     packedVBO[vboIdx++] = pointArray[pointIdx++];
  //     packedVBO[vboIdx++] = pointArray[pointIdx++];
  //     packedVBO[vboIdx++] = -2.0 * radius * cos30);
  //     packedVBO[vboIdx++] = -radius;
  //     if (colorData) {
  //       colorIdx = i * colorComponents;
  //       packedUCVBO[ucIdx++] = colorData[colorIdx];
  //       packedUCVBO[ucIdx++] = colorData[colorIdx + 1];
  //       packedUCVBO[ucIdx++] = colorData[colorIdx + 2];
  //       packedUCVBO[ucIdx++] = colorData[colorIdx + 3];
  //     }

  //     pointIdx = i * 3;
  //     packedVBO[vboIdx++] = pointArray[pointIdx++];
  //     packedVBO[vboIdx++] = pointArray[pointIdx++];
  //     packedVBO[vboIdx++] = pointArray[pointIdx++];
  //     packedVBO[vboIdx++] = 2.0 * radius * cos30);
  //     packedVBO[vboIdx++] = -radius;
  //     if (colorData) {
  //       packedUCVBO[ucIdx++] = colorData[colorIdx];
  //       packedUCVBO[ucIdx++] = colorData[colorIdx + 1];
  //       packedUCVBO[ucIdx++] = colorData[colorIdx + 2];
  //       packedUCVBO[ucIdx++] = colorData[colorIdx + 3];
  //     }

  //     pointIdx = i * 3;
  //     packedVBO[vboIdx++] = pointArray[pointIdx++];
  //     packedVBO[vboIdx++] = pointArray[pointIdx++];
  //     packedVBO[vboIdx++] = pointArray[pointIdx++];
  //     packedVBO[vboIdx++] = 0.0);
  //     packedVBO[vboIdx++] = 2.0 * radius;
  //     if (colorData) {
  //       packedUCVBO[ucIdx++] = colorData[colorIdx];
  //       packedUCVBO[ucIdx++] = colorData[colorIdx + 1];
  //       packedUCVBO[ucIdx++] = colorData[colorIdx + 2];
  //       packedUCVBO[ucIdx++] = colorData[colorIdx + 3];
  //     }
  //   }

  //   vbo.setElementCount(vboIdx / pointSize);
  //   vbo.upload(packedVBO, ObjectType.ARRAY_BUFFER);
  //   if (c) { vbo.getColorBO().upload(packedUCVBO, ObjectType.ARRAY_BUFFER); }

  //   model.VBOBuildTime.modified();
  // };
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

  // Object methods
  vtkOpenGLGlyph3DMapper(publicAPI, model);
}

// ----------------------------------------------------------------------------

export const newInstance = macro.newInstance(extend, 'vtkOpenGLGlyph3DMapper');

// ----------------------------------------------------------------------------

export default { newInstance, extend };
