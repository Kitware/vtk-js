import vtkTexture from 'vtk.js/Sources/Rendering/Core/Texture';
import vtkWebGPUTextureView from 'vtk.js/Sources/Rendering/WebGPU/TextureView';

// eslint-disable-next-line import/prefer-default-export
export function updateTextures(publicAPI, model) {
  // Track textures in-use and new
  const usedTextures = [];
  const newTextures = [];

  // Add scalar color texture if available
  const idata = model.renderable.getColorTextureMap?.();
  if (idata && !model.colorTexture) {
    model.colorTexture = vtkTexture.newInstance({ label: 'polyDataColor' });
  }
  if (idata) {
    model.colorTexture.setInputData(idata);
    // Scalar lookup table textures should use nearest sampling with clamped edges.
    model.colorTexture.setInterpolate(false);
    model.colorTexture.setEdgeClamp(true);
    newTextures.push(['ColorTexture', model.colorTexture]);
  }

  const actor = model.WebGPUActor.getRenderable();
  const renderer = model.WebGPURenderer.getRenderable();
  const textures = [
    ['DiffuseTexture', actor.getProperty().getDiffuseTexture?.()],
    ['DiffuseTexture', actor.getTextures()[0]],
    ['ColorTexture', model.colorTexture],
    ['ORMTexture', actor.getProperty().getORMTexture?.()],
    ['RMTexture', actor.getProperty().getRMTexture?.()],
    ['RoughnessTexture', actor.getProperty().getRoughnessTexture?.()],
    ['MetallicTexture', actor.getProperty().getMetallicTexture?.()],
    ['NormalTexture', actor.getProperty().getNormalTexture?.()],
    [
      'AmbientOcclusionTexture',
      actor.getProperty().getAmbientOcclusionTexture?.(),
    ],
    ['EmissionTexture', actor.getProperty().getEmissionTexture?.()],
    ['AnisotropyTexture', actor.getProperty().getAnisotropyTexture?.()],
    ['CoatTexture', actor.getProperty().getCoatTexture?.()],
    ['CoatRoughnessTexture', actor.getProperty().getCoatRoughnessTexture?.()],
    ['CoatNormalTexture', actor.getProperty().getCoatNormalTexture?.()],
    ['DisplacementTexture', actor.getProperty().getDisplacementTexture?.()],
    ['TransmissionTexture', actor.getProperty().getTransmissionTexture?.()],
    ['ThicknessTexture', actor.getProperty().getThicknessTexture?.()],
    ['IridescenceTexture', actor.getProperty().getIridescenceTexture?.()],
    [
      'IridescenceThicknessTexture',
      actor.getProperty().getIridescenceThicknessTexture?.(),
    ],
    ['SheenColorTexture', actor.getProperty().getSheenColorTexture?.()],
    ['SheenRoughnessTexture', actor.getProperty().getSheenRoughnessTexture?.()],
    [
      'DiffuseTransmissionTexture',
      actor.getProperty().getDiffuseTransmissionTexture?.(),
    ],
    [
      'DiffuseTransmissionColorTexture',
      actor.getProperty().getDiffuseTransmissionColorTexture?.(),
    ],
    ['SpecularTexture', actor.getProperty().getSpecularTexture?.()],
    ['SpecularColorTexture', actor.getProperty().getSpecularColorTexture?.()],
    ['EnvironmentTexture', renderer.getEnvironmentTexture?.()],
  ];
  textures.forEach(([name, tex]) => {
    if (!tex) return;
    if (
      tex.getInputData() ||
      tex.getJsImageData() ||
      tex.getCanvas() ||
      tex.getImageBitmap()
    ) {
      newTextures.push([name, tex]);
    }
    if (tex.getImage() && tex.getImageLoaded()) {
      newTextures.push([name, tex]);
    }
  });

  // Add textures to manager only if not present
  newTextures.forEach(([textureName, srcTexture]) => {
    const newTex = model.device
      .getTextureManager()
      .getTextureForVTKTexture(srcTexture, textureName);

    if (!newTex.getReady()) return;
    let found = false;
    for (let t = 0; t < model.textures.length; ++t) {
      if (
        model.textures[t] === newTex &&
        model.textureViews[t]?.getLabel?.() === textureName
      ) {
        found = true;
        usedTextures[t] = true;
        break;
      }
    }
    if (!found) {
      usedTextures[model.textures.length] = true;
      const tview = newTex.createView(textureName);
      model.textures.push(newTex);
      model.textureViews.push(tview);

      // Sampler setup
      const interpolate = srcTexture.getInterpolate() ? 'linear' : 'nearest';
      const hasMipmaps = srcTexture.getMipLevel() > 0;

      // Per-axis wrap modes (wrapS/wrapT) take priority over legacy flags
      const wrapS = srcTexture.getWrapS?.();
      const wrapT = srcTexture.getWrapT?.();
      let addressModeU;
      let addressModeV;
      if (wrapS && wrapT) {
        addressModeU = wrapS;
        addressModeV = wrapT;
      } else {
        // Legacy fallback from repeat/edgeClamp booleans
        let addressMode = null;
        if (srcTexture.getEdgeClamp() && srcTexture.getRepeat())
          addressMode = 'mirror-repeat';
        else if (srcTexture.getEdgeClamp()) addressMode = 'clamp-to-edge';
        else if (srcTexture.getRepeat()) addressMode = 'repeat';
        addressModeU = addressMode;
        addressModeV = addressMode;
      }

      // Handle environment texture separately
      let options = {
        addressModeU,
        addressModeV,
        addressModeW: addressModeU,
        minFilter: interpolate,
        magFilter: interpolate,
      };

      // Enable mipmap filtering when mipmaps are available
      if (hasMipmaps) {
        options.mipmapFilter = 'linear';
      }

      if (textureName === 'EnvironmentTexture') {
        options = {
          addressModeU: 'repeat',
          addressModeV: 'clamp-to-edge',
          addressModeW: 'repeat',
          minFilter: interpolate,
          magFilter: interpolate,
          mipmapFilter: 'linear',
        };
      }

      tview.addSampler(model.device, options);
    }
  });

  // remove unused textures
  for (let i = model.textures.length - 1; i >= 0; i--) {
    if (!usedTextures[i]) {
      model.textures.splice(i, 1);
      model.textureViews.splice(i, 1);
    }
  }

  // Bind opaque pass color buffer for transmission (screen-space background sampling)
  const transmissionFactor = actor.getProperty().getTransmissionFactor?.() ?? 0;
  const opaqueView =
    model.WebGPURenderer?.getOpaqueColorTextureView?.() ?? null;
  // Remove any previously bound opaque texture
  for (let i = model.textureViews.length - 1; i >= 0; i--) {
    if (
      model.textureViews[i]?.getLabel?.() === 'opaquePassColorTexture' ||
      model.textureViews[i]?.getLabel?.() === 'TransmissionBgTexture'
    ) {
      model.textures.splice(i, 1);
      model.textureViews.splice(i, 1);
    }
  }
  if (transmissionFactor > 0 && opaqueView) {
    // Create a private texture view copy so we don't pollute the shared view
    // (adding a sampler to the shared view would break the ForwardPass blit FSQ)
    const opaqueTex = opaqueView.getTexture();
    if (!model._transmissionBgView) {
      model._transmissionBgView = vtkWebGPUTextureView.newInstance({
        label: 'TransmissionBgTexture',
      });
      model._transmissionBgView.create(opaqueTex, { dimension: '2d' });
      model._transmissionBgView.addSampler(model.device, {
        minFilter: 'linear',
        magFilter: 'linear',
        mipmapFilter: 'linear',
      });
    } else if (opaqueTex !== model._transmissionBgView.getTexture()) {
      // Texture changed (e.g., resize) — re-create
      model._transmissionBgView.create(opaqueTex, { dimension: '2d' });
    }
    model.textures.push(opaqueTex);
    model.textureViews.push(model._transmissionBgView);
  } else if (transmissionFactor > 0) {
    console.warn(
      '[Transmission] transmissionFactor > 0 but no opaqueView available!'
    );
  }
}
