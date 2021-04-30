import { mat3, mat4 } from 'gl-matrix';

import * as macro from 'vtk.js/Sources/macro';
import vtkMapper from 'vtk.js/Sources/Rendering/Core/Mapper';
import vtkProperty from 'vtk.js/Sources/Rendering/Core/Property';
import vtkTexture from 'vtk.js/Sources/Rendering/Core/Texture';
import vtkWebGPUBufferManager from 'vtk.js/Sources/Rendering/WebGPU/BufferManager';
import vtkWebGPUPipeline from 'vtk.js/Sources/Rendering/WebGPU/Pipeline';
import vtkWebGPUSampler from 'vtk.js/Sources/Rendering/WebGPU/Sampler';
import vtkWebGPUShaderCache from 'vtk.js/Sources/Rendering/WebGPU/ShaderCache';
import vtkWebGPUShaderDescription from 'vtk.js/Sources/Rendering/WebGPU/ShaderDescription';
import vtkWebGPUUniformBuffer from 'vtk.js/Sources/Rendering/WebGPU/UniformBuffer';
import vtkWebGPUVertexInput from 'vtk.js/Sources/Rendering/WebGPU/VertexInput';
import vtkViewNode from 'vtk.js/Sources/Rendering/SceneGraph/ViewNode';

import { registerOverride } from 'vtk.js/Sources/Rendering/WebGPU/ViewNodeFactory';

const { BufferUsage, PrimitiveTypes } = vtkWebGPUBufferManager;
const { Representation } = vtkProperty;
const { ScalarMode } = vtkMapper;
const StartEvent = { type: 'StartEvent' };
const EndEvent = { type: 'EndEvent' };

const vtkWebGPUPolyDataVS = `
//VTK::Renderer::Dec

//VTK::Color::Dec

//VTK::Normal::Dec

//VTK::TCoord::Dec

//VTK::Select::Dec

//VTK::Mapper::Dec

//VTK::IOStructs::Dec

[[stage(vertex)]]
fn main(
//VTK::IOStructs::Input
)
//VTK::IOStructs::Output
{
  var output : vertexOutput;

  var vertex: vec4<f32> = vertexBC;

  //VTK::Color::Impl

  //VTK::Normal::Impl

  //VTK::TCoord::Impl

  //VTK::Select::Impl

  //VTK::Position::Impl

  return output;
}
`;

const vtkWebGPUPolyDataFS = `
//VTK::Renderer::Dec

//VTK::Color::Dec

// optional surface normal declaration
//VTK::Normal::Dec

//VTK::TCoord::Dec

//VTK::Select::Dec

//VTK::RenderEncoder::Dec

//VTK::Mapper::Dec

//VTK::IOStructs::Dec

[[stage(fragment)]]
fn main(
//VTK::IOStructs::Input
)
//VTK::IOStructs::Output
{
  var output : fragmentOutput;

  var ambientColor: vec4<f32> = mapperUBO.AmbientColor;
  var diffuseColor: vec4<f32> = mapperUBO.DiffuseColor;
  var opacity: f32 = mapperUBO.Opacity;

  //VTK::Color::Impl

  //VTK::Normal::Impl

  //VTK::Light::Impl

  var computedColor: vec4<f32> = vec4<f32>(ambientColor.rgb * mapperUBO.AmbientIntensity
     + diffuse * mapperUBO.DiffuseIntensity
     + specular * mapperUBO.SpecularIntensity,
     opacity);

  //VTK::TCoord::Impl

  //VTK::Select::Impl

  if (computedColor.a == 0.0) { discard; };

  //VTK::RenderEncoder::Impl
  return output;
}
`;

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
      model.device = model.WebGPURenderWindow.getDevice();
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
    // make sure the data is up to date
    const actor = model.WebGPUActor.getRenderable();
    const ppty = actor.getProperty();
    const utime = model.UBO.getSendTime();
    if (
      publicAPI.getMTime() > utime ||
      ppty.getMTime() > utime ||
      model.renderable.getMTime() > utime
    ) {
      const keyMats = model.WebGPUActor.getKeyMatrices(model.WebGPURenderer);
      model.UBO.setArray('BCWCMatrix', keyMats.bcwc);
      model.UBO.setArray('BCSCMatrix', keyMats.bcsc);
      model.UBO.setArray('MCWCNormals', keyMats.normalMatrix);

      let aColor = ppty.getAmbientColorByReference();
      model.UBO.setValue('AmbientIntensity', ppty.getAmbient());
      model.UBO.setArray('AmbientColor', [
        aColor[0],
        aColor[1],
        aColor[2],
        1.0,
      ]);
      model.UBO.setValue('DiffuseIntensity', ppty.getDiffuse());
      aColor = ppty.getDiffuseColorByReference();
      model.UBO.setArray('DiffuseColor', [
        aColor[0],
        aColor[1],
        aColor[2],
        1.0,
      ]);
      model.UBO.setValue('SpecularIntensity', ppty.getSpecular());
      model.UBO.setValue('SpecularPower', ppty.getSpecularPower());
      aColor = ppty.getSpecularColorByReference();
      model.UBO.setArray('SpecularColor', [
        aColor[0],
        aColor[1],
        aColor[2],
        1.0,
      ]);
      model.UBO.setValue('Opacity', ppty.getOpacity());
      model.UBO.setValue('PropID', model.WebGPUActor.getPropID());
      const device = model.WebGPURenderWindow.getDevice();
      model.UBO.sendIfNeeded(device, device.getMapperBindGroupLayout());
    }
  };

  publicAPI.render = () => {
    publicAPI.invokeEvent(StartEvent);
    if (!model.renderable.getStatic()) {
      model.renderable.update();
    }
    model.currentInput = model.renderable.getInputData();
    publicAPI.invokeEvent(EndEvent);

    model.renderEncoder = model.WebGPURenderer.getRenderEncoder();

    publicAPI.buildPrimitives();

    // update descriptor sets
    publicAPI.updateUBO();
  };

  publicAPI.generateShaderDescriptions = (hash, pipeline, vertexInput) => {
    // create the shader descriptions
    const vDesc = vtkWebGPUShaderDescription.newInstance({
      type: 'vertex',
      hash,
      code: model.vertexShaderTemplate,
    });
    const fDesc = vtkWebGPUShaderDescription.newInstance({
      type: 'fragment',
      hash,
      code: model.fragmentShaderTemplate,
    });

    // add them to the pipeline
    const sdrs = pipeline.getShaderDescriptions();
    sdrs.push(vDesc);
    sdrs.push(fDesc);

    // look for replacements to invoke
    const scode = model.vertexShaderTemplate + model.fragmentShaderTemplate;
    const re = new RegExp('//VTK::[^:]*::', 'g');
    const unique = scode.match(re).filter((v, i, a) => a.indexOf(v) === i);
    const fnames = unique.map(
      (v) => `replaceShader${v.substring(7, v.length - 2)}`
    );

    // now invoke shader replacement functions
    for (let i = 0; i < fnames.length; i++) {
      const fname = fnames[i];
      if (fname !== 'replaceShaderIOStructs' && publicAPI[fname]) {
        publicAPI[fname](hash, pipeline, vertexInput);
      }
    }

    // always replace the IOStructs last as other replacement funcs may
    // add inputs or outputs
    publicAPI.replaceShaderIOStructs(hash, pipeline, vertexInput);

    // console.log(vDesc.getCode());
    // console.log(fDesc.getCode());
  };

  publicAPI.replaceShaderRenderEncoder = (hash, pipeline, vertexInput) => {
    model.renderEncoder.replaceShaderCode(pipeline);
  };

  publicAPI.replaceShaderIOStructs = (hash, pipeline, vertexInput) => {
    const vDesc = pipeline.getShaderDescription('vertex');
    vDesc.replaceShaderCode(null, vertexInput);
    const fDesc = pipeline.getShaderDescription('fragment');
    fDesc.replaceShaderCode(vDesc);
  };

  publicAPI.replaceShaderRenderer = (hash, pipeline, vertexInput) => {
    const ubocode = model.WebGPURenderer.getUBO().getShaderCode(pipeline);

    const vDesc = pipeline.getShaderDescription('vertex');
    let code = vDesc.getCode();
    code = vtkWebGPUShaderCache.substitute(code, '//VTK::Renderer::Dec', [
      ubocode,
    ]).result;
    vDesc.setCode(code);

    const fDesc = pipeline.getShaderDescription('fragment');
    code = fDesc.getCode();
    code = vtkWebGPUShaderCache.substitute(code, '//VTK::Renderer::Dec', [
      ubocode,
    ]).result;
    fDesc.setCode(code);
  };

  publicAPI.replaceShaderMapper = (hash, pipeline, vertexInput) => {
    let ubocode = model.UBO.getShaderCode(pipeline);
    if (model.SSBO) {
      ubocode += `\n ${model.SSBO.getShaderCode(pipeline)}`;
    }

    const vDesc = pipeline.getShaderDescription('vertex');
    let code = vDesc.getCode();
    code = vtkWebGPUShaderCache.substitute(code, '//VTK::Mapper::Dec', [
      ubocode,
    ]).result;
    vDesc.setCode(code);

    const fDesc = pipeline.getShaderDescription('fragment');
    fDesc.addBuiltinInput('bool', '[[builtin(front_facing)]] frontFacing');
    code = fDesc.getCode();
    code = vtkWebGPUShaderCache.substitute(code, '//VTK::Mapper::Dec', [
      ubocode,
    ]).result;
    fDesc.setCode(code);
  };

  publicAPI.replaceShaderPosition = (hash, pipeline, vertexInput) => {
    const vDesc = pipeline.getShaderDescription('vertex');
    vDesc.addBuiltinOutput('vec4<f32>', '[[builtin(position)]] Position');
    let code = vDesc.getCode();
    code = vtkWebGPUShaderCache.substitute(code, '//VTK::Position::Impl', [
      '    output.Position = rendererUBO.SCPCMatrix*mapperUBO.BCSCMatrix*vertexBC;',
    ]).result;
    vDesc.setCode(code);
  };

  publicAPI.replaceShaderNormal = (hash, pipeline, vertexInput) => {
    if (vertexInput.hasAttribute('normalMC')) {
      const vDesc = pipeline.getShaderDescription('vertex');
      vDesc.addOutput('vec3<f32>', 'normalVC');
      let code = vDesc.getCode();
      code = vtkWebGPUShaderCache.substitute(code, '//VTK::Normal::Impl', [
        '  output.normalVC = normalize((rendererUBO.WCVCNormals * mapperUBO.MCWCNormals * normalMC).xyz);',
      ]).result;
      vDesc.setCode(code);

      const fDesc = pipeline.getShaderDescription('fragment');
      code = fDesc.getCode();
      code = vtkWebGPUShaderCache.substitute(code, '//VTK::Normal::Impl', [
        '  var normal: vec3<f32> = input.normalVC;',
        '  if (!input.frontFacing) { normal = -normal; }',
      ]).result;
      fDesc.setCode(code);
    }
  };

  // we only apply lighting when there is a "var normal" declaration in the
  // fragment shader code. That is the lighting trigger.
  publicAPI.replaceShaderLight = (hash, pipeline, vertexInput) => {
    const fDesc = pipeline.getShaderDescription('fragment');
    let code = fDesc.getCode();
    if (code.includes('var normal')) {
      code = vtkWebGPUShaderCache.substitute(code, '//VTK::Light::Impl', [
        '  var df: f32  = max(0.0, normal.z);',
        '  var sf: f32 = pow(df, mapperUBO.SpecularPower);',
        '  var diffuse: vec3<f32> = df * diffuseColor.rgb;',
        '  var specular: vec3<f32> = sf * mapperUBO.SpecularColor.rgb * mapperUBO.SpecularColor.a;',
      ]).result;
      fDesc.setCode(code);
    } else {
      code = vtkWebGPUShaderCache.substitute(code, '//VTK::Light::Impl', [
        '  var diffuse: vec3<f32> = diffuseColor.rgb;',
        '  var specular: vec3<f32> = mapperUBO.SpecularColor.rgb * mapperUBO.SpecularColor.a;',
      ]).result;
      fDesc.setCode(code);
    }
  };

  publicAPI.replaceShaderColor = (hash, pipeline, vertexInput) => {
    if (!vertexInput.hasAttribute('colorVI')) return;

    const vDesc = pipeline.getShaderDescription('vertex');
    vDesc.addOutput('vec4<f32>', 'color');
    let code = vDesc.getCode();
    code = vtkWebGPUShaderCache.substitute(code, '//VTK::Color::Impl', [
      '  output.color = colorVI;',
    ]).result;
    vDesc.setCode(code);

    const fDesc = pipeline.getShaderDescription('fragment');
    code = fDesc.getCode();
    code = vtkWebGPUShaderCache.substitute(code, '//VTK::Color::Impl', [
      'ambientColor = input.color;',
      'diffuseColor = input.color;',
      'opacity = mapperUBO.Opacity * input.color.a;',
    ]).result;
    fDesc.setCode(code);
  };

  publicAPI.replaceShaderTCoord = (hash, pipeline, vertexInput) => {
    if (!vertexInput.hasAttribute('tcoord')) return;

    const vDesc = pipeline.getShaderDescription('vertex');
    vDesc.addOutput('vec2<f32>', 'tcoordVS');
    let code = vDesc.getCode();
    code = vtkWebGPUShaderCache.substitute(code, '//VTK::TCoord::Impl', [
      '  output.tcoordVS = tcoord;',
    ]).result;
    vDesc.setCode(code);

    const fDesc = pipeline.getShaderDescription('fragment');
    code = fDesc.getCode();
    const tcinput = [];

    for (let t = 0; t < model.textures.length; t++) {
      const tcount = pipeline.getBindGroupLayoutCount(`Texture${t}`);
      tcinput.push(
        `[[binding(0), group(${tcount})]] var Texture${t}: texture_2d<f32>;`
      );
      tcinput.push(
        `[[binding(1), group(${tcount})]] var Sampler${t}: sampler;`
      );
    }

    code = vtkWebGPUShaderCache.substitute(code, '//VTK::TCoord::Dec', tcinput)
      .result;

    if (model.textures.length) {
      code = vtkWebGPUShaderCache.substitute(code, '//VTK::TCoord::Impl', [
        'var tcolor: vec4<f32> = textureSample(Texture0, Sampler0, input.tcoordVS);',
        'computedColor = computedColor*tcolor;',
      ]).result;
    }
    fDesc.setCode(code);
  };

  publicAPI.replaceShaderSelect = (hash, pipeline, vertexInput) => {
    if (hash.includes('sel')) {
      const fDesc = pipeline.getShaderDescription('fragment');
      let code = fDesc.getCode();
      // by default there are no composites, so just 0
      code = vtkWebGPUShaderCache.substitute(code, '//VTK::Select::Impl', [
        '  var compositeID: u32 = 0u;',
      ]).result;
      fDesc.setCode(code);
    }
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

  publicAPI.getTopologyFromUsage = (usage) => {
    switch (usage) {
      case BufferUsage.Triangles:
        return 'triangle-list';
      case BufferUsage.Verts:
        return 'point-list';
      default:
      case BufferUsage.Lines:
        return 'line-list';
    }
  };

  publicAPI.buildVertexInput = (pd, cells, primType) => {
    const actor = model.WebGPUActor.getRenderable();
    const representation = actor.getProperty().getRepresentation();
    const device = model.WebGPURenderWindow.getDevice();

    const vertexInput = model.primitives[primType].vertexInput;

    // hash = all things that can change the values on the buffer
    // since mtimes are unique we can use
    // - cells mtime - because cells drive how we pack
    // - rep (point/wireframe/surface) - again because of packing
    // - relevant dataArray mtime - the source data
    // - shift - not currently captured
    // - scale - not currently captured
    // - format
    // - usage
    // - packExtra - covered by format
    // - prim type (vert/lines/polys/strips) - covered by cells mtime

    const hash = cells.getMTime() + representation;
    // points
    const points = pd.getPoints();
    if (points) {
      const shift = model.WebGPUActor.getBufferShift(model.WebGPURenderer);
      const buffRequest = {
        hash: hash + points.getMTime(),
        dataArray: points,
        source: points,
        cells,
        primitiveType: primType,
        representation,
        time: Math.max(
          points.getMTime(),
          cells.getMTime(),
          model.WebGPUActor.getKeyMatricesTime().getMTime()
        ),
        shift,
        usage: BufferUsage.PointArray,
        format: 'float32x4',
        packExtra: true,
      };
      const buff = device.getBufferManager().getBuffer(buffRequest);
      vertexInput.addBuffer(buff, ['vertexBC']);
    } else {
      vertexInput.removeBufferIfPresent('vertexBC');
    }

    // normals, only used for surface rendering
    const usage = publicAPI.getUsage(representation, primType);
    if (usage === BufferUsage.Triangles || usage === BufferUsage.Strips) {
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
        buffRequest.hash = hash + normals.getMTime();
        buffRequest.dataArray = normals;
        buffRequest.source = normals;
        buffRequest.time = Math.max(normals.getMTime(), cells.getMTime());
        buffRequest.usage = BufferUsage.PointArray;
        const buff = device.getBufferManager().getBuffer(buffRequest);
        vertexInput.addBuffer(buff, ['normalMC']);
      } else if (primType === PrimitiveTypes.Triangles) {
        buffRequest.hash = hash + points.getMTime();
        buffRequest.dataArray = points;
        buffRequest.source = points;
        buffRequest.time = Math.max(points.getMTime(), cells.getMTime());
        buffRequest.usage = BufferUsage.NormalsFromPoints;
        const buff = device.getBufferManager().getBuffer(buffRequest);
        vertexInput.addBuffer(buff, ['normalMC']);
      } else {
        vertexInput.removeBufferIfPresent('normalMC');
      }
    } else {
      vertexInput.removeBufferIfPresent('normalMC');
    }

    // deal with colors but only if modified
    let haveColors = false;
    if (model.renderable.getScalarVisibility()) {
      const c = model.renderable.getColorMapColors();
      if (c) {
        const scalarMode = model.renderable.getScalarMode();
        let haveCellScalars = false;
        // We must figure out how the scalars should be mapped to the polydata.
        if (
          (scalarMode === ScalarMode.USE_CELL_DATA ||
            scalarMode === ScalarMode.USE_CELL_FIELD_DATA ||
            scalarMode === ScalarMode.USE_FIELD_DATA ||
            !pd.getPointData().getScalars()) &&
          scalarMode !== ScalarMode.USE_POINT_FIELD_DATA &&
          c
        ) {
          haveCellScalars = true;
        }
        const buffRequest = {
          hash: hash + points.getMTime(),
          dataArray: c,
          source: c,
          cells,
          primitiveType: primType,
          representation,
          time: Math.max(c.getMTime(), cells.getMTime()),
          usage: BufferUsage.PointArray,
          format: 'unorm8x4',
          cellData: haveCellScalars,
          cellOffset: 0,
        };
        const buff = device.getBufferManager().getBuffer(buffRequest);
        vertexInput.addBuffer(buff, ['colorVI']);
        haveColors = true;
      }
    }
    if (!haveColors) {
      vertexInput.removeBufferIfPresent('colorVI');
    }

    let tcoords = null;
    if (
      model.renderable.getInterpolateScalarsBeforeMapping() &&
      model.renderable.getColorCoordinates()
    ) {
      tcoords = model.renderable.getColorCoordinates();
    } else {
      tcoords = pd.getPointData().getTCoords();
    }
    if (tcoords) {
      const buffRequest = {
        hash: hash + tcoords.getMTime(),
        dataArray: tcoords,
        source: tcoords,
        cells,
        primitiveType: primType,
        representation,
        time: Math.max(tcoords.getMTime(), cells.getMTime()),
        usage: BufferUsage.PointArray,
        format: 'float32x2',
      };
      const buff = device.getBufferManager().getBuffer(buffRequest);
      vertexInput.addBuffer(buff, ['tcoord']);
    } else {
      vertexInput.removeBufferIfPresent('tcoord');
    }
  };

  publicAPI.updateTextures = () => {
    // we keep track of new and used textures so
    // that we can clean up any unused textures so we don't hold onto them
    const usedTextures = [];
    const newTextures = [];

    // do we have a scalar color texture
    const idata = model.renderable.getColorTextureMap(); // returns an imagedata
    if (idata) {
      if (!model.colorTexture) {
        model.colorTexture = vtkTexture.newInstance();
      }
      model.colorTexture.setInputData(idata);
      newTextures.push(model.colorTexture);
    }

    // actor textures?
    const actor = model.WebGPUActor.getRenderable();
    const textures = actor.getTextures();
    for (let i = 0; i < textures.length; i++) {
      if (textures[i].getInputData()) {
        newTextures.push(textures[i]);
      }
      if (textures[i].getImage() && textures[i].getImageLoaded()) {
        newTextures.push(textures[i]);
      }
    }

    for (let i = 0; i < newTextures.length; i++) {
      const srcTexture = newTextures[i];
      const treq = {};
      if (srcTexture.getInputData()) {
        treq.imageData = srcTexture.getInputData();
        treq.source = treq.imageData;
      } else if (srcTexture.getImage()) {
        treq.image = srcTexture.getImage();
        treq.source = treq.image;
      }
      const newTex = model.device.getTextureManager().getTexture(treq);
      if (newTex.getReady()) {
        // is this a new texture
        let found = false;
        for (let t = 0; t < model.textures.length; t++) {
          if (model.textures[t] === newTex) {
            found = true;
            usedTextures[t] = true;
          }
        }
        if (!found) {
          usedTextures[model.textures.length] = true;
          model.textures.push(newTex);

          const newSamp = vtkWebGPUSampler.newInstance();
          const interpolate = srcTexture.getInterpolate()
            ? 'linear'
            : 'nearest';
          newSamp.create(model.device, {
            magFilter: interpolate,
            minFilter: interpolate,
          });
          model.samplers.push(newSamp);
          const newBG = model.device.getHandle().createBindGroup({
            layout: model.device.getTextureBindGroupLayout(),
            entries: [
              {
                binding: 0,
                resource: newTex.getHandle().createView(),
              },
              {
                binding: 1,
                resource: newSamp.getHandle(),
              },
            ],
          });
          model.textureBindGroups.push(newBG);
        }
      }
    }

    // remove unused textures
    for (let i = model.textures.length - 1; i >= 0; i--) {
      if (!usedTextures[i]) {
        model.textures.splice(i, 1);
        model.samplers.splice(i, 1);
        model.textureBindGroups.splice(i, 1);
      }
    }
  };

  // compute a unique hash for a pipeline, this needs to be unique enough to
  // capture any pipeline code changes (which includes shader changes)
  // or vertex input changes/ bind groups/ etc
  publicAPI.computePipelineHash = (vertexInput, usage) => {
    let pipelineHash = 'pd';
    if (vertexInput.hasAttribute(`normalMC`)) {
      pipelineHash += `n`;
    }
    if (vertexInput.hasAttribute(`colorVI`)) {
      pipelineHash += `c`;
    }
    if (vertexInput.hasAttribute(`tcoord`)) {
      pipelineHash += `t`;
    }
    if (model.textures.length) {
      pipelineHash += `tx${model.textures.length}`;
    }
    if (model.SSBO) {
      pipelineHash += `ssbo`;
    }
    const uhash = publicAPI.getHashFromUsage(usage);
    pipelineHash += uhash;
    pipelineHash += model.renderEncoder.getPipelineHash();

    return pipelineHash;
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

    const device = model.WebGPURenderWindow.getDevice();

    model.renderable.mapScalars(poly, 1.0);

    // handle textures
    publicAPI.updateTextures();

    // handle per primitive type
    for (let i = PrimitiveTypes.Points; i <= PrimitiveTypes.Triangles; i++) {
      if (prims[i].getNumberOfValues() > 0) {
        const actor = model.WebGPUActor.getRenderable();
        const rep = actor.getProperty().getRepresentation();
        const usage = publicAPI.getUsage(rep, i);

        const primHelper = model.primitives[i];

        publicAPI.buildVertexInput(model.currentInput, prims[i], i);
        const pipelineHash = publicAPI.computePipelineHash(
          primHelper.vertexInput,
          usage
        );

        // default to one instance and computed number of verts
        primHelper.numberOfInstances = 1;
        const vbo = primHelper.vertexInput.getBuffer('vertexBC');
        primHelper.numberOfVertices =
          vbo.getSizeInBytes() / vbo.getStrideInBytes();

        let pipeline = device.getPipeline(pipelineHash);

        // build VBO for this primitive
        // build the pipeline if needed
        if (!pipeline) {
          pipeline = vtkWebGPUPipeline.newInstance();
          pipeline.addBindGroupLayout(
            device.getRendererBindGroupLayout(),
            model.WebGPURenderer.getUBO().getName()
          );
          pipeline.addBindGroupLayout(
            device.getMapperBindGroupLayout(),
            model.UBO.getName()
          );
          if (model.SSBO) {
            pipeline.addBindGroupLayout(
              device.getStorageBindGroupLayout(),
              model.SSBO.getName()
            );
          }
          // add texture BindGroupLayouts
          for (let t = 0; t < model.textures.length; t++) {
            pipeline.addBindGroupLayout(
              device.getTextureBindGroupLayout(),
              `Texture${t}`
            );
          }
          publicAPI.generateShaderDescriptions(
            pipelineHash,
            pipeline,
            primHelper.vertexInput
          );
          pipeline.setTopology(publicAPI.getTopologyFromUsage(usage));
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
      }
    }
  };
}

// ----------------------------------------------------------------------------
// Object factory
// ----------------------------------------------------------------------------

const DEFAULT_VALUES = {
  colorTexture: null,
  renderEncoder: null,
  textures: null,
  samplers: null,
  textureBindGroups: null,
  primitives: null,
  tmpMat4: null,
  fragmentShaderTemplate: null,
  vertexShaderTemplate: null,
};

// ----------------------------------------------------------------------------

export function extend(publicAPI, model, initialValues = {}) {
  Object.assign(model, DEFAULT_VALUES, initialValues);

  // Inheritance
  vtkViewNode.extend(publicAPI, model, initialValues);

  model.tmpMat3 = mat3.identity(new Float64Array(9));
  model.tmpMat4 = mat4.identity(new Float64Array(16));

  model.fragmentShaderTemplate =
    model.fragmentShaderTemplate || vtkWebGPUPolyDataFS;
  model.vertexShaderTemplate =
    model.vertexShaderTemplate || vtkWebGPUPolyDataVS;

  model.UBO = vtkWebGPUUniformBuffer.newInstance();
  model.UBO.setName('mapperUBO');
  model.UBO.addEntry('BCWCMatrix', 'mat4x4<f32>');
  model.UBO.addEntry('BCSCMatrix', 'mat4x4<f32>');
  model.UBO.addEntry('MCWCNormals', 'mat4x4<f32>');
  model.UBO.addEntry('AmbientColor', 'vec4<f32>');
  model.UBO.addEntry('DiffuseColor', 'vec4<f32>');
  model.UBO.addEntry('AmbientIntensity', 'f32');
  model.UBO.addEntry('DiffuseIntensity', 'f32');
  model.UBO.addEntry('SpecularColor', 'vec4<f32>');
  model.UBO.addEntry('SpecularIntensity', 'f32');
  model.UBO.addEntry('Opacity', 'f32');
  model.UBO.addEntry('SpecularPower', 'f32');
  model.UBO.addEntry('PropID', 'u32');

  model.samplers = [];
  model.textures = [];
  model.textureBindGroups = [];
  model.primitives = [];
  for (let i = PrimitiveTypes.Start; i < PrimitiveTypes.End; i++) {
    model.primitives[i] = {
      primitiveType: i,
      vertexInput: vtkWebGPUVertexInput.newInstance(),
    };
    const primHelper = model.primitives[i];

    model.primitives[i].renderForPipeline = (pipeline) => {
      const renderEncoder = model.WebGPURenderer.getRenderEncoder();

      // bind the mapper UBO
      const midx = pipeline.getBindGroupLayoutCount(model.UBO.getName());
      renderEncoder.setBindGroup(midx, model.UBO.getBindGroup());

      if (model.SSBO) {
        const sidx = pipeline.getBindGroupLayoutCount(model.SSBO.getName());
        renderEncoder.setBindGroup(sidx, model.SSBO.getBindGroup());
      }

      // bind any textures and samplers
      for (let t = 0; t < model.textures.length; t++) {
        const tcount = pipeline.getBindGroupLayoutCount(`Texture${t}`);
        renderEncoder.setBindGroup(tcount, model.textureBindGroups[t]);
      }

      // bind the vertex input
      pipeline.bindVertexInput(renderEncoder, primHelper.vertexInput);
      renderEncoder.draw(
        primHelper.numberOfVertices,
        primHelper.numberOfInstances,
        0,
        0
      );
    };
  }

  // Build VTK API
  macro.setGet(publicAPI, model, [
    'context',
    'fragmentShaderTemplate',
    'vertexShaderTemplate',
    'renderEncoder',
    'UBO',
  ]);

  // Object methods
  vtkWebGPUPolyDataMapper(publicAPI, model);
}

// ----------------------------------------------------------------------------

export const newInstance = macro.newInstance(extend, 'vtkWebGPUPolyDataMapper');

// ----------------------------------------------------------------------------

export default { newInstance, extend };

// Register ourself to WebGPU backend if imported
registerOverride('vtkMapper', newInstance);
