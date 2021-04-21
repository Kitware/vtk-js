import * as macro from 'vtk.js/Sources/macro';
import * as vtkMath from 'vtk.js/Sources/Common/Core/Math';
import vtkWebGPUPolyDataMapper from 'vtk.js/Sources/Rendering/WebGPU/PolyDataMapper';
import vtkWebGPUBufferManager from 'vtk.js/Sources/Rendering/WebGPU/BufferManager';
import vtkWebGPUPipeline from 'vtk.js/Sources/Rendering/WebGPU/Pipeline';
import vtkWebGPUShaderCache from 'vtk.js/Sources/Rendering/WebGPU/ShaderCache';

const { BufferUsage, PrimitiveTypes } = vtkWebGPUBufferManager;
const { vtkErrorMacro } = macro;

const vtkWebGPUSphereMapperVS = `
//VTK::Renderer::UBO

//VTK::Mapper::UBO

//VTK::Color::Dec

//VTK::InputStruct::Dec

//VTK::OutputStruct::Dec

[[stage(vertex)]]
fn main(
//VTK::InputStruct::Impl
)
//VTK::OutputStruct::Impl
{
  var output : vertexOutput;

  var vertexVC: vec4<f32> = rendererUBO.WCVCMatrix * vec4<f32>(vertexMC.x, vertexMC.y, vertexMC.z, 1.0);

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
  output.Position = rendererUBO.VCPCMatrix*vertexVC;
  return output;
}
`;

// ----------------------------------------------------------------------------
// vtkWebGPUSphereMapper methods
// ----------------------------------------------------------------------------

function vtkWebGPUSphereMapper(publicAPI, model) {
  // Set our className
  model.classHierarchy.push('vtkWebGPUSphereMapper');

  publicAPI.replaceShaderNormal = (hash, pipeline, vertexInput) => {
    const vDesc = pipeline.getShaderDescription('vertex');
    vDesc.addOutput('vec3<f32>', 'vertexVC');
    vDesc.addOutput('vec3<f32>', 'centerVC');
    vDesc.addOutput('f32', 'radiusVC');

    const fDesc = pipeline.getShaderDescription('fragment');
    fDesc.addBuiltinOutput('f32', '[[builtin(frag_depth)]] fragDepth');
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
    output.fragDepth = (pos.z / pos.w + 1.0) / 2.0;
    `;

    let code = fDesc.getCode();
    code = vtkWebGPUShaderCache.substitute(code, '//VTK::Normal::Impl', [
      sphereFrag,
    ]).result;
    fDesc.setCode(code);
  };

  // was originally buildIBOs() but not using IBOs right now
  publicAPI.buildPrimitives = () => {
    const poly = model.currentInput;

    const device = model.WebGPURenderWindow.getDevice();

    model.renderable.mapScalars(poly, 1.0);

    // handle triangles
    const i = PrimitiveTypes.Triangles;

    const points = poly.getPoints();
    const numPoints = points.getNumberOfPoints();
    const pointArray = points.getData();
    const primHelper = model.primitives[i];

    const vertexInput = model.primitives[i].vertexInput;

    let buffRequest = {
      hash: points.getMTime(),
      source: points,
      time: points.getMTime(),
      usage: BufferUsage.RawVertex,
      format: 'float32x3',
    };
    if (!device.getBufferManager().hasBuffer(buffRequest)) {
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
      const buff = device.getBufferManager().getBuffer(buffRequest);
      vertexInput.addBuffer(buff, ['vertexMC']);
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
      buffRequest = {
        hash: scales,
        source: scales,
        time: scales
          ? pointData.getArray(model.renderable.getScaleArray()).getMTime()
          : 0,
        usage: BufferUsage.RawVertex,
        format: 'float32x2',
      };
      if (!device.getBufferManager().hasBuffer(buffRequest)) {
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
        const buff = device.getBufferManager().getBuffer(buffRequest);
        vertexInput.addBuffer(buff, ['offsetMC']);
      }
      model._lastRadius = defaultRadius;
    }

    model.renderable.mapScalars(poly, 1.0);

    // deal with colors but only if modified
    let haveColors = false;
    if (model.renderable.getScalarVisibility()) {
      const c = model.renderable.getColorMapColors();
      if (c) {
        buffRequest = {
          hash: c,
          source: c,
          time: c.getMTime(),
          usage: BufferUsage.RawVertex,
          format: 'unorm8x4',
        };
        if (!device.getBufferManager().hasBuffer(buffRequest)) {
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
          const buff = device.getBufferManager().getBuffer(buffRequest);
          vertexInput.addBuffer(buff, ['colorVI']);
        }
        haveColors = true;
      }
    }
    if (!haveColors) {
      vertexInput.removeBufferIfPresent('colorVI');
    }

    const pipelineHash = publicAPI.computePipelineHash(primHelper.vertexInput);
    let pipeline = device.getPipeline(pipelineHash);

    // build VBO for this primitive
    // build the pipeline if needed
    if (!pipeline) {
      pipeline = vtkWebGPUPipeline.newInstance();
      pipeline.addBindGroupLayout(
        device.getRendererBindGroupLayout(),
        `RendererUBO`
      );
      pipeline.addBindGroupLayout(
        device.getMapperBindGroupLayout(),
        `MapperUBO`
      );
      publicAPI.generateShaderDescriptions(
        pipelineHash,
        pipeline,
        primHelper.vertexInput
      );
      pipeline.setTopology('triangle-list');
      pipeline.setRenderEncoder(model.renderEncoder);
      pipeline.setVertexState(
        primHelper.vertexInput.getVertexInputInformation()
      );
      device.createPipeline(pipelineHash, pipeline);
    }

    if (pipeline) {
      model.WebGPURenderer.registerPipelineCallback(
        pipeline,
        primHelper.renderForPipeline
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
  vtkWebGPUPolyDataMapper.extend(publicAPI, model, initialValues);

  model.vertexShaderTemplate = vtkWebGPUSphereMapperVS;

  // Object methods
  vtkWebGPUSphereMapper(publicAPI, model);
}

// ----------------------------------------------------------------------------

export const newInstance = macro.newInstance(extend, 'vtkWebGPUSphereMapper');

// ----------------------------------------------------------------------------

export default { newInstance, extend };
