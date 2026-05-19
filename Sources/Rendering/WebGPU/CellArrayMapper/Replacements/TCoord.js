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
  vDesc.addOutput(`vec${numComp}<f32>`, 'tcoordVS');

  const actor = model.WebGPUActor.getRenderable();
  const ppty = actor.getProperty();
  const isPBR = ppty.getInterpolation?.() === Shading.PBR;

  const hasTcoord1 = vertexInput.hasAttribute('tcoord1');
  const tcoordImpl = ['  output.tcoordVS = tcoord;'];
  if (hasTcoord1) {
    const tcoords1 = vertexInput.getBuffer('tcoord1');
    const numComp1 = vtkWebGPUTypes.getNumberOfComponentsFromBufferFormat(
      tcoords1.getArrayInformation()[0].format
    );
    vDesc.addOutput(`vec${numComp1}<f32>`, 'tcoord1VS');
    tcoordImpl.push('  output.tcoord1VS = tcoord1;');
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

  const isSampleableTexture = (texture) =>
    !!texture &&
    (texture.getImageLoaded?.() ?? true) &&
    texture.getDimensionality?.() === numComp;

  const usedTextures = [];
  const addTextureSample = (texture, sampleCode) => {
    if (isSampleableTexture(texture)) {
      usedTextures.push(sampleCode);
    }
  };

  const diffuseTexture = ppty.getDiffuseTexture?.();

  const diffuseSources = [diffuseTexture, actor.getTextures()[0]];
  if (diffuseSources.some(isSampleableTexture)) {
    usedTextures.push(
      `_diffuseMap = textureSample(DiffuseTexture, DiffuseTextureSampler, ${uv(
        'diffuse'
      )});`
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
