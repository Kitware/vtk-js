import * as macro from 'vtk.js/Sources/macros';
import * as vtkMath from 'vtk.js/Sources/Common/Core/Math';
import vtkWebGPUCellArrayMapper from 'vtk.js/Sources/Rendering/WebGPU/CellArrayMapper';
import vtkWebGPUBufferManager from 'vtk.js/Sources/Rendering/WebGPU/BufferManager';
import vtkWebGPUShaderCache from 'vtk.js/Sources/Rendering/WebGPU/ShaderCache';

import { registerOverride } from 'vtk.js/Sources/Rendering/WebGPU/ViewNodeFactory';

const { BufferUsage } = vtkWebGPUBufferManager;
const { vtkErrorMacro } = macro;

const vtkWebGPUSphereMapperVS = `
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
  var output : vertexOutput;

  var vertexVC: vec4<f32> = rendererUBO.SCVCMatrix * mapperUBO.BCSCMatrix * vec4<f32>(vertexBC.x, vertexBC.y, vertexBC.z, 1.0);

  //VTK::Color::Impl

  // compute the projected vertex position
  output.centerVC = vertexVC.xyz;
  output.radiusVC = length(offsetMC)*0.5;

  // make the triangle face the camera
  if (rendererUBO.cameraParallel == 0u)
    {
    var dir: vec3<f32> = normalize(-vertexVC.xyz);
    var base2: vec3<f32> = normalize(cross(dir,vec3<f32>(1.0,0.0,0.0)));
    var base1: vec3<f32> = cross(base2,dir);
    dir = vertexVC.xyz + offsetMC.x*base1 + offsetMC.y*base2;
    vertexVC = vec4<f32>(dir, 1.0);
    }
  else
    {
    // add in the offset
    var tmp2: vec2<f32> = vertexVC.xy + offsetMC;
    vertexVC = vec4<f32>(tmp2, vertexVC.zw);
    }

  output.vertexVC = vertexVC.xyz;

  //VTK::Position::Impl

  return output;
}
`;

// ----------------------------------------------------------------------------
// vtkWebGPUSphereMapper methods
// ----------------------------------------------------------------------------

function vtkWebGPUSphereMapper(publicAPI, model) {
  // Set our className
  model.classHierarchy.push('vtkWebGPUSphereMapper');

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
    vDesc.addOutput('vec3<f32>', 'vertexVC');
    vDesc.addOutput('vec3<f32>', 'centerVC');
    vDesc.addOutput('f32', 'radiusVC');

    const fDesc = pipeline.getShaderDescription('fragment');
    fDesc.addBuiltinOutput('f32', '@builtin(frag_depth) fragDepth');
    const sphereFrag = `
    // compute the eye position and unit direction
    var vertexVC: vec4<f32>;
    var EyePos: vec3<f32>;
    var EyeDir: vec3<f32>;
    var invertedDepth: f32 = 1.0;
    if (rendererUBO.cameraParallel != 0u) {
      EyePos = vec3<f32>(input.vertexVC.x, input.vertexVC.y, input.vertexVC.z + 3.0*input.radiusVC);
      EyeDir = vec3<f32>(0.0, 0.0, -1.0);
    }
    else {
      EyeDir = input.vertexVC.xyz;
      EyePos = vec3<f32>(0.0,0.0,0.0);
      var lengthED: f32 = length(EyeDir);
      EyeDir = normalize(EyeDir);
      // we adjust the EyePos to be closer if it is too far away
      // to prevent floating point precision noise
      if (lengthED > input.radiusVC*3.0) {
        EyePos = input.vertexVC.xyz - EyeDir*3.0*input.radiusVC;
      }
    }

    // translate to Sphere center
    EyePos = EyePos - input.centerVC;
    // scale to radius 1.0
    EyePos = EyePos * (1.0 / input.radiusVC);
    // find the intersection
    var b: f32 = 2.0*dot(EyePos,EyeDir);
    var c: f32 = dot(EyePos,EyePos) - 1.0;
    var d: f32 = b*b - 4.0*c;
    var normal: vec3<f32> = vec3<f32>(0.0,0.0,1.0);
    if (d < 0.0) { discard; }
    else {
      var t: f32 = (-b - invertedDepth*sqrt(d))*0.5;

      // compute the normal, for unit sphere this is just
      // the intersection point
      normal = invertedDepth*normalize(EyePos + t*EyeDir);
      // compute the intersection point in VC
      vertexVC = vec4<f32>(normal * input.radiusVC + input.centerVC, 1.0);
    }
    // compute the pixel's depth
    var pos: vec4<f32> = rendererUBO.VCPCMatrix * vertexVC;
    output.fragDepth = pos.z / pos.w;
    `;

    let code = fDesc.getCode();
    code = vtkWebGPUShaderCache.substitute(code, '//VTK::Normal::Impl', [
      sphereFrag,
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
    model.pipelineHash = 'spm';
    if (model.vertexInput.hasAttribute(`colorVI`)) {
      model.pipelineHash += `c`;
    }
    model.pipelineHash += model.renderEncoder.getPipelineHash();
  };

  publicAPI.updateBuffers = () => {
    const poly = model.currentInput;

    model.renderable.mapScalars(poly, 1.0);

    const points = poly.getPoints();
    const numPoints = points.getNumberOfPoints();
    const pointArray = points.getData();

    // default to one instance and computed number of verts
    publicAPI.setNumberOfInstances(1);
    publicAPI.setNumberOfVertices(3 * numPoints);

    const vertexInput = model.vertexInput;

    let hash = `spm${points.getMTime()}float32x3`;
    if (!model.device.getBufferManager().hasBuffer(hash)) {
      const buffRequest = {
        hash,
        usage: BufferUsage.RawVertex,
        format: 'float32x3',
      };
      // xyz v1 v2 v3
      const tmpVBO = new Float32Array(3 * numPoints * 3);

      let pointIdx = 0;
      let vboIdx = 0;
      for (let id = 0; id < numPoints; ++id) {
        pointIdx = id * 3;
        tmpVBO[vboIdx++] = pointArray[pointIdx];
        tmpVBO[vboIdx++] = pointArray[pointIdx + 1];
        tmpVBO[vboIdx++] = pointArray[pointIdx + 2];
        tmpVBO[vboIdx++] = pointArray[pointIdx];
        tmpVBO[vboIdx++] = pointArray[pointIdx + 1];
        tmpVBO[vboIdx++] = pointArray[pointIdx + 2];
        tmpVBO[vboIdx++] = pointArray[pointIdx];
        tmpVBO[vboIdx++] = pointArray[pointIdx + 1];
        tmpVBO[vboIdx++] = pointArray[pointIdx + 2];
      }
      buffRequest.nativeArray = tmpVBO;
      const buff = model.device.getBufferManager().getBuffer(buffRequest);
      vertexInput.addBuffer(buff, ['vertexBC']);
    }

    // compute offset VBO
    const pointData = poly.getPointData();
    let scales = null;
    if (
      model.renderable.getScaleArray() != null &&
      pointData.hasArray(model.renderable.getScaleArray())
    ) {
      scales = pointData.getArray(model.renderable.getScaleArray()).getData();
    }

    const defaultRadius = model.renderable.getRadius();
    if (scales || defaultRadius !== model._lastRadius) {
      hash = `spm${
        scales
          ? pointData.getArray(model.renderable.getScaleArray()).getMTime()
          : defaultRadius
      }float32x2`;
      if (!model.device.getBufferManager().hasBuffer(hash)) {
        const buffRequest = {
          hash,
          usage: BufferUsage.RawVertex,
          format: 'float32x2',
        };
        const tmpVBO = new Float32Array(3 * numPoints * 2);

        const cos30 = Math.cos(vtkMath.radiansFromDegrees(30.0));
        let vboIdx = 0;
        for (let id = 0; id < numPoints; ++id) {
          let radius = model.renderable.getRadius();
          if (scales) {
            radius = scales[id];
          }
          tmpVBO[vboIdx++] = -2.0 * radius * cos30;
          tmpVBO[vboIdx++] = -radius;
          tmpVBO[vboIdx++] = 2.0 * radius * cos30;
          tmpVBO[vboIdx++] = -radius;
          tmpVBO[vboIdx++] = 0.0;
          tmpVBO[vboIdx++] = 2.0 * radius;
        }
        buffRequest.nativeArray = tmpVBO;
        const buff = model.device.getBufferManager().getBuffer(buffRequest);
        vertexInput.addBuffer(buff, ['offsetMC']);
      }
      model._lastRadius = defaultRadius;
    }

    // deal with colors but only if modified
    let haveColors = false;
    if (model.renderable.getScalarVisibility()) {
      const c = model.renderable.getColorMapColors();
      if (c) {
        hash = `spm${c.getMTime()}unorm8x4`;
        if (!model.device.getBufferManager().hasBuffer(hash)) {
          const buffRequest = {
            hash,
            usage: BufferUsage.RawVertex,
            format: 'unorm8x4',
          };
          const colorComponents = c.getNumberOfComponents();
          if (colorComponents !== 4) {
            vtkErrorMacro('this should be 4');
          }
          const tmpVBO = new Uint8Array(3 * numPoints * 4);
          let vboIdx = 0;
          const colorData = c.getData();
          for (let id = 0; id < numPoints; ++id) {
            const colorIdx = id * colorComponents;
            for (let v = 0; v < 3; v++) {
              tmpVBO[vboIdx++] = colorData[colorIdx];
              tmpVBO[vboIdx++] = colorData[colorIdx + 1];
              tmpVBO[vboIdx++] = colorData[colorIdx + 2];
              tmpVBO[vboIdx++] = colorData[colorIdx + 3];
            }
          }
          buffRequest.nativeArray = tmpVBO;
          const buff = model.device.getBufferManager().getBuffer(buffRequest);
          vertexInput.addBuffer(buff, ['colorVI']);
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

  publicAPI.setVertexShaderTemplate(vtkWebGPUSphereMapperVS);

  // Object methods
  vtkWebGPUSphereMapper(publicAPI, model);

  const sr = model.shaderReplacements;
  sr.set('replaceShaderPosition', publicAPI.replaceShaderPosition);
  sr.set('replaceShaderNormal', publicAPI.replaceShaderNormal);
}

// ----------------------------------------------------------------------------

export const newInstance = macro.newInstance(extend, 'vtkWebGPUSphereMapper');

// ----------------------------------------------------------------------------

export default { newInstance, extend };

// Register ourself to WebGPU backend if imported
registerOverride('vtkSphereMapper', newInstance);
