import vtkWebGPUShaderCache from 'vtk.js/Sources/Rendering/WebGPU/ShaderCache';
import vtkWebGPUTypes from 'vtk.js/Sources/Rendering/WebGPU/Types';
import vtkProperty from 'vtk.js/Sources/Rendering/Core/Property';
import { getUV } from 'vtk.js/Sources/Rendering/WebGPU/CellArrayMapper/Helpers';

const { Shading } = vtkProperty;

function replaceShaderTCoord(publicAPI, model, hash, pipeline, vertexInput) {
  if (!vertexInput.hasAttribute('tcoord')) return;

  const vDesc = pipeline.getShaderDescription('vertex');
  const tcoords = vertexInput.getBuffer('tcoord');
  const numComp = vtkWebGPUTypes.getNumberOfComponentsFromBufferFormat(
    tcoords.getArrayInformation()[0].format
  );
  let code = vDesc.getCode();

  // A texture coordinate with one component goes to the fragment shader as
  // vec2(t, 0), so it samples the first row of a 2D texture. The 1D texture
  // of a color ramp is a texture with one row.
  const tcoordOutput = (name, components) => {
    if (components === 1) {
      vDesc.addOutput('vec2<f32>', `${name}VS`);
      return `  output.${name}VS = vec2<f32>(${name}, 0.0);`;
    }
    vDesc.addOutput(`vec${components}<f32>`, `${name}VS`);
    return `  output.${name}VS = ${name};`;
  };

  const actor = model.WebGPUActor.getRenderable();
  const ppty = actor.getProperty();
  const isPBR = ppty.getInterpolation?.() === Shading.PBR;

  const hasTcoord1 = vertexInput.hasAttribute('tcoord1');
  const tcoordImpl = [tcoordOutput('tcoord', numComp)];
  if (hasTcoord1) {
    const tcoords1 = vertexInput.getBuffer('tcoord1');
    const numComp1 = vtkWebGPUTypes.getNumberOfComponentsFromBufferFormat(
      tcoords1.getArrayInformation()[0].format
    );
    tcoordImpl.push(tcoordOutput('tcoord1', numComp1));
  }

  // Always pass through UVs untransformed; transforms are applied per-texture in fragment
  code = vtkWebGPUShaderCache.substitute(
    code,
    '//VTK::TCoord::Impl',
    tcoordImpl
  ).result;
  vDesc.setCode(code);

  const fDesc = pipeline.getShaderDescription('fragment');
  code = fDesc.getCode();

  const transforms = ppty.getTextureTransforms?.() || {};

  const uv = (transformKey) => getUV(transformKey, transforms, hasTcoord1);

  // Only an HTML image loads after it is set, so only an image texture
  // must wait for imageLoaded. The other sources have their data at once.
  const isTextureReady = (texture) => {
    if (texture.getImage?.()) {
      return !!texture.getImageLoaded?.();
    }
    return true;
  };

  const isSampleableTexture = (texture) =>
    !!texture &&
    isTextureReady(texture) &&
    texture.getDimensionality?.() === numComp;

  const usedTextures = [];
  const addTextureSample = (texture, sampleCode) => {
    if (isSampleableTexture(texture)) {
      usedTextures.push(sampleCode);
    }
  };

  const diffuseTexture = ppty.getDiffuseTexture?.();

  // A cube map is sampled with the 3D direction in the texture coordinates.
  // The UV transforms are 2D only, so they do not apply to it. The bound view
  // tells if the texture manager made a cube map, so the shader always
  // matches the binding.
  const diffuseIsCubeMap =
    numComp === 3 &&
    model.textureViews.some(
      (view) =>
        view.getLabel?.() === 'DiffuseTexture' &&
        view.getDimension?.() === 'cube'
    );

  const diffuseSources = [diffuseTexture, actor.getTextures()[0]];
  if (diffuseIsCubeMap) {
    usedTextures.push(
      '_diffuseMap = textureSample(DiffuseTexture, DiffuseTextureSampler, input.tcoordVS);'
    );
  } else if (diffuseSources.some(isSampleableTexture)) {
    // As in the OpenGL backend, one component is luminance and two
    // components are luminance and alpha. A view with a swizzle already
    // remaps the channels.
    const diffuseIndex = model.textureViews.findIndex(
      (view) => view.getLabel?.() === 'DiffuseTexture'
    );
    const diffuseView = model.textureViews[diffuseIndex];
    const diffuseComponents =
      model.textures[diffuseIndex]?.getNumberOfComponents?.() ?? 4;
    let swizzle = '';
    if (!diffuseView?.getSwizzle?.()) {
      if (diffuseComponents === 1) {
        swizzle = '.rrra';
      } else if (diffuseComponents === 2) {
        swizzle = '.rrrg';
      }
    }
    usedTextures.push(
      `_diffuseMap = textureSample(DiffuseTexture, DiffuseTextureSampler, ${uv(
        'diffuse'
      )})${swizzle};`
    );
  }

  const ormTexture = isPBR ? ppty.getORMTexture?.() : null;
  const rmTexture = isPBR ? ppty.getRMTexture?.() : null;
  const roughnessTexture = isPBR ? ppty.getRoughnessTexture?.() : null;
  const metallicTexture = isPBR ? ppty.getMetallicTexture?.() : null;
  const ambientOcclusionTexture = isPBR
    ? ppty.getAmbientOcclusionTexture?.()
    : null;
  const emissionTexture = isPBR ? ppty.getEmissionTexture?.() : null;
  const normalTexture = isPBR ? ppty.getNormalTexture?.() : null;

  // ORM texture support: if present, sample R/G/B for AO/Roughness/Metallic
  if (isSampleableTexture(ormTexture)) {
    const ormUV = uv('rm');
    usedTextures.push(
      `let ormSample = textureSample(ORMTexture, ORMTextureSampler, ${ormUV});`,
      `_ambientOcclusionMap = ormSample.rrra;`,
      `_roughnessMap = ormSample.ggga;`,
      `_metallicMap = ormSample.bbba;`
    );
  } else if (isSampleableTexture(rmTexture)) {
    const rmUV = uv('rm');
    usedTextures.push(
      `let rmSample = textureSample(RMTexture, RMTextureSampler, ${rmUV});`,
      `_roughnessMap = rmSample.ggga;`,
      `_metallicMap = rmSample.bbba;`
    );

    // AO is separate from RM - sample it independently
    addTextureSample(
      ambientOcclusionTexture,
      `_ambientOcclusionMap = textureSample(AmbientOcclusionTexture, AmbientOcclusionTextureSampler, ${uv(
        'ao'
      )}).rrra;`
    );
  } else {
    addTextureSample(
      roughnessTexture,
      `_roughnessMap = textureSample(RoughnessTexture, RoughnessTextureSampler, ${uv(
        'rm'
      )}).ggga;`
    );
    addTextureSample(
      metallicTexture,
      `_metallicMap = textureSample(MetallicTexture, MetallicTextureSampler, ${uv(
        'rm'
      )}).bbba;`
    );
    addTextureSample(
      ambientOcclusionTexture,
      `_ambientOcclusionMap = textureSample(AmbientOcclusionTexture, AmbientOcclusionTextureSampler, ${uv(
        'ao'
      )}).rrra;`
    );
  }
  addTextureSample(
    emissionTexture,
    `_emissionMap = textureSample(EmissionTexture, EmissionTextureSampler, ${uv(
      'emission'
    )});`
  );
  addTextureSample(
    normalTexture,
    `_normalMap = textureSample(NormalTexture, NormalTextureSampler, ${uv(
      'normal'
    )});`
  );

  const anisotropyTexture = isPBR ? ppty.getAnisotropyTexture?.() : null;
  addTextureSample(
    anisotropyTexture,
    `_anisotropyMap = textureSample(AnisotropyTexture, AnisotropyTextureSampler, ${uv(
      'anisotropy'
    )});`
  );

  const coatTexture = isPBR ? ppty.getCoatTexture?.() : null;
  addTextureSample(
    coatTexture,
    `_coatMap = textureSample(CoatTexture, CoatTextureSampler, ${uv('coat')});`
  );

  const coatRoughnessTexture = isPBR ? ppty.getCoatRoughnessTexture?.() : null;
  addTextureSample(
    coatRoughnessTexture,
    `_coatRoughnessMap = textureSample(CoatRoughnessTexture, CoatRoughnessTextureSampler, ${uv(
      'coatRoughness'
    )});`
  );

  const coatNormalTexture = isPBR ? ppty.getCoatNormalTexture?.() : null;
  addTextureSample(
    coatNormalTexture,
    `_coatNormalMap = textureSample(CoatNormalTexture, CoatNormalTextureSampler, ${uv(
      'coatNormal'
    )});`
  );

  const displacementTexture = ppty.getDisplacementTexture?.();
  addTextureSample(
    displacementTexture,
    `_displacementMap = textureSample(DisplacementTexture, DisplacementTextureSampler, ${uv(
      'displacement'
    )});`
  );

  const transmissionTexture = isPBR ? ppty.getTransmissionTexture?.() : null;
  addTextureSample(
    transmissionTexture,
    `_transmissionMap = textureSample(TransmissionTexture, TransmissionTextureSampler, ${uv(
      'transmission'
    )});`
  );

  const thicknessTexture = isPBR ? ppty.getThicknessTexture?.() : null;
  addTextureSample(
    thicknessTexture,
    `_thicknessMap = textureSample(ThicknessTexture, ThicknessTextureSampler, ${uv(
      'thickness'
    )});`
  );

  const iridescenceTexture = isPBR ? ppty.getIridescenceTexture?.() : null;
  addTextureSample(
    iridescenceTexture,
    `_iridescenceMap = textureSample(IridescenceTexture, IridescenceTextureSampler, ${uv(
      'iridescence'
    )});`
  );

  const iridescenceThicknessTexture = isPBR
    ? ppty.getIridescenceThicknessTexture?.()
    : null;
  addTextureSample(
    iridescenceThicknessTexture,
    `_iridescenceThicknessMap = textureSample(IridescenceThicknessTexture, IridescenceThicknessTextureSampler, ${uv(
      'iridescenceThickness'
    )});`
  );

  // Sheen textures
  const sheenColorTexture = isPBR ? ppty.getSheenColorTexture?.() : null;
  addTextureSample(
    sheenColorTexture,
    `_sheenColorMap = textureSample(SheenColorTexture, SheenColorTextureSampler, ${uv(
      'sheenColor'
    )});`
  );
  const sheenRoughnessTexture = isPBR
    ? ppty.getSheenRoughnessTexture?.()
    : null;
  addTextureSample(
    sheenRoughnessTexture,
    `_sheenRoughnessMap = textureSample(SheenRoughnessTexture, SheenRoughnessTextureSampler, ${uv(
      'sheenRoughness'
    )});`
  );

  // Diffuse transmission textures
  const diffTransTexture = isPBR
    ? ppty.getDiffuseTransmissionTexture?.()
    : null;
  addTextureSample(
    diffTransTexture,
    `_diffuseTransmissionMap = textureSample(DiffuseTransmissionTexture, DiffuseTransmissionTextureSampler, ${uv(
      'diffuseTransmission'
    )});`
  );
  const diffTransColorTexture = isPBR
    ? ppty.getDiffuseTransmissionColorTexture?.()
    : null;
  addTextureSample(
    diffTransColorTexture,
    `_diffuseTransmissionColorMap = textureSample(DiffuseTransmissionColorTexture, DiffuseTransmissionColorTextureSampler, ${uv(
      'diffuseTransmissionColor'
    )});`
  );

  // KHR_materials_specular textures
  const specularTexture = isPBR ? ppty.getSpecularTexture?.() : null;
  addTextureSample(
    specularTexture,
    `_specularMap = textureSample(SpecularTexture, SpecularTextureSampler, ${uv(
      'specular'
    )});`
  );
  const specularColorTexture = isPBR ? ppty.getSpecularColorTexture?.() : null;
  addTextureSample(
    specularColorTexture,
    `_specularColorMap = textureSample(SpecularColorTexture, SpecularColorTextureSampler, ${uv(
      'specularColor'
    )});`
  );

  code = vtkWebGPUShaderCache.substitute(
    code,
    '//VTK::TCoord::Impl',
    usedTextures
  ).result;
  fDesc.setCode(code);
}

export default replaceShaderTCoord;
