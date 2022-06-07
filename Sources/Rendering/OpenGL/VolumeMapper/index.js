import * as macro from 'vtk.js/Sources/macros';
import { vec3, mat3, mat4 } from 'gl-matrix';
// import vtkBoundingBox       from 'vtk.js/Sources/Common/DataModel/BoundingBox';
import vtkDataArray from 'vtk.js/Sources/Common/Core/DataArray';
import { VtkDataTypes } from 'vtk.js/Sources/Common/Core/DataArray/Constants';
import vtkHelper from 'vtk.js/Sources/Rendering/OpenGL/Helper';
import * as vtkMath from 'vtk.js/Sources/Common/Core/Math';
import vtkOpenGLFramebuffer from 'vtk.js/Sources/Rendering/OpenGL/Framebuffer';
import vtkOpenGLTexture from 'vtk.js/Sources/Rendering/OpenGL/Texture';
import vtkShaderProgram from 'vtk.js/Sources/Rendering/OpenGL/ShaderProgram';
import vtkVertexArrayObject from 'vtk.js/Sources/Rendering/OpenGL/VertexArrayObject';
import vtkViewNode from 'vtk.js/Sources/Rendering/SceneGraph/ViewNode';
import { Representation } from 'vtk.js/Sources/Rendering/Core/Property/Constants';
import {
  Wrap,
  Filter,
} from 'vtk.js/Sources/Rendering/OpenGL/Texture/Constants';
import {
  InterpolationType,
  OpacityMode,
} from 'vtk.js/Sources/Rendering/Core/VolumeProperty/Constants';
import { BlendMode } from 'vtk.js/Sources/Rendering/Core/VolumeMapper/Constants';

import vtkVolumeVS from 'vtk.js/Sources/Rendering/OpenGL/glsl/vtkVolumeVS.glsl';
import vtkVolumeFS from 'vtk.js/Sources/Rendering/OpenGL/glsl/vtkVolumeFS.glsl';

import { registerOverride } from 'vtk.js/Sources/Rendering/OpenGL/ViewNodeFactory';

const { vtkWarningMacro, vtkErrorMacro } = macro;

// TODO: Do we want this in some shared utility? Shouldwe just use lodash.isEqual
function arrayEquals(a, b) {
  if (a.length !== b.length) {
    return false;
  }
  for (let i = 0; i < a.length; ++i) {
    if (a[i] !== b[i]) {
      return false;
    }
  }
  return true;
}

// ----------------------------------------------------------------------------
// vtkOpenGLVolumeMapper methods
// ----------------------------------------------------------------------------

function vtkOpenGLVolumeMapper(publicAPI, model) {
  // Set our className
  model.classHierarchy.push('vtkOpenGLVolumeMapper');

  publicAPI.buildPass = () => {
    model.zBufferTexture = null;
  };

  // ohh someone is doing a zbuffer pass, use that for
  // intermixed volume rendering
  publicAPI.opaqueZBufferPass = (prepass, renderPass) => {
    if (prepass) {
      const zbt = renderPass.getZBufferTexture();
      if (zbt !== model.zBufferTexture) {
        model.zBufferTexture = zbt;
      }
    }
  };

  // Renders myself
  publicAPI.volumePass = (prepass, renderPass) => {
    if (prepass) {
      model._openGLRenderWindow = publicAPI.getFirstAncestorOfType(
        'vtkOpenGLRenderWindow'
      );
      model.context = model._openGLRenderWindow.getContext();
      model.tris.setOpenGLRenderWindow(model._openGLRenderWindow);
      model.jitterTexture.setOpenGLRenderWindow(model._openGLRenderWindow);
      model.framebuffer.setOpenGLRenderWindow(model._openGLRenderWindow);

      // Per Component?
      model.scalarTexture.setOpenGLRenderWindow(model._openGLRenderWindow);
      model.colorTexture.setOpenGLRenderWindow(model._openGLRenderWindow);
      model.opacityTexture.setOpenGLRenderWindow(model._openGLRenderWindow);

      model.openGLVolume = publicAPI.getFirstAncestorOfType('vtkOpenGLVolume');
      const actor = model.openGLVolume.getRenderable();
      model.openGLRenderer =
        publicAPI.getFirstAncestorOfType('vtkOpenGLRenderer');
      const ren = model.openGLRenderer.getRenderable();
      model.openGLCamera = model.openGLRenderer.getViewNodeFor(
        ren.getActiveCamera()
      );
      publicAPI.renderPiece(ren, actor);
    }
  };

  publicAPI.buildShaders = (shaders, ren, actor) => {
    publicAPI.getShaderTemplate(shaders, ren, actor);
    publicAPI.replaceShaderValues(shaders, ren, actor);
  };

  publicAPI.getShaderTemplate = (shaders, ren, actor) => {
    shaders.Vertex = vtkVolumeVS;
    shaders.Fragment = vtkVolumeFS;
    shaders.Geometry = '';
  };

  publicAPI.replaceShaderValues = (shaders, ren, actor) => {
    let FSSource = shaders.Fragment;

    // define some values in the shader
    const iType = actor.getProperty().getInterpolationType();
    if (iType === InterpolationType.LINEAR) {
      FSSource = vtkShaderProgram.substitute(
        FSSource,
        '//VTK::TrilinearOn',
        '#define vtkTrilinearOn'
      ).result;
    }

    const vtkImageLabelOutline = actor.getProperty().getUseLabelOutline();
    if (vtkImageLabelOutline === true) {
      FSSource = vtkShaderProgram.substitute(
        FSSource,
        '//VTK::ImageLabelOutlineOn',
        '#define vtkImageLabelOutlineOn'
      ).result;
    }

    const numComp = model.scalarTexture.getComponents();
    FSSource = vtkShaderProgram.substitute(
      FSSource,
      '//VTK::NumComponents',
      `#define vtkNumComponents ${numComp}`
    ).result;

    const iComps = actor.getProperty().getIndependentComponents();
    if (iComps) {
      FSSource = vtkShaderProgram.substitute(
        FSSource,
        '//VTK::IndependentComponentsOn',
        '#define vtkIndependentComponentsOn'
      ).result;

      // Define any proportional components
      const proportionalComponents = [];
      for (let nc = 0; nc < numComp; nc++) {
        if (
          actor.getProperty().getOpacityMode(nc) === OpacityMode.PROPORTIONAL
        ) {
          proportionalComponents.push(`#define vtkComponent${nc}Proportional`);
        }
      }

      if (proportionalComponents.length > 0) {
        FSSource = vtkShaderProgram.substitute(
          FSSource,
          '//VTK::vtkProportionalComponents',
          proportionalComponents.join('\n')
        ).result;
      }
    }

    // WebGL only supports loops over constants
    // and does not support while loops so we
    // have to hard code how many steps/samples to take
    // We do a break so most systems will gracefully
    // early terminate, but it is always possible
    // a system will execute every step regardless
    const ext = model.currentInput.getSpatialExtent();
    const spc = model.currentInput.getSpacing();
    const vsize = new Float64Array(3);
    vec3.set(
      vsize,
      (ext[1] - ext[0]) * spc[0],
      (ext[3] - ext[2]) * spc[1],
      (ext[5] - ext[4]) * spc[2]
    );

    const maxSamples =
      vec3.length(vsize) / model.renderable.getSampleDistance();

    FSSource = vtkShaderProgram.substitute(
      FSSource,
      '//VTK::MaximumSamplesValue',
      `${Math.ceil(maxSamples)}`
    ).result;

    // set light complexity
    FSSource = vtkShaderProgram.substitute(
      FSSource,
      '//VTK::LightComplexity',
      `#define vtkLightComplexity ${model.lastLightComplexity}`
    ).result;

    // if using gradient opacity define that
    model.gopacity = actor.getProperty().getUseGradientOpacity(0);
    for (let nc = 1; iComps && !model.gopacity && nc < numComp; ++nc) {
      if (actor.getProperty().getUseGradientOpacity(nc)) {
        model.gopacity = true;
      }
    }
    if (model.gopacity) {
      FSSource = vtkShaderProgram.substitute(
        FSSource,
        '//VTK::GradientOpacityOn',
        '#define vtkGradientOpacityOn'
      ).result;
    }

    // set normal from density
    if (model.renderable.getComputeNormalFromOpacity()) {
      FSSource = vtkShaderProgram.substitute(
        FSSource,
        '//VTK::vtkComputeNormalFromOpacity',
        `#define vtkComputeNormalFromOpacity`
      ).result;
    }

    // if we have a ztexture then declare it and use it
    if (model.zBufferTexture !== null) {
      FSSource = vtkShaderProgram.substitute(FSSource, '//VTK::ZBuffer::Dec', [
        'uniform sampler2D zBufferTexture;',
        'uniform float vpWidth;',
        'uniform float vpHeight;',
      ]).result;
      FSSource = vtkShaderProgram.substitute(FSSource, '//VTK::ZBuffer::Impl', [
        'vec4 depthVec = texture2D(zBufferTexture, vec2(gl_FragCoord.x / vpWidth, gl_FragCoord.y/vpHeight));',
        'float zdepth = (depthVec.r*256.0 + depthVec.g)/257.0;',
        'zdepth = zdepth * 2.0 - 1.0;',
        'zdepth = -2.0 * camFar * camNear / (zdepth*(camFar-camNear)-(camFar+camNear)) - camNear;',
        'zdepth = -zdepth/rayDir.z;',
        'dists.y = min(zdepth,dists.y);',
      ]).result;
    }

    // Set the BlendMode approach
    FSSource = vtkShaderProgram.substitute(
      FSSource,
      '//VTK::BlendMode',
      `${model.renderable.getBlendMode()}`
    ).result;

    shaders.Fragment = FSSource;

    publicAPI.replaceShaderLight(shaders, ren, actor);
    publicAPI.replaceShaderClippingPlane(shaders, ren, actor);
  };

  publicAPI.replaceShaderLight = (shaders, ren, actor) => {
    if (model.lastLightComplexity === 0) {
      return;
    }
    let FSSource = shaders.Fragment;
    // check for shadow maps - not implemented yet, skip
    // const shadowFactor = '';

    // to-do: single out the case when complexity = 1

    // only account for lights that are switched on
    let lightNum = 0;
    ren.getLights().forEach((light) => {
      if (light.getSwitch()) {
        lightNum += 1;
      }
    });
    FSSource = vtkShaderProgram.substitute(
      FSSource,
      '//VTK::Light::Dec',
      [
        `uniform int lightNum;`,
        `uniform bool twoSidedLighting;`,
        `uniform vec3 lightColor[${lightNum}];`,
        `uniform vec3 lightDirectionVC[${lightNum}]; // normalized`,
        `uniform vec3 lightHalfAngleVC[${lightNum}];`,
        '//VTK::Light::Dec',
      ],
      false
    ).result;
    // support any number of lights
    if (model.lastLightComplexity === 3) {
      FSSource = vtkShaderProgram.substitute(
        FSSource,
        '//VTK::Light::Dec',
        [
          `uniform vec3 lightPositionVC[${lightNum}];`,
          `uniform vec3 lightAttenuation[${lightNum}];`,
          `uniform float lightConeAngle[${lightNum}];`,
          `uniform float lightExponent[${lightNum}];`,
          `uniform int lightPositional[${lightNum}];`,
        ],
        false
      ).result;
    }
    shaders.Fragment = FSSource;
  };

  publicAPI.replaceShaderClippingPlane = (shaders, ren, actor) => {
    let FSSource = shaders.Fragment;

    if (model.renderable.getClippingPlanes().length > 0) {
      const clipPlaneSize = model.renderable.getClippingPlanes().length;
      FSSource = vtkShaderProgram.substitute(
        FSSource,
        '//VTK::ClipPlane::Dec',
        [
          `uniform vec3 vClipPlaneNormals[6];`,
          `uniform float vClipPlaneDistances[6];`,
          '//VTK::ClipPlane::Dec',
        ],
        false
      ).result;

      FSSource = vtkShaderProgram.substitute(
        FSSource,
        '//VTK::ClipPlane::Impl',
        [
          `for(int i = 0; i < ${clipPlaneSize}; i++) {`,
          '  float rayDirRatio = dot(rayDir, vClipPlaneNormals[i]);',
          '  float equationResult = dot(vertexVCVSOutput, vClipPlaneNormals[i]) + vClipPlaneDistances[i];',
          '  if (rayDirRatio == 0.0)',
          '  {',
          '    if (equationResult < 0.0) dists.x = dists.y;',
          '    continue;',
          '  }',
          '  float result = -1.0 * equationResult / rayDirRatio;',
          '  if (rayDirRatio < 0.0) dists.y = min(dists.y, result);',
          '  else dists.x = max(dists.x, result);',
          '}',
          '//VTK::ClipPlane::Impl',
        ],
        false
      ).result;
    }

    shaders.Fragment = FSSource;
  };

  publicAPI.getNeedToRebuildShaders = (cellBO, ren, actor) => {
    // do we need lighting?
    let lightComplexity = 0;
    if (
      actor.getProperty().getShade() &&
      model.renderable.getBlendMode() === BlendMode.COMPOSITE_BLEND
    ) {
      // consider the lighting complexity to determine which case applies
      // simple headlight, Light Kit, the whole feature set of VTK
      lightComplexity = 0;
      model.numberOfLights = 0;

      ren.getLights().forEach((light) => {
        const status = light.getSwitch();
        if (status > 0) {
          model.numberOfLights++;
          if (lightComplexity === 0) {
            lightComplexity = 1;
          }
        }

        if (
          lightComplexity === 1 &&
          (model.numberOfLights > 1 ||
            light.getIntensity() !== 1.0 ||
            !light.lightTypeIsHeadLight())
        ) {
          lightComplexity = 2;
        }
        if (lightComplexity < 3 && light.getPositional()) {
          lightComplexity = 3;
        }
      });
    }

    let needRebuild = false;
    if (model.lastLightComplexity !== lightComplexity) {
      model.lastLightComplexity = lightComplexity;
      needRebuild = true;
    }

    const numComp = model.scalarTexture.getComponents();
    const iComps = actor.getProperty().getIndependentComponents();
    let usesProportionalComponents = false;
    const proportionalComponents = [];
    if (iComps) {
      // Define any proportional components
      for (let nc = 0; nc < numComp; nc++) {
        proportionalComponents.push(actor.getProperty().getOpacityMode(nc));
      }

      if (proportionalComponents.length > 0) {
        usesProportionalComponents = true;
      }
    }

    const ext = model.currentInput.getSpatialExtent();
    const spc = model.currentInput.getSpacing();
    const vsize = new Float64Array(3);
    vec3.set(
      vsize,
      (ext[1] - ext[0]) * spc[0],
      (ext[3] - ext[2]) * spc[1],
      (ext[5] - ext[4]) * spc[2]
    );

    const maxSamples =
      vec3.length(vsize) / model.renderable.getSampleDistance();

    const state = {
      interpolationType: actor.getProperty().getInterpolationType(),
      useLabelOutline: actor.getProperty().getUseLabelOutline(),
      numComp,
      usesProportionalComponents,
      iComps,
      maxSamples,
      useGradientOpacity: actor.getProperty().getUseGradientOpacity(0),
      blendMode: model.renderable.getBlendMode(),
      proportionalComponents,
    };

    // We only need to rebuild the shader if one of these variables has changed,
    // since they are used in the shader template replacement step.
    if (
      !model.previousState ||
      model.previousState.interpolationType !== state.interpolationType ||
      model.previousState.useLabelOutline !== state.useLabelOutline ||
      model.previousState.numComp !== state.numComp ||
      model.previousState.usesProportionalComponents !==
        state.usesProportionalComponents ||
      model.previousState.iComps !== state.iComps ||
      model.previousState.maxSamples !== state.maxSamples ||
      model.previousState.useGradientOpacity !== state.useGradientOpacity ||
      model.previousState.blendMode !== state.blendMode ||
      !arrayEquals(
        model.previousState.proportionalComponents,
        state.proportionalComponents
      )
    ) {
      model.previousState = { ...state };

      return true;
    }

    // has something changed that would require us to recreate the shader?
    if (
      cellBO.getProgram() === 0 ||
      needRebuild ||
      model.lastHaveSeenDepthRequest !== model.haveSeenDepthRequest ||
      !!model.lastZBufferTexture !== !!model.zBufferTexture ||
      cellBO.getShaderSourceTime().getMTime() < publicAPI.getMTime() ||
      cellBO.getShaderSourceTime().getMTime() < model.renderable.getMTime()
    ) {
      model.lastZBufferTexture = model.zBufferTexture;
      return true;
    }

    return false;
  };

  publicAPI.updateShaders = (cellBO, ren, actor) => {
    model.lastBoundBO = cellBO;

    // has something changed that would require us to recreate the shader?
    if (publicAPI.getNeedToRebuildShaders(cellBO, ren, actor)) {
      const shaders = { Vertex: null, Fragment: null, Geometry: null };

      publicAPI.buildShaders(shaders, ren, actor);

      // compile and bind the program if needed
      const newShader = model._openGLRenderWindow
        .getShaderCache()
        .readyShaderProgramArray(
          shaders.Vertex,
          shaders.Fragment,
          shaders.Geometry
        );

      // if the shader changed reinitialize the VAO
      if (newShader !== cellBO.getProgram()) {
        cellBO.setProgram(newShader);
        // reset the VAO as the shader has changed
        cellBO.getVAO().releaseGraphicsResources();
      }

      cellBO.getShaderSourceTime().modified();
    } else {
      model._openGLRenderWindow
        .getShaderCache()
        .readyShaderProgram(cellBO.getProgram());
    }

    cellBO.getVAO().bind();
    publicAPI.setMapperShaderParameters(cellBO, ren, actor);
    publicAPI.setCameraShaderParameters(cellBO, ren, actor);
    publicAPI.setPropertyShaderParameters(cellBO, ren, actor);
    publicAPI.getClippingPlaneShaderParameters(cellBO, ren, actor);
  };

  publicAPI.setMapperShaderParameters = (cellBO, ren, actor) => {
    // Now to update the VAO too, if necessary.
    const program = cellBO.getProgram();

    if (
      cellBO.getCABO().getElementCount() &&
      (model.VBOBuildTime.getMTime() >
        cellBO.getAttributeUpdateTime().getMTime() ||
        cellBO.getShaderSourceTime().getMTime() >
          cellBO.getAttributeUpdateTime().getMTime())
    ) {
      if (program.isAttributeUsed('vertexDC')) {
        if (
          !cellBO
            .getVAO()
            .addAttributeArray(
              program,
              cellBO.getCABO(),
              'vertexDC',
              cellBO.getCABO().getVertexOffset(),
              cellBO.getCABO().getStride(),
              model.context.FLOAT,
              3,
              model.context.FALSE
            )
        ) {
          vtkErrorMacro('Error setting vertexDC in shader VAO.');
        }
      }
      cellBO.getAttributeUpdateTime().modified();
    }

    program.setUniformi('texture1', model.scalarTexture.getTextureUnit());
    program.setUniformf('sampleDistance', model.renderable.getSampleDistance());

    const volInfo = model.scalarTexture.getVolumeInfo();
    const ipScalarRange = model.renderable.getIpScalarRange();

    const minVals = [];
    const maxVals = [];
    for (let i = 0; i < 4; i++) {
      // convert iprange from 0-1 into data range values
      minVals[i] =
        ipScalarRange[0] * volInfo.dataComputedScale[i] +
        volInfo.dataComputedOffset[i];
      maxVals[i] =
        ipScalarRange[1] * volInfo.dataComputedScale[i] +
        volInfo.dataComputedOffset[i];
      // convert data ranges into texture values
      minVals[i] = (minVals[i] - volInfo.offset[i]) / volInfo.scale[i];
      maxVals[i] = (maxVals[i] - volInfo.offset[i]) / volInfo.scale[i];
    }
    program.setUniform4f(
      'ipScalarRangeMin',
      minVals[0],
      minVals[1],
      minVals[2],
      minVals[3]
    );
    program.setUniform4f(
      'ipScalarRangeMax',
      maxVals[0],
      maxVals[1],
      maxVals[2],
      maxVals[3]
    );

    // if we have a zbuffer texture then set it
    if (model.zBufferTexture !== null) {
      program.setUniformi(
        'zBufferTexture',
        model.zBufferTexture.getTextureUnit()
      );
      const size = model._useSmallViewport
        ? [model._smallViewportWidth, model._smallViewportHeight]
        : model._openGLRenderWindow.getFramebufferSize();
      program.setUniformf('vpWidth', size[0]);
      program.setUniformf('vpHeight', size[1]);
    }
  };

  publicAPI.setCameraShaderParameters = (cellBO, ren, actor) => {
    // // [WMVP]C == {world, model, view, projection} coordinates
    // // E.g., WCPC == world to projection coordinate transformation
    const keyMats = model.openGLCamera.getKeyMatrices(ren);
    const actMats = model.openGLVolume.getKeyMatrices();

    mat4.multiply(model.modelToView, keyMats.wcvc, actMats.mcwc);

    const program = cellBO.getProgram();

    const cam = model.openGLCamera.getRenderable();
    const crange = cam.getClippingRange();
    program.setUniformf('camThick', crange[1] - crange[0]);
    program.setUniformf('camNear', crange[0]);
    program.setUniformf('camFar', crange[1]);

    const bounds = model.currentInput.getBounds();
    const dims = model.currentInput.getDimensions();

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

    program.setUniformf('dcxmin', dcxmin);
    program.setUniformf('dcxmax', dcxmax);
    program.setUniformf('dcymin', dcymin);
    program.setUniformf('dcymax', dcymax);

    if (program.isUniformUsed('cameraParallel')) {
      program.setUniformi('cameraParallel', cam.getParallelProjection());
    }

    const ext = model.currentInput.getSpatialExtent();
    const spc = model.currentInput.getSpacing();
    const vsize = new Float64Array(3);
    vec3.set(
      vsize,
      (ext[1] - ext[0]) * spc[0],
      (ext[3] - ext[2]) * spc[1],
      (ext[5] - ext[4]) * spc[2]
    );
    program.setUniform3f('vSpacing', spc[0], spc[1], spc[2]);

    vec3.set(pos, ext[0], ext[2], ext[4]);
    model.currentInput.indexToWorldVec3(pos, pos);

    vec3.transformMat4(pos, pos, model.modelToView);
    program.setUniform3f('vOriginVC', pos[0], pos[1], pos[2]);

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

    const maxSamples =
      vec3.length(vsize) / model.renderable.getSampleDistance();
    if (maxSamples > model.renderable.getMaximumSamplesPerRay()) {
      vtkWarningMacro(`The number of steps required ${Math.ceil(
        maxSamples
      )} is larger than the
        specified maximum number of steps ${model.renderable.getMaximumSamplesPerRay()}.
        Please either change the
        volumeMapper sampleDistance or its maximum number of samples.`);
    }

    const vctoijk = new Float64Array(3);

    vec3.set(vctoijk, 1.0, 1.0, 1.0);
    vec3.divide(vctoijk, vctoijk, vsize);
    program.setUniform3f('vVCToIJK', vctoijk[0], vctoijk[1], vctoijk[2]);
    program.setUniform3i('volumeDimensions', dims[0], dims[1], dims[2]);

    if (!model._openGLRenderWindow.getWebgl2()) {
      const volInfo = model.scalarTexture.getVolumeInfo();
      program.setUniformf('texWidth', model.scalarTexture.getWidth());
      program.setUniformf('texHeight', model.scalarTexture.getHeight());
      program.setUniformi('xreps', volInfo.xreps);
      program.setUniformi('xstride', volInfo.xstride);
      program.setUniformi('ystride', volInfo.ystride);
    }

    // map normals through normal matrix
    // then use a point on the plane to compute the distance
    const normal = new Float64Array(3);
    const pos2 = new Float64Array(3);
    for (let i = 0; i < 6; ++i) {
      switch (i) {
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
        case 0:
        default:
          vec3.set(normal, 1.0, 0.0, 0.0);
          vec3.set(pos2, ext[1], ext[3], ext[5]);
          break;
      }
      vec3.transformMat3(normal, normal, model.idxNormalMatrix);
      vec3.transformMat4(pos2, pos2, model.idxToView);
      const dist = -1.0 * vec3.dot(pos2, normal);

      // we have the plane in view coordinates
      // specify the planes in view coordinates
      program.setUniform3f(`vPlaneNormal${i}`, normal[0], normal[1], normal[2]);
      program.setUniformf(`vPlaneDistance${i}`, dist);

      if (actor.getProperty().getUseLabelOutline()) {
        const image = model.currentInput;
        const worldToIndex = image.getWorldToIndex();

        program.setUniformMatrix('vWCtoIDX', worldToIndex);

        // Get the projection coordinate to world coordinate transformation matrix.
        mat4.invert(model.projectionToWorld, keyMats.wcpc);
        program.setUniformMatrix('PCWCMatrix', model.projectionToWorld);

        const size = publicAPI.getRenderTargetSize();

        program.setUniformf('vpWidth', size[0]);
        program.setUniformf('vpHeight', size[1]);

        const offset = publicAPI.getRenderTargetOffset();
        program.setUniformf('vpOffsetX', offset[0] / size[0]);
        program.setUniformf('vpOffsetY', offset[1] / size[1]);
      }
    }

    mat4.invert(model.projectionToView, keyMats.vcpc);
    program.setUniformMatrix('PCVCMatrix', model.projectionToView);

    // handle lighting values
    if (model.lastLightComplexity === 0) {
      return;
    }
    let lightNum = 0;
    const lightColor = [];
    const lightDir = [];
    const halfAngle = [];
    ren.getLights().forEach((light) => {
      const status = light.getSwitch();
      if (status > 0) {
        const dColor = light.getColor();
        const intensity = light.getIntensity();
        lightColor[0 + lightNum * 3] = dColor[0] * intensity;
        lightColor[1 + lightNum * 3] = dColor[1] * intensity;
        lightColor[2 + lightNum * 3] = dColor[2] * intensity;
        const ldir = light.getDirection();
        vec3.set(normal, ldir[0], ldir[1], ldir[2]);
        vec3.transformMat3(normal, normal, keyMats.normalMatrix); // in view coordinat
        vec3.normalize(normal, normal);
        lightDir[0 + lightNum * 3] = normal[0];
        lightDir[1 + lightNum * 3] = normal[1];
        lightDir[2 + lightNum * 3] = normal[2];
        // camera DOP is 0,0,-1.0 in VC
        halfAngle[0 + lightNum * 3] = -0.5 * normal[0];
        halfAngle[1 + lightNum * 3] = -0.5 * normal[1];
        halfAngle[2 + lightNum * 3] = -0.5 * (normal[2] - 1.0);
        lightNum++;
      }
    });
    program.setUniformi('twoSidedLighting', ren.getTwoSidedLighting());
    program.setUniformi('lightNum', lightNum);
    program.setUniform3fv('lightColor', lightColor);
    program.setUniform3fv('lightDirectionVC', lightDir);
    program.setUniform3fv('lightHalfAngleVC', halfAngle);

    if (model.lastLightComplexity === 3) {
      lightNum = 0;
      const lightPositionVC = [];
      const lightAttenuation = [];
      const lightConeAngle = [];
      const lightExponent = [];
      const lightPositional = [];
      ren.getLights().forEach((light) => {
        const status = light.getSwitch();
        if (status > 0) {
          const attenuation = light.getAttenuationValues();
          lightAttenuation[0 + lightNum * 3] = attenuation[0];
          lightAttenuation[1 + lightNum * 3] = attenuation[1];
          lightAttenuation[2 + lightNum * 3] = attenuation[2];
          lightExponent[lightNum] = light.getExponent();
          lightConeAngle[lightNum] = light.getConeAngle();
          lightPositional[lightNum] = light.getPositional();
          const lp = light.getTransformedPosition();
          vec3.transformMat4(lp, lp, model.modelToView);
          lightPositionVC[0 + lightNum * 3] = lp[0];
          lightPositionVC[1 + lightNum * 3] = lp[1];
          lightPositionVC[2 + lightNum * 3] = lp[2];
          lightNum += 1;
        }
      });
      program.setUniform3fv('lightPositionVC', lightPositionVC);
      program.setUniform3fv('lightAttenuation', lightAttenuation);
      program.setUniformfv('lightConeAngle', lightConeAngle);
      program.setUniformfv('lightExponent', lightExponent);
      program.setUniformiv('lightPositional', lightPositional);
    }
  };

  publicAPI.setPropertyShaderParameters = (cellBO, ren, actor) => {
    const program = cellBO.getProgram();

    program.setUniformi('ctexture', model.colorTexture.getTextureUnit());
    program.setUniformi('otexture', model.opacityTexture.getTextureUnit());
    program.setUniformi('jtexture', model.jitterTexture.getTextureUnit());

    const volInfo = model.scalarTexture.getVolumeInfo();
    const vprop = actor.getProperty();

    // set the component mix when independent
    const numComp = model.scalarTexture.getComponents();
    const iComps = actor.getProperty().getIndependentComponents();
    if (iComps && numComp >= 2) {
      for (let i = 0; i < numComp; i++) {
        program.setUniformf(
          `mix${i}`,
          actor.getProperty().getComponentWeight(i)
        );
      }
    }

    // three levels of shift scale combined into one
    // for performance in the fragment shader
    for (let i = 0; i < numComp; i++) {
      const target = iComps ? i : 0;
      const sscale = volInfo.scale[i];
      const ofun = vprop.getScalarOpacity(target);
      const oRange = ofun.getRange();
      const oscale = sscale / (oRange[1] - oRange[0]);
      const oshift = (volInfo.offset[i] - oRange[0]) / (oRange[1] - oRange[0]);
      program.setUniformf(`oshift${i}`, oshift);
      program.setUniformf(`oscale${i}`, oscale);

      const cfun = vprop.getRGBTransferFunction(target);
      const cRange = cfun.getRange();
      program.setUniformf(
        `cshift${i}`,
        (volInfo.offset[i] - cRange[0]) / (cRange[1] - cRange[0])
      );
      program.setUniformf(`cscale${i}`, sscale / (cRange[1] - cRange[0]));
    }

    if (model.gopacity) {
      if (iComps) {
        for (let nc = 0; nc < numComp; ++nc) {
          const sscale = volInfo.scale[nc];
          const useGO = vprop.getUseGradientOpacity(nc);
          if (useGO) {
            const gomin = vprop.getGradientOpacityMinimumOpacity(nc);
            const gomax = vprop.getGradientOpacityMaximumOpacity(nc);
            program.setUniformf(`gomin${nc}`, gomin);
            program.setUniformf(`gomax${nc}`, gomax);
            const goRange = [
              vprop.getGradientOpacityMinimumValue(nc),
              vprop.getGradientOpacityMaximumValue(nc),
            ];
            program.setUniformf(
              `goscale${nc}`,
              (sscale * (gomax - gomin)) / (goRange[1] - goRange[0])
            );
            program.setUniformf(
              `goshift${nc}`,
              (-goRange[0] * (gomax - gomin)) / (goRange[1] - goRange[0]) +
                gomin
            );
          } else {
            program.setUniformf(`gomin${nc}`, 1.0);
            program.setUniformf(`gomax${nc}`, 1.0);
            program.setUniformf(`goscale${nc}`, 0.0);
            program.setUniformf(`goshift${nc}`, 1.0);
          }
        }
      } else {
        const sscale = volInfo.scale[numComp - 1];
        const gomin = vprop.getGradientOpacityMinimumOpacity(0);
        const gomax = vprop.getGradientOpacityMaximumOpacity(0);
        program.setUniformf('gomin0', gomin);
        program.setUniformf('gomax0', gomax);
        const goRange = [
          vprop.getGradientOpacityMinimumValue(0),
          vprop.getGradientOpacityMaximumValue(0),
        ];
        program.setUniformf(
          'goscale0',
          (sscale * (gomax - gomin)) / (goRange[1] - goRange[0])
        );
        program.setUniformf(
          'goshift0',
          (-goRange[0] * (gomax - gomin)) / (goRange[1] - goRange[0]) + gomin
        );
      }
    }

    const vtkImageLabelOutline = actor.getProperty().getUseLabelOutline();
    if (vtkImageLabelOutline === true) {
      const labelOutlineThickness = actor
        .getProperty()
        .getLabelOutlineThickness();

      program.setUniformi('outlineThickness', labelOutlineThickness);
    }

    if (model.lastLightComplexity > 0) {
      program.setUniformf('vAmbient', vprop.getAmbient());
      program.setUniformf('vDiffuse', vprop.getDiffuse());
      program.setUniformf('vSpecular', vprop.getSpecular());
      program.setUniformf('vSpecularPower', vprop.getSpecularPower());
    }
  };

  publicAPI.getClippingPlaneShaderParameters = (cellBO, ren, actor) => {
    if (model.renderable.getClippingPlanes().length > 0) {
      const keyMats = model.openGLCamera.getKeyMatrices(ren);

      const clipPlaneNormals = [];
      const clipPlaneDistances = [];

      const clipPlanes = model.renderable.getClippingPlanes();
      const clipPlaneSize = clipPlanes.length;
      for (let i = 0; i < clipPlaneSize; ++i) {
        const clipPlaneNormal = clipPlanes[i].getNormal();
        const clipPlanePos = clipPlanes[i].getOrigin();

        vec3.transformMat3(
          clipPlaneNormal,
          clipPlaneNormal,
          keyMats.normalMatrix
        );

        vec3.transformMat4(clipPlanePos, clipPlanePos, keyMats.wcvc);

        const clipPlaneDist = -1.0 * vec3.dot(clipPlanePos, clipPlaneNormal);

        clipPlaneNormals.push(clipPlaneNormal[0]);
        clipPlaneNormals.push(clipPlaneNormal[1]);
        clipPlaneNormals.push(clipPlaneNormal[2]);
        clipPlaneDistances.push(clipPlaneDist);
      }
      const program = cellBO.getProgram();
      program.setUniform3fv(`vClipPlaneNormals`, clipPlaneNormals);
      program.setUniformfv(`vClipPlaneDistances`, clipPlaneDistances);
    }
  };

  // unsubscribe from our listeners
  publicAPI.delete = macro.chain(() => {
    if (model._animationRateSubscription) {
      model._animationRateSubscription.unsubscribe();
      model._animationRateSubscription = null;
    }
  }, publicAPI.delete);

  publicAPI.getRenderTargetSize = () => {
    if (model._useSmallViewport) {
      return [model._smallViewportWidth, model._smallViewportHeight];
    }

    const { usize, vsize } = model.openGLRenderer.getTiledSizeAndOrigin();

    return [usize, vsize];
  };

  publicAPI.getRenderTargetOffset = () => {
    const { lowerLeftU, lowerLeftV } =
      model.openGLRenderer.getTiledSizeAndOrigin();

    return [lowerLeftU, lowerLeftV];
  };

  publicAPI.renderPieceStart = (ren, actor) => {
    const rwi = ren.getVTKWindow().getInteractor();

    model._useSmallViewport = false;
    if (rwi.isAnimating() && model._lastScale > 1.5) {
      model._useSmallViewport = true;
    }

    if (!model._animationRateSubscription) {
      // when the animation frame rate changes recompute the scale factor
      model._animationRateSubscription = rwi.onAnimationFrameRateUpdate(() => {
        if (model.renderable.getAutoAdjustSampleDistances()) {
          const frate = rwi.getRecentAnimationFrameRate();
          const adjustment = rwi.getDesiredUpdateRate() / frate;

          // only change if we are off by 15%
          if (adjustment > 1.15 || adjustment < 0.85) {
            model._lastScale *= adjustment;
          }
          // clamp scale to some reasonable values.
          // Below 1.5 we will just be using full resolution as that is close enough
          // Above 400 seems like a lot so we limit to that 1/20th per axis
          if (model._lastScale > 400) {
            model._lastScale = 400;
          }
          if (model._lastScale < 1.5) {
            model._lastScale = 1.5;
          }
        } else {
          model._lastScale =
            model.renderable.getImageSampleDistance() *
            model.renderable.getImageSampleDistance();
        }
        const size = model._openGLRenderWindow.getFramebufferSize();
        model._smallViewportWidth = Math.ceil(
          size[0] / Math.sqrt(model._lastScale)
        );
        model._smallViewportHeight = Math.ceil(
          size[1] / Math.sqrt(model._lastScale)
        );
      });
    }

    // use/create/resize framebuffer if needed
    if (model._useSmallViewport) {
      const size = model._openGLRenderWindow.getFramebufferSize();

      // adjust viewportSize to always be at most the dest fo size
      if (model._smallViewportHeight > size[1]) {
        model._smallViewportHeight = size[1];
      }
      if (model._smallViewportWidth > size[0]) {
        model._smallViewportWidth = size[0];
      }
      model.framebuffer.saveCurrentBindingsAndBuffers();

      if (model.framebuffer.getGLFramebuffer() === null) {
        model.framebuffer.create(size[0], size[1]);
        model.framebuffer.populateFramebuffer();
      } else {
        const fbSize = model.framebuffer.getSize();
        if (fbSize[0] !== size[0] || fbSize[1] !== size[1]) {
          model.framebuffer.create(size[0], size[1]);
          model.framebuffer.populateFramebuffer();
        }
      }
      model.framebuffer.bind();
      const gl = model.context;
      gl.clearColor(0.0, 0.0, 0.0, 0.0);
      gl.colorMask(true, true, true, true);
      gl.clear(gl.COLOR_BUFFER_BIT);
      gl.viewport(0, 0, model._smallViewportWidth, model._smallViewportHeight);
      model.fvp = [
        model._smallViewportWidth / size[0],
        model._smallViewportHeight / size[1],
      ];
    }
    model.context.disable(model.context.DEPTH_TEST);

    // make sure the BOs are up to date
    publicAPI.updateBufferObjects(ren, actor);

    // set interpolation on the texture based on property setting
    const iType = actor.getProperty().getInterpolationType();
    if (iType === InterpolationType.NEAREST) {
      model.scalarTexture.setMinificationFilter(Filter.NEAREST);
      model.scalarTexture.setMagnificationFilter(Filter.NEAREST);
    } else {
      model.scalarTexture.setMinificationFilter(Filter.LINEAR);
      model.scalarTexture.setMagnificationFilter(Filter.LINEAR);
    }

    // Bind the OpenGL, this is shared between the different primitive/cell types.
    model.lastBoundBO = null;

    // if we have a zbuffer texture then activate it
    if (model.zBufferTexture !== null) {
      model.zBufferTexture.activate();
    }
  };

  publicAPI.renderPieceDraw = (ren, actor) => {
    const gl = model.context;

    // render the texture
    model.scalarTexture.activate();
    model.opacityTexture.activate();
    model.colorTexture.activate();
    model.jitterTexture.activate();

    publicAPI.updateShaders(model.tris, ren, actor);

    // First we do the triangles, update the shader, set uniforms, etc.
    // for (let i = 0; i < 11; ++i) {
    //   gl.drawArrays(gl.TRIANGLES, 66 * i, 66);
    // }
    gl.drawArrays(gl.TRIANGLES, 0, model.tris.getCABO().getElementCount());
    model.tris.getVAO().release();

    model.scalarTexture.deactivate();
    model.colorTexture.deactivate();
    model.opacityTexture.deactivate();
    model.jitterTexture.deactivate();
  };

  publicAPI.renderPieceFinish = (ren, actor) => {
    // if we have a zbuffer texture then deactivate it
    if (model.zBufferTexture !== null) {
      model.zBufferTexture.deactivate();
    }

    if (model._useSmallViewport) {
      // now copy the framebuffer with the volume into the
      // regular buffer
      model.framebuffer.restorePreviousBindingsAndBuffers();

      if (model.copyShader === null) {
        model.copyShader = model._openGLRenderWindow
          .getShaderCache()
          .readyShaderProgramArray(
            [
              '//VTK::System::Dec',
              'attribute vec4 vertexDC;',
              'uniform vec2 tfactor;',
              'varying vec2 tcoord;',
              'void main() { tcoord = vec2(vertexDC.x*0.5 + 0.5, vertexDC.y*0.5 + 0.5) * tfactor; gl_Position = vertexDC; }',
            ].join('\n'),
            [
              '//VTK::System::Dec',
              '//VTK::Output::Dec',
              'uniform sampler2D texture1;',
              'varying vec2 tcoord;',
              'void main() { gl_FragData[0] = texture2D(texture1,tcoord); }',
            ].join('\n'),
            ''
          );
        const program = model.copyShader;

        model.copyVAO = vtkVertexArrayObject.newInstance();
        model.copyVAO.setOpenGLRenderWindow(model._openGLRenderWindow);

        model.tris.getCABO().bind();
        if (
          !model.copyVAO.addAttributeArray(
            program,
            model.tris.getCABO(),
            'vertexDC',
            model.tris.getCABO().getVertexOffset(),
            model.tris.getCABO().getStride(),
            model.context.FLOAT,
            3,
            model.context.FALSE
          )
        ) {
          vtkErrorMacro('Error setting vertexDC in copy shader VAO.');
        }
      } else {
        model._openGLRenderWindow
          .getShaderCache()
          .readyShaderProgram(model.copyShader);
      }

      const size = model._openGLRenderWindow.getFramebufferSize();
      model.context.viewport(0, 0, size[0], size[1]);

      // activate texture
      const tex = model.framebuffer.getColorTexture();
      tex.activate();
      model.copyShader.setUniformi('texture', tex.getTextureUnit());
      model.copyShader.setUniform2f('tfactor', model.fvp[0], model.fvp[1]);

      const gl = model.context;
      gl.blendFuncSeparate(
        gl.ONE,
        gl.ONE_MINUS_SRC_ALPHA,
        gl.ONE,
        gl.ONE_MINUS_SRC_ALPHA
      );

      // render quad
      model.context.drawArrays(
        model.context.TRIANGLES,
        0,
        model.tris.getCABO().getElementCount()
      );
      tex.deactivate();

      gl.blendFuncSeparate(
        gl.SRC_ALPHA,
        gl.ONE_MINUS_SRC_ALPHA,
        gl.ONE,
        gl.ONE_MINUS_SRC_ALPHA
      );
    }
  };

  publicAPI.renderPiece = (ren, actor) => {
    publicAPI.invokeEvent({ type: 'StartEvent' });
    model.renderable.update();
    model.currentInput = model.renderable.getInputData();
    publicAPI.invokeEvent({ type: 'EndEvent' });

    if (!model.currentInput) {
      vtkErrorMacro('No input!');
      return;
    }

    publicAPI.renderPieceStart(ren, actor);
    publicAPI.renderPieceDraw(ren, actor);
    publicAPI.renderPieceFinish(ren, actor);
  };

  publicAPI.computeBounds = (ren, actor) => {
    if (!publicAPI.getInput()) {
      vtkMath.uninitializeBounds(model.Bounds);
      return;
    }
    model.bounds = publicAPI.getInput().getBounds();
  };

  publicAPI.updateBufferObjects = (ren, actor) => {
    // Rebuild buffers if needed
    if (publicAPI.getNeedToRebuildBufferObjects(ren, actor)) {
      publicAPI.buildBufferObjects(ren, actor);
    }
  };

  publicAPI.getNeedToRebuildBufferObjects = (ren, actor) => {
    // first do a coarse check
    if (
      model.VBOBuildTime.getMTime() < publicAPI.getMTime() ||
      model.VBOBuildTime.getMTime() < actor.getMTime() ||
      model.VBOBuildTime.getMTime() < model.renderable.getMTime() ||
      model.VBOBuildTime.getMTime() < actor.getProperty().getMTime() ||
      model.VBOBuildTime.getMTime() < model.currentInput.getMTime()
    ) {
      return true;
    }
    return false;
  };

  publicAPI.buildBufferObjects = (ren, actor) => {
    const image = model.currentInput;
    if (!image) {
      return;
    }

    const scalars = image.getPointData() && image.getPointData().getScalars();
    if (!scalars) {
      return;
    }

    const vprop = actor.getProperty();

    if (!model.jitterTexture.getHandle()) {
      const oTable = new Uint8Array(32 * 32);
      for (let i = 0; i < 32 * 32; ++i) {
        oTable[i] = 255.0 * Math.random();
      }
      model.jitterTexture.setMinificationFilter(Filter.LINEAR);
      model.jitterTexture.setMagnificationFilter(Filter.LINEAR);
      model.jitterTexture.create2DFromRaw(
        32,
        32,
        1,
        VtkDataTypes.UNSIGNED_CHAR,
        oTable
      );
    }

    const numComp = scalars.getNumberOfComponents();
    const iComps = vprop.getIndependentComponents();
    const numIComps = iComps ? numComp : 1;

    // rebuild opacity tfun?
    let toString = `${vprop.getMTime()}`;
    if (model.opacityTextureString !== toString) {
      const oWidth = 1024;
      const oSize = oWidth * 2 * numIComps;
      const ofTable = new Float32Array(oSize);
      const tmpTable = new Float32Array(oWidth);

      for (let c = 0; c < numIComps; ++c) {
        const ofun = vprop.getScalarOpacity(c);
        const opacityFactor =
          model.renderable.getSampleDistance() /
          vprop.getScalarOpacityUnitDistance(c);

        const oRange = ofun.getRange();
        ofun.getTable(oRange[0], oRange[1], oWidth, tmpTable, 1);
        // adjust for sample distance etc
        for (let i = 0; i < oWidth; ++i) {
          ofTable[c * oWidth * 2 + i] =
            1.0 - (1.0 - tmpTable[i]) ** opacityFactor;
          ofTable[c * oWidth * 2 + i + oWidth] = ofTable[c * oWidth * 2 + i];
        }
      }

      model.opacityTexture.releaseGraphicsResources(model._openGLRenderWindow);
      model.opacityTexture.setMinificationFilter(Filter.LINEAR);
      model.opacityTexture.setMagnificationFilter(Filter.LINEAR);

      // use float texture where possible because we really need the resolution
      // for this table. Errors in low values of opacity accumulate to
      // visible artifacts. High values of opacity quickly terminate without
      // artifacts.
      if (
        model._openGLRenderWindow.getWebgl2() ||
        (model.context.getExtension('OES_texture_float') &&
          model.context.getExtension('OES_texture_float_linear'))
      ) {
        model.opacityTexture.create2DFromRaw(
          oWidth,
          2 * numIComps,
          1,
          VtkDataTypes.FLOAT,
          ofTable
        );
      } else {
        const oTable = new Uint8Array(oSize);
        for (let i = 0; i < oSize; ++i) {
          oTable[i] = 255.0 * ofTable[i];
        }
        model.opacityTexture.create2DFromRaw(
          oWidth,
          2 * numIComps,
          1,
          VtkDataTypes.UNSIGNED_CHAR,
          oTable
        );
      }
      model.opacityTextureString = toString;
    }

    // rebuild color tfun?
    toString = `${vprop.getMTime()}`;
    if (model.colorTextureString !== toString) {
      const cWidth = 1024;
      const cSize = cWidth * 2 * numIComps * 3;
      const cTable = new Uint8Array(cSize);
      const tmpTable = new Float32Array(cWidth * 3);

      for (let c = 0; c < numIComps; ++c) {
        const cfun = vprop.getRGBTransferFunction(c);
        const cRange = cfun.getRange();
        cfun.getTable(cRange[0], cRange[1], cWidth, tmpTable, 1);
        for (let i = 0; i < cWidth * 3; ++i) {
          cTable[c * cWidth * 6 + i] = 255.0 * tmpTable[i];
          cTable[c * cWidth * 6 + i + cWidth * 3] = 255.0 * tmpTable[i];
        }
      }

      model.colorTexture.releaseGraphicsResources(model._openGLRenderWindow);
      model.colorTexture.setMinificationFilter(Filter.LINEAR);
      model.colorTexture.setMagnificationFilter(Filter.LINEAR);

      model.colorTexture.create2DFromRaw(
        cWidth,
        2 * numIComps,
        3,
        VtkDataTypes.UNSIGNED_CHAR,
        cTable
      );
      model.colorTextureString = toString;
    }

    // rebuild the scalarTexture if the data has changed
    toString = `${image.getMTime()}`;
    if (model.scalarTextureString !== toString) {
      // Build the textures
      const dims = image.getDimensions();
      model.scalarTexture.releaseGraphicsResources(model._openGLRenderWindow);
      model.scalarTexture.resetFormatAndType();
      model.scalarTexture.create3DFilterableFromRaw(
        dims[0],
        dims[1],
        dims[2],
        numComp,
        scalars.getDataType(),
        scalars.getData(),
        model.renderable.getPreferSizeOverAccuracy()
      );
      model.scalarTextureString = toString;
    }

    if (!model.tris.getCABO().getElementCount()) {
      // build the CABO
      const ptsArray = new Float32Array(12);
      for (let i = 0; i < 4; i++) {
        ptsArray[i * 3] = (i % 2) * 2 - 1.0;
        ptsArray[i * 3 + 1] = i > 1 ? 1.0 : -1.0;
        ptsArray[i * 3 + 2] = -1.0;
      }

      const cellArray = new Uint16Array(8);
      cellArray[0] = 3;
      cellArray[1] = 0;
      cellArray[2] = 1;
      cellArray[3] = 3;
      cellArray[4] = 3;
      cellArray[5] = 0;
      cellArray[6] = 3;
      cellArray[7] = 2;

      // const dim = 12.0;
      // const ptsArray = new Float32Array(3 * dim * dim);
      // for (let i = 0; i < dim; i++) {
      //   for (let j = 0; j < dim; j++) {
      //     const offset = ((i * dim) + j) * 3;
      //     ptsArray[offset] = (2.0 * (i / (dim - 1.0))) - 1.0;
      //     ptsArray[offset + 1] = (2.0 * (j / (dim - 1.0))) - 1.0;
      //     ptsArray[offset + 2] = -1.0;
      //   }
      // }

      // const cellArray = new Uint16Array(8 * (dim - 1) * (dim - 1));
      // for (let i = 0; i < dim - 1; i++) {
      //   for (let j = 0; j < dim - 1; j++) {
      //     const offset = 8 * ((i * (dim - 1)) + j);
      //     cellArray[offset] = 3;
      //     cellArray[offset + 1] = (i * dim) + j;
      //     cellArray[offset + 2] = (i * dim) + 1 + j;
      //     cellArray[offset + 3] = ((i + 1) * dim) + 1 + j;
      //     cellArray[offset + 4] = 3;
      //     cellArray[offset + 5] = (i * dim) + j;
      //     cellArray[offset + 6] = ((i + 1) * dim) + 1 + j;
      //     cellArray[offset + 7] = ((i + 1) * dim) + j;
      //   }
      // }

      const points = vtkDataArray.newInstance({
        numberOfComponents: 3,
        values: ptsArray,
      });
      points.setName('points');
      const cells = vtkDataArray.newInstance({
        numberOfComponents: 1,
        values: cellArray,
      });
      model.tris.getCABO().createVBO(cells, 'polys', Representation.SURFACE, {
        points,
        cellOffset: 0,
      });
    }

    model.VBOBuildTime.modified();
  };
}

// ----------------------------------------------------------------------------
// Object factory
// ----------------------------------------------------------------------------

const DEFAULT_VALUES = {
  context: null,
  VBOBuildTime: null,
  scalarTexture: null,
  scalarTextureString: null,
  opacityTexture: null,
  opacityTextureString: null,
  colorTexture: null,
  colorTextureString: null,
  jitterTexture: null,
  tris: null,
  framebuffer: null,
  copyShader: null,
  copyVAO: null,
  lastXYF: 1.0,
  targetXYF: 1.0,
  zBufferTexture: null,
  lastZBufferTexture: null,
  lastLightComplexity: 0,
  fullViewportTime: 1.0,
  idxToView: null,
  idxNormalMatrix: null,
  modelToView: null,
  projectionToView: null,
  avgWindowArea: 0.0,
  avgFrameTime: 0.0,
};

// ----------------------------------------------------------------------------

export function extend(publicAPI, model, initialValues = {}) {
  Object.assign(model, DEFAULT_VALUES, initialValues);

  // Inheritance
  vtkViewNode.extend(publicAPI, model, initialValues);

  model.VBOBuildTime = {};
  macro.obj(model.VBOBuildTime, { mtime: 0 });

  model.tris = vtkHelper.newInstance();
  model.scalarTexture = vtkOpenGLTexture.newInstance();
  model.opacityTexture = vtkOpenGLTexture.newInstance();
  model.colorTexture = vtkOpenGLTexture.newInstance();
  model.jitterTexture = vtkOpenGLTexture.newInstance();
  model.jitterTexture.setWrapS(Wrap.REPEAT);
  model.jitterTexture.setWrapT(Wrap.REPEAT);
  model.framebuffer = vtkOpenGLFramebuffer.newInstance();

  model.idxToView = mat4.identity(new Float64Array(16));
  model.idxNormalMatrix = mat3.identity(new Float64Array(9));
  model.modelToView = mat4.identity(new Float64Array(16));
  model.projectionToView = mat4.identity(new Float64Array(16));
  model.projectionToWorld = mat4.identity(new Float64Array(16));

  model._lastScale = 1.0;

  // Build VTK API
  macro.setGet(publicAPI, model, ['context']);

  // Object methods
  vtkOpenGLVolumeMapper(publicAPI, model);
}

// ----------------------------------------------------------------------------

export const newInstance = macro.newInstance(extend, 'vtkOpenGLVolumeMapper');

// ----------------------------------------------------------------------------

export default { newInstance, extend };

// Register ourself to OpenGL backend if imported
registerOverride('vtkVolumeMapper', newInstance);
