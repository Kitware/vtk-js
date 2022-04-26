import { mat3, mat4 } from 'gl-matrix';

import * as macro from 'vtk.js/Sources/macros';
import vtkMapper from 'vtk.js/Sources/Rendering/Core/Mapper';
import vtkProperty from 'vtk.js/Sources/Rendering/Core/Property';
import vtkTexture from 'vtk.js/Sources/Rendering/Core/Texture';
import vtkWebGPUBufferManager from 'vtk.js/Sources/Rendering/WebGPU/BufferManager';
import vtkWebGPUShaderCache from 'vtk.js/Sources/Rendering/WebGPU/ShaderCache';
import vtkWebGPUUniformBuffer from 'vtk.js/Sources/Rendering/WebGPU/UniformBuffer';
import vtkWebGPUSimpleMapper from 'vtk.js/Sources/Rendering/WebGPU/SimpleMapper';

const { BufferUsage, PrimitiveTypes } = vtkWebGPUBufferManager;
const { Representation } = vtkProperty;
const { ScalarMode } = vtkMapper;

const vtkWebGPUPolyDataVS = `
//VTK::Renderer::Dec

//VTK::Color::Dec

//VTK::Normal::Dec

//VTK::TCoord::Dec

//VTK::Select::Dec

//VTK::Mapper::Dec

//VTK::IOStructs::Dec

@stage(vertex)
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

@stage(fragment)
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

  //VTK::Position::Impl

  //VTK::RenderEncoder::Impl
  return output;
}
`;

function isEdges(hash) {
  // edge pipelines have "edge" in them
  return hash.indexOf('edge') >= 0;
}

// ----------------------------------------------------------------------------
// vtkWebGPUCellArrayMapper methods
// ----------------------------------------------------------------------------

function vtkWebGPUCellArrayMapper(publicAPI, model) {
  // Set our className
  model.classHierarchy.push('vtkWebGPUCellArrayMapper');

  publicAPI.buildPass = (prepass) => {
    if (prepass) {
      model.WebGPUActor = publicAPI.getFirstAncestorOfType('vtkWebGPUActor');
      model.WebGPURenderer =
        model.WebGPUActor.getFirstAncestorOfType('vtkWebGPURenderer');
      model.WebGPURenderWindow = model.WebGPURenderer.getParent();
      model.device = model.WebGPURenderWindow.getDevice();
    }
  };

  // Renders myself
  publicAPI.translucentPass = (prepass) => {
    if (prepass) {
      publicAPI.prepareToDraw(model.WebGPURenderer.getRenderEncoder());
      model.renderEncoder.registerDrawCallback(model.pipeline, publicAPI.draw);
    }
  };

  publicAPI.opaquePass = (prepass) => {
    if (prepass) {
      publicAPI.prepareToDraw(model.WebGPURenderer.getRenderEncoder());
      model.renderEncoder.registerDrawCallback(model.pipeline, publicAPI.draw);
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
      model.UBO.setValue('LineWidth', ppty.getLineWidth());
      aColor = ppty.getEdgeColorByReference();
      model.UBO.setArray('EdgeColor', [aColor[0], aColor[1], aColor[2], 1.0]);
      model.UBO.setValue('Opacity', ppty.getOpacity());
      model.UBO.setValue('PropID', model.WebGPUActor.getPropID());
      const device = model.WebGPURenderWindow.getDevice();
      model.UBO.sendIfNeeded(device);
    }
  };

  publicAPI.haveWideLines = () => {
    const actor = model.WebGPUActor.getRenderable();
    const representation = actor.getProperty().getRepresentation();
    if (actor.getProperty().getLineWidth() <= 1.0) {
      return false;
    }
    if (model.primitiveType === PrimitiveTypes.Verts) {
      return false;
    }
    if (
      model.primitiveType === PrimitiveTypes.Triangles ||
      model.primitiveType === PrimitiveTypes.TriangleStrips
    ) {
      return representation === Representation.WIREFRAME;
    }
    return true;
  };

  publicAPI.replaceShaderPosition = (hash, pipeline, vertexInput) => {
    const vDesc = pipeline.getShaderDescription('vertex');
    vDesc.addBuiltinOutput('vec4<f32>', '@builtin(position) Position');
    let code = vDesc.getCode();
    if (publicAPI.haveWideLines()) {
      vDesc.addBuiltinInput('u32', '@builtin(instance_index) instanceIndex');
      // widen the edge
      code = vtkWebGPUShaderCache.substitute(code, '//VTK::Position::Impl', [
        '    var tmpPos: vec4<f32> = rendererUBO.SCPCMatrix*mapperUBO.BCSCMatrix*vertexBC;',
        '    var numSteps: f32 = ceil(mapperUBO.LineWidth - 1.0);',
        '    var offset: f32 = (mapperUBO.LineWidth - 1.0) * (f32(input.instanceIndex / 2u) - numSteps/2.0) / numSteps;',
        '    var tmpPos2: vec3<f32> = tmpPos.xyz / tmpPos.w;',
        '    tmpPos2.x = tmpPos2.x + 2.0 * (f32(input.instanceIndex) % 2.0) * offset / rendererUBO.viewportSize.x;',
        '    tmpPos2.y = tmpPos2.y + 2.0 * (f32(input.instanceIndex + 1u) % 2.0) * offset / rendererUBO.viewportSize.y;',
        '    tmpPos2.z = tmpPos2.z + 0.00001;', // could become a setting
        '    output.Position = vec4<f32>(tmpPos2.xyz * tmpPos.w, tmpPos.w);',
      ]).result;
    } else {
      code = vtkWebGPUShaderCache.substitute(code, '//VTK::Position::Impl', [
        '    output.Position = rendererUBO.SCPCMatrix*mapperUBO.BCSCMatrix*vertexBC;',
      ]).result;
    }

    vDesc.setCode(code);
  };
  model.shaderReplacements.set(
    'replaceShaderPosition',
    publicAPI.replaceShaderPosition
  );

  publicAPI.replaceShaderNormal = (hash, pipeline, vertexInput) => {
    const normalBuffer = vertexInput.getBuffer('normalMC');
    if (normalBuffer) {
      const vDesc = pipeline.getShaderDescription('vertex');
      vDesc.addOutput(
        'vec3<f32>',
        'normalVC',
        normalBuffer.getArrayInformation()[0].interpolation
      );
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
  model.shaderReplacements.set(
    'replaceShaderNormal',
    publicAPI.replaceShaderNormal
  );

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
  model.shaderReplacements.set(
    'replaceShaderLight',
    publicAPI.replaceShaderLight
  );

  publicAPI.replaceShaderColor = (hash, pipeline, vertexInput) => {
    if (isEdges(hash)) {
      const fDesc = pipeline.getShaderDescription('fragment');
      let code = fDesc.getCode();
      code = vtkWebGPUShaderCache.substitute(code, '//VTK::Color::Impl', [
        'ambientColor = mapperUBO.EdgeColor;',
        'diffuseColor = mapperUBO.EdgeColor;',
      ]).result;
      fDesc.setCode(code);
      return;
    }

    const colorBuffer = vertexInput.getBuffer('colorVI');
    if (!colorBuffer) return;

    const vDesc = pipeline.getShaderDescription('vertex');
    vDesc.addOutput(
      'vec4<f32>',
      'color',
      colorBuffer.getArrayInformation()[0].interpolation
    );
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
  model.shaderReplacements.set(
    'replaceShaderColor',
    publicAPI.replaceShaderColor
  );

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

    // todo handle multiple textures? Blend multiply ?
    if (model.textures.length) {
      code = vtkWebGPUShaderCache.substitute(code, '//VTK::TCoord::Impl', [
        'var tcolor: vec4<f32> = textureSample(Texture0, Texture0Sampler, input.tcoordVS);',
        'computedColor = computedColor*tcolor;',
      ]).result;
    }
    fDesc.setCode(code);
  };
  model.shaderReplacements.set(
    'replaceShaderTCoord',
    publicAPI.replaceShaderTCoord
  );

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
  model.shaderReplacements.set(
    'replaceShaderSelect',
    publicAPI.replaceShaderSelect
  );

  publicAPI.getUsage = (rep, i) => {
    if (rep === Representation.POINTS || i === PrimitiveTypes.Points) {
      return BufferUsage.Verts;
    }

    if (i === PrimitiveTypes.Lines) {
      return BufferUsage.Lines;
    }

    if (rep === Representation.WIREFRAME) {
      if (i === PrimitiveTypes.Triangles) {
        return BufferUsage.LinesFromTriangles;
      }
      return BufferUsage.LinesFromStrips;
    }

    if (i === PrimitiveTypes.Triangles) {
      return BufferUsage.Triangles;
    }

    if (i === PrimitiveTypes.TriangleStrips) {
      return BufferUsage.Strips;
    }

    if (i === PrimitiveTypes.TriangleEdges) {
      return BufferUsage.LinesFromTriangles;
    }

    // only strip edges left which are lines
    return BufferUsage.LinesFromStrips;
  };

  publicAPI.getHashFromUsage = (usage) => `pt${usage}`;

  publicAPI.getTopologyFromUsage = (usage) => {
    switch (usage) {
      case BufferUsage.Triangles:
        return 'triangle-list';
      case BufferUsage.Verts:
        return 'point-list';
      case BufferUsage.Lines:
      default:
        return 'line-list';
    }
  };

  publicAPI.buildVertexInput = () => {
    const pd = model.currentInput;
    const cells = model.cellArray;
    const primType = model.primitiveType;

    const actor = model.WebGPUActor.getRenderable();
    let representation = actor.getProperty().getRepresentation();
    const device = model.WebGPURenderWindow.getDevice();
    let edges = false;
    if (primType === PrimitiveTypes.TriangleEdges) {
      edges = true;
      representation = Representation.WIREFRAME;
    }

    const vertexInput = model.vertexInput;
    const points = pd.getPoints();
    let indexBuffer;

    // get the flat mapping indexBuffer for the cells
    if (cells) {
      const buffRequest = {
        hash: `R${representation}P${primType}${cells.getMTime()}`,
        usage: BufferUsage.Index,
        cells,
        numberOfPoints: points.getNumberOfPoints(),
        primitiveType: primType,
        representation,
      };
      indexBuffer = device.getBufferManager().getBuffer(buffRequest);
      vertexInput.setIndexBuffer(indexBuffer);
    } else {
      vertexInput.setIndexBuffer(null);
    }

    // hash = all things that can change the values on the buffer
    // since mtimes are unique we can use
    // - indexBuffer mtime - because cells drive how we pack
    // - relevant dataArray mtime - the source data
    // - shift - not currently captured
    // - scale - not currently captured
    // - format
    // - usage
    // - packExtra - covered by format

    // points
    if (points) {
      const shift = model.WebGPUActor.getBufferShift(model.WebGPURenderer);
      const buffRequest = {
        hash: `${points.getMTime()}I${indexBuffer.getMTime()}${shift.join()}float32x4`,
        usage: BufferUsage.PointArray,
        format: 'float32x4',
        dataArray: points,
        indexBuffer,
        shift,
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
        format: 'snorm8x4',
        indexBuffer,
        packExtra: true,
        shift: 0,
        scale: 127,
      };
      if (normals) {
        buffRequest.hash = `${normals.getMTime()}I${indexBuffer.getMTime()}snorm8x4`;
        buffRequest.dataArray = normals;
        buffRequest.usage = BufferUsage.PointArray;
        const buff = device.getBufferManager().getBuffer(buffRequest);
        vertexInput.addBuffer(buff, ['normalMC']);
      } else if (primType === PrimitiveTypes.Triangles) {
        buffRequest.hash = `PFN${points.getMTime()}I${indexBuffer.getMTime()}snorm8x4`;
        buffRequest.dataArray = points;
        buffRequest.cells = cells;
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
      if (c && !edges) {
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
          usage: BufferUsage.PointArray,
          format: 'unorm8x4',
          hash: `${haveCellScalars}${c.getMTime()}I${indexBuffer.getMTime()}unorm8x4`,
          dataArray: c,
          indexBuffer,
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
    if (tcoords && !edges) {
      const buff = device
        .getBufferManager()
        .getBufferForPointArray(tcoords, vertexInput.getIndexBuffer());
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
        model.colorTexture = vtkTexture.newInstance({ label: 'polyDataColor' });
      }
      model.colorTexture.setInputData(idata);
      newTextures.push(model.colorTexture);
    }

    // actor textures?
    const actor = model.WebGPUActor.getRenderable();
    const textures = actor.getTextures();
    for (let i = 0; i < textures.length; i++) {
      if (
        textures[i].getInputData() ||
        textures[i].getJsImageData() ||
        textures[i].getCanvas()
      ) {
        newTextures.push(textures[i]);
      }
      if (textures[i].getImage() && textures[i].getImageLoaded()) {
        newTextures.push(textures[i]);
      }
    }

    let usedCount = 0;
    for (let i = 0; i < newTextures.length; i++) {
      const srcTexture = newTextures[i];
      const newTex = model.device
        .getTextureManager()
        .getTextureForVTKTexture(srcTexture);
      if (newTex.getReady()) {
        // is this a new texture
        let found = false;
        for (let t = 0; t < model.textures.length; t++) {
          if (model.textures[t] === newTex) {
            usedCount++;
            found = true;
            usedTextures[t] = true;
          }
        }
        if (!found) {
          usedTextures[model.textures.length] = true;
          const tview = newTex.createView(`Texture${usedCount++}`);
          model.textures.push(newTex);
          model.textureViews.push(tview);
          const interpolate = srcTexture.getInterpolate()
            ? 'linear'
            : 'nearest';
          tview.addSampler(model.device, {
            minFilter: interpolate,
            magFilter: interpolate,
          });
        }
      }
    }

    // remove unused textures
    for (let i = model.textures.length - 1; i >= 0; i--) {
      if (!usedTextures[i]) {
        model.textures.splice(i, 1);
        model.textureViews.splice(i, 1);
      }
    }
  };

  // compute a unique hash for a pipeline, this needs to be unique enough to
  // capture any pipeline code changes (which includes shader changes)
  // or vertex input changes/ bind groups/ etc
  publicAPI.computePipelineHash = () => {
    let pipelineHash = 'pd';
    if (
      model.primitiveType === PrimitiveTypes.TriangleEdges ||
      model.primitiveType === PrimitiveTypes.TriangleStripEdges
    ) {
      pipelineHash += 'edge';
    } else {
      if (model.vertexInput.hasAttribute(`normalMC`)) {
        pipelineHash += `n`;
      }
      if (model.vertexInput.hasAttribute(`colorVI`)) {
        pipelineHash += `c`;
      }
      if (model.vertexInput.hasAttribute(`tcoord`)) {
        pipelineHash += `t`;
      }
      if (model.textures.length) {
        pipelineHash += `tx${model.textures.length}`;
      }
    }

    if (model.SSBO) {
      pipelineHash += `ssbo`;
    }
    const uhash = publicAPI.getHashFromUsage(model.usage);
    pipelineHash += uhash;
    pipelineHash += model.renderEncoder.getPipelineHash();

    model.pipelineHash = pipelineHash;
  };

  publicAPI.updateBuffers = () => {
    // handle textures if not edges
    if (
      model.primitiveType !== PrimitiveTypes.TriangleEdges &&
      model.primitiveType !== PrimitiveTypes.TriangleStripEdges
    ) {
      publicAPI.updateTextures();
    }

    const actor = model.WebGPUActor.getRenderable();
    const rep = actor.getProperty().getRepresentation();

    // handle per primitive type
    model.usage = publicAPI.getUsage(rep, model.primitiveType);
    publicAPI.buildVertexInput();

    const vbo = model.vertexInput.getBuffer('vertexBC');
    publicAPI.setNumberOfVertices(
      vbo.getSizeInBytes() / vbo.getStrideInBytes()
    );
    publicAPI.setTopology(publicAPI.getTopologyFromUsage(model.usage));
    publicAPI.updateUBO();
    if (publicAPI.haveWideLines()) {
      const ppty = actor.getProperty();
      publicAPI.setNumberOfInstances(Math.ceil(ppty.getLineWidth() * 2.0));
    }
  };
}

// ----------------------------------------------------------------------------
// Object factory
// ----------------------------------------------------------------------------

const DEFAULT_VALUES = {
  cellArray: null,
  currentInput: null,
  cellOffset: 0,
  primitiveType: 0,
  colorTexture: null,
  renderEncoder: null,
  textures: null,
};

// ----------------------------------------------------------------------------

export function extend(publicAPI, model, initialValues = {}) {
  Object.assign(model, DEFAULT_VALUES, initialValues);

  // Inheritance
  vtkWebGPUSimpleMapper.extend(publicAPI, model, initialValues);

  model.fragmentShaderTemplate = vtkWebGPUPolyDataFS;
  model.vertexShaderTemplate = vtkWebGPUPolyDataVS;

  model._tmpMat3 = mat3.identity(new Float64Array(9));
  model._tmpMat4 = mat4.identity(new Float64Array(16));

  model.UBO = vtkWebGPUUniformBuffer.newInstance({ label: 'mapperUBO' });
  model.UBO.addEntry('BCWCMatrix', 'mat4x4<f32>');
  model.UBO.addEntry('BCSCMatrix', 'mat4x4<f32>');
  model.UBO.addEntry('MCWCNormals', 'mat4x4<f32>');
  model.UBO.addEntry('AmbientColor', 'vec4<f32>');
  model.UBO.addEntry('DiffuseColor', 'vec4<f32>');
  model.UBO.addEntry('EdgeColor', 'vec4<f32>');
  model.UBO.addEntry('SpecularColor', 'vec4<f32>');
  model.UBO.addEntry('AmbientIntensity', 'f32');
  model.UBO.addEntry('DiffuseIntensity', 'f32');
  model.UBO.addEntry('SpecularIntensity', 'f32');
  model.UBO.addEntry('LineWidth', 'f32');
  model.UBO.addEntry('Opacity', 'f32');
  model.UBO.addEntry('SpecularPower', 'f32');
  model.UBO.addEntry('PropID', 'u32');

  // Build VTK API
  macro.setGet(publicAPI, model, [
    'cellArray',
    'currentInput',
    'cellOffset',
    'primitiveType',
    'renderEncoder',
  ]);

  model.textures = [];

  // Object methods
  vtkWebGPUCellArrayMapper(publicAPI, model);
}

// ----------------------------------------------------------------------------

export const newInstance = macro.newInstance(
  extend,
  'vtkWebGPUCellArrayMapper'
);

// ----------------------------------------------------------------------------

export default { newInstance, extend };
