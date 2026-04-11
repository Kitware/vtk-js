import { mat4, vec4 } from 'gl-matrix';
import Constants from 'vtk.js/Sources/Rendering/Core/ImageMapper/Constants';
import * as macro from 'vtk.js/Sources/macros';
// import vtkDataArray from 'vtk.js/Sources/Common/Core/DataArray';
// import { VtkDataTypes } from 'vtk.js/Sources/Common/Core/DataArray/Constants';
// import * as vtkMath from 'vtk.js/Sources/Common/Core/Math';
import vtkWebGPUShaderCache from 'vtk.js/Sources/Rendering/WebGPU/ShaderCache';
import vtkWebGPUFullScreenQuad from 'vtk.js/Sources/Rendering/WebGPU/FullScreenQuad';
import vtkWebGPUUniformBuffer from 'vtk.js/Sources/Rendering/WebGPU/UniformBuffer';
import vtkWebGPUSampler from 'vtk.js/Sources/Rendering/WebGPU/Sampler';
// import vtkWebGPUTypes from 'vtk.js/Sources/Rendering/WebGPU/Types';

// import { Representation } from 'vtk.js/Sources/Rendering/Core/Property/Constants';
import { Resolve } from 'vtk.js/Sources/Rendering/Core/Mapper/CoincidentTopologyHelper';
import { InterpolationType } from 'vtk.js/Sources/Rendering/Core/ImageProperty/Constants';
import { registerOverride } from 'vtk.js/Sources/Rendering/WebGPU/ViewNodeFactory';

// const { vtkErrorMacro } = macro;
const { SlicingMode } = Constants;

const imgFragTemplate = `
//VTK::Renderer::Dec

//VTK::Mapper::Dec

//VTK::TCoord::Dec

//VTK::Image::Dec

//VTK::RenderEncoder::Dec

//VTK::IOStructs::Dec

@fragment
fn main(
//VTK::IOStructs::Input
)
//VTK::IOStructs::Output
{
  var output: fragmentOutput;

  //VTK::Image::Sample

  // var computedColor: vec4<f32> = vec4<f32>(1.0,0.7, 0.5, 1.0);

  //VTK::Position::Impl

//VTK::RenderEncoder::Impl

  return output;
}
`;

// ----------------------------------------------------------------------------
// helper methods
// ----------------------------------------------------------------------------

const ImageRenderMode = {
  SINGLE: 'single',
  DEPENDENT_LA: 'dependent-la',
  DEPENDENT_RGB: 'dependent-rgb',
  DEPENDENT_RGBA: 'dependent-rgba',
  INDEPENDENT_1: 'independent-1',
  INDEPENDENT_2: 'independent-2',
  INDEPENDENT_3: 'independent-3',
  INDEPENDENT_4: 'independent-4',
};

function getIndependentComponentCount(independentComponents, numberOfComponents) {
  return independentComponents ? numberOfComponents : 1;
}

function getImageRenderMode(independentComponents, numberOfComponents) {
  if (independentComponents) {
    switch (numberOfComponents) {
      case 1:
        return ImageRenderMode.INDEPENDENT_1;
      case 2:
        return ImageRenderMode.INDEPENDENT_2;
      case 3:
        return ImageRenderMode.INDEPENDENT_3;
      default:
        return ImageRenderMode.INDEPENDENT_4;
    }
  }

  switch (numberOfComponents) {
    case 1:
      return ImageRenderMode.SINGLE;
    case 2:
      return ImageRenderMode.DEPENDENT_LA;
    case 3:
      return ImageRenderMode.DEPENDENT_RGB;
    default:
      return ImageRenderMode.DEPENDENT_RGBA;
  }
}

function computeFnToString(property, fn, numberOfComponents) {
  const pwfun = fn.apply(property);
  if (pwfun) {
    const iComps = property.getIndependentComponents();
    return `${property.getMTime()}-${iComps}-${numberOfComponents}`;
  }
  return '0';
}

// ----------------------------------------------------------------------------
// vtkWebGPUImageMapper methods
// ----------------------------------------------------------------------------

const tmpMat4 = new Float64Array(16);
const tmp2Mat4 = new Float64Array(16);
const tmp3Mat4 = new Float64Array(16);
const ptsArray1 = new Float64Array(4);
const ptsArray2 = new Float64Array(4);

function vtkWebGPUImageMapper(publicAPI, model) {
  // Set our className
  model.classHierarchy.push('vtkWebGPUImageMapper');

  publicAPI.getImageState = () => {
    const actorProperty = model.WebGPUImageSlice.getRenderable().getProperty();
    const tView = publicAPI.getTextureViews()[0];
    const numberOfComponents = tView?.getTexture().getNumberOfComponents() ?? 1;
    const independentComponents = actorProperty.getIndependentComponents();
    const numberOfIComponents = getIndependentComponentCount(
      independentComponents,
      numberOfComponents
    );

    return {
      actorProperty,
      numberOfComponents,
      independentComponents,
      numberOfIComponents,
      renderMode: getImageRenderMode(
        independentComponents,
        numberOfComponents
      ),
    };
  };

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

  publicAPI.opaquePass = (prepass) => {
    if (prepass) {
      publicAPI.render();
    }
  };

  publicAPI.render = () => {
    model.renderable.update();

    model.currentInput = model.renderable.getInputData();

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
    model.pipelineHash += imageState.renderMode;
    model.pipelineHash += model.renderEncoder.getPipelineHash();
  };

  publicAPI.updateUBO = () => {
    const utime = model.UBO.getSendTime();
    const actor = model.WebGPUImageSlice.getRenderable();
    const volMapr = actor.getMapper();
    if (
      publicAPI.getMTime() > utime ||
      model.renderable.getMTime() > utime ||
      actor.getProperty().getMTime() > utime
    ) {
      // compute the SCTCMatrix
      const image = volMapr.getInputData();
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
      mat4.fromTranslation(tmp2Mat4, [0.5, 0.5, 0.5]);
      mat4.multiply(tmpMat4, tmp2Mat4, tmpMat4);

      const dims = image.getDimensions();
      mat4.identity(tmp2Mat4);
      mat4.scale(tmp2Mat4, tmp2Mat4, [
        1.0 / dims[0],
        1.0 / dims[1],
        1.0 / dims[2],
      ]);
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
      const cScale = [1, 1, 1, 1];
      const cShift = [0, 0, 0, 0];
      const oScale = [1, 1, 1, 1];
      const oShift = [0, 0, 0, 0];
      const componentWeight = [1, 1, 1, 1];
      const tView = model.textureViews[0];
      const tScale = tView.getTexture().getScale();
      const imageState = publicAPI.getImageState();
      const { numberOfComponents: numComp, independentComponents: iComps } =
        imageState;
      for (let i = 0; i < numComp; i++) {
        let cw = actor.getProperty().getColorWindow();
        let cl = actor.getProperty().getColorLevel();

        const target = iComps ? i : 0;
        const cfun = actor.getProperty().getRGBTransferFunction(target);
        if (cfun && actor.getProperty().getUseLookupTableScalarRange()) {
          const cRange = cfun.getRange();
          cw = cRange[1] - cRange[0];
          cl = 0.5 * (cRange[1] + cRange[0]);
        }

        cScale[i] = tScale / cw;
        cShift[i] = -cl / cw + 0.5;

        let opacityScale = 1.0;
        let opacityShift = 0.0;
        const pwfun = actor.getProperty().getPiecewiseFunction(target);
        if (pwfun) {
          const pwfRange = pwfun.getRange();
          const length = pwfRange[1] - pwfRange[0];
          const mid = 0.5 * (pwfRange[0] + pwfRange[1]);
          opacityScale = tScale / length;
          opacityShift = -mid / length + 0.5;
        }
        oScale[i] = opacityScale;
        oShift[i] = opacityShift;
        componentWeight[i] = actor.getProperty().getComponentWeight(i);
      }
      model.UBO.setArray('cScale', cScale);
      model.UBO.setArray('cShift', cShift);
      model.UBO.setArray('oScale', oScale);
      model.UBO.setArray('oShift', oShift);
      model.UBO.setArray('componentWeight', componentWeight);
      model.UBO.setValue('Opacity', actor.getProperty().getOpacity());
      const cp = publicAPI.getCoincidentParameters();
      model.UBO.setValue('CoincidentFactor', cp.factor);
      model.UBO.setValue('CoincidentOffset', cp.offset);
      model.UBO.sendIfNeeded(model.device);
    }
  };

  publicAPI.updateLUTImage = () => {
    const imageState = publicAPI.getImageState();
    const { actorProperty, independentComponents: iComps } = imageState;
    const numIComps = imageState.numberOfIComponents;

    const cfunToString = computeFnToString(
      actorProperty,
      actorProperty.getRGBTransferFunction,
      numIComps
    );

    if (model.colorTextureString !== cfunToString) {
      model.numRows = numIComps;
      const colorArray = new Uint8ClampedArray(
        model.numRows * 2 * model.rowLength * 4
      );

      let cfun = actorProperty.getRGBTransferFunction();
      if (cfun) {
        const tmpTable = new Float32Array(model.rowLength * 3);

        for (let c = 0; c < numIComps; c++) {
          cfun = actorProperty.getRGBTransferFunction(c);
          const cRange = cfun.getRange();
          cfun.getTable(cRange[0], cRange[1], model.rowLength, tmpTable, 1);
          if (iComps) {
            for (let i = 0; i < model.rowLength; i++) {
              const idx = c * model.rowLength * 8 + i * 4;
              colorArray[idx] = 255.0 * tmpTable[i * 3];
              colorArray[idx + 1] = 255.0 * tmpTable[i * 3 + 1];
              colorArray[idx + 2] = 255.0 * tmpTable[i * 3 + 2];
              colorArray[idx + 3] = 255.0;
              for (let j = 0; j < 4; j++) {
                colorArray[idx + model.rowLength * 4 + j] = colorArray[idx + j];
              }
            }
          } else {
            for (let i = 0; i < model.rowLength; i++) {
              const idx = c * model.rowLength * 8 + i * 4;
              colorArray[idx] = 255.0 * tmpTable[i * 3];
              colorArray[idx + 1] = 255.0 * tmpTable[i * 3 + 1];
              colorArray[idx + 2] = 255.0 * tmpTable[i * 3 + 2];
              colorArray[idx + 3] = 255.0;
              for (let j = 0; j < 4; j++) {
                colorArray[idx + model.rowLength * 4 + j] = colorArray[idx + j];
              }
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
        model.textureViews[1] = tview;
      }

      model.colorTextureString = cfunToString;
    }
  };

  publicAPI.updateOpacityLUTImage = () => {
    const imageState = publicAPI.getImageState();
    const { actorProperty, independentComponents: iComps } = imageState;
    const numIComps = imageState.numberOfIComponents;
    model.numRows = numIComps;
    const pwfunToString = computeFnToString(
      actorProperty,
      actorProperty.getPiecewiseFunction,
      numIComps
    );

    if (model.opacityTextureString !== pwfunToString) {
      const opacityArray = new Float32Array(model.numRows * 2 * model.rowLength);
      const tmpTable = new Float32Array(model.rowLength);

      for (let c = 0; c < numIComps; c++) {
        const pwfun = actorProperty.getPiecewiseFunction(c);
        if (!pwfun) {
          const offset = c * model.rowLength * 2;
          opacityArray.fill(1.0, offset, offset + model.rowLength * 2);
          continue;
        }

        const pwfRange = pwfun.getRange();
        pwfun.getTable(pwfRange[0], pwfRange[1], model.rowLength, tmpTable, 1);
        const offset = c * model.rowLength * 2;
        for (let i = 0; i < model.rowLength; i++) {
          opacityArray[offset + i] = tmpTable[i];
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
      model.textureViews[2] = tview;

      model.opacityTextureString = pwfunToString;
    }
  };

  const superClassUpdateBuffers = publicAPI.updateBuffers;
  publicAPI.updateBuffers = () => {
    superClassUpdateBuffers();
    const newTex = model.device
      .getTextureManager()
      .getTextureForImageData(model.currentInput);
    const tViews = model.textureViews;

    if (!tViews[0] || tViews[0].getTexture() !== newTex) {
      const tview = newTex.createView('imgTexture');
      tViews[0] = tview;
    }

    publicAPI.updateLUTImage();
    publicAPI.updateOpacityLUTImage();
    publicAPI.updateUBO();

    // set interpolation on the texture based on property setting
    const actorProperty = model.WebGPUImageSlice.getRenderable().getProperty();
    const iType =
      actorProperty.getInterpolationType() === InterpolationType.NEAREST
        ? 'nearest'
        : 'linear';

    if (
      !model.clampSampler ||
      iType !== model.clampSampler.getOptions().minFilter
    ) {
      model.clampSampler = vtkWebGPUSampler.newInstance({
        label: 'clampSampler',
      });
      model.clampSampler.create(model.device, {
        minFilter: iType,
        magFilter: iType,
      });
      model.additionalBindables = [model.clampSampler];
    }
  };

  const sr = publicAPI.getShaderReplacements();

  publicAPI.replaceShaderPosition = (hash, pipeline, vertexInput) => {
    const vDesc = pipeline.getShaderDescription('vertex');
    vDesc.addBuiltinOutput('vec4<f32>', '@builtin(position) Position');
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
      // Match the OpenGL coincident-topology constant offset scale (~1 / 2^16 = 0.000016)
      'pos.z = clamp(pos.z - 0.000016 * mapperUBO.CoincidentOffset * pos.w, 0.0, pos.w);',
      'output.tcoordVS = tcoord;',
      'output.Position = pos;'
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

    if (model.dimensions === 3) {
      code = vtkWebGPUShaderCache.substitute(code, '//VTK::Image::Sample', [
        `    var computedColor: vec4<f32> =`,
        `      textureSampleLevel(imgTexture, clampSampler, input.tcoordVS, 0.0);`,
        `//VTK::Image::Sample`,
      ]).result;
    } else {
      code = vtkWebGPUShaderCache.substitute(code, '//VTK::Image::Sample', [
        `    var computedColor: vec4<f32> =`,
        `      textureSampleLevel(imgTexture, clampSampler, input.tcoordVS, 0.0);`,
        `//VTK::Image::Sample`,
      ]).result;
    }

    switch (imageState.renderMode) {
      case ImageRenderMode.SINGLE:
        code = vtkWebGPUShaderCache.substitute(code, '//VTK::Image::Sample', [
          '    let scalar: f32 = computedColor.r;',
          '    var colorCoord: vec2<f32> =',
          '      vec2<f32>(scalar * mapperUBO.cScale.r + mapperUBO.cShift.r, 0.5);',
          '    let tColor: vec4<f32> =',
          '      textureSampleLevel(tfunTexture, clampSampler, colorCoord, 0.0);',
          '    var opacityCoord: vec2<f32> =',
          '      vec2<f32>(scalar * mapperUBO.oScale.r + mapperUBO.oShift.r, 0.5);',
          '    let scalarOpacity: f32 =',
          '      textureSampleLevel(ofunTexture, clampSampler, opacityCoord, 0.0).r;',
          '    computedColor = vec4<f32>(tColor.rgb, scalarOpacity * mapperUBO.Opacity);',
        ]).result;
        break;
      case ImageRenderMode.INDEPENDENT_1:
        code = vtkWebGPUShaderCache.substitute(code, '//VTK::Image::Sample', [
          '    let tfunRows: f32 = f32(textureDimensions(tfunTexture).y);',
          '    let scalar: f32 = computedColor.r;',
          '    let rowCoord: f32 = 0.5 / tfunRows;',
          '    let colorCoord: vec2<f32> =',
          '      vec2<f32>(scalar * mapperUBO.cScale.r + mapperUBO.cShift.r, rowCoord);',
          '    let tColor: vec4<f32> =',
          '      textureSampleLevel(tfunTexture, clampSampler, colorCoord, 0.0);',
          '    computedColor = vec4<f32>(',
          '      tColor.rgb * mapperUBO.componentWeight.r,',
          '      mapperUBO.Opacity);',
        ]).result;
        break;
      case ImageRenderMode.INDEPENDENT_2:
        code = vtkWebGPUShaderCache.substitute(code, '//VTK::Image::Sample', [
          '    let tfunRows: f32 = f32(textureDimensions(tfunTexture).y);',
          '    let rawColor: vec4<f32> = computedColor;',
          '    let rowCoord0: f32 = 0.5 / tfunRows;',
          '    let rowCoord1: f32 = 2.5 / tfunRows;',
          '    let scalar0: f32 = rawColor.r;',
          '    let scalar1: f32 = rawColor.g;',
          '    let color0: vec3<f32> = mapperUBO.componentWeight.r *',
          '      textureSampleLevel(',
          '        tfunTexture,',
          '        clampSampler,',
          '        vec2<f32>(scalar0 * mapperUBO.cScale.r + mapperUBO.cShift.r, rowCoord0),',
          '        0.0).rgb;',
          '    let color1: vec3<f32> = mapperUBO.componentWeight.g *',
          '      textureSampleLevel(',
          '        tfunTexture,',
          '        clampSampler,',
          '        vec2<f32>(scalar1 * mapperUBO.cScale.g + mapperUBO.cShift.g, rowCoord1),',
          '        0.0).rgb;',
          '    let weight0: f32 = mapperUBO.componentWeight.r *',
          '      textureSampleLevel(',
          '        ofunTexture,',
          '        clampSampler,',
          '        vec2<f32>(scalar0 * mapperUBO.oScale.r + mapperUBO.oShift.r, rowCoord0),',
          '        0.0).r;',
          '    let weight1: f32 = mapperUBO.componentWeight.g *',
          '      textureSampleLevel(',
          '        ofunTexture,',
          '        clampSampler,',
          '        vec2<f32>(scalar1 * mapperUBO.oScale.g + mapperUBO.oShift.g, rowCoord1),',
          '        0.0).r;',
          '    let weightSum: f32 = max(weight0 + weight1, 1.0e-6);',
          '    computedColor = vec4<f32>(',
          '      color0 * (weight0 / weightSum) + color1 * (weight1 / weightSum),',
          '      mapperUBO.Opacity);',
        ]).result;
        break;
      case ImageRenderMode.INDEPENDENT_3:
        code = vtkWebGPUShaderCache.substitute(code, '//VTK::Image::Sample', [
          '    let tfunRows: f32 = f32(textureDimensions(tfunTexture).y);',
          '    let rawColor: vec4<f32> = computedColor;',
          '    let rowCoord0: f32 = 0.5 / tfunRows;',
          '    let rowCoord1: f32 = 2.5 / tfunRows;',
          '    let rowCoord2: f32 = 4.5 / tfunRows;',
          '    let scalar0: f32 = rawColor.r;',
          '    let scalar1: f32 = rawColor.g;',
          '    let scalar2: f32 = rawColor.b;',
          '    let color0: vec3<f32> = mapperUBO.componentWeight.r * textureSampleLevel(tfunTexture, clampSampler, vec2<f32>(scalar0 * mapperUBO.cScale.r + mapperUBO.cShift.r, rowCoord0), 0.0).rgb;',
          '    let color1: vec3<f32> = mapperUBO.componentWeight.g * textureSampleLevel(tfunTexture, clampSampler, vec2<f32>(scalar1 * mapperUBO.cScale.g + mapperUBO.cShift.g, rowCoord1), 0.0).rgb;',
          '    let color2: vec3<f32> = mapperUBO.componentWeight.b * textureSampleLevel(tfunTexture, clampSampler, vec2<f32>(scalar2 * mapperUBO.cScale.b + mapperUBO.cShift.b, rowCoord2), 0.0).rgb;',
          '    let weight0: f32 = mapperUBO.componentWeight.r * textureSampleLevel(ofunTexture, clampSampler, vec2<f32>(scalar0 * mapperUBO.oScale.r + mapperUBO.oShift.r, rowCoord0), 0.0).r;',
          '    let weight1: f32 = mapperUBO.componentWeight.g * textureSampleLevel(ofunTexture, clampSampler, vec2<f32>(scalar1 * mapperUBO.oScale.g + mapperUBO.oShift.g, rowCoord1), 0.0).r;',
          '    let weight2: f32 = mapperUBO.componentWeight.b * textureSampleLevel(ofunTexture, clampSampler, vec2<f32>(scalar2 * mapperUBO.oScale.b + mapperUBO.oShift.b, rowCoord2), 0.0).r;',
          '    let weightSum: f32 = max(weight0 + weight1 + weight2, 1.0e-6);',
          '    computedColor = vec4<f32>(',
          '      color0 * (weight0 / weightSum) + color1 * (weight1 / weightSum) + color2 * (weight2 / weightSum),',
          '      mapperUBO.Opacity);',
        ]).result;
        break;
      case ImageRenderMode.INDEPENDENT_4:
        code = vtkWebGPUShaderCache.substitute(code, '//VTK::Image::Sample', [
          '    let tfunRows: f32 = f32(textureDimensions(tfunTexture).y);',
          '    let rawColor: vec4<f32> = computedColor;',
          '    let rowCoord0: f32 = 0.5 / tfunRows;',
          '    let rowCoord1: f32 = 2.5 / tfunRows;',
          '    let rowCoord2: f32 = 4.5 / tfunRows;',
          '    let rowCoord3: f32 = 6.5 / tfunRows;',
          '    let scalar0: f32 = rawColor.r;',
          '    let scalar1: f32 = rawColor.g;',
          '    let scalar2: f32 = rawColor.b;',
          '    let scalar3: f32 = rawColor.a;',
          '    let color0: vec3<f32> = mapperUBO.componentWeight.r * textureSampleLevel(tfunTexture, clampSampler, vec2<f32>(scalar0 * mapperUBO.cScale.r + mapperUBO.cShift.r, rowCoord0), 0.0).rgb;',
          '    let color1: vec3<f32> = mapperUBO.componentWeight.g * textureSampleLevel(tfunTexture, clampSampler, vec2<f32>(scalar1 * mapperUBO.cScale.g + mapperUBO.cShift.g, rowCoord1), 0.0).rgb;',
          '    let color2: vec3<f32> = mapperUBO.componentWeight.b * textureSampleLevel(tfunTexture, clampSampler, vec2<f32>(scalar2 * mapperUBO.cScale.b + mapperUBO.cShift.b, rowCoord2), 0.0).rgb;',
          '    let color3: vec3<f32> = mapperUBO.componentWeight.a * textureSampleLevel(tfunTexture, clampSampler, vec2<f32>(scalar3 * mapperUBO.cScale.a + mapperUBO.cShift.a, rowCoord3), 0.0).rgb;',
          '    let weight0: f32 = mapperUBO.componentWeight.r * textureSampleLevel(ofunTexture, clampSampler, vec2<f32>(scalar0 * mapperUBO.oScale.r + mapperUBO.oShift.r, rowCoord0), 0.0).r;',
          '    let weight1: f32 = mapperUBO.componentWeight.g * textureSampleLevel(ofunTexture, clampSampler, vec2<f32>(scalar1 * mapperUBO.oScale.g + mapperUBO.oShift.g, rowCoord1), 0.0).r;',
          '    let weight2: f32 = mapperUBO.componentWeight.b * textureSampleLevel(ofunTexture, clampSampler, vec2<f32>(scalar2 * mapperUBO.oScale.b + mapperUBO.oShift.b, rowCoord2), 0.0).r;',
          '    let weight3: f32 = mapperUBO.componentWeight.a * textureSampleLevel(ofunTexture, clampSampler, vec2<f32>(scalar3 * mapperUBO.oScale.a + mapperUBO.oShift.a, rowCoord3), 0.0).r;',
          '    let weightSum: f32 = max(weight0 + weight1 + weight2 + weight3, 1.0e-6);',
          '    computedColor = vec4<f32>(',
          '      color0 * (weight0 / weightSum) + color1 * (weight1 / weightSum) + color2 * (weight2 / weightSum) + color3 * (weight3 / weightSum),',
          '      mapperUBO.Opacity);',
        ]).result;
        break;
      case ImageRenderMode.DEPENDENT_LA:
        code = vtkWebGPUShaderCache.substitute(code, '//VTK::Image::Sample', [
          '    let rawColor: vec4<f32> = computedColor;',
          '    let intensity: f32 = rawColor.r * mapperUBO.cScale.r + mapperUBO.cShift.r;',
          '    let tColor: vec4<f32> =',
          '      textureSampleLevel(tfunTexture, clampSampler, vec2<f32>(intensity, 0.5), 0.0);',
          '    computedColor = vec4<f32>(',
          '      tColor.rgb,',
          '      rawColor.g * mapperUBO.oScale.r + mapperUBO.oShift.r);',
        ]).result;
        break;
      case ImageRenderMode.DEPENDENT_RGB:
        code = vtkWebGPUShaderCache.substitute(code, '//VTK::Image::Sample', [
          '    let rawColor: vec4<f32> =',
          '      computedColor * vec4<f32>(mapperUBO.cScale.x) + vec4<f32>(mapperUBO.cShift.x);',
          '    computedColor = vec4<f32>(',
          '      textureSampleLevel(tfunTexture, clampSampler, vec2<f32>(rawColor.r, 0.5), 0.0).r,',
          '      textureSampleLevel(tfunTexture, clampSampler, vec2<f32>(rawColor.g, 0.5), 0.0).r,',
          '      textureSampleLevel(tfunTexture, clampSampler, vec2<f32>(rawColor.b, 0.5), 0.0).r,',
          '      mapperUBO.Opacity);',
        ]).result;
        break;
      case ImageRenderMode.DEPENDENT_RGBA:
        code = vtkWebGPUShaderCache.substitute(code, '//VTK::Image::Sample', [
          '    let rawColor: vec4<f32> =',
          '      computedColor * vec4<f32>(mapperUBO.cScale.x) + vec4<f32>(mapperUBO.cShift.x);',
          '    computedColor = vec4<f32>(',
          '      textureSampleLevel(tfunTexture, clampSampler, vec2<f32>(rawColor.r, 0.5), 0.0).r,',
          '      textureSampleLevel(tfunTexture, clampSampler, vec2<f32>(rawColor.g, 0.5), 0.0).r,',
          '      textureSampleLevel(tfunTexture, clampSampler, vec2<f32>(rawColor.b, 0.5), 0.0).r,',
          '      rawColor.a);',
        ]).result;
        break;
      default:
        code = vtkWebGPUShaderCache.substitute(code, '//VTK::Image::Sample', [
          '    let scalar: f32 = computedColor.r;',
          '    var colorCoord: vec2<f32> =',
          '      vec2<f32>(scalar * mapperUBO.cScale.r + mapperUBO.cShift.r, 0.5);',
          '    computedColor = textureSampleLevel(tfunTexture, clampSampler, colorCoord, 0.0);',
        ]).result;
        break;
    }

    fDesc.setCode(code);
  };
  sr.set('replaceShaderImage', publicAPI.replaceShaderImage);

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

  model.lutBuildTime = {};
  macro.obj(model.lutBuildTime, { mtime: 0 });

  model.imagemat = mat4.identity(new Float64Array(16));
  model.imagematinv = mat4.identity(new Float64Array(16));

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
registerOverride('vtkImageMapper', newInstance);
