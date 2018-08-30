import { mat3, mat4 } from 'gl-matrix';
import { ObjectType } from 'vtk.js/Sources/Rendering/OpenGL/BufferObject/Constants';

import * as macro from 'vtk.js/Sources/macro';

import vtkBufferObject from 'vtk.js/Sources/Rendering/OpenGL/BufferObject';
import vtkStickMapperVS from 'vtk.js/Sources/Rendering/OpenGL/glsl/vtkStickMapperVS.glsl';
import vtkPolyDataFS from 'vtk.js/Sources/Rendering/OpenGL/glsl/vtkPolyDataFS.glsl';

import vtkShaderProgram from 'vtk.js/Sources/Rendering/OpenGL/ShaderProgram';
import vtkOpenGLPolyDataMapper from 'vtk.js/Sources/Rendering/OpenGL/PolyDataMapper';

const { vtkErrorMacro } = macro;

// ----------------------------------------------------------------------------
// vtkOpenGLStickMapper methods
// ----------------------------------------------------------------------------

function vtkOpenGLStickMapper(publicAPI, model) {
  // Set our className
  model.classHierarchy.push('vtkOpenGLStickMapper');

  // Capture 'parentClass' api for internal use
  const superClass = Object.assign({}, publicAPI);

  publicAPI.getShaderTemplate = (shaders, ren, actor) => {
    shaders.Vertex = vtkStickMapperVS;
    shaders.Fragment = vtkPolyDataFS;
    shaders.Geometry = '';
  };

  publicAPI.replaceShaderValues = (shaders, ren, actor) => {
    let VSSource = shaders.Vertex;
    let FSSource = shaders.Fragment;

    VSSource = vtkShaderProgram.substitute(VSSource, '//VTK::Camera::Dec', [
      'uniform mat4 VCDCMatrix;\n',
      'uniform mat4 MCVCMatrix;',
    ]).result;

    FSSource = vtkShaderProgram.substitute(
      FSSource,
      '//VTK::PositionVC::Dec',
      'varying vec4 vertexVCVSOutput;'
    ).result;

    // we create vertexVC below, so turn off the default
    // implementation
    FSSource = vtkShaderProgram.substitute(
      FSSource,
      '//VTK::PositionVC::Impl',
      '  vec4 vertexVC = vertexVCVSOutput;\n'
    ).result;

    // for lights kit and positional the VCDC matrix is already defined
    // so don't redefine it
    const replacement = [
      'uniform int cameraParallel;\n',
      'varying float radiusVCVSOutput;\n',
      'varying vec3 orientVCVSOutput;\n',
      'varying float lengthVCVSOutput;\n',
      'varying vec3 centerVCVSOutput;\n',
      'uniform mat4 VCDCMatrix;\n',
    ];
    FSSource = vtkShaderProgram.substitute(
      FSSource,
      '//VTK::Normal::Dec',
      replacement
    ).result;

    let fragString = '';
    if (model.context.getExtension('EXT_frag_depth')) {
      fragString = '  gl_FragDepthEXT = (pos.z / pos.w + 1.0) / 2.0;\n';
    }
    if (model.openGLRenderWindow.getWebgl2()) {
      fragString = 'gl_FragDepth = (pos.z / pos.w + 1.0) / 2.0;\n';
    }
    // see https://www.cl.cam.ac.uk/teaching/1999/AGraphHCI/SMAG/node2.html
    FSSource = vtkShaderProgram.substitute(FSSource, '//VTK::Depth::Impl', [
      // compute the eye position and unit direction
      '  vec3 EyePos;\n',
      '  vec3 EyeDir;\n',
      '  if (cameraParallel != 0) {\n',
      '    EyePos = vec3(vertexVC.x, vertexVC.y, vertexVC.z + 3.0*radiusVCVSOutput);\n',
      '    EyeDir = vec3(0.0,0.0,-1.0); }\n',
      '  else {\n',
      '    EyeDir = vertexVC.xyz;\n',
      '    EyePos = vec3(0.0,0.0,0.0);\n',
      '    float lengthED = length(EyeDir);\n',
      '    EyeDir = normalize(EyeDir);\n',
      // we adjust the EyePos to be closer if it is too far away
      // to prevent floating point precision noise
      '    if (lengthED > radiusVCVSOutput*3.0) {\n',
      '      EyePos = vertexVC.xyz - EyeDir*3.0*radiusVCVSOutput; }\n',
      '    }\n',

      // translate to Stick center
      '  EyePos = EyePos - centerVCVSOutput;\n',

      // rotate to new basis
      // base1, base2, orientVC
      '  vec3 base1;\n',
      '  if (abs(orientVCVSOutput.z) < 0.99) {\n',
      '    base1 = normalize(cross(orientVCVSOutput,vec3(0.0,0.0,1.0))); }\n',
      '  else {\n',
      '    base1 = normalize(cross(orientVCVSOutput,vec3(0.0,1.0,0.0))); }\n',
      '  vec3 base2 = cross(orientVCVSOutput,base1);\n',
      '  EyePos = vec3(dot(EyePos,base1),dot(EyePos,base2),dot(EyePos,orientVCVSOutput));\n',
      '  EyeDir = vec3(dot(EyeDir,base1),dot(EyeDir,base2),dot(EyeDir,orientVCVSOutput));\n',

      // scale by radius
      '  EyePos = EyePos/radiusVCVSOutput;\n',

      // find the intersection
      '  float a = EyeDir.x*EyeDir.x + EyeDir.y*EyeDir.y;\n',
      '  float b = 2.0*(EyePos.x*EyeDir.x + EyePos.y*EyeDir.y);\n',
      '  float c = EyePos.x*EyePos.x + EyePos.y*EyePos.y - 1.0;\n',
      '  float d = b*b - 4.0*a*c;\n',
      '  vec3 normalVCVSOutput = vec3(0.0,0.0,1.0);\n',
      '  if (d < 0.0) { discard; }\n',
      '  else {\n',
      '    float t =  (-b - sqrt(d))/(2.0*a);\n',
      '    float tz = EyePos.z + t*EyeDir.z;\n',
      '    vec3 iPoint = EyePos + t*EyeDir;\n',
      '    if (abs(iPoint.z)*radiusVCVSOutput > lengthVCVSOutput*0.5) {\n',
      // test for end cap
      '      float t2 = (-b + sqrt(d))/(2.0*a);\n',
      '      float tz2 = EyePos.z + t2*EyeDir.z;\n',
      '      if (tz2*radiusVCVSOutput > lengthVCVSOutput*0.5 || tz*radiusVCVSOutput < -0.5*lengthVCVSOutput) { discard; }\n',
      '      else {\n',
      '        normalVCVSOutput = orientVCVSOutput;\n',
      '        float t3 = (lengthVCVSOutput*0.5/radiusVCVSOutput - EyePos.z)/EyeDir.z;\n',
      '        iPoint = EyePos + t3*EyeDir;\n',
      '        vertexVC.xyz = radiusVCVSOutput*(iPoint.x*base1 + iPoint.y*base2 + iPoint.z*orientVCVSOutput) + centerVCVSOutput;\n',
      '        }\n',
      '      }\n',
      '    else {\n',
      // The normal is the iPoint.xy rotated back into VC
      '      normalVCVSOutput = iPoint.x*base1 + iPoint.y*base2;\n',
      // rescale rerotate and translate
      '      vertexVC.xyz = radiusVCVSOutput*(normalVCVSOutput + iPoint.z*orientVCVSOutput) + centerVCVSOutput;\n',
      '      }\n',
      '    }\n',

      //    '  vec3 normalVC = vec3(0.0,0.0,1.0);\n'
      // compute the pixel's depth
      '  vec4 pos = VCDCMatrix * vertexVC;\n',
      fragString,
    ]).result;

    // Strip out the normal line -- the normal is computed as part of the depth
    FSSource = vtkShaderProgram.substitute(FSSource, '//VTK::Normal::Impl', '')
      .result;

    if (model.haveSeenDepthRequest) {
      // special depth impl
      FSSource = vtkShaderProgram.substitute(FSSource, '//VTK::ZBuffer::Impl', [
        'if (depthRequest == 1) {',
        'float computedZ = (pos.z / pos.w + 1.0) / 2.0;',
        'float iz = floor(computedZ * 65535.0 + 0.1);',
        'float rf = floor(iz/256.0)/255.0;',
        'float gf = mod(iz,256.0)/255.0;',
        'gl_FragData[0] = vec4(rf, gf, 0.0, 1.0); }',
      ]).result;
    }

    shaders.Vertex = VSSource;
    shaders.Fragment = FSSource;

    superClass.replaceShaderValues(shaders, ren, actor);
  };

  publicAPI.setMapperShaderParameters = (cellBO, ren, actor) => {
    if (
      cellBO.getCABO().getElementCount() &&
      (model.VBOBuildTime > cellBO.getAttributeUpdateTime().getMTime() ||
        cellBO.getShaderSourceTime().getMTime() >
          cellBO.getAttributeUpdateTime().getMTime())
    ) {
      if (cellBO.getProgram().isAttributeUsed('orientMC')) {
        if (
          !cellBO.getVAO().addAttributeArray(
            cellBO.getProgram(),
            cellBO.getCABO(),
            'orientMC',
            12, // after X Y Z
            cellBO.getCABO().getStride(),
            model.context.FLOAT,
            3,
            false
          )
        ) {
          vtkErrorMacro("Error setting 'orientMC' in shader VAO.");
        }
      }
      if (cellBO.getProgram().isAttributeUsed('offsetMC')) {
        if (
          !cellBO
            .getVAO()
            .addAttributeArray(
              cellBO.getProgram(),
              cellBO.getCABO().getColorBO(),
              'offsetMC',
              0,
              cellBO.getCABO().getColorBOStride(),
              model.context.UNSIGNED_BYTE,
              3,
              true
            )
        ) {
          vtkErrorMacro("Error setting 'offsetMC' in shader VAO.");
        }
      }
      if (cellBO.getProgram().isAttributeUsed('radiusMC')) {
        if (
          !cellBO.getVAO().addAttributeArray(
            cellBO.getProgram(),
            cellBO.getCABO(),
            'radiusMC',
            24, // X Y Z OX OY OZ
            cellBO.getCABO().getStride(),
            model.context.FLOAT,
            1,
            false
          )
        ) {
          vtkErrorMacro("Error setting 'radiusMC' in shader VAO.");
        }
      }
    }

    superClass.setMapperShaderParameters(cellBO, ren, actor);
  };

  publicAPI.setCameraShaderParameters = (cellBO, ren, actor) => {
    const program = cellBO.getProgram();

    const cam = ren.getActiveCamera();
    const keyMats = model.openGLCamera.getKeyMatrices(ren);

    if (program.isUniformUsed('VCDCMatrix')) {
      program.setUniformMatrix('VCDCMatrix', keyMats.vcdc);
    }

    if (!actor.getIsIdentity()) {
      const actMats = model.openGLActor.getKeyMatrices();
      const tmp4 = mat4.create();

      if (program.isUniformUsed('MCVCMatrix')) {
        mat4.multiply(tmp4, keyMats.wcvc, actMats.mcwc);
        program.setUniformMatrix('MCVCMatrix', tmp4);
      }
      if (program.isUniformUsed('normalMatrix')) {
        const anorms = mat3.create();
        mat3.multiply(anorms, keyMats.normalMatrix, actMats.normalMatrix);
        program.setUniformMatrix3x3('normalMatrix', anorms);
      }
    } else {
      if (program.isUniformUsed('MCVCMatrix')) {
        program.setUniformMatrix('MCVCMatrix', keyMats.wcvc);
      }
      if (program.isUniformUsed('normalMatrix')) {
        program.setUniformMatrix3x3('normalMatrix', keyMats.normalMatrix);
      }
    }

    if (program.isUniformUsed('cameraParallel')) {
      cellBO
        .getProgram()
        .setUniformi('cameraParallel', cam.getParallelProjection());
    }
  };

  publicAPI.getOpenGLMode = (rep, type) => model.context.TRIANGLES;

  publicAPI.buildBufferObjects = (ren, actor) => {
    const poly = model.currentInput;

    if (poly === null) {
      return;
    }

    model.renderable.mapScalars(poly, 1.0);
    const c = model.renderable.getColorMapColors();

    const vbo = model.primitives[model.primTypes.Tris].getCABO();

    const pointData = poly.getPointData();
    const points = poly.getPoints();
    const numPoints = points.getNumberOfPoints();
    const pointArray = points.getData();
    let pointSize = 3; // x,y,z

    // three more floats for orientation + 1 for radius
    pointSize += 4;

    let colorData = null;
    let colorComponents = 0;
    vbo.setColorBOStride(4);

    if (!vbo.getColorBO()) {
      vbo.setColorBO(vtkBufferObject.newInstance());
    }
    vbo.getColorBO().setOpenGLRenderWindow(model.openGLRenderWindow);
    if (c) {
      colorComponents = c.getNumberOfComponents();
      vbo.setColorOffset(4);
      colorData = c.getData();
      vbo.setColorBOStride(8);
    }
    vbo.setColorComponents(colorComponents);

    vbo.setStride(pointSize * 4);

    // Create a buffer, and copy the data over.
    const packedVBO = new Float32Array(pointSize * numPoints * 12);
    const packedUCVBO = new Uint8Array(12 * numPoints * (colorData ? 8 : 4));

    let scales = null;
    let orientationArray = null;
    //
    // Generate points and point data for sides
    //
    if (
      model.renderable.getScaleArray() != null &&
      pointData.hasArray(model.renderable.getScaleArray())
    ) {
      scales = pointData.getArray(model.renderable.getScaleArray()).getData();
    }

    if (
      model.renderable.getOrientationArray() != null &&
      pointData.hasArray(model.renderable.getOrientationArray())
    ) {
      orientationArray = pointData
        .getArray(model.renderable.getOrientationArray())
        .getData();
    } else {
      vtkErrorMacro([
        'Error setting orientationArray.\n',
        'You have to specify the stick orientation',
      ]);
    }

    // Vertices
    // 013 - 032 - 324 - 453
    //
    //       _.4---_.5
    //    .-*   .-*
    //   2-----3
    //   |    /|
    //   |   / |
    //   |  /  |
    //   | /   |
    //   |/    |
    //   0-----1
    //
    // coord for each points
    // 0: 000
    // 1: 100
    // 2: 001
    // 3: 101
    // 4: 011
    // 5: 111

    // prettier-ignore
    const verticesArray = [
      0, 1, 3,
      0, 3, 2,
      2, 3, 5,
      2, 5, 4,
    ];

    let pointIdx = 0;
    let colorIdx = 0;
    let vboIdx = 0;
    let ucIdx = 0;

    for (let i = 0; i < numPoints; ++i) {
      let length = model.renderable.getLength();
      let radius = model.renderable.getRadius();
      if (scales) {
        length = scales[i * 2];
        radius = scales[i * 2 + 1];
      }

      for (let j = 0; j < verticesArray.length; ++j) {
        pointIdx = i * 3;
        packedVBO[vboIdx++] = pointArray[pointIdx++];
        packedVBO[vboIdx++] = pointArray[pointIdx++];
        packedVBO[vboIdx++] = pointArray[pointIdx++];
        pointIdx = i * 3;
        packedVBO[vboIdx++] = orientationArray[pointIdx++] * length;
        packedVBO[vboIdx++] = orientationArray[pointIdx++] * length;
        packedVBO[vboIdx++] = orientationArray[pointIdx++] * length;
        packedVBO[vboIdx++] = radius;

        packedUCVBO[ucIdx++] = 255 * (verticesArray[j] % 2);
        packedUCVBO[ucIdx++] = verticesArray[j] >= 4 ? 255 : 0;
        packedUCVBO[ucIdx++] = verticesArray[j] >= 2 ? 255 : 0;
        packedUCVBO[ucIdx++] = 255;

        colorIdx = i * colorComponents;
        if (colorData) {
          packedUCVBO[ucIdx++] = colorData[colorIdx];
          packedUCVBO[ucIdx++] = colorData[colorIdx + 1];
          packedUCVBO[ucIdx++] = colorData[colorIdx + 2];
          packedUCVBO[ucIdx++] = colorData[colorIdx + 3];
        }
      }
    }
    vbo.setElementCount(vboIdx / pointSize);
    vbo.upload(packedVBO, ObjectType.ARRAY_BUFFER);
    vbo.getColorBO().upload(packedUCVBO, ObjectType.ARRAY_BUFFER);
    model.VBOBuildTime.modified();
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

  // Object methods
  vtkOpenGLStickMapper(publicAPI, model);
}

// ----------------------------------------------------------------------------

export const newInstance = macro.newInstance(extend, 'vtkOpenGLStickMapper');

// ----------------------------------------------------------------------------

export default { newInstance, extend };
