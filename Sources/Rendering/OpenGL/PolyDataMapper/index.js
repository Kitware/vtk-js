import { mat3, mat4 } from 'gl-matrix';

import * as macro from '../../../macro';
import vtkHelper from '../Helper';
import vtkMath from '../../../Common/Core/Math';
import vtkShaderProgram from '../ShaderProgram';
import vtkOpenGLTexture from '../Texture';
import vtkViewNode from '../../SceneGraph/ViewNode';
import { VTK_REPRESENTATION, VTK_SHADING } from '../../Core/Property/Constants';
import { VTK_MATERIALMODE, VTK_SCALAR_MODE } from '../../Core/Mapper/Constants';
import { VTK_FILTER, VTK_WRAP } from '../Texture/Constants';

import vtkPolyDataVS from '../glsl/vtkPolyDataVS.glsl';
import vtkPolyDataFS from '../glsl/vtkPolyDataFS.glsl';

/* eslint-disable no-lonely-if */

const primTypes = {
  Start: 0,
  Points: 0,
  Lines: 1,
  Tris: 2,
  TriStrips: 3,
  TrisEdges: 4,
  TriStripsEdges: 5,
  End: 6,
};

// ----------------------------------------------------------------------------
// vtkOpenGLPolyDataMapper methods
// ----------------------------------------------------------------------------

export function vtkOpenGLPolyDataMapper(publicAPI, model) {
  // Set our className
  model.classHierarchy.push('vtkOpenGLPolyDataMapper');

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
      for (let i = primTypes.Start; i < primTypes.End; i++) {
        model.primitives[i].setContext(model.context);
      }
      model.openGLActor = publicAPI.getFirstAncestorOfType('vtkOpenGLActor');
      const actor = model.openGLActor.getRenderable();
      const openGLRenderer = publicAPI.getFirstAncestorOfType('vtkOpenGLRenderer');
      const ren = openGLRenderer.getRenderable();
      model.openGLCamera = openGLRenderer.getViewNodeFor(ren.getActiveCamera());
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
    shaders.Vertex = vtkPolyDataVS;
    shaders.Fragment = vtkPolyDataFS;
    shaders.Geometry = '';
  };

  publicAPI.replaceShaderColor = (shaders, ren, actor) => {
    let VSSource = shaders.Vertex;
    let GSSource = shaders.Geometry;
    let FSSource = shaders.Fragment;

    const lastLightComplexity =
      model.lastLightComplexity.get(model.lastBoundBO.getPrimitiveType());

    // create the material/color property declarations, and VS implementation
    // these are always defined
    let colorDec = [
      'uniform float opacityUniform; // the fragment opacity',
      'uniform vec3 ambientColorUniform; // intensity weighted color',
      'uniform vec3 diffuseColorUniform; // intensity weighted color'];
    // add more for specular
    if (lastLightComplexity) {
      colorDec = colorDec.concat([
        'uniform vec3 specularColorUniform; // intensity weighted color',
        'uniform float specularPowerUniform;']);
    }

    // now handle the more complex fragment shader implementation
    // the following are always defined variables.  We start
    // by assiging a default value from the uniform
    let colorImpl = [
      'vec3 ambientColor;',
      '  vec3 diffuseColor;',
      '  float opacity;'];
    if (lastLightComplexity) {
      colorImpl = colorImpl.concat([
        '  vec3 specularColor;',
        '  float specularPower;']);
    }
    colorImpl = colorImpl.concat([
      '  ambientColor = ambientColorUniform;',
      '  diffuseColor = diffuseColorUniform;',
      '  opacity = opacityUniform;']);
    if (lastLightComplexity) {
      colorImpl = colorImpl.concat([
        '  specularColor = specularColorUniform;',
        '  specularPower = specularPowerUniform;']);
    }

    // add scalar vertex coloring
    if (model.lastBoundBO.getCABO().getColorComponents() !== 0 &&
        !model.drawingEdges) {
      colorDec = colorDec.concat(['varying vec4 vertexColorVSOutput;']);
      VSSource = vtkShaderProgram.substitute(VSSource, '//VTK::Color::Dec', [
        'attribute vec4 scalarColor;',
        'varying vec4 vertexColorVSOutput;']).result;
      VSSource = vtkShaderProgram.substitute(VSSource, '//VTK::Color::Impl', [
        'vertexColorVSOutput =  scalarColor;']).result;
      GSSource = vtkShaderProgram.substitute(GSSource,
        '//VTK::Color::Dec', [
          'in vec4 vertexColorVSOutput[];',
          'out vec4 vertexColorGSOutput;']).result;
      GSSource = vtkShaderProgram.substitute(GSSource,
        '//VTK::Color::Impl', [
          'vertexColorGSOutput = vertexColorVSOutput[i];']).result;
    }

    const scalarMatMode = model.renderable.getScalarMaterialMode();

    if (model.lastBoundBO.getCABO().getColorComponents() !== 0 &&
        !model.drawingEdges) {
      if (scalarMatMode === VTK_MATERIALMODE.AMBIENT ||
          (scalarMatMode === VTK_MATERIALMODE.DEFAULT &&
            actor.getProperty().getAmbient() > actor.getProperty().getDiffuse())) {
        FSSource = vtkShaderProgram.substitute(FSSource, '//VTK::Color::Impl',
          colorImpl.concat([
            '  ambientColor = vertexColorVSOutput.rgb;',
            '  opacity = opacity*vertexColorVSOutput.a;'])).result;
      } else if (scalarMatMode === VTK_MATERIALMODE.DIFFUSE ||
          (scalarMatMode === VTK_MATERIALMODE.DEFAULT &&
            actor.getProperty().getAmbient() <= actor.getProperty().getDiffuse())) {
        FSSource = vtkShaderProgram.substitute(FSSource, '//VTK::Color::Impl',
          colorImpl.concat([
            '  diffuseColor = vertexColorVSOutput.rgb;',
            '  opacity = opacity*vertexColorVSOutput.a;'])).result;
      } else {
        FSSource = vtkShaderProgram.substitute(FSSource, '//VTK::Color::Impl',
          colorImpl.concat([
            '  diffuseColor = vertexColorVSOutput.rgb;',
            '  ambientColor = vertexColorVSOutput.rgb;',
            '  opacity = opacity*vertexColorVSOutput.a;'])).result;
      }
    } else {
      if (model.renderable.getInterpolateScalarsBeforeMapping()
         && model.renderable.getColorCoordinates()
         && !model.drawingEdges) {
        if (scalarMatMode === VTK_MATERIALMODE.AMBIENT ||
          (scalarMatMode === VTK_MATERIALMODE.DEFAULT &&
            actor.getProperty().getAmbient() > actor.getProperty().getDiffuse())) {
          FSSource = vtkShaderProgram.substitute(FSSource, '//VTK::Color::Impl',
            colorImpl.concat([
              '  vec4 texColor = texture2D(texture1, tcoordVCVSOutput.st);',
              '  ambientColor = texColor.rgb;',
              '  opacity = opacity*texColor.a;'])).result;
        } else if (scalarMatMode === VTK_MATERIALMODE.DIFFUSE ||
            (scalarMatMode === VTK_MATERIALMODE.DEFAULT &&
              actor.getProperty().getAmbient() <= actor.getProperty().getDiffuse())) {
          FSSource = vtkShaderProgram.substitute(FSSource, '//VTK::Color::Impl',
            colorImpl.concat([
              '  vec4 texColor = texture2D(texture1, tcoordVCVSOutput.st);',
              '  diffuseColor = texColor.rgb;',
              '  opacity = opacity*texColor.a;'])).result;
        } else {
          FSSource = vtkShaderProgram.substitute(FSSource, '//VTK::Color::Impl',
            colorImpl.concat([
              '  vec4 texColor = texture2D(texture1, tcoordVCVSOutput.st);',
              '  diffuseColor = texColor.rgb;',
              '  ambientColor = texColor.rgb;',
              '  opacity = opacity*texColor.a;'])).result;
        }
      } else {
        FSSource = vtkShaderProgram.substitute(FSSource, '//VTK::Color::Impl', colorImpl).result;
      }
    }

    FSSource = vtkShaderProgram.substitute(FSSource, '//VTK::Color::Dec',
      colorDec).result;

    shaders.Vertex = VSSource;
    shaders.Geometry = GSSource;
    shaders.Fragment = FSSource;
  };

  publicAPI.replaceShaderLight = (shaders, ren, actor) => {
    let FSSource = shaders.Fragment;

    // check for shadow maps
    const shadowFactor = '';

    const lastLightComplexity =
      model.lastLightComplexity.get(model.lastBoundBO.getPrimitiveType());

    switch (lastLightComplexity) {
      case 0: // no lighting or RENDER_VALUES
        FSSource = vtkShaderProgram.substitute(FSSource, '//VTK::Light::Impl', [
          '  gl_FragData[0] = vec4(ambientColor + diffuseColor, opacity);',
          '  //VTK::Light::Impl'],
        false
        ).result;
        break;

      case 1:  // headlight
        FSSource = vtkShaderProgram.substitute(FSSource, '//VTK::Light::Impl', [
          '  float df = max(0.0, normalVCVSOutput.z);',
          '  float sf = pow(df, specularPower);',
          '  vec3 diffuse = df * diffuseColor;',
          '  vec3 specular = sf * specularColor;',
          '  gl_FragData[0] = vec4(ambientColor + diffuse + specular, opacity);',
          '  //VTK::Light::Impl'],
          false).result;
        break;

      case 2: // light kit
        FSSource = vtkShaderProgram.substitute(FSSource, '//VTK::Light::Dec', [
          // only allow for up to 6 active lights
          'uniform int numberOfLights;',
          // intensity weighted color
          'uniform vec3 lightColor[6];',
          'uniform vec3 lightDirectionVC[6]; // normalized',
          'uniform vec3 lightHalfAngleVC[6]; // normalized']).result;
        FSSource = vtkShaderProgram.substitute(FSSource, '//VTK::Light::Impl', [
          'vec3 diffuse = vec3(0,0,0);',
          '  vec3 specular = vec3(0,0,0);',
          '  for (int lightNum = 0; lightNum < numberOfLights; lightNum++)',
          '    {',
          '    float df = max(0.0, dot(normalVCVSOutput, -lightDirectionVC[lightNum]));',
          `    diffuse += ((df${shadowFactor}) * lightColor[lightNum]);`,
          '    if (dot(normalVCVSOutput, lightDirectionVC[lightNum]) < 0.0)',
          '      {',
          '      float sf = pow( max(0.0, dot(lightHalfAngleVC[lightNum],normalVCVSOutput)), specularPower);',
          `      specular += ((sf${shadowFactor}) * lightColor[lightNum]);`,
          '      }',
          '    }',
          '  diffuse = diffuse * diffuseColor;',
          '  specular = specular * specularColor;',
          '  gl_FragData[0] = vec4(ambientColor + diffuse + specular, opacity);',
          '  //VTK::Light::Impl'],
          false
          ).result;
        break;

      case 3: // positional
        FSSource = vtkShaderProgram.substitute(FSSource, '//VTK::Light::Dec', [
          // only allow for up to 6 active lights
          'uniform int numberOfLights;',
          // intensity weighted color
          'uniform vec3 lightColor[6];',
          'uniform vec3 lightDirectionVC[6]; // normalized',
          'uniform vec3 lightHalfAngleVC[6]; // normalized',
          'uniform vec3 lightPositionVC[6];',
          'uniform vec3 lightAttenuation[6];',
          'uniform float lightConeAngle[6];',
          'uniform float lightExponent[6];',
          'uniform int lightPositional[6];']
        ).result;
        FSSource = vtkShaderProgram.substitute(FSSource, '//VTK::Light::Impl', [
          '  vec3 diffuse = vec3(0,0,0);',
          '  vec3 specular = vec3(0,0,0);',
          '  vec3 vertLightDirectionVC;',
          '  for (int lightNum = 0; lightNum < numberOfLights; lightNum++)',
          '    {',
          '    float attenuation = 1.0;',
          '    if (lightPositional[lightNum] == 0)',
          '      {',
          '      vertLightDirectionVC = lightDirectionVC[lightNum];',
          '      }',
          '    else',
          '      {',
          '      vertLightDirectionVC = vertexVC.xyz - lightPositionVC[lightNum];',
          '      float distanceVC = length(vertLightDirectionVC);',
          '      vertLightDirectionVC = normalize(vertLightDirectionVC);',
          '      attenuation = 1.0 /',
          '        (lightAttenuation[lightNum].x',
          '         + lightAttenuation[lightNum].y * distanceVC',
          '         + lightAttenuation[lightNum].z * distanceVC * distanceVC);',
          '      // per OpenGL standard cone angle is 90 or less for a spot light',
          '      if (lightConeAngle[lightNum] <= 90.0)',
          '        {',
          '        float coneDot = dot(vertLightDirectionVC, lightDirectionVC[lightNum]);',
          '        // if inside the cone',
          '        if (coneDot >= cos(radians(lightConeAngle[lightNum])))',
          '          {',
          '          attenuation = attenuation * pow(coneDot, lightExponent[lightNum]);',
          '          }',
          '        else',
          '          {',
          '          attenuation = 0.0;',
          '          }',
          '        }',
          '      }',
          '    float df = max(0.0, attenuation*dot(normalVCVSOutput, -vertLightDirectionVC));',
          `    diffuse += ((df${shadowFactor}) * lightColor[lightNum]);`,
          '    if (dot(normalVCVSOutput, vertLightDirectionVC) < 0.0)',
          '      {',
          '      float sf = attenuation*pow( max(0.0, dot(lightHalfAngleVC[lightNum],normalVCVSOutput)), specularPower);',
          `      specular += ((sf${shadowFactor}) * lightColor[lightNum]);`,
          '      }',
          '    }',
          '  diffuse = diffuse * diffuseColor;',
          '  specular = specular * specularColor;',
          '  gl_FragData[0] = vec4(ambientColor + diffuse + specular, opacity);',
          '  //VTK::Light::Impl'],
          false
          ).result;
        break;
      default:
        vtkErrorMacro('bad light complexity');
    }

    shaders.Fragment = FSSource;
  };

  publicAPI.replaceShaderNormal = (shaders, ren, actor) => {
    if (model.lastLightComplexity.get(model.lastBoundBO.getPrimitiveType()) > 0) {
      let VSSource = shaders.Vertex;
      let GSSource = shaders.Geometry;
      let FSSource = shaders.Fragment;

      if (model.lastBoundBO.getCABO().getNormalOffset()) {
        VSSource = vtkShaderProgram.substitute(VSSource,
          '//VTK::Normal::Dec', [
            'attribute vec3 normalMC;',
            'uniform mat3 normalMatrix;',
            'varying vec3 normalVCVSOutput;']).result;
        VSSource = vtkShaderProgram.substitute(VSSource,
          '//VTK::Normal::Impl', [
            'normalVCVSOutput = normalMatrix * normalMC;']).result;
        GSSource = vtkShaderProgram.substitute(GSSource,
          '//VTK::Normal::Dec', [
            'in vec3 normalVCVSOutput[];',
            'out vec3 normalVCGSOutput;']).result;
        GSSource = vtkShaderProgram.substitute(GSSource,
          '//VTK::Normal::Impl', [
            'normalVCGSOutput = normalVCVSOutput[i];']).result;
        FSSource = vtkShaderProgram.substitute(FSSource,
          '//VTK::Normal::Dec', [
            'varying vec3 normalVCVSOutput;']).result;
        FSSource = vtkShaderProgram.substitute(FSSource,
          '//VTK::Normal::Impl', [
            'vec3 normalVCVSOutput = normalize(normalVCVSOutput);',
            //  if (!gl_FrontFacing) does not work in intel hd4000 mac
            //  if (int(gl_FrontFacing) == 0) does not work on mesa
            '  if (gl_FrontFacing == false) { normalVCVSOutput = -normalVCVSOutput; }']
          ).result;
      } else {
        if (model.haveCellNormals) {
          FSSource = vtkShaderProgram.substitute(FSSource,
            '//VTK::Normal::Dec', [
              'uniform mat3 normalMatrix;',
              'uniform samplerBuffer textureN;']).result;
          FSSource = vtkShaderProgram.substitute(FSSource,
            '//VTK::Normal::Impl', [
              'vec3 normalVCVSOutput = normalize(normalMatrix *',
              '    texelFetchBuffer(textureN, gl_PrimitiveID + PrimitiveIDOffset).xyz);',
              '  if (gl_FrontFacing == false) { normalVCVSOutput = -normalVCVSOutput; }']
            ).result;
        } else {
          if (model.lastBoundBO.getPrimitiveType() === primTypes.Lines ||
              actor.getProperty().getRepresentation() === VTK_REPRESENTATION.WIREFRAME) {
            // generate a normal for lines, it will be perpendicular to the line
            // and maximally aligned with the camera view direction
            // no clue if this is the best way to do this.
            // the code below has been optimized a bit so what follows is
            // an explanation of the basic approach. Compute the gradient of the line
            // with respect to x and y, the the larger of the two
            // cross that with the camera view direction. That gives a vector
            // orthogonal to the camera view and the line. Note that the line and the camera
            // view are probably not orthogonal. Which is why when we cross result that with
            // the line gradient again we get a reasonable normal. It will be othogonal to
            // the line (which is a plane but maximally aligned with the camera view.
            FSSource = vtkShaderProgram.substitute(FSSource, '//VTK::UniformFlow::Impl', [
              '  vec3 fdx = vec3(dFdx(vertexVC.x),dFdx(vertexVC.y),dFdx(vertexVC.z));',
              '  vec3 fdy = vec3(dFdy(vertexVC.x),dFdy(vertexVC.y),dFdy(vertexVC.z));',
              '  //VTK::UniformFlow::Impl'] // For further replacements
              ).result;
            FSSource = vtkShaderProgram.substitute(FSSource, '//VTK::Normal::Impl', [
              'vec3 normalVCVSOutput;',
              '  fdx = normalize(fdx);',
              '  fdy = normalize(fdy);',
              '  if (abs(fdx.x) > 0.0)',
              '    { normalVCVSOutput = normalize(cross(vec3(fdx.y, -fdx.x, 0.0), fdx)); }',
              '  else { normalVCVSOutput = normalize(cross(vec3(fdy.y, -fdy.x, 0.0), fdy));}']
              ).result;
          } else {
            FSSource = vtkShaderProgram.substitute(FSSource,
              '//VTK::Normal::Dec', [
                'uniform int cameraParallel;']).result;

            FSSource = vtkShaderProgram.substitute(FSSource, '//VTK::UniformFlow::Impl', [
              // '  vec3 fdx = vec3(dFdx(vertexVC.x),dFdx(vertexVC.y),dFdx(vertexVC.z));',
              // '  vec3 fdy = vec3(dFdy(vertexVC.x),dFdy(vertexVC.y),dFdy(vertexVC.z));',
              '  vec3 fdx = dFdx(vertexVC.xyz);',
              '  vec3 fdy = dFdy(vertexVC.xyz);',
              '  //VTK::UniformFlow::Impl'] // For further replacements
              ).result;
            FSSource = vtkShaderProgram.substitute(FSSource, '//VTK::Normal::Impl', [
              '  fdx = normalize(fdx);',
              '  fdy = normalize(fdy);',
              '  vec3 normalVCVSOutput = normalize(cross(fdx,fdy));',
              // the code below is faster, but does not work on some devices
              // 'vec3 normalVC = normalize(cross(dFdx(vertexVC.xyz), dFdy(vertexVC.xyz)));',
              '  if (cameraParallel == 1 && normalVCVSOutput.z < 0.0) { normalVCVSOutput = -1.0*normalVCVSOutput; }',
              '  if (cameraParallel == 0 && dot(normalVCVSOutput,vertexVC.xyz) > 0.0) { normalVCVSOutput = -1.0*normalVCVSOutput; }',
            ]).result;
          }
        }
      }
      shaders.Vertex = VSSource;
      shaders.Geometry = GSSource;
      shaders.Fragment = FSSource;
    }
  };

  publicAPI.replaceShaderPositionVC = (shaders, ren, actor) => {
    let VSSource = shaders.Vertex;
    let GSSource = shaders.Geometry;
    let FSSource = shaders.Fragment;

    // for points make sure to add in the point size
    if (actor.getProperty().getRepresentation() === VTK_REPRESENTATION.POINTS
      || model.lastBoundBO.getPrimitiveType() === primTypes.Points) {
      VSSource = vtkShaderProgram.substitute(VSSource,
        '//VTK::PositionVC::Impl', [
          '//VTK::PositionVC::Impl',
          `  gl_PointSize = ${actor.getProperty().getPointSize().toFixed(1)};`], false).result;
    }

    // do we need the vertex in the shader in View Coordinates
    if (model.lastLightComplexity.get(model.lastBoundBO.getPrimitiveType()) > 0) {
      VSSource = vtkShaderProgram.substitute(VSSource,
        '//VTK::PositionVC::Dec', [
          'varying vec4 vertexVCVSOutput;']).result;
      VSSource = vtkShaderProgram.substitute(VSSource,
        '//VTK::PositionVC::Impl', [
          'vertexVCVSOutput = MCVCMatrix * vertexMC;',
          '  gl_Position = MCDCMatrix * vertexMC;']).result;
      VSSource = vtkShaderProgram.substitute(VSSource,
        '//VTK::Camera::Dec', [
          'uniform mat4 MCDCMatrix;',
          'uniform mat4 MCVCMatrix;']).result;
      GSSource = vtkShaderProgram.substitute(GSSource,
        '//VTK::PositionVC::Dec', [
          'in vec4 vertexVCVSOutput[];',
          'out vec4 vertexVCGSOutput;']).result;
      GSSource = vtkShaderProgram.substitute(GSSource,
        '//VTK::PositionVC::Impl', [
          'vertexVCGSOutput = vertexVCVSOutput[i];']).result;
      FSSource = vtkShaderProgram.substitute(FSSource,
        '//VTK::PositionVC::Dec', [
          'varying vec4 vertexVCVSOutput;']).result;
      FSSource = vtkShaderProgram.substitute(FSSource,
        '//VTK::PositionVC::Impl', [
          'vec4 vertexVC = vertexVCVSOutput;']).result;
    } else {
      VSSource = vtkShaderProgram.substitute(VSSource,
        '//VTK::Camera::Dec', [
          'uniform mat4 MCDCMatrix;']).result;
      VSSource = vtkShaderProgram.substitute(VSSource,
        '//VTK::PositionVC::Impl', [
          '  gl_Position = MCDCMatrix * vertexMC;']).result;
    }
    shaders.Vertex = VSSource;
    shaders.Geometry = GSSource;
    shaders.Fragment = FSSource;
  };

  publicAPI.replaceShaderTCoord = (shaders, ren, actor) => {
    if (model.lastBoundBO.getCABO().getTCoordOffset()) {
      let VSSource = shaders.Vertex;
      let GSSource = shaders.Geometry;
      let FSSource = shaders.Fragment;

      if (model.drawingEdges) {
        return;
      }

      VSSource = vtkShaderProgram.substitute(VSSource,
        '//VTK::TCoord::Impl',
        'tcoordVCVSOutput = tcoordMC;').result;

      // we only handle the first texture by default
      // additional textures are activated and we set the uniform
      // for the texture unit they are assigned to, but you have to
      // add in the shader code to do something with them
      const tus = model.openGLActor.getActiveTextures();
      let tNumComp = 2;
      if (tus.length > 0) {
        tNumComp = tus[0].getComponents();
      }
      if (model.renderable.getColorTextureMap()) {
        tNumComp =
          model.renderable.getColorTextureMap()
          .getPointData().getScalars().getNumberOfComponents();
      }

      VSSource = vtkShaderProgram.substitute(VSSource,
        '//VTK::TCoord::Dec',
        'attribute vec2 tcoordMC; varying vec2 tcoordVCVSOutput;').result;
      GSSource = vtkShaderProgram.substitute(GSSource,
        '//VTK::TCoord::Dec', [
          'in vec2 tcoordVCVSOutput[];',
          'out vec2 tcoordVCGSOutput;']).result;
      GSSource = vtkShaderProgram.substitute(GSSource,
        '//VTK::TCoord::Impl',
        'tcoordVCGSOutput = tcoordVCVSOutput[i];').result;
      FSSource = vtkShaderProgram.substitute(FSSource,
        '//VTK::TCoord::Dec', [
          'varying vec2 tcoordVCVSOutput;',
          'uniform sampler2D texture1;']).result;
      switch (tNumComp) {
        case 1:
          FSSource = vtkShaderProgram.substitute(FSSource,
            '//VTK::TCoord::Impl', [
              'vec4 tcolor = texture2D(texture1, tcoordVCVSOutput);',
              'gl_FragData[0] = clamp(gl_FragData[0],0.0,1.0)*',
              '  vec4(tcolor.r,tcolor.r,tcolor.r,1.0);']).result;
          break;
        case 2:
          FSSource = vtkShaderProgram.substitute(FSSource,
            '//VTK::TCoord::Impl', [
              'vec4 tcolor = texture2D(texture1, tcoordVCVSOutput);',
              'gl_FragData[0] = clamp(gl_FragData[0],0.0,1.0)*',
              '  vec4(tcolor.r,tcolor.r,tcolor.r,tcolor.g);']).result;
          break;
        default:
          FSSource = vtkShaderProgram.substitute(FSSource,
            '//VTK::TCoord::Impl',
            'gl_FragData[0] = clamp(gl_FragData[0],0.0,1.0)*texture2D(texture1, tcoordVCVSOutput.st);').result;
      }
      shaders.Vertex = VSSource;
      shaders.Geometry = GSSource;
      shaders.Fragment = FSSource;
    }
  };

  publicAPI.getCoincidentParameters = (ren, actor) => {
    // 1. ResolveCoincidentTopology is On and non zero for this primitive
    // type
    let cp = null;
    const prop = actor.getProperty();
    if (model.renderable.getResolveCoincidentTopology() ||
        (prop.getEdgeVisibility() &&
          prop.getRepresentation() === VTK_REPRESENTATION.SURFACE)) {
      const primType = model.lastBoundBO.getPrimitiveType();
      if (primType === primTypes.Points ||
          prop.getRepresentation() === VTK_REPRESENTATION.POINTS) {
        cp = model.renderable.getCoincidentTopologyPointOffsetParameter();
      } else if (primType === primTypes.Lines ||
          prop.getRepresentation() === VTK_REPRESENTATION.WIREFRAME) {
        cp = model.renderable.getCoincidentTopologyLineOffsetParameters();
      } else if (primType === primTypes.Tris || primType === primTypes.TriStrips) {
        cp = model.renderable.getCoincidentTopologyPolygonOffsetParameters();
      }
      if (primType === primTypes.TrisEdges ||
          primType === primTypes.TriStripsEdges) {
        cp = model.renderable.getCoincidentTopologyPolygonOffsetParameters();
        cp.factor /= 2.0;
        cp.units /= 2.0;
      }
    }

  // hardware picking always offset due to saved zbuffer
  // This gets you above the saved surface depth buffer.
  // vtkHardwareSelector* selector = ren->GetSelector();
  // if (selector &&
  //     selector->GetFieldAssociation() == vtkDataObject::FIELD_ASSOCIATION_POINTS)
  // {
  //   offset -= 2.0;
  //   return;
  // }
    return cp;
  };

  publicAPI.replaceShaderCoincidentOffset = (shaders, ren, actor) => {
    const cp = publicAPI.getCoincidentParameters(ren, actor);

    // if we need an offset handle it here
    // The value of .000016 is suitable for depth buffers
    // of at least 16 bit depth. We do not query the depth
    // right now because we would need some mechanism to
    // cache the result taking into account FBO changes etc.
    if (cp && (cp.factor !== 0.0 || cp.offset !== 0.0)) {
      let FSSource = shaders.Fragment;

      FSSource = vtkShaderProgram.substitute(FSSource,
        '//VTK::Coincident::Dec', [
          'uniform float cfactor;',
          'uniform float coffset;']).result;

      if (cp.factor !== 0.0) {
        FSSource = vtkShaderProgram.substitute(FSSource,
          '//VTK::UniformFlow::Impl', [
            'float cscale = length(vec2(dFdx(gl_FragCoord.z),dFdy(gl_FragCoord.z)));',
            '//VTK::UniformFlow::Impl'], false).result;
        FSSource = vtkShaderProgram.substitute(FSSource,
          '//VTK::Depth::Impl',
          'gl_FragDepth = gl_FragCoord.z + cfactor*cscale + 0.000016*coffset;').result;
      } else {
        FSSource = vtkShaderProgram.substitute(FSSource,
          '//VTK::Depth::Impl',
          'gl_FragDepth = gl_FragCoord.z + 0.000016*coffset;').result;
      }
      shaders.Fragment = FSSource;
    }
  };

  publicAPI.replaceShaderValues = (shaders, ren, actor) => {
    publicAPI.replaceShaderColor(shaders, ren, actor);
    publicAPI.replaceShaderNormal(shaders, ren, actor);
    publicAPI.replaceShaderLight(shaders, ren, actor);
    publicAPI.replaceShaderTCoord(shaders, ren, actor);
    publicAPI.replaceShaderCoincidentOffset(shaders, ren, actor);
    publicAPI.replaceShaderPositionVC(shaders, ren, actor);
  };

  publicAPI.getNeedToRebuildShaders = (cellBO, ren, actor) => {
    let lightComplexity = 0;

    const primType = cellBO.getPrimitiveType();

    let needLighting = true;

    const poly = model.currentInput;

    let n = (actor.getProperty().getInterpolation() !== VTK_SHADING.FLAT)
      ? poly.getPointData().getNormals() : null;
    if (n === null && poly.getCellData().getNormals()) {
      n = poly.getCelData().getNormals();
    }

    const haveNormals = (n !== null);

    if (actor.getProperty().getRepresentation() === VTK_REPRESENTATION.POINTS ||
        primType === primTypes.Points) {
      needLighting = haveNormals;
    }

    // do we need lighting?
    if (actor.getProperty().getLighting() && needLighting) {
      // consider the lighting complexity to determine which case applies
      // simple headlight, Light Kit, the whole feature set of VTK
      lightComplexity = 0;
      let numberOfLights = 0;

      ren.getLights().forEach((light) => {
        const status = light.getSwitch();
        if (status > 0) {
          numberOfLights++;
          if (lightComplexity === 0) {
            lightComplexity = 1;
          }
        }

        if (lightComplexity === 1
            && (numberOfLights > 1
              || light.getIntensity() !== 1.0
              || !light.lightTypeIsHeadLight())) {
          lightComplexity = 2;
        }
        if (lightComplexity < 3
            && (light.getPositional())) {
          lightComplexity = 3;
        }
      });
    }

    if (model.lastLightComplexity.get(primType) !== lightComplexity) {
      model.lightComplexityChanged.get(primType).modified();
      model.lastLightComplexity.set(primType, lightComplexity);
    }

    // has something changed that would require us to recreate the shader?
    // candidates are
    // property modified (representation interpolation and lighting)
    // input modified
    // light complexity changed
    if (cellBO.getProgram() === 0 ||
        cellBO.getShaderSourceTime().getMTime() < publicAPI.getMTime() ||
        cellBO.getShaderSourceTime().getMTime() < actor.getMTime() ||
        cellBO.getShaderSourceTime().getMTime() < model.renderable.getMTime() ||
        cellBO.getShaderSourceTime().getMTime() < model.currentInput.getMTime() ||
        cellBO.getShaderSourceTime().getMTime() < model.lightComplexityChanged.get(primType).getMTime()) {
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
    publicAPI.setPropertyShaderParameters(cellBO, ren, actor);
    publicAPI.setCameraShaderParameters(cellBO, ren, actor);
    publicAPI.setLightingShaderParameters(cellBO, ren, actor);
  };

  publicAPI.setMapperShaderParameters = (cellBO, ren, actor) => {
    // Now to update the VAO too, if necessary.
    cellBO.getProgram().setUniformi('PrimitiveIDOffset',
      model.primitiveIDOffset);

    if (cellBO.getCABO().getElementCount() && (model.VBOBuildTime > cellBO.getAttributeUpdateTime().getMTime() ||
        cellBO.getShaderSourceTime().getMTime() > cellBO.getAttributeUpdateTime().getMTime())) {
      cellBO.getCABO().bind();
      if (cellBO.getProgram().isAttributeUsed('vertexMC')) {
        if (!cellBO.getVAO().addAttributeArray(cellBO.getProgram(), cellBO.getCABO(),
                                           'vertexMC', cellBO.getCABO().getVertexOffset(),
                                           cellBO.getCABO().getStride(), model.context.FLOAT, 3,
                                           model.context.FALSE)) {
          vtkErrorMacro('Error setting vertexMC in shader VAO.');
        }
      }
      if (cellBO.getProgram().isAttributeUsed('normalMC') &&
          cellBO.getCABO().getNormalOffset() &&
          model.lastLightComplexity.get(cellBO.getPrimitiveType()) > 0) {
        if (!cellBO.getVAO().addAttributeArray(cellBO.getProgram(), cellBO.getCABO(),
                                           'normalMC', cellBO.getCABO().getNormalOffset(),
                                           cellBO.getCABO().getStride(), model.context.FLOAT, 3,
                                           model.context.FALSE)) {
          vtkErrorMacro('Error setting normalMC in shader VAO.');
        }
      }
      if (cellBO.getProgram().isAttributeUsed('tcoordMC') &&
          cellBO.getCABO().getTCoordOffset()) {
        if (!cellBO.getVAO().addAttributeArray(cellBO.getProgram(), cellBO.getCABO(),
                                           'tcoordMC', cellBO.getCABO().getTCoordOffset(),
                                           cellBO.getCABO().getStride(), model.context.FLOAT,
                                           cellBO.getCABO().getTCoordComponents(),
                                           model.context.FALSE)) {
          vtkErrorMacro('Error setting tcoordMC in shader VAO.');
        }
      }
      if (cellBO.getProgram().isAttributeUsed('scalarColor') &&
          cellBO.getCABO().getColorComponents()) {
        if (!cellBO.getVAO().addAttributeArray(cellBO.getProgram(), cellBO.getCABO(),
                                           'scalarColor', cellBO.getCABO().getColorOffset(),
                                           cellBO.getCABO().getStride(), model.context.FLOAT /* BYTE */,
                                           cellBO.getCABO().getColorComponents(),
                                           true)) {
          vtkErrorMacro('Error setting scalarColor in shader VAO.');
        }
      }
    }

    if (model.internalColorTexture
        && cellBO.getProgram().isUniformUsed('texture1')) {
      cellBO.getProgram().setUniformi('texture1',
        model.internalColorTexture.getTextureUnit());
    }
    const tus = model.openGLActor.getActiveTextures();
    tus.forEach((tex) => {
      const texUnit = tex.getTextureUnit();
      const tname = `texture${texUnit + 1}`;
      if (cellBO.getProgram().isUniformUsed(tname)) {
        cellBO.getProgram().setUniformi(tname, texUnit);
      }
    });
  };

  publicAPI.setLightingShaderParameters = (cellBO, ren, actor) => {
    // for unlit and headlight there are no lighting parameters
    if (model.lastLightComplexity.get(cellBO.getPrimitiveType()) < 2) {
      return;
    }

    const program = cellBO.getProgram();

    // for lightkit case there are some parameters to set
    // const cam = ren.getActiveCamera();
    // const viewTF = cam.getModelViewTransformObject();

    // bind some light settings
    let numberOfLights = 0;

    const lightColor = [];
    // const lightDirection = [];
    // const lightHalfAngle = [];
    const lights = ren.getLights();
    Object.keys(lights).map(key => lights[key]).forEach((light) => {
      const status = light.getSwitch();
      if (status > 0.0) {
        const dColor = light.getDiffuseColor();
        const intensity = light.getIntensity();
        lightColor[numberOfLights][0] = dColor[0] * intensity;
        lightColor[numberOfLights][1] = dColor[1] * intensity;
        lightColor[numberOfLights][2] = dColor[2] * intensity;
        // get required info from light
        // double *lfp = light.getTransformedFocalPoint();
        // double *lp = light.getTransformedPosition();
        // double lightDir[3];
        // vtkMath::Subtract(lfp,lp,lightDir);
        // vtkMath::Normalize(lightDir);
        // double *tDir = viewTF.TransformNormal(lightDir);
        // lightDirection[numberOfLights][0] = tDir[0];
        // lightDirection[numberOfLights][1] = tDir[1];
        // lightDirection[numberOfLights][2] = tDir[2];
        // lightDir[0] = -tDir[0];
        // lightDir[1] = -tDir[1];
        // lightDir[2] = -tDir[2]+1.0;
        // vtkMath::Normalize(lightDir);
        // lightHalfAngle[numberOfLights][0] = lightDir[0];
        // lightHalfAngle[numberOfLights][1] = lightDir[1];
        // lightHalfAngle[numberOfLights][2] = lightDir[2];
        numberOfLights++;
      }
    });

    program.setUniform3fv('lightColor', numberOfLights, lightColor);
    // program.setUniform3fv('lightDirectionVC', numberOfLights, lightDirection);
    // program.setUniform3fv('lightHalfAngleVC', numberOfLights, lightHalfAngle);
    program.setUniformi('numberOfLights', numberOfLights);

    // // we are done unless we have positional lights
    if (model.lastLightComplexity.get(cellBO.getPrimitiveType()) < 3) {
      return;
    }

    // // if positional lights pass down more parameters
    // let lightAttenuation[6][3];
    // let lightPosition[6][3];
    // let lightConeAngle[6];
    // let lightExponent[6];
    // int lightPositional[6];
    // numberOfLights = 0;
    // for(lc.InitTraversal(sit);
    //     (light = lc.getNextLight(sit)); )
    //   {
    //   let status = light.getSwitch();
    //   if (status > 0.0)
    //     {
    //     double *attn = light.getAttenuationValues();
    //     lightAttenuation[numberOfLights][0] = attn[0];
    //     lightAttenuation[numberOfLights][1] = attn[1];
    //     lightAttenuation[numberOfLights][2] = attn[2];
    //     lightExponent[numberOfLights] = light.getExponent();
    //     lightConeAngle[numberOfLights] = light.getConeAngle();
    //     double *lp = light.getTransformedPosition();
    //     double *tlp = viewTF.TransformPoint(lp);
    //     lightPosition[numberOfLights][0] = tlp[0];
    //     lightPosition[numberOfLights][1] = tlp[1];
    //     lightPosition[numberOfLights][2] = tlp[2];
    //     lightPositional[numberOfLights] = light.getPositional();
    //     numberOfLights++;
    //     }
    //   }
    // program.SetUniform3fv('lightAttenuation', numberOfLights, lightAttenuation);
    // program.SetUniform1iv('lightPositional', numberOfLights, lightPositional);
    // program.SetUniform3fv('lightPositionVC', numberOfLights, lightPosition);
    // program.SetUniform1fv('lightExponent', numberOfLights, lightExponent);
    // program.SetUniform1fv('lightConeAngle', numberOfLights, lightConeAngle);
  };

  publicAPI.setCameraShaderParameters = (cellBO, ren, actor) => {
    const program = cellBO.getProgram();

    // // [WMVD]C == {world, model, view, display} coordinates
    // // E.g., WCDC == world to display coordinate transformation
    const keyMats = model.openGLCamera.getKeyMatrices(ren);
    const cam = ren.getActiveCamera();

    if (actor.getIsIdentity()) {
      program.setUniformMatrix('MCDCMatrix', keyMats.wcdc);
      if (program.isUniformUsed('MCVCMatrix')) {
        program.setUniformMatrix('MCVCMatrix', keyMats.wcvc);
      }
      if (program.isUniformUsed('normalMatrix')) {
        program.setUniformMatrix3x3('normalMatrix', keyMats.normalMatrix);
      }
    } else {
      const actMats = model.openGLActor.getKeyMatrices();
      if (program.isUniformUsed('normalMatrix')) {
        const anorms = mat3.create();
        mat3.multiply(anorms, keyMats.normalMatrix, actMats.normalMatrix);
        program.setUniformMatrix3x3('normalMatrix', anorms);
      }
      const tmp4 = mat4.create();
      mat4.multiply(tmp4, keyMats.wcdc, actMats.mcwc);
      program.setUniformMatrix('MCDCMatrix', tmp4);
      if (program.isUniformUsed('MCVCMatrix')) {
        mat4.multiply(tmp4, keyMats.wcvc, actMats.mcwc);
        program.setUniformMatrix('MCVCMatrix', tmp4);
      }
    }

    if (program.isUniformUsed('cameraParallel')) {
      program.setUniformi('cameraParallel', cam.getParallelProjection());
    }
  };

  publicAPI.setPropertyShaderParameters = (cellBO, ren, actor) => {
    const program = cellBO.getProgram();

    const ppty = actor.getProperty();

    const opacity = ppty.getOpacity();
    const aColor = model.drawingEdges ? ppty.getEdgeColor()
      : ppty.getAmbientColor();
    const aIntensity = ppty.getAmbient();
    const ambientColor = [aColor[0] * aIntensity,
      aColor[1] * aIntensity,
      aColor[2] * aIntensity];
    const dColor = model.drawingEdges ? ppty.getEdgeColor()
      : ppty.getDiffuseColor();
    const dIntensity = ppty.getDiffuse();
    const diffuseColor = [dColor[0] * dIntensity,
      dColor[1] * dIntensity,
      dColor[2] * dIntensity];

    program.setUniformf('opacityUniform', opacity);
    program.setUniform3f('ambientColorUniform', ambientColor);
    program.setUniform3f('diffuseColorUniform', diffuseColor);
    // we are done unless we have lighting
    if (model.lastLightComplexity.get(cellBO.getPrimitiveType()) < 1) {
      return;
    }
    const sColor = ppty.getSpecularColor();
    const sIntensity = ppty.getSpecular();
    const specularColor = [sColor[0] * sIntensity,
      sColor[1] * sIntensity,
      sColor[2] * sIntensity];
    program.setUniform3f('specularColorUniform', specularColor);
    const specularPower = ppty.getSpecularPower();
    program.setUniformf('specularPowerUniform', specularPower);

    // // now set the backface properties if we have them
    // if (actor.getBackfaceProperty() && !model.DrawingEdges)
    //   {
    //   ppty = actor.getBackfaceProperty();

    //   let opacity = static_cast<float>(ppty.getOpacity());
    //   double *aColor = ppty.getAmbientColor();
    //   double aIntensity = ppty.getAmbient();  // ignoring renderer ambient
    //   let ambientColor[3] = {static_cast<float>(aColor[0] * aIntensity),
    //     static_cast<float>(aColor[1] * aIntensity),
    //     static_cast<float>(aColor[2] * aIntensity)};
    //   double *dColor = ppty.getDiffuseColor();
    //   double dIntensity = ppty.getDiffuse();
    //   let diffuseColor[3] = {static_cast<float>(dColor[0] * dIntensity),
    //     static_cast<float>(dColor[1] * dIntensity),
    //     static_cast<float>(dColor[2] * dIntensity)};
    //   double *sColor = ppty.getSpecularColor();
    //   double sIntensity = ppty.getSpecular();
    //   let specularColor[3] = {static_cast<float>(sColor[0] * sIntensity),
    //     static_cast<float>(sColor[1] * sIntensity),
    //     static_cast<float>(sColor[2] * sIntensity)};
    //   double specularPower = ppty.getSpecularPower();

    //   program.SetUniformf('opacityUniformBF', opacity);
    //   program.SetUniform3f('ambientColorUniformBF', ambientColor);
    //   program.SetUniform3f('diffuseColorUniformBF', diffuseColor);
    //   // we are done unless we have lighting
    //   if (model.LastLightComplexity[&cellBO] < 1)
    //     {
    //     return;
    //     }
    //   program.SetUniform3f('specularColorUniformBF', specularColor);
    //   program.SetUniformf('specularPowerUniformBF', specularPower);
    //   }
  };

  publicAPI.renderPieceStart = (ren, actor) => {
    model.primitiveIDOffset = 0;

    // Line Width setting (FIXME Ken)
    model.context.lineWidth(actor.getProperty().getLineWidth());

    // make sure the BOs are up to date
    publicAPI.updateBufferObjects(ren, actor);

    // If we are coloring by texture, then load the texture map.
    // Use Map as indicator, because texture hangs around.
    if (model.renderable.getColorTextureMap()) {
      model.internalColorTexture.activate();
    }

    // Bind the OpenGL, this is shared between the different primitive/cell types.
    model.lastBoundBO = null;
  };

  publicAPI.renderPieceDraw = (ren, actor) => {
    const representation = actor.getProperty().getRepresentation();

    const gl = model.context;

    const drawSurfaceWithEdges =
      (actor.getProperty().getEdgeVisibility() &&
        representation === VTK_REPRESENTATION.SURFACE);

    // for every primitive type
    for (let i = primTypes.Start; i < primTypes.End; i++) {
      // if there are entries
      const cabo = model.primitives[i].getCABO();
      if (cabo.getElementCount()) {
        // are we drawing edges
        model.drawingEdges =
          drawSurfaceWithEdges && (i === primTypes.TrisEdges
          || i === primTypes.TriStripsEdges);
        publicAPI.updateShaders(model.primitives[i], ren, actor);
        const mode = publicAPI.getOpenGLMode(representation, i);
        gl.drawArrays(mode, 0, cabo.getElementCount());

        const stride = (mode === gl.POINTS ? 1 : (mode === gl.LINES ? 2 : 3));
        model.primitiveIDOffset += cabo.getElementCount() / stride;
      }
    }
  };

  publicAPI.getOpenGLMode = (rep, type) => {
    if (rep === VTK_REPRESENTATION.POINTS ||
      type === primTypes.Points) {
      return model.context.POINTS;
    }
    if (rep === VTK_REPRESENTATION.WIREFRAME ||
      type === primTypes.Lines ||
      type === primTypes.TrisEdges ||
      type === primTypes.TriStripsEdges) {
      return model.context.LINES;
    }
    return model.context.TRIANGLES;
  };

  publicAPI.renderPieceFinish = (ren, actor) => {
    if (model.LastBoundBO) {
      model.LastBoundBO.getVAO().release();
    }
    if (model.renderable.getColorTextureMap()) {
      model.internalColorTexture.deactivate();
    }
  };

  publicAPI.renderPiece = (ren, actor) => {
    // Make sure that we have been properly initialized.
    // if (ren.getRenderWindow().checkAbortStatus()) {
    //   return;
    // }


    publicAPI.invokeEvent({ type: 'StartEvent' });
    model.currentInput = model.renderable.getInputData();
    if (!model.renderable.getStatic()) {
      model.renderable.update();
      model.currentInput = model.renderable.getInputData();
    }
    publicAPI.invokeEvent({ type: 'EndEvent' });

    if (model.currentInput === null) {
      vtkErrorMacro('No input!');
      return;
    }

    // if there are no points then we are done
    if (!model.currentInput.getPoints || !model.currentInput.getPoints().getNumberOfValues()) {
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
        model.VBOBuildTime.getMTime() < model.renderable.getMTime() ||
        model.VBOBuildTime.getMTime() < actor.getMTime() ||
        model.VBOBuildTime.getMTime() < actor.getProperty().getMTime() ||
        model.VBOBuildTime.getMTime() < model.currentInput.getMTime()) {
      return true;
    }
    return false;
  };

  publicAPI.buildBufferObjects = (ren, actor) => {
    const poly = model.currentInput;

    if (poly === null) {
      return;
    }

    model.renderable.mapScalars(poly, 1.0);
    const c = model.renderable.getColorMapColors();

    model.haveCellScalars = false;
    const scalarMode = model.renderable.getScalarMode();
    if (model.renderable.getScalarVisibility()) {
      // We must figure out how the scalars should be mapped to the polydata.
      if ((scalarMode === VTK_SCALAR_MODE.USE_CELL_DATA ||
            scalarMode === VTK_SCALAR_MODE.USE_CELL_FIELD_DATA ||
            scalarMode === VTK_SCALAR_MODE.USE_FIELD_DATA ||
            !poly.getPointData().getScalars())
           && scalarMode !== VTK_SCALAR_MODE.USE_POINT_FIELD_DATA
           && c) {
        model.haveCellScalars = true;
      }
    }

    // Do we have normals?
    let n = (actor.getProperty().getInterpolation() !== VTK_SHADING.FLAT)
      ? poly.getPointData().getNormals() : null;
    if (n === null && poly.getCellData().getNormals()) {
      model.haveCellNormals = true;
      n = poly.getCelData().getNormals();
    }


    // rebuild the VBO if the data has changed we create a string for the VBO what
    // can change the VBO? points normals tcoords colors so what can change those?
    // the input data is clearly one as it can change all four items tcoords may
    // haveTextures or not colors may change based on quite a few mapping
    // parameters in the mapper

    const representation = actor.getProperty().getRepresentation();
    const toString = `${poly.getMTime()}A${representation}B${poly.getMTime()}`
      + `C${(n ? n.getMTime() : 1)}D${(c ? c.getMTime() : 1)}`
      + `E${actor.getProperty().getEdgeVisibility()}`;

    let tcoords = poly.getPointData().getTCoords();
    if (!model.openGLActor.getActiveTextures().length) {
      tcoords = null;
    }

    // handle color mapping via texture
    if (model.renderable.getColorCoordinates()) {
      tcoords = model.renderable.getColorCoordinates();
      if (!model.internalColorTexture) {
        model.internalColorTexture = vtkOpenGLTexture.newInstance();
      }
      const tex = model.internalColorTexture;
      // the following 4 lines allow for NPOT textures
      tex.setMinificationFilter(VTK_FILTER.NEAREST);
      tex.setMagnificationFilter(VTK_FILTER.NEAREST);
      tex.setWrapS(VTK_WRAP.CLAMP_TO_EDGE);
      tex.setWrapT(VTK_WRAP.CLAMP_TO_EDGE);
      tex.setWindow(model.openGLRenderWindow);
      tex.setContext(model.openGLRenderWindow.getContext());

      const input = model.renderable.getColorTextureMap();
      const ext = input.getExtent();
      const inScalars = input.getPointData().getScalars();
      tex.create2DFromRaw(ext[1] - ext[0] + 1, ext[3] - ext[2] + 1,
        inScalars.getNumberOfComponents(),
        inScalars.getDataType(),
        inScalars.getData());
      tex.activate();
      tex.sendParameters();
      tex.deactivate();
    }

    if (model.VBOBuildString !== toString) {
      // Build the VBOs
      const points = poly.getPoints().getData();
      const options = {
        points,
        normals: n,
        tcoords,
        colors: c,
        cellOffset: 0,
        haveCellScalars: model.haveCellScalars,
        haveCellNormals: model.haveCellNormals,
      };
      options.cellOffset += model.primitives[primTypes.Points].getCABO()
        .createVBO(poly.getVerts(), 'verts', representation, options);
      options.cellOffset += model.primitives[primTypes.Lines].getCABO()
        .createVBO(poly.getLines(), 'lines', representation, options);
      options.cellOffset += model.primitives[primTypes.Tris].getCABO()
        .createVBO(poly.getPolys(), 'polys', representation, options);
      options.cellOffset += model.primitives[primTypes.TriStrips].getCABO()
        .createVBO(poly.getStrips(), 'strips', representation, options);

      // if we have edge visibility build the edge VBOs
      if (actor.getProperty().getEdgeVisibility()) {
        model.primitives[primTypes.TrisEdges].getCABO()
          .createVBO(poly.getPolys(), 'polys', VTK_REPRESENTATION.WIREFRAME,
          {
            points,
            normals: n,
            tcoords: null,
            colors: null,
            cellOffset: 0,
            haveCellScalars: false,
            haveCellNormals: false,
          });
        model.primitives[primTypes.TriStripsEdges].getCABO()
          .createVBO(poly.getStrips(), 'strips', VTK_REPRESENTATION.WIREFRAME,
          {
            points,
            normals: n,
            tcoords: null,
            colors: null,
            cellOffset: 0,
            haveCellScalars: false,
            haveCellNormals: false,
          });
      } else { // otherwise free them
        model.primitives[primTypes.TrisEdges]
          .releaseGraphicsResources(model.openGLRenderWindow);
        model.primitives[primTypes.TriStripsEdges]
          .releaseGraphicsResources(model.openGLRenderWindow);
      }

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
  lightComplexityChanged: null,
  lastLightComplexity: null,
  primitives: null,
};

// ----------------------------------------------------------------------------

export function extend(publicAPI, model, initialValues = {}) {
  Object.assign(model, DEFAULT_VALUES, initialValues);

  // Inheritance
  vtkViewNode.extend(publicAPI, model);

  model.lightComplexityChanged = new Map();
  model.lastLightComplexity = new Map();

  model.primitives = [];

  for (let i = primTypes.Start; i < primTypes.End; i++) {
    model.primitives[i] = vtkHelper.newInstance();
    model.primitives[i].setPrimitiveType(i);
    model.lightComplexityChanged.set(i, {});
    macro.obj(model.lightComplexityChanged.get(i));
    model.lastLightComplexity.set(i, 0);
  }

  // Build VTK API
  macro.setGet(publicAPI, model, [
    'context',
  ]);

  model.VBOBuildTime = {};
  macro.obj(model.VBOBuildTime);

  // Object methods
  vtkOpenGLPolyDataMapper(publicAPI, model);
}

// ----------------------------------------------------------------------------

export const newInstance = macro.newInstance(extend);

// ----------------------------------------------------------------------------

export default { newInstance, extend };
