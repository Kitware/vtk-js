import macro              from 'vtk.js/Sources/macro';
import { vec3, mat4 }     from 'gl-matrix';
import vtkDataArray       from 'vtk.js/Sources/Common/Core/DataArray';
import { VtkDataTypes }   from 'vtk.js/Sources/Common/Core/DataArray/Constants';
import vtkHelper          from 'vtk.js/Sources/Rendering/OpenGL/Helper';
import vtkMath            from 'vtk.js/Sources/Common/Core/Math';
import vtkOpenGLFramebuffer from 'vtk.js/Sources/Rendering/OpenGL/Framebuffer';
import vtkOpenGLTexture   from 'vtk.js/Sources/Rendering/OpenGL/Texture';
import vtkShaderProgram   from 'vtk.js/Sources/Rendering/OpenGL/ShaderProgram';
import vtkVertexArrayObject from 'vtk.js/Sources/Rendering/OpenGL/VertexArrayObject';
import vtkViewNode        from 'vtk.js/Sources/Rendering/SceneGraph/ViewNode';
import { Representation } from 'vtk.js/Sources/Rendering/Core/Property/Constants';
import { Filter }         from 'vtk.js/Sources/Rendering/OpenGL/Texture/Constants';
import { InterpolationType } from 'vtk.js/Sources/Rendering/Core/VolumeProperty/Constants';

import vtkVolumeVS from 'vtk.js/Sources/Rendering/OpenGL/glsl/vtkVolumeVS.glsl';
import vtkVolumeFS from 'vtk.js/Sources/Rendering/OpenGL/glsl/vtkVolumeFS.glsl';

const { vtkWarningMacro, vtkErrorMacro } = macro;

// ----------------------------------------------------------------------------
// vtkOpenGLVolumeMapper methods
// ----------------------------------------------------------------------------

export function vtkOpenGLVolumeMapper(publicAPI, model) {
  // Set our className
  model.classHierarchy.push('vtkOpenGLVolumeMapper');

  // Builds myself.
  publicAPI.build = (prepass) => {
    if (prepass) {
      if (!model.renderable) {
        return;
      }
    }
  };

  // Renders myself
  publicAPI.render = (prepass) => {
    if (prepass) {
      model.openGLRenderWindow = publicAPI.getFirstAncestorOfType('vtkOpenGLRenderWindow');
      model.context = model.openGLRenderWindow.getContext();
      model.tris.setContext(model.context);
      model.openGLTexture.setWindow(model.openGLRenderWindow);
      model.openGLTexture.setContext(model.context);
      model.colorTexture.setWindow(model.openGLRenderWindow);
      model.colorTexture.setContext(model.context);
      model.opacityTexture.setWindow(model.openGLRenderWindow);
      model.opacityTexture.setContext(model.context);
      model.framebuffer.setWindow(model.openGLRenderWindow);

      model.openGLVolume = publicAPI.getFirstAncestorOfType('vtkOpenGLVolume');
      const actor = model.openGLVolume.getRenderable();
      model.openGLRenderer = publicAPI.getFirstAncestorOfType('vtkOpenGLRenderer');
      const ren = model.openGLRenderer.getRenderable();
      model.openGLCamera = model.openGLRenderer.getViewNodeFor(ren.getActiveCamera());
      publicAPI.renderPiece(ren, actor);
    } else {
      // something
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

    // insert the right function call for doing z interpolation
    // if needed
    const iType = actor.getProperty().getInterpolationType();
    if (iType === InterpolationType.LINEAR) {
      FSSource = vtkShaderProgram.substitute(FSSource,
        '//VTK::VolumeColorFunctionCall',
        'getVolumeColorLinearZ(vpos);').result;
    } else {
      FSSource = vtkShaderProgram.substitute(FSSource,
        '//VTK::VolumeColorFunctionCall',
        'getVolumeColor(vpos);').result;
    }

    // if we had to encode the scalar values into
    // rgb then add the right call to decode them
    // otherwise the generic texture lookup
    const volInfo = model.openGLTexture.getVolumeInfo();
    if (volInfo.encodedScalars) {
      FSSource = vtkShaderProgram.substitute(FSSource,
        '//VTK::ScalarValueFunction::Impl', [
          '{ vec4 scalarComps = texture2D(texture1, tpos);',
          'scalar = scalarComps.r + scalarComps.g/255.0 + scalarComps.b/65025.0; }',
        ]).result;
    } else {
      FSSource = vtkShaderProgram.substitute(FSSource,
        '//VTK::ScalarValueFunction::Impl',
        'scalar = texture2D(texture1, tpos).r;').result;
    }

    // WebGL only supports loops over constants
    // and does not support while loops so we
    // have to hard code how many steps/samples to take
    // wWe do a break so most systems will gracefully
    // early terminate, but it is always possible
    // a system will execute every step regardless
    FSSource = vtkShaderProgram.substitute(FSSource,
      '//VTK::MaximumSamplesValue',
      `${model.renderable.getMaximumSamplesPerRay()}`).result;

    shaders.Fragment = FSSource;
  };

  publicAPI.getNeedToRebuildShaders = (cellBO, ren, actor) => {
    // has something changed that would require us to recreate the shader?
    // candidates are
    // property modified (representation interpolation and lighting)
    // input modified
    // light complexity changed
    if (cellBO.getProgram() === 0 ||
        cellBO.getShaderSourceTime().getMTime() < publicAPI.getMTime() ||
        cellBO.getShaderSourceTime().getMTime() < actor.getMTime() ||
        cellBO.getShaderSourceTime().getMTime() < model.currentInput.getMTime()) {
      return true;
    }

    return false;
  };

  publicAPI.updateShaders = (cellBO, ren, actor) => {
    cellBO.getVAO().bind();
    model.lastBoundBO = cellBO;

    // has something changed that would require us to recreate the shader?
    if (publicAPI.getNeedToRebuildShaders(cellBO, ren, actor)) {
      const shaders = { Vertex: null, Fragment: null, Geometry: null };

      publicAPI.buildShaders(shaders, ren, actor);

      // compile and bind the program if needed
      const newShader =
        model.openGLRenderWindow.getShaderCache().readyShaderProgramArray(shaders.Vertex, shaders.Fragment, shaders.Geometry);

      // if the shader changed reinitialize the VAO
      if (newShader !== cellBO.getProgram()) {
        cellBO.setProgram(newShader);
        // reset the VAO as the shader has changed
        cellBO.getVAO().releaseGraphicsResources();
      }

      cellBO.getShaderSourceTime().modified();
    } else {
      model.openGLRenderWindow.getShaderCache().readyShaderProgram(cellBO.getProgram());
    }

    publicAPI.setMapperShaderParameters(cellBO, ren, actor);
    publicAPI.setCameraShaderParameters(cellBO, ren, actor);
    publicAPI.setPropertyShaderParameters(cellBO, ren, actor);
  };

  publicAPI.setMapperShaderParameters = (cellBO, ren, actor) => {
    // Now to update the VAO too, if necessary.
    const program = cellBO.getProgram();

    if (cellBO.getCABO().getElementCount() && (model.VBOBuildTime > cellBO.getAttributeUpdateTime().getMTime() ||
        cellBO.getShaderSourceTime().getMTime() > cellBO.getAttributeUpdateTime().getMTime())) {
      cellBO.getCABO().bind();
      if (program.isAttributeUsed('vertexDC')) {
        if (!cellBO.getVAO().addAttributeArray(program, cellBO.getCABO(),
                                           'vertexDC', cellBO.getCABO().getVertexOffset(),
                                           cellBO.getCABO().getStride(), model.context.FLOAT, 3,
                                           model.context.FALSE)) {
          vtkErrorMacro('Error setting vertexDC in shader VAO.');
        }
      }
    }

    program.setUniformi('texture1',
      model.openGLTexture.getTextureUnit());
    program.setUniformf('sampleDistance',
      model.renderable.getSampleDistance());
  };

  publicAPI.setCameraShaderParameters = (cellBO, ren, actor) => {
    // // [WMVD]C == {world, model, view, display} coordinates
    // // E.g., WCDC == world to display coordinate transformation
    const keyMats = model.openGLCamera.getKeyMatrices(ren);

    const program = cellBO.getProgram();

    const cam = model.openGLCamera.getRenderable();
    const crange = cam.getClippingRange();
    program.setUniformf('camThick', crange[1] - crange[0]);

    const bounds = model.currentInput.getBounds();
    const dims = model.currentInput.getDimensions();

    // compute the viewport bounds of the volume
    // we will only render those fragments.
    const pos = vec3.create();
    const dir = vec3.create();
    let dcxmin = 1.0;
    let dcxmax = -1.0;
    let dcymin = 1.0;
    let dcymax = -1.0;
    for (let i = 0; i < 8; ++i) {
      vec3.set(pos, bounds[i % 2],
        bounds[2 + (Math.floor(i / 2) % 2)],
        bounds[4 + Math.floor(i / 4)]);
      vec3.transformMat4(pos, pos, keyMats.wcvc);
      vec3.normalize(dir, pos);

      // now find the projection of this point onto a
      // nearZ distance plane. Since the camera is at 0,0,0
      // in VC the ray is just t*pos and
      // t is -nearZ/dir.z
      // intersection becomes pos.x/pos.z
      const t = -crange[0] / pos[2];
      vec3.scale(pos, dir, t);

      // now convert to DC
      vec3.transformMat4(pos, pos, keyMats.vcdc);

      dcxmin = Math.min(pos[0], dcxmin);
      dcxmax = Math.max(pos[0], dcxmax);
      dcymin = Math.min(pos[1], dcymin);
      dcymax = Math.max(pos[1], dcymax);
    }
    program.setUniformf('dcxmin', dcxmin);
    program.setUniformf('dcxmax', dcxmax);
    program.setUniformf('dcymin', dcymin);
    program.setUniformf('dcymax', dcymax);

    vec3.set(pos, bounds[0], bounds[2], bounds[4]);
    vec3.transformMat4(pos, pos, keyMats.wcvc);
    program.setUniform3f('vOriginVC', pos);
    const vsize = vec3.create();
    vec3.set(vsize,
      bounds[1] - bounds[0],
      bounds[3] - bounds[2],
      bounds[5] - bounds[4]);
    program.setUniform3f('vSize', vsize);

    const maxSamples = vec3.length(vsize) / model.renderable.getSampleDistance();
    if (maxSamples > model.renderable.getMaximumSamplesPerRay()) {
      vtkWarningMacro(
        [`The number of steps required ${Math.ceil(maxSamples)} is larger than the `,
        `specified maximum number of steps ${model.renderable.getMaximumSamplesPerRay()}.`,
        'Please either change the ',
        'volumeMapper sampleDistance or its maximum number of samples.'].join(''));
    }
    const vctoijk = vec3.create();
    vec3.set(vctoijk, dims[0] - 1.0, dims[1] - 1.0, dims[2] - 1.0);
    vec3.divide(vctoijk, vctoijk, vsize);
    program.setUniform3f('vVCToIJK', vctoijk);

    const volInfo = model.openGLTexture.getVolumeInfo();
    program.setUniformf('texWidth', model.openGLTexture.getWidth());
    program.setUniformf('texHeight', model.openGLTexture.getHeight());
    program.setUniformi('xreps', volInfo.xreps);
    program.setUniformf('xstride', volInfo.xstride);
    program.setUniformf('ystride', volInfo.ystride);
    program.setUniformi('repWidth', volInfo.width);
    program.setUniformi('repHeight', volInfo.height);
    program.setUniformi('repDepth', dims[2]);

    // map normals through normal matrix
    // then use a point on the plane to compute the distance
    for (let i = 0; i < 6; ++i) {
      const normal = vec3.create();
      const pos2 = vec3.create();
      switch (i) {
        default:
        case 0: vec3.set(normal, 1.0, 0.0, 0.0);
          vec3.set(pos2, bounds[1], bounds[3], bounds[5]);
          break;
        case 1: vec3.set(normal, -1.0, 0.0, 0.0);
          vec3.set(pos2, bounds[0], bounds[2], bounds[4]);
          break;
        case 2: vec3.set(normal, 0.0, 1.0, 0.0);
          vec3.set(pos2, bounds[1], bounds[3], bounds[5]);
          break;
        case 3: vec3.set(normal, 0.0, -1.0, 0.0);
          vec3.set(pos2, bounds[0], bounds[2], bounds[4]);
          break;
        case 4: vec3.set(normal, 0.0, 0.0, 1.0);
          vec3.set(pos2, bounds[1], bounds[3], bounds[5]);
          break;
        case 5: vec3.set(normal, 0.0, 0.0, -1.0);
          vec3.set(pos2, bounds[0], bounds[2], bounds[4]);
          break;
      }
      vec3.transformMat3(normal, normal, keyMats.normalMatrix);
      vec3.transformMat4(pos2, pos2, keyMats.wcvc);
      const dist = -1.0 * vec3.dot(pos2, normal);

      // we have the plane in view coordinates
      // specify the planes in view coordinates
      program.setUniform3f(`vPlaneNormal${i}`, normal);
      program.setUniformf(`vPlaneDistance${i}`, dist);
    }

    const dcvc = mat4.create();
    mat4.invert(dcvc, keyMats.vcdc);
    program.setUniformMatrix('DCVCMatrix', dcvc);
  };

  publicAPI.setPropertyShaderParameters = (cellBO, ren, actor) => {
    const program = cellBO.getProgram();

    program.setUniformi('ctexture',
      model.colorTexture.getTextureUnit());
    program.setUniformi('otexture',
      model.opacityTexture.getTextureUnit());

    const volInfo = model.openGLTexture.getVolumeInfo();
    const sscale = volInfo.max - volInfo.min;

    const vprop = actor.getProperty();
    const ofun = vprop.getScalarOpacity(0);
    const oRange = ofun.getRange();
    program.setUniformf('oshift', (volInfo.min - oRange[0]) / (oRange[1] - oRange[0]));
    program.setUniformf('oscale', sscale / (oRange[1] - oRange[0]));

    const cfun = vprop.getRGBTransferFunction(0);
    const cRange = cfun.getRange();
    program.setUniformf('cshift', (volInfo.min - cRange[0]) / (oRange[1] - oRange[0]));
    program.setUniformf('cscale', sscale / (cRange[1] - cRange[0]));
  };

  publicAPI.renderPieceStart = (ren, actor) => {
    if (model.renderable.getAutoAdjustSampleDistances() &&
        ren.getVTKWindow().getInteractor().isAnimating()) {
      // compute the image sample distance for the desired
      // frame rate
      const rwi = ren.getVTKWindow().getInteractor();
      const rft = rwi.getRecentFrameTime();

      // do a moving average
      let txyf = model.lastXYF * Math.sqrt(rwi.getDesiredUpdateRate() * rft);
      // limit subsampling to a factor of 8
      if (txyf > 8.0) {
        txyf = 8.0;
      }
      // only use FBO for reasonable savings (at least 44% (1.2*1.2 - 1.0))
      if (txyf < 1.2) {
        txyf = 1.0;
      }
      model.targetXYF = (model.targetXYF * 0.75) + (0.25 * txyf);
      const factor = model.targetXYF / model.lastXYF;
      if (factor > 1.3 || factor < 0.8) {
        model.lastXYF = model.targetXYF;
      }
      if (model.targetXYF < 1.1) {
        model.lastXYF = 1.0;
      }
    } else {
      model.lastXYF = model.renderable.getImageSampleDistance();
    }

    const xyf = model.lastXYF;

    // create/resize framebuffer if needed
    if (xyf !== 1.0) {
      model.framebuffer.saveCurrentBindingsAndBuffers();
      const size = model.openGLRenderWindow.getSize();

      if (model.framebuffer.getGLFramebuffer() === null) {
        model.framebuffer.create(
          Math.floor((size[0] / xyf) + 0.5),
          Math.floor((size[1] / xyf) + 0.5));
        model.framebuffer.populateFramebuffer();
      } else {
        const fbSize = model.framebuffer.getSize();
        if (fbSize[0] !== Math.floor((size[0] / xyf) + 0.5) ||
            fbSize[1] !== Math.floor((size[1] / xyf) + 0.5)) {
          model.framebuffer.create(
            Math.floor((size[0] / xyf) + 0.5),
            Math.floor((size[1] / xyf) + 0.5));
          model.framebuffer.populateFramebuffer();
        }
      }
      model.framebuffer.bind();
      const gl = model.context;
      gl.clearColor(0.0, 0.0, 0.0, 0.0);
      gl.colorMask(true, true, true, true);
      gl.clear(gl.COLOR_BUFFER_BIT);
      gl.viewport(0, 0, size[0] / xyf, size[1] / xyf);
    }
    model.context.disable(model.context.DEPTH_TEST);

    // make sure the BOs are up to date
    publicAPI.updateBufferObjects(ren, actor);

    // set interpolation on the texture based on property setting
    const iType = actor.getProperty().getInterpolationType();
    if (iType === InterpolationType.NEAREST) {
      model.openGLTexture.setMinificationFilter(Filter.NEAREST);
      model.openGLTexture.setMagnificationFilter(Filter.NEAREST);
    } else {
      model.openGLTexture.setMinificationFilter(Filter.LINEAR);
      model.openGLTexture.setMagnificationFilter(Filter.LINEAR);
    }

    // Bind the OpenGL, this is shared between the different primitive/cell types.
    model.lastBoundBO = null;
  };

  publicAPI.renderPieceDraw = (ren, actor) => {
    const gl = model.context;

    // render the texture
    model.openGLTexture.activate();
    model.opacityTexture.activate();
    model.colorTexture.activate();

    // draw polygons
    if (model.tris.getCABO().getElementCount()) {
      // First we do the triangles, update the shader, set uniforms, etc.
      publicAPI.updateShaders(model.tris, ren, actor);
      gl.drawArrays(gl.TRIANGLES, 0,
        model.tris.getCABO().getElementCount());
    }

    model.openGLTexture.deactivate();
    model.colorTexture.deactivate();
    model.opacityTexture.deactivate();
  };

  publicAPI.renderPieceFinish = (ren, actor) => {
    if (model.LastBoundBO) {
      model.LastBoundBO.getVAO().release();
    }

    if (model.lastXYF !== 1.0) {
//    if (model.renderable.getImageSampleDistance() !== 1.0) {
      // now copy the frambuffer with the volume into the
      // regular buffer
      model.framebuffer.restorePreviousBindingsAndBuffers();

      if (model.copyShader === null) {
        model.copyShader =
          model.openGLRenderWindow.getShaderCache().readyShaderProgramArray(
            ['//VTK::System::Dec',
            'attribute vec4 vertexDC;',
            'varying vec2 tcoord;',
            'void main() { tcoord = vec2(vertexDC.x*0.5 + 0.5, vertexDC.y*0.5 + 0.5); gl_Position = vertexDC; }'].join('\n'),
            ['//VTK::System::Dec',
             '//VTK::Output::Dec',
             'uniform sampler2D texture;',
             'varying vec2 tcoord;',
             'void main() { gl_FragData[0] = texture2D(texture,tcoord); }'].join('\n'),
             '');
        const program = model.copyShader;

        model.copyVAO = vtkVertexArrayObject.newInstance();
        model.copyVAO.setContext(model.context);

        model.tris.getCABO().bind();
        if (!model.copyVAO.addAttributeArray(
            program, model.tris.getCABO(),
           'vertexDC', model.tris.getCABO().getVertexOffset(),
            model.tris.getCABO().getStride(), model.context.FLOAT, 3,
           model.context.FALSE)) {
          vtkErrorMacro('Error setting vertexDC in copy shader VAO.');
        }
      } else {
        model.openGLRenderWindow.getShaderCache().readyShaderProgram(model.copyShader);
      }

      const size = model.openGLRenderWindow.getSize();
      model.context.viewport(0, 0, size[0], size[1]);

      // activate texture
      const tex = model.framebuffer.getColorTexture();
      tex.activate();
      model.copyShader.setUniformi('texture',
        tex.getTextureUnit());

      const gl = model.context;
      gl.blendFuncSeparate(gl.ONE, gl.ONE_MINUS_SRC_ALPHA,
                       gl.ONE, gl.ONE_MINUS_SRC_ALPHA);

      // render quad
      model.context.drawArrays(model.context.TRIANGLES, 0,
        model.tris.getCABO().getElementCount());
      tex.deactivate();

      gl.blendFuncSeparate(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA,
                       gl.ONE, gl.ONE_MINUS_SRC_ALPHA);
    }
  };

  publicAPI.renderPiece = (ren, actor) => {
    publicAPI.invokeEvent({ type: 'StartEvent' });
    model.renderable.update();
    model.currentInput = model.renderable.getInputData();
    publicAPI.invokeEvent({ type: 'EndEvent' });

    if (model.currentInput === null) {
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
    model.bounnds = publicAPI.getInput().getBounds();
  };

  publicAPI.updateBufferObjects = (ren, actor) => {
    // Rebuild buffers if needed
    if (publicAPI.getNeedToRebuildBufferObjects(ren, actor)) {
      publicAPI.buildBufferObjects(ren, actor);
    }
  };

  publicAPI.getNeedToRebuildBufferObjects = (ren, actor) => {
    // first do a coarse check
    if (model.VBOBuildTime.getMTime() < publicAPI.getMTime() ||
        model.VBOBuildTime.getMTime() < actor.getMTime() ||
        model.VBOBuildTime.getMTime() < actor.getProperty().getMTime() ||
        model.VBOBuildTime.getMTime() < model.currentInput.getMTime()) {
      return true;
    }
    return false;
  };

  publicAPI.buildBufferObjects = (ren, actor) => {
    const image = model.currentInput;

    if (image === null) {
      return;
    }

    const vprop = actor.getProperty();

    // rebuild opacity tfun?
    const ofun = vprop.getScalarOpacity(0);
    const opacityFactor = model.renderable.getSampleDistance() /
      vprop.getScalarOpacityUnitDistance(0);
    if (model.lastOpacityFactor !== opacityFactor ||
        model.opacityBuildTime.getMTime() < ofun.getMTime()) {
      const oRange = ofun.getRange();
      const oWidth = 1024;
      const ofTable = new Float32Array(oWidth);
      ofun.getTable(oRange[0], oRange[1], oWidth, ofTable, 1);
      const oTable = new Uint8Array(oWidth);
      model.lastOpacityFactor = opacityFactor;
      for (let i = 0; i < oWidth; ++i) {
        oTable[i] = 255.0 * (1.0 - Math.pow(1.0 - ofTable[i], opacityFactor));
      }
      model.opacityTexture.setMinificationFilter(Filter.LINEAR);
      model.opacityTexture.setMagnificationFilter(Filter.LINEAR);
      model.opacityTexture.create2DFromRaw(oWidth, 1, 1,
        VtkDataTypes.UNSIGNED_CHAR, oTable);
      model.opacityBuildTime.modified();
    }

    // rebuild color tfun?
    const cfun = vprop.getRGBTransferFunction(0);
    if (model.colorBuildTime.getMTime() < cfun.getMTime()) {
      const cRange = cfun.getRange();
      const cWidth = 1024;
      const cfTable = new Float32Array(cWidth * 3);
      cfun.getTable(cRange[0], cRange[1], cWidth, cfTable, 1);
      const cTable = new Uint8Array(cWidth * 3);
      for (let i = 0; i < cWidth * 3; ++i) {
        cTable[i] = 255.0 * cfTable[i];
      }
      model.colorTexture.setMinificationFilter(Filter.LINEAR);
      model.colorTexture.setMagnificationFilter(Filter.LINEAR);
      model.colorTexture.create2DFromRaw(cWidth, 1, 3,
        VtkDataTypes.UNSIGNED_CHAR, cTable);
      model.colorBuildTime.modified();
    }

    // rebuild scalar texture?
    if (model.scalarBuildTime.getMTime() < image.getMTime()) {
      // Build the textures
      const dims = image.getDimensions();
      model.openGLTexture.create3DOneComponentFromRaw(dims[0], dims[1], dims[2],
        image.getPointData().getScalars().getDataType(),
        image.getPointData().getScalars().getData());
      model.scalarBuildTime.modified();
    }

    // rebuild the VBO if the data has changed
    const toString = `${image.getMTime()}A${publicAPI.getMTime()}`;

    if (model.VBOBuildString !== toString) {
      // build the CABO
      const ptsArray = new Float32Array(12);
      for (let i = 0; i < 4; i++) {
        ptsArray[(i * 3)] = ((i % 2) * 2) - 1.0;
        ptsArray[(i * 3) + 1] = (i > 1) ? 1.0 : -1.0;
        ptsArray[(i * 3) + 2] = -1.0;
      }

      const points = vtkDataArray.newInstance({ numberOfComponents: 3, values: ptsArray });
      points.setName('points');

      const cellArray = new Uint16Array(8);
      cellArray[0] = 3;
      cellArray[1] = 0;
      cellArray[2] = 1;
      cellArray[3] = 3;
      cellArray[4] = 3;
      cellArray[5] = 0;
      cellArray[6] = 3;
      cellArray[7] = 2;
      const cells = vtkDataArray.newInstance({ numberOfComponents: 1, values: cellArray });

      model.tris.getCABO().createVBO(cells,
        'polys', Representation.SURFACE,
        { points, cellOffset: 0 });
      model.VBOBuildTime.modified();
      model.VBOBuildString = toString;
    }
  };
}

// ----------------------------------------------------------------------------
// Object factory
// ----------------------------------------------------------------------------

const DEFAULT_VALUES = {
  context: null,
  VBOBuildTime: 0,
  VBOBuildString: null,
  openGLTexture: null,
  opacityTexture: null,
  colorTexture: null,
  tris: null,
  opacityBuildTime: null,
  colorBuildTime: null,
  scalarBuildTime: null,
  lastOpacityFactor: 0.0,
  framebuffer: null,
  copyShader: null,
  copyVAO: null,
  lastXYF: 1.0,
  targetXYF: 1.0,
};

// ----------------------------------------------------------------------------

export function extend(publicAPI, model, initialValues = {}) {
  Object.assign(model, DEFAULT_VALUES, initialValues);

  // Inheritance
  vtkViewNode.extend(publicAPI, model, initialValues);

  model.tris = vtkHelper.newInstance();
  model.openGLTexture = vtkOpenGLTexture.newInstance();
  model.opacityTexture = vtkOpenGLTexture.newInstance();
  model.colorTexture = vtkOpenGLTexture.newInstance();
  model.framebuffer = vtkOpenGLFramebuffer.newInstance();

  // Build VTK API
  macro.setGet(publicAPI, model, [
    'context',
  ]);

  model.VBOBuildTime = {};
  macro.obj(model.VBOBuildTime, { mtime: 0 });
  model.opacityBuildTime = {};
  macro.obj(model.opacityBuildTime, { mtime: 0 });
  model.colorBuildTime = {};
  macro.obj(model.colorBuildTime, { mtime: 0 });
  model.scalarBuildTime = {};
  macro.obj(model.scalarBuildTime, { mtime: 0 });

  // Object methods
  vtkOpenGLVolumeMapper(publicAPI, model);
}

// ----------------------------------------------------------------------------

export const newInstance = macro.newInstance(extend, 'vtkOpenGLVolumeMapper');

// ----------------------------------------------------------------------------

export default { newInstance, extend };
