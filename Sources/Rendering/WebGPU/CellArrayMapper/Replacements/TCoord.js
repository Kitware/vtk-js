import vtkWebGPUShaderCache from 'vtk.js/Sources/Rendering/WebGPU/ShaderCache';
import vtkWebGPUTypes from 'vtk.js/Sources/Rendering/WebGPU/Types';
import { getUV } from 'vtk.js/Sources/Rendering/WebGPU/CellArrayMapper/Helpers';

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

  const diffuseSources = [
    diffuseTexture,
    actor.getTextures()[0],
  ];
  if (diffuseSources.some(isSampleableTexture)) {
    usedTextures.push(
      `_diffuseMap = textureSample(DiffuseTexture, DiffuseTextureSampler, ${uv(
        'diffuse'
      )});`
    );
  }

  const ormTexture = ppty.getORMTexture?.();
  const rmTexture = ppty.getRMTexture?.();
  const roughnessTexture = ppty.getRoughnessTexture?.();
  const metallicTexture = ppty.getMetallicTexture?.();
  const ambientOcclusionTexture = ppty.getAmbientOcclusionTexture?.();
  const emissionTexture = ppty.getEmissionTexture?.();
  const normalTexture = ppty.getNormalTexture?.();

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

  const anisotropyTexture = ppty.getAnisotropyTexture?.();
  addTextureSample(
    anisotropyTexture,
    `_anisotropyMap = textureSample(AnisotropyTexture, AnisotropyTextureSampler, ${uv(
      'anisotropy'
    )});`
  );

  const coatTexture = ppty.getCoatTexture?.();
  addTextureSample(
    coatTexture,
    `_coatMap = textureSample(CoatTexture, CoatTextureSampler, ${uv('coat')});`
  );

  const coatRoughnessTexture = ppty.getCoatRoughnessTexture?.();
  addTextureSample(
    coatRoughnessTexture,
    `_coatRoughnessMap = textureSample(CoatRoughnessTexture, CoatRoughnessTextureSampler, ${uv(
      'coatRoughness'
    )});`
  );

  const coatNormalTexture = ppty.getCoatNormalTexture?.();
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

  const transmissionTexture = ppty.getTransmissionTexture?.();
  addTextureSample(
    transmissionTexture,
    `_transmissionMap = textureSample(TransmissionTexture, TransmissionTextureSampler, ${uv(
      'transmission'
    )});`
  );

  const thicknessTexture = ppty.getThicknessTexture?.();
  addTextureSample(
    thicknessTexture,
    `_thicknessMap = textureSample(ThicknessTexture, ThicknessTextureSampler, ${uv(
      'thickness'
    )});`
  );

  const iridescenceTexture = ppty.getIridescenceTexture?.();
  addTextureSample(
    iridescenceTexture,
    `_iridescenceMap = textureSample(IridescenceTexture, IridescenceTextureSampler, ${uv(
      'iridescence'
    )});`
  );

  const iridescenceThicknessTexture = ppty.getIridescenceThicknessTexture?.();
  addTextureSample(
    iridescenceThicknessTexture,
    `_iridescenceThicknessMap = textureSample(IridescenceThicknessTexture, IridescenceThicknessTextureSampler, ${uv(
      'iridescenceThickness'
    )});`
  );

  // Sheen textures
  const sheenColorTexture = ppty.getSheenColorTexture?.();
  addTextureSample(
    sheenColorTexture,
    `_sheenColorMap = textureSample(SheenColorTexture, SheenColorTextureSampler, ${uv(
      'sheenColor'
    )});`
  );
  const sheenRoughnessTexture = ppty.getSheenRoughnessTexture?.();
  addTextureSample(
    sheenRoughnessTexture,
    `_sheenRoughnessMap = textureSample(SheenRoughnessTexture, SheenRoughnessTextureSampler, ${uv(
      'sheenRoughness'
    )});`
  );

  // Diffuse transmission textures
  const diffTransTexture = ppty.getDiffuseTransmissionTexture?.();
  addTextureSample(
    diffTransTexture,
    `_diffuseTransmissionMap = textureSample(DiffuseTransmissionTexture, DiffuseTransmissionTextureSampler, ${uv(
      'diffuseTransmission'
    )});`
  );
  const diffTransColorTexture = ppty.getDiffuseTransmissionColorTexture?.();
  addTextureSample(
    diffTransColorTexture,
    `_diffuseTransmissionColorMap = textureSample(DiffuseTransmissionColorTexture, DiffuseTransmissionColorTextureSampler, ${uv(
      'diffuseTransmissionColor'
    )});`
  );

  // KHR_materials_specular textures
  const specularTexture = ppty.getSpecularTexture?.();
  addTextureSample(
    specularTexture,
    `_specularMap = textureSample(SpecularTexture, SpecularTextureSampler, ${uv(
      'specular'
    )});`
  );
  const specularColorTexture = ppty.getSpecularColorTexture?.();
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
