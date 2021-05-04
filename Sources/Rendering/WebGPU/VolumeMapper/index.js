import macro from 'vtk.js/Sources/macro';
import { vec3, mat3, mat4 } from 'gl-matrix';
// import vtkDataArray from 'vtk.js/Sources/Common/Core/DataArray';
// import { VtkDataTypes } from 'vtk.js/Sources/Common/Core/DataArray/Constants';
import * as vtkMath from 'vtk.js/Sources/Common/Core/Math';
import vtkWebGPUPipeline from 'vtk.js/Sources/Rendering/WebGPU/Pipeline';
import vtkWebGPUSampler from 'vtk.js/Sources/Rendering/WebGPU/Sampler';
import vtkWebGPUShaderCache from 'vtk.js/Sources/Rendering/WebGPU/ShaderCache';
import vtkWebGPUShaderDescription from 'vtk.js/Sources/Rendering/WebGPU/ShaderDescription';
import vtkWebGPUUniformBuffer from 'vtk.js/Sources/Rendering/WebGPU/UniformBuffer';
import vtkWebGPUVertexInput from 'vtk.js/Sources/Rendering/WebGPU/VertexInput';
import vtkViewNode from 'vtk.js/Sources/Rendering/SceneGraph/ViewNode';
// import { Representation } from 'vtk.js/Sources/Rendering/Core/Property/Constants';
// import {
//   Wrap,
//   Filter,
// } from 'vtk.js/Sources/Rendering/OpenGL/Texture/Constants';
import { InterpolationType } from 'vtk.js/Sources/Rendering/Core/VolumeProperty/Constants';
// import { BlendMode } from 'vtk.js/Sources/Rendering/Core/VolumeMapper/Constants';

const vtkWebGPUVolumeVS = `
//VTK::Renderer::Dec

//VTK::Mapper::Dec

//VTK::TCoord::Dec

//VTK::IOStructs::Dec

[[stage(vertex)]]
fn main(
//VTK::IOStructs::Input
)
//VTK::IOStructs::Output
{
  var output : vertexOutput;
  // position is the device coords reduced to the
  // x y area covered by the volume
  output.Position = vec4<f32>(
    mapperUBO.DCXMin + 0.5 * (vertexBC.x + 1.0) * mapperUBO.DCXSize,
    mapperUBO.DCYMin + 0.5 * (vertexBC.y + 1.0) * mapperUBO.DCYSize,
    -1.0,
    1.0);

  var vcpos: vec4<f32> = mapperUBO.PCVCMatrix * output.Position;
  output.vertexVC = vcpos.xyz * (1.0/vcpos.w);

  output.Position.z = 0.0;

  // tcoordVS = vec2<f32>(vertexBC.x * 0.5 + 0.5, 1.0 - vertexBC.y * 0.5 - 0.5);
  return output;
}
`;

const vtkWebGPUVolumeFS = `
//VTK::Renderer::Dec

//VTK::Mapper::Dec

//VTK::TCoord::Dec

//VTK::RenderEncoder::Dec

//VTK::IOStructs::Dec

//=======================================================================
// Compute a new start and end point for a given ray based
// on the provided bounded clipping plane (aka a rectangle)
fn getRayPointIntersectionBounds(
  rayPos: vec3<f32>, rayDir: vec3<f32>,
  planeEqn: vec4<f32>,
  tbounds: vec2<f32>, vPlaneX: vec4<f32>, vPlaneY: vec4<f32>,
  vSize1: f32, vSize2: f32) -> vec2<f32>
{
  var result: f32 = dot(rayDir, planeEqn.xyz);
  if (result == 0.0)
  {
    return tbounds;
  }
  result = -1.0 * (dot(rayPos, planeEqn.xyz) + planeEqn.w) / result;
  var xposVC: vec3<f32> = rayPos + rayDir*result;
  var vxpos: vec3<f32> = xposVC - mapperUBO.vOriginVC;
  var vpos: vec2<f32> = vec2<f32>(
    dot(vxpos, vPlaneX.xyz),
    dot(vxpos, vPlaneY.xyz));

  if (vpos.x < 0.0 || vpos.x > vSize1 ||
      vpos.y < 0.0 || vpos.y > vSize2) {
    return tbounds;
  }

  return vec2<f32>(min(tbounds.x, result), max(tbounds.y, result));
}

//=======================================================================
// given a
// - ray direction (rayDir)
// - starting point (vertexVC)
// - bounding planes of the volume
// - optionally depth buffer values
// - far clipping plane
// compute the start/end distances of the ray we need to cast
fn computeRayDistances(rayDir: vec3<f32>, tdims: vec3<f32>, vertexVC: vec3<f32>) -> vec2<f32>
{
  var dists: vec2<f32> = vec2<f32>(100.0*mapperUBO.camFar, -1.0);

  var vSize: vec3<f32> = mapperUBO.vSpacing*vec3<f32>(tdims.x - 1.0, tdims.y - 1.0, tdims.z - 1.0);

  // all this is in View Coordinates
  dists = getRayPointIntersectionBounds(vertexVC, rayDir,
    mapperUBO.vPlaneEquation0, dists, mapperUBO.vPlaneEquation2, mapperUBO.vPlaneEquation4,
    vSize.y, vSize.z);
  dists = getRayPointIntersectionBounds(vertexVC, rayDir,
    mapperUBO.vPlaneEquation1, dists, mapperUBO.vPlaneEquation2, mapperUBO.vPlaneEquation4,
    vSize.y, vSize.z);
  dists = getRayPointIntersectionBounds(vertexVC, rayDir,
    mapperUBO.vPlaneEquation2, dists, mapperUBO.vPlaneEquation0, mapperUBO.vPlaneEquation4,
    vSize.x, vSize.z);
  dists = getRayPointIntersectionBounds(vertexVC, rayDir,
    mapperUBO.vPlaneEquation3, dists, mapperUBO.vPlaneEquation0, mapperUBO.vPlaneEquation4,
    vSize.x, vSize.z);
  dists = getRayPointIntersectionBounds(vertexVC, rayDir,
    mapperUBO.vPlaneEquation4, dists, mapperUBO.vPlaneEquation0, mapperUBO.vPlaneEquation2,
    vSize.x, vSize.y);
  dists = getRayPointIntersectionBounds(vertexVC, rayDir,
    mapperUBO.vPlaneEquation5, dists, mapperUBO.vPlaneEquation0, mapperUBO.vPlaneEquation2,
    vSize.x, vSize.y);

  //VTK::ClipPlane::Impl

  // do not go behind front clipping plane
  dists.x = max(0.0,dists.x);

  // do not go PAST far clipping plane
  var farDist: f32 = -mapperUBO.camThick/rayDir.z;
  dists.y = min(farDist,dists.y);

  // Do not go past the zbuffer value if set
  // This is used for intermixing opaque geometry
  //VTK::ZBuffer::Impl

  return dists;
}

[[stage(fragment)]]
fn main(
//VTK::IOStructs::Input
)
//VTK::IOStructs::Output
{
  var output : fragmentOutput;

  var rayDirVC: vec3<f32>;

  if (mapperUBO.cameraParallel == 1u)
  {
    // Camera is parallel, so the rayDir is just the direction of the camera.
    rayDirVC = vec3<f32>(0.0, 0.0, -1.0);
  } else {
    // camera is at 0,0,0 so rayDir for perspective is just the vc coord
    rayDirVC = normalize(input.vertexVC);
  }

  var tdims: vec3<f32> = vec3<f32>(mapperUBO.volumeDimensions);

  // compute the start and end points for the ray
  var rayStartEndDistancesVC: vec2<f32> = computeRayDistances(rayDirVC, tdims, input.vertexVC);

  // do we need to composite? aka does the ray have any length
  // If not, bail out early
  if (rayStartEndDistancesVC.y <= rayStartEndDistancesVC.x)
  {
    discard;
  }

  // IS = Index Space
  // vec3 posIS;
  // vec3 endIS;
  // float sampleDistanceIS;
  // computeIndexSpaceValues(posIS, endIS, sampleDistanceIS, rayDirVC, rayStartEndDistancesVC);

  // // Perform the blending operation along the ray
  // applyBlend(posIS, endIS, sampleDistanceIS, tdims);

  // var computedColor: vec4<f32> = vec4<f32>(1.0,0.5,0.3,1.0);
  var computedColor: vec4<f32> = vec4<f32>(rayStartEndDistancesVC.xy, 0.0, (rayStartEndDistancesVC.y - rayStartEndDistancesVC.x)/100.0);

  //VTK::RenderEncoder::Impl

  return output;
}
`;

const { vtkErrorMacro } = macro;

// TODO: Do we want this in some shared utility? Shouldwe just use lodash.isEqual
// function arrayEquals(a, b) {
//   if (a.length !== b.length) {
//     return false;
//   }
//   for (let i = 0; i < a.length; ++i) {
//     if (a[i] !== b[i]) {
//       return false;
//     }
//   }
//   return true;
// }

// ----------------------------------------------------------------------------
// vtkWebGPUVolumeMapper methods
// ----------------------------------------------------------------------------

function vtkWebGPUVolumeMapper(publicAPI, model) {
  // Set our className
  model.classHierarchy.push('vtkWebGPUVolumeMapper');

  publicAPI.buildPass = (prepass) => {
    if (prepass) {
      model.WebGPUVolume = publicAPI.getFirstAncestorOfType('vtkWebGPUVolume');
      model.WebGPURenderer = model.WebGPUVolume.getFirstAncestorOfType(
        'vtkWebGPURenderer'
      );
      model.WebGPURenderWindow = model.WebGPURenderer.getParent();
      model.device = model.WebGPURenderWindow.getDevice();
    }
  };

  // Renders myself
  publicAPI.volumePass = (prepass, renderPass) => {
    if (prepass) {
      // model.jitterTexture.setOpenGLRenderWindow(model.WebGPURenderWindow);

      // // Per Component?
      // model.scalarTexture.setOpenGLRenderWindow(model.WebGPURenderWindow);
      // model.colorTexture.setOpenGLRenderWindow(model.WebGPURenderWindow);
      // model.opacityTexture.setOpenGLRenderWindow(model.WebGPURenderWindow);

      const ren = model.WebGPURenderer.getRenderable();
      model.WebGPUCamera = model.WebGPURenderer.getViewNodeFor(
        ren.getActiveCamera()
      );

      publicAPI.invokeEvent({ type: 'StartEvent' });
      model.renderable.update();
      model.currentInput = model.renderable.getInputData();
      publicAPI.invokeEvent({ type: 'EndEvent' });

      if (!model.currentInput) {
        vtkErrorMacro('No input!');
        return;
      }
      model.currentInput = model.renderable.getInputData();

      model.renderEncoder = model.WebGPURenderer.getRenderEncoder();

      publicAPI.buildPrimitives();

      // update descriptor sets
      publicAPI.updateUBO();
    }
  };

  publicAPI.updateUBO = () => {
    // make sure the data is up to date
    const volume = model.WebGPUVolume.getRenderable();
    const vprop = volume.getProperty();
    const utime = model.UBO.getSendTime();
    const cam = model.WebGPUCamera.getRenderable();
    if (
      cam.getMTime() > utime ||
      publicAPI.getMTime() > utime ||
      vprop.getMTime() > utime ||
      model.renderable.getMTime() > utime
    ) {
      publicAPI.updateCameraUniforms();
      model.UBO.setValue('PropID', model.WebGPUVolume.getPropID());

      const device = model.WebGPURenderWindow.getDevice();
      model.UBO.sendIfNeeded(device, device.getMapperBindGroupLayout());
    }
  };

  publicAPI.buildPrimitives = () => {
    // handle per primitive type
    const primHelper = model._triangles;
    const vertexInput = model._triangles.vertexInput;
    const device = model.device;
    const renderEncoder = model.renderEncoder;

    const buff = device.getBufferManager().getFullScreenQuadBuffer();
    vertexInput.addBuffer(buff, ['vertexBC']);

    model.pipelineHash = 'volr'; // haha

    let pipeline = device.getPipeline(model.pipelineHash);

    // handle textures - disabled until WebGPU handles 3D textures
    // publicAPI.updateTextures();

    // build VBO for this primitive
    // build the pipeline if needed
    if (!pipeline) {
      pipeline = vtkWebGPUPipeline.newInstance();
      pipeline.addBindGroupLayout(
        device.getRendererBindGroupLayout(),
        `rendererUBO`
      );
      pipeline.addBindGroupLayout(
        device.getMapperBindGroupLayout(),
        `mapperUBO`
      );
      // add texture BindGroupLayouts
      for (let t = 0; t < model.views.length; t++) {
        pipeline.addBindGroupLayout(
          device.getTextureBindGroupLayout(),
          `Texture${t}`
        );
      }
      publicAPI.generateShaderDescriptions(
        model.pipelineHash,
        pipeline,
        primHelper.vertexInput
      );
      pipeline.setTopology('triangle-list');
      pipeline.setRenderEncoder(renderEncoder);
      pipeline.setVertexState(
        primHelper.vertexInput.getVertexInputInformation()
      );
      device.createPipeline(model.pipelineHash, pipeline);
    }

    if (pipeline) {
      model.WebGPURenderer.registerPipelineCallback(
        pipeline,
        publicAPI.renderForPipeline
      );
    }
  };

  publicAPI.renderForPipeline = (pipeline) => {
    const renderEncoder = model.WebGPURenderer.getRenderEncoder();
    const primHelper = model._triangles;

    // bind the mapper UBO
    const uboidx = pipeline.getBindGroupLayoutCount(model.UBO.getName());
    renderEncoder.setBindGroup(uboidx, model.UBO.getBindGroup());

    // bind any textures and samplers
    for (let t = 0; t < model.textures.length; t++) {
      const tcount = pipeline.getBindGroupLayoutCount(`Texture${t}`);
      renderEncoder.setBindGroup(tcount, model.textureBindGroups[t]);
    }

    // bind the vertex input
    pipeline.bindVertexInput(renderEncoder, primHelper.vertexInput);
    const vbo = primHelper.vertexInput.getBuffer('vertexBC');
    renderEncoder.draw(vbo.getSizeInBytes() / vbo.getStrideInBytes(), 1, 0, 0);
  };

  publicAPI.generateShaderDescriptions = (hash, pipeline, vertexInput) => {
    // standard shader stuff most paths use
    let code = model.vertexShaderTemplate;
    code = vtkWebGPUShaderCache.substitute(code, '//VTK::Renderer::Dec', [
      model.WebGPURenderer.getUBO().getShaderCode(pipeline),
    ]).result;
    code = vtkWebGPUShaderCache.substitute(code, '//VTK::Mapper::Dec', [
      model.UBO.getShaderCode(pipeline),
    ]).result;
    const vDesc = vtkWebGPUShaderDescription.newInstance({
      type: 'vertex',
      hash,
      code,
    });
    vDesc.addOutput('vec3<f32>', 'vertexVC');
    vDesc.addBuiltinOutput('vec4<f32>', '[[builtin(position)]] Position');

    code = model.fragmentShaderTemplate;
    code = vtkWebGPUShaderCache.substitute(code, '//VTK::Renderer::Dec', [
      model.WebGPURenderer.getUBO().getShaderCode(pipeline),
    ]).result;
    code = vtkWebGPUShaderCache.substitute(code, '//VTK::Mapper::Dec', [
      model.UBO.getShaderCode(pipeline),
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
    // publicAPI.replaceShaderTCoord(hash, pipeline, vertexInput);
    model.renderEncoder.replaceShaderCode(pipeline);

    // finally fill in the input and out blocks
    vDesc.replaceShaderCode(null, vertexInput);
    fDesc.replaceShaderCode(vDesc);
  };

  publicAPI.updateTextures = () => {
    // we keep track of new and used textures so
    // that we can clean up any unused textures so we don't hold onto them
    const usedTextures = [];
    const newTextures = [model.currentInput];

    const iType = model.WebGPUVolume.getRenderable()
      .getProperty()
      .getInterpolationType();
    const interpolate =
      iType === InterpolationType.NEAREST ? 'nearest' : 'linear';

    for (let i = 0; i < newTextures.length; i++) {
      const idata = newTextures[i];
      const treq = {
        source: idata,
        imageData: idata,
        usage: 'vtkImageData',
      };
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

  // publicAPI.replaceShaderValues = (shaders, ren, actor) => {
  //   let FSSource = shaders.Fragment;

  //   // define some values in the shader
  //   const iType = actor.getProperty().getInterpolationType();
  //   if (iType === InterpolationType.LINEAR) {
  //     FSSource = vtkShaderProgram.substitute(
  //       FSSource,
  //       '//VTK::TrilinearOn',
  //       '#define vtkTrilinearOn'
  //     ).result;
  //   }

  //   const vtkImageLabelOutline = actor.getProperty().getUseLabelOutline();
  //   if (vtkImageLabelOutline === true) {
  //     FSSource = vtkShaderProgram.substitute(
  //       FSSource,
  //       '//VTK::ImageLabelOutlineOn',
  //       '#define vtkImageLabelOutlineOn'
  //     ).result;
  //   }

  //   const numComp = model.scalarTexture.getComponents();
  //   FSSource = vtkShaderProgram.substitute(
  //     FSSource,
  //     '//VTK::NumComponents',
  //     `#define vtkNumComponents ${numComp}`
  //   ).result;

  //   const iComps = actor.getProperty().getIndependentComponents();
  //   if (iComps) {
  //     FSSource = vtkShaderProgram.substitute(
  //       FSSource,
  //       '//VTK::IndependentComponentsOn',
  //       '#define vtkIndependentComponentsOn'
  //     ).result;

  //     // Define any proportional components
  //     const proportionalComponents = [];
  //     for (let nc = 0; nc < numComp; nc++) {
  //       if (
  //         actor.getProperty().getOpacityMode(nc) === OpacityMode.PROPORTIONAL
  //       ) {
  //         proportionalComponents.push(`#define vtkComponent${nc}Proportional`);
  //       }
  //     }

  //     if (proportionalComponents.length > 0) {
  //       FSSource = vtkShaderProgram.substitute(
  //         FSSource,
  //         '//VTK::vtkProportionalComponents',
  //         proportionalComponents.join('\n')
  //       ).result;
  //     }
  //   }

  //   // WebGL only supports loops over constants
  //   // and does not support while loops so we
  //   // have to hard code how many steps/samples to take
  //   // We do a break so most systems will gracefully
  //   // early terminate, but it is always possible
  //   // a system will execute every step regardless
  //   const ext = model.currentInput.getExtent();
  //   const spc = model.currentInput.getSpacing();
  //   const vsize = new Float64Array(3);
  //   vec3.set(
  //     vsize,
  //     (ext[1] - ext[0]) * spc[0],
  //     (ext[3] - ext[2]) * spc[1],
  //     (ext[5] - ext[4]) * spc[2]
  //   );

  //   const maxSamples =
  //     vec3.length(vsize) / model.renderable.getSampleDistance();

  //   FSSource = vtkShaderProgram.substitute(
  //     FSSource,
  //     '//VTK::MaximumSamplesValue',
  //     `${Math.ceil(maxSamples)}`
  //   ).result;

  //   // set light complexity
  //   FSSource = vtkShaderProgram.substitute(
  //     FSSource,
  //     '//VTK::LightComplexity',
  //     `#define vtkLightComplexity ${model.lastLightComplexity}`
  //   ).result;

  //   // if using gradient opacity define that
  //   model.gopacity = actor.getProperty().getUseGradientOpacity(0);
  //   for (let nc = 1; iComps && !model.gopacity && nc < numComp; ++nc) {
  //     if (actor.getProperty().getUseGradientOpacity(nc)) {
  //       model.gopacity = true;
  //     }
  //   }
  //   if (model.gopacity) {
  //     FSSource = vtkShaderProgram.substitute(
  //       FSSource,
  //       '//VTK::GradientOpacityOn',
  //       '#define vtkGradientOpacityOn'
  //     ).result;
  //   }

  //   // if we have a ztexture then declare it and use it
  //   if (model.zBufferTexture !== null) {
  //     FSSource = vtkShaderProgram.substitute(FSSource, '//VTK::ZBuffer::Dec', [
  //       'uniform sampler2D zBufferTexture;',
  //       'uniform float vpWidth;',
  //       'uniform float vpHeight;',
  //     ]).result;
  //     FSSource = vtkShaderProgram.substitute(FSSource, '//VTK::ZBuffer::Impl', [
  //       'vec4 depthVec = texture2D(zBufferTexture, vec2(gl_FragCoord.x / vpWidth, gl_FragCoord.y/vpHeight));',
  //       'float zdepth = (depthVec.r*256.0 + depthVec.g)/257.0;',
  //       'zdepth = zdepth * 2.0 - 1.0;',
  //       'zdepth = -2.0 * camFar * camNear / (zdepth*(camFar-camNear)-(camFar+camNear)) - camNear;',
  //       'zdepth = -zdepth/rayDir.z;',
  //       'dists.y = min(zdepth,dists.y);',
  //     ]).result;
  //   }

  //   // Set the BlendMode approach
  //   FSSource = vtkShaderProgram.substitute(
  //     FSSource,
  //     '//VTK::BlendMode',
  //     `${model.renderable.getBlendMode()}`
  //   ).result;

  //   const averageIPScalarRange = model.renderable.getAverageIPScalarRange();

  //   // TODO: Adding the .0 at the end feels hacky
  //   FSSource = vtkShaderProgram.substitute(
  //     FSSource,
  //     '//VTK::AverageIPScalarRangeMin',
  //     `${averageIPScalarRange[0]}.0`
  //   ).result;

  //   FSSource = vtkShaderProgram.substitute(
  //     FSSource,
  //     '//VTK::AverageIPScalarRangeMax',
  //     `${averageIPScalarRange[1]}.0`
  //   ).result;

  //   shaders.Fragment = FSSource;

  //   publicAPI.replaceShaderLight(shaders, ren, actor);
  //   publicAPI.replaceShaderClippingPlane(shaders, ren, actor);
  // };

  // publicAPI.replaceShaderLight = (shaders, ren, actor) => {
  //   let FSSource = shaders.Fragment;

  //   // check for shadow maps
  //   const shadowFactor = '';

  //   switch (model.lastLightComplexity) {
  //     default:
  //     case 0: // no lighting, tcolor is fine as is
  //       break;

  //     case 1: // headlight
  //     case 2: // light kit
  //     case 3: {
  //       // positional not implemented fallback to directional
  //       let lightNum = 0;
  //       ren.getLights().forEach((light) => {
  //         const status = light.getSwitch();
  //         if (status > 0) {
  //           FSSource = vtkShaderProgram.substitute(
  //             FSSource,
  //             '//VTK::Light::Dec',
  //             [
  //               // intensity weighted color
  //               `uniform vec3 lightColor${lightNum};`,
  //               `uniform vec3 lightDirectionVC${lightNum}; // normalized`,
  //               `uniform vec3 lightHalfAngleVC${lightNum}; // normalized`,
  //               '//VTK::Light::Dec',
  //             ],
  //             false
  //           ).result;
  //           FSSource = vtkShaderProgram.substitute(
  //             FSSource,
  //             '//VTK::Light::Impl',
  //             [
  //               //              `  float df = max(0.0, dot(normal.rgb, -lightDirectionVC${lightNum}));`,
  //               `  float df = abs(dot(normal.rgb, -lightDirectionVC${lightNum}));`,
  //               `  diffuse += ((df${shadowFactor}) * lightColor${lightNum});`,
  //               // '  if (df > 0.0)',
  //               // '    {',
  //               //              `    float sf = pow( max(0.0, dot(lightHalfAngleWC${lightNum},normal.rgb)), specularPower);`,
  //               `    float sf = pow( abs(dot(lightHalfAngleVC${lightNum},normal.rgb)), vSpecularPower);`,
  //               `    specular += ((sf${shadowFactor}) * lightColor${lightNum});`,
  //               //              '    }',
  //               '  //VTK::Light::Impl',
  //             ],
  //             false
  //           ).result;
  //           lightNum++;
  //         }
  //       });
  //     }
  //   }

  //   shaders.Fragment = FSSource;
  // };

  // publicAPI.replaceShaderClippingPlane = (shaders, ren, actor) => {
  //   let FSSource = shaders.Fragment;

  //   if (model.renderable.getClippingPlanes().length > 0) {
  //     const clipPlaneSize = model.renderable.getClippingPlanes().length;
  //     FSSource = vtkShaderProgram.substitute(
  //       FSSource,
  //       '//VTK::ClipPlane::Dec',
  //       [
  //         `uniform vec3 vClipPlaneNormals[6];`,
  //         `uniform float vClipPlaneDistances[6];`,
  //         '//VTK::ClipPlane::Dec',
  //       ],
  //       false
  //     ).result;

  //     FSSource = vtkShaderProgram.substitute(
  //       FSSource,
  //       '//VTK::ClipPlane::Impl',
  //       [
  //         `for(int i = 0; i < ${clipPlaneSize}; i++) {`,
  //         '  float rayDirRatio = dot(rayDir, vClipPlaneNormals[i]);',
  //         '  float equationResult = dot(vertexVCVSOutput, vClipPlaneNormals[i]) + vClipPlaneDistances[i];',
  //         '  if (rayDirRatio == 0.0)',
  //         '  {',
  //         '    if (equationResult < 0.0) dists.x = dists.y;',
  //         '    continue;',
  //         '  }',
  //         '  float result = -1.0 * equationResult / rayDirRatio;',
  //         '  if (rayDirRatio < 0.0) dists.y = min(dists.y, result);',
  //         '  else dists.x = max(dists.x, result);',
  //         '}',
  //         '//VTK::ClipPlane::Impl',
  //       ],
  //       false
  //     ).result;
  //   }

  //   shaders.Fragment = FSSource;
  // };

  // publicAPI.setMapperShaderParameters = (cellBO, ren, actor) => {
  //   // Now to update the VAO too, if necessary.
  //   const program = cellBO.getProgram();

  //   if (
  //     cellBO.getCABO().getElementCount() &&
  //     (model.VBOBuildTime.getMTime() >
  //       cellBO.getAttributeUpdateTime().getMTime() ||
  //       cellBO.getShaderSourceTime().getMTime() >
  //         cellBO.getAttributeUpdateTime().getMTime())
  //   ) {
  //     if (program.isAttributeUsed('vertexDC')) {
  //       if (
  //         !cellBO
  //           .getVAO()
  //           .addAttributeArray(
  //             program,
  //             cellBO.getCABO(),
  //             'vertexDC',
  //             cellBO.getCABO().getVertexOffset(),
  //             cellBO.getCABO().getStride(),
  //             model.context.FLOAT,
  //             3,
  //             model.context.FALSE
  //           )
  //       ) {
  //         vtkErrorMacro('Error setting vertexDC in shader VAO.');
  //       }
  //     }
  //     cellBO.getAttributeUpdateTime().modified();
  //   }

  //   program.setUniformi('texture1', model.scalarTexture.getTextureUnit());
  //   program.setUniformf('sampleDistance', model.renderable.getSampleDistance());

  //   // if we have a zbuffer texture then set it
  //   if (model.zBufferTexture !== null) {
  //     program.setUniformi(
  //       'zBufferTexture',
  //       model.zBufferTexture.getTextureUnit()
  //     );
  //     const size = publicAPI.getRenderTargetSize();
  //     program.setUniformf('vpWidth', size[0]);
  //     program.setUniformf('vpHeight', size[1]);
  //   }
  // };

  publicAPI.updateCameraUniforms = () => {
    // [WMVP]C == {world, model, view, projection} coordinates
    // E.g., WCPC == world to projection coordinate transformation
    const keyMats = model.WebGPUCamera.getKeyMatrices(model.WebGPURenderer);
    const actMats = model.WebGPUVolume.getKeyMatrices();

    mat4.multiply(model.modelToView, keyMats.wcvc, actMats.mcwc);

    const cam = model.WebGPUCamera.getRenderable();
    const crange = cam.getClippingRange();
    // program.setUniformf('camNear', crange[0]);
    model.UBO.setValue('camFar', crange[1]);
    model.UBO.setValue('camThick', crange[1] - crange[0]);

    const bounds = model.currentInput.getBounds();

    // compute the viewport bounds of the volume
    // we will only render those fragments.
    const pos = new Float64Array(3);
    const dir = new Float64Array(3);
    let dcxmin = 1.0;
    let dcxmax = -1.0;
    let dcymin = 1.0;
    let dcymax = -1.0;

    for (let i = 0; i < 8; ++i) {
      vec3.set(
        pos,
        bounds[i % 2],
        bounds[2 + (Math.floor(i / 2) % 2)],
        bounds[4 + Math.floor(i / 4)]
      );
      vec3.transformMat4(pos, pos, model.modelToView);
      if (!cam.getParallelProjection()) {
        vec3.normalize(dir, pos);

        // now find the projection of this point onto a
        // nearZ distance plane. Since the camera is at 0,0,0
        // in VC the ray is just t*pos and
        // t is -nearZ/dir.z
        // intersection becomes pos.x/pos.z
        const t = -crange[0] / pos[2];
        vec3.scale(pos, dir, t);
      }
      // now convert to DC
      vec3.transformMat4(pos, pos, keyMats.vcpc);

      dcxmin = Math.min(pos[0], dcxmin);
      dcxmax = Math.max(pos[0], dcxmax);
      dcymin = Math.min(pos[1], dcymin);
      dcymax = Math.max(pos[1], dcymax);
    }

    model.UBO.setValue('DCXMin', dcxmin);
    model.UBO.setValue('DCXSize', dcxmax - dcxmin);
    model.UBO.setValue('DCYMin', dcymin);
    model.UBO.setValue('DCYSize', dcymax - dcymin);
    model.UBO.setValue('cameraParallel', cam.getParallelProjection());

    const dims = model.currentInput.getDimensions();

    const ext = model.currentInput.getExtent();
    const spc = model.currentInput.getSpacing();
    // const vsize = new Float64Array(3);
    // vec3.set(
    //   vsize,
    //   (ext[1] - ext[0] + 1) * spc[0],
    //   (ext[3] - ext[2] + 1) * spc[1],
    //   (ext[5] - ext[4] + 1) * spc[2]
    // );
    model.UBO.setArray('vSpacing', spc);

    vec3.set(pos, ext[0], ext[2], ext[4]);
    model.currentInput.indexToWorldVec3(pos, pos);

    vec3.transformMat4(pos, pos, model.modelToView);
    model.UBO.setArray('vOriginVC', [pos[0], pos[1], pos[2]]);

    // apply the image directions
    const i2wmat4 = model.currentInput.getIndexToWorld();
    mat4.multiply(model.idxToView, model.modelToView, i2wmat4);

    mat3.multiply(
      model.idxNormalMatrix,
      keyMats.normalMatrix,
      actMats.normalMatrix
    );
    mat3.multiply(
      model.idxNormalMatrix,
      model.idxNormalMatrix,
      model.currentInput.getDirection()
    );

    // const vctoijk = new Float64Array(3);

    // vec3.set(vctoijk, 1.0, 1.0, 1.0);
    // vec3.divide(vctoijk, vctoijk, vsize);
    // program.setUniform3f('vVCToIJK', vctoijk[0], vctoijk[1], vctoijk[2]);
    model.UBO.setArray('volumeDimensions', dims);

    // map normals through normal matrix
    // then use a point on the plane to compute the distance
    const normal = new Float64Array(3);
    const pos2 = new Float64Array(3);
    for (let i = 0; i < 6; ++i) {
      switch (i) {
        default:
        case 0:
          vec3.set(normal, 1.0, 0.0, 0.0);
          vec3.set(pos2, ext[1], ext[3], ext[5]);
          break;
        case 1:
          vec3.set(normal, -1.0, 0.0, 0.0);
          vec3.set(pos2, ext[0], ext[2], ext[4]);
          break;
        case 2:
          vec3.set(normal, 0.0, 1.0, 0.0);
          vec3.set(pos2, ext[1], ext[3], ext[5]);
          break;
        case 3:
          vec3.set(normal, 0.0, -1.0, 0.0);
          vec3.set(pos2, ext[0], ext[2], ext[4]);
          break;
        case 4:
          vec3.set(normal, 0.0, 0.0, 1.0);
          vec3.set(pos2, ext[1], ext[3], ext[5]);
          break;
        case 5:
          vec3.set(normal, 0.0, 0.0, -1.0);
          vec3.set(pos2, ext[0], ext[2], ext[4]);
          break;
      }
      vec3.transformMat3(normal, normal, model.idxNormalMatrix);
      vec3.transformMat4(pos2, pos2, model.idxToView);
      const dist = -1.0 * vec3.dot(pos2, normal);

      // we have the plane in view coordinates
      // specify the planes in view coordinates
      model.UBO.setArray(`vPlaneEquation${i}`, [
        normal[0],
        normal[1],
        normal[2],
        dist,
      ]);
      // model.UBO.SetArray(`vPlaneNormal${i}`, normal);
      // model.UBO.setValue(`vPlaneDistance${i}`, dist);

      // if (actor.getProperty().getUseLabelOutline()) {
      //   const image = model.currentInput;
      //   const worldToIndex = image.getWorldToIndex();

      //   program.setUniformMatrix('vWCtoIDX', worldToIndex);

      //   // Get the projection coordinate to world coordinate transformation matrix.
      //   mat4.invert(model.projectionToWorld, keyMats.wcpc);
      //   program.setUniformMatrix('PCWCMatrix', model.projectionToWorld);

      //   const size = publicAPI.getRenderTargetSize();

      //   program.setUniformf('vpWidth', size[0]);
      //   program.setUniformf('vpHeight', size[1]);
      // }
    }

    mat4.invert(model.projectionToView, keyMats.vcpc);
    model.UBO.setArray('PCVCMatrix', model.projectionToView);

    // // handle lighting values
    // switch (model.lastLightComplexity) {
    //   default:
    //   case 0: // no lighting, tcolor is fine as is
    //     break;

    //   case 1: // headlight
    //   case 2: // light kit
    //   case 3: {
    //     // positional not implemented fallback to directional
    //     // mat3.transpose(keyMats.normalMatrix, keyMats.normalMatrix);
    //     let lightNum = 0;
    //     const lightColor = [];
    //     ren.getLights().forEach((light) => {
    //       const status = light.getSwitch();
    //       if (status > 0) {
    //         const dColor = light.getColor();
    //         const intensity = light.getIntensity();
    //         lightColor[0] = dColor[0] * intensity;
    //         lightColor[1] = dColor[1] * intensity;
    //         lightColor[2] = dColor[2] * intensity;
    //         program.setUniform3fArray(`lightColor${lightNum}`, lightColor);
    //         const ldir = light.getDirection();
    //         vec3.set(normal, ldir[0], ldir[1], ldir[2]);
    //         vec3.transformMat3(normal, normal, keyMats.normalMatrix);
    //         program.setUniform3f(
    //           `lightDirectionVC${lightNum}`,
    //           normal[0],
    //           normal[1],
    //           normal[2]
    //         );
    //         // camera DOP is 0,0,-1.0 in VC
    //         const halfAngle = [
    //           -0.5 * normal[0],
    //           -0.5 * normal[1],
    //           -0.5 * (normal[2] - 1.0),
    //         ];
    //         program.setUniform3fArray(`lightHalfAngleVC${lightNum}`, halfAngle);
    //         lightNum++;
    //       }
    //     });
    //     // mat3.transpose(keyMats.normalMatrix, keyMats.normalMatrix);
    //   }
    // }
  };

  // publicAPI.setPropertyShaderParameters = (cellBO, ren, actor) => {
  //   const program = cellBO.getProgram();

  //   program.setUniformi('ctexture', model.colorTexture.getTextureUnit());
  //   program.setUniformi('otexture', model.opacityTexture.getTextureUnit());
  //   program.setUniformi('jtexture', model.jitterTexture.getTextureUnit());

  //   const volInfo = model.scalarTexture.getVolumeInfo();
  //   const vprop = actor.getProperty();

  //   // set the component mix when independent
  //   const numComp = model.scalarTexture.getComponents();
  //   const iComps = actor.getProperty().getIndependentComponents();
  //   if (iComps && numComp >= 2) {
  //     for (let i = 0; i < numComp; i++) {
  //       program.setUniformf(
  //         `mix${i}`,
  //         actor.getProperty().getComponentWeight(i)
  //       );
  //     }
  //   }

  //   // three levels of shift scale combined into one
  //   // for performance in the fragment shader
  //   for (let i = 0; i < numComp; i++) {
  //     const target = iComps ? i : 0;
  //     const sscale = volInfo.scale[i];
  //     const ofun = vprop.getScalarOpacity(target);
  //     const oRange = ofun.getRange();
  //     const oscale = sscale / (oRange[1] - oRange[0]);
  //     const oshift = (volInfo.offset[i] - oRange[0]) / (oRange[1] - oRange[0]);
  //     program.setUniformf(`oshift${i}`, oshift);
  //     program.setUniformf(`oscale${i}`, oscale);

  //     const cfun = vprop.getRGBTransferFunction(target);
  //     const cRange = cfun.getRange();
  //     program.setUniformf(
  //       `cshift${i}`,
  //       (volInfo.offset[i] - cRange[0]) / (cRange[1] - cRange[0])
  //     );
  //     program.setUniformf(`cscale${i}`, sscale / (cRange[1] - cRange[0]));
  //   }

  //   if (model.gopacity) {
  //     if (iComps) {
  //       for (let nc = 0; nc < numComp; ++nc) {
  //         const sscale = volInfo.scale[nc];
  //         const useGO = vprop.getUseGradientOpacity(nc);
  //         if (useGO) {
  //           const gomin = vprop.getGradientOpacityMinimumOpacity(nc);
  //           const gomax = vprop.getGradientOpacityMaximumOpacity(nc);
  //           program.setUniformf(`gomin${nc}`, gomin);
  //           program.setUniformf(`gomax${nc}`, gomax);
  //           const goRange = [
  //             vprop.getGradientOpacityMinimumValue(nc),
  //             vprop.getGradientOpacityMaximumValue(nc),
  //           ];
  //           program.setUniformf(
  //             `goscale${nc}`,
  //             (sscale * (gomax - gomin)) / (goRange[1] - goRange[0])
  //           );
  //           program.setUniformf(
  //             `goshift${nc}`,
  //             (-goRange[0] * (gomax - gomin)) / (goRange[1] - goRange[0]) +
  //               gomin
  //           );
  //         } else {
  //           program.setUniformf(`gomin${nc}`, 1.0);
  //           program.setUniformf(`gomax${nc}`, 1.0);
  //           program.setUniformf(`goscale${nc}`, 0.0);
  //           program.setUniformf(`goshift${nc}`, 1.0);
  //         }
  //       }
  //     } else {
  //       const sscale = volInfo.scale[numComp - 1];
  //       const gomin = vprop.getGradientOpacityMinimumOpacity(0);
  //       const gomax = vprop.getGradientOpacityMaximumOpacity(0);
  //       program.setUniformf('gomin0', gomin);
  //       program.setUniformf('gomax0', gomax);
  //       const goRange = [
  //         vprop.getGradientOpacityMinimumValue(0),
  //         vprop.getGradientOpacityMaximumValue(0),
  //       ];
  //       program.setUniformf(
  //         'goscale0',
  //         (sscale * (gomax - gomin)) / (goRange[1] - goRange[0])
  //       );
  //       program.setUniformf(
  //         'goshift0',
  //         (-goRange[0] * (gomax - gomin)) / (goRange[1] - goRange[0]) + gomin
  //       );
  //     }
  //   }

  //   const vtkImageLabelOutline = actor.getProperty().getUseLabelOutline();
  //   if (vtkImageLabelOutline === true) {
  //     const labelOutlineThickness = actor
  //       .getProperty()
  //       .getLabelOutlineThickness();

  //     program.setUniformi('outlineThickness', labelOutlineThickness);
  //   }

  //   if (model.lastLightComplexity > 0) {
  //     program.setUniformf('vAmbient', vprop.getAmbient());
  //     program.setUniformf('vDiffuse', vprop.getDiffuse());
  //     program.setUniformf('vSpecular', vprop.getSpecular());
  //     program.setUniformf('vSpecularPower', vprop.getSpecularPower());
  //   }
  // };

  // publicAPI.getClippingPlaneShaderParameters = (cellBO, ren, actor) => {
  //   if (model.renderable.getClippingPlanes().length > 0) {
  //     const keyMats = model.WebGPUCamera.getKeyMatrices(ren);

  //     const clipPlaneNormals = [];
  //     const clipPlaneDistances = [];

  //     const clipPlanes = model.renderable.getClippingPlanes();
  //     const clipPlaneSize = clipPlanes.length;
  //     for (let i = 0; i < clipPlaneSize; ++i) {
  //       const clipPlaneNormal = clipPlanes[i].getNormal();
  //       const clipPlanePos = clipPlanes[i].getOrigin();

  //       vec3.transformMat3(
  //         clipPlaneNormal,
  //         clipPlaneNormal,
  //         keyMats.normalMatrix
  //       );

  //       vec3.transformMat4(clipPlanePos, clipPlanePos, keyMats.wcvc);

  //       const clipPlaneDist = -1.0 * vec3.dot(clipPlanePos, clipPlaneNormal);

  //       clipPlaneNormals.push(clipPlaneNormal[0]);
  //       clipPlaneNormals.push(clipPlaneNormal[1]);
  //       clipPlaneNormals.push(clipPlaneNormal[2]);
  //       clipPlaneDistances.push(clipPlaneDist);
  //     }
  //     const program = cellBO.getProgram();
  //     program.setUniform3fv(`vClipPlaneNormals`, clipPlaneNormals);
  //     program.setUniformfv(`vClipPlaneDistances`, clipPlaneDistances);
  //   }
  // };

  // publicAPI.getRenderTargetSize = () => {
  //   if (model.lastXYF > 1.43) {
  //     const sz = model.framebuffer.getSize();
  //     return [model.fvp[0] * sz[0], model.fvp[1] * sz[1]];
  //   }
  //   return model.WebGPURenderWindow.getFramebufferSize();
  // };

  // publicAPI.renderPieceStart = (ren, actor) => {
  //   if (model.renderable.getAutoAdjustSampleDistances()) {
  //     const rwi = ren.getVTKWindow().getInteractor();
  //     const rft = rwi.getLastFrameTime();
  //     // console.log(`last frame time ${Math.floor(1.0 / rft)}`);

  //     // frame time is typically for a couple frames prior
  //     // which makes it messy, so keep long running averages
  //     // of frame times and pixels rendered
  //     model.avgFrameTime = 0.97 * model.avgFrameTime + 0.03 * rft;
  //     model.avgWindowArea =
  //       0.97 * model.avgWindowArea + 0.03 / (model.lastXYF * model.lastXYF);

  //     if (ren.getVTKWindow().getInteractor().isAnimating()) {
  //       // compute target xy factor
  //       let txyf = Math.sqrt(
  //         (model.avgFrameTime * rwi.getDesiredUpdateRate()) /
  //           model.avgWindowArea
  //       );

  //       // limit subsampling to a factor of 10
  //       if (txyf > 10.0) {
  //         txyf = 10.0;
  //       }

  //       model.targetXYF = txyf;
  //     } else {
  //       model.targetXYF = Math.sqrt(
  //         (model.avgFrameTime * rwi.getStillUpdateRate()) / model.avgWindowArea
  //       );
  //     }

  //     // have some inertia to change states around 1.43
  //     if (model.targetXYF < 1.53 && model.targetXYF > 1.33) {
  //       model.targetXYF = model.lastXYF;
  //     }

  //     // and add some inertia to change at all
  //     if (Math.abs(1.0 - model.targetXYF / model.lastXYF) < 0.1) {
  //       model.targetXYF = model.lastXYF;
  //     }
  //     model.lastXYF = model.targetXYF;
  //   } else {
  //     model.lastXYF = model.renderable.getImageSampleDistance();
  //   }

  //   // only use FBO beyond this value
  //   if (model.lastXYF <= 1.43) {
  //     model.lastXYF = 1.0;
  //   }

  //   // console.log(`last target  ${model.lastXYF} ${model.targetXYF}`);
  //   // console.log(`awin aft  ${model.avgWindowArea} ${model.avgFrameTime}`);
  //   const xyf = model.lastXYF;

  //   const size = model.WebGPURenderWindow.getFramebufferSize();
  //   // const newSize = [
  //   //   Math.floor((size[0] / xyf) + 0.5),
  //   //   Math.floor((size[1] / xyf) + 0.5)];

  //   // const diag = vtkBoundingBox.getDiagonalLength(model.currentInput.getBounds());

  //   // // so what is the resulting sample size roughly
  //   // console.log(`sam size ${diag / newSize[0]} ${diag / newSize[1]} ${model.renderable.getImageSampleDistance()}`);

  //   // // if the sample distance is getting far from the image sample dist
  //   // if (2.0 * diag / (newSize[0] + newSize[1]) > 4 * model.renderable.getSampleDistance()) {
  //   //   model.renderable.setSampleDistance(4.0 * model.renderable.getSampleDistance());
  //   // }
  //   // if (2.0 * diag / (newSize[0] + newSize[1]) < 0.25 * model.renderable.getSampleDistance()) {
  //   //   model.renderable.setSampleDistance(0.25 * model.renderable.getSampleDistance());
  //   // }

  //   // create/resize framebuffer if needed
  //   if (xyf > 1.43) {
  //     model.framebuffer.saveCurrentBindingsAndBuffers();

  //     if (model.framebuffer.getGLFramebuffer() === null) {
  //       model.framebuffer.create(
  //         Math.floor(size[0] * 0.7),
  //         Math.floor(size[1] * 0.7)
  //       );
  //       model.framebuffer.populateFramebuffer();
  //     } else {
  //       const fbSize = model.framebuffer.getSize();
  //       if (
  //         fbSize[0] !== Math.floor(size[0] * 0.7) ||
  //         fbSize[1] !== Math.floor(size[1] * 0.7)
  //       ) {
  //         model.framebuffer.create(
  //           Math.floor(size[0] * 0.7),
  //           Math.floor(size[1] * 0.7)
  //         );
  //         model.framebuffer.populateFramebuffer();
  //       }
  //     }
  //     model.framebuffer.bind();
  //     const gl = model.context;
  //     gl.clearColor(0.0, 0.0, 0.0, 0.0);
  //     gl.colorMask(true, true, true, true);
  //     gl.clear(gl.COLOR_BUFFER_BIT);
  //     gl.viewport(0, 0, size[0] / xyf, size[1] / xyf);
  //     model.fvp = [
  //       Math.floor(size[0] / xyf) / Math.floor(size[0] * 0.7),
  //       Math.floor(size[1] / xyf) / Math.floor(size[1] * 0.7),
  //     ];
  //   }
  //   model.context.disable(model.context.DEPTH_TEST);

  //   // make sure the BOs are up to date
  //   publicAPI.updateBufferObjects(ren, actor);

  //   // set interpolation on the texture based on property setting
  //   const iType = actor.getProperty().getInterpolationType();
  //   if (iType === InterpolationType.NEAREST) {
  //     model.scalarTexture.setMinificationFilter(Filter.NEAREST);
  //     model.scalarTexture.setMagnificationFilter(Filter.NEAREST);
  //   } else {
  //     model.scalarTexture.setMinificationFilter(Filter.LINEAR);
  //     model.scalarTexture.setMagnificationFilter(Filter.LINEAR);
  //   }

  //   // Bind the OpenGL, this is shared between the different primitive/cell types.
  //   model.lastBoundBO = null;

  //   // if we have a zbuffer texture then activate it
  //   if (model.zBufferTexture !== null) {
  //     model.zBufferTexture.activate();
  //   }
  // };

  // publicAPI.renderPieceDraw = (ren, actor) => {
  //   const gl = model.context;

  //   // render the texture
  //   model.scalarTexture.activate();
  //   model.opacityTexture.activate();
  //   model.colorTexture.activate();
  //   model.jitterTexture.activate();

  //   publicAPI.updateShaders(model.tris, ren, actor);

  //   // First we do the triangles, update the shader, set uniforms, etc.
  //   // for (let i = 0; i < 11; ++i) {
  //   //   gl.drawArrays(gl.TRIANGLES, 66 * i, 66);
  //   // }
  //   gl.drawArrays(gl.TRIANGLES, 0, model.tris.getCABO().getElementCount());
  //   model.tris.getVAO().release();

  //   model.scalarTexture.deactivate();
  //   model.colorTexture.deactivate();
  //   model.opacityTexture.deactivate();
  //   model.jitterTexture.deactivate();
  // };

  // publicAPI.renderPieceFinish = (ren, actor) => {
  //   // if we have a zbuffer texture then deactivate it
  //   if (model.zBufferTexture !== null) {
  //     model.zBufferTexture.deactivate();
  //   }

  //   if (model.lastXYF > 1.43) {
  //     // now copy the framebuffer with the volume into the
  //     // regular buffer
  //     model.framebuffer.restorePreviousBindingsAndBuffers();

  //     if (model.copyShader === null) {
  //       model.copyShader = model.WebGPURenderWindow.getShaderCache().readyShaderProgramArray(
  //         [
  //           '//VTK::System::Dec',
  //           'attribute vec4 vertexDC;',
  //           'uniform vec2 tfactor;',
  //           'varying vec2 tcoord;',
  //           'void main() { tcoord = vec2(vertexDC.x*0.5 + 0.5, vertexDC.y*0.5 + 0.5) * tfactor; gl_Position = vertexDC; }',
  //         ].join('\n'),
  //         [
  //           '//VTK::System::Dec',
  //           '//VTK::Output::Dec',
  //           'uniform sampler2D texture1;',
  //           'varying vec2 tcoord;',
  //           'void main() { gl_FragData[0] = texture2D(texture1,tcoord); }',
  //         ].join('\n'),
  //         ''
  //       );
  //       const program = model.copyShader;

  //       model.copyVAO = vtkVertexArrayObject.newInstance();
  //       model.copyVAO.setOpenGLRenderWindow(model.WebGPURenderWindow);

  //       model.tris.getCABO().bind();
  //       if (
  //         !model.copyVAO.addAttributeArray(
  //           program,
  //           model.tris.getCABO(),
  //           'vertexDC',
  //           model.tris.getCABO().getVertexOffset(),
  //           model.tris.getCABO().getStride(),
  //           model.context.FLOAT,
  //           3,
  //           model.context.FALSE
  //         )
  //       ) {
  //         vtkErrorMacro('Error setting vertexDC in copy shader VAO.');
  //       }
  //     } else {
  //       model.WebGPURenderWindow.getShaderCache().readyShaderProgram(
  //         model.copyShader
  //       );
  //     }

  //     const size = model.WebGPURenderWindow.getFramebufferSize();
  //     model.context.viewport(0, 0, size[0], size[1]);

  //     // activate texture
  //     const tex = model.framebuffer.getColorTexture();
  //     tex.activate();
  //     model.copyShader.setUniformi('texture', tex.getTextureUnit());

  //     model.copyShader.setUniform2f('tfactor', model.fvp[0], model.fvp[1]);

  //     const gl = model.context;
  //     gl.blendFuncSeparate(
  //       gl.ONE,
  //       gl.ONE_MINUS_SRC_ALPHA,
  //       gl.ONE,
  //       gl.ONE_MINUS_SRC_ALPHA
  //     );

  //     // render quad
  //     model.context.drawArrays(
  //       model.context.TRIANGLES,
  //       0,
  //       model.tris.getCABO().getElementCount()
  //     );
  //     tex.deactivate();

  //     gl.blendFuncSeparate(
  //       gl.SRC_ALPHA,
  //       gl.ONE_MINUS_SRC_ALPHA,
  //       gl.ONE,
  //       gl.ONE_MINUS_SRC_ALPHA
  //     );
  //   }
  // };

  publicAPI.computeBounds = (ren, actor) => {
    if (!publicAPI.getInput()) {
      vtkMath.uninitializeBounds(model.Bounds);
      return;
    }
    model.bounds = publicAPI.getInput().getBounds();
  };

  // publicAPI.getNeedToRebuildBufferObjects = (ren, actor) => {
  //   // first do a coarse check
  //   if (
  //     model.VBOBuildTime.getMTime() < publicAPI.getMTime() ||
  //     model.VBOBuildTime.getMTime() < actor.getMTime() ||
  //     model.VBOBuildTime.getMTime() < model.renderable.getMTime() ||
  //     model.VBOBuildTime.getMTime() < actor.getProperty().getMTime() ||
  //     model.VBOBuildTime.getMTime() < model.currentInput.getMTime()
  //   ) {
  //     return true;
  //   }
  //   return false;
  // };

  // publicAPI.buildBufferObjects = (ren, actor) => {
  //   const image = model.currentInput;
  //   if (!image) {
  //     return;
  //   }

  //   const scalars = image.getPointData() && image.getPointData().getScalars();
  //   if (!scalars) {
  //     return;
  //   }

  //   const vprop = actor.getProperty();

  //   if (!model.jitterTexture.getHandle()) {
  //     const oTable = new Uint8Array(32 * 32);
  //     for (let i = 0; i < 32 * 32; ++i) {
  //       oTable[i] = 255.0 * Math.random();
  //     }
  //     model.jitterTexture.setMinificationFilter(Filter.LINEAR);
  //     model.jitterTexture.setMagnificationFilter(Filter.LINEAR);
  //     model.jitterTexture.create2DFromRaw(
  //       32,
  //       32,
  //       1,
  //       VtkDataTypes.UNSIGNED_CHAR,
  //       oTable
  //     );
  //   }

  //   const numComp = scalars.getNumberOfComponents();
  //   const iComps = vprop.getIndependentComponents();
  //   const numIComps = iComps ? numComp : 1;

  //   // rebuild opacity tfun?
  //   let toString = `${vprop.getMTime()}`;
  //   if (model.opacityTextureString !== toString) {
  //     const oWidth = 1024;
  //     const oSize = oWidth * 2 * numIComps;
  //     const ofTable = new Float32Array(oSize);
  //     const tmpTable = new Float32Array(oWidth);

  //     for (let c = 0; c < numIComps; ++c) {
  //       const ofun = vprop.getScalarOpacity(c);
  //       const opacityFactor =
  //         model.renderable.getSampleDistance() /
  //         vprop.getScalarOpacityUnitDistance(c);

  //       const oRange = ofun.getRange();
  //       ofun.getTable(oRange[0], oRange[1], oWidth, tmpTable, 1);
  //       // adjust for sample distance etc
  //       for (let i = 0; i < oWidth; ++i) {
  //         ofTable[c * oWidth * 2 + i] =
  //           1.0 - (1.0 - tmpTable[i]) ** opacityFactor;
  //         ofTable[c * oWidth * 2 + i + oWidth] = ofTable[c * oWidth * 2 + i];
  //       }
  //     }

  //     model.opacityTexture.releaseGraphicsResources(model.WebGPURenderWindow);
  //     model.opacityTexture.setMinificationFilter(Filter.LINEAR);
  //     model.opacityTexture.setMagnificationFilter(Filter.LINEAR);

  //     // use float texture where possible because we really need the resolution
  //     // for this table. Errors in low values of opacity accumulate to
  //     // visible artifacts. High values of opacity quickly terminate without
  //     // artifacts.
  //     if (
  //       model.WebGPURenderWindow.getWebgl2() ||
  //       (model.context.getExtension('OES_texture_float') &&
  //         model.context.getExtension('OES_texture_float_linear'))
  //     ) {
  //       model.opacityTexture.create2DFromRaw(
  //         oWidth,
  //         2 * numIComps,
  //         1,
  //         VtkDataTypes.FLOAT,
  //         ofTable
  //       );
  //     } else {
  //       const oTable = new Uint8Array(oSize);
  //       for (let i = 0; i < oSize; ++i) {
  //         oTable[i] = 255.0 * ofTable[i];
  //       }
  //       model.opacityTexture.create2DFromRaw(
  //         oWidth,
  //         2 * numIComps,
  //         1,
  //         VtkDataTypes.UNSIGNED_CHAR,
  //         oTable
  //       );
  //     }
  //     model.opacityTextureString = toString;
  //   }

  //   // rebuild color tfun?
  //   toString = `${vprop.getMTime()}`;
  //   if (model.colorTextureString !== toString) {
  //     const cWidth = 1024;
  //     const cSize = cWidth * 2 * numIComps * 3;
  //     const cTable = new Uint8Array(cSize);
  //     const tmpTable = new Float32Array(cWidth * 3);

  //     for (let c = 0; c < numIComps; ++c) {
  //       const cfun = vprop.getRGBTransferFunction(c);
  //       const cRange = cfun.getRange();
  //       cfun.getTable(cRange[0], cRange[1], cWidth, tmpTable, 1);
  //       for (let i = 0; i < cWidth * 3; ++i) {
  //         cTable[c * cWidth * 6 + i] = 255.0 * tmpTable[i];
  //         cTable[c * cWidth * 6 + i + cWidth * 3] = 255.0 * tmpTable[i];
  //       }
  //     }

  //     model.colorTexture.releaseGraphicsResources(model.WebGPURenderWindow);
  //     model.colorTexture.setMinificationFilter(Filter.LINEAR);
  //     model.colorTexture.setMagnificationFilter(Filter.LINEAR);

  //     model.colorTexture.create2DFromRaw(
  //       cWidth,
  //       2 * numIComps,
  //       3,
  //       VtkDataTypes.UNSIGNED_CHAR,
  //       cTable
  //     );
  //     model.colorTextureString = toString;
  //   }

  //   // rebuild the scalarTexture if the data has changed
  //   toString = `${image.getMTime()}`;
  //   if (model.scalarTextureString !== toString) {
  //     // Build the textures
  //     const dims = image.getDimensions();
  //     model.scalarTexture.releaseGraphicsResources(model.WebGPURenderWindow);
  //     model.scalarTexture.resetFormatAndType();
  //     model.scalarTexture.create3DFilterableFromRaw(
  //       dims[0],
  //       dims[1],
  //       dims[2],
  //       numComp,
  //       scalars.getDataType(),
  //       scalars.getData()
  //     );
  //     // console.log(model.scalarTexture.get());
  //     model.scalarTextureString = toString;
  //   }

  //   if (!model.tris.getCABO().getElementCount()) {
  //     // build the CABO
  //     const ptsArray = new Float32Array(12);
  //     for (let i = 0; i < 4; i++) {
  //       ptsArray[i * 3] = (i % 2) * 2 - 1.0;
  //       ptsArray[i * 3 + 1] = i > 1 ? 1.0 : -1.0;
  //       ptsArray[i * 3 + 2] = -1.0;
  //     }

  //     const cellArray = new Uint16Array(8);
  //     cellArray[0] = 3;
  //     cellArray[1] = 0;
  //     cellArray[2] = 1;
  //     cellArray[3] = 3;
  //     cellArray[4] = 3;
  //     cellArray[5] = 0;
  //     cellArray[6] = 3;
  //     cellArray[7] = 2;

  //     // const dim = 12.0;
  //     // const ptsArray = new Float32Array(3 * dim * dim);
  //     // for (let i = 0; i < dim; i++) {
  //     //   for (let j = 0; j < dim; j++) {
  //     //     const offset = ((i * dim) + j) * 3;
  //     //     ptsArray[offset] = (2.0 * (i / (dim - 1.0))) - 1.0;
  //     //     ptsArray[offset + 1] = (2.0 * (j / (dim - 1.0))) - 1.0;
  //     //     ptsArray[offset + 2] = -1.0;
  //     //   }
  //     // }

  //     // const cellArray = new Uint16Array(8 * (dim - 1) * (dim - 1));
  //     // for (let i = 0; i < dim - 1; i++) {
  //     //   for (let j = 0; j < dim - 1; j++) {
  //     //     const offset = 8 * ((i * (dim - 1)) + j);
  //     //     cellArray[offset] = 3;
  //     //     cellArray[offset + 1] = (i * dim) + j;
  //     //     cellArray[offset + 2] = (i * dim) + 1 + j;
  //     //     cellArray[offset + 3] = ((i + 1) * dim) + 1 + j;
  //     //     cellArray[offset + 4] = 3;
  //     //     cellArray[offset + 5] = (i * dim) + j;
  //     //     cellArray[offset + 6] = ((i + 1) * dim) + 1 + j;
  //     //     cellArray[offset + 7] = ((i + 1) * dim) + j;
  //     //   }
  //     // }

  //     const points = vtkDataArray.newInstance({
  //       numberOfComponents: 3,
  //       values: ptsArray,
  //     });
  //     points.setName('points');
  //     const cells = vtkDataArray.newInstance({
  //       numberOfComponents: 1,
  //       values: cellArray,
  //     });
  //     model.tris.getCABO().createVBO(cells, 'polys', Representation.SURFACE, {
  //       points,
  //       cellOffset: 0,
  //     });
  //   }

  //   model.VBOBuildTime.modified();
  // };
}

// ----------------------------------------------------------------------------
// Object factory
// ----------------------------------------------------------------------------

const DEFAULT_VALUES = {
  // context: null,
  // VBOBuildTime: null,
  // scalarTexture: null,
  // scalarTextureString: null,
  // opacityTexture: null,
  // opacityTextureString: null,
  // colorTexture: null,
  // colorTextureString: null,
  // jitterTexture: null,
  // tris: null,
  // framebuffer: null,
  // copyShader: null,
  // copyVAO: null,
  // lastXYF: 1.0,
  // targetXYF: 1.0,
  // zBufferTexture: null,
  // lastZBufferTexture: null,
  // lastLightComplexity: 0,
  // fullViewportTime: 1.0,
  // idxToView: null,
  // idxNormalMatrix: null,
  // modelToView: null,
  // projectionToView: null,
  // avgWindowArea: 0.0,
  // avgFrameTime: 0.0,
};

// ----------------------------------------------------------------------------

export function extend(publicAPI, model, initialValues = {}) {
  Object.assign(model, DEFAULT_VALUES, initialValues);

  // Inheritance
  vtkViewNode.extend(publicAPI, model, initialValues);

  model.textures = [];
  model.samplers = [];
  model.views = [];
  model.viewHandles = [];
  model.textureBindGroups = [];
  model._triangles = {
    primitiveType: 2,
    vertexInput: vtkWebGPUVertexInput.newInstance(),
  };

  model.fragmentShaderTemplate = vtkWebGPUVolumeFS;
  model.vertexShaderTemplate = vtkWebGPUVolumeVS;

  model.UBO = vtkWebGPUUniformBuffer.newInstance();
  model.UBO.setName('mapperUBO');
  model.UBO.addEntry('camFar', 'f32');
  model.UBO.addEntry('camThick', 'f32');
  model.UBO.addEntry('DCXMin', 'f32');
  model.UBO.addEntry('DCXSize', 'f32');
  model.UBO.addEntry('DCYMin', 'f32');
  model.UBO.addEntry('DCYSize', 'f32');
  model.UBO.addEntry('cameraParallel', 'u32');
  model.UBO.addEntry('PCVCMatrix', 'mat4x4<f32>');
  model.UBO.addEntry('volumeDimensions', 'vec3<u32>');
  model.UBO.addEntry('vOriginVC', 'vec3<f32>');
  model.UBO.addEntry('vSpacing', 'vec3<f32>');
  model.UBO.addEntry('vPlaneEquation0', 'vec4<f32>');
  model.UBO.addEntry('vPlaneEquation1', 'vec4<f32>');
  model.UBO.addEntry('vPlaneEquation2', 'vec4<f32>');
  model.UBO.addEntry('vPlaneEquation3', 'vec4<f32>');
  model.UBO.addEntry('vPlaneEquation4', 'vec4<f32>');
  model.UBO.addEntry('vPlaneEquation5', 'vec4<f32>');

  // model.UBO.addEntry('AmbientColor', 'vec4<f32>');
  // model.UBO.addEntry('DiffuseColor', 'vec4<f32>');
  // model.UBO.addEntry('AmbientIntensity', 'f32');
  // model.UBO.addEntry('DiffuseIntensity', 'f32');
  // model.UBO.addEntry('SpecularColor', 'vec4<f32>');
  // model.UBO.addEntry('SpecularIntensity', 'f32');
  // model.UBO.addEntry('Opacity', 'f32');
  // model.UBO.addEntry('SpecularPower', 'f32');
  model.UBO.addEntry('PropID', 'u32');

  // Build VTK API
  macro.setGet(publicAPI, model, [
    'device',
    'UBO',
    'fragmentShaderTemplate',
    'vertexShaderTemplate',
  ]);

  // model.VBOBuildTime = {};
  // macro.obj(model.VBOBuildTime, { mtime: 0 });

  // model.tris = vtkHelper.newInstance();
  // model.scalarTexture = vtkWebGPUTexture.newInstance();
  // model.opacityTexture = vtkWebGPUTexture.newInstance();
  // model.colorTexture = vtkWebGPUTexture.newInstance();
  // model.jitterTexture = vtkWebGPUTexture.newInstance();
  // model.jitterTexture.setWrapS(Wrap.REPEAT);
  // model.jitterTexture.setWrapT(Wrap.REPEAT);
  // model.framebuffer = vtkWebGPUFramebuffer.newInstance();

  model.idxToView = mat4.identity(new Float64Array(16));
  model.idxNormalMatrix = mat3.identity(new Float64Array(9));
  model.modelToView = mat4.identity(new Float64Array(16));
  model.projectionToView = mat4.identity(new Float64Array(16));
  // model.projectionToWorld = mat4.identity(new Float64Array(16));

  // Object methods
  vtkWebGPUVolumeMapper(publicAPI, model);
}

// ----------------------------------------------------------------------------

export const newInstance = macro.newInstance(extend, 'vtkWebGPUVolumeMapper');

// ----------------------------------------------------------------------------

export default { newInstance, extend };
