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

@stage(fragment)
fn main(
//VTK::IOStructs::Input
)
//VTK::IOStructs::Output
{
  var output: fragmentOutput;

  //VTK::Image::Sample

  // var computedColor: vec4<f32> = vec4<f32>(1.0,0.7, 0.5, 1.0);

//VTK::RenderEncoder::Impl

  return output;
}
`;

// ----------------------------------------------------------------------------
// helper methods
// ----------------------------------------------------------------------------

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

  publicAPI.computePipelineHash = () => {
    const ext = model.currentInput.getExtent();
    if (ext[0] === ext[1] || ext[2] === ext[3] || ext[4] === ext[5]) {
      model.dimensions = 2;
      model.pipelineHash = 'img2';
    } else {
      model.dimensions = 3;
      model.pipelineHash = 'img3';
    }
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
      ptsArray1[axis1] = ext[axis1 * 2];
      ptsArray1[axis2] = ext[axis2 * 2];
      ptsArray1[3] = 1.0;
      vec4.transformMat4(ptsArray1, ptsArray1, tmp3Mat4);
      model.UBO.setArray('Origin', ptsArray1);

      ptsArray2[axis0] = nSlice;
      ptsArray2[axis1] = ext[axis1 * 2 + 1];
      ptsArray2[axis2] = ext[axis2 * 2];
      ptsArray2[3] = 1.0;
      vec4.transformMat4(ptsArray2, ptsArray2, tmp3Mat4);
      vec4.subtract(ptsArray2, ptsArray2, ptsArray1);
      ptsArray2[3] = 1.0;
      model.UBO.setArray('Axis1', ptsArray2);

      ptsArray2[axis0] = nSlice;
      ptsArray2[axis1] = ext[axis1 * 2];
      ptsArray2[axis2] = ext[axis2 * 2 + 1];
      ptsArray2[3] = 1.0;
      vec4.transformMat4(ptsArray2, ptsArray2, tmp3Mat4);
      vec4.subtract(ptsArray2, ptsArray2, ptsArray1);
      ptsArray2[3] = 1.0;
      model.UBO.setArray('Axis2', ptsArray2);

      // three levels of shift scale combined into one
      // for performance in the fragment shader
      const cScale = [1, 1, 1, 1];
      const cShift = [0, 0, 0, 0];
      const tView = model.textureViews[0];
      const tScale = tView.getTexture().getScale();
      const numComp = tView.getTexture().getNumberOfComponents();
      const iComps = false; // todo handle independent?
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
      }
      model.UBO.setArray('cScale', cScale);
      model.UBO.setArray('cShift', cShift);
      model.UBO.sendIfNeeded(model.device);
    }
  };

  publicAPI.updateLUTImage = () => {
    const actorProperty = model.WebGPUImageSlice.getRenderable().getProperty();

    const tView = publicAPI.getTextureViews()[0];
    const numComp = tView.getTexture().getNumberOfComponents();
    const iComps = false; // todo support indepenedent comps?
    const numIComps = iComps ? numComp : 1;

    const cfunToString = computeFnToString(
      actorProperty,
      actorProperty.getRGBTransferFunction,
      numIComps
    );

    if (model.colorTextureString !== cfunToString) {
      model.numRows = numIComps;
      const colorArray = new Uint8Array(
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
      'output.tcoordVS = tcoord;',
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

    code = vtkWebGPUShaderCache.substitute(code, '//VTK::Image::Sample', [
      `    var coord: vec2<f32> =`,
      `      vec2<f32>(computedColor.r * mapperUBO.cScale.r + mapperUBO.cShift.r, 0.5);`,
      `    computedColor = textureSampleLevel(tfunTexture, clampSampler, coord, 0.0);`,
    ]).result;

    fDesc.setCode(code);
  };
  sr.set('replaceShaderImage', publicAPI.replaceShaderImage);
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
