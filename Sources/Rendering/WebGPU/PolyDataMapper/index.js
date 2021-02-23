import { mat3, mat4, vec3 } from 'gl-matrix';

import macro from 'vtk.js/Sources/macro';
// import vtkMapper from 'vtk.js/Sources/Rendering/Core/Mapper';
import * as vtkMath from 'vtk.js/Sources/Common/Core/Math';
// import vtkWebGPUTexture from 'vtk.js/Sources/Rendering/WebGPU/Texture';
import vtkProperty from 'vtk.js/Sources/Rendering/Core/Property';
import vtkWebGPUBufferManager from 'vtk.js/Sources/Rendering/WebGPU/BufferManager';
import vtkWebGPUPipeline from 'vtk.js/Sources/Rendering/WebGPU/Pipeline';
import vtkWebGPUShaderCache from 'vtk.js/Sources/Rendering/WebGPU/ShaderCache';
import vtkWebGPUShaderDescription from 'vtk.js/Sources/Rendering/WebGPU/ShaderDescription';
import vtkWebGPUVertexInput from 'vtk.js/Sources/Rendering/WebGPU/VertexInput';
import vtkViewNode from 'vtk.js/Sources/Rendering/SceneGraph/ViewNode';

const { BufferUsage, PrimitiveTypes } = vtkWebGPUBufferManager;
const { Representation } = vtkProperty;
// const { ScalarMode } = vtkMapper;
// const { Filter, Wrap } = vtkWebGPUTexture;
const { vtkErrorMacro } = macro;
const StartEvent = { type: 'StartEvent' };
const EndEvent = { type: 'EndEvent' };

const vtkWebGPUPolyDataVS = `
//VTK::Renderer::UBO

//VTK::Mapper::UBO

//VTK::VertexInput

//VTK::PositionVC::Dec

//VTK::Color::Dec

//VTK::Normal::Dec

//VTK::TCoord::Dec

[[builtin(position)]] var<out> Position : vec4<f32>;
[[builtin(vertex_index)]] var<in> my_index: u32;

[[stage(vertex)]]
fn main() -> void
{
  var vertex: vec4<f32> = vertexMC;

  //VTK::PositionVC::Impl

  //VTK::Color::Impl

  //VTK::Normal::Impl

  //VTK::TCoord::Impl

  Position = rendererUBO.WCDCMatrix*vertexMC;
  return;
}
`;

const vtkWebGPUPolyDataFS = `
//VTK::Renderer::UBO

//VTK::Mapper::UBO

//VTK::Color::Dec

// optional surface normal declaration
//VTK::Normal::Dec

//VTK::TCoord::Dec

//VTK::PositionVC::Dec

[[location(0)]] var<out> outColor : vec4<f32>;

[[stage(fragment)]]
fn main() -> void
{
  var ambientColor: vec4<f32> = mapperUBO.AmbientColor;
  var diffuseColor: vec4<f32> = mapperUBO.DiffuseColor;
  var opacity: f32 = mapperUBO.Opacity;

  //VTK::PositionVC::Impl

  //VTK::Color::Impl

  //VTK::Normal::Impl

  //VTK::TCoord::Impl

  //VTK::Light::Impl

  outColor = vec4<f32>(ambientColor.rgb * mapperUBO.AmbientIntensity
     + diffuse * mapperUBO.DiffuseIntensity
     + specular * mapperUBO.SpecularIntensity,
     opacity);
  // outColor = vec4<f32>(1.0,0.8,0.4,1.0);
}
`;

const vtkWebGPUPolyDataUBOCode = `
[[block]] struct mapperVals
{
  [[offset(0)]] MCVCMatrix: mat4x4<f32>;
  [[offset(64)]] normalMatrix: mat4x4<f32>;
  [[offset(128)]] AmbientColor: vec4<f32>;
  [[offset(144)]] DiffuseColor: vec4<f32>;
  [[offset(160)]] SpecularColor: vec4<f32>;
  [[offset(176)]] AmbientIntensity: f32;
  [[offset(180)]] DiffuseIntensity: f32;
  [[offset(184)]] SpecularIntensity: f32;
  [[offset(188)]] Opacity: f32;
  [[offset(192)]] Metallic: f32;
  [[offset(196)]] Roughness: f32;
  [[offset(200)]] EmissiveFactor: f32;
  [[offset(204)]] SpecularPower: f32;
};
[[binding(0), group(1)]] var<uniform> mapperUBO : mapperVals;
`;

const vtkWebGPUPolyDataMapperUBOSize = 208 / 4;

// ----------------------------------------------------------------------------
// vtkWebGPUPolyDataMapper methods
// ----------------------------------------------------------------------------

function vtkWebGPUPolyDataMapper(publicAPI, model) {
  // Set our className
  model.classHierarchy.push('vtkWebGPUPolyDataMapper');

  publicAPI.buildPass = (prepass) => {
    if (prepass) {
      model.WebGPUActor = publicAPI.getFirstAncestorOfType('vtkWebGPUActor');
      model.WebGPURenderer = model.WebGPUActor.getFirstAncestorOfType(
        'vtkWebGPURenderer'
      );
      model.WebGPURenderWindow = model.WebGPURenderer.getParent();
    }
  };

  // Renders myself
  publicAPI.translucentPass = (prepass) => {
    if (prepass) {
      publicAPI.render();
    }
  };

  publicAPI.opaquePass = (prepass) => {
    if (prepass) {
      publicAPI.render();
    }
  };

  publicAPI.updateUBO = () => {
    let needSend = false;

    // make sure the data is up to date
    const actor = model.WebGPUActor.getRenderable();
    const ppty = actor.getProperty();
    const utime = model.UBOUpdateTime.getMTime();
    if (
      publicAPI.getMTime() > utime ||
      ppty.getMTime() > utime ||
      model.renderable.getMTime() > utime
    ) {
      let aColor = ppty.getAmbientColorByReference();
      model.UBOData[32] = aColor[0];
      model.UBOData[33] = aColor[1];
      model.UBOData[34] = aColor[2];
      model.UBOData[35] = 1.0;
      aColor = ppty.getDiffuseColorByReference();
      model.UBOData[36] = aColor[0];
      model.UBOData[37] = aColor[1];
      model.UBOData[38] = aColor[2];
      model.UBOData[39] = 1.0;
      aColor = ppty.getSpecularColorByReference();
      model.UBOData[40] = aColor[0];
      model.UBOData[41] = aColor[1];
      model.UBOData[42] = aColor[2];
      model.UBOData[43] = 1.0;
      model.UBOData[44] = ppty.getAmbient();
      model.UBOData[45] = ppty.getDiffuse();
      model.UBOData[46] = ppty.getSpecular();
      model.UBOData[47] = ppty.getOpacity();
      model.UBOData[51] = ppty.getSpecularPower();

      model.UBOUpdateTime.modified();
      needSend = true;
    }

    // make sure the buffer is created
    if (!model.UBO) {
      const req = {
        address: model.UBOData,
        time: 0,
        usage: BufferUsage.UniformArray,
      };
      const device = model.WebGPURenderWindow.getDevice();
      model.UBO = device.getBufferManager().getBuffer(req);
      model.UBOBindGroup = device.getHandle().createBindGroup({
        layout: device.getMapperBindGroupLayout(),
        entries: [
          {
            binding: 0,
            resource: {
              buffer: model.UBO.getHandle(),
            },
          },
        ],
      });
      needSend = false;
    }

    // send data down if needed
    if (needSend) {
      model.WebGPURenderWindow.getDevice()
        .getHandle()
        .queue.writeBuffer(
          model.UBO.getHandle(),
          0,
          model.UBOData.buffer,
          model.UBOData.byteOffset,
          model.UBOData.byteLength
        );
    }
  };

  publicAPI.render = () => {
    publicAPI.invokeEvent(StartEvent);
    if (!model.renderable.getStatic()) {
      model.renderable.update();
    }
    model.currentInput = model.renderable.getInputData();
    publicAPI.invokeEvent(EndEvent);

    publicAPI.buildPrimitives();

    const device = model.WebGPURenderWindow.getDevice();

    // update descriptor sets
    publicAPI.updateUBO();
  };

  publicAPI.generateShaderDescriptions = (hash, pipeline, vertexInput) => {
    // standard shader stuff most paths use
    let code = vtkWebGPUPolyDataVS;
    code = vtkWebGPUShaderCache.substitute(code, '//VTK::Renderer::UBO', [
      model.WebGPURenderer.getUBOCode(),
    ]).result;
    code = vtkWebGPUShaderCache.substitute(code, '//VTK::Mapper::UBO', [
      vtkWebGPUPolyDataUBOCode,
    ]).result;
    code = vtkWebGPUShaderCache.substitute(code, '//VTK::VertexInput', [
      vertexInput.getShaderCode(),
    ]).result;
    const vDesc = vtkWebGPUShaderDescription.newInstance({
      type: 'vertex',
      hash,
      code,
    });

    code = vtkWebGPUPolyDataFS;
    code = vtkWebGPUShaderCache.substitute(code, '//VTK::Renderer::UBO', [
      model.WebGPURenderer.getUBOCode(),
    ]).result;
    code = vtkWebGPUShaderCache.substitute(code, '//VTK::Mapper::UBO', [
      vtkWebGPUPolyDataUBOCode,
    ]).result;

    const fDesc = vtkWebGPUShaderDescription.newInstance({
      type: 'fragment',
      hash,
      code,
    });

    const sdrs = pipeline.getShaderDescriptions();
    sdrs.push(vDesc);
    sdrs.push(fDesc);

    // different things we deal with in building the shader code
    publicAPI.replaceShaderColor(hash, pipeline, vertexInput);
    publicAPI.replaceShaderNormal(hash, pipeline, vertexInput);
    // publicAPI.replaceShaderLight(hash, pipeline);
    // publicAPI.replaceShaderTCoord(hash, pipeline);
    // publicAPI.replaceShaderPositionVC(hash, pipeline);
  };

  publicAPI.replaceShaderNormal = (hash, pipeline, vertexInput) => {
    if (!vertexInput.hasAttribute('normalMC')) return;

    const vDesc = pipeline.getShaderDescription('vertex');

    let code = vDesc.getCode();
    code = vtkWebGPUShaderCache.substitute(code, '//VTK::Normal::Dec', [
      vDesc.getOutputDeclaration('vec3<f32>', 'normalVC'),
    ]).result;

    code = vtkWebGPUShaderCache.substitute(code, '//VTK::Normal::Impl', [
      '  normalVC = (rendererUBO.WCVCNormals * normalMC).xyz;',
    ]).result;
    vDesc.setCode(code);

    const fDesc = pipeline.getShaderDescription('fragment');
    code = fDesc.getCode();
    code = vtkWebGPUShaderCache.substitute(code, '//VTK::Normal::Dec', [
      fDesc.getInputDeclaration(vDesc, 'normalVC'),
    ]).result;

    code = vtkWebGPUShaderCache.substitute(code, '//VTK::Normal::Impl', [
      '  var df: f32  = max(0.0, normalVC.z);',
      '  var sf: f32 = pow(df, mapperUBO.SpecularPower);',
      '  var diffuse: vec3<f32> = df * diffuseColor.rgb;',
      '  var specular: vec3<f32> = sf * mapperUBO.SpecularColor.rgb * mapperUBO.SpecularColor.a;',
    ]).result;
    fDesc.setCode(code);
  };

  publicAPI.replaceShaderColor = (hash, pipeline, vertexInput) => {
    if (!vertexInput.hasAttribute('colorVI')) return;

    const vDesc = pipeline.getShaderDescription('vertex');

    let code = vDesc.getCode();
    code = vtkWebGPUShaderCache.substitute(code, '//VTK::Color::Dec', [
      vDesc.getOutputDeclaration('vec4<f32>', 'color'),
    ]).result;

    code = vtkWebGPUShaderCache.substitute(code, '//VTK::Color::Impl', [
      '  color = colorVI;',
    ]).result;
    vDesc.setCode(code);

    const fDesc = pipeline.getShaderDescription('fragment');
    code = fDesc.getCode();
    code = vtkWebGPUShaderCache.substitute(code, '//VTK::Color::Dec', [
      fDesc.getInputDeclaration(vDesc, 'color'),
    ]).result;

    code = vtkWebGPUShaderCache.substitute(code, '//VTK::Color::Impl', [
      'ambientColor = color;',
      'diffuseColor = color;',
      'opacity = mapperUBO.Opacity*color.a;',
    ]).result;
    fDesc.setCode(code);
  };

  publicAPI.getUsage = (rep, i) => {
    if (rep === Representation.POINTS || i === 0) {
      return BufferUsage.Verts;
    }

    if (i === 1) {
      return BufferUsage.Lines;
    }

    if (rep === Representation.WIREFRAME) {
      if (i === 2) {
        return BufferUsage.LinesFromTriangles;
      }
      return BufferUsage.LinesFromStrips;
    }

    if (i === 2) {
      return BufferUsage.Triangles;
    }

    return BufferUsage.Strips;
  };

  publicAPI.getHashFromUsage = (usage) => `pt${usage}`;

  publicAPI.buildVertexInput = (pd, cells, primType) => {
    const actor = model.WebGPUActor.getRenderable();
    const representation = actor.getProperty().getRepresentation();
    const device = model.WebGPURenderWindow.getDevice();

    const vertexInput = model.primitives[primType].vertexInput;

    // points
    const points = pd.getPoints();
    if (points) {
      const buffRequest = {
        dataArray: points,
        cells,
        primitiveType: primType,
        representation,
        time: Math.max(points.getMTime(), cells.getMTime()),
        usage: BufferUsage.Points,
        format: 'float32x4',
      };
      const buff = device.getBufferManager().getBuffer(buffRequest);
      vertexInput.addBuffer(buff, ['vertexMC']);
    } else {
      vertexInput.removeBufferIfPresent('vertexMC');
    }

    // normals
    const normals = pd.getPointData().getNormals();
    const buffRequest = {
      cells,
      representation,
      primitiveType: primType,
      format: 'snorm8x4',
      packExtra: true,
      shift: 0,
      scale: 127,
    };
    if (normals) {
      buffRequest['dataArray'] = normals;
      buffRequest['time'] = Math.max(normals.getMTime(), cells.getMTime());
      buffRequest['usage'] = BufferUsage.PointArray;
    } else {
      buffRequest['dataArray'] = points;
      buffRequest['time'] = Math.max(points.getMTime(), cells.getMTime());
      buffRequest['usage'] = BufferUsage.NormalsFromPoints;
    }
    const buff = device.getBufferManager().getBuffer(buffRequest);
    vertexInput.addBuffer(buff, ['normalMC']);

    // deal with colors but only if modified
    let haveColors = false;
    if (model.renderable.getScalarVisibility()) {
      model.renderable.mapScalars(pd, 1.0);
      const c = model.renderable.getColorMapColors();
      if (c) {
        const scalarMode = model.renderable.getScalarMode();
        let haveCellScalars = false;
        // We must figure out how the scalars should be mapped to the polydata.
        if (
          (scalarMode === scalarMode.USE_CELL_DATA ||
            scalarMode === scalarMode.USE_CELL_FIELD_DATA ||
            scalarMode === scalarMode.USE_FIELD_DATA ||
            !pd.getPointData().getScalars()) &&
          scalarMode !== scalarMode.USE_POINT_FIELD_DATA &&
          c
        ) {
          haveCellScalars = true;
        }
        const buffRequest = {
          dataArray: c,
          cells,
          primitiveType: primType,
          representation,
          time: Math.max(c.getMTime(), cells.getMTime()),
          usage: BufferUsage.PointArray,
          format: 'unorm8x4',
        };
        const buff = device.getBufferManager().getBuffer(buffRequest);
        vertexInput.addBuffer(buff, ['colorVI']);
        haveColors = true;
      }
    }
    if (!haveColors) {
      vertexInput.removeBufferIfPresent('colorVI');
    }
  };

  // was originally buildIBOs() but not using IBOs right now
  publicAPI.buildPrimitives = () => {
    const poly = model.currentInput;
    const prims = [
      poly.getVerts(),
      poly.getLines(),
      poly.getPolys(),
      poly.getStrips(),
    ];

    const actor = model.WebGPUActor.getRenderable();
    const rep = actor.getProperty().getRepresentation();
    const device = model.WebGPURenderWindow.getDevice();

    for (let i = PrimitiveTypes.Points; i <= PrimitiveTypes.Triangles; i++) {
      if (prims[i].getNumberOfValues() > 0) {
        const primHelper = model.primitives[i];
        publicAPI.buildVertexInput(model.currentInput, prims[i], i);

        let pipelineHash = 'pd';
        if (primHelper.vertexInput.hasAttribute(`normalMC`)) {
          pipelineHash += `n`;
        }
        if (primHelper.vertexInput.hasAttribute(`colorVI`)) {
          pipelineHash += `c`;
        }
        const usage = publicAPI.getUsage(rep, i);
        const uhash = publicAPI.getHashFromUsage(usage);
        pipelineHash += uhash;
        let pipeline = model.WebGPURenderWindow.getPipeline(pipelineHash);

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
          pipeline.setVertexState(
            primHelper.vertexInput.getVertexInputInformation()
          );
          model.WebGPURenderWindow.createPipeline(pipelineHash, pipeline);
        }

        if (pipeline) {
          model.WebGPURenderer.registerPipelineCallback(
            pipeline,
            primHelper.renderForPipeline
          );
        }
      }
    }
  };

  function safeMatrixMultiply(matrixArray, matrixType, tmpMat) {
    matrixType.identity(tmpMat);
    return matrixArray.reduce((res, matrix, index) => {
      if (index === 0) {
        return matrix ? matrixType.copy(res, matrix) : matrixType.identity(res);
      }
      return matrix ? matrixType.multiply(res, res, matrix) : res;
    }, tmpMat);
  }
}

// ----------------------------------------------------------------------------
// Object factory
// ----------------------------------------------------------------------------

const DEFAULT_VALUES = {
  context: null,
  VBOBuildTime: 0,
  VBOBuildString: null,
  primitives: null,
  shaderRebuildString: null,
  tmpMat4: null,
  ambientColor: [], // used internally
  diffuseColor: [], // used internally
  specularColor: [], // used internally
  lightColor: [], // used internally
  lightHalfAngle: [], // used internally
  lightDirection: [], // used internally
};

// ----------------------------------------------------------------------------

export function extend(publicAPI, model, initialValues = {}) {
  Object.assign(model, DEFAULT_VALUES, initialValues);

  // Inheritance
  vtkViewNode.extend(publicAPI, model, initialValues);

  model.tmpMat3 = mat3.create();
  model.tmpMat4 = mat4.create();
  model.UBOData = new Float32Array(vtkWebGPUPolyDataMapperUBOSize);
  model.UBOUpdateTime = {};
  macro.obj(model.UBOUpdateTime);

  model.primitives = [];
  for (let i = PrimitiveTypes.Start; i < PrimitiveTypes.End; i++) {
    model.primitives[i] = {
      primitiveType: i,
      vertexInput: vtkWebGPUVertexInput.newInstance(),
    };
    const primHelper = model.primitives[i];
    model.primitives[i]['renderForPipeline'] = (pipeline) => {
      const renderPass = model.WebGPURenderer.getRenderPass();
      renderPass.setBindGroup(1, model.UBOBindGroup);
      pipeline.bindVertexInput(renderPass, primHelper.vertexInput);
      const vbo = primHelper.vertexInput.getBuffer('vertexMC');
      renderPass.draw(vbo.getSizeInBytes() / 16, 1, 0, 0);
    };
  }

  // Build VTK API
  macro.setGet(publicAPI, model, ['context']);

  model.VBOBuildTime = {};
  macro.obj(model.VBOBuildTime, { mtime: 0 });

  // Object methods
  vtkWebGPUPolyDataMapper(publicAPI, model);
}

// ----------------------------------------------------------------------------

export const newInstance = macro.newInstance(extend, 'vtkWebGPUPolyDataMapper');

// ----------------------------------------------------------------------------

export default { newInstance, extend };
