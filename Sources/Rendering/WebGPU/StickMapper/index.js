import * as macro from 'vtk.js/Sources/macros';
import vtkWebGPUCellArrayMapper from 'vtk.js/Sources/Rendering/WebGPU/CellArrayMapper';
import vtkWebGPUBufferManager from 'vtk.js/Sources/Rendering/WebGPU/BufferManager';
import vtkWebGPUShaderCache from 'vtk.js/Sources/Rendering/WebGPU/ShaderCache';

import { registerOverride } from 'vtk.js/Sources/Rendering/WebGPU/ViewNodeFactory';

const { BufferUsage } = vtkWebGPUBufferManager;
const { vtkErrorMacro } = macro;

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

const vtkWebGPUStickMapperVS = `
//VTK::Renderer::Dec

//VTK::Mapper::Dec

//VTK::Color::Dec

//VTK::IOStructs::Dec

@stage(vertex)
fn main(
//VTK::IOStructs::Input
)
//VTK::IOStructs::Output
{
  var offsetsArray: array<vec3<f32>, 12> = array<vec3<f32>, 12>(
    vec3<f32>(-1.0, -1.0, -1.0),
    vec3<f32>(1.0, -1.0, -1.0),
    vec3<f32>(1.0, -1.0, 1.0),

    vec3<f32>(-1.0, -1.0, -1.0),
    vec3<f32>(1.0, -1.0, 1.0),
    vec3<f32>(-1.0, -1.0, 1.0),

    vec3<f32>(-1.0, -1.0, 1.0),
    vec3<f32>(1.0, -1.0, 1.0),
    vec3<f32>(1.0, 1.0, 1.0),

    vec3<f32>(-1.0, -1.0, 1.0),
    vec3<f32>(1.0, 1.0, 1.0),
    vec3<f32>(-1.0, 1.0, 1.0)
  );

  var output : vertexOutput;

  var vertexVC: vec4<f32> = rendererUBO.SCVCMatrix * mapperUBO.BCSCMatrix * vec4<f32>(vertexBC.x, vertexBC.y, vertexBC.z, 1.0);

  //VTK::Color::Impl

  // compute the projected vertex position
  output.centerVC = vertexVC.xyz;
  output.radiusVC = radiusMC;
  output.lengthVC = length(orientMC);
  output.orientVC = (rendererUBO.WCVCNormals * vec4<f32>(normalize(orientMC), 0.0)).xyz;

  // make sure it is pointing out of the screen
  if (output.orientVC.z < 0.0)
    {
    output.orientVC = -output.orientVC;
    }

  // make the basis
  var xbase: vec3<f32>;
  var ybase: vec3<f32>;
  var dir: vec3<f32> = vec3<f32>(0.0,0.0,1.0);
  if (rendererUBO.cameraParallel == 0u)
    {
    dir = normalize(-vertexVC.xyz);
    }
  if (abs(dot(dir,output.orientVC)) == 1.0)
    {
    xbase = normalize(cross(vec3<f32>(0.0,1.0,0.0),output.orientVC));
    ybase = cross(xbase,output.orientVC);
    }
  else
    {
    xbase = normalize(cross(output.orientVC,dir));
    ybase = cross(output.orientVC,xbase);
    }


  var vertIdx: u32 = input.vertexIndex % 12u;
  var offsets: vec3<f32> = offsetsArray[vertIdx];

  vertexVC = vec4<f32>(vertexVC.xyz +
    output.radiusVC * offsets.x * xbase +
    output.radiusVC * offsets.y * ybase +
    0.5 * output.lengthVC * offsets.z * output.orientVC, 1.0);

  output.vertexVC = vertexVC;

  //VTK::Position::Impl

  return output;
}
`;

// ----------------------------------------------------------------------------
// vtkWebGPUStickMapper methods
// ----------------------------------------------------------------------------

function vtkWebGPUStickMapper(publicAPI, model) {
  // Set our className
  model.classHierarchy.push('vtkWebGPUStickMapper');

  const cellMapperBuildPass = publicAPI.buildPass;
  publicAPI.buildPass = (prepass) => {
    if (prepass) {
      if (!model.renderable.getStatic()) {
        model.renderable.update();
      }

      const poly = model.renderable.getInputData();

      publicAPI.setCellArray(poly.getVerts());
      publicAPI.setCurrentInput(poly);
    }
    cellMapperBuildPass(prepass);
  };

  publicAPI.replaceShaderNormal = (hash, pipeline, vertexInput) => {
    const vDesc = pipeline.getShaderDescription('vertex');
    vDesc.addOutput('vec4<f32>', 'vertexVC');
    vDesc.addOutput('vec3<f32>', 'centerVC');
    vDesc.addOutput('vec3<f32>', 'orientVC');
    vDesc.addOutput('f32', 'radiusVC');
    vDesc.addOutput('f32', 'lengthVC');
    vDesc.addBuiltinInput('u32', '@builtin(vertex_index) vertexIndex');

    const fDesc = pipeline.getShaderDescription('fragment');
    fDesc.addBuiltinOutput('f32', '@builtin(frag_depth) fragDepth');
    const stickFrag = `
    // compute the eye position and unit direction
    var vertexVC: vec4<f32>;
    var EyePos: vec3<f32>;
    var EyeDir: vec3<f32>;

    if (rendererUBO.cameraParallel != 0u)
    {
      EyePos = vec3<f32>(input.vertexVC.x, input.vertexVC.y, input.vertexVC.z + 3.0*input.radiusVC);
      EyeDir = vec3<f32>(0.0, 0.0, -1.0);
    }
    else
    {
      EyeDir = input.vertexVC.xyz;
      EyePos = vec3<f32>(0.0,0.0,0.0);
      var lengthED: f32 = length(EyeDir);
      EyeDir = normalize(EyeDir);
      // we adjust the EyePos to be closer if it is too far away
      // to prevent floating point precision noise
      if (lengthED > input.radiusVC*3.0)
      {
        EyePos = input.vertexVC.xyz - EyeDir*3.0*input.radiusVC;
      }
    }
    // translate to Sphere center
    EyePos = EyePos - input.centerVC;

    // rotate to new basis
    // base1, base2, orientVC
    var base1: vec3<f32>;
    if (abs(input.orientVC.z) < 0.99)
    {
      base1 = normalize(cross(input.orientVC,vec3<f32>(0.0,0.0,1.0)));
    }
    else
    {
      base1 = normalize(cross(input.orientVC,vec3<f32>(0.0,1.0,0.0)));
    }
    var base2: vec3<f32> = cross(input.orientVC,base1);
    EyePos = vec3<f32>(dot(EyePos,base1),dot(EyePos,base2),dot(EyePos,input.orientVC));
    EyeDir = vec3<f32>(dot(EyeDir,base1),dot(EyeDir,base2),dot(EyeDir,input.orientVC));

    // scale to radius 1.0
    EyePos = EyePos * (1.0 / input.radiusVC);

    // find the intersection
    var a: f32 = EyeDir.x*EyeDir.x + EyeDir.y*EyeDir.y;
    var b: f32 = 2.0*(EyePos.x*EyeDir.x + EyePos.y*EyeDir.y);
    var c: f32 = EyePos.x*EyePos.x + EyePos.y*EyePos.y - 1.0;
    var d: f32 = b*b - 4.0*a*c;
    var normal: vec3<f32> = vec3<f32>(0.0,0.0,1.0);
    if (d < 0.0) { discard; }
    else
    {
      var t: f32 = (-b - sqrt(d))*(0.5 / a);
      var tz: f32 = EyePos.z + t*EyeDir.z;
      var iPoint: vec3<f32> = EyePos + t*EyeDir;
      if (abs(iPoint.z)*input.radiusVC > input.lengthVC*0.5)
      {
        // test for end cap
        var t2: f32 = (-b + sqrt(d))*(0.5 / a);
        var tz2: f32 = EyePos.z + t2*EyeDir.z;
        if (tz2*input.radiusVC > input.lengthVC*0.5 || tz*input.radiusVC < -0.5*input.lengthVC) { discard; }
        else
        {
          normal = input.orientVC;
          var t3: f32 = (input.lengthVC*0.5/input.radiusVC - EyePos.z)/EyeDir.z;
          iPoint = EyePos + t3*EyeDir;
          vertexVC = vec4<f32>(input.radiusVC*(iPoint.x*base1 + iPoint.y*base2 + iPoint.z*input.orientVC) + input.centerVC, 1.0);
        }
      }
      else
      {
        // The normal is the iPoint.xy rotated back into VC
        normal = iPoint.x*base1 + iPoint.y*base2;
        // rescale rerotate and translate
        vertexVC = vec4<f32>(input.radiusVC*(normal + iPoint.z*input.orientVC) + input.centerVC, 1.0);
      }
    }
    // compute the pixel's depth
    var pos: vec4<f32> = rendererUBO.VCPCMatrix * vertexVC;
    output.fragDepth = pos.z / pos.w;
  `;

    let code = fDesc.getCode();
    code = vtkWebGPUShaderCache.substitute(code, '//VTK::Normal::Impl', [
      stickFrag,
    ]).result;
    fDesc.setCode(code);
  };

  publicAPI.replaceShaderPosition = (hash, pipeline, vertexInput) => {
    const vDesc = pipeline.getShaderDescription('vertex');
    vDesc.addBuiltinOutput('vec4<f32>', '@builtin(position) Position');
    let code = vDesc.getCode();
    code = vtkWebGPUShaderCache.substitute(code, '//VTK::Position::Impl', [
      '  output.Position = rendererUBO.VCPCMatrix*vertexVC;',
    ]).result;
    vDesc.setCode(code);
  };

  // compute a unique hash for a pipeline, this needs to be unique enough to
  // capture any pipeline code changes (which includes shader changes)
  // or vertex input changes/ bind groups/ etc
  publicAPI.computePipelineHash = () => {
    model.pipelineHash = 'stm';
    if (model.vertexInput.hasAttribute(`colorVI`)) {
      model.pipelineHash += `c`;
    }
    model.pipelineHash += model.renderEncoder.getPipelineHash();
  };

  publicAPI.updateBuffers = () => {
    const poly = model.currentInput;

    model.renderable.mapScalars(poly, 1.0);

    const device = model.device;

    const points = poly.getPoints();
    const pointData = poly.getPointData();
    const numPoints = points.getNumberOfPoints();
    const pointArray = points.getData();

    publicAPI.setNumberOfInstances(numPoints);
    publicAPI.setNumberOfVertices(12);

    const vertexInput = model.vertexInput;

    let hash = `stm${points.getMTime()}float32x3`;
    if (!device.getBufferManager().hasBuffer(hash)) {
      const buffRequest = {
        hash,
        usage: BufferUsage.RawVertex,
        format: 'float32x3',
      };
      // xyz v1 v2 v3
      const tmpVBO = new Float32Array(numPoints * 3);

      let pointIdx = 0;
      let vboIdx = 0;
      for (let id = 0; id < numPoints; ++id) {
        pointIdx = id * 3;
        tmpVBO[vboIdx++] = pointArray[pointIdx];
        tmpVBO[vboIdx++] = pointArray[pointIdx + 1];
        tmpVBO[vboIdx++] = pointArray[pointIdx + 2];
      }
      buffRequest.nativeArray = tmpVBO;
      const buff = device.getBufferManager().getBuffer(buffRequest);
      vertexInput.addBuffer(buff, ['vertexBC'], 'instance');
    }

    // compute offset VBO
    let scales = null;
    if (
      model.renderable.getScaleArray() != null &&
      pointData.hasArray(model.renderable.getScaleArray())
    ) {
      scales = pointData.getArray(model.renderable.getScaleArray()).getData();
    }

    const defaultRadius = model.renderable.getRadius();
    if (scales || defaultRadius !== model._lastRadius) {
      hash = `stm${
        scales
          ? pointData.getArray(model.renderable.getScaleArray()).getMTime()
          : defaultRadius
      }float32`;
      if (!device.getBufferManager().hasBuffer(hash)) {
        const buffRequest = {
          hash,
          usage: BufferUsage.RawVertex,
          format: 'float32',
        };
        const tmpVBO = new Float32Array(numPoints);

        let vboIdx = 0;
        for (let id = 0; id < numPoints; ++id) {
          let radius = model.renderable.getRadius();
          if (scales) {
            radius = scales[id * 2 + 1];
          }
          tmpVBO[vboIdx++] = radius;
        }
        buffRequest.nativeArray = tmpVBO;
        const buff = device.getBufferManager().getBuffer(buffRequest);
        vertexInput.addBuffer(buff, ['radiusMC'], 'instance');
      }
      model._lastRadius = defaultRadius;
    }

    let orientationArray = null;
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

    hash = `stm${pointData
      .getArray(model.renderable.getOrientationArray())
      .getMTime()}float32x3`;
    if (!device.getBufferManager().hasBuffer(hash)) {
      const buffRequest = {
        hash,
        usage: BufferUsage.RawVertex,
        format: 'float32x3',
      };
      // xyz v1 v2 v3
      const tmpVBO = new Float32Array(numPoints * 3);

      let pointIdx = 0;
      let vboIdx = 0;
      for (let id = 0; id < numPoints; ++id) {
        pointIdx = id * 3;
        let length = model.renderable.getLength();
        if (scales) {
          length = scales[id * 2];
        }
        tmpVBO[vboIdx++] = orientationArray[pointIdx] * length;
        tmpVBO[vboIdx++] = orientationArray[pointIdx + 1] * length;
        tmpVBO[vboIdx++] = orientationArray[pointIdx + 2] * length;
      }
      buffRequest.nativeArray = tmpVBO;
      const buff = device.getBufferManager().getBuffer(buffRequest);
      vertexInput.addBuffer(buff, ['orientMC'], 'instance');
    }

    // deal with colors but only if modified
    let haveColors = false;
    if (model.renderable.getScalarVisibility()) {
      const c = model.renderable.getColorMapColors();
      if (c) {
        hash = `stm${c.getMTime()}unorm8x4`;
        if (!device.getBufferManager().hasBuffer(hash)) {
          const buffRequest = {
            usage: BufferUsage.RawVertex,
            format: 'unorm8x4',
          };
          const colorComponents = c.getNumberOfComponents();
          if (colorComponents !== 4) {
            vtkErrorMacro('this should be 4');
          }
          const tmpVBO = new Uint8Array(numPoints * 4);
          let vboIdx = 0;
          const colorData = c.getData();
          for (let id = 0; id < numPoints; ++id) {
            const colorIdx = id * colorComponents;
            tmpVBO[vboIdx++] = colorData[colorIdx];
            tmpVBO[vboIdx++] = colorData[colorIdx + 1];
            tmpVBO[vboIdx++] = colorData[colorIdx + 2];
            tmpVBO[vboIdx++] = colorData[colorIdx + 3];
          }
          buffRequest.nativeArray = tmpVBO;
          const buff = device.getBufferManager().getBuffer(buffRequest);
          vertexInput.addBuffer(buff, ['colorVI'], 'instance');
        }
        haveColors = true;
      }
    }
    if (!haveColors) {
      vertexInput.removeBufferIfPresent('colorVI');
    }

    publicAPI.setTopology('triangle-list');
    publicAPI.updateUBO();
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
  vtkWebGPUCellArrayMapper.extend(publicAPI, model, initialValues);

  publicAPI.setVertexShaderTemplate(vtkWebGPUStickMapperVS);

  // Object methods
  vtkWebGPUStickMapper(publicAPI, model);

  const sr = model.shaderReplacements;
  sr.set('replaceShaderPosition', publicAPI.replaceShaderPosition);
  sr.set('replaceShaderNormal', publicAPI.replaceShaderNormal);
}

// ----------------------------------------------------------------------------

export const newInstance = macro.newInstance(extend, 'vtkWebGPUStickMapper');

// ----------------------------------------------------------------------------

export default { newInstance, extend };

// Register ourself to WebGPU backend if imported
registerOverride('vtkStickMapper', newInstance);
