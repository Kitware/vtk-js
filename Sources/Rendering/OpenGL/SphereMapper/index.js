import { mat4 }                 from 'gl-matrix';
import { ObjectType }           from 'vtk.js/Sources/Rendering/OpenGL/BufferObject/Constants';

import macro                    from 'vtk.js/Sources/macro';

import DynamicTypedArray        from 'vtk.js/Sources/Common/Core/DynamicTypedArray';
import vtkMath                  from 'vtk.js/Sources/Common/Core/Math';

import vtkShaderProgram         from 'vtk.js/Sources/Rendering/OpenGL/ShaderProgram';
import vtkOpenGLPolyDataMapper  from 'vtk.js/Sources/Rendering/OpenGL/PolyDataMapper';

import vtkSphereMapperVS        from 'vtk.js/Sources/Rendering/OpenGL/glsl/vtkSphereMapperVS.glsl';
import vtkPolyDataFS            from 'vtk.js/Sources/Rendering/OpenGL/glsl/vtkPolyDataFS.glsl';

const { vtkErrorMacro } = macro;

// ----------------------------------------------------------------------------
// vtkOpenGLSphereMapper methods
// ----------------------------------------------------------------------------

export function vtkOpenGLSphereMapper(publicAPI, model) {
  // Set our className
  model.classHierarchy.push('vtkOpenGLSphereMapper');

  // Capture 'parentClass' api for internal use
  const superClass = Object.assign({}, publicAPI);

  publicAPI.getShaderTemplate = (shaders, ren, actor) => {
    shaders.Vertex = vtkSphereMapperVS;
    shaders.Fragment = vtkPolyDataFS;
    shaders.Geometry = '';
  };

  publicAPI.replaceShaderValues = (shaders, ren, actor) => {
    let VSSource = shaders.Vertex;
    let FSSource = shaders.Fragment;

    VSSource = vtkShaderProgram.substitute(VSSource,
      '//VTK::Camera::Dec', [
        'uniform mat4 VCDCMatrix;\n',
        'uniform mat4 MCVCMatrix;']).result;

    FSSource = vtkShaderProgram.substitute(FSSource,
      '//VTK::PositionVC::Dec', [
        'varying vec4 vertexVCVSOutput;']).result;

    // we create vertexVC below, so turn off the default
    // implementation
    FSSource = vtkShaderProgram.substitute(FSSource,
      '//VTK::PositionVC::Impl', [
        'vec4 vertexVC = vertexVCVSOutput;\n']).result;

    // for lights kit and positional the VCDC matrix is already defined
    // so don't redefine it
    const replacement = [
      'uniform float invertedDepth;\n',
      'uniform int cameraParallel;\n',
      'varying float radiusVCVSOutput;\n',
      'varying vec3 centerVCVSOutput;\n',
      'uniform mat4 VCDCMatrix;\n'];
    FSSource = vtkShaderProgram.substitute(FSSource, '//VTK::Normal::Dec', replacement).result;

    let fragString = '';
    if (model.context.getExtension('EXT_frag_depth')) {
      fragString = 'gl_FragDepthEXT = (pos.z / pos.w + 1.0) / 2.0;\n';
    }
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

      // translate to Sphere center
      '  EyePos = EyePos - centerVCVSOutput;\n',
      // scale to radius 1.0
      '  EyePos = EyePos/radiusVCVSOutput;\n',
      // find the intersection
      '  float b = 2.0*dot(EyePos,EyeDir);\n',
      '  float c = dot(EyePos,EyePos) - 1.0;\n',
      '  float d = b*b - 4.0*c;\n',
      '  vec3 normalVCVSOutput = vec3(0.0,0.0,1.0);\n',
      '  if (d < 0.0) { discard; }\n',
      '  else {\n',
      '    float t = (-b - invertedDepth*sqrt(d))*0.5;\n',

      // compute the normal, for unit sphere this is just
      // the intersection point
      '    normalVCVSOutput = invertedDepth*normalize(EyePos + t*EyeDir);\n',
      // compute the intersection point in VC
      '    vertexVC.xyz = normalVCVSOutput*radiusVCVSOutput + centerVCVSOutput;\n',
      '    }\n',
      // compute the pixel's depth
     // ' normalVCVSOutput = vec3(0,0,1);\n'
      '  vec4 pos = VCDCMatrix * vertexVC;\n',
      fragString]).result;

    // Strip out the normal line -- the normal is computed as part of the depth
    FSSource = vtkShaderProgram.substitute(FSSource, '//VTK::Normal::Impl', '').result;

    shaders.Vertex = VSSource;
    shaders.Fragment = FSSource;

    superClass.replaceShaderValues(shaders, ren, actor);
  };

  publicAPI.setMapperShaderParameters = (cellBO, ren, actor) => {
    if (cellBO.getCABO().getElementCount() && (model.VBOBuildTime > cellBO.getAttributeUpdateTime().getMTime() ||
        cellBO.getShaderSourceTime().getMTime() > cellBO.getAttributeUpdateTime().getMTime()) &&
        cellBO.getProgram().isAttributeUsed('offsetMC')) {
      cellBO.getCABO().bind();
      if (!cellBO.getVAO().addAttributeArray(cellBO.getProgram(), cellBO.getCABO(),
          'offsetMC', 12, // 12:this->VBO->ColorOffset+sizeof(float)
          cellBO.getCABO().getStride(), model.context.FLOAT, 2, false)) {
        vtkErrorMacro('Error setting \'offsetMC\' in shader VAO.');
      }
    }

    if (cellBO.getProgram().isUniformUsed('invertedDepth')) {
      cellBO.getProgram().setUniformf('invertedDepth', model.invert ? -1.0 : 1.0);
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

    if (program.isUniformUsed('MCVCMatrix')) {
      if (!actor.getIsIdentity()) {
        const actMats = model.openGLActor.getKeyMatrices();
        const tmp4 = mat4.create();
        mat4.multiply(tmp4, keyMats.wcvc, actMats.mcwc);
        program.setUniformMatrix('MCVCMatrix', tmp4);
      } else {
        program.setUniformMatrix('MCVCMatrix', keyMats.wcvc);
      }
    }

    if (program.isUniformUsed('cameraParallel')) {
      cellBO.getProgram().setUniformi('cameraParallel', cam.getParallelProjection());
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

    const packedVBO = new DynamicTypedArray({ chunkSize: 65500, arrayType: 'Float32Array' });
    const pointData = poly.getPointData();
    const points = poly.getPoints();
    const numPoints = points.getNumberOfPoints();
    const pointArray = points.getData();

    let pointSize = 5; // x,y,z,orientation1,orientation2
    let scales = null;

    if (model.renderable.getScaleArray() != null &&
        pointData.hasArray(model.renderable.getScaleArray())) {
      scales = pointData.getArray(model.renderable.getScaleArray()).getData();
    }

    let colorData = null;
    let colorComponents = 0;
    if (c) {
      colorComponents = c.getNumberOfComponents();
      vbo.setColorComponents(colorComponents);
      vbo.setColorOffset(4 * pointSize);
      pointSize += 1;
      colorData = c.getData();
    }

    vbo.setStride(pointSize * 4);

    const cos30 = Math.cos(vtkMath.radiansFromDegrees(30.0));
    let pointIdx = 0;
    let colorIdx = 0;
    let colorView = null;
    if (colorData) {
      colorView = new DataView(colorData.buffer, 0);
    }

  //
  // Generate points and point data for sides
  //
    for (let i = 0; i < numPoints; ++i) {
      let radius = model.renderable.getRadius();
      if (scales) {
        radius = scales[i];
      }

      pointIdx = i * 3;
      packedVBO.push(pointArray[pointIdx++]);
      packedVBO.push(pointArray[pointIdx++]);
      packedVBO.push(pointArray[pointIdx++]);
      packedVBO.push(-2.0 * radius * cos30);
      packedVBO.push(-radius);
      if (colorData) {
        colorIdx = i * colorComponents;
        packedVBO.pushBytes(colorView, colorIdx, 4);
      }

      pointIdx = i * 3;
      packedVBO.push(pointArray[pointIdx++]);
      packedVBO.push(pointArray[pointIdx++]);
      packedVBO.push(pointArray[pointIdx++]);
      packedVBO.push(2.0 * radius * cos30);
      packedVBO.push(-radius);
      if (colorData) {
        packedVBO.pushBytes(colorView, colorIdx, 4);
      }

      pointIdx = i * 3;
      packedVBO.push(pointArray[pointIdx++]);
      packedVBO.push(pointArray[pointIdx++]);
      packedVBO.push(pointArray[pointIdx++]);
      packedVBO.push(0.0);
      packedVBO.push(2.0 * radius);
      if (colorData) {
        packedVBO.pushBytes(colorView, colorIdx, 4);
      }
    }

    vbo.setElementCount(packedVBO.getNumberOfElements() / pointSize);
    const vboArray = packedVBO.getFrozenArray();
    vbo.upload(vboArray, ObjectType.ARRAY_BUFFER);

    model.VBOBuildTime.modified();
  };
}

// ----------------------------------------------------------------------------
// Object factory
// ----------------------------------------------------------------------------

const DEFAULT_VALUES = {
};

// ----------------------------------------------------------------------------

export function extend(publicAPI, model, initialValues = {}) {
  Object.assign(model, DEFAULT_VALUES, initialValues);

  // Inheritance
  vtkOpenGLPolyDataMapper.extend(publicAPI, model, initialValues);

  // Object methods
  vtkOpenGLSphereMapper(publicAPI, model);
}

// ----------------------------------------------------------------------------

export const newInstance = macro.newInstance(extend, 'vtkOpenGLSphereMapper');

// ----------------------------------------------------------------------------

export default { newInstance, extend };
