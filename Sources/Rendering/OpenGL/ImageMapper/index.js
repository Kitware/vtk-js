import { mat3, mat4 } from 'gl-matrix';
import Constants from 'vtk.js/Sources/Rendering/Core/ImageMapper/Constants';
import * as macro from 'vtk.js/Sources/macros';
import vtkDataArray from 'vtk.js/Sources/Common/Core/DataArray';
import { VtkDataTypes } from 'vtk.js/Sources/Common/Core/DataArray/Constants';
import vtkHelper from 'vtk.js/Sources/Rendering/OpenGL/Helper';
import * as vtkMath from 'vtk.js/Sources/Common/Core/Math';
import vtkOpenGLTexture from 'vtk.js/Sources/Rendering/OpenGL/Texture';
import vtkShaderProgram from 'vtk.js/Sources/Rendering/OpenGL/ShaderProgram';
import vtkViewNode from 'vtk.js/Sources/Rendering/SceneGraph/ViewNode';
import { Representation } from 'vtk.js/Sources/Rendering/Core/Property/Constants';
import {
  Wrap,
  Filter,
} from 'vtk.js/Sources/Rendering/OpenGL/Texture/Constants';
import { InterpolationType } from 'vtk.js/Sources/Rendering/Core/ImageProperty/Constants';

import vtkPolyDataVS from 'vtk.js/Sources/Rendering/OpenGL/glsl/vtkPolyDataVS.glsl';
import vtkPolyDataFS from 'vtk.js/Sources/Rendering/OpenGL/glsl/vtkPolyDataFS.glsl';
import vtkReplacementShaderMapper from 'vtk.js/Sources/Rendering/OpenGL/ReplacementShaderMapper';

import { registerOverride } from 'vtk.js/Sources/Rendering/OpenGL/ViewNodeFactory';

const { vtkErrorMacro } = macro;

const { SlicingMode } = Constants;

// ----------------------------------------------------------------------------
// helper methods
// ----------------------------------------------------------------------------

function computeFnToString(property, pwfun, numberOfComponents) {
  if (pwfun) {
    const iComps = property.getIndependentComponents();
    return `${pwfun.getMTime()}-${iComps}-${numberOfComponents}`;
  }
  return '0';
}

function splitStringOnEnter(inputString) {
  // Split the input string into an array of lines based on "Enter" (newline) characters
  // Remove any leading or trailing whitespace from each line and filter out empty lines
  const lines = inputString.split('\n');
  const trimmedLines = [];
  for (let i = 0; i < lines.length; ++i) {
    const trimmedLine = lines[i].trim();
    if (trimmedLine.length > 0) {
      trimmedLines.push(trimmedLine);
    }
  }
  return trimmedLines;
}

// ----------------------------------------------------------------------------
// vtkOpenGLImageMapper methods
// ----------------------------------------------------------------------------

function vtkOpenGLImageMapper(publicAPI, model) {
  // Set our className
  model.classHierarchy.push('vtkOpenGLImageMapper');

  function unregisterGraphicsResources(renderWindow) {
    // The openGLTexture is not shared
    model.openGLTexture.releaseGraphicsResources(renderWindow);
    // All these other resources are shared
    [
      model._colorTransferFunc,
      model._pwFunc,
      model._labelOutlineThicknessArray,
    ].forEach((coreObject) =>
      renderWindow.unregisterGraphicsResourceUser(coreObject, publicAPI)
    );
  }

  publicAPI.buildPass = (prepass) => {
    if (prepass) {
      model.currentRenderPass = null;
      model.openGLImageSlice = publicAPI.getFirstAncestorOfType(
        'vtkOpenGLImageSlice'
      );
      model._openGLRenderer =
        publicAPI.getFirstAncestorOfType('vtkOpenGLRenderer');
      const oldOglRenderWindow = model._openGLRenderWindow;
      model._openGLRenderWindow = model._openGLRenderer.getLastAncestorOfType(
        'vtkOpenGLRenderWindow'
      );
      if (
        oldOglRenderWindow &&
        !oldOglRenderWindow.isDeleted() &&
        oldOglRenderWindow !== model._openGLRenderWindow
      ) {
        // Unregister the mapper when the render window changes
        unregisterGraphicsResources(oldOglRenderWindow);
      }
      model.context = model._openGLRenderWindow.getContext();
      model.tris.setOpenGLRenderWindow(model._openGLRenderWindow);
      const ren = model._openGLRenderer.getRenderable();
      model.openGLCamera = model._openGLRenderer.getViewNodeFor(
        ren.getActiveCamera()
      );
      // is slice set by the camera
      if (
        model.renderable.isA('vtkImageMapper') &&
        model.renderable.getSliceAtFocalPoint()
      ) {
        model.renderable.setSliceFromCamera(ren.getActiveCamera());
      }
    }
  };

  publicAPI.translucentPass = (prepass, renderPass) => {
    if (prepass) {
      model.currentRenderPass = renderPass;
      publicAPI.render();
    }
  };

  publicAPI.zBufferPass = (prepass) => {
    if (prepass) {
      model.haveSeenDepthRequest = true;
      model.renderDepth = true;
      publicAPI.render();
      model.renderDepth = false;
    }
  };

  publicAPI.opaqueZBufferPass = (prepass) => publicAPI.zBufferPass(prepass);

  publicAPI.opaquePass = (prepass) => {
    if (prepass) {
      publicAPI.render();
    }
  };

  publicAPI.getCoincidentParameters = (ren, actor) => {
    if (model.renderable.getResolveCoincidentTopology()) {
      return model.renderable.getCoincidentTopologyPolygonOffsetParameters();
    }
    return null;
  };

  // Renders myself
  publicAPI.render = () => {
    const actor = model.openGLImageSlice.getRenderable();
    const ren = model._openGLRenderer.getRenderable();
    publicAPI.renderPiece(ren, actor);
  };

  publicAPI.getShaderTemplate = (shaders, ren, actor) => {
    shaders.Vertex = vtkPolyDataVS;
    shaders.Fragment = vtkPolyDataFS;
    shaders.Geometry = '';
  };

  publicAPI.replaceShaderValues = (shaders, ren, actor) => {
    let VSSource = shaders.Vertex;
    let FSSource = shaders.Fragment;

    VSSource = vtkShaderProgram.substitute(VSSource, '//VTK::Camera::Dec', [
      'uniform mat4 MCPCMatrix;',
    ]).result;
    VSSource = vtkShaderProgram.substitute(
      VSSource,
      '//VTK::PositionVC::Impl',
      ['  gl_Position = MCPCMatrix * vertexMC;']
    ).result;

    VSSource = vtkShaderProgram.substitute(
      VSSource,
      '//VTK::TCoord::Impl',
      'tcoordVCVSOutput = tcoordMC;'
    ).result;

    VSSource = vtkShaderProgram.substitute(
      VSSource,
      '//VTK::TCoord::Dec',
      'attribute vec2 tcoordMC; varying vec2 tcoordVCVSOutput;'
    ).result;

    const tNumComp = model.openGLTexture.getComponents();
    const iComps = actor.getProperty().getIndependentComponents();

    let tcoordDec = [
      'varying vec2 tcoordVCVSOutput;',
      // color shift and scale
      'uniform float cshift0;',
      'uniform float cscale0;',
      // pwf shift and scale
      'uniform float pwfshift0;',
      'uniform float pwfscale0;',
      'uniform sampler2D texture1;',
      'uniform sampler2D colorTexture1;',
      'uniform sampler2D pwfTexture1;',
      'uniform sampler2D labelOutlineTexture1;',
      'uniform float opacity;',
      'uniform float outlineOpacity;',
    ];
    if (iComps) {
      for (let comp = 1; comp < tNumComp; comp++) {
        tcoordDec = tcoordDec.concat([
          // color shift and scale
          `uniform float cshift${comp};`,
          `uniform float cscale${comp};`,
          // weighting shift and scale
          `uniform float pwfshift${comp};`,
          `uniform float pwfscale${comp};`,
        ]);
      }
      // the heights defined below are the locations
      // for the up to four components of the tfuns
      // the tfuns have a height of 2XnumComps pixels so the
      // values are computed to hit the middle of the two rows
      // for that component
      switch (tNumComp) {
        case 1:
          tcoordDec = tcoordDec.concat([
            'uniform float mix0;',
            '#define height0 0.5',
          ]);
          break;
        case 2:
          tcoordDec = tcoordDec.concat([
            'uniform float mix0;',
            'uniform float mix1;',
            '#define height0 0.25',
            '#define height1 0.75',
          ]);
          break;
        case 3:
          tcoordDec = tcoordDec.concat([
            'uniform float mix0;',
            'uniform float mix1;',
            'uniform float mix2;',
            '#define height0 0.17',
            '#define height1 0.5',
            '#define height2 0.83',
          ]);
          break;
        case 4:
          tcoordDec = tcoordDec.concat([
            'uniform float mix0;',
            'uniform float mix1;',
            'uniform float mix2;',
            'uniform float mix3;',
            '#define height0 0.125',
            '#define height1 0.375',
            '#define height2 0.625',
            '#define height3 0.875',
          ]);
          break;
        default:
          vtkErrorMacro('Unsupported number of independent coordinates.');
      }
    }
    FSSource = vtkShaderProgram.substitute(
      FSSource,
      '//VTK::TCoord::Dec',
      tcoordDec
    ).result;

    // check for the outline thickness and opacity
    const vtkImageLabelOutline = actor.getProperty().getUseLabelOutline();
    if (vtkImageLabelOutline === true) {
      FSSource = vtkShaderProgram.substitute(
        FSSource,
        '//VTK::LabelOutline::Dec',
        [
          'uniform int outlineThickness;',
          'uniform float vpWidth;',
          'uniform float vpHeight;',
          'uniform float vpOffsetX;',
          'uniform float vpOffsetY;',
          'uniform mat4 PCWCMatrix;',
          'uniform mat4 vWCtoIDX;',
          'uniform ivec3 imageDimensions;',
        ]
      ).result;

      FSSource = vtkShaderProgram.substitute(
        FSSource,
        '//VTK::ImageLabelOutlineOn',
        '#define vtkImageLabelOutlineOn'
      ).result;

      FSSource = vtkShaderProgram.substitute(
        FSSource,
        '//VTK::LabelOutlineHelperFunction',
        [
          '#ifdef vtkImageLabelOutlineOn',
          'vec3 fragCoordToIndexSpace(vec4 fragCoord) {',
          '  vec4 pcPos = vec4(',
          '    (fragCoord.x / vpWidth - vpOffsetX - 0.5) * 2.0,',
          '    (fragCoord.y / vpHeight - vpOffsetY - 0.5) * 2.0,',
          '    (fragCoord.z - 0.5) * 2.0,',
          '    1.0);',
          '',
          '  vec4 worldCoord = PCWCMatrix * pcPos;',
          '  vec4 vertex = (worldCoord/worldCoord.w);',
          '',
          '  vec3 index = (vWCtoIDX * vertex).xyz;',
          '',
          '  // half voxel fix for labelmapOutline',
          '  return (index + vec3(0.5)) / vec3(imageDimensions);',
          '}',
          '#endif',
        ]
      ).result;
    }

    if (iComps) {
      const rgba = ['r', 'g', 'b', 'a'];
      let tcoordImpl = ['vec4 tvalue = texture2D(texture1, tcoordVCVSOutput);'];
      for (let comp = 0; comp < tNumComp; comp++) {
        tcoordImpl = tcoordImpl.concat([
          `vec3 tcolor${comp} = mix${comp} * texture2D(colorTexture1, vec2(tvalue.${rgba[comp]} * cscale${comp} + cshift${comp}, height${comp})).rgb;`,
          `float compWeight${comp} = mix${comp} * texture2D(pwfTexture1, vec2(tvalue.${rgba[comp]} * pwfscale${comp} + pwfshift${comp}, height${comp})).r;`,
        ]);
      }
      switch (tNumComp) {
        case 1:
          tcoordImpl = tcoordImpl.concat([
            'gl_FragData[0] = vec4(tcolor0.rgb, opacity);',
          ]);
          break;
        case 2:
          tcoordImpl = tcoordImpl.concat([
            'float weightSum = compWeight0 + compWeight1;',
            'gl_FragData[0] = vec4(vec3((tcolor0.rgb * (compWeight0 / weightSum)) + (tcolor1.rgb * (compWeight1 / weightSum))), opacity);',
          ]);
          break;
        case 3:
          tcoordImpl = tcoordImpl.concat([
            'float weightSum = compWeight0 + compWeight1 + compWeight2;',
            'gl_FragData[0] = vec4(vec3((tcolor0.rgb * (compWeight0 / weightSum)) + (tcolor1.rgb * (compWeight1 / weightSum)) + (tcolor2.rgb * (compWeight2 / weightSum))), opacity);',
          ]);
          break;
        case 4:
          tcoordImpl = tcoordImpl.concat([
            'float weightSum = compWeight0 + compWeight1 + compWeight2 + compWeight3;',
            'gl_FragData[0] = vec4(vec3((tcolor0.rgb * (compWeight0 / weightSum)) + (tcolor1.rgb * (compWeight1 / weightSum)) + (tcolor2.rgb * (compWeight2 / weightSum)) + (tcolor3.rgb * (compWeight3 / weightSum))), opacity);',
          ]);
          break;
        default:
          vtkErrorMacro('Unsupported number of independent coordinates.');
      }
      FSSource = vtkShaderProgram.substitute(
        FSSource,
        '//VTK::TCoord::Impl',
        tcoordImpl
      ).result;
    } else {
      // dependent components
      switch (tNumComp) {
        case 1:
          FSSource = vtkShaderProgram.substitute(
            FSSource,
            '//VTK::TCoord::Impl',
            [
              ...splitStringOnEnter(
                `
                #ifdef vtkImageLabelOutlineOn
                  vec3 centerPosIS = fragCoordToIndexSpace(gl_FragCoord); 
                  float centerValue = texture2D(texture1, centerPosIS.xy).r;
                  bool pixelOnBorder = false;
                  vec3 tColor = texture2D(colorTexture1, vec2(centerValue * cscale0 + cshift0, 0.5)).rgb;
                  float scalarOpacity = texture2D(pwfTexture1, vec2(centerValue * pwfscale0 + pwfshift0, 0.5)).r;
                  float opacityToUse = scalarOpacity * opacity;
                  int segmentIndex = int(centerValue * 255.0);
                  float textureCoordinate = float(segmentIndex - 1) / 1024.0;
                  float textureValue = texture2D(labelOutlineTexture1, vec2(textureCoordinate, 0.5)).r;
                  int actualThickness = int(textureValue * 255.0);

                  if (segmentIndex == 0){
                    gl_FragData[0] = vec4(0.0, 1.0, 1.0, 0.0);
                    return;
                  }

                  for (int i = -actualThickness; i <= actualThickness; i++) {
                    for (int j = -actualThickness; j <= actualThickness; j++) {
                      if (i == 0 || j == 0) {
                        continue;
                      }
                      vec4 neighborPixelCoord = vec4(gl_FragCoord.x + float(i),
                        gl_FragCoord.y + float(j),
                        gl_FragCoord.z, gl_FragCoord.w);
                      vec3 neighborPosIS = fragCoordToIndexSpace(neighborPixelCoord);
                      float value = texture2D(texture1, neighborPosIS.xy).r;
                      if (value != centerValue) {
                        pixelOnBorder = true;
                        break;
                      }
                    }
                    if (pixelOnBorder == true) {
                      break;
                    }
                  }
                  if (pixelOnBorder == true) {
                    gl_FragData[0] = vec4(tColor, outlineOpacity);
                  }
                  else {
                    gl_FragData[0] = vec4(tColor, opacityToUse);
                  }
                #else
                  float intensity = texture2D(texture1, tcoordVCVSOutput).r;
                  vec3 tcolor = texture2D(colorTexture1, vec2(intensity * cscale0 + cshift0, 0.5)).rgb;
                  float scalarOpacity = texture2D(pwfTexture1, vec2(intensity * pwfscale0 + pwfshift0, 0.5)).r;
                  gl_FragData[0] = vec4(tcolor, scalarOpacity * opacity);
                #endif
                `
              ),
            ]
          ).result;
          break;
        case 2:
          FSSource = vtkShaderProgram.substitute(
            FSSource,
            '//VTK::TCoord::Impl',
            [
              'vec4 tcolor = texture2D(texture1, tcoordVCVSOutput);',
              'float intensity = tcolor.r*cscale0 + cshift0;',
              'gl_FragData[0] = vec4(texture2D(colorTexture1, vec2(intensity, 0.5)).rgb, pwfscale0*tcolor.g + pwfshift0);',
            ]
          ).result;
          break;
        case 3:
          FSSource = vtkShaderProgram.substitute(
            FSSource,
            '//VTK::TCoord::Impl',
            [
              'vec4 tcolor = cscale0*texture2D(texture1, tcoordVCVSOutput.st) + cshift0;',
              'gl_FragData[0] = vec4(texture2D(colorTexture1, vec2(tcolor.r,0.5)).r,',
              '  texture2D(colorTexture1, vec2(tcolor.g,0.5)).r,',
              '  texture2D(colorTexture1, vec2(tcolor.b,0.5)).r, opacity);',
            ]
          ).result;
          break;
        default:
          FSSource = vtkShaderProgram.substitute(
            FSSource,
            '//VTK::TCoord::Impl',
            [
              'vec4 tcolor = cscale0*texture2D(texture1, tcoordVCVSOutput.st) + cshift0;',
              'gl_FragData[0] = vec4(texture2D(colorTexture1, vec2(tcolor.r,0.5)).r,',
              '  texture2D(colorTexture1, vec2(tcolor.g,0.5)).r,',
              '  texture2D(colorTexture1, vec2(tcolor.b,0.5)).r, tcolor.a);',
            ]
          ).result;
      }
    }

    if (model.haveSeenDepthRequest) {
      FSSource = vtkShaderProgram.substitute(
        FSSource,
        '//VTK::ZBuffer::Dec',
        'uniform int depthRequest;'
      ).result;
      FSSource = vtkShaderProgram.substitute(FSSource, '//VTK::ZBuffer::Impl', [
        'if (depthRequest == 1) {',
        'float iz = floor(gl_FragCoord.z*65535.0 + 0.1);',
        'float rf = floor(iz/256.0)/255.0;',
        'float gf = mod(iz,256.0)/255.0;',
        'gl_FragData[0] = vec4(rf, gf, 0.0, 1.0); }',
      ]).result;
    }

    shaders.Vertex = VSSource;
    shaders.Fragment = FSSource;

    publicAPI.replaceShaderClip(shaders, ren, actor);
    publicAPI.replaceShaderCoincidentOffset(shaders, ren, actor);
  };

  publicAPI.replaceShaderClip = (shaders, ren, actor) => {
    let VSSource = shaders.Vertex;
    let FSSource = shaders.Fragment;

    if (model.renderable.getNumberOfClippingPlanes()) {
      let numClipPlanes = model.renderable.getNumberOfClippingPlanes();
      if (numClipPlanes > 6) {
        macro.vtkErrorMacro('OpenGL has a limit of 6 clipping planes');
        numClipPlanes = 6;
      }
      VSSource = vtkShaderProgram.substitute(VSSource, '//VTK::Clip::Dec', [
        'uniform int numClipPlanes;',
        'uniform vec4 clipPlanes[6];',
        'varying float clipDistancesVSOutput[6];',
      ]).result;

      VSSource = vtkShaderProgram.substitute(VSSource, '//VTK::Clip::Impl', [
        'for (int planeNum = 0; planeNum < 6; planeNum++)',
        '    {',
        '    if (planeNum >= numClipPlanes)',
        '        {',
        '        break;',
        '        }',
        '    clipDistancesVSOutput[planeNum] = dot(clipPlanes[planeNum], vertexMC);',
        '    }',
      ]).result;
      FSSource = vtkShaderProgram.substitute(FSSource, '//VTK::Clip::Dec', [
        'uniform int numClipPlanes;',
        'varying float clipDistancesVSOutput[6];',
      ]).result;

      FSSource = vtkShaderProgram.substitute(FSSource, '//VTK::Clip::Impl', [
        'for (int planeNum = 0; planeNum < 6; planeNum++)',
        '    {',
        '    if (planeNum >= numClipPlanes)',
        '        {',
        '        break;',
        '        }',
        '    if (clipDistancesVSOutput[planeNum] < 0.0) discard;',
        '    }',
      ]).result;
    }
    shaders.Vertex = VSSource;

    shaders.Fragment = FSSource;
  };

  publicAPI.getNeedToRebuildShaders = (cellBO, ren, actor) => {
    // has something changed that would require us to recreate the shader?
    // candidates are
    // property modified (representation interpolation and lighting)
    // input modified
    // light complexity changed
    // render pass shader replacement changed

    const tNumComp = model.openGLTexture.getComponents();
    const iComp = actor.getProperty().getIndependentComponents();

    // has the render pass shader replacement changed? Two options
    let needRebuild = false;
    if (
      (!model.currentRenderPass && model.lastRenderPassShaderReplacement) ||
      (model.currentRenderPass &&
        model.currentRenderPass.getShaderReplacement() !==
          model.lastRenderPassShaderReplacement)
    ) {
      needRebuild = true;
    }

    if (
      needRebuild ||
      model.lastHaveSeenDepthRequest !== model.haveSeenDepthRequest ||
      cellBO.getProgram()?.getHandle() === 0 ||
      model.lastTextureComponents !== tNumComp ||
      model.lastIndependentComponents !== iComp
    ) {
      model.lastHaveSeenDepthRequest = model.haveSeenDepthRequest;
      model.lastTextureComponents = tNumComp;
      model.lastIndependentComponents = iComp;
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
  };

  publicAPI.setMapperShaderParameters = (cellBO, ren, actor) => {
    // Now to update the VAO too, if necessary.

    if (
      cellBO.getCABO().getElementCount() &&
      (model.VBOBuildTime > cellBO.getAttributeUpdateTime().getMTime() ||
        cellBO.getShaderSourceTime().getMTime() >
          cellBO.getAttributeUpdateTime().getMTime())
    ) {
      if (cellBO.getProgram().isAttributeUsed('vertexMC')) {
        if (
          !cellBO
            .getVAO()
            .addAttributeArray(
              cellBO.getProgram(),
              cellBO.getCABO(),
              'vertexMC',
              cellBO.getCABO().getVertexOffset(),
              cellBO.getCABO().getStride(),
              model.context.FLOAT,
              3,
              model.context.FALSE
            )
        ) {
          vtkErrorMacro('Error setting vertexMC in shader VAO.');
        }
      }
      if (
        cellBO.getProgram().isAttributeUsed('tcoordMC') &&
        cellBO.getCABO().getTCoordOffset()
      ) {
        if (
          !cellBO
            .getVAO()
            .addAttributeArray(
              cellBO.getProgram(),
              cellBO.getCABO(),
              'tcoordMC',
              cellBO.getCABO().getTCoordOffset(),
              cellBO.getCABO().getStride(),
              model.context.FLOAT,
              cellBO.getCABO().getTCoordComponents(),
              model.context.FALSE
            )
        ) {
          vtkErrorMacro('Error setting tcoordMC in shader VAO.');
        }
      }
      cellBO.getAttributeUpdateTime().modified();
    }

    const texUnit = model.openGLTexture.getTextureUnit();
    cellBO.getProgram().setUniformi('texture1', texUnit);

    const numComp = model.openGLTexture.getComponents();
    const iComps = actor.getProperty().getIndependentComponents();
    if (iComps) {
      for (let i = 0; i < numComp; i++) {
        cellBO
          .getProgram()
          .setUniformf(`mix${i}`, actor.getProperty().getComponentWeight(i));
      }
    }

    const oglShiftScale = model.openGLTexture.getShiftAndScale();

    // three levels of shift scale combined into one
    // for performance in the fragment shader
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

      const scale = oglShiftScale.scale / cw;
      const shift = (oglShiftScale.shift - cl) / cw + 0.5;
      cellBO.getProgram().setUniformf(`cshift${i}`, shift);
      cellBO.getProgram().setUniformf(`cscale${i}`, scale);
    }

    // pwf shift/scale
    for (let i = 0; i < numComp; i++) {
      let pwfScale = 1.0;
      let pwfShift = 0.0;
      const target = iComps ? i : 0;
      const pwfun = actor.getProperty().getPiecewiseFunction(target);
      if (pwfun) {
        const pwfRange = pwfun.getRange();
        const length = pwfRange[1] - pwfRange[0];
        const mid = 0.5 * (pwfRange[0] + pwfRange[1]);
        pwfScale = oglShiftScale.scale / length;
        pwfShift = (oglShiftScale.shift - mid) / length + 0.5;
      }
      cellBO.getProgram().setUniformf(`pwfshift${i}`, pwfShift);
      cellBO.getProgram().setUniformf(`pwfscale${i}`, pwfScale);
    }

    if (model.haveSeenDepthRequest) {
      cellBO
        .getProgram()
        .setUniformi('depthRequest', model.renderDepth ? 1 : 0);
    }

    // handle coincident
    if (cellBO.getProgram().isUniformUsed('coffset')) {
      const cp = publicAPI.getCoincidentParameters(ren, actor);
      cellBO.getProgram().setUniformf('coffset', cp.offset);
      // cfactor isn't always used when coffset is.
      if (cellBO.getProgram().isUniformUsed('cfactor')) {
        cellBO.getProgram().setUniformf('cfactor', cp.factor);
      }
    }

    const texColorUnit = model.colorTexture.getTextureUnit();
    cellBO.getProgram().setUniformi('colorTexture1', texColorUnit);

    const texOpacityUnit = model.pwfTexture.getTextureUnit();
    cellBO.getProgram().setUniformi('pwfTexture1', texOpacityUnit);

    const outlineThicknessUnit =
      model.labelOutlineThicknessTexture.getTextureUnit();
    cellBO
      .getProgram()
      .setUniformi('labelOutlineTexture1', outlineThicknessUnit);

    if (model.renderable.getNumberOfClippingPlanes()) {
      // add all the clipping planes
      let numClipPlanes = model.renderable.getNumberOfClippingPlanes();
      if (numClipPlanes > 6) {
        macro.vtkErrorMacro('OpenGL has a limit of 6 clipping planes');
        numClipPlanes = 6;
      }

      const shiftScaleEnabled = cellBO.getCABO().getCoordShiftAndScaleEnabled();
      const inverseShiftScaleMatrix = shiftScaleEnabled
        ? cellBO.getCABO().getInverseShiftAndScaleMatrix()
        : null;
      const mat = inverseShiftScaleMatrix
        ? mat4.copy(model.imagematinv, actor.getMatrix())
        : actor.getMatrix();
      if (inverseShiftScaleMatrix) {
        mat4.transpose(mat, mat);
        mat4.multiply(mat, mat, inverseShiftScaleMatrix);
        mat4.transpose(mat, mat);
      }

      // transform crop plane normal with transpose(inverse(worldToIndex))
      mat4.transpose(model.imagemat, model.currentInput.getIndexToWorld());
      mat4.multiply(model.imagematinv, mat, model.imagemat);

      const planeEquations = [];
      for (let i = 0; i < numClipPlanes; i++) {
        const planeEquation = [];
        model.renderable.getClippingPlaneInDataCoords(
          model.imagematinv,
          i,
          planeEquation
        );

        for (let j = 0; j < 4; j++) {
          planeEquations.push(planeEquation[j]);
        }
      }
      cellBO.getProgram().setUniformi('numClipPlanes', numClipPlanes);
      cellBO.getProgram().setUniform4fv('clipPlanes', planeEquations);
    }

    // outline thickness and opacity
    const vtkImageLabelOutline = actor.getProperty().getUseLabelOutline();

    if (vtkImageLabelOutline === true) {
      const outlineOpacity = actor.getProperty().getLabelOutlineOpacity();
      cellBO.getProgram().setUniformf('outlineOpacity', outlineOpacity);
    }
  };

  publicAPI.setCameraShaderParameters = (cellBO, ren, actor) => {
    const program = cellBO.getProgram();

    const actMats = model.openGLImageSlice.getKeyMatrices();
    const image = model.currentInput;
    const i2wmat4 = image.getIndexToWorld();
    mat4.multiply(model.imagemat, actMats.mcwc, i2wmat4);

    const keyMats = model.openGLCamera.getKeyMatrices(ren);
    mat4.multiply(model.imagemat, keyMats.wcpc, model.imagemat);

    if (cellBO.getCABO().getCoordShiftAndScaleEnabled()) {
      const inverseShiftScaleMat = cellBO
        .getCABO()
        .getInverseShiftAndScaleMatrix();
      mat4.multiply(model.imagemat, model.imagemat, inverseShiftScaleMat);
    }

    program.setUniformMatrix('MCPCMatrix', model.imagemat);

    const vtkImageLabelOutline = actor.getProperty().getUseLabelOutline();
    if (vtkImageLabelOutline === true) {
      const worldToIndex = image.getWorldToIndex();

      const imageDimensions = image.getDimensions();

      program.setUniform3i(
        'imageDimensions',
        imageDimensions[0],
        imageDimensions[1],
        1
      );

      program.setUniformMatrix('vWCtoIDX', worldToIndex);
      const labelOutlineKeyMats = model.openGLCamera.getKeyMatrices(ren);

      // Get the projection coordinate to world coordinate transformation matrix.
      mat4.invert(model.projectionToWorld, labelOutlineKeyMats.wcpc);

      model.openGLCamera.getKeyMatrices(ren);

      program.setUniformMatrix('PCWCMatrix', model.projectionToWorld);

      const size = publicAPI.getRenderTargetSize();

      program.setUniformf('vpWidth', size[0]);
      program.setUniformf('vpHeight', size[1]);

      const offset = publicAPI.getRenderTargetOffset();
      program.setUniformf('vpOffsetX', offset[0] / size[0]);
      program.setUniformf('vpOffsetY', offset[1] / size[1]);
    }
  };

  publicAPI.setPropertyShaderParameters = (cellBO, ren, actor) => {
    const program = cellBO.getProgram();

    const ppty = actor.getProperty();

    const opacity = ppty.getOpacity();
    program.setUniformf('opacity', opacity);
  };

  publicAPI.renderPieceStart = (ren, actor) => {
    // make sure the BOs are up to date
    publicAPI.updateBufferObjects(ren, actor);

    // Bind the OpenGL, this is shared between the different primitive/cell types.
    model.lastBoundBO = null;
  };

  publicAPI.renderPieceDraw = (ren, actor) => {
    const gl = model.context;

    // activate the texture
    model.openGLTexture.activate();
    model.colorTexture.activate();
    model.labelOutlineThicknessTexture.activate();
    model.pwfTexture.activate();

    // draw polygons
    if (model.tris.getCABO().getElementCount()) {
      // First we do the triangles, update the shader, set uniforms, etc.
      publicAPI.updateShaders(model.tris, ren, actor);
      gl.drawArrays(gl.TRIANGLES, 0, model.tris.getCABO().getElementCount());
      model.tris.getVAO().release();
    }

    model.openGLTexture.deactivate();
    model.colorTexture.deactivate();
    model.labelOutlineThicknessTexture.deactivate();
    model.pwfTexture.deactivate();
  };

  publicAPI.renderPieceFinish = (ren, actor) => {};

  publicAPI.renderPiece = (ren, actor) => {
    // Make sure that we have been properly initialized.
    // if (ren.getRenderWindow().checkAbortStatus()) {
    //   return;
    // }

    publicAPI.invokeEvent({ type: 'StartEvent' });
    model.renderable.update();
    model.currentInput = model.renderable.getCurrentImage();
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
      vtkMath.uninitializeBounds(model.bounds);
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

  publicAPI.getNeedToRebuildBufferObjects = (ren, actor) =>
    model.VBOBuildTime.getMTime() < publicAPI.getMTime() ||
    model.VBOBuildTime.getMTime() < actor.getMTime() ||
    model.VBOBuildTime.getMTime() < model.renderable.getMTime() ||
    model.VBOBuildTime.getMTime() < actor.getProperty().getMTime() ||
    model.VBOBuildTime.getMTime() < model.currentInput.getMTime() ||
    !model.openGLTexture?.getHandle() ||
    !model.colorTexture?.getHandle() ||
    !model.labelOutlineThicknessTexture?.getHandle() ||
    !model.pwfTexture?.getHandle();

  publicAPI.buildBufferObjects = (ren, actor) => {
    const image = model.currentInput;

    if (!image) {
      return;
    }

    const imgScalars =
      image.getPointData() && image.getPointData().getScalars();

    if (!imgScalars) {
      return;
    }

    const dataType = imgScalars.getDataType();
    const numComp = imgScalars.getNumberOfComponents();

    const actorProperty = actor.getProperty();

    const iType = actorProperty.getInterpolationType();
    const iComps = actorProperty.getIndependentComponents();
    const numIComps = iComps ? numComp : 1;
    const textureHeight = iComps ? 2 * numIComps : 1;

    const colorTransferFunc = actorProperty.getRGBTransferFunction();
    const cfunToString = computeFnToString(
      actorProperty,
      colorTransferFunc,
      numIComps
    );
    const cTex =
      model._openGLRenderWindow.getGraphicsResourceForObject(colorTransferFunc);

    const reBuildC =
      !cTex?.oglObject?.getHandle() || cTex?.hash !== cfunToString;
    if (reBuildC) {
      model.colorTexture = vtkOpenGLTexture.newInstance({
        resizable: true,
      });
      model.colorTexture.setOpenGLRenderWindow(model._openGLRenderWindow);
      const cWidth = 1024;
      const cSize = cWidth * textureHeight * 3;
      const cTable = new Uint8ClampedArray(cSize);
      // set interpolation on the texture based on property setting
      if (iType === InterpolationType.NEAREST) {
        model.colorTexture.setMinificationFilter(Filter.NEAREST);
        model.colorTexture.setMagnificationFilter(Filter.NEAREST);
      } else {
        model.colorTexture.setMinificationFilter(Filter.LINEAR);
        model.colorTexture.setMagnificationFilter(Filter.LINEAR);
      }

      if (colorTransferFunc) {
        const tmpTable = new Float32Array(cWidth * 3);

        for (let c = 0; c < numIComps; c++) {
          const cfun = actorProperty.getRGBTransferFunction(c);
          const cRange = cfun.getRange();
          cfun.getTable(cRange[0], cRange[1], cWidth, tmpTable, 1);
          if (iComps) {
            for (let i = 0; i < cWidth * 3; i++) {
              cTable[c * cWidth * 6 + i] = 255.0 * tmpTable[i];
              cTable[c * cWidth * 6 + i + cWidth * 3] = 255.0 * tmpTable[i];
            }
          } else {
            for (let i = 0; i < cWidth * 3; i++) {
              cTable[c * cWidth * 6 + i] = 255.0 * tmpTable[i];
            }
          }
        }
        model.colorTexture.resetFormatAndType();
        model.colorTexture.create2DFromRaw(
          cWidth,
          textureHeight,
          3,
          VtkDataTypes.UNSIGNED_CHAR,
          cTable
        );
      } else {
        for (let i = 0; i < cWidth * 3; ++i) {
          cTable[i] = (255.0 * i) / ((cWidth - 1) * 3);
          cTable[i + 1] = (255.0 * i) / ((cWidth - 1) * 3);
          cTable[i + 2] = (255.0 * i) / ((cWidth - 1) * 3);
        }
        model.colorTexture.create2DFromRaw(
          cWidth,
          1,
          3,
          VtkDataTypes.UNSIGNED_CHAR,
          cTable
        );
      }

      if (colorTransferFunc) {
        model._openGLRenderWindow.setGraphicsResourceForObject(
          colorTransferFunc,
          model.colorTexture,
          cfunToString
        );
        if (colorTransferFunc !== model._colorTransferFunc) {
          model._openGLRenderWindow.registerGraphicsResourceUser(
            colorTransferFunc,
            publicAPI
          );
          model._openGLRenderWindow.unregisterGraphicsResourceUser(
            model._colorTransferFunc,
            publicAPI
          );
        }
        model._colorTransferFunc = colorTransferFunc;
      }
    } else {
      model.colorTexture = cTex.oglObject;
    }

    // Build piecewise function buffer.  This buffer is used either
    // for component weighting or opacity, depending on whether we're
    // rendering components independently or not.
    const pwFunc = actorProperty.getPiecewiseFunction();
    const pwfunToString = computeFnToString(actorProperty, pwFunc, numIComps);
    const pwfTex =
      model._openGLRenderWindow.getGraphicsResourceForObject(pwFunc);
    // rebuild opacity tfun?
    const reBuildPwf =
      !pwfTex?.oglObject?.getHandle() || pwfTex?.hash !== pwfunToString;
    if (reBuildPwf) {
      const pwfWidth = 1024;
      const pwfSize = pwfWidth * textureHeight;
      const pwfTable = new Uint8ClampedArray(pwfSize);
      model.pwfTexture = vtkOpenGLTexture.newInstance({
        resizable: true,
      });
      model.pwfTexture.setOpenGLRenderWindow(model._openGLRenderWindow);
      // set interpolation on the texture based on property setting
      if (iType === InterpolationType.NEAREST) {
        model.pwfTexture.setMinificationFilter(Filter.NEAREST);
        model.pwfTexture.setMagnificationFilter(Filter.NEAREST);
      } else {
        model.pwfTexture.setMinificationFilter(Filter.LINEAR);
        model.pwfTexture.setMagnificationFilter(Filter.LINEAR);
      }

      if (pwFunc) {
        const pwfFloatTable = new Float32Array(pwfSize);
        const tmpTable = new Float32Array(pwfWidth);

        for (let c = 0; c < numIComps; ++c) {
          const pwfun = actorProperty.getPiecewiseFunction(c);
          if (pwfun === null) {
            // Piecewise constant max if no function supplied for this component
            pwfFloatTable.fill(1.0);
          } else {
            const pwfRange = pwfun.getRange();
            pwfun.getTable(pwfRange[0], pwfRange[1], pwfWidth, tmpTable, 1);
            // adjust for sample distance etc
            if (iComps) {
              for (let i = 0; i < pwfWidth; i++) {
                pwfFloatTable[c * pwfWidth * 2 + i] = tmpTable[i];
                pwfFloatTable[c * pwfWidth * 2 + i + pwfWidth] = tmpTable[i];
              }
            } else {
              for (let i = 0; i < pwfWidth; i++) {
                pwfFloatTable[c * pwfWidth * 2 + i] = tmpTable[i];
              }
            }
          }
        }
        model.pwfTexture.resetFormatAndType();
        model.pwfTexture.create2DFromRaw(
          pwfWidth,
          textureHeight,
          1,
          VtkDataTypes.FLOAT,
          pwfFloatTable
        );
      } else {
        // default is opaque
        pwfTable.fill(255.0);
        model.pwfTexture.create2DFromRaw(
          pwfWidth,
          1,
          1,
          VtkDataTypes.UNSIGNED_CHAR,
          pwfTable
        );
      }

      if (pwFunc) {
        model._openGLRenderWindow.setGraphicsResourceForObject(
          pwFunc,
          model.pwfTexture,
          pwfunToString
        );
        if (pwFunc !== model._pwFunc) {
          model._openGLRenderWindow.registerGraphicsResourceUser(
            pwFunc,
            publicAPI
          );
          model._openGLRenderWindow.unregisterGraphicsResourceUser(
            model._pwFunc,
            publicAPI
          );
        }
        model._pwFunc = pwFunc;
      }
    } else {
      model.pwfTexture = pwfTex.oglObject;
    }

    // Build outline thickness buffer
    publicAPI.updatelabelOutlineThicknessTexture(actor);

    // Find what IJK axis and what direction to slice along
    const { ijkMode } = model.renderable.getClosestIJKAxis();

    // Find the IJK slice
    let slice = model.renderable.getSlice();
    if (ijkMode !== model.renderable.getSlicingMode()) {
      // If not IJK slicing, get the IJK slice from the XYZ position/slice
      slice = model.renderable.getSliceAtPosition(slice);
    }

    // Use sub-Slice number/offset if mapper being used is vtkImageArrayMapper,
    // since this mapper uses a collection of vtkImageData (and not just a single vtkImageData).
    const nSlice = model.renderable.isA('vtkImageArrayMapper')
      ? model.renderable.getSubSlice() // get subSlice of the current (possibly multi-frame) image
      : Math.round(slice);

    // Find sliceOffset
    const ext = image.getExtent();
    let sliceOffset;
    if (ijkMode === SlicingMode.I) {
      sliceOffset = nSlice - ext[0];
    }
    if (ijkMode === SlicingMode.J) {
      sliceOffset = nSlice - ext[2];
    }
    if (ijkMode === SlicingMode.K || ijkMode === SlicingMode.NONE) {
      sliceOffset = nSlice - ext[4];
    }

    // rebuild the VBO if the data has changed
    const toString = `${slice}A${image.getMTime()}A${imgScalars.getMTime()}B${publicAPI.getMTime()}C${model.renderable.getSlicingMode()}D${actor
      .getProperty()
      .getInterpolationType()}`;
    if (model.VBOBuildString !== toString) {
      // Build the VBOs
      const dims = image.getDimensions();
      if (!model.openGLTexture) {
        model.openGLTexture = vtkOpenGLTexture.newInstance({
          resizable: true,
        });
      }
      model.openGLTexture.setOpenGLRenderWindow(model._openGLRenderWindow);
      // Use norm16 for scalar texture if the extension is available
      model.openGLTexture.setOglNorm16Ext(
        model.context.getExtension('EXT_texture_norm16')
      );
      if (iType === InterpolationType.NEAREST) {
        if (
          new Set([1, 3, 4]).has(numComp) &&
          dataType === VtkDataTypes.UNSIGNED_CHAR &&
          !iComps
        ) {
          model.openGLTexture.setGenerateMipmap(true);
          model.openGLTexture.setMinificationFilter(Filter.NEAREST);
        } else {
          model.openGLTexture.setMinificationFilter(Filter.NEAREST);
        }
        model.openGLTexture.setMagnificationFilter(Filter.NEAREST);
      } else {
        if (
          numComp === 4 &&
          dataType === VtkDataTypes.UNSIGNED_CHAR &&
          !iComps
        ) {
          model.openGLTexture.setGenerateMipmap(true);
          model.openGLTexture.setMinificationFilter(
            Filter.LINEAR_MIPMAP_LINEAR
          );
        } else {
          model.openGLTexture.setMinificationFilter(Filter.LINEAR);
        }
        model.openGLTexture.setMagnificationFilter(Filter.LINEAR);
      }
      model.openGLTexture.setWrapS(Wrap.CLAMP_TO_EDGE);
      model.openGLTexture.setWrapT(Wrap.CLAMP_TO_EDGE);
      const sliceSize = dims[0] * dims[1] * numComp;

      const ptsArray = new Float32Array(12);
      const tcoordArray = new Float32Array(8);
      for (let i = 0; i < 4; i++) {
        tcoordArray[i * 2] = i % 2 ? 1.0 : 0.0;
        tcoordArray[i * 2 + 1] = i > 1 ? 1.0 : 0.0;
      }

      // Determine depth position of the slicing plane in the scene.
      // Slicing modes X, Y, and Z use a continuous axis position, whereas
      // slicing modes I, J, and K should use discrete positions.
      const sliceDepth = [SlicingMode.X, SlicingMode.Y, SlicingMode.Z].includes(
        model.renderable.getSlicingMode()
      )
        ? slice
        : nSlice;

      const spatialExt = image.getSpatialExtent();
      const basicScalars = imgScalars.getData();
      let scalars = null;
      // Get right scalars according to slicing mode
      if (ijkMode === SlicingMode.I) {
        scalars = new basicScalars.constructor(dims[2] * dims[1] * numComp);
        let id = 0;
        for (let k = 0; k < dims[2]; k++) {
          for (let j = 0; j < dims[1]; j++) {
            let bsIdx =
              (sliceOffset + j * dims[0] + k * dims[0] * dims[1]) * numComp;
            id = (k * dims[1] + j) * numComp;
            const end = bsIdx + numComp;
            while (bsIdx < end) {
              scalars[id++] = basicScalars[bsIdx++];
            }
          }
        }
        dims[0] = dims[1];
        dims[1] = dims[2];
        ptsArray[0] = sliceDepth;
        ptsArray[1] = spatialExt[2];
        ptsArray[2] = spatialExt[4];
        ptsArray[3] = sliceDepth;
        ptsArray[4] = spatialExt[3];
        ptsArray[5] = spatialExt[4];
        ptsArray[6] = sliceDepth;
        ptsArray[7] = spatialExt[2];
        ptsArray[8] = spatialExt[5];
        ptsArray[9] = sliceDepth;
        ptsArray[10] = spatialExt[3];
        ptsArray[11] = spatialExt[5];
      } else if (ijkMode === SlicingMode.J) {
        scalars = new basicScalars.constructor(dims[2] * dims[0] * numComp);
        let id = 0;
        for (let k = 0; k < dims[2]; k++) {
          for (let i = 0; i < dims[0]; i++) {
            let bsIdx =
              (i + sliceOffset * dims[0] + k * dims[0] * dims[1]) * numComp;
            id = (k * dims[0] + i) * numComp;
            const end = bsIdx + numComp;
            while (bsIdx < end) {
              scalars[id++] = basicScalars[bsIdx++];
            }
          }
        }
        dims[1] = dims[2];
        ptsArray[0] = spatialExt[0];
        ptsArray[1] = sliceDepth;
        ptsArray[2] = spatialExt[4];
        ptsArray[3] = spatialExt[1];
        ptsArray[4] = sliceDepth;
        ptsArray[5] = spatialExt[4];
        ptsArray[6] = spatialExt[0];
        ptsArray[7] = sliceDepth;
        ptsArray[8] = spatialExt[5];
        ptsArray[9] = spatialExt[1];
        ptsArray[10] = sliceDepth;
        ptsArray[11] = spatialExt[5];
      } else if (ijkMode === SlicingMode.K || ijkMode === SlicingMode.NONE) {
        scalars = basicScalars.subarray(
          sliceOffset * sliceSize,
          (sliceOffset + 1) * sliceSize
        );
        ptsArray[0] = spatialExt[0];
        ptsArray[1] = spatialExt[2];
        ptsArray[2] = sliceDepth;
        ptsArray[3] = spatialExt[1];
        ptsArray[4] = spatialExt[2];
        ptsArray[5] = sliceDepth;
        ptsArray[6] = spatialExt[0];
        ptsArray[7] = spatialExt[3];
        ptsArray[8] = sliceDepth;
        ptsArray[9] = spatialExt[1];
        ptsArray[10] = spatialExt[3];
        ptsArray[11] = sliceDepth;
      } else {
        vtkErrorMacro('Reformat slicing not yet supported.');
      }

      // Don't share this resource as `scalars` is created in this function
      // so it is impossible to share
      model.openGLTexture.resetFormatAndType();
      model.openGLTexture.create2DFilterableFromRaw(
        dims[0],
        dims[1],
        numComp,
        imgScalars.getDataType(),
        scalars,
        model.renderable.getPreferSizeOverAccuracy?.()
      );
      model.openGLTexture.activate();
      model.openGLTexture.sendParameters();
      model.openGLTexture.deactivate();

      const points = vtkDataArray.newInstance({
        numberOfComponents: 3,
        values: ptsArray,
      });
      points.setName('points');
      const tcoords = vtkDataArray.newInstance({
        numberOfComponents: 2,
        values: tcoordArray,
      });
      tcoords.setName('tcoords');

      const cellArray = new Uint16Array(8);
      cellArray[0] = 3;
      cellArray[1] = 0;
      cellArray[2] = 1;
      cellArray[3] = 3;
      cellArray[4] = 3;
      cellArray[5] = 0;
      cellArray[6] = 3;
      cellArray[7] = 2;
      const cells = vtkDataArray.newInstance({
        numberOfComponents: 1,
        values: cellArray,
      });

      model.tris.getCABO().createVBO(cells, 'polys', Representation.SURFACE, {
        points,
        tcoords,
        cellOffset: 0,
      });
      model.VBOBuildTime.modified();
      model.VBOBuildString = toString;
    }
  };

  publicAPI.updatelabelOutlineThicknessTexture = (image) => {
    const labelOutlineThicknessArray = image
      .getProperty()
      .getLabelOutlineThickness();

    const lTex = model._openGLRenderWindow.getGraphicsResourceForObject(
      labelOutlineThicknessArray
    );

    // compute the join of the labelOutlineThicknessArray so that
    // we can use it to decide whether to rebuild the labelOutlineThicknessTexture
    // or not
    const toString = `${labelOutlineThicknessArray.join('-')}`;

    const reBuildL = !lTex?.oglObject?.getHandle() || lTex?.hash !== toString;

    if (reBuildL) {
      const lWidth = 1024;
      const lHeight = 1;
      const lSize = lWidth * lHeight;
      const lTable = new Uint8Array(lSize);

      // Assuming labelOutlineThicknessArray contains the thickness for each segment
      for (let i = 0; i < lWidth; ++i) {
        // Retrieve the thickness value for the current segment index.
        // If the value is undefined, use the first element's value as a default, otherwise use the value (even if 0)
        const thickness =
          typeof labelOutlineThicknessArray[i] !== 'undefined'
            ? labelOutlineThicknessArray[i]
            : labelOutlineThicknessArray[0];
        lTable[i] = thickness;
      }
      model.labelOutlineThicknessTexture = vtkOpenGLTexture.newInstance({
        resizable: false,
      });
      model.labelOutlineThicknessTexture.setOpenGLRenderWindow(
        model._openGLRenderWindow
      );

      model.labelOutlineThicknessTexture.resetFormatAndType();
      model.labelOutlineThicknessTexture.setMinificationFilter(Filter.NEAREST);
      model.labelOutlineThicknessTexture.setMagnificationFilter(Filter.NEAREST);

      // Create a 2D texture (acting as 1D) from the raw data
      model.labelOutlineThicknessTexture.create2DFromRaw(
        lWidth,
        lHeight,
        1,
        VtkDataTypes.UNSIGNED_CHAR,
        lTable
      );

      if (labelOutlineThicknessArray) {
        model._openGLRenderWindow.setGraphicsResourceForObject(
          labelOutlineThicknessArray,
          model.labelOutlineThicknessTexture,
          toString
        );
        if (labelOutlineThicknessArray !== model._labelOutlineThicknessArray) {
          model._openGLRenderWindow.registerGraphicsResourceUser(
            labelOutlineThicknessArray,
            publicAPI
          );
          model._openGLRenderWindow.unregisterGraphicsResourceUser(
            model._labelOutlineThicknessArray,
            publicAPI
          );
        }
        model._labelOutlineThicknessArray = labelOutlineThicknessArray;
      }
    } else {
      model.labelOutlineThicknessTexture = lTex.oglObject;
    }
  };

  publicAPI.getRenderTargetSize = () => {
    if (model._useSmallViewport) {
      return [model._smallViewportWidth, model._smallViewportHeight];
    }

    const { usize, vsize } = model._openGLRenderer.getTiledSizeAndOrigin();

    return [usize, vsize];
  };

  publicAPI.getRenderTargetOffset = () => {
    const { lowerLeftU, lowerLeftV } =
      model._openGLRenderer.getTiledSizeAndOrigin();

    return [lowerLeftU, lowerLeftV];
  };

  publicAPI.delete = macro.chain(() => {
    if (model._openGLRenderWindow) {
      unregisterGraphicsResources(model._openGLRenderWindow);
    }
  }, publicAPI.delete);
}

// ----------------------------------------------------------------------------
// Object factory
// ----------------------------------------------------------------------------

const DEFAULT_VALUES = {
  VBOBuildTime: 0,
  VBOBuildString: null,
  openGLTexture: null,
  tris: null,
  imagemat: null,
  imagematinv: null,
  colorTexture: null,
  pwfTexture: null,
  labelOutlineThicknessTexture: null,
  labelOutlineThicknessTextureString: null,
  lastHaveSeenDepthRequest: false,
  haveSeenDepthRequest: false,
  lastTextureComponents: 0,
  // _scalars: null,
  // _colorTransferFunc: null,
  // _pwFunc: null,
  // _labelOutlineThicknessArray: null,
};

// ----------------------------------------------------------------------------

export function extend(publicAPI, model, initialValues = {}) {
  Object.assign(model, DEFAULT_VALUES, initialValues);

  // Inheritance
  vtkViewNode.extend(publicAPI, model, initialValues);
  vtkReplacementShaderMapper.implementReplaceShaderCoincidentOffset(
    publicAPI,
    model,
    initialValues
  );
  vtkReplacementShaderMapper.implementBuildShadersWithReplacements(
    publicAPI,
    model,
    initialValues
  );

  model.tris = vtkHelper.newInstance();
  model.imagemat = mat4.identity(new Float64Array(16));
  model.imagematinv = mat4.identity(new Float64Array(16));
  model.projectionToWorld = mat4.identity(new Float64Array(16));
  model.idxToView = mat4.identity(new Float64Array(16));
  model.idxNormalMatrix = mat3.identity(new Float64Array(9));
  model.modelToView = mat4.identity(new Float64Array(16));
  model.projectionToView = mat4.identity(new Float64Array(16));

  // Build VTK API
  macro.setGet(publicAPI, model, []);

  model.VBOBuildTime = {};
  macro.obj(model.VBOBuildTime);

  // Object methods
  vtkOpenGLImageMapper(publicAPI, model);
}

// ----------------------------------------------------------------------------

export const newInstance = macro.newInstance(extend, 'vtkOpenGLImageMapper');

// ----------------------------------------------------------------------------

export default { newInstance, extend };

// Register ourself to OpenGL backend if imported
registerOverride('vtkAbstractImageMapper', newInstance);
