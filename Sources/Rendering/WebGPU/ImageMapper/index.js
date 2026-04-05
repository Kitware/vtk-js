import { mat4, vec4 } from 'gl-matrix';
import Constants from 'vtk.js/Sources/Rendering/Core/ImageMapper/Constants';
import * as macro from 'vtk.js/Sources/macros';
import vtkWebGPUShaderCache from 'vtk.js/Sources/Rendering/WebGPU/ShaderCache';
import vtkWebGPUFullScreenQuad from 'vtk.js/Sources/Rendering/WebGPU/FullScreenQuad';
import vtkWebGPUUniformBuffer from 'vtk.js/Sources/Rendering/WebGPU/UniformBuffer';
import {
  addClipPlaneEntries,
  getClippingPlaneEquationsInCoords,
  getClipPlaneShaderChecks,
  MAX_CLIPPING_PLANES,
} from 'vtk.js/Sources/Rendering/WebGPU/Helpers/ClippingPlanes';

import { Resolve } from 'vtk.js/Sources/Rendering/Core/Mapper/CoincidentTopologyHelper';
import { InterpolationType } from 'vtk.js/Sources/Rendering/Core/ImageProperty/Constants';
import {
  TextureChannelMode,
  TextureSlot,
} from 'vtk.js/Sources/Rendering/WebGPU/ImageMapper/Constants';
import {
  computeFnToString,
  getLUTRowCenterExpression,
  getTextureChannelMode,
  getUseLabelOutline,
  textureSamplerMatches,
} from 'vtk.js/Sources/Rendering/WebGPU/Helpers/ImageSampling';
import { registerOverride } from 'vtk.js/Sources/Rendering/WebGPU/ViewNodeFactory';

const { vtkErrorMacro } = macro;
const { SlicingMode } = Constants;
const imgFragTemplate = `
//VTK::Renderer::Dec

//VTK::Mapper::Dec

//VTK::TCoord::Dec

//VTK::Image::Dec

//VTK::Clip::Dec

//VTK::RenderEncoder::Dec

//VTK::IOStructs::Dec

@fragment
fn main(
//VTK::IOStructs::Input
)
//VTK::IOStructs::Output
{
  var output: fragmentOutput;

  //VTK::Clip::Impl

  //VTK::Image::Sample

  // var computedColor: vec4<f32> = vec4<f32>(1.0,0.7, 0.5, 1.0);

  //VTK::Position::Impl

//VTK::RenderEncoder::Impl

  return output;
}
`;

// ----------------------------------------------------------------------------
// vtkWebGPUImageMapper methods
// ----------------------------------------------------------------------------

const tmpMat4 = new Float64Array(16);
const tmp2Mat4 = new Float64Array(16);
const tmp3Mat4 = new Float64Array(16);
const tmpTranslate3 = new Float64Array(3);
const tmpScale3 = new Float64Array(3);
const ptsArray1 = new Float64Array(4);
const ptsArray2 = new Float64Array(4);

function vtkWebGPUImageMapper(publicAPI, model) {
  // Set our className
  model.classHierarchy.push('vtkWebGPUImageMapper');

  publicAPI.ensureTextureSampler = (textureView, options) => {
    if (textureView && !textureSamplerMatches(textureView, options)) {
      textureView.addSampler(model.device, options);
    }
  };

  publicAPI.computeImageState = () => {
    const actorProperty = model.WebGPUImageSlice.getRenderable().getProperty();
    const tView = publicAPI.getTextureViews()[TextureSlot.IMAGE];
    const numberOfComponents = tView?.getTexture().getNumberOfComponents() ?? 1;
    const independentComponents = actorProperty.getIndependentComponents();
    const numberOfIComponents = independentComponents ? numberOfComponents : 1;

    return {
      actorProperty,
      numberOfComponents,
      independentComponents,
      numberOfIComponents,
      useLabelOutline: getUseLabelOutline(
        actorProperty,
        independentComponents,
        numberOfComponents
      ),
      textureChannelMode: getTextureChannelMode(
        independentComponents,
        numberOfComponents
      ),
    };
  };

  publicAPI.getImageState = () =>
    model.imageState ?? publicAPI.computeImageState();

  publicAPI.buildPass = (prepass) => {
    if (prepass) {
      model.WebGPUImageSlice = publicAPI.getFirstAncestorOfType(
        'vtkWebGPUImageSlice'
      );
      model.WebGPURenderer =
        model.WebGPUImageSlice.getFirstAncestorOfType('vtkWebGPURenderer');
      model.WebGPURenderWindow = model.WebGPURenderer.getParent();
      model.device = model.WebGPURenderWindow.getDevice();

      const ren = model.WebGPURenderer.getRenderable();
      // is slice set by the camera
      if (model.renderable.getSliceAtFocalPoint()) {
        model.renderable.setSliceFromCamera(ren.getActiveCamera());
      }
    }
  };

  // Renders myself
  publicAPI.translucentPass = (prepass) => {
    if (prepass) {
      publicAPI.render();
    }
  };

  publicAPI.zBufferPass = (prepass) => {
    if (prepass) {
      publicAPI.render();
    }
  };

  publicAPI.opaqueZBufferPass = (prepass) => publicAPI.zBufferPass(prepass);

  publicAPI.opaquePass = (prepass) => {
    if (prepass) {
      publicAPI.render();
    }
  };

  publicAPI.render = () => {
    model.renderable.update();

    model.currentInput = model.renderable.getCurrentImage();
    if (!model.currentInput) {
      vtkErrorMacro('No input!');
      return;
    }

    publicAPI.prepareToDraw(model.WebGPURenderer.getRenderEncoder());
    model.renderEncoder.registerDrawCallback(model.pipeline, publicAPI.draw);
  };

  publicAPI.getCoincidentParameters = () => {
    if (
      // backwards compat with code that (errorneously) set this to boolean
      // eslint-disable-next-line eqeqeq
      model.renderable.getResolveCoincidentTopology() == Resolve.PolygonOffset
    ) {
      return model.renderable.getCoincidentTopologyPolygonOffsetParameters();
    }

    return {
      factor: 0.0,
      offset: 0.0,
    };
  };

  publicAPI.computePipelineHash = () => {
    const ext = model.currentInput.getExtent();
    const imageState = publicAPI.getImageState();
    if (ext[0] === ext[1] || ext[2] === ext[3] || ext[4] === ext[5]) {
      model.dimensions = 2;
      model.pipelineHash = 'img2';
    } else {
      model.dimensions = 3;
      model.pipelineHash = 'img3';
    }
    model.pipelineHash += imageState.textureChannelMode;
    if (imageState.useLabelOutline) {
      model.pipelineHash += 'outline';
    }
    model.pipelineHash += model.renderEncoder.getPipelineHash();
  };

  publicAPI.updateUBO = () => {
    const utime = model.UBO.getSendTime();
    const actor = model.WebGPUImageSlice.getRenderable();
    const volMapr = actor.getMapper();
    const clippingPlanesMTime = model.renderable.getClippingPlanesMTime();
    if (
      publicAPI.getMTime() > utime ||
      model.renderable.getMTime() > utime ||
      actor.getProperty().getMTime() > utime ||
      clippingPlanesMTime > utime
    ) {
      // compute the SCTCMatrix
      const image = volMapr.getCurrentImage();
      const center = model.WebGPURenderer.getStabilizedCenterByReference();

      mat4.identity(tmpMat4);
      mat4.translate(tmpMat4, tmpMat4, center);
      // tmpMat4 is now SC->World

      const mcwcmat = actor.getMatrix();
      mat4.transpose(tmp2Mat4, mcwcmat);
      mat4.invert(tmp2Mat4, tmp2Mat4);
      // tmp2Mat4 is now world to model

      mat4.multiply(tmpMat4, tmp2Mat4, tmpMat4);
      // tmp4Mat is now SC->Model

      // the method on the data is world to index but the volume is in
      // model coordinates so really in this context it is model to index
      const modelToIndex = image.getWorldToIndex();
      mat4.multiply(tmpMat4, modelToIndex, tmpMat4);
      // tmpMat4 is now SC -> Index, save this as we need it later
      mat4.invert(tmp3Mat4, tmpMat4);

      // need translation and scale
      tmpTranslate3[0] = 0.5;
      tmpTranslate3[1] = 0.5;
      tmpTranslate3[2] = 0.5;
      mat4.fromTranslation(tmp2Mat4, tmpTranslate3);
      mat4.multiply(tmpMat4, tmp2Mat4, tmpMat4);

      const dims = image.getDimensions();
      mat4.identity(tmp2Mat4);
      tmpScale3[0] = 1.0 / dims[0];
      tmpScale3[1] = 1.0 / dims[1];
      tmpScale3[2] = 1.0 / dims[2];
      mat4.scale(tmp2Mat4, tmp2Mat4, tmpScale3);
      mat4.multiply(tmpMat4, tmp2Mat4, tmpMat4);
      // tmpMat4 is now SC -> Tcoord

      model.UBO.setArray('SCTCMatrix', tmpMat4);

      // need to compute the plane here in world coordinates
      // then pass that down in the UBO
      const ext = model.currentInput.getExtent();

      // Find what IJK axis and what direction to slice along
      const { ijkMode } = model.renderable.getClosestIJKAxis();

      // Find the IJK slice
      let nSlice = model.renderable.getSlice();
      if (ijkMode !== model.renderable.getSlicingMode()) {
        // If not IJK slicing, get the IJK slice from the XYZ position/slice
        nSlice = model.renderable.getSliceAtPosition(nSlice);
      }

      let axis0 = 2;
      let axis1 = 0;
      let axis2 = 1;
      if (ijkMode === SlicingMode.I) {
        axis0 = 0;
        axis1 = 1;
        axis2 = 2;
      } else if (ijkMode === SlicingMode.J) {
        axis0 = 1;
        axis1 = 2;
        axis2 = 0;
      }

      ptsArray1[axis0] = nSlice;
      ptsArray1[axis1] = ext[axis1 * 2] - 0.5;
      ptsArray1[axis2] = ext[axis2 * 2] - 0.5;
      ptsArray1[3] = 1.0;
      vec4.transformMat4(ptsArray1, ptsArray1, tmp3Mat4);
      model.UBO.setArray('Origin', ptsArray1);

      ptsArray2[axis0] = nSlice;
      ptsArray2[axis1] = ext[axis1 * 2 + 1] + 0.5;
      ptsArray2[axis2] = ext[axis2 * 2] - 0.5;
      ptsArray2[3] = 1.0;
      vec4.transformMat4(ptsArray2, ptsArray2, tmp3Mat4);
      vec4.subtract(ptsArray2, ptsArray2, ptsArray1);
      ptsArray2[3] = 1.0;
      model.UBO.setArray('Axis1', ptsArray2);

      ptsArray2[axis0] = nSlice;
      ptsArray2[axis1] = ext[axis1 * 2] - 0.5;
      ptsArray2[axis2] = ext[axis2 * 2 + 1] + 0.5;
      ptsArray2[3] = 1.0;
      vec4.transformMat4(ptsArray2, ptsArray2, tmp3Mat4);
      vec4.subtract(ptsArray2, ptsArray2, ptsArray1);
      ptsArray2[3] = 1.0;
      model.UBO.setArray('Axis2', ptsArray2);

      // three levels of shift scale combined into one
      // for performance in the fragment shader
      const { cScale, cShift, oScale, oShift, componentWeight } = model;
      cScale[0] = 1.0;
      cScale[1] = 1.0;
      cScale[2] = 1.0;
      cScale[3] = 1.0;
      cShift[0] = 0.0;
      cShift[1] = 0.0;
      cShift[2] = 0.0;
      cShift[3] = 0.0;
      oScale[0] = 1.0;
      oScale[1] = 1.0;
      oScale[2] = 1.0;
      oScale[3] = 1.0;
      oShift[0] = 0.0;
      oShift[1] = 0.0;
      oShift[2] = 0.0;
      oShift[3] = 0.0;
      componentWeight[0] = 1.0;
      componentWeight[1] = 1.0;
      componentWeight[2] = 1.0;
      componentWeight[3] = 1.0;
      const tView = model.textureViews[0];
      const tScale = tView.getTexture().getScale();
      const imageState = publicAPI.getImageState();
      const { numberOfComponents: numComp, independentComponents: iComps } =
        imageState;
      const ppty = actor.getProperty();
      for (let i = 0; i < numComp; i++) {
        let cw = ppty.getColorWindow();
        let cl = ppty.getColorLevel();

        const target = iComps ? i : 0;
        const cfun = ppty.getRGBTransferFunction(target);
        if (cfun && ppty.getUseLookupTableScalarRange()) {
          const cRange = cfun.getRange();
          cw = cRange[1] - cRange[0];
          cl = 0.5 * (cRange[1] + cRange[0]);
        }

        cScale[i] = tScale / cw;
        cShift[i] = -cl / cw + 0.5;

        let opacityScale = 1.0;
        let opacityShift = 0.0;
        const pwfun = ppty.getPiecewiseFunction(target);
        if (pwfun) {
          const pwfRange = pwfun.getRange();
          const length = pwfRange[1] - pwfRange[0];
          const mid = 0.5 * (pwfRange[0] + pwfRange[1]);
          opacityScale = tScale / length;
          opacityShift = -mid / length + 0.5;
        }
        oScale[i] = opacityScale;
        oShift[i] = opacityShift;
        componentWeight[i] = ppty.getComponentWeight(i);
      }
      model.UBO.setArray('cScale', cScale);
      model.UBO.setArray('cShift', cShift);
      model.UBO.setArray('oScale', oScale);
      model.UBO.setArray('oShift', oShift);
      model.UBO.setArray('componentWeight', componentWeight);
      model.UBO.setValue('Opacity', ppty.getOpacity());
      const cp = publicAPI.getCoincidentParameters();
      model.UBO.setValue('CoincidentFactor', cp.factor);
      model.UBO.setValue('CoincidentOffset', cp.offset);
      model.UBO.setValue('NumClipPlanes', 0);

      const numClipPlanes = model.renderable.getClippingPlanes().length;
      model.UBO.setValue('NumClipPlanes', numClipPlanes);

      if (numClipPlanes > 0) {
        mat4.fromTranslation(tmp2Mat4, [-center[0], -center[1], -center[2]]);
        getClippingPlaneEquationsInCoords(
          model.renderable,
          tmp2Mat4,
          model.clipPlanes
        );
        for (let i = 0; i < numClipPlanes; i++) {
          model.UBO.setArray(`ClipPlane${i}`, model.clipPlanes[i]);
        }
      }

      model.UBO.sendIfNeeded(model.device);
    }
  };

  publicAPI.updateLUTImage = () => {
    const imageState = publicAPI.getImageState();
    const { actorProperty } = imageState;
    const numIComps = imageState.numberOfIComponents;

    const cfunToString = computeFnToString(
      actorProperty,
      actorProperty.getRGBTransferFunction,
      numIComps
    );

    if (model.colorTextureString !== cfunToString) {
      model.numRows = numIComps;
      const colorSize = model.numRows * 2 * model.rowLength * 4;
      if (!model.colorLUTArray || model.colorLUTArray.length !== colorSize) {
        model.colorLUTArray = new Uint8ClampedArray(colorSize);
      }
      const colorArray = model.colorLUTArray;

      let cfun = actorProperty.getRGBTransferFunction();
      if (cfun) {
        const tmpTable = model.colorTmpTable;

        for (let c = 0; c < numIComps; c++) {
          cfun = actorProperty.getRGBTransferFunction(c);
          const cRange = cfun.getRange();
          cfun.getTable(cRange[0], cRange[1], model.rowLength, tmpTable, 1);
          for (let i = 0; i < model.rowLength; i++) {
            const idx = c * model.rowLength * 8 + i * 4;
            colorArray[idx] = 255.0 * tmpTable[i * 3];
            colorArray[idx + 1] = 255.0 * tmpTable[i * 3 + 1];
            colorArray[idx + 2] = 255.0 * tmpTable[i * 3 + 2];
            colorArray[idx + 3] = 255.0;
            // Duplicate each LUT row so the shader can address its center
            // with linear sampling without bleeding into the next component row.
            for (let j = 0; j < 4; j++) {
              colorArray[idx + model.rowLength * 4 + j] = colorArray[idx + j];
            }
          }
        }
      } else {
        for (let i = 0; i < model.rowLength; ++i) {
          const grey = (255.0 * i) / (model.rowLength - 1);
          colorArray[i * 4] = grey;
          colorArray[i * 4 + 1] = grey;
          colorArray[i * 4 + 2] = grey;
          colorArray[i * 4 + 3] = 255.0;
          for (let j = 0; j < 4; j++) {
            colorArray[i * 4 + model.rowLength * 4 + j] = colorArray[i * 4 + j];
          }
        }
      }

      {
        const treq = {
          nativeArray: colorArray,
          width: model.rowLength,
          height: model.numRows * 2,
          depth: 1,
          format: 'rgba8unorm',
        };
        const newTex = model.device.getTextureManager().getTexture(treq);
        const tview = newTex.createView('tfunTexture');
        publicAPI.ensureTextureSampler(tview, {
          minFilter: 'linear',
          magFilter: 'linear',
        });
        model.textureViews[TextureSlot.COLOR_LUT] = tview;
      }

      model.colorTextureString = cfunToString;
    }
  };

  publicAPI.updateOpacityLUTImage = () => {
    const imageState = publicAPI.getImageState();
    const { actorProperty } = imageState;
    const numIComps = imageState.numberOfIComponents;
    model.numRows = numIComps;
    const pwfunToString = computeFnToString(
      actorProperty,
      actorProperty.getPiecewiseFunction,
      numIComps
    );

    if (model.opacityTextureString !== pwfunToString) {
      const opacitySize = model.numRows * 2 * model.rowLength;
      if (
        !model.opacityLUTArray ||
        model.opacityLUTArray.length !== opacitySize
      ) {
        model.opacityLUTArray = new Float32Array(opacitySize);
      }
      const opacityArray = model.opacityLUTArray;
      const tmpTable = model.opacityTmpTable;

      for (let c = 0; c < numIComps; c++) {
        const pwfun = actorProperty.getPiecewiseFunction(c);
        if (!pwfun) {
          const offset = c * model.rowLength * 2;
          opacityArray.fill(1.0, offset, offset + model.rowLength * 2);
          // eslint-disable-next-line no-continue
          continue;
        }

        const pwfRange = pwfun.getRange();
        pwfun.getTable(pwfRange[0], pwfRange[1], model.rowLength, tmpTable, 1);
        const offset = c * model.rowLength * 2;
        for (let i = 0; i < model.rowLength; i++) {
          opacityArray[offset + i] = tmpTable[i];
          // Duplicate each LUT row so the shader can address its center
          // with linear sampling without bleeding into the next component row.
          opacityArray[offset + model.rowLength + i] = tmpTable[i];
        }
      }

      const treq = {
        nativeArray: opacityArray,
        width: model.rowLength,
        height: model.numRows * 2,
        depth: 1,
        format: 'r16float',
      };
      const newTex = model.device.getTextureManager().getTexture(treq);
      const tview = newTex.createView('ofunTexture');
      publicAPI.ensureTextureSampler(tview, {
        minFilter: 'linear',
        magFilter: 'linear',
      });
      model.textureViews[TextureSlot.OPACITY_LUT] = tview;

      model.opacityTextureString = pwfunToString;
    }
  };

  publicAPI.updateLabelOutlineThicknessTexture = () => {
    const actorProperty = model.WebGPUImageSlice.getRenderable().getProperty();
    const labelOutlineThicknessArray =
      actorProperty.getLabelOutlineThicknessByReference();
    const lWidth = Math.max(1, model.renderable.getLabelOutlineTextureWidth());
    const outlineHash = `${labelOutlineThicknessArray.join('-')}-${lWidth}`;

    if (model.labelOutlineThicknessString !== outlineHash) {
      const outlineArray = new Uint8Array(lWidth);

      for (let i = 0; i < lWidth; ++i) {
        // Undefined entries fall back to segment 0, matching the OpenGL path.
        const thickness =
          typeof labelOutlineThicknessArray[i] !== 'undefined'
            ? labelOutlineThicknessArray[i]
            : labelOutlineThicknessArray[0];
        outlineArray[i] = thickness;
      }

      const treq = {
        nativeArray: outlineArray,
        width: lWidth,
        height: 1,
        depth: 1,
        format: 'r8unorm',
      };
      const newTex = model.device.getTextureManager().getTexture(treq);
      const tview = newTex.createView('labelOutlineTexture');
      publicAPI.ensureTextureSampler(tview, {
        minFilter: 'nearest',
        magFilter: 'nearest',
      });
      model.textureViews[TextureSlot.LABEL_OUTLINE_THICKNESS] = tview;
      model.labelOutlineThicknessString = outlineHash;
    }
  };

  publicAPI.updateLabelOutlineOpacityTexture = () => {
    const actorProperty = model.WebGPUImageSlice.getRenderable().getProperty();
    const labelOutlineOpacity = actorProperty.getLabelOutlineOpacity();
    const values = Array.isArray(labelOutlineOpacity)
      ? labelOutlineOpacity
      : [labelOutlineOpacity];
    const lWidth = Math.max(1, model.renderable.getLabelOutlineTextureWidth());
    const outlineHash = `${values.join('-')}-${lWidth}`;

    if (model.labelOutlineOpacityString !== outlineHash) {
      const outlineArray = new Float32Array(lWidth);

      for (let i = 0; i < lWidth; ++i) {
        // Undefined entries fall back to segment 0, matching the OpenGL path.
        outlineArray[i] = values[i] ?? values[0];
      }

      const treq = {
        nativeArray: outlineArray,
        width: lWidth,
        height: 1,
        depth: 1,
        format: 'r16float',
      };
      const newTex = model.device.getTextureManager().getTexture(treq);
      const tview = newTex.createView('labelOutlineOpacityTexture');
      publicAPI.ensureTextureSampler(tview, {
        minFilter: 'nearest',
        magFilter: 'nearest',
      });
      model.textureViews[TextureSlot.LABEL_OUTLINE_OPACITY] = tview;
      model.labelOutlineOpacityString = outlineHash;
    }
  };

  const superClassUpdateBuffers = publicAPI.updateBuffers;
  publicAPI.updateBuffers = () => {
    superClassUpdateBuffers();
    const newTex = model.device
      .getTextureManager()
      .getTextureForImageData(model.currentInput);
    const tViews = model.textureViews;

    if (
      !tViews[TextureSlot.IMAGE] ||
      tViews[TextureSlot.IMAGE].getTexture() !== newTex
    ) {
      const tview = newTex.createView('imgTexture');
      publicAPI.ensureTextureSampler(tview, {
        minFilter: 'linear',
        magFilter: 'linear',
      });
      tViews[TextureSlot.IMAGE] = tview;
    }

    model.imageState = publicAPI.computeImageState();

    publicAPI.updateLUTImage();
    publicAPI.updateOpacityLUTImage();
    if (model.imageState.useLabelOutline) {
      publicAPI.updateLabelOutlineThicknessTexture();
      publicAPI.updateLabelOutlineOpacityTexture();
    } else {
      model.textureViews.length = Math.min(
        model.textureViews.length,
        TextureSlot.OPACITY_LUT + 1
      );
    }
    publicAPI.updateUBO();

    // set interpolation on the texture based on property setting
    const ppty = model.WebGPUImageSlice.getRenderable().getProperty();
    const iType =
      ppty.getInterpolationType() === InterpolationType.NEAREST
        ? 'nearest'
        : 'linear';

    publicAPI.ensureTextureSampler(tViews[TextureSlot.IMAGE], {
      minFilter: iType,
      magFilter: iType,
    });
  };

  const sr = publicAPI.getShaderReplacements();

  publicAPI.replaceShaderPosition = (hash, pipeline, vertexInput) => {
    const vDesc = pipeline.getShaderDescription('vertex');
    vDesc.addBuiltinOutput('vec4<f32>', '@builtin(position) Position');
    vDesc.addOutput('vec4<f32>', 'vertexSC');
    let code = vDesc.getCode();
    const lines = [
      'var pos: vec4<f32> = mapperUBO.Origin +',
      '   (vertexBC.x * 0.5 + 0.5) * mapperUBO.Axis1 + (vertexBC.y * 0.5 + 0.5) * mapperUBO.Axis2;',
      'pos.w = 1.0;',
    ];
    if (model.dimensions === 2) {
      lines.push('var tcoord : vec2<f32> = (mapperUBO.SCTCMatrix * pos).xy;');
    } else {
      lines.push('var tcoord : vec3<f32> = (mapperUBO.SCTCMatrix * pos).xyz;');
    }
    lines.push(
      'pos = rendererUBO.SCPCMatrix * pos;',
      // Match the OpenGL coincident topology constant offset scale (~1 / 2^16 = 0.000016)
      'pos.z = clamp(pos.z - 0.000016 * mapperUBO.CoincidentOffset * pos.w, 0.0, pos.w);',
      'output.tcoordVS = tcoord;',
      'output.vertexSC = pos;',
      'output.Position = rendererUBO.SCPCMatrix * pos;'
    );
    code = vtkWebGPUShaderCache.substitute(
      code,
      '//VTK::Position::Impl',
      lines
    ).result;
    vDesc.setCode(code);
  };
  sr.set('replaceShaderPosition', publicAPI.replaceShaderPosition);

  publicAPI.replaceShaderTCoord = (hash, pipeline, vertexInput) => {
    const vDesc = pipeline.getShaderDescription('vertex');
    if (model.dimensions === 2) {
      vDesc.addOutput('vec2<f32>', 'tcoordVS');
    } else {
      vDesc.addOutput('vec3<f32>', 'tcoordVS');
    }
  };
  sr.set('replaceShaderTCoord', publicAPI.replaceShaderTCoord);

  publicAPI.replaceShaderImage = (hash, pipeline, vertexInput) => {
    const fDesc = pipeline.getShaderDescription('fragment');
    let code = fDesc.getCode();
    const imageState = publicAPI.getImageState();

    code = vtkWebGPUShaderCache.substitute(code, '//VTK::Image::Sample', [
      `    var computedColor: vec4<f32> =`,
      `      textureSampleLevel(imgTexture, imgTextureSampler, input.tcoordVS, 0.0);`,
      `//VTK::Image::Sample`,
    ]).result;

    switch (imageState.textureChannelMode) {
      case TextureChannelMode.SINGLE:
        if (imageState.useLabelOutline) {
          const outlineLines =
            model.dimensions === 3
              ? [
                  '    let centerCoord: vec3<f32> = input.tcoordVS;',
                  '    let stepX: vec3<f32> = dpdx(input.tcoordVS);',
                  '    let stepY: vec3<f32> = dpdy(input.tcoordVS);',
                  '    let clampMin: vec3<f32> = vec3<f32>(0.0);',
                  '    let clampMax: vec3<f32> = vec3<f32>(1.0);',
                ]
              : [
                  '    let centerCoord: vec2<f32> = input.tcoordVS;',
                  '    let stepX: vec2<f32> = dpdx(input.tcoordVS);',
                  '    let stepY: vec2<f32> = dpdy(input.tcoordVS);',
                  '    let clampMin: vec2<f32> = vec2<f32>(0.0);',
                  '    let clampMax: vec2<f32> = vec2<f32>(1.0);',
                ];
          code = vtkWebGPUShaderCache.substitute(code, '//VTK::Image::Sample', [
            ...outlineLines,
            '    let centerValue: f32 = textureSampleLevel(',
            '      imgTexture,',
            '      imgTextureSampler,',
            '      centerCoord,',
            '      0.0).r;',
            '    let segmentIndex: i32 = i32(round(centerValue * 255.0));',
            '    if (segmentIndex == 0) {',
            '      computedColor = vec4<f32>(0.0);',
            '    } else {',
            '      let colorCoord: vec2<f32> = vec2<f32>(',
            '        centerValue * mapperUBO.cScale.r + mapperUBO.cShift.r,',
            '        0.5);',
            '      let tColor: vec4<f32> =',
            '        textureSampleLevel(tfunTexture, tfunTextureSampler, colorCoord, 0.0);',
            '      let opacityCoord: vec2<f32> = vec2<f32>(',
            '        centerValue * mapperUBO.oScale.r + mapperUBO.oShift.r,',
            '        0.5);',
            '      let scalarOpacity: f32 =',
            '        textureSampleLevel(ofunTexture, ofunTextureSampler, opacityCoord, 0.0).r;',
            '      let outlineWidth: i32 = i32(textureDimensions(labelOutlineTexture).x);',
            '      let outlineIndex: i32 = clamp(segmentIndex - 1, 0, outlineWidth - 1);',
            '      let outlineCoord: vec2<f32> = vec2<f32>(',
            '        (f32(outlineIndex) + 0.5) / f32(outlineWidth),',
            '        0.5);',
            '      let thicknessValue: f32 = textureSampleLevel(',
            '        labelOutlineTexture,',
            '        labelOutlineTextureSampler,',
            '        outlineCoord,',
            '        0.0).r;',
            '      let outlineOpacity: f32 = textureSampleLevel(',
            '        labelOutlineOpacityTexture,',
            '        labelOutlineOpacityTextureSampler,',
            '        outlineCoord,',
            '        0.0).r;',
            '      let actualThickness: i32 = i32(round(thicknessValue * 255.0));',
            '      var pixelOnBorder: bool = false;',
            '      if (actualThickness > 0) {',
            '        for (var i: i32 = -actualThickness; i <= actualThickness; i++) {',
            '          for (var j: i32 = -actualThickness; j <= actualThickness; j++) {',
            '            if (i == 0 && j == 0) {',
            '              continue;',
            '            }',
            '            let neighborCoord = clamp(',
            '              centerCoord + f32(i) * stepX + f32(j) * stepY,',
            '              clampMin,',
            '              clampMax);',
            '            let neighborValue: f32 = textureSampleLevel(',
            '              imgTexture,',
            '              imgTextureSampler,',
            '              neighborCoord,',
            '              0.0).r;',
            '            if (neighborValue != centerValue) {',
            '              pixelOnBorder = true;',
            '              break;',
            '            }',
            '          }',
            '          if (pixelOnBorder) {',
            '            break;',
            '          }',
            '        }',
            '      }',
            '      if (pixelOnBorder) {',
            '        computedColor = vec4<f32>(tColor.rgb, outlineOpacity);',
            '      } else {',
            '        computedColor = vec4<f32>(',
            '          tColor.rgb,',
            '          scalarOpacity * mapperUBO.Opacity);',
            '      }',
            '    }',
          ]).result;
        } else {
          code = vtkWebGPUShaderCache.substitute(code, '//VTK::Image::Sample', [
            '    let scalar: f32 = computedColor.r;',
            '    var colorCoord: vec2<f32> =',
            '      vec2<f32>(scalar * mapperUBO.cScale.r + mapperUBO.cShift.r, 0.5);',
            '    let tColor: vec4<f32> =',
            '      textureSampleLevel(tfunTexture, tfunTextureSampler, colorCoord, 0.0);',
            '    var opacityCoord: vec2<f32> =',
            '      vec2<f32>(scalar * mapperUBO.oScale.r + mapperUBO.oShift.r, 0.5);',
            '    let scalarOpacity: f32 =',
            '      textureSampleLevel(ofunTexture, ofunTextureSampler, opacityCoord, 0.0).r;',
            '    computedColor = vec4<f32>(tColor.rgb, scalarOpacity * mapperUBO.Opacity);',
          ]).result;
        }
        break;
      case TextureChannelMode.INDEPENDENT_1:
        code = vtkWebGPUShaderCache.substitute(code, '//VTK::Image::Sample', [
          '    let tfunRows: f32 = f32(textureDimensions(tfunTexture).y);',
          '    let scalar: f32 = computedColor.r;',
          `    let rowCoord: f32 = ${getLUTRowCenterExpression(0)};`,
          '    let colorCoord: vec2<f32> =',
          '      vec2<f32>(scalar * mapperUBO.cScale.r + mapperUBO.cShift.r, rowCoord);',
          '    let tColor: vec4<f32> =',
          '      textureSampleLevel(tfunTexture, tfunTextureSampler, colorCoord, 0.0);',
          '    computedColor = vec4<f32>(',
          '      tColor.rgb * mapperUBO.componentWeight.r,',
          '      mapperUBO.Opacity);',
        ]).result;
        break;
      case TextureChannelMode.INDEPENDENT_2:
        code = vtkWebGPUShaderCache.substitute(code, '//VTK::Image::Sample', [
          '    let tfunRows: f32 = f32(textureDimensions(tfunTexture).y);',
          '    // Independent component LUT rows are duplicated, so sample the',
          '    // center of row 2 * componentIndex for each component.',
          '    let rawColor: vec4<f32> = computedColor;',
          `    let rowCoord0: f32 = ${getLUTRowCenterExpression(0)};`,
          `    let rowCoord1: f32 = ${getLUTRowCenterExpression(1)};`,
          '    let scalar0: f32 = rawColor.r;',
          '    let scalar1: f32 = rawColor.g;',
          '    let color0: vec3<f32> = mapperUBO.componentWeight.r *',
          '      textureSampleLevel(',
          '        tfunTexture,',
          '        tfunTextureSampler,',
          '        vec2<f32>(scalar0 * mapperUBO.cScale.r + mapperUBO.cShift.r, rowCoord0),',
          '        0.0).rgb;',
          '    let color1: vec3<f32> = mapperUBO.componentWeight.g *',
          '      textureSampleLevel(',
          '        tfunTexture,',
          '        tfunTextureSampler,',
          '        vec2<f32>(scalar1 * mapperUBO.cScale.g + mapperUBO.cShift.g, rowCoord1),',
          '        0.0).rgb;',
          '    let weight0: f32 = mapperUBO.componentWeight.r *',
          '      textureSampleLevel(',
          '        ofunTexture,',
          '        ofunTextureSampler,',
          '        vec2<f32>(scalar0 * mapperUBO.oScale.r + mapperUBO.oShift.r, rowCoord0),',
          '        0.0).r;',
          '    let weight1: f32 = mapperUBO.componentWeight.g *',
          '      textureSampleLevel(',
          '        ofunTexture,',
          '        ofunTextureSampler,',
          '        vec2<f32>(scalar1 * mapperUBO.oScale.g + mapperUBO.oShift.g, rowCoord1),',
          '        0.0).r;',
          '    let weightSum: f32 = max(weight0 + weight1, 1.0e-6);',
          '    computedColor = vec4<f32>(',
          '      color0 * (weight0 / weightSum) + color1 * (weight1 / weightSum),',
          '      mapperUBO.Opacity);',
        ]).result;
        break;
      case TextureChannelMode.INDEPENDENT_3:
        code = vtkWebGPUShaderCache.substitute(code, '//VTK::Image::Sample', [
          '    let tfunRows: f32 = f32(textureDimensions(tfunTexture).y);',
          '    let rawColor: vec4<f32> = computedColor;',
          `    let rowCoord0: f32 = ${getLUTRowCenterExpression(0)};`,
          `    let rowCoord1: f32 = ${getLUTRowCenterExpression(1)};`,
          `    let rowCoord2: f32 = ${getLUTRowCenterExpression(2)};`,
          '    let scalar0: f32 = rawColor.r;',
          '    let scalar1: f32 = rawColor.g;',
          '    let scalar2: f32 = rawColor.b;',
          '    let color0: vec3<f32> = mapperUBO.componentWeight.r *',
          '      textureSampleLevel(',
          '        tfunTexture,',
          '        tfunTextureSampler,',
          '        vec2<f32>(scalar0 * mapperUBO.cScale.r + mapperUBO.cShift.r, rowCoord0),',
          '        0.0).rgb;',
          '    let color1: vec3<f32> = mapperUBO.componentWeight.g *',
          '      textureSampleLevel(',
          '        tfunTexture,',
          '        tfunTextureSampler,',
          '        vec2<f32>(scalar1 * mapperUBO.cScale.g + mapperUBO.cShift.g, rowCoord1),',
          '        0.0).rgb;',
          '    let color2: vec3<f32> = mapperUBO.componentWeight.b *',
          '      textureSampleLevel(',
          '        tfunTexture,',
          '        tfunTextureSampler,',
          '        vec2<f32>(scalar2 * mapperUBO.cScale.b + mapperUBO.cShift.b, rowCoord2),',
          '        0.0).rgb;',
          '    let weight0: f32 = mapperUBO.componentWeight.r *',
          '      textureSampleLevel(',
          '        ofunTexture,',
          '        ofunTextureSampler,',
          '        vec2<f32>(scalar0 * mapperUBO.oScale.r + mapperUBO.oShift.r, rowCoord0),',
          '        0.0).r;',
          '    let weight1: f32 = mapperUBO.componentWeight.g *',
          '      textureSampleLevel(',
          '        ofunTexture,',
          '        ofunTextureSampler,',
          '        vec2<f32>(scalar1 * mapperUBO.oScale.g + mapperUBO.oShift.g, rowCoord1),',
          '        0.0).r;',
          '    let weight2: f32 = mapperUBO.componentWeight.b *',
          '      textureSampleLevel(',
          '        ofunTexture,',
          '        ofunTextureSampler,',
          '        vec2<f32>(scalar2 * mapperUBO.oScale.b + mapperUBO.oShift.b, rowCoord2),',
          '        0.0).r;',
          '    let weightSum: f32 = max(weight0 + weight1 + weight2, 1.0e-6);',
          '    computedColor = vec4<f32>(',
          '      color0 * (weight0 / weightSum) + color1 * (weight1 / weightSum) + color2 * (weight2 / weightSum),',
          '      mapperUBO.Opacity);',
        ]).result;
        break;
      case TextureChannelMode.INDEPENDENT_4:
        code = vtkWebGPUShaderCache.substitute(code, '//VTK::Image::Sample', [
          '    let tfunRows: f32 = f32(textureDimensions(tfunTexture).y);',
          '    let rawColor: vec4<f32> = computedColor;',
          `    let rowCoord0: f32 = ${getLUTRowCenterExpression(0)};`,
          `    let rowCoord1: f32 = ${getLUTRowCenterExpression(1)};`,
          `    let rowCoord2: f32 = ${getLUTRowCenterExpression(2)};`,
          `    let rowCoord3: f32 = ${getLUTRowCenterExpression(3)};`,
          '    let scalar0: f32 = rawColor.r;',
          '    let scalar1: f32 = rawColor.g;',
          '    let scalar2: f32 = rawColor.b;',
          '    let scalar3: f32 = rawColor.a;',
          '    let color0: vec3<f32> = mapperUBO.componentWeight.r *',
          '      textureSampleLevel(',
          '        tfunTexture,',
          '        tfunTextureSampler,',
          '        vec2<f32>(scalar0 * mapperUBO.cScale.r + mapperUBO.cShift.r, rowCoord0),',
          '        0.0).rgb;',
          '    let color1: vec3<f32> = mapperUBO.componentWeight.g *',
          '      textureSampleLevel(',
          '        tfunTexture,',
          '        tfunTextureSampler,',
          '        vec2<f32>(scalar1 * mapperUBO.cScale.g + mapperUBO.cShift.g, rowCoord1),',
          '        0.0).rgb;',
          '    let color2: vec3<f32> = mapperUBO.componentWeight.b *',
          '      textureSampleLevel(',
          '        tfunTexture,',
          '        tfunTextureSampler,',
          '        vec2<f32>(scalar2 * mapperUBO.cScale.b + mapperUBO.cShift.b, rowCoord2),',
          '        0.0).rgb;',
          '    let color3: vec3<f32> = mapperUBO.componentWeight.a *',
          '      textureSampleLevel(',
          '        tfunTexture,',
          '        tfunTextureSampler,',
          '        vec2<f32>(scalar3 * mapperUBO.cScale.a + mapperUBO.cShift.a, rowCoord3),',
          '        0.0).rgb;',
          '    let weight0: f32 = mapperUBO.componentWeight.r *',
          '      textureSampleLevel(',
          '        ofunTexture,',
          '        ofunTextureSampler,',
          '        vec2<f32>(scalar0 * mapperUBO.oScale.r + mapperUBO.oShift.r, rowCoord0),',
          '        0.0).r;',
          '    let weight1: f32 = mapperUBO.componentWeight.g *',
          '      textureSampleLevel(',
          '        ofunTexture,',
          '        ofunTextureSampler,',
          '        vec2<f32>(scalar1 * mapperUBO.oScale.g + mapperUBO.oShift.g, rowCoord1),',
          '        0.0).r;',
          '    let weight2: f32 = mapperUBO.componentWeight.b *',
          '      textureSampleLevel(',
          '        ofunTexture,',
          '        ofunTextureSampler,',
          '        vec2<f32>(scalar2 * mapperUBO.oScale.b + mapperUBO.oShift.b, rowCoord2),',
          '        0.0).r;',
          '    let weight3: f32 = mapperUBO.componentWeight.a *',
          '      textureSampleLevel(',
          '        ofunTexture,',
          '        ofunTextureSampler,',
          '        vec2<f32>(scalar3 * mapperUBO.oScale.a + mapperUBO.oShift.a, rowCoord3),',
          '        0.0).r;',
          '    let weightSum: f32 = max(weight0 + weight1 + weight2 + weight3, 1.0e-6);',
          '    computedColor = vec4<f32>(',
          '      color0 * (weight0 / weightSum) + color1 * (weight1 / weightSum) + color2 * (weight2 / weightSum) + color3 * (weight3 / weightSum),',
          '      mapperUBO.Opacity);',
        ]).result;
        break;
      case TextureChannelMode.DEPENDENT_LA:
        code = vtkWebGPUShaderCache.substitute(code, '//VTK::Image::Sample', [
          '    let rawColor: vec4<f32> = computedColor;',
          '    let intensity: f32 = rawColor.r * mapperUBO.cScale.r + mapperUBO.cShift.r;',
          '    let tColor: vec4<f32> =',
          '      textureSampleLevel(tfunTexture, tfunTextureSampler, vec2<f32>(intensity, 0.5), 0.0);',
          '    computedColor = vec4<f32>(',
          '      tColor.rgb,',
          '      rawColor.g * mapperUBO.oScale.r + mapperUBO.oShift.r);',
        ]).result;
        break;
      case TextureChannelMode.DEPENDENT_RGB:
        code = vtkWebGPUShaderCache.substitute(code, '//VTK::Image::Sample', [
          '    let rawColor: vec4<f32> =',
          '      computedColor * vec4<f32>(mapperUBO.cScale.x) + vec4<f32>(mapperUBO.cShift.x);',
          '    computedColor = vec4<f32>(',
          '      textureSampleLevel(tfunTexture, tfunTextureSampler, vec2<f32>(rawColor.r, 0.5), 0.0).r,',
          '      textureSampleLevel(tfunTexture, tfunTextureSampler, vec2<f32>(rawColor.g, 0.5), 0.0).r,',
          '      textureSampleLevel(tfunTexture, tfunTextureSampler, vec2<f32>(rawColor.b, 0.5), 0.0).r,',
          '      mapperUBO.Opacity);',
        ]).result;
        break;
      case TextureChannelMode.DEPENDENT_RGBA:
        code = vtkWebGPUShaderCache.substitute(code, '//VTK::Image::Sample', [
          '    let rawColor: vec4<f32> =',
          '      computedColor * vec4<f32>(mapperUBO.cScale.x) + vec4<f32>(mapperUBO.cShift.x);',
          '    computedColor = vec4<f32>(',
          '      textureSampleLevel(tfunTexture, tfunTextureSampler, vec2<f32>(rawColor.r, 0.5), 0.0).r,',
          '      textureSampleLevel(tfunTexture, tfunTextureSampler, vec2<f32>(rawColor.g, 0.5), 0.0).r,',
          '      textureSampleLevel(tfunTexture, tfunTextureSampler, vec2<f32>(rawColor.b, 0.5), 0.0).r,',
          '      rawColor.a);',
        ]).result;
        break;
      default:
        code = vtkWebGPUShaderCache.substitute(code, '//VTK::Image::Sample', [
          '    let scalar: f32 = computedColor.r;',
          '    var colorCoord: vec2<f32> =',
          '      vec2<f32>(scalar * mapperUBO.cScale.r + mapperUBO.cShift.r, 0.5);',
          '    computedColor = textureSampleLevel(tfunTexture, tfunTextureSampler, colorCoord, 0.0);',
        ]).result;
        break;
    }

    fDesc.setCode(code);
  };
  sr.set('replaceShaderImage', publicAPI.replaceShaderImage);

  publicAPI.replaceShaderClip = (hash, pipeline, vertexInput) => {
    const fDesc = pipeline.getShaderDescription('fragment');
    let code = fDesc.getCode();
    const clipPlaneChecks = getClipPlaneShaderChecks({
      countName: 'mapperUBO.NumClipPlanes',
      planePrefix: 'mapperUBO.ClipPlane',
      positionName: 'input.vertexSC',
    });

    code = vtkWebGPUShaderCache.substitute(code, '//VTK::Clip::Impl', [
      ...clipPlaneChecks,
      '//VTK::Clip::Impl',
    ]).result;

    fDesc.setCode(code);
  };
  sr.set('replaceShaderClip', publicAPI.replaceShaderClip);

  publicAPI.replaceShaderCoincidentOffset = (hash, pipeline, vertexInput) => {
    const fDesc = pipeline.getShaderDescription('fragment');
    if (!fDesc) {
      return;
    }

    fDesc.addBuiltinInput('vec4<f32>', '@builtin(position) fragPos');
    fDesc.addBuiltinOutput('f32', '@builtin(frag_depth) fragDepth');

    let code = fDesc.getCode();
    code = vtkWebGPUShaderCache.substitute(code, '//VTK::Position::Impl', [
      '  var coincidentDepth: f32 = input.fragPos.z;',
      '  if (mapperUBO.CoincidentFactor != 0.0) {',
      '    let cscale = length(vec2<f32>(dpdx(input.fragPos.z), dpdy(input.fragPos.z)));',
      '    coincidentDepth = coincidentDepth - mapperUBO.CoincidentFactor * cscale;',
      '  }',
      '  output.fragDepth = clamp(coincidentDepth, 0.0, 1.0);',
    ]).result;
    fDesc.setCode(code);
  };
  sr.set(
    'replaceShaderCoincidentOffset',
    publicAPI.replaceShaderCoincidentOffset
  );
}

// ----------------------------------------------------------------------------
// Object factory
// ----------------------------------------------------------------------------

const DEFAULT_VALUES = {
  imageState: null,
  rowLength: 1024,
};

// ----------------------------------------------------------------------------

export function extend(publicAPI, model, initialValues = {}) {
  Object.assign(model, DEFAULT_VALUES, initialValues);

  // Inheritance
  vtkWebGPUFullScreenQuad.extend(publicAPI, model, initialValues);

  publicAPI.setFragmentShaderTemplate(imgFragTemplate);

  model.UBO = vtkWebGPUUniformBuffer.newInstance({ label: 'mapperUBO' });
  model.UBO.addEntry('SCTCMatrix', 'mat4x4<f32>');
  model.UBO.addEntry('Origin', 'vec4<f32>');
  model.UBO.addEntry('Axis2', 'vec4<f32>');
  model.UBO.addEntry('Axis1', 'vec4<f32>');
  model.UBO.addEntry('cScale', 'vec4<f32>');
  model.UBO.addEntry('cShift', 'vec4<f32>');
  model.UBO.addEntry('oScale', 'vec4<f32>');
  model.UBO.addEntry('oShift', 'vec4<f32>');
  model.UBO.addEntry('componentWeight', 'vec4<f32>');
  model.UBO.addEntry('Opacity', 'f32');
  model.UBO.addEntry('CoincidentFactor', 'f32');
  model.UBO.addEntry('CoincidentOffset', 'f32');
  addClipPlaneEntries(model.UBO, 'ClipPlane');
  model.UBO.addEntry('NumClipPlanes', 'u32');

  model.lutBuildTime = {};
  macro.obj(model.lutBuildTime, { mtime: 0 });

  model.imagemat = mat4.identity(new Float64Array(16));
  model.imagematinv = mat4.identity(new Float64Array(16));
  model.cScale = new Float32Array(4);
  model.cShift = new Float32Array(4);
  model.oScale = new Float32Array(4);
  model.oShift = new Float32Array(4);
  model.componentWeight = new Float32Array(4);
  model.colorTmpTable = new Float32Array(model.rowLength * 3);
  model.opacityTmpTable = new Float32Array(model.rowLength);
  model.colorLUTArray = null;
  model.opacityLUTArray = null;
  model.clipPlanes = Array.from({ length: MAX_CLIPPING_PLANES }, () => [
    0.0, 0.0, 0.0, 0.0,
  ]);

  model.VBOBuildTime = {};
  macro.obj(model.VBOBuildTime);

  // Object methods
  vtkWebGPUImageMapper(publicAPI, model);
}

// ----------------------------------------------------------------------------

export const newInstance = macro.newInstance(extend, 'vtkWebGPUImageMapper');

// ----------------------------------------------------------------------------

export default { newInstance, extend };

// Register ourself to WebGPU backend if imported
registerOverride('vtkAbstractImageMapper', newInstance);
