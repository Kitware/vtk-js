import { mat3, mat4, vec3 } from 'gl-matrix';

import macro from 'vtk.js/Sources/macro';
import vtkHelper from 'vtk.js/Sources/Rendering/OpenGL/Helper';
import vtkMapper from 'vtk.js/Sources/Rendering/Core/Mapper';
import vtkMath from 'vtk.js/Sources/Common/Core/Math';
import vtkOpenGLTexture from 'vtk.js/Sources/Rendering/OpenGL/Texture';
import vtkProperty from 'vtk.js/Sources/Rendering/Core/Property';
import vtkShaderProgram from 'vtk.js/Sources/Rendering/OpenGL/ShaderProgram';
import vtkViewNode from 'vtk.js/Sources/Rendering/SceneGraph/ViewNode';

import vtkPolyDataVS from 'vtk.js/Sources/Rendering/OpenGL/glsl/vtkPolyDataVS.glsl';
import vtkPolyDataFS from 'vtk.js/Sources/Rendering/OpenGL/glsl/vtkPolyDataFS.glsl';

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

const { Representation, Shading } = vtkProperty;
const { ScalarMode } = vtkMapper;
const { Filter, Wrap } = vtkOpenGLTexture;
const { vtkErrorMacro } = macro;

const StartEvent = { type: 'StartEvent' };
const EndEvent = { type: 'EndEvent' };

// ----------------------------------------------------------------------------
// vtkOpenGLPolyDataMapper methods
// ----------------------------------------------------------------------------

function vtkOpenGLPolyDataMapper(publicAPI, model) {
  // Set our className
  model.classHierarchy.push('vtkOpenGLPolyDataMapper');

  publicAPI.buildPass = (prepass) => {
    if (prepass) {
      model.openGLActor = publicAPI.getFirstAncestorOfType('vtkOpenGLActor');
      model.openGLRenderer = model.openGLActor.getFirstAncestorOfType(
        'vtkOpenGLRenderer'
      );
      model.openGLRenderWindow = model.openGLRenderer.getParent();
      model.openGLCamera = model.openGLRenderer.getViewNodeFor(
        model.openGLRenderer.getRenderable().getActiveCamera()
      );
    }
  };

  // Renders myself
  publicAPI.translucentPass = (prepass) => {
    if (prepass) {
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
    const ctx = model.openGLRenderWindow.getContext();
    if (model.context !== ctx) {
      model.context = ctx;
      for (let i = primTypes.Start; i < primTypes.End; i++) {
        model.primitives[i].setOpenGLRenderWindow(model.openGLRenderWindow);
      }
    }
    const actor = model.openGLActor.getRenderable();
    const ren = model.openGLRenderer.getRenderable();
    publicAPI.renderPiece(ren, actor);
  };

  publicAPI.buildShaders = (shaders, ren, actor) => {
    publicAPI.getShaderTemplate(shaders, ren, actor);

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
    // by assiging a default value from the uniform
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

    const lastLightCount = model.lastBoundBO.getReferenceByName(
      'lastLightCount'
    );

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
            publicAPI.getOpenGLMode(
              actor.getProperty().getRepresentation(),
              model.lastBoundBO.getPrimitiveType()
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
                '  vec3 fdx = vec3(dFdx(vertexVC.x),dFdx(vertexVC.y),dFdx(vertexVC.z));',
                '  vec3 fdy = vec3(dFdy(vertexVC.x),dFdy(vertexVC.y),dFdy(vertexVC.z));',
                '  //VTK::UniformFlow::Impl',
              ] // For further replacements
            ).result;
            FSSource = vtkShaderProgram.substitute(
              FSSource,
              '//VTK::Normal::Impl',
              [
                'vec3 normalVCVSOutput;',
                '  fdx = normalize(fdx);',
                '  fdy = normalize(fdy);',
                '  if (abs(fdx.x) > 0.0)',
                '    { normalVCVSOutput = normalize(cross(vec3(fdx.y, -fdx.x, 0.0), fdx)); }',
                '  else { normalVCVSOutput = normalize(cross(vec3(fdy.y, -fdy.x, 0.0), fdy));}',
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
    let VSSource = shaders.Vertex;
    let GSSource = shaders.Geometry;
    let FSSource = shaders.Fragment;

    // for points make sure to add in the point size
    if (
      actor.getProperty().getRepresentation() === Representation.POINTS ||
      model.lastBoundBO.getPrimitiveType() === primTypes.Points
    ) {
      VSSource = vtkShaderProgram.substitute(
        VSSource,
        '//VTK::PositionVC::Impl',
        [
          '//VTK::PositionVC::Impl',
          `  gl_PointSize = ${actor.getProperty().getPointSize()}.0;`,
        ],
        false
      ).result;
    }

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
          '  gl_Position = MCDCMatrix * vertexMC;',
        ]
      ).result;
      VSSource = vtkShaderProgram.substitute(VSSource, '//VTK::Camera::Dec', [
        'uniform mat4 MCDCMatrix;',
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
        'uniform mat4 MCDCMatrix;',
      ]).result;
      VSSource = vtkShaderProgram.substitute(
        VSSource,
        '//VTK::PositionVC::Impl',
        ['  gl_Position = MCDCMatrix * vertexMC;']
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
                  'vec4 tcolor = texture2D(texture1, tcoordVCVSOutput);',
                  'gl_FragData[0] = clamp(gl_FragData[0],0.0,1.0)*',
                  '  vec4(tcolor.r,tcolor.r,tcolor.r,1.0);',
                ]
              ).result;
              break;
            case 2:
              FSSource = vtkShaderProgram.substitute(
                FSSource,
                '//VTK::TCoord::Impl',
                [
                  'vec4 tcolor = texture2D(texture1, tcoordVCVSOutput);',
                  'gl_FragData[0] = clamp(gl_FragData[0],0.0,1.0)*',
                  '  vec4(tcolor.r,tcolor.r,tcolor.r,tcolor.g);',
                ]
              ).result;
              break;
            default:
              FSSource = vtkShaderProgram.substitute(
                FSSource,
                '//VTK::TCoord::Impl',
                'gl_FragData[0] = clamp(gl_FragData[0],0.0,1.0)*texture2D(texture1, tcoordVCVSOutput.st);'
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
                'vec4 tcolor = textureCube(texture1, tcoordVCVSOutput);',
                'gl_FragData[0] = clamp(gl_FragData[0],0.0,1.0)*',
                '  vec4(tcolor.r,tcolor.r,tcolor.r,1.0);',
              ]
            ).result;
            break;
          case 2:
            FSSource = vtkShaderProgram.substitute(
              FSSource,
              '//VTK::TCoord::Impl',
              [
                'vec4 tcolor = textureCube(texture1, tcoordVCVSOutput);',
                'gl_FragData[0] = clamp(gl_FragData[0],0.0,1.0)*',
                '  vec4(tcolor.r,tcolor.r,tcolor.r,tcolor.g);',
              ]
            ).result;
            break;
          default:
            FSSource = vtkShaderProgram.substitute(
              FSSource,
              '//VTK::TCoord::Impl',
              'gl_FragData[0] = clamp(gl_FragData[0],0.0,1.0)*textureCube(texture1, tcoordVCVSOutput);'
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

  publicAPI.getCoincidentParameters = (ren, actor) => {
    // 1. ResolveCoincidentTopology is On and non zero for this primitive
    // type
    let cp = null;
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

      FSSource = vtkShaderProgram.substitute(
        FSSource,
        '//VTK::Coincident::Dec',
        ['uniform float cfactor;', 'uniform float coffset;']
      ).result;

      if (model.context.getExtension('EXT_frag_depth')) {
        if (cp.factor !== 0.0) {
          FSSource = vtkShaderProgram.substitute(
            FSSource,
            '//VTK::UniformFlow::Impl',
            [
              'float cscale = length(vec2(dFdx(gl_FragCoord.z),dFdy(gl_FragCoord.z)));',
              '//VTK::UniformFlow::Impl',
            ],
            false
          ).result;
          FSSource = vtkShaderProgram.substitute(
            FSSource,
            '//VTK::Depth::Impl',
            'gl_FragDepthEXT = gl_FragCoord.z + cfactor*cscale + 0.000016*coffset;'
          ).result;
        } else {
          FSSource = vtkShaderProgram.substitute(
            FSSource,
            '//VTK::Depth::Impl',
            'gl_FragDepthEXT = gl_FragCoord.z + 0.000016*coffset;'
          ).result;
        }
      }
      if (model.openGLRenderWindow.getWebgl2()) {
        if (cp.factor !== 0.0) {
          FSSource = vtkShaderProgram.substitute(
            FSSource,
            '//VTK::UniformFlow::Impl',
            [
              'float cscale = length(vec2(dFdx(gl_FragCoord.z),dFdy(gl_FragCoord.z)));',
              '//VTK::UniformFlow::Impl',
            ],
            false
          ).result;
          FSSource = vtkShaderProgram.substitute(
            FSSource,
            '//VTK::Depth::Impl',
            'gl_FragDepth = gl_FragCoord.z + cfactor*cscale + 0.000016*coffset;'
          ).result;
        } else {
          FSSource = vtkShaderProgram.substitute(
            FSSource,
            '//VTK::Depth::Impl',
            'gl_FragDepth = gl_FragCoord.z + 0.000016*coffset;'
          ).result;
        }
      }
      shaders.Fragment = FSSource;
    }
  };

  publicAPI.replaceShaderPicking = (shaders, ren, actor) => {
    let FSSource = shaders.Fragment;
    FSSource = vtkShaderProgram.substitute(FSSource, '//VTK::Picking::Dec', [
      'uniform vec3 mapperIndex;',
      'uniform int picking;',
    ]).result;
    FSSource = vtkShaderProgram.substitute(
      FSSource,
      '//VTK::Picking::Impl',
      '  gl_FragData[0] = picking != 0 ? vec4(mapperIndex,1.0) : gl_FragData[0];'
    ).result;
    shaders.Fragment = FSSource;
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

    let needLighting = true;

    const poly = model.currentInput;

    let n =
      actor.getProperty().getInterpolation() !== Shading.FLAT
        ? poly.getPointData().getNormals()
        : null;
    if (n === null && poly.getCellData().getNormals()) {
      n = poly.getCellData().getNormals();
    }

    const haveNormals = n !== null;

    if (
      actor.getProperty().getRepresentation() === Representation.POINTS ||
      primType === primTypes.Points
    ) {
      needLighting = haveNormals;
    }

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
    const lastLightCount = model.lastBoundBO.getReferenceByName(
      'lastLightCount'
    );
    if (
      lastLightComplexity !== lightComplexity ||
      lastLightCount !== numberOfLights
    ) {
      model.lastBoundBO.set({ lastLightComplexity: lightComplexity }, true);
      model.lastBoundBO.set({ lastLightCount: numberOfLights }, true);
      needRebuild = true;
    }

    // has something changed that would require us to recreate the shader?
    // candidates are
    // property modified (representation interpolation and lighting)
    // input modified
    // light complexity changed
    if (
      model.lastHaveSeenDepthRequest !== model.haveSeenDepthRequest ||
      cellBO.getProgram() === 0 ||
      cellBO.getShaderSourceTime().getMTime() < publicAPI.getMTime() ||
      cellBO.getShaderSourceTime().getMTime() < actor.getMTime() ||
      cellBO.getShaderSourceTime().getMTime() < model.renderable.getMTime() ||
      cellBO.getShaderSourceTime().getMTime() < model.currentInput.getMTime() ||
      needRebuild
    ) {
      model.lastHaveSeenDepthRequest = model.haveSeenDepthRequest;
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
      const newShader = model.openGLRenderWindow
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
      model.openGLRenderWindow
        .getShaderCache()
        .readyShaderProgram(cellBO.getProgram());
    }

    cellBO.getVAO().bind();

    publicAPI.setMapperShaderParameters(cellBO, ren, actor);
    publicAPI.setPropertyShaderParameters(cellBO, ren, actor);
    publicAPI.setCameraShaderParameters(cellBO, ren, actor);
    publicAPI.setLightingShaderParameters(cellBO, ren, actor);

    const listCallbacks = model.renderable.getViewSpecificProperties()
      .ShadersCallbacks;
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
      let numClipPlanes = model.renderable.getNumberOfClippingPlanes();
      if (numClipPlanes > 6) {
        macro.vtkErrorMacro('OpenGL has a limit of 6 clipping planes');
        numClipPlanes = 6;
      }
      const planeEquations = [];
      for (let i = 0; i < numClipPlanes; i++) {
        const planeEquation = [];
        model.renderable.getClippingPlaneInDataCoords(
          actor.getMatrix(),
          i,
          planeEquation
        );

        for (let j = 0; j < 4; j++) {
          planeEquations.push(planeEquation[j]);
        }
      }
      cellBO.getProgram().setUniformi('numClipPlanes', numClipPlanes);
      cellBO.getProgram().setUniform4fv('clipPlanes', 6, planeEquations);
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
        const np = vec3.fromValues(lp[0], lp[1], lp[2]);
        vec3.transformMat4(np, np, viewTF);
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

  publicAPI.setCameraShaderParameters = (cellBO, ren, actor) => {
    const program = cellBO.getProgram();

    // // [WMVD]C == {world, model, view, display} coordinates
    // // E.g., WCDC == world to display coordinate transformation
    const keyMats = model.openGLCamera.getKeyMatrices(ren);
    const cam = ren.getActiveCamera();

    const camm = model.openGLCamera.getKeyMatrixTime().getMTime();
    const progm = program.getLastCameraMTime();

    if (progm !== camm) {
      if (actor.getIsIdentity()) {
        program.setUniformMatrix('MCDCMatrix', keyMats.wcdc);
        if (program.isUniformUsed('MCVCMatrix')) {
          program.setUniformMatrix('MCVCMatrix', keyMats.wcvc);
        }
        if (program.isUniformUsed('normalMatrix')) {
          program.setUniformMatrix3x3('normalMatrix', keyMats.normalMatrix);
        }
      }
      if (program.isUniformUsed('cameraParallel')) {
        program.setUniformi('cameraParallel', cam.getParallelProjection());
      }
      program.setLastCameraMTime(camm);
    }

    if (!actor.getIsIdentity()) {
      const actMats = model.openGLActor.getKeyMatrices();
      if (program.isUniformUsed('normalMatrix')) {
        const anorms = mat3.create();
        mat3.multiply(anorms, keyMats.normalMatrix, actMats.normalMatrix);
        program.setUniformMatrix3x3('normalMatrix', anorms);
      }
      mat4.identity(model.tmpMat4);
      mat4.multiply(model.tmpMat4, keyMats.wcdc, actMats.mcwc);
      program.setUniformMatrix('MCDCMatrix', model.tmpMat4);
      if (program.isUniformUsed('MCVCMatrix')) {
        mat4.multiply(model.tmpMat4, keyMats.wcvc, actMats.mcwc);
        program.setUniformMatrix('MCVCMatrix', model.tmpMat4);
      }
      // reset the cam mtime as actor modified the shader values
      program.setLastCameraMTime(0);
    }
  };

  publicAPI.setPropertyShaderParameters = (cellBO, ren, actor) => {
    const program = cellBO.getProgram();

    const ppty = actor.getProperty();

    const opacity = ppty.getOpacity();
    program.setUniformf('opacityUniform', opacity);

    const aColor = model.drawingEdges
      ? ppty.getEdgeColorByReference()
      : ppty.getAmbientColorByReference();
    program.setUniform3fArray('ambientColorUniform', aColor);
    program.setUniformf('ambient', ppty.getAmbient());

    const dColor = model.drawingEdges
      ? ppty.getEdgeColorByReference()
      : ppty.getDiffuseColorByReference();
    program.setUniform3fArray('diffuseColorUniform', dColor);
    program.setUniformf('diffuse', ppty.getDiffuse());

    // we are done unless we have lighting
    const lastLightComplexity = model.lastBoundBO.getReferenceByName(
      'lastLightComplexity'
    );
    if (lastLightComplexity < 1) {
      return;
    }
    const sColor = ppty.getSpecularColorByReference();
    program.setUniform3fArray('specularColorUniform', sColor);
    program.setUniformf('specular', ppty.getSpecular());
    program.setUniformf('specularPowerUniform', ppty.getSpecularPower());

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

    if (model.openGLRenderer.getSelector()) {
      switch (model.openGLRenderer.getSelector().getCurrentPass()) {
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

    const gl = model.context;

    const drawSurfaceWithEdges =
      actor.getProperty().getEdgeVisibility() &&
      representation === Representation.SURFACE;

    // for every primitive type
    for (let i = primTypes.Start; i < primTypes.End; i++) {
      // if there are entries
      const cabo = model.primitives[i].getCABO();
      if (cabo.getElementCount()) {
        // are we drawing edges
        model.drawingEdges =
          drawSurfaceWithEdges &&
          (i === primTypes.TrisEdges || i === primTypes.TriStripsEdges);
        publicAPI.updateShaders(model.primitives[i], ren, actor);
        const mode = publicAPI.getOpenGLMode(representation, i);
        gl.drawArrays(mode, 0, cabo.getElementCount());

        const stride =
          (mode === gl.POINTS ? 1 : 0) || (mode === gl.LINES ? 2 : 3);
        model.primitiveIDOffset += cabo.getElementCount() / stride;
      }
    }
  };

  publicAPI.getOpenGLMode = (rep, type) => {
    if (rep === Representation.POINTS || type === primTypes.Points) {
      return model.context.POINTS;
    }
    if (
      rep === Representation.WIREFRAME ||
      type === primTypes.Lines ||
      type === primTypes.TrisEdges ||
      type === primTypes.TriStripsEdges
    ) {
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
      model.openGLRenderWindow.disableCullFace();
    } else if (frontfaceCulling) {
      model.openGLRenderWindow.enableCullFace();
      gl.cullFace(gl.FRONT);
    } else {
      model.openGLRenderWindow.enableCullFace();
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
      tex.setOpenGLRenderWindow(model.openGLRenderWindow);

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
        haveCellScalars: model.haveCellScalars,
        haveCellNormals: model.haveCellNormals,
      };
      options.cellOffset += model.primitives[primTypes.Points]
        .getCABO()
        .createVBO(poly.getVerts(), 'verts', representation, options);
      options.cellOffset += model.primitives[primTypes.Lines]
        .getCABO()
        .createVBO(poly.getLines(), 'lines', representation, options);
      options.cellOffset += model.primitives[primTypes.Tris]
        .getCABO()
        .createVBO(poly.getPolys(), 'polys', representation, options);
      options.cellOffset += model.primitives[primTypes.TriStrips]
        .getCABO()
        .createVBO(poly.getStrips(), 'strips', representation, options);

      const drawSurfaceWithEdges =
        actor.getProperty().getEdgeVisibility() &&
        representation === Representation.SURFACE;

      // if we have edge visibility build the edge VBOs
      if (drawSurfaceWithEdges) {
        model.primitives[primTypes.TrisEdges]
          .getCABO()
          .createVBO(poly.getPolys(), 'polys', Representation.WIREFRAME, {
            points,
            normals: n,
            tcoords: null,
            colors: null,
            cellOffset: 0,
            haveCellScalars: false,
            haveCellNormals: false,
          });
        model.primitives[primTypes.TriStripsEdges]
          .getCABO()
          .createVBO(poly.getStrips(), 'strips', Representation.WIREFRAME, {
            points,
            normals: n,
            tcoords: null,
            colors: null,
            cellOffset: 0,
            haveCellScalars: false,
            haveCellNormals: false,
          });
      } else {
        // otherwise free them
        model.primitives[primTypes.TrisEdges].releaseGraphicsResources(
          model.openGLRenderWindow
        );
        model.primitives[primTypes.TriStripsEdges].releaseGraphicsResources(
          model.openGLRenderWindow
        );
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
};

// ----------------------------------------------------------------------------

export function extend(publicAPI, model, initialValues = {}) {
  Object.assign(model, DEFAULT_VALUES, initialValues);

  // Inheritance
  vtkViewNode.extend(publicAPI, model, initialValues);

  model.primitives = [];
  model.primTypes = primTypes;

  model.tmpMat4 = mat4.create();

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

  // Object methods
  vtkOpenGLPolyDataMapper(publicAPI, model);
}

// ----------------------------------------------------------------------------

export const newInstance = macro.newInstance(extend, 'vtkOpenGLPolyDataMapper');

// ----------------------------------------------------------------------------

export default { newInstance, extend };
