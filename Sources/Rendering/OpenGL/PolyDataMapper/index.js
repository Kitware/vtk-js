import { mat3, mat4, vec3 } from 'gl-matrix';

import * as macro from 'vtk.js/Sources/macros';
import vtkHelper from 'vtk.js/Sources/Rendering/OpenGL/Helper';
import vtkMapper from 'vtk.js/Sources/Rendering/Core/Mapper';
import * as vtkMath from 'vtk.js/Sources/Common/Core/Math';
import vtkOpenGLTexture from 'vtk.js/Sources/Rendering/OpenGL/Texture';
import vtkProperty from 'vtk.js/Sources/Rendering/Core/Property';
import vtkShaderProgram from 'vtk.js/Sources/Rendering/OpenGL/ShaderProgram';
import vtkViewNode from 'vtk.js/Sources/Rendering/SceneGraph/ViewNode';
import vtkPolyDataVS from 'vtk.js/Sources/Rendering/OpenGL/glsl/vtkPolyDataVS.glsl';
import vtkPolyDataFS from 'vtk.js/Sources/Rendering/OpenGL/glsl/vtkPolyDataFS.glsl';

import vtkReplacementShaderMapper from 'vtk.js/Sources/Rendering/OpenGL/ReplacementShaderMapper';

import { registerOverride } from 'vtk.js/Sources/Rendering/OpenGL/ViewNodeFactory';

import { PassTypes } from 'vtk.js/Sources/Rendering/OpenGL/HardwareSelector/Constants';
import vtkDataSet from 'vtk.js/Sources/Common/DataModel/DataSet';

const { FieldAssociations } = vtkDataSet;

/* eslint-disable no-lonely-if */

const { primTypes } = vtkHelper;
const { Representation, Shading } = vtkProperty;
const { ScalarMode } = vtkMapper;
const { Filter, Wrap } = vtkOpenGLTexture;
const { vtkErrorMacro } = macro;
const StartEvent = { type: 'StartEvent' };
const EndEvent = { type: 'EndEvent' };

// ----------------------------------------------------------------------------
// vtkOpenGLPolyDataMapper methods
// ----------------------------------------------------------------------------

function getPickState(renderer) {
  const selector = renderer.getSelector();
  if (selector) {
    return selector.getCurrentPass();
  }

  return PassTypes.MIN_KNOWN_PASS - 1;
}

function vtkOpenGLPolyDataMapper(publicAPI, model) {
  // Set our className
  model.classHierarchy.push('vtkOpenGLPolyDataMapper');

  publicAPI.buildPass = (prepass) => {
    if (prepass) {
      model.currentRenderPass = null;
      model.openGLActor = publicAPI.getFirstAncestorOfType('vtkOpenGLActor');
      model.openGLRenderer =
        model.openGLActor.getFirstAncestorOfType('vtkOpenGLRenderer');
      model._openGLRenderWindow = model.openGLRenderer.getParent();
      model.openGLCamera = model.openGLRenderer.getViewNodeFor(
        model.openGLRenderer.getRenderable().getActiveCamera()
      );
    }
  };

  // Renders myself
  publicAPI.translucentPass = (prepass, renderPass) => {
    if (prepass) {
      model.currentRenderPass = renderPass;
      publicAPI.render();
    }
  };

  publicAPI.opaqueZBufferPass = (prepass) => {
    if (prepass) {
      model.haveSeenDepthRequest = true;
      model.renderDepth = true;
      publicAPI.render();
      model.renderDepth = false;
    }
  };

  publicAPI.opaquePass = (prepass) => {
    if (prepass) {
      publicAPI.render();
    }
  };

  publicAPI.render = () => {
    const ctx = model._openGLRenderWindow.getContext();
    if (model.context !== ctx) {
      model.context = ctx;
      for (let i = primTypes.Start; i < primTypes.End; i++) {
        model.primitives[i].setOpenGLRenderWindow(model._openGLRenderWindow);
      }
    }
    const actor = model.openGLActor.getRenderable();
    const ren = model.openGLRenderer.getRenderable();
    publicAPI.renderPiece(ren, actor);
  };

  publicAPI.buildShaders = (shaders, ren, actor) => {
    publicAPI.getShaderTemplate(shaders, ren, actor);

    // apply any renderPassReplacements
    if (model.lastRenderPassShaderReplacement) {
      model.lastRenderPassShaderReplacement(shaders);
    }

    // user specified pre replacements
    const openGLSpec = model.renderable.getViewSpecificProperties().OpenGL;
    let shaderReplacements = null;
    if (openGLSpec) {
      shaderReplacements = openGLSpec.ShaderReplacements;
    }

    if (shaderReplacements) {
      for (let i = 0; i < shaderReplacements.length; i++) {
        const currReplacement = shaderReplacements[i];
        if (currReplacement.replaceFirst) {
          const shaderType = currReplacement.shaderType;
          const ssrc = shaders[shaderType];
          const substituteRes = vtkShaderProgram.substitute(
            ssrc,
            currReplacement.originalValue,
            currReplacement.replacementValue,
            currReplacement.replaceAll
          );
          shaders[shaderType] = substituteRes.result;
        }
      }
    }

    publicAPI.replaceShaderValues(shaders, ren, actor);

    // user specified post replacements
    if (shaderReplacements) {
      for (let i = 0; i < shaderReplacements.length; i++) {
        const currReplacement = shaderReplacements[i];
        if (!currReplacement.replaceFirst) {
          const shaderType = currReplacement.shaderType;
          const ssrc = shaders[shaderType];
          const substituteRes = vtkShaderProgram.substitute(
            ssrc,
            currReplacement.originalValue,
            currReplacement.replacementValue,
            currReplacement.replaceAll
          );
          shaders[shaderType] = substituteRes.result;
        }
      }
    }
  };

  publicAPI.getShaderTemplate = (shaders, ren, actor) => {
    const openGLSpecProp = model.renderable.getViewSpecificProperties().OpenGL;

    let vertexShaderCode = vtkPolyDataVS;
    if (openGLSpecProp) {
      const vertexSpecProp = openGLSpecProp.VertexShaderCode;
      if (vertexSpecProp !== undefined && vertexSpecProp !== '') {
        vertexShaderCode = vertexSpecProp;
      }
    }
    shaders.Vertex = vertexShaderCode;

    let fragmentShaderCode = vtkPolyDataFS;
    if (openGLSpecProp) {
      const fragmentSpecProp = openGLSpecProp.FragmentShaderCode;
      if (fragmentSpecProp !== undefined && fragmentSpecProp !== '') {
        fragmentShaderCode = fragmentSpecProp;
      }
    }
    shaders.Fragment = fragmentShaderCode;

    let geometryShaderCode = '';
    if (openGLSpecProp) {
      const geometrySpecProp = openGLSpecProp.GeometryShaderCode;
      if (geometrySpecProp !== undefined) {
        geometryShaderCode = geometrySpecProp;
      }
    }
    shaders.Geometry = geometryShaderCode;
  };

  publicAPI.replaceShaderColor = (shaders, ren, actor) => {
    let VSSource = shaders.Vertex;
    let GSSource = shaders.Geometry;
    let FSSource = shaders.Fragment;

    const lastLightComplexity = model.lastBoundBO.getReferenceByName(
      'lastLightComplexity'
    );

    // create the material/color property declarations, and VS implementation
    // these are always defined
    let colorDec = [
      'uniform float ambient;',
      'uniform float diffuse;',
      'uniform float specular;',
      'uniform float opacityUniform; // the fragment opacity',
      'uniform vec3 ambientColorUniform;',
      'uniform vec3 diffuseColorUniform;',
    ];
    // add more for specular
    if (lastLightComplexity) {
      colorDec = colorDec.concat([
        'uniform vec3 specularColorUniform;',
        'uniform float specularPowerUniform;',
      ]);
    }

    // now handle the more complex fragment shader implementation
    // the following are always defined variables.  We start
    // by assigning a default value from the uniform
    let colorImpl = [
      'vec3 ambientColor;',
      '  vec3 diffuseColor;',
      '  float opacity;',
    ];
    if (lastLightComplexity) {
      colorImpl = colorImpl.concat([
        '  vec3 specularColor;',
        '  float specularPower;',
      ]);
    }
    colorImpl = colorImpl.concat([
      '  ambientColor = ambientColorUniform;',
      '  diffuseColor = diffuseColorUniform;',
      '  opacity = opacityUniform;',
    ]);
    if (lastLightComplexity) {
      colorImpl = colorImpl.concat([
        '  specularColor = specularColorUniform;',
        '  specularPower = specularPowerUniform;',
      ]);
    }

    // add scalar vertex coloring
    if (
      model.lastBoundBO.getCABO().getColorComponents() !== 0 &&
      !model.drawingEdges
    ) {
      colorDec = colorDec.concat(['varying vec4 vertexColorVSOutput;']);
      VSSource = vtkShaderProgram.substitute(VSSource, '//VTK::Color::Dec', [
        'attribute vec4 scalarColor;',
        'varying vec4 vertexColorVSOutput;',
      ]).result;
      VSSource = vtkShaderProgram.substitute(VSSource, '//VTK::Color::Impl', [
        'vertexColorVSOutput =  scalarColor;',
      ]).result;
      GSSource = vtkShaderProgram.substitute(GSSource, '//VTK::Color::Dec', [
        'in vec4 vertexColorVSOutput[];',
        'out vec4 vertexColorGSOutput;',
      ]).result;
      GSSource = vtkShaderProgram.substitute(GSSource, '//VTK::Color::Impl', [
        'vertexColorGSOutput = vertexColorVSOutput[i];',
      ]).result;
    }

    if (
      model.lastBoundBO.getCABO().getColorComponents() !== 0 &&
      !model.drawingEdges
    ) {
      FSSource = vtkShaderProgram.substitute(
        FSSource,
        '//VTK::Color::Impl',
        colorImpl.concat([
          '  diffuseColor = vertexColorVSOutput.rgb;',
          '  ambientColor = vertexColorVSOutput.rgb;',
          '  opacity = opacity*vertexColorVSOutput.a;',
        ])
      ).result;
    } else {
      if (
        model.renderable.getInterpolateScalarsBeforeMapping() &&
        model.renderable.getColorCoordinates() &&
        !model.drawingEdges
      ) {
        FSSource = vtkShaderProgram.substitute(
          FSSource,
          '//VTK::Color::Impl',
          colorImpl.concat([
            '  vec4 texColor = texture2D(texture1, tcoordVCVSOutput.st);',
            '  diffuseColor = texColor.rgb;',
            '  ambientColor = texColor.rgb;',
            '  opacity = opacity*texColor.a;',
          ])
        ).result;
      } else {
        if (actor.getBackfaceProperty() && !model.drawingEdges) {
          colorDec = colorDec.concat([
            'uniform float opacityUniformBF; // the fragment opacity',
            'uniform float ambientIntensityBF; // the material ambient',
            'uniform float diffuseIntensityBF; // the material diffuse',
            'uniform vec3 ambientColorUniformBF; // ambient material color',
            'uniform vec3 diffuseColorUniformBF; // diffuse material color',
          ]);

          if (lastLightComplexity) {
            colorDec = colorDec.concat([
              'uniform float specularIntensityBF; // the material specular intensity',
              'uniform vec3 specularColorUniformBF; // intensity weighted color',
              'uniform float specularPowerUniformBF;',
            ]);
            colorImpl = colorImpl.concat([
              'if (gl_FrontFacing == false) {',
              '  ambientColor = ambientIntensityBF * ambientColorUniformBF;',
              '  diffuseColor = diffuseIntensityBF * diffuseColorUniformBF;',
              '  specularColor = specularIntensityBF * specularColorUniformBF;',
              '  specularPower = specularPowerUniformBF;',
              '  opacity = opacityUniformBF; }',
            ]);
          } else {
            colorImpl = colorImpl.concat([
              'if (gl_FrontFacing == false) {',
              '  ambientColor = ambientIntensityBF * ambientColorUniformBF;',
              '  diffuseColor = diffuseIntensityBF * diffuseColorUniformBF;',
              '  opacity = opacityUniformBF; }',
            ]);
          }
        }

        if (model.haveCellScalars && !model.drawingEdges) {
          colorDec = colorDec.concat(['uniform samplerBuffer texture1;']);
        }

        FSSource = vtkShaderProgram.substitute(
          FSSource,
          '//VTK::Color::Impl',
          colorImpl
        ).result;
      }
    }

    FSSource = vtkShaderProgram.substitute(
      FSSource,
      '//VTK::Color::Dec',
      colorDec
    ).result;

    shaders.Vertex = VSSource;
    shaders.Geometry = GSSource;
    shaders.Fragment = FSSource;
  };

  publicAPI.replaceShaderLight = (shaders, ren, actor) => {
    let FSSource = shaders.Fragment;

    // check for shadow maps
    const shadowFactor = '';

    const lastLightComplexity = model.lastBoundBO.getReferenceByName(
      'lastLightComplexity'
    );

    const lastLightCount =
      model.lastBoundBO.getReferenceByName('lastLightCount');

    let sstring = [];

    switch (lastLightComplexity) {
      case 0: // no lighting or RENDER_VALUES
        FSSource = vtkShaderProgram.substitute(
          FSSource,
          '//VTK::Light::Impl',
          [
            '  gl_FragData[0] = vec4(ambientColor * ambient + diffuseColor * diffuse, opacity);',
            '  //VTK::Light::Impl',
          ],
          false
        ).result;
        break;

      case 1: // headlight
        FSSource = vtkShaderProgram.substitute(
          FSSource,
          '//VTK::Light::Impl',
          [
            '  float df = max(0.0, normalVCVSOutput.z);',
            '  float sf = pow(df, specularPower);',
            '  vec3 diffuseL = df * diffuseColor;',
            '  vec3 specularL = sf * specularColor;',
            '  gl_FragData[0] = vec4(ambientColor * ambient + diffuseL * diffuse + specularL * specular, opacity);',
            '  //VTK::Light::Impl',
          ],
          false
        ).result;
        break;

      case 2: // light kit
        for (let lc = 0; lc < lastLightCount; ++lc) {
          sstring = sstring.concat([
            `uniform vec3 lightColor${lc};`,
            `uniform vec3 lightDirectionVC${lc}; // normalized`,
            `uniform vec3 lightHalfAngleVC${lc}; // normalized`,
          ]);
        }
        FSSource = vtkShaderProgram.substitute(
          FSSource,
          '//VTK::Light::Dec',
          sstring
        ).result;

        sstring = [
          'vec3 diffuseL = vec3(0,0,0);',
          '  vec3 specularL = vec3(0,0,0);',
          '  float df;',
        ];
        for (let lc = 0; lc < lastLightCount; ++lc) {
          sstring = sstring.concat([
            `  df = max(0.0, dot(normalVCVSOutput, -lightDirectionVC${lc}));`,
            `  diffuseL += ((df${shadowFactor}) * lightColor${lc});`,
            `  if (dot(normalVCVSOutput, lightDirectionVC${lc}) < 0.0)`,
            '    {',
            `    float sf = pow( max(0.0, dot(lightHalfAngleVC${lc},normalVCVSOutput)), specularPower);`,
            `    specularL += ((sf${shadowFactor}) * lightColor${lc});`,
            '    }',
          ]);
        }
        sstring = sstring.concat([
          '  diffuseL = diffuseL * diffuseColor;',
          '  specularL = specularL * specularColor;',
          '  gl_FragData[0] = vec4(ambientColor * ambient + diffuseL * diffuse + specularL * specular, opacity);',
          '  //VTK::Light::Impl',
        ]);
        FSSource = vtkShaderProgram.substitute(
          FSSource,
          '//VTK::Light::Impl',
          sstring,
          false
        ).result;
        break;

      case 3: // positional
        for (let lc = 0; lc < lastLightCount; ++lc) {
          sstring = sstring.concat([
            `uniform vec3 lightColor${lc};`,
            `uniform vec3 lightDirectionVC${lc}; // normalized`,
            `uniform vec3 lightHalfAngleVC${lc}; // normalized`,
            `uniform vec3 lightPositionVC${lc};`,
            `uniform vec3 lightAttenuation${lc};`,
            `uniform float lightConeAngle${lc};`,
            `uniform float lightExponent${lc};`,
            `uniform int lightPositional${lc};`,
          ]);
        }
        FSSource = vtkShaderProgram.substitute(
          FSSource,
          '//VTK::Light::Dec',
          sstring
        ).result;

        sstring = [
          'vec3 diffuseL = vec3(0,0,0);',
          '  vec3 specularL = vec3(0,0,0);',
          '  vec3 vertLightDirectionVC;',
          '  float attenuation;',
          '  float df;',
        ];
        for (let lc = 0; lc < lastLightCount; ++lc) {
          sstring = sstring.concat([
            '  attenuation = 1.0;',
            `  if (lightPositional${lc} == 0)`,
            '    {',
            `      vertLightDirectionVC = lightDirectionVC${lc};`,
            '    }',
            '  else',
            '    {',
            `    vertLightDirectionVC = vertexVC.xyz - lightPositionVC${lc};`,
            '    float distanceVC = length(vertLightDirectionVC);',
            '    vertLightDirectionVC = normalize(vertLightDirectionVC);',
            '    attenuation = 1.0 /',
            `      (lightAttenuation${lc}.x`,
            `       + lightAttenuation${lc}.y * distanceVC`,
            `       + lightAttenuation${lc}.z * distanceVC * distanceVC);`,
            '    // per OpenGL standard cone angle is 90 or less for a spot light',
            `    if (lightConeAngle${lc} <= 90.0)`,
            '      {',
            `      float coneDot = dot(vertLightDirectionVC, lightDirectionVC${lc});`,
            '      // if inside the cone',
            `      if (coneDot >= cos(radians(lightConeAngle${lc})))`,
            '        {',
            `        attenuation = attenuation * pow(coneDot, lightExponent${lc});`,
            '        }',
            '      else',
            '        {',
            '        attenuation = 0.0;',
            '        }',
            '      }',
            '    }',
            '    df = max(0.0, attenuation*dot(normalVCVSOutput, -vertLightDirectionVC));',
            `    diffuseL += ((df${shadowFactor}) * lightColor${lc});`,
            '    if (dot(normalVCVSOutput, vertLightDirectionVC) < 0.0)',
            '      {',
            `      float sf = attenuation*pow( max(0.0, dot(lightHalfAngleVC${lc},normalVCVSOutput)), specularPower);`,
            `    specularL += ((sf${shadowFactor}) * lightColor${lc});`,
            '    }',
          ]);
        }
        sstring = sstring.concat([
          '  diffuseL = diffuseL * diffuseColor;',
          '  specularL = specularL * specularColor;',
          '  gl_FragData[0] = vec4(ambientColor * ambient + diffuseL * diffuse + specularL * specular, opacity);',
          '  //VTK::Light::Impl',
        ]);
        FSSource = vtkShaderProgram.substitute(
          FSSource,
          '//VTK::Light::Impl',
          sstring,
          false
        ).result;
        break;
      default:
        vtkErrorMacro('bad light complexity');
    }

    shaders.Fragment = FSSource;
  };

  publicAPI.replaceShaderNormal = (shaders, ren, actor) => {
    const lastLightComplexity = model.lastBoundBO.getReferenceByName(
      'lastLightComplexity'
    );

    if (lastLightComplexity > 0) {
      let VSSource = shaders.Vertex;
      let GSSource = shaders.Geometry;
      let FSSource = shaders.Fragment;

      if (model.lastBoundBO.getCABO().getNormalOffset()) {
        VSSource = vtkShaderProgram.substitute(VSSource, '//VTK::Normal::Dec', [
          'attribute vec3 normalMC;',
          'uniform mat3 normalMatrix;',
          'varying vec3 normalVCVSOutput;',
        ]).result;
        VSSource = vtkShaderProgram.substitute(
          VSSource,
          '//VTK::Normal::Impl',
          ['normalVCVSOutput = normalMatrix * normalMC;']
        ).result;
        GSSource = vtkShaderProgram.substitute(GSSource, '//VTK::Normal::Dec', [
          'in vec3 normalVCVSOutput[];',
          'out vec3 normalVCGSOutput;',
        ]).result;
        GSSource = vtkShaderProgram.substitute(
          GSSource,
          '//VTK::Normal::Impl',
          ['normalVCGSOutput = normalVCVSOutput[i];']
        ).result;
        FSSource = vtkShaderProgram.substitute(FSSource, '//VTK::Normal::Dec', [
          'varying vec3 normalVCVSOutput;',
        ]).result;
        FSSource = vtkShaderProgram.substitute(
          FSSource,
          '//VTK::Normal::Impl',
          [
            'vec3 normalVCVSOutput = normalize(normalVCVSOutput);',
            //  if (!gl_FrontFacing) does not work in intel hd4000 mac
            //  if (int(gl_FrontFacing) == 0) does not work on mesa
            '  if (gl_FrontFacing == false) { normalVCVSOutput = -normalVCVSOutput; }',
          ]
        ).result;
      } else {
        if (model.haveCellNormals) {
          FSSource = vtkShaderProgram.substitute(
            FSSource,
            '//VTK::Normal::Dec',
            ['uniform mat3 normalMatrix;', 'uniform samplerBuffer textureN;']
          ).result;
          FSSource = vtkShaderProgram.substitute(
            FSSource,
            '//VTK::Normal::Impl',
            [
              'vec3 normalVCVSOutput = normalize(normalMatrix *',
              '    texelFetchBuffer(textureN, gl_PrimitiveID + PrimitiveIDOffset).xyz);',
              '  if (gl_FrontFacing == false) { normalVCVSOutput = -normalVCVSOutput; }',
            ]
          ).result;
        } else {
          if (
            model.lastBoundBO.getOpenGLMode(
              actor.getProperty().getRepresentation()
            ) === model.context.LINES
          ) {
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
            FSSource = vtkShaderProgram.substitute(
              FSSource,
              '//VTK::UniformFlow::Impl',
              [
                '  vec3 fdx = dFdx(vertexVC.xyz);',
                '  vec3 fdy = dFdy(vertexVC.xyz);',
                '  //VTK::UniformFlow::Impl',
              ] // For further replacements
            ).result;
            FSSource = vtkShaderProgram.substitute(
              FSSource,
              '//VTK::Normal::Impl',
              [
                'vec3 normalVCVSOutput;',
                '  if (abs(fdx.x) > 0.0)',
                '    { fdx = normalize(fdx); normalVCVSOutput = normalize(cross(vec3(fdx.y, -fdx.x, 0.0), fdx)); }',
                '  else { fdy = normalize(fdy); normalVCVSOutput = normalize(cross(vec3(fdy.y, -fdy.x, 0.0), fdy));}',
              ]
            ).result;
          } else {
            FSSource = vtkShaderProgram.substitute(
              FSSource,
              '//VTK::Normal::Dec',
              ['uniform int cameraParallel;']
            ).result;

            FSSource = vtkShaderProgram.substitute(
              FSSource,
              '//VTK::UniformFlow::Impl',
              [
                // '  vec3 fdx = vec3(dFdx(vertexVC.x),dFdx(vertexVC.y),dFdx(vertexVC.z));',
                // '  vec3 fdy = vec3(dFdy(vertexVC.x),dFdy(vertexVC.y),dFdy(vertexVC.z));',
                '  vec3 fdx = dFdx(vertexVC.xyz);',
                '  vec3 fdy = dFdy(vertexVC.xyz);',
                '  //VTK::UniformFlow::Impl',
              ] // For further replacements
            ).result;
            FSSource = vtkShaderProgram.substitute(
              FSSource,
              '//VTK::Normal::Impl',
              [
                '  fdx = normalize(fdx);',
                '  fdy = normalize(fdy);',
                '  vec3 normalVCVSOutput = normalize(cross(fdx,fdy));',
                // the code below is faster, but does not work on some devices
                // 'vec3 normalVC = normalize(cross(dFdx(vertexVC.xyz), dFdy(vertexVC.xyz)));',
                '  if (cameraParallel == 1 && normalVCVSOutput.z < 0.0) { normalVCVSOutput = -1.0*normalVCVSOutput; }',
                '  if (cameraParallel == 0 && dot(normalVCVSOutput,vertexVC.xyz) > 0.0) { normalVCVSOutput = -1.0*normalVCVSOutput; }',
              ]
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
    // replace common shader code
    model.lastBoundBO.replaceShaderPositionVC(shaders, ren, actor);

    let VSSource = shaders.Vertex;
    let GSSource = shaders.Geometry;
    let FSSource = shaders.Fragment;

    // do we need the vertex in the shader in View Coordinates
    const lastLightComplexity = model.lastBoundBO.getReferenceByName(
      'lastLightComplexity'
    );
    if (lastLightComplexity > 0) {
      VSSource = vtkShaderProgram.substitute(
        VSSource,
        '//VTK::PositionVC::Dec',
        ['varying vec4 vertexVCVSOutput;']
      ).result;
      VSSource = vtkShaderProgram.substitute(
        VSSource,
        '//VTK::PositionVC::Impl',
        [
          'vertexVCVSOutput = MCVCMatrix * vertexMC;',
          '  gl_Position = MCPCMatrix * vertexMC;',
        ]
      ).result;
      VSSource = vtkShaderProgram.substitute(VSSource, '//VTK::Camera::Dec', [
        'uniform mat4 MCPCMatrix;',
        'uniform mat4 MCVCMatrix;',
      ]).result;
      GSSource = vtkShaderProgram.substitute(
        GSSource,
        '//VTK::PositionVC::Dec',
        ['in vec4 vertexVCVSOutput[];', 'out vec4 vertexVCGSOutput;']
      ).result;
      GSSource = vtkShaderProgram.substitute(
        GSSource,
        '//VTK::PositionVC::Impl',
        ['vertexVCGSOutput = vertexVCVSOutput[i];']
      ).result;
      FSSource = vtkShaderProgram.substitute(
        FSSource,
        '//VTK::PositionVC::Dec',
        ['varying vec4 vertexVCVSOutput;']
      ).result;
      FSSource = vtkShaderProgram.substitute(
        FSSource,
        '//VTK::PositionVC::Impl',
        ['vec4 vertexVC = vertexVCVSOutput;']
      ).result;
    } else {
      VSSource = vtkShaderProgram.substitute(VSSource, '//VTK::Camera::Dec', [
        'uniform mat4 MCPCMatrix;',
      ]).result;
      VSSource = vtkShaderProgram.substitute(
        VSSource,
        '//VTK::PositionVC::Impl',
        ['  gl_Position = MCPCMatrix * vertexMC;']
      ).result;
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

      VSSource = vtkShaderProgram.substitute(
        VSSource,
        '//VTK::TCoord::Impl',
        'tcoordVCVSOutput = tcoordMC;'
      ).result;

      // we only handle the first texture by default
      // additional textures are activated and we set the uniform
      // for the texture unit they are assigned to, but you have to
      // add in the shader code to do something with them
      const tus = model.openGLActor.getActiveTextures();
      let tNumComp = 2;
      let tcdim = 2;
      if (tus && tus.length > 0) {
        tNumComp = tus[0].getComponents();
        if (tus[0].getTarget() === model.context.TEXTURE_CUBE_MAP) {
          tcdim = 3;
        }
      }
      if (model.renderable.getColorTextureMap()) {
        tNumComp = model.renderable
          .getColorTextureMap()
          .getPointData()
          .getScalars()
          .getNumberOfComponents();
        tcdim = 2;
      }

      if (tcdim === 2) {
        VSSource = vtkShaderProgram.substitute(
          VSSource,
          '//VTK::TCoord::Dec',
          'attribute vec2 tcoordMC; varying vec2 tcoordVCVSOutput;'
        ).result;
        GSSource = vtkShaderProgram.substitute(GSSource, '//VTK::TCoord::Dec', [
          'in vec2 tcoordVCVSOutput[];',
          'out vec2 tcoordVCGSOutput;',
        ]).result;
        GSSource = vtkShaderProgram.substitute(
          GSSource,
          '//VTK::TCoord::Impl',
          'tcoordVCGSOutput = tcoordVCVSOutput[i];'
        ).result;
        FSSource = vtkShaderProgram.substitute(FSSource, '//VTK::TCoord::Dec', [
          'varying vec2 tcoordVCVSOutput;',
          'uniform sampler2D texture1;',
        ]).result;
        if (tus && tus.length >= 1) {
          switch (tNumComp) {
            case 1:
              FSSource = vtkShaderProgram.substitute(
                FSSource,
                '//VTK::TCoord::Impl',
                [
                  '  vec4 tcolor = texture2D(texture1, tcoordVCVSOutput);',
                  '  ambientColor = ambientColor*tcolor.r;',
                  '  diffuseColor = diffuseColor*tcolor.r;',
                ]
              ).result;
              break;
            case 2:
              FSSource = vtkShaderProgram.substitute(
                FSSource,
                '//VTK::TCoord::Impl',
                [
                  '  vec4 tcolor = texture2D(texture1, tcoordVCVSOutput);',
                  '  ambientColor = ambientColor*tcolor.r;',
                  '  diffuseColor = diffuseColor*tcolor.r;',
                  '  opacity = opacity * tcolor.g;',
                ]
              ).result;
              break;
            default:
              FSSource = vtkShaderProgram.substitute(
                FSSource,
                '//VTK::TCoord::Impl',
                [
                  '  vec4 tcolor = texture2D(texture1, tcoordVCVSOutput);',
                  '  ambientColor = ambientColor*tcolor.rgb;',
                  '  diffuseColor = diffuseColor*tcolor.rgb;',
                  '  opacity = opacity * tcolor.a;',
                ]
              ).result;
          }
        }
      } else {
        VSSource = vtkShaderProgram.substitute(
          VSSource,
          '//VTK::TCoord::Dec',
          'attribute vec3 tcoordMC; varying vec3 tcoordVCVSOutput;'
        ).result;
        GSSource = vtkShaderProgram.substitute(GSSource, '//VTK::TCoord::Dec', [
          'in vec3 tcoordVCVSOutput[];',
          'out vec3 tcoordVCGSOutput;',
        ]).result;
        GSSource = vtkShaderProgram.substitute(
          GSSource,
          '//VTK::TCoord::Impl',
          'tcoordVCGSOutput = tcoordVCVSOutput[i];'
        ).result;
        FSSource = vtkShaderProgram.substitute(FSSource, '//VTK::TCoord::Dec', [
          'varying vec3 tcoordVCVSOutput;',
          'uniform samplerCube texture1;',
        ]).result;
        switch (tNumComp) {
          case 1:
            FSSource = vtkShaderProgram.substitute(
              FSSource,
              '//VTK::TCoord::Impl',
              [
                '  vec4 tcolor = textureCube(texture1, tcoordVCVSOutput);',
                '  ambientColor = ambientColor*tcolor.r;',
                '  diffuseColor = diffuseColor*tcolor.r;',
              ]
            ).result;
            break;
          case 2:
            FSSource = vtkShaderProgram.substitute(
              FSSource,
              '//VTK::TCoord::Impl',
              [
                '  vec4 tcolor = textureCube(texture1, tcoordVCVSOutput);',
                '  ambientColor = ambientColor*tcolor.r;',
                '  diffuseColor = diffuseColor*tcolor.r;',
                '  opacity = opacity * tcolor.g;',
              ]
            ).result;
            break;
          default:
            FSSource = vtkShaderProgram.substitute(
              FSSource,
              '//VTK::TCoord::Impl',
              [
                '  vec4 tcolor = textureCube(texture1, tcoordVCVSOutput);',
                '  ambientColor = ambientColor*tcolor.rgb;',
                '  diffuseColor = diffuseColor*tcolor.rgb;',
                '  opacity = opacity * tcolor.a;',
              ]
            ).result;
        }
      }
      shaders.Vertex = VSSource;
      shaders.Geometry = GSSource;
      shaders.Fragment = FSSource;
    }
  };

  publicAPI.replaceShaderClip = (shaders, ren, actor) => {
    let VSSource = shaders.Vertex;
    let FSSource = shaders.Fragment;

    if (model.renderable.getNumberOfClippingPlanes()) {
      const numClipPlanes = model.renderable.getNumberOfClippingPlanes();
      VSSource = vtkShaderProgram.substitute(VSSource, '//VTK::Clip::Dec', [
        'uniform int numClipPlanes;',
        `uniform vec4 clipPlanes[${numClipPlanes}];`,
        `varying float clipDistancesVSOutput[${numClipPlanes}];`,
      ]).result;

      VSSource = vtkShaderProgram.substitute(VSSource, '//VTK::Clip::Impl', [
        `for (int planeNum = 0; planeNum < ${numClipPlanes}; planeNum++)`,
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
        `varying float clipDistancesVSOutput[${numClipPlanes}];`,
      ]).result;

      FSSource = vtkShaderProgram.substitute(FSSource, '//VTK::Clip::Impl', [
        `for (int planeNum = 0; planeNum < ${numClipPlanes}; planeNum++)`,
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

  publicAPI.getCoincidentParameters = (ren, actor) => {
    // 1. ResolveCoincidentTopology is On and non zero for this primitive
    // type
    let cp = {
      factor: 0.0,
      offset: 0.0,
    };
    const prop = actor.getProperty();
    if (
      model.renderable.getResolveCoincidentTopology() ||
      (prop.getEdgeVisibility() &&
        prop.getRepresentation() === Representation.SURFACE)
    ) {
      const primType = model.lastBoundBO.getPrimitiveType();
      if (
        primType === primTypes.Points ||
        prop.getRepresentation() === Representation.POINTS
      ) {
        cp = model.renderable.getCoincidentTopologyPointOffsetParameter();
      } else if (
        primType === primTypes.Lines ||
        prop.getRepresentation() === Representation.WIREFRAME
      ) {
        cp = model.renderable.getCoincidentTopologyLineOffsetParameters();
      } else if (
        primType === primTypes.Tris ||
        primType === primTypes.TriStrips
      ) {
        cp = model.renderable.getCoincidentTopologyPolygonOffsetParameters();
      }
      if (
        primType === primTypes.TrisEdges ||
        primType === primTypes.TriStripsEdges
      ) {
        cp = model.renderable.getCoincidentTopologyPolygonOffsetParameters();
        cp.factor /= 2.0;
        cp.offset /= 2.0;
      }
    }

    // hardware picking always offset due to saved zbuffer
    // This gets you above the saved surface depth buffer.
    const selector = model.openGLRenderer.getSelector();
    if (
      selector &&
      selector.getFieldAssociation() ===
        FieldAssociations.FIELD_ASSOCIATION_POINTS
    ) {
      cp.offset -= 2.0;
    }
    return cp;
  };

  publicAPI.replaceShaderPicking = (shaders, ren, actor) => {
    let FSSource = shaders.Fragment;
    let VSSource = shaders.Vertex;
    FSSource = vtkShaderProgram.substitute(FSSource, '//VTK::Picking::Dec', [
      'uniform int picking;',
      '//VTK::Picking::Dec',
    ]).result;

    if (!model.openGLRenderer.getSelector()) {
      return;
    }
    if (
      model.lastSelectionState === PassTypes.ID_LOW24 ||
      model.lastSelectionState === PassTypes.ID_HIGH24
    ) {
      VSSource = vtkShaderProgram.substitute(VSSource, '//VTK::Picking::Dec', [
        'flat out int vertexIDVSOutput;\n',
        'uniform int VertexIDOffset;\n',
      ]).result;
      VSSource = vtkShaderProgram.substitute(
        VSSource,
        '//VTK::Picking::Impl',
        '  vertexIDVSOutput = gl_VertexID + VertexIDOffset;\n'
      ).result;

      FSSource = vtkShaderProgram.substitute(
        FSSource,
        '//VTK::Picking::Dec',
        'flat in int vertexIDVSOutput;\n'
      ).result;
      FSSource = vtkShaderProgram.substitute(FSSource, '//VTK::Picking::Impl', [
        '  int idx = vertexIDVSOutput;',
        '//VTK::Picking::Impl',
      ]).result;
    }

    switch (model.lastSelectionState) {
      case PassTypes.ID_LOW24:
        FSSource = vtkShaderProgram.substitute(
          FSSource,
          '//VTK::Picking::Impl',
          '  gl_FragData[0] = vec4(float(idx%256)/255.0, float((idx/256)%256)/255.0, float((idx/65536)%256)/255.0, 1.0);'
        ).result;
        break;
      case PassTypes.ID_HIGH24:
        FSSource = vtkShaderProgram.substitute(
          FSSource,
          '//VTK::Picking::Impl',
          '  gl_FragData[0] = vec4(float(idx)/255.0, 0.0, 0.0, 1.0);'
        ).result;
        break;
      default:
        FSSource = vtkShaderProgram.substitute(
          FSSource,
          '//VTK::Picking::Dec',
          'uniform vec3 mapperIndex;'
        ).result;
        FSSource = vtkShaderProgram.substitute(
          FSSource,
          '//VTK::Picking::Impl',
          '  gl_FragData[0] = picking != 0 ? vec4(mapperIndex,1.0) : gl_FragData[0];'
        ).result;
    }
    shaders.Fragment = FSSource;
    shaders.Vertex = VSSource;
  };

  publicAPI.replaceShaderValues = (shaders, ren, actor) => {
    publicAPI.replaceShaderColor(shaders, ren, actor);
    publicAPI.replaceShaderNormal(shaders, ren, actor);
    publicAPI.replaceShaderLight(shaders, ren, actor);
    publicAPI.replaceShaderTCoord(shaders, ren, actor);
    publicAPI.replaceShaderPicking(shaders, ren, actor);
    publicAPI.replaceShaderClip(shaders, ren, actor);
    publicAPI.replaceShaderCoincidentOffset(shaders, ren, actor);
    publicAPI.replaceShaderPositionVC(shaders, ren, actor);

    if (model.haveSeenDepthRequest) {
      let FSSource = shaders.Fragment;
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
      shaders.Fragment = FSSource;
    }
  };

  publicAPI.getNeedToRebuildShaders = (cellBO, ren, actor) => {
    let lightComplexity = 0;
    let numberOfLights = 0;

    const primType = cellBO.getPrimitiveType();
    const poly = model.currentInput;

    // different algo from C++ as of 5/2019
    let needLighting = false;
    const pointNormals = poly.getPointData().getNormals();
    const cellNormals = poly.getCellData().getNormals();
    const flat = actor.getProperty().getInterpolation() === Shading.FLAT;
    const representation = actor.getProperty().getRepresentation();
    const mode = cellBO.getOpenGLMode(representation, primType);
    // 1) all surfaces need lighting
    if (mode === model.context.TRIANGLES) {
      needLighting = true;
      // 2) all cell normals without point normals need lighting
    } else if (cellNormals && !pointNormals) {
      needLighting = true;
      // 3) Phong + pointNormals need lighting
    } else if (!flat && pointNormals) {
      needLighting = true;
      // 4) Phong Lines need lighting
    } else if (!flat && mode === model.context.LINES) {
      needLighting = true;
    }
    // 5) everything else is unlit

    // do we need lighting?
    if (actor.getProperty().getLighting() && needLighting) {
      // consider the lighting complexity to determine which case applies
      // simple headlight, Light Kit, the whole feature set of VTK
      lightComplexity = 0;
      const lights = ren.getLightsByReference();
      for (let index = 0; index < lights.length; ++index) {
        const light = lights[index];
        const status = light.getSwitch();
        if (status > 0) {
          numberOfLights++;
          if (lightComplexity === 0) {
            lightComplexity = 1;
          }
        }

        if (
          lightComplexity === 1 &&
          (numberOfLights > 1 ||
            light.getIntensity() !== 1.0 ||
            !light.lightTypeIsHeadLight())
        ) {
          lightComplexity = 2;
        }
        if (lightComplexity < 3 && light.getPositional()) {
          lightComplexity = 3;
        }
      }
    }

    let needRebuild = false;
    const lastLightComplexity = model.lastBoundBO.getReferenceByName(
      'lastLightComplexity'
    );
    const lastLightCount =
      model.lastBoundBO.getReferenceByName('lastLightCount');
    if (
      lastLightComplexity !== lightComplexity ||
      lastLightCount !== numberOfLights
    ) {
      model.lastBoundBO.set({ lastLightComplexity: lightComplexity }, true);
      model.lastBoundBO.set({ lastLightCount: numberOfLights }, true);
      needRebuild = true;
    }

    // has the render pass shader replacement changed? Two options
    if (!model.currentRenderPass && model.lastRenderPassShaderReplacement) {
      needRebuild = true;
      model.lastRenderPassShaderReplacement = null;
    }
    if (
      model.currentRenderPass &&
      model.currentRenderPass.getShaderReplacement() !==
        model.lastRenderPassShaderReplacement
    ) {
      model.lastRenderPassShaderReplacement =
        model.currentRenderPass.getShaderReplacement();
      needRebuild = true;
    }

    // has something changed that would require us to recreate the shader?
    // candidates are
    // property modified (representation interpolation and lighting)
    // input modified
    // light complexity changed
    if (
      model.lastHaveSeenDepthRequest !== model.haveSeenDepthRequest ||
      cellBO.getShaderSourceTime().getMTime() < model.renderable.getMTime() ||
      cellBO.getShaderSourceTime().getMTime() < model.currentInput.getMTime() ||
      cellBO.getShaderSourceTime().getMTime() <
        model.selectionStateChanged.getMTime() ||
      needRebuild
    ) {
      model.lastHaveSeenDepthRequest = model.haveSeenDepthRequest;
      return true;
    }

    return false;
  };

  publicAPI.invokeShaderCallbacks = (cellBO, ren, actor) => {
    const listCallbacks =
      model.renderable.getViewSpecificProperties().ShadersCallbacks;
    if (listCallbacks) {
      listCallbacks.forEach((object) => {
        object.callback(object.userData, cellBO, ren, actor);
      });
    }
  };

  publicAPI.setMapperShaderParameters = (cellBO, ren, actor) => {
    // Now to update the VAO too, if necessary.
    if (cellBO.getProgram().isUniformUsed('PrimitiveIDOffset')) {
      cellBO
        .getProgram()
        .setUniformi('PrimitiveIDOffset', model.primitiveIDOffset);
    }
    if (cellBO.getProgram().isUniformUsed('VertexIDOffset')) {
      cellBO.getProgram().setUniformi('VertexIDOffset', model.vertexIDOffset);
    }

    if (
      cellBO.getCABO().getElementCount() &&
      (model.VBOBuildTime.getMTime() >
        cellBO.getAttributeUpdateTime().getMTime() ||
        cellBO.getShaderSourceTime().getMTime() >
          cellBO.getAttributeUpdateTime().getMTime())
    ) {
      const lastLightComplexity = model.lastBoundBO.getReferenceByName(
        'lastLightComplexity'
      );

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
              false
            )
        ) {
          vtkErrorMacro('Error setting vertexMC in shader VAO.');
        }
      }
      if (
        cellBO.getProgram().isAttributeUsed('normalMC') &&
        cellBO.getCABO().getNormalOffset() &&
        lastLightComplexity > 0
      ) {
        if (
          !cellBO
            .getVAO()
            .addAttributeArray(
              cellBO.getProgram(),
              cellBO.getCABO(),
              'normalMC',
              cellBO.getCABO().getNormalOffset(),
              cellBO.getCABO().getStride(),
              model.context.FLOAT,
              3,
              false
            )
        ) {
          vtkErrorMacro('Error setting normalMC in shader VAO.');
        }
      } else {
        cellBO.getVAO().removeAttributeArray('normalMC');
      }

      model.renderable.getCustomShaderAttributes().forEach((attrName, idx) => {
        if (cellBO.getProgram().isAttributeUsed(`${attrName}MC`)) {
          if (
            !cellBO
              .getVAO()
              .addAttributeArray(
                cellBO.getProgram(),
                cellBO.getCABO(),
                `${attrName}MC`,
                cellBO.getCABO().getCustomData()[idx].offset,
                cellBO.getCABO().getStride(),
                model.context.FLOAT,
                cellBO.getCABO().getCustomData()[idx].components,
                false
              )
          ) {
            vtkErrorMacro(`Error setting ${attrName}MC in shader VAO.`);
          }
        }
      });

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
              false
            )
        ) {
          vtkErrorMacro('Error setting tcoordMC in shader VAO.');
        }
      } else {
        cellBO.getVAO().removeAttributeArray('tcoordMC');
      }
      if (
        cellBO.getProgram().isAttributeUsed('scalarColor') &&
        cellBO.getCABO().getColorComponents()
      ) {
        if (
          !cellBO
            .getVAO()
            .addAttributeArray(
              cellBO.getProgram(),
              cellBO.getCABO().getColorBO(),
              'scalarColor',
              cellBO.getCABO().getColorOffset(),
              cellBO.getCABO().getColorBOStride(),
              model.context.UNSIGNED_BYTE,
              4,
              true
            )
        ) {
          vtkErrorMacro('Error setting scalarColor in shader VAO.');
        }
      } else {
        cellBO.getVAO().removeAttributeArray('scalarColor');
      }

      cellBO.getAttributeUpdateTime().modified();
    }

    if (model.renderable.getNumberOfClippingPlanes()) {
      // add all the clipping planes
      const numClipPlanes = model.renderable.getNumberOfClippingPlanes();
      const planeEquations = [];

      const shiftScaleEnabled = cellBO.getCABO().getCoordShiftAndScaleEnabled();
      const inverseShiftScaleMatrix = shiftScaleEnabled
        ? cellBO.getCABO().getInverseShiftAndScaleMatrix()
        : null;
      const mat = inverseShiftScaleMatrix
        ? mat4.copy(model.tmpMat4, actor.getMatrix())
        : actor.getMatrix();
      if (inverseShiftScaleMatrix) {
        mat4.transpose(mat, mat);
        mat4.multiply(mat, mat, inverseShiftScaleMatrix);
        mat4.transpose(mat, mat);
      }

      for (let i = 0; i < numClipPlanes; i++) {
        const planeEquation = [];
        model.renderable.getClippingPlaneInDataCoords(mat, i, planeEquation);

        for (let j = 0; j < 4; j++) {
          planeEquations.push(planeEquation[j]);
        }
      }
      cellBO.getProgram().setUniformi('numClipPlanes', numClipPlanes);
      cellBO.getProgram().setUniform4fv('clipPlanes', planeEquations);
    }

    if (
      model.internalColorTexture &&
      cellBO.getProgram().isUniformUsed('texture1')
    ) {
      cellBO
        .getProgram()
        .setUniformi('texture1', model.internalColorTexture.getTextureUnit());
    }
    const tus = model.openGLActor.getActiveTextures();
    if (tus) {
      for (let index = 0; index < tus.length; ++index) {
        const tex = tus[index];
        const texUnit = tex.getTextureUnit();
        const tname = `texture${texUnit + 1}`;
        if (cellBO.getProgram().isUniformUsed(tname)) {
          cellBO.getProgram().setUniformi(tname, texUnit);
        }
      }
    }

    // handle depth requests
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

    // handle wide lines
    cellBO.setMapperShaderParameters(
      ren,
      actor,
      model.openGLRenderer.getTiledSizeAndOrigin()
    );

    const selector = model.openGLRenderer.getSelector();
    cellBO
      .getProgram()
      .setUniform3fArray(
        'mapperIndex',
        selector ? selector.getPropColorValue() : [0.0, 0.0, 0.0]
      );
    cellBO
      .getProgram()
      .setUniformi('picking', selector ? selector.getCurrentPass() + 1 : 0);
  };

  publicAPI.setLightingShaderParameters = (cellBO, ren, actor) => {
    // for unlit and headlight there are no lighting parameters
    const lastLightComplexity = model.lastBoundBO.getReferenceByName(
      'lastLightComplexity'
    );
    if (lastLightComplexity < 2) {
      return;
    }

    const program = cellBO.getProgram();

    // bind some light settings
    let numberOfLights = 0;

    const lights = ren.getLightsByReference();
    for (let index = 0; index < lights.length; ++index) {
      const light = lights[index];
      const status = light.getSwitch();
      if (status > 0.0) {
        const dColor = light.getColorByReference();
        const intensity = light.getIntensity();
        model.lightColor[0] = dColor[0] * intensity;
        model.lightColor[1] = dColor[1] * intensity;
        model.lightColor[2] = dColor[2] * intensity;
        // get required info from light
        const ld = light.getDirection();
        const transform = ren.getActiveCamera().getViewMatrix();

        const newLightDirection = [...ld];
        if (light.lightTypeIsSceneLight()) {
          newLightDirection[0] =
            transform[0] * ld[0] + transform[1] * ld[1] + transform[2] * ld[2];
          newLightDirection[1] =
            transform[4] * ld[0] + transform[5] * ld[1] + transform[6] * ld[2];
          newLightDirection[2] =
            transform[8] * ld[0] + transform[9] * ld[1] + transform[10] * ld[2];
          vtkMath.normalize(newLightDirection);
        }

        model.lightDirection[0] = newLightDirection[0];
        model.lightDirection[1] = newLightDirection[1];
        model.lightDirection[2] = newLightDirection[2];
        model.lightHalfAngle[0] = -model.lightDirection[0];
        model.lightHalfAngle[1] = -model.lightDirection[1];
        model.lightHalfAngle[2] = -model.lightDirection[2] + 1.0;
        vtkMath.normalize(model.lightDirection);
        program.setUniform3fArray(
          `lightColor${numberOfLights}`,
          model.lightColor
        );
        program.setUniform3fArray(
          `lightDirectionVC${numberOfLights}`,
          model.lightDirection
        );
        program.setUniform3fArray(
          `lightHalfAngleVC${numberOfLights}`,
          model.lightHalfAngle
        );
        numberOfLights++;
      }
    }

    // we are done unless we have positional lights
    if (lastLightComplexity < 3) {
      return;
    }

    // for lightkit case there are some parameters to set
    const cam = ren.getActiveCamera();
    const viewTF = cam.getViewMatrix();
    mat4.transpose(viewTF, viewTF);

    numberOfLights = 0;

    for (let index = 0; index < lights.length; ++index) {
      const light = lights[index];
      const status = light.getSwitch();
      if (status > 0.0) {
        const lp = light.getTransformedPosition();
        const np = new Float64Array(3);
        vec3.transformMat4(np, lp, viewTF);
        program.setUniform3fArray(
          `lightAttenuation${numberOfLights}`,
          light.getAttenuationValuesByReference()
        );
        program.setUniformi(
          `lightPositional${numberOfLights}`,
          light.getPositional()
        );
        program.setUniformf(
          `lightExponent${numberOfLights}`,
          light.getExponent()
        );
        program.setUniformf(
          `lightConeAngle${numberOfLights}`,
          light.getConeAngle()
        );
        program.setUniform3fArray(`lightPositionVC${numberOfLights}`, [
          np[0],
          np[1],
          np[2],
        ]);
        numberOfLights++;
      }
    }
  };

  function safeMatrixMultiply(matrixArray, matrixType, tmpMat) {
    matrixType.identity(tmpMat);
    return matrixArray.reduce((res, matrix, index) => {
      if (index === 0) {
        return matrix ? matrixType.copy(res, matrix) : matrixType.identity(res);
      }
      return matrix ? matrixType.multiply(res, res, matrix) : res;
    }, tmpMat);
  }

  publicAPI.setCameraShaderParameters = (cellBO, ren, actor) => {
    const program = cellBO.getProgram();

    // [WMVP]C == {world, model, view, projection} coordinates
    // E.g., WCPC == world to projection coordinate transformation
    const keyMats = model.openGLCamera.getKeyMatrices(ren);
    const cam = ren.getActiveCamera();

    const camm = model.openGLCamera.getKeyMatrixTime().getMTime();
    const progm = program.getLastCameraMTime();

    const shiftScaleEnabled = cellBO.getCABO().getCoordShiftAndScaleEnabled();
    const inverseShiftScaleMatrix = shiftScaleEnabled
      ? cellBO.getCABO().getInverseShiftAndScaleMatrix()
      : null;

    const actorIsIdentity = actor.getIsIdentity();
    const actMats = actorIsIdentity
      ? { mcwc: null, normalMatrix: null }
      : model.openGLActor.getKeyMatrices();

    program.setUniformMatrix(
      'MCPCMatrix',
      safeMatrixMultiply(
        [keyMats.wcpc, actMats.mcwc, inverseShiftScaleMatrix],
        mat4,
        model.tmpMat4
      )
    );
    if (program.isUniformUsed('MCVCMatrix')) {
      program.setUniformMatrix(
        'MCVCMatrix',
        safeMatrixMultiply(
          [keyMats.wcvc, actMats.mcwc, inverseShiftScaleMatrix],
          mat4,
          model.tmpMat4
        )
      );
    }
    if (program.isUniformUsed('normalMatrix')) {
      program.setUniformMatrix3x3(
        'normalMatrix',
        safeMatrixMultiply(
          [keyMats.normalMatrix, actMats.normalMatrix],
          mat3,
          model.tmpMat3
        )
      );
    }

    if (progm !== camm) {
      if (program.isUniformUsed('cameraParallel')) {
        program.setUniformi('cameraParallel', cam.getParallelProjection());
      }
      program.setLastCameraMTime(camm);
    }

    if (!actorIsIdentity) {
      // reset the cam mtime as actor modified the shader values
      program.setLastCameraMTime(0);
    }
  };

  publicAPI.setPropertyShaderParameters = (cellBO, ren, actor) => {
    const program = cellBO.getProgram();

    let ppty = actor.getProperty();

    let opacity = ppty.getOpacity();

    let aColor = model.drawingEdges
      ? ppty.getEdgeColorByReference()
      : ppty.getAmbientColorByReference();
    let dColor = model.drawingEdges
      ? ppty.getEdgeColorByReference()
      : ppty.getDiffuseColorByReference();

    let aIntensity = model.drawingEdges ? 1.0 : ppty.getAmbient();
    let dIntensity = model.drawingEdges ? 0.0 : ppty.getDiffuse();
    let sIntensity = model.drawingEdges ? 0.0 : ppty.getSpecular();

    const specularPower = ppty.getSpecularPower();

    program.setUniformf('opacityUniform', opacity);

    program.setUniform3fArray('ambientColorUniform', aColor);
    program.setUniform3fArray('diffuseColorUniform', dColor);

    program.setUniformf('ambient', aIntensity);
    program.setUniformf('diffuse', dIntensity);

    // we are done unless we have lighting
    const lastLightComplexity = model.lastBoundBO.getReferenceByName(
      'lastLightComplexity'
    );

    if (lastLightComplexity < 1) {
      return;
    }

    let sColor = ppty.getSpecularColorByReference();
    program.setUniform3fArray('specularColorUniform', sColor);
    program.setUniformf('specularPowerUniform', specularPower);
    program.setUniformf('specular', sIntensity);

    // now set the backface properties if we have them
    if (program.isUniformUsed('ambientIntensityBF')) {
      ppty = actor.getBackfaceProperty();

      opacity = ppty.getOpacity();

      aColor = ppty.getAmbientColor();
      aIntensity = ppty.getAmbient();

      dColor = ppty.getDiffuseColor();
      dIntensity = ppty.getDiffuse();

      sColor = ppty.getSpecularColor();
      sIntensity = ppty.getSpecular();

      program.setUniformf('ambientIntensityBF', aIntensity);
      program.setUniformf('diffuseIntensityBF', dIntensity);
      program.setUniformf('opacityUniformBF', opacity);
      program.setUniform3fArray('ambientColorUniformBF', aColor);
      program.setUniform3fArray('diffuseColorUniformBF', dColor);

      // we are done unless we have lighting
      if (lastLightComplexity < 1) {
        return;
      }

      program.setUniformf('specularIntensityBF', sIntensity);
      program.setUniform3fArray('specularColorUniformBF', sColor);
      program.setUniformf('specularPowerUniformBF', specularPower);
    }
  };

  publicAPI.updateMaximumPointCellIds = (ren, actor) => {
    const selector = model.openGLRenderer.getSelector();
    if (!selector) {
      return;
    }

    if (model.selectionWebGLIdsToVTKIds?.points?.length) {
      const length = model.selectionWebGLIdsToVTKIds.points.length;
      selector.setMaximumPointId(length - 1);
    }

    if (model.selectionWebGLIdsToVTKIds?.cells?.length) {
      const length = model.selectionWebGLIdsToVTKIds.cells.length;
      selector.setMaximumCellId(length - 1);
    }

    const fieldAssociation = selector.getFieldAssociation();
    if (fieldAssociation === FieldAssociations.FIELD_ASSOCIATION_POINTS) {
      model.pointPicking = true;
    }
  };

  publicAPI.renderPieceStart = (ren, actor) => {
    model.primitiveIDOffset = 0;
    model.vertexIDOffset = 0;

    const picking = getPickState(model.openGLRenderer);
    if (model.lastSelectionState !== picking) {
      model.selectionStateChanged.modified();
      model.lastSelectionState = picking;
    }

    if (model.openGLRenderer.getSelector()) {
      switch (picking) {
        default:
          model.openGLRenderer.getSelector().renderProp(actor);
      }
    }

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

    const drawSurfaceWithEdges =
      actor.getProperty().getEdgeVisibility() &&
      representation === Representation.SURFACE;

    const selector = model.openGLRenderer.getSelector();
    // If we are picking points, we need to tell it to the helper
    const pointPicking =
      selector &&
      selector.getFieldAssociation() ===
        FieldAssociations.FIELD_ASSOCIATION_POINTS &&
      (model.lastSelectionState === PassTypes.ID_LOW24 ||
        model.lastSelectionState === PassTypes.ID_HIGH24);

    // for every primitive type
    for (let i = primTypes.Start; i < primTypes.End; i++) {
      model.primitives[i].setPointPicking(pointPicking);
      const cabo = model.primitives[i].getCABO();
      if (cabo.getElementCount()) {
        // are we drawing edges
        model.drawingEdges =
          drawSurfaceWithEdges &&
          (i === primTypes.TrisEdges || i === primTypes.TriStripsEdges);
        if (!model.drawingEdges || !model.renderDepth) {
          model.lastBoundBO = model.primitives[i];
          model.primitiveIDOffset += model.primitives[i].drawArrays(
            ren,
            actor,
            representation,
            publicAPI
          );
          model.vertexIDOffset += model.primitives[i]
            .getCABO()
            .getElementCount();
        }
      }
    }
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

    publicAPI.invokeEvent(StartEvent);
    if (!model.renderable.getStatic()) {
      model.renderable.update();
    }
    model.currentInput = model.renderable.getInputData();
    publicAPI.invokeEvent(EndEvent);

    if (!model.currentInput) {
      vtkErrorMacro('No input!');
      return;
    }

    // if there are no points then we are done
    if (
      !model.currentInput.getPoints ||
      !model.currentInput.getPoints().getNumberOfValues()
    ) {
      return;
    }

    // apply faceCulling
    const gl = model.context;
    const backfaceCulling = actor.getProperty().getBackfaceCulling();
    const frontfaceCulling = actor.getProperty().getFrontfaceCulling();
    if (!backfaceCulling && !frontfaceCulling) {
      model._openGLRenderWindow.disableCullFace();
    } else if (frontfaceCulling) {
      model._openGLRenderWindow.enableCullFace();
      gl.cullFace(gl.FRONT);
    } else {
      model._openGLRenderWindow.enableCullFace();
      gl.cullFace(gl.BACK);
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

  publicAPI.getNeedToRebuildBufferObjects = (ren, actor) => {
    // first do a coarse check
    // Note that the actor's mtime includes it's properties mtime
    const vmtime = model.VBOBuildTime.getMTime();
    if (
      vmtime < publicAPI.getMTime() ||
      vmtime < model.renderable.getMTime() ||
      vmtime < actor.getMTime() ||
      vmtime < model.currentInput.getMTime()
    ) {
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
      if (
        (scalarMode === ScalarMode.USE_CELL_DATA ||
          scalarMode === ScalarMode.USE_CELL_FIELD_DATA ||
          scalarMode === ScalarMode.USE_FIELD_DATA ||
          !poly.getPointData().getScalars()) &&
        scalarMode !== ScalarMode.USE_POINT_FIELD_DATA &&
        c
      ) {
        model.haveCellScalars = true;
      }
    }

    // Do we have normals?
    let n =
      actor.getProperty().getInterpolation() !== Shading.FLAT
        ? poly.getPointData().getNormals()
        : null;
    if (n === null && poly.getCellData().getNormals()) {
      model.haveCellNormals = true;
      n = poly.getCellData().getNormals();
    }

    // rebuild the VBO if the data has changed we create a string for the VBO what
    // can change the VBO? points normals tcoords colors so what can change those?
    // the input data is clearly one as it can change all four items tcoords may
    // haveTextures or not colors may change based on quite a few mapping
    // parameters in the mapper

    const representation = actor.getProperty().getRepresentation();

    let tcoords = poly.getPointData().getTCoords();
    if (!model.openGLActor.getActiveTextures()) {
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
      tex.setMinificationFilter(Filter.NEAREST);
      tex.setMagnificationFilter(Filter.NEAREST);
      tex.setWrapS(Wrap.CLAMP_TO_EDGE);
      tex.setWrapT(Wrap.CLAMP_TO_EDGE);
      tex.setOpenGLRenderWindow(model._openGLRenderWindow);

      const input = model.renderable.getColorTextureMap();
      const ext = input.getExtent();
      const inScalars = input.getPointData().getScalars();
      tex.create2DFromRaw(
        ext[1] - ext[0] + 1,
        ext[3] - ext[2] + 1,
        inScalars.getNumberOfComponents(),
        inScalars.getDataType(),
        inScalars.getData()
      );
      tex.activate();
      tex.sendParameters();
      tex.deactivate();
    }

    const toString =
      `${poly.getMTime()}A${representation}B${poly.getMTime()}` +
      `C${n ? n.getMTime() : 1}D${c ? c.getMTime() : 1}` +
      `E${actor.getProperty().getEdgeVisibility()}` +
      `F${tcoords ? tcoords.getMTime() : 1}`;
    if (model.VBOBuildString !== toString) {
      // Build the VBOs
      const points = poly.getPoints();
      const options = {
        points,
        normals: n,
        tcoords,
        colors: c,
        cellOffset: 0,
        vertexOffset: 0, // Used to keep track of vertex ids across primitives for selection
        haveCellScalars: model.haveCellScalars,
        haveCellNormals: model.haveCellNormals,
        customAttributes: model.renderable
          .getCustomShaderAttributes()
          .map((arrayName) => poly.getPointData().getArrayByName(arrayName)),
      };

      if (model.renderable.getPopulateSelectionSettings()) {
        model.selectionWebGLIdsToVTKIds = {
          points: null,
          cells: null,
        };
      }

      const primitives = [
        { inRep: 'verts', cells: poly.getVerts() },
        { inRep: 'lines', cells: poly.getLines() },
        { inRep: 'polys', cells: poly.getPolys() },
        { inRep: 'strips', cells: poly.getStrips() },
        { inRep: 'polys', cells: poly.getPolys() },
        { inRep: 'strips', cells: poly.getStrips() },
      ];
      const drawSurfaceWithEdges = // TODO: false if picking
        actor.getProperty().getEdgeVisibility() &&
        representation === Representation.SURFACE;

      for (let i = primTypes.Start; i < primTypes.End; i++) {
        if (i !== primTypes.TrisEdges && i !== primTypes.TriStripsEdges) {
          options.cellOffset += model.primitives[i]
            .getCABO()
            .createVBO(
              primitives[i].cells,
              primitives[i].inRep,
              representation,
              options,
              model.selectionWebGLIdsToVTKIds
            );
          options.vertexOffset += model.primitives[i]
            .getCABO()
            .getElementCount();
        } else {
          // if we have edge visibility build the edge VBOs
          if (drawSurfaceWithEdges) {
            model.primitives[i]
              .getCABO()
              .createVBO(
                primitives[i].cells,
                primitives[i].inRep,
                Representation.WIREFRAME,
                {
                  points,
                  normals: n,
                  tcoords: null,
                  colors: null,
                  cellOffset: 0,
                  haveCellScalars: false,
                  haveCellNormals: false,
                }
              );
          } else {
            // otherwise free them
            model.primitives[i].releaseGraphicsResources();
          }
        }
      }

      if (model.renderable.getPopulateSelectionSettings()) {
        model.renderable.setSelectionWebGLIdsToVTKIds(
          model.selectionWebGLIdsToVTKIds
        );
        publicAPI.updateMaximumPointCellIds();
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
  primitives: null,
  primTypes: null,
  shaderRebuildString: null,
  tmpMat4: null,
  ambientColor: [], // used internally
  diffuseColor: [], // used internally
  specularColor: [], // used internally
  lightColor: [], // used internally
  lightHalfAngle: [], // used internally
  lightDirection: [], // used internally
  lastHaveSeenDepthRequest: false,
  haveSeenDepthRequest: false,
  lastSelectionState: PassTypes.MIN_KNOWN_PASS - 1,
  selectionStateChanged: null,
  selectionWebGLIdsToVTKIds: null,
  pointPicking: false,
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

  model.primitives = [];
  model.primTypes = primTypes;

  model.tmpMat3 = mat3.identity(new Float64Array(9));
  model.tmpMat4 = mat4.identity(new Float64Array(16));

  for (let i = primTypes.Start; i < primTypes.End; i++) {
    model.primitives[i] = vtkHelper.newInstance();
    model.primitives[i].setPrimitiveType(i);
    model.primitives[i].set(
      { lastLightComplexity: 0, lastLightCount: 0, lastSelectionPass: false },
      true
    );
  }

  // Build VTK API
  macro.setGet(publicAPI, model, ['context']);

  model.VBOBuildTime = {};
  macro.obj(model.VBOBuildTime, { mtime: 0 });

  model.selectionStateChanged = {};
  macro.obj(model.selectionStateChanged, { mtime: 0 });

  // Object methods
  vtkOpenGLPolyDataMapper(publicAPI, model);
}

// ----------------------------------------------------------------------------

export const newInstance = macro.newInstance(extend, 'vtkOpenGLPolyDataMapper');

// ----------------------------------------------------------------------------

export default { newInstance, extend };

// Register ourself to OpenGL backend if imported
registerOverride('vtkMapper', newInstance);
