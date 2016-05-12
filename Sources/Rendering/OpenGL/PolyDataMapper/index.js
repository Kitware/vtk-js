import * as macro from '../../../macro';
import ViewNode from '../../SceneGraph/ViewNode';
import ShaderProgram from '../ShaderProgram';
import Math from '../../../Common/Core/Math';
import { REPRESENTATIONS, SHADINGS } from '../../Core/Property/Constants';

import vtkPolyDataVS from '../glsl/vtkPolyDataVS.glsl';
import vtkPolyDataFS from '../glsl/vtkPolyDataFS.glsl';

// ----------------------------------------------------------------------------
// vtkOpenGLPolyDataMapper methods
// ----------------------------------------------------------------------------

export function webGLPolyDataMapper(publicAPI, model) {
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
      model.context = publicAPI.getFirstAncestorOfType('vtkOpenGLRenderWindow').getContext();
      publicAPI.preRender();
    } else {
      // something
    }
  };

  publicAPI.prerender = (prepass) => {

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
  };

  publicAPI.replaceShaderLight = (shaders, ren, actor) => {
    let FSSource = shaders.Fragment;

    // check for shadow maps
    const shadowFactor = '';

    const lastLightComplexity = model.lastLightComplexity[model.lastBoundBO];

    switch (lastLightComplexity) {
      case 0: // no lighting or RENDER_VALUES
        FSSource = ShaderProgram.substitute(FSSource, '//VTK::Light::Impl', [
          '  gl_FragData[0] = vec4(ambientColor + diffuseColor, opacity);',
          '  //VTK::Light::Impl'],
        false
        ).result;
        break;

      case 1:  // headlight
        FSSource = ShaderProgram.substitute(FSSource, '//VTK::Light::Impl', [
          '  let df = max(0.0, normalVCVSOutput.z);',
          '  let sf = pow(df, specularPower);',
          '  vec3 diffuse = df * diffuseColor;',
          '  vec3 specular = sf * specularColor;',
          '  gl_FragData[0] = vec4(ambientColor + diffuse + specular, opacity);',
          '  //VTK::Light::Impl'],
          false).result;
        break;

      case 2: // light kit
        FSSource = ShaderProgram.substitute(FSSource, '//VTK::Light::Dec', [
          // only allow for up to 6 active lights
          'uniform int numberOfLights;',
          // intensity weighted color
          'uniform vec3 lightColor[6];',
          'uniform vec3 lightDirectionVC[6]; // normalized',
          'uniform vec3 lightHalfAngleVC[6]; // normalized']).result;
        FSSource = ShaderProgram.substitute(FSSource, '//VTK::Light::Impl', [
          'vec3 diffuse = vec3(0,0,0);',
          '  vec3 specular = vec3(0,0,0);',
          '  for (int lightNum = 0; lightNum < numberOfLights; lightNum++)',
          '    {',
          '    let df = max(0.0, dot(normalVCVSOutput, -lightDirectionVC[lightNum]));',
          `    diffuse += ((df${shadowFactor}) * lightColor[lightNum]);`,
          '    if (dot(normalVCVSOutput, lightDirectionVC[lightNum]) < 0.0)',
          '      {',
          '      let sf = pow( max(0.0, dot(lightHalfAngleVC[lightNum],normalVCVSOutput)), specularPower);',
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
        FSSource = ShaderProgram.substitute(FSSource, '//VTK::Light::Dec', [
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
        FSSource = ShaderProgram.substitute(FSSource, '//VTK::Light::Impl', [
          '  vec3 diffuse = vec3(0,0,0);',
          '  vec3 specular = vec3(0,0,0);',
          '  vec3 vertLightDirectionVC;',
          '  for (int lightNum = 0; lightNum < numberOfLights; lightNum++)',
          '    {',
          '    let attenuation = 1.0;',
          '    if (lightPositional[lightNum] == 0)',
          '      {',
          '      vertLightDirectionVC = lightDirectionVC[lightNum];',
          '      }',
          '    else',
          '      {',
          '      vertLightDirectionVC = vertexVC.xyz - lightPositionVC[lightNum];',
          '      let distanceVC = length(vertLightDirectionVC);',
          '      vertLightDirectionVC = normalize(vertLightDirectionVC);',
          '      attenuation = 1.0 /',
          '        (lightAttenuation[lightNum].x',
          '         + lightAttenuation[lightNum].y * distanceVC',
          '         + lightAttenuation[lightNum].z * distanceVC * distanceVC);',
          '      // per OpenGL standard cone angle is 90 or less for a spot light',
          '      if (lightConeAngle[lightNum] <= 90.0)',
          '        {',
          '        let coneDot = dot(vertLightDirectionVC, lightDirectionVC[lightNum]);',
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
          '    let df = max(0.0, attenuation*dot(normalVCVSOutput, -vertLightDirectionVC));',
          `    diffuse += ((df${shadowFactor}) * lightColor[lightNum]);`,
          '    if (dot(normalVCVSOutput, vertLightDirectionVC) < 0.0)',
          '      {',
          '      let sf = attenuation*pow( max(0.0, dot(lightHalfAngleVC[lightNum],normalVCVSOutput)), specularPower);',
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
    if (model.lastLightComplexity[model.lastBoundBO] > 0) {
      let VSSource = shaders.Vertex;
      let GSSource = shaders.Geometry;
      let FSSource = shaders.Fragment;

      if (model.VBO.getNormalOffset()) {
        VSSource = ShaderProgram.substitute(VSSource,
          '//VTK::Normal::Dec', [
            'attribute vec3 normalMC;',
            'uniform mat3 normalMatrix;',
            'varying vec3 normalVCVSOutput;']).result;
        VSSource = ShaderProgram.substitute(VSSource,
          '//VTK::Normal::Impl', [
            'normalVCVSOutput = normalMatrix * normalMC;'].result);
        GSSource = ShaderProgram.substitute(GSSource,
          '//VTK::Normal::Dec', [
            'in vec3 normalVCVSOutput[];',
            'out vec3 normalVCGSOutput;']).result;
        GSSource = ShaderProgram.substitute(GSSource,
          '//VTK::Normal::Impl', [
            'normalVCGSOutput = normalVCVSOutput[i];']).result;
        FSSource = ShaderProgram.substitute(FSSource,
          '//VTK::Normal::Dec', [
            'varying vec3 normalVCVSOutput;']).result;
        FSSource = ShaderProgram.substitute(FSSource,
          '//VTK::Normal::Impl', [
            'vec3 normalVCVSOutput = normalize(normalVCVSOutput);',
            //  if (!gl_FrontFacing) does not work in intel hd4000 mac
            //  if (int(gl_FrontFacing) == 0) does not work on mesa
            '  if (gl_FrontFacing == false) { normalVCVSOutput = -normalVCVSOutput; }']
          ).result;
      } else {
        if (model.haveCellNormals) {
          FSSource = ShaderProgram.substitute(FSSource,
            '//VTK::Normal::Dec', [
              'uniform mat3 normalMatrix;',
              'uniform samplerBuffer textureN;']).result;
          FSSource = ShaderProgram.substitute(FSSource,
            '//VTK::Normal::Impl', [
              'vec3 normalVCVSOutput = normalize(normalMatrix *',
              '    texelFetchBuffer(textureN, gl_PrimitiveID + PrimitiveIDOffset).xyz);',
              '  if (gl_FrontFacing == false) { normalVCVSOutput = -normalVCVSOutput; }']
            ).result;
        } else {
          if (actor.getProperty().getRepresentation() === REPRESENTATIONS.VTK_WIREFRAME) {
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
            FSSource = ShaderProgram.substitute(FSSource, '//VTK::UniformFlow::Impl', [
              '  vec3 fdx = vec3(dFdx(vertexVC.x),dFdx(vertexVC.y),dFdx(vertexVC.z));',
              '  vec3 fdy = vec3(dFdy(vertexVC.x),dFdy(vertexVC.y),dFdy(vertexVC.z));',
              '  //VTK::UniformFlow::Impl'] // For further replacements
              ).result;
            FSSource = ShaderProgram.substitute(FSSource, '//VTK::Normal::Impl', [
              'vec3 normalVCVSOutput;',
              '  fdx = normalize(fdx);',
              '  fdy = normalize(fdy);',
              '  if (abs(fdx.x) > 0.0)',
              '    { normalVCVSOutput = normalize(cross(vec3(fdx.y, -fdx.x, 0.0), fdx)); }',
              '  else { normalVCVSOutput = normalize(cross(vec3(fdy.y, -fdy.x, 0.0), fdy));}']
              ).result;
          } else {
            FSSource = ShaderProgram.substitute(FSSource,
              '//VTK::Normal::Dec', [
                'uniform int cameraParallel;']).result;

            FSSource = ShaderProgram.substitute(FSSource, '//VTK::UniformFlow::Impl', [
              'vec3 fdx = vec3(dFdx(vertexVC.x),dFdx(vertexVC.y),dFdx(vertexVC.z));',
              '  vec3 fdy = vec3(dFdy(vertexVC.x),dFdy(vertexVC.y),dFdy(vertexVC.z));',
              '  //VTK::UniformFlow::Impl'] // For further replacements
              ).result;
            FSSource = ShaderProgram.substitute(FSSource, '//VTK::Normal::Impl', [
              '  fdx = normalize(fdx);',
              '  fdy = normalize(fdy);',
              '  vec3 normalVCVSOutput = normalize(cross(fdx,fdy));',
              // the code below is faster, but does not work on some devices
              // 'vec3 normalVC = normalize(cross(dFdx(vertexVC.xyz), dFdy(vertexVC.xyz)));',
              '  if (cameraParallel == 1 && normalVCVSOutput.z < 0.0) { normalVCVSOutput = -1.0*normalVCVSOutput; }',
              '  if (cameraParallel == 0 && dot(normalVCVSOutput,vertexVC.xyz) > 0.0) { normalVCVSOutput = -1.0*normalVCVSOutput; }']
              ).result;
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

     // do we need the vertex in the shader in View Coordinates
    if (model.lastLightComplexity[model.lastBoundBO] > 0) {
      VSSource = ShaderProgram.substitute(VSSource,
        '//VTK::PositionVC::Dec', [
          'varying vec4 vertexVCVSOutput;']).result;
      VSSource = ShaderProgram.substitute(VSSource,
        '//VTK::PositionVC::Impl', [
          'vertexVCVSOutput = MCVCMatrix * vertexMC;',
          '  gl_Position = MCDCMatrix * vertexMC;']).result;
      VSSource = ShaderProgram.substitute(VSSource,
        '//VTK::Camera::Dec', [
          'uniform mat4 MCDCMatrix;',
          'uniform mat4 MCVCMatrix;']).result;
      GSSource = ShaderProgram.substitute(GSSource,
        '//VTK::PositionVC::Dec', [
          'in vec4 vertexVCVSOutput[];',
          'out vec4 vertexVCGSOutput;']).result;
      GSSource = ShaderProgram.substitute(GSSource,
        '//VTK::PositionVC::Impl', [
          'vertexVCGSOutput = vertexVCVSOutput[i];']).result;
      FSSource = ShaderProgram.substitute(FSSource,
        '//VTK::PositionVC::Dec', [
          'varying vec4 vertexVCVSOutput;']).result;
      FSSource = ShaderProgram.substitute(FSSource,
        '//VTK::PositionVC::Impl', [
          'vec4 vertexVC = vertexVCVSOutput;']).result;
    } else {
      VSSource = ShaderProgram.substitute(VSSource,
        '//VTK::Camera::Dec', [
          'uniform mat4 MCDCMatrix;']).result;
      VSSource = ShaderProgram.substitute(VSSource,
        '//VTK::PositionVC::Impl', [
          '  gl_Position = MCDCMatrix * vertexMC;']).result;
    }
    shaders.Vertex = VSSource;
    shaders.Geometry = GSSource;
    shaders.Fragment = FSSource;
  };

  publicAPI.replaceShaderValues = (shaders, ren, actor) => {
    publicAPI.replaceShaderColor(shaders, ren, actor);
    publicAPI.replaceShaderNormal(shaders, ren, actor);
    publicAPI.replaceShaderLight(shaders, ren, actor);
    publicAPI.replaceShaderPositionVC(shaders, ren, actor);
  };

  publicAPI.getNeedToRebuildShaders = (cellBO, ren, actor) => {
    let lightComplexity = 0;

    // wacky backwards compatibility with old VTK lighting
    // soooo there are many factors that determine if a primative is lit or not.
    // three that mix in a complex way are representation POINT, Interpolation FLAT
    // and having normals or not.
    let needLighting = false;
    const haveNormals = (model.currentInput.getPointData().getNormals() != null);
    if (actor.getProperty().getRepresentation() === REPRESENTATIONS.VTK_POINTS) {
      needLighting = (actor.getProperty().getInterpolation() !== SHADINGS.VTK_FLAT && haveNormals);
    } else {
      const isTrisOrStrips = (cellBO === model.tris || cellBO === model.triStrips);
      needLighting = (isTrisOrStrips ||
        (!isTrisOrStrips && actor.getProperty().getInterpolation() !== SHADINGS.VTK_FLAT && haveNormals));
    }

    // do we need lighting?
    if (actor.getProperty().getLighting() && needLighting) {
      // consider the lighting complexity to determine which case applies
      // simple headlight, Light Kit, the whole feature set of VTK
      lightComplexity = 0;
      let numberOfLights = 0;

      ren.getLights().forEach(light => {
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
              || !light.lightTypeIsHeadlight())) {
          lightComplexity = 2;
        }
        if (lightComplexity < 3
            && (light.getPositional())) {
          lightComplexity = 3;
        }
      });
    }

    if (model.lastLightComplexity[cellBO] !== lightComplexity) {
      model.lightComplexityChanged[cellBO].modified();
      model.lastLightComplexity[cellBO] = lightComplexity;
    }

    // has something changed that would require us to recreate the shader?
    // candidates are
    // property modified (representation interpolation and lighting)
    // input modified
    // light complexity changed
    if (cellBO.Program === 0 ||
        cellBO.ShaderSourceTime < publicAPI.getMTime() ||
        cellBO.ShaderSourceTime < actor.getMTime() ||
        cellBO.ShaderSourceTime < model.CurrentInput.getMTime() ||
        cellBO.ShaderSourceTime < model.lightComplexityChanged[cellBO]) {
      return true;
    }

    return false;
  };

  publicAPI.updateShaders = (cellBO, ren, actor) => {
    cellBO.VAO.bind();
    model.lastBoundBO = cellBO;

    const renWin = ren.getWindow();

    // has something changed that would require us to recreate the shader?
    if (publicAPI.getNeedToRebuildShaders(cellBO, ren, actor)) {
      const shaders = { Vertex: null, Fragment: null, Geometry: null };

      publicAPI.buildShaders(shaders, ren, actor);

      // compile and bind the program if needed
      const newShader =
        renWin.getShaderCache().readyShaderProgram(shaders);

      // if the shader changed reinitialize the VAO
      if (newShader !== cellBO.program) {
        cellBO.program = newShader;
        // reset the VAO as the shader has changed
        cellBO.VAO.releaseGraphicsResources();
      }

      cellBO.shaderSourceTime.modified();
    } else {
      renWin.getShaderCache().readyShaderProgram(cellBO.Program);
    }

    publicAPI.setMapperShaderParameters(cellBO, ren, actor);
    publicAPI.setPropertyShaderParameters(cellBO, ren, actor);
    publicAPI.setCameraShaderParameters(cellBO, ren, actor);
    publicAPI.setLightingShaderParameters(cellBO, ren, actor);
  };

  publicAPI.setMapperShaderParameters = (cellBO, ren, actor) => {

    // // Now to update the VAO too, if necessary.
    // cellBO.Program.SetUniformi('PrimitiveIDOffset',
    //   model.primitiveIDOffset);

    // if (cellBO.IBO.IndexCount && (model.VBOBuildTime > cellBO.AttributeUpdateTime ||
    //     cellBO.ShaderSourceTime > cellBO.AttributeUpdateTime))
    //   {
    //   cellBO.VAO.Bind();
    //   if (cellBO.Program.IsAttributeUsed('vertexMC'))
    //     {
    //     if (!cellBO.VAO.AddAttributeArray(cellBO.Program, model.VBO,
    //                                        'vertexMC', model.VBO.VertexOffset,
    //                                        model.VBO.Stride, VTK_FLOAT, 3,
    //                                        false))
    //       {
    //       vtkErrorMacro(<< 'Error setting 'vertexMC' in shader VAO.');
    //       }
    //     }
    //   if (model.VBO.NormalOffset && model.LastLightComplexity[&cellBO] > 0 &&
    //       cellBO.Program.IsAttributeUsed('normalMC'))
    //     {
    //     if (!cellBO.VAO.AddAttributeArray(cellBO.Program, model.VBO,
    //                                     'normalMC', model.VBO.NormalOffset,
    //                                     model.VBO.Stride, VTK_FLOAT, 3, false))
    //       {
    //       vtkErrorMacro(<< 'Error setting 'normalMC' in shader VAO.');
    //       }
    //     }
    //   if (model.VBO.TCoordComponents && !model.DrawingEdges &&
    //       cellBO.Program.IsAttributeUsed('tcoordMC'))
    //     {
    //     if (!cellBO.VAO.AddAttributeArray(cellBO.Program, model.VBO,
    //                                     'tcoordMC', model.VBO.TCoordOffset,
    //                                     model.VBO.Stride, VTK_FLOAT, model.VBO.TCoordComponents, false))
    //       {
    //       vtkErrorMacro(<< 'Error setting 'tcoordMC' in shader VAO.');
    //       }
    //     }
    //   if (model.VBO.ColorComponents != 0 && !model.DrawingEdges &&
    //       cellBO.Program.IsAttributeUsed('scalarColor'))
    //     {
    //     if (!cellBO.VAO.AddAttributeArray(cellBO.Program, model.VBO,
    //                                     'scalarColor', model.VBO.ColorOffset,
    //                                     model.VBO.Stride, VTK_UNSIGNED_CHAR,
    //                                     model.VBO.ColorComponents, true))
    //       {
    //       vtkErrorMacro(<< 'Error setting 'scalarColor' in shader VAO.');
    //       }
    //     }
  };

  publicAPI.setLightingShaderParameters = (cellBO, ren, actor) => {
    // for unlit and headlight there are no lighting parameters
    if (model.lastLightComplexity[cellBO] < 2) {
      return;
    }

  //  const program = cellBO.Program;

    // for lightkit case there are some parameters to set
  //  const cam = ren.getActiveCamera();
    // vtkTransform* viewTF = cam.getModelViewTransformObject();

    // // bind some light settings
    // int numberOfLights = 0;
    // vtkLightCollection *lc = ren.getLights();
    // vtkLight *light;

    // bool renderLuminance = info &&
    //   info.Has(vtkLightingMapPass::RENDER_LUMINANCE());

    // vtkCollectionSimpleIterator sit;
    // let lightColor[6][3];
    // let lightDirection[6][3];
    // let lightHalfAngle[6][3];
    // for(lc.InitTraversal(sit);
    //     (light = lc.getNextLight(sit)); )
    //   {
    //   let status = light.getSwitch();
    //   if (status > 0.0)
    //     {
    //     double *dColor = light.getDiffuseColor();
    //     double intensity = light.getIntensity();
    //     if (renderLuminance)
    //       {
    //       lightColor[numberOfLights][0] = intensity;
    //       lightColor[numberOfLights][1] = intensity;
    //       lightColor[numberOfLights][2] = intensity;
    //       }
    //     else
    //       {
    //       lightColor[numberOfLights][0] = dColor[0] * intensity;
    //       lightColor[numberOfLights][1] = dColor[1] * intensity;
    //       lightColor[numberOfLights][2] = dColor[2] * intensity;
    //       }
    //     // get required info from light
    //     double *lfp = light.getTransformedFocalPoint();
    //     double *lp = light.getTransformedPosition();
    //     double lightDir[3];
    //     vtkMath::Subtract(lfp,lp,lightDir);
    //     vtkMath::Normalize(lightDir);
    //     double *tDir = viewTF.TransformNormal(lightDir);
    //     lightDirection[numberOfLights][0] = tDir[0];
    //     lightDirection[numberOfLights][1] = tDir[1];
    //     lightDirection[numberOfLights][2] = tDir[2];
    //     lightDir[0] = -tDir[0];
    //     lightDir[1] = -tDir[1];
    //     lightDir[2] = -tDir[2]+1.0;
    //     vtkMath::Normalize(lightDir);
    //     lightHalfAngle[numberOfLights][0] = lightDir[0];
    //     lightHalfAngle[numberOfLights][1] = lightDir[1];
    //     lightHalfAngle[numberOfLights][2] = lightDir[2];
    //     numberOfLights++;
    //     }
    //   }

    // program.SetUniform3fv('lightColor', numberOfLights, lightColor);
    // program.SetUniform3fv('lightDirectionVC', numberOfLights, lightDirection);
    // program.SetUniform3fv('lightHalfAngleVC', numberOfLights, lightHalfAngle);
    // program.SetUniformi('numberOfLights', numberOfLights);

    // // we are done unless we have positional lights
    // if (model.LastLightComplexity[&cellBO] < 3)
    //   {
    //   return;
    //   }

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
  //  const program = cellBO.Program;

  //  const cam = ren.getActiveCamera();

    // // [WMVD]C == {world, model, view, display} coordinates
    // // E.g., WCDC == world to display coordinate transformation
    // vtkMatrix4x4* wcdc;
    // vtkMatrix4x4* wcvc;
    // vtkMatrix3x3* norms;
    // vtkMatrix4x4* vcdc;
    // cam.getKeyMatrices(ren, wcvc, norms, vcdc, wcdc);

    // if (model.VBO.getCoordShiftAndScaleEnabled())
    //   {
    //   if (!actor.getIsIdentity())
    //     {
    //     vtkMatrix4x4* mcwc;
    //     vtkMatrix3x3* anorms;
    //     ((vtkOpenGLActor*)actor).getKeyMatrices(mcwc,anorms);
    //     vtkMatrix4x4::Multiply4x4(model.VBOShiftScale.GetPointer(), mcwc, model.TempMatrix4);
    //     vtkMatrix4x4::Multiply4x4(model.TempMatrix4, wcdc, model.TempMatrix4);
    //     program.SetUniformMatrix('MCDCMatrix', model.TempMatrix4);
    //     if (program.IsUniformUsed('MCVCMatrix'))
    //       {
    //       vtkMatrix4x4::Multiply4x4(model.VBOShiftScale.GetPointer(), mcwc, model.TempMatrix4);
    //       vtkMatrix4x4::Multiply4x4(model.TempMatrix4, wcvc, model.TempMatrix4);
    //       program.SetUniformMatrix('MCVCMatrix', model.TempMatrix4);
    //       }
    //     if (program.IsUniformUsed('normalMatrix'))
    //       {
    //       vtkMatrix3x3::Multiply3x3(anorms, norms, model.TempMatrix3);
    //       program.SetUniformMatrix('normalMatrix', model.TempMatrix3);
    //       }
    //     }
    //   else
    //     {
    //     vtkMatrix4x4::Multiply4x4(model.VBOShiftScale.GetPointer(), wcdc, model.TempMatrix4);
    //     program.SetUniformMatrix('MCDCMatrix', model.TempMatrix4);
    //     if (program.IsUniformUsed('MCVCMatrix'))
    //       {
    //       vtkMatrix4x4::Multiply4x4(model.VBOShiftScale.GetPointer(), wcvc, model.TempMatrix4);
    //       program.SetUniformMatrix('MCVCMatrix', model.TempMatrix4);
    //       }
    //     if (program.IsUniformUsed('normalMatrix'))
    //       {
    //       program.SetUniformMatrix('normalMatrix', norms);
    //       }
    //     }
    //   }
    // else
    //   {
    //   if (!actor.getIsIdentity())
    //     {
    //     vtkMatrix4x4 *mcwc;
    //     vtkMatrix3x3 *anorms;
    //     ((vtkOpenGLActor *)actor).getKeyMatrices(mcwc,anorms);
    //     vtkMatrix4x4::Multiply4x4(mcwc, wcdc, model.TempMatrix4);
    //     program.SetUniformMatrix('MCDCMatrix', model.TempMatrix4);
    //     if (program.IsUniformUsed('MCVCMatrix'))
    //       {
    //       vtkMatrix4x4::Multiply4x4(mcwc, wcvc, model.TempMatrix4);
    //       program.SetUniformMatrix('MCVCMatrix', model.TempMatrix4);
    //       }
    //     if (program.IsUniformUsed('normalMatrix'))
    //       {
    //       vtkMatrix3x3::Multiply3x3(anorms, norms, model.TempMatrix3);
    //       program.SetUniformMatrix('normalMatrix', model.TempMatrix3);
    //       }
    //     }
    //   else
    //     {
    //     program.SetUniformMatrix('MCDCMatrix', wcdc);
    //     if (program.IsUniformUsed('MCVCMatrix'))
    //       {
    //       program.SetUniformMatrix('MCVCMatrix', wcvc);
    //       }
    //     if (program.IsUniformUsed('normalMatrix'))
    //       {
    //       program.SetUniformMatrix('normalMatrix', norms);
    //       }
    //     }
    //   }

    // if (program.IsUniformUsed('cameraParallel'))
    //   {
    //   program.SetUniformi('cameraParallel', cam.getParallelProjection());
    //   }
  };

  publicAPI.setPropertyShaderParameters = (cellBO, ren, actor) => {
  //  const program = cellBO.Program;

  //  const ppty = actor.getProperty();

    // {
    // // Query the property for some of the properties that can be applied.
    // let opacity = static_cast<float>(ppty.getOpacity());
    // double *aColor = model.DrawingEdges ?
    //   ppty.getEdgeColor() : ppty.getAmbientColor();
    // double aIntensity = model.DrawingEdges ? 1.0 : ppty.getAmbient();
    // let ambientColor[3] = {static_cast<float>(aColor[0] * aIntensity),
    //   static_cast<float>(aColor[1] * aIntensity),
    //   static_cast<float>(aColor[2] * aIntensity)};
    // double *dColor = ppty.getDiffuseColor();
    // double dIntensity = model.DrawingEdges ? 0.0 : ppty.getDiffuse();
    // let diffuseColor[3] = {static_cast<float>(dColor[0] * dIntensity),
    //   static_cast<float>(dColor[1] * dIntensity),
    //   static_cast<float>(dColor[2] * dIntensity)};
    // double *sColor = ppty.getSpecularColor();
    // double sIntensity = model.DrawingEdges ? 0.0 : ppty.getSpecular();
    // let specularColor[3] = {static_cast<float>(sColor[0] * sIntensity),
    //   static_cast<float>(sColor[1] * sIntensity),
    //   static_cast<float>(sColor[2] * sIntensity)};
    // double specularPower = ppty.getSpecularPower();

    // program.SetUniformf('opacityUniform', opacity);
    // program.SetUniform3f('ambientColorUniform', ambientColor);
    // program.SetUniform3f('diffuseColorUniform', diffuseColor);
    // // we are done unless we have lighting
    // if (model.LastLightComplexity[&cellBO] < 1)
    //   {
    //   return;
    //   }
    // program.SetUniform3f('specularColorUniform', specularColor);
    // program.SetUniformf('specularPowerUniform', specularPower);
    // }

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

    // make sure the BOs are up to date
    publicAPI.updateBufferObjects(ren, actor);

    // Bind the OpenGL, this is shared between the different primitive/cell types.
    model.VBO.bind();
    model.lastBoundBO = null;
  };

  publicAPI.renderPieceDraw = (ren, actor) => {
    const representation = actor.getProperty().getRepresentation();

    const gl = model.context;

    // draw points
    if (model.points.IBO.IndexCount) {
      // Update/build/etc the shader.
      publicAPI.updateShaders(model.points, ren, actor);
      model.points.IBO.bind();
      gl.drawElements(gl.POINTS,
        model.Points.IBO.IndexCount,
        gl.UNSIGNED_SHORT,
        0);
      model.Points.IBO.release();
      model.primitiveIDOffset += model.Points.IBO.IndexCount;
    }

    // draw lines
    if (model.lines.IBO.IndexCount) {
      publicAPI.updateShaders(model.lines, ren, actor);
      model.lines.IBO.bind();
      if (representation === REPRESENTATIONS.VTK_POINTS) {
        gl.drawElements(gl.POINTS,
          model.Lines.IBO.IndexCount,
          gl.UNSIGNED_SHORT,
          0);
      } else {
        gl.drawElements(gl.LINES,
          model.Lines.IBO.IndexCount,
          gl.UNSIGNED_SHORT,
          0);
      }
      model.lines.IBO.release();
      model.primitiveIDOffset += model.lines.IBO.IndexCount / 2;
    }

    // draw polygons
    if (model.tris.IBO.IndexCount) {
      // First we do the triangles, update the shader, set uniforms, etc.
      publicAPI.updateShaders(model.Tris, ren, actor);
      model.tris.IBO.bind();
      let mode = gl.Points;
      if (representation === REPRESENTATIONS.VTK_WIREFRAME) {
        mode = gl.Lines;
      }
      if (representation === REPRESENTATIONS.VTK_SURFACE) {
        mode = gl.TRIANGLES;
      }
      gl.drawElements(mode,
        model.tris.IBO.IndexCount,
        gl.UNSIGNED_SHORT,
        0);
      model.tris.IBO.release();
      model.primitiveIDOffset += model.Tris.IBO.IndexCount / 3;
    }

    // draw strips
    if (model.triStrips.IBO.IndexCount) {
      // Use the tris shader program/VAO, but triStrips ibo.
      model.updateShaders(model.triStrips, ren, actor);
      model.triStrips.IBO.bind();
      if (representation === REPRESENTATIONS.VTK_POINTS) {
        gl.drawRangeElements(gl.POINTS,
          model.triStrips.IBO.IndexCount,
          gl.UNSIGNED_SHORT,
          0);
      }
      if (representation === REPRESENTATIONS.VTK_WIREFRAME) {
        gl.drawRangeElements(gl.LINES,
                            model.triStrips.IBO.IndexCount,
                            gl.UNSIGNED_SHORT,
                            0);
      }
      if (representation === REPRESENTATIONS.VTK_SURFACE) {
        gl.drawRangeElements(gl.TRIANGLES,
                            model.triStrips.IBO.IndexCount,
                            gl.UNSIGNED_SHORT,
                            0);
      }
      model.triStrips.IBO.release();
      // just be safe and divide by 3
      model.primitiveIDOffset += model.triStrips.IBO.IndexCount / 3;
    }
  };

  publicAPI.renderPieceFinish = (ren, actor) => {
    if (model.LastBoundBO) {
      model.LastBoundBO.VAO.release();
    }

    model.VBO.release();
  };

  publicAPI.renderPiece = (ren, actor) => {
    // Make sure that we have been properly initialized.
    if (ren.getRenderWindow().checkAbortStatus()) {
      return;
    }

    model.currentInput = this.getInputData();

    if (model.currentInput === null) {
      vtkErrorMacro('No input!');
      return;
    }

    publicAPI.fireEvent({ type: 'StartEvent' });
    if (!model.Static) {
      this.getInputAlgorithm().update();
    }
    publicAPI.fireEvent({ type: 'EndEvent' });

    // if there are no points then we are done
    if (!model.currentInput.getPoints()) {
      return;
    }

    publicAPI.renderPieceStart(ren, actor);
    publicAPI.renderPieceDraw(ren, actor);
    publicAPI.renderEdges(ren, actor);
    publicAPI.renderPieceFinish(ren, actor);
  };

  publicAPI.computeBounds = (ren, actor) => {
    if (!this.getInput()) {
      Math.uninitializeBounds(model.Bounds);
      return;
    }
    model.bounnds = this.getInput().getBounds();
  };

  publicAPI.updateBufferObjects = (ren, actor) => {
    // Rebuild buffers if needed
    if (this.getNeedToRebuildBufferObjects(ren, actor)) {
      publicAPI.buildBufferObjects(ren, actor);
    }
  };

  publicAPI.getNeedToToRebuildBufferObjects = (ren, actor) => {
    // first do a coarse check
    if (model.VBOBuildTime < this.getMTime() ||
        model.VBOBuildTime < actor.getMTime() ||
        model.VBOBuildTime < model.CurrentInput.getMTime()) {
      return true;
    }
    return false;
  };

  publicAPI.buildBufferObjects = (ren, actor) => {
    const poly = model.currentInput;

    if (poly === null) {
      return;
    }

    // Do we have normals?
    const n =
      (actor.getProperty().getInterpolation() !== SHADINGS.VTK_FLAT) ? poly.getPointData().getNormals() : null;

    const prims = [];
    prims[0] = poly.getVerts();
    prims[1] = poly.getLines();
    prims[2] = poly.getPolys();
    prims[3] = poly.getStrips();

    // rebuild the VBO if the data has changed we create a string for the VBO what
    // can change the VBO? points normals tcoords colors so what can change those?
    // the input data is clearly one as it can change all four items tcoords may
    // haveTextures or not colors may change based on quite a few mapping
    // parameters in the mapper

    const toString = `${poly.getMTime()}AB${(n ? n.getMTime() : 1)}C`;

    const tcoords = null;
    const c = null;
    if (model.VBOBuildString !== toString) {
      // Build the VBO
      model.VBO.createVBO(poly.getPoints(),
          poly.getPoints().getNumberOfPoints(),
          n, tcoords,
          c ? c.getVoidPointer(0) : null,
          c ? c.getNumberOfComponents() : 0);

      model.VBOBuildTime.modified();
      model.VBOBuildString = toString.str();
    }

    // now create the IBOs
    publicAPI.buildIBO(ren, actor, poly);
  };

  publicAPI.buildIBO = (ren, actor, poly) => {
    const prims = [];
    prims[0] = poly.getVerts();
    prims[1] = poly.getLines();
    prims[2] = poly.getPolys();
    prims[3] = poly.getStrips();
    const representation = actor.getProperty().getRepresentation();

    // do we realy need to rebuild the IBO? Since the operation is costly we
    // construst a string of values that impact the IBO and see if that string has
    // changed

    // So...polydata can return a dummy CellArray when there are no lines
    const toString = `${(prims[0].getNumberOfCells() ? prims[0].getMTime() : 0)}
      A${(prims[1].getNumberOfCells() ? prims[1].getMTime() : 0)}
      B${(prims[2].getNumberOfCells() ? prims[2].getMTime() : 0)}
      C${(prims[3].getNumberOfCells() ? prims[3].getMTime() : 0)}
      D${representation}`;

    if (model.IBOBuildString !== toString) {
      model.points.IBO.createPointIndexBuffer(prims[0]);

      if (representation === REPRESENTATIONS.VTK_POINTS) {
        model.lines.IBO.createPointIndexBuffer(prims[1]);
        model.tris.IBO.createPointIndexBuffer(prims[2]);
        model.triStrips.IBO.createPointIndexBuffer(prims[3]);
      } else {
        model.lines.IBO.createLineIndexBuffer(prims[1]);

        if (representation === REPRESENTATIONS.VTK_WIREFRAME) {
          model.tris.IBO.createTriangleLineIndexBuffer(prims[2]);
          model.triStrips.IBO.createStripIndexBuffer(prims[3], true);
        } else {
          model.tris.IBO.createTriangleIndexBuffer(prims[2], poly.getPoints());
          model.triStrips.IBO.createStripIndexBuffer(prims[3], false);
        }
      }

      model.IBOBuildString = toString;
    }
  };
}

// ----------------------------------------------------------------------------
// Object factory
// ----------------------------------------------------------------------------

const DEFAULT_VALUES = {
  context: null,
};

// ----------------------------------------------------------------------------

export function extend(publicAPI, model, initialValues = {}) {
  Object.assign(model, DEFAULT_VALUES, initialValues);

  // Inheritance
  ViewNode.extend(publicAPI, model);

  // Build VTK API
  macro.get(publicAPI, model, ['shaderCache']);
  macro.setGet(publicAPI, model, [
    'context',
  ]);

  // Object methods
  webGLPolyDataMapper(publicAPI, model);
}

// ----------------------------------------------------------------------------

export const newInstance = macro.newInstance(extend);

// ----------------------------------------------------------------------------

export default { newInstance, extend };
