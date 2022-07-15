import { mat3, mat4 } from 'gl-matrix';

import * as macro from 'vtk.js/Sources/macros';
import vtkMapper from 'vtk.js/Sources/Rendering/Core/Mapper';
import vtkProp from 'vtk.js/Sources/Rendering/Core/Prop';
import vtkProperty from 'vtk.js/Sources/Rendering/Core/Property';
import vtkProperty2D from 'vtk.js/Sources/Rendering/Core/Property2D';
import vtkTexture from 'vtk.js/Sources/Rendering/Core/Texture';
import vtkWebGPUBufferManager from 'vtk.js/Sources/Rendering/WebGPU/BufferManager';
import vtkWebGPUShaderCache from 'vtk.js/Sources/Rendering/WebGPU/ShaderCache';
import vtkWebGPUUniformBuffer from 'vtk.js/Sources/Rendering/WebGPU/UniformBuffer';
import vtkWebGPUSimpleMapper from 'vtk.js/Sources/Rendering/WebGPU/SimpleMapper';
import vtkWebGPUTypes from 'vtk.js/Sources/Rendering/WebGPU/Types';

const { BufferUsage, PrimitiveTypes } = vtkWebGPUBufferManager;
const { Representation } = vtkProperty;
const { ScalarMode } = vtkMapper;
const { CoordinateSystem } = vtkProp;
const { DisplayLocation } = vtkProperty2D;

const vtkWebGPUPolyDataVS = `
//VTK::Renderer::Dec

//VTK::Color::Dec

//VTK::Normal::Dec

//VTK::TCoord::Dec

//VTK::Select::Dec

//VTK::Mapper::Dec

//VTK::IOStructs::Dec

@vertex
fn main(
//VTK::IOStructs::Input
)
//VTK::IOStructs::Output
{
  var output : vertexOutput;

  var vertex: vec4<f32> = vertexBC;

  //VTK::Color::Impl

  //VTK::Normal::Impl

  //VTK::TCoord::Impl

  //VTK::Select::Impl

  //VTK::Position::Impl

  return output;
}
`;

const vtkWebGPUPolyDataFS = `
struct PBRData {
  diffuse: vec3<f32>,
  specular: vec3<f32>,
}

// Dot product with the max already in it
fn mdot(a: vec3<f32>, b: vec3<f32>) -> f32 {
  return max(0.0, dot(a, b));
}
// Dot product with a max in it that does not allow for negative values
// Physically based rendering is accurate as long as normals are accurate,
// however this is pretty often not the case. In order to prevent negative
// values from ruining light calculations and creating zones of zero light,
// this remapping is used, which smoothly clamps the dot product between
// zero and one while still maintaining a good amount of accuracy.
fn cdot(a: vec3<f32>, b: vec3<f32>) -> f32 {
  var d: f32 = max(0.0, dot(a, b));
  d = pow((d + 1) / 2.0, 2.6);
  return d;
}

// Lambertian diffuse model
fn lambertDiffuse(base: vec3<f32>, N: vec3<f32>, L: vec3<f32>) -> vec3<f32> {
  var pi: f32 = 3.14159265359; 
  var NdotL: f32 = mdot(N, L);
  NdotL = pow(NdotL, 1.5);
  return (base/pi)*NdotL;
}

// Yasuhiro Fujii improvement on the Oren-Nayar model
// https://mimosa-pudica.net/improved-oren-nayar.html
// p is surface color, o is roughness
fn fujiiOrenNayar(p: vec3<f32>, o: f32, N: vec3<f32>, L: vec3<f32>, V: vec3<f32>) -> vec3<f32> {
  var invpi: f32 = 0.31830988618; // 1/pi

  var o2 = o*o;
  var NdotL: f32 = mdot(N, L);
  NdotL = pow(NdotL, 1.5); // Less physically accurate, but hides the "seams" between lights better

  var NdotV: f32 = mdot(N, V);
  var LdotV: f32 = mdot(L, V);

  var s: f32 = LdotV - NdotL*NdotV;
  var t: f32 = mix(1, max(NdotL, NdotV), step(0, s)); // Mix with step is the equivalent of an if statement
  var A: vec3<f32> = 0.5*(o2 / (o2 + 0.33)) + 0.17*p*(o2 / (o2 + 0.13));
  A = invpi*(1 - A);
  var B: f32 = 0.45*(o2 / (o2 + 0.09));
  B = invpi*B;

  return p*NdotL*(A + B*(s/t));
}

// Fresnel portion of BRDF (IOR only, simplified)
fn schlickFresnelIOR(V: vec3<f32>, N: vec3<f32>, ior: f32, k: f32) -> f32 {
  var NdotV: f32 = mdot(V, N);
  var F0: f32 = (pow((ior - 1.0), 2) + k*k) / (pow((ior + 1.0), 2) + k*k); // This takes into account the roughness, which the other one does not
  return F0 + (1 - F0) * pow((1-NdotV), 5); 
}

// Fresnel portion of BRDF (Color ior, better)
fn schlickFresnelRGB(V: vec3<f32>, N: vec3<f32>, F0: vec3<f32>) -> vec3<f32> {
  var NdotV: f32 = mdot(V, N);
  return F0 + (1 - F0) * pow((1-NdotV), 5); 
}

// Normal portion of BRDF
// https://learnopengl.com/PBR/Theory
// Trowbridge-Reitz GGX functions: normal, halfway, roughness^2
fn trGGX(N: vec3<f32>, H: vec3<f32>, a: f32) -> f32 {
  var pi: f32 = 3.14159265359; 

  var a2: f32 = a*a;
  var NdotH = mdot(N, H);
  var NdotH2 = NdotH*NdotH;
  
  var denom: f32 = NdotH2 * (a2 - 1.0) + 1.0;

  return a2 / max((pi*denom*denom), 0.000001);
}

// A VERY bad approximation of anisotropy. Real anisotropic calculations require tangent and bitangent
fn anisotrophicTrGGX(N: vec3<f32>, H: vec3<f32>, O: vec3<f32>, s: f32, a: f32) -> f32 {
  var Op: vec3<f32> = (rendererUBO.WCVCNormals * vec4<f32>(normalize(O) * s, 0.)).xyz;

  var ggx1: f32 = trGGX(N + Op*s, H, a);
  var ggx2: f32 = trGGX(N - Op*s, H, a);
  return (0.5 * ggx1 + 0.5 * ggx2);
}

// Geometry portion of BRDF
fn schlickGGX(N: vec3<f32>, X: vec3<f32>, k: f32) -> f32 {
  var NdotX = cdot(N, X);
  return NdotX / max(0.000001, (NdotX*(1-k) + k));
}

fn smithSurfaceRoughness(N: vec3<f32>, V: vec3<f32>, L: vec3<f32>, k: f32) -> f32 {
  var ggx1: f32 = min(1, schlickGGX(N, V, k));
  var ggx2: f32 = min(1, schlickGGX(N, L, k));
  return ggx1*ggx2;
}

// BRDF Combination
fn cookTorrance(D: f32, F: f32, G: f32, N: vec3<f32>, V: vec3<f32>, L: vec3<f32>) -> f32 {
  var num: f32 = D*F*G;
  var denom: f32 = 4*cdot(V, N)*cdot(L, N);

  return num / max(denom, 0.000001);
}

// Different lighting calculations for different light sources
fn calcDirectionalLight(N: vec3<f32>, V: vec3<f32>, ior: f32, roughness: f32, metallic: f32, direction: vec3<f32>, color: vec3<f32>, base: vec3<f32>) -> PBRData {  
  var L: vec3<f32> = normalize(direction); // Light Vector
  var H: vec3<f32> = normalize(L + V); // Halfway Vector

  var alpha = roughness*roughness;
  var k: f32 = alpha*alpha / 2;

  var D: f32 = trGGX(N, H, alpha); // Distribution
  // var F: f32 = schlickFresnelIOR(V, N, ior, k); // Fresnel
  var G: f32 = smithSurfaceRoughness(N, V, L, k); // Geometry

  var brdf: f32 = cookTorrance(D, 1, G, N, V, L); // Fresnel term is replaced with 1 because it is added later
  var incoming: vec3<f32> = color;
  var angle: f32 = mdot(L, N);
  angle = pow(angle, 1.5);

  var specular: vec3<f32> = brdf*incoming*angle;
  // Oren-Nayar gives a clay-like effect when fully rough which some people may not want, so it might be better to give a separate
  // control property for the diffuse vs specular roughness
  var diffuse: vec3<f32> = incoming*fujiiOrenNayar(base, roughness, N, L, V); 
  // Stores the specular and diffuse separately to allow for finer post processing
  var out = PBRData(diffuse, specular);
  
  return out; // Returns angle along with color of light so the final color can be multiplied by angle as well (creates black areas)
}

// TODO: find some way to reduce the number of arguments going in here
fn calcPointLight(N: vec3<f32>, V: vec3<f32>, fragPos: vec3<f32>, ior: f32, roughness: f32, metallic: f32, position: vec3<f32>, color: vec3<f32>, base: vec3<f32>) -> PBRData {
  var L: vec3<f32> = normalize(position - fragPos); // Light Vector
  var H: vec3<f32> = normalize(L + V); // Halfway Vector
  var dist = distance(position, fragPos);

  var alpha = roughness*roughness;
  var k: f32 = alpha*alpha / 2; // could also be pow(alpha + 1.0, 2) / 8

  var D: f32 = trGGX(N, H, alpha); // Distribution
  // var F: f32 = schlickFresnelIOR(V, N, ior, k); // Fresnel
  var G: f32 = smithSurfaceRoughness(N, V, L, k); // Geometry

  var brdf: f32 = cookTorrance(D, 1, G, N, V, L);  
  var incoming: vec3<f32> = color * (1. / (dist*dist));
  var angle: f32 = mdot(L, N);
  angle = pow(angle, 1.5); // Smoothing factor makes it less accurate, but reduces ugly "seams" bewteen light sources

  var specular: vec3<f32> = brdf*incoming*angle;
  var diffuse: vec3<f32> = incoming*fujiiOrenNayar(base, roughness, N, L, V);

  // Stores the specular and diffuse separately to allow for finer post processing
  // Could also be done (propably more properly) with a struct
  var out = PBRData(diffuse, specular);
  
  return out; // Returns angle along with color of light so the final color can be multiplied by angle as well (creates black areas)
}

// For a reason unknown to me, spheres dont seem to behave propperly with head-on spot lights
fn calcSpotLight(N: vec3<f32>, V: vec3<f32>, fragPos: vec3<f32>, ior: f32, roughness: f32, metallic: f32, position: vec3<f32>, direction: vec3<f32>, cones: vec2<f32>, color: vec3<f32>, base: vec3<f32>) -> PBRData {
  var L: vec3<f32> = normalize(position - fragPos);
  var H: vec3<f32> = normalize(L + V); // Halfway Vector
  var dist = distance(position, fragPos);

  var alpha = roughness*roughness;
  var k: f32 = alpha*alpha / 2; // could also be pow(alpha + 1.0, 2) / 8

  var D: f32 = trGGX(N, H, alpha); // Distribution
  // var F: f32 = schlickFresnelIOR(V, N, ior, k); // Fresnel
  var G: f32 = smithSurfaceRoughness(N, V, L, k); // Geometry

  var brdf: f32 = cookTorrance(D, 1, G, N, V, L);  
  
  // Cones.x is the inner phi and cones.y is the outer phi
  var theta: f32 = mdot(normalize(direction), L);
  var epsilon: f32 = cones.x - cones.y;
  var intensity: f32 = (theta - cones.y) / epsilon;
  intensity = clamp(intensity, 0.0, 1.0);
  intensity /= dist*dist;

  var incoming: vec3<f32> = color * intensity;

  var angle: f32 = mdot(L, N);
  angle = pow(angle, 1.5); // Smoothing factor makes it less accurate, but reduces ugly "seams" bewteen light sources

  var specular: vec3<f32> = brdf*incoming*angle;
  var diffuse: vec3<f32> = incoming*fujiiOrenNayar(base, roughness, N, L, V);

  // Stores the specular and diffuse separately to allow for finer post processing
  // Could also be done (propably more properly) with a struct
  var out = PBRData(diffuse, specular);
  
  return out; // Returns angle along with color of light so the final color can be multiplied by angle as well (creates black areas)
}

// Environment mapping stuff
// Takes in a vector and converts it to an equivalent coordinate in a rectilinear texture. Should be replaced with cubemaps at some point
fn vecToRectCoord(dir: vec3<f32>) -> vec2<f32> {
  var tau: f32 = 6.28318530718;
  var pi: f32 = 3.14159265359;
  var out: vec2<f32> = vec2<f32>(0.0);

  out.x = atan2(dir.z, dir.x) / tau;
  out.x += 0.5;

  var phix: f32 = length(vec2(dir.x, dir.z));
  out.y = atan2(dir.y, phix) / pi + 0.5;

  return out;
}

//VTK::Renderer::Dec

//VTK::Color::Dec

//VTK::TCoord::Dec

// optional surface normal declaration
//VTK::Normal::Dec

//VTK::Select::Dec

//VTK::RenderEncoder::Dec

//VTK::Mapper::Dec

//VTK::IOStructs::Dec

@fragment
fn main(
//VTK::IOStructs::Input
)
//VTK::IOStructs::Output
{
  var output : fragmentOutput;

  // Temporary ambient, diffuse, and opacity
  var ambientColor: vec4<f32> = mapperUBO.AmbientColor;
  var diffuseColor: vec4<f32> = mapperUBO.DiffuseColor;
  var opacity: f32 = mapperUBO.Opacity;

  // This should be declared somewhere else
  var _diffuseMap: vec4<f32> = vec4<f32>(1);
  var _roughnessMap: vec4<f32> = vec4<f32>(1);
  var _metallicMap: vec4<f32> = vec4<f32>(1);
  var _normalMap: vec4<f32> = vec4<f32>(0, 0, 1, 0); // normal map was setting off the normal vector detection in fragment
  var _ambientOcclusionMap: vec4<f32> = vec4<f32>(1);
  var _emissionMap: vec4<f32> = vec4<f32>(0);

  //VTK::Color::Impl

  //VTK::TCoord::Impl

  //VTK::Normal::Impl

  var computedColor: vec4<f32> = vec4<f32>(diffuseColor.rgb, 1.0);

  //VTK::Light::Impl

  //VTK::Select::Impl

  if (computedColor.a == 0.0) { discard; };

  //VTK::Position::Impl

  //VTK::RenderEncoder::Impl

  return output;
}
`;

function isEdges(hash) {
  // edge pipelines have "edge" in them
  return hash.indexOf('edge') >= 0;
}

// ----------------------------------------------------------------------------
// vtkWebGPUCellArrayMapper methods
// ----------------------------------------------------------------------------

function vtkWebGPUCellArrayMapper(publicAPI, model) {
  // Set our className
  model.classHierarchy.push('vtkWebGPUCellArrayMapper');

  publicAPI.buildPass = (prepass) => {
    if (prepass) {
      if (model.is2D) {
        model.WebGPUActor =
          publicAPI.getFirstAncestorOfType('vtkWebGPUActor2D');
        model.forceZValue = true;
      } else {
        model.WebGPUActor = publicAPI.getFirstAncestorOfType('vtkWebGPUActor');
        model.forceZValue = false;
      }
      model.coordinateSystem =
        model.WebGPUActor.getRenderable().getCoordinateSystem();
      model.useRendererMatrix =
        model.coordinateSystem !== CoordinateSystem.DISPLAY;
      model.WebGPURenderer =
        model.WebGPUActor.getFirstAncestorOfType('vtkWebGPURenderer');
      model.WebGPURenderWindow = model.WebGPURenderer.getParent();
      model.device = model.WebGPURenderWindow.getDevice();
    }
  };

  // Renders myself
  publicAPI.translucentPass = (prepass) => {
    if (prepass) {
      publicAPI.prepareToDraw(model.WebGPURenderer.getRenderEncoder());
      model.renderEncoder.registerDrawCallback(model.pipeline, publicAPI.draw);
    }
  };

  publicAPI.opaquePass = (prepass) => {
    if (prepass) {
      publicAPI.prepareToDraw(model.WebGPURenderer.getRenderEncoder());
      model.renderEncoder.registerDrawCallback(model.pipeline, publicAPI.draw);
    }
  };

  publicAPI.updateUBO = () => {
    // make sure the data is up to date
    const actor = model.WebGPUActor.getRenderable();
    const ppty = actor.getProperty();
    const utime = model.UBO.getSendTime();

    if (
      publicAPI.getMTime() > utime ||
      ppty.getMTime() > utime ||
      model.renderable.getMTime() > utime
    ) {
      // Matricies
      const keyMats = model.WebGPUActor.getKeyMatrices(model.WebGPURenderer);
      model.UBO.setArray('BCWCMatrix', keyMats.bcwc);
      model.UBO.setArray('BCSCMatrix', keyMats.bcsc);
      model.UBO.setArray('MCWCNormals', keyMats.normalMatrix);

      if (model.is2D) {
        model.UBO.setValue(
          'ZValue',
          model.WebGPUActor.getRenderable()
            .getProperty()
            .getDisplayLocation() === DisplayLocation.FOREGROUND
            ? 1.0
            : 0.0
        );

        const aColor = ppty.getColorByReference();
        model.UBO.setValue('AmbientIntensity', 1.0);
        model.UBO.setArray('DiffuseColor', [
          aColor[0],
          aColor[1],
          aColor[2],
          1.0,
        ]);
        model.UBO.setValue('DiffuseIntensity', 0.0);
        model.UBO.setValue('SpecularIntensity', 0.0);
      } else {
        // Base Colors
        let aColor = ppty.getAmbientColorByReference();
        model.UBO.setValue('AmbientIntensity', ppty.getAmbient());
        model.UBO.setArray('AmbientColor', [
          aColor[0],
          aColor[1],
          aColor[2],
          1.0,
        ]);
        model.UBO.setValue('DiffuseIntensity', ppty.getDiffuse());
        aColor = ppty.getDiffuseColorByReference();
        model.UBO.setArray('DiffuseColor', [
          aColor[0],
          aColor[1],
          aColor[2],
          1.0,
        ]);
        // Roughness
        model.UBO.setValue('Roughness', ppty.getRoughness());
        model.UBO.setValue('BaseIOR', ppty.getBaseIOR());
        // Metallic
        model.UBO.setValue('Metallic', ppty.getMetallic());
        // Normal
        model.UBO.setValue('NormalStrength', ppty.getNormalStrength());
        // Emission
        model.UBO.setValue('Emission', ppty.getEmission());
        // Specular
        model.UBO.setValue('SpecularIntensity', ppty.getSpecular());
        aColor = ppty.getSpecularColorByReference();
        model.UBO.setArray('SpecularColor', [
          aColor[0],
          aColor[1],
          aColor[2],
          1.0,
        ]);
      }
      // Edge and line rendering
      const aColor = ppty.getEdgeColorByReference?.();
      if (aColor) {
        model.UBO.setArray('EdgeColor', [aColor[0], aColor[1], aColor[2], 1.0]);
      }
      model.UBO.setValue('LineWidth', ppty.getLineWidth());
      model.UBO.setValue('Opacity', ppty.getOpacity());
      model.UBO.setValue('PropID', model.WebGPUActor.getPropID());
      const device = model.WebGPURenderWindow.getDevice();
      model.UBO.sendIfNeeded(device);
    }
  };

  publicAPI.haveWideLines = () => {
    const actor = model.WebGPUActor.getRenderable();
    const representation = actor.getProperty().getRepresentation();
    if (actor.getProperty().getLineWidth() <= 1.0) {
      return false;
    }
    if (model.primitiveType === PrimitiveTypes.Verts) {
      return false;
    }
    if (
      model.primitiveType === PrimitiveTypes.Triangles ||
      model.primitiveType === PrimitiveTypes.TriangleStrips
    ) {
      return representation === Representation.WIREFRAME;
    }
    return true;
  };

  publicAPI.replaceShaderPosition = (hash, pipeline, vertexInput) => {
    const vDesc = pipeline.getShaderDescription('vertex');
    vDesc.addBuiltinOutput('vec4<f32>', '@builtin(position) Position');
    if (!vDesc.hasOutput('vertexVC')) vDesc.addOutput('vec4<f32>', 'vertexVC');
    let code = vDesc.getCode();
    if (model.useRendererMatrix) {
      code = vtkWebGPUShaderCache.substitute(code, '//VTK::Position::Impl', [
        '    var pCoord: vec4<f32> = rendererUBO.SCPCMatrix*mapperUBO.BCSCMatrix*vertexBC;',
        '    output.vertexVC = rendererUBO.SCVCMatrix * mapperUBO.BCSCMatrix * vec4<f32>(vertexBC.xyz, 1.0);',
        '//VTK::Position::Impl',
      ]).result;
      if (model.forceZValue) {
        code = vtkWebGPUShaderCache.substitute(code, '//VTK::Position::Impl', [
          'pCoord = vec4<f32>(pCoord.xyz/pCoord.w, 1.0);',
          'pCoord.z = mapperUBO.ZValue;',
          '//VTK::Position::Impl',
        ]).result;
      }
    } else {
      code = vtkWebGPUShaderCache.substitute(code, '//VTK::Position::Impl', [
        '    var pCoord: vec4<f32> = mapperUBO.BCSCMatrix*vertexBC;',
        '    pCoord.x = 2.0* pCoord.x / rendererUBO.viewportSize.x - 1.0;',
        '    pCoord.y = 2.0* pCoord.y / rendererUBO.viewportSize.y - 1.0;',
        '    pCoord.z = 0.5 - 0.5 * pCoord.z;',
        '//VTK::Position::Impl',
      ]).result;
      if (model.forceZValue) {
        code = vtkWebGPUShaderCache.substitute(code, '//VTK::Position::Impl', [
          '    pCoord.z = mapperUBO.ZValue;',
          '//VTK::Position::Impl',
        ]).result;
      }
    }
    if (publicAPI.haveWideLines()) {
      vDesc.addBuiltinInput('u32', '@builtin(instance_index) instanceIndex');
      // widen the edge
      code = vtkWebGPUShaderCache.substitute(code, '//VTK::Position::Impl', [
        '    var tmpPos: vec4<f32> = pCoord;',
        '    var numSteps: f32 = ceil(mapperUBO.LineWidth - 1.0);',
        '    var offset: f32 = (mapperUBO.LineWidth - 1.0) * (f32(input.instanceIndex / 2u) - numSteps/2.0) / numSteps;',
        '    var tmpPos2: vec3<f32> = tmpPos.xyz / tmpPos.w;',
        '    tmpPos2.x = tmpPos2.x + 2.0 * (f32(input.instanceIndex) % 2.0) * offset / rendererUBO.viewportSize.x;',
        '    tmpPos2.y = tmpPos2.y + 2.0 * (f32(input.instanceIndex + 1u) % 2.0) * offset / rendererUBO.viewportSize.y;',
        '    tmpPos2.z = min(1.0, tmpPos2.z + 0.00001);', // could become a setting
        '    pCoord = vec4<f32>(tmpPos2.xyz * tmpPos.w, tmpPos.w);',
        '//VTK::Position::Impl',
      ]).result;
    }
    code = vtkWebGPUShaderCache.substitute(code, '//VTK::Position::Impl', [
      '    output.Position = pCoord;',
    ]).result;

    vDesc.setCode(code);
  };
  model.shaderReplacements.set(
    'replaceShaderPosition',
    publicAPI.replaceShaderPosition
  );

  publicAPI.replaceShaderNormal = (hash, pipeline, vertexInput) => {
    const normalBuffer = vertexInput.getBuffer('normalMC');
    const actor = model.WebGPUActor.getRenderable();

    if (normalBuffer) {
      const vDesc = pipeline.getShaderDescription('vertex');

      if (!vDesc.hasOutput('normalVC')) {
        vDesc.addOutput(
          'vec3<f32>',
          'normalVC',
          normalBuffer.getArrayInformation()[0].interpolation
        );
      }
      if (!vDesc.hasOutput('tangentVC')) {
        vDesc.addOutput(
          'vec3<f32>',
          'tangentVC',
          normalBuffer.getArrayInformation()[0].interpolation
        );
      }
      if (!vDesc.hasOutput('bitangentVC')) {
        vDesc.addOutput(
          'vec3<f32>',
          'bitangentVC',
          normalBuffer.getArrayInformation()[0].interpolation
        );
      }

      let code = vDesc.getCode();
      code = vtkWebGPUShaderCache.substitute(code, '//VTK::Normal::Impl', [
        '  output.normalVC = normalize((rendererUBO.WCVCNormals * mapperUBO.MCWCNormals * normalMC).xyz);',
        // This is just an approximation, but it happens to work extremely well
        // It only works well for normals that are head on and not super angled though
        // Definitely needs to be replaced
        '  var c1: vec3<f32> = cross(output.normalVC, vec3<f32>(0, 0, 1));',
        '  var c2: vec3<f32> = cross(output.normalVC, vec3<f32>(0, 1, 0));',
        '  var tangent: vec3<f32> = mix(c1, c2, distance(c1, c2));',
        '  output.tangentVC = normalize(tangent);',
        '  output.bitangentVC = normalize(cross(output.normalVC, tangent));',
      ]).result;

      vDesc.setCode(code);

      const fDesc = pipeline.getShaderDescription('fragment');
      code = fDesc.getCode();

      if (actor.getProperty().getNormalTexture()) {
        code = vtkWebGPUShaderCache.substitute(code, '//VTK::Normal::Impl', [
          '  var normal: vec3<f32> = input.normalVC;',
          '  if (!input.frontFacing) { normal = -normal; }',
          '  var tangent: vec3<f32> = input.tangentVC;',
          '  var bitangent: vec3<f32> = input.bitangentVC;',
          '  var TCVCMatrix: mat3x3<f32> = mat3x3<f32>(',
          '    tangent.x, bitangent.x, normal.x,',
          '    tangent.y, bitangent.y, normal.y,',
          '    tangent.z, bitangent.z, normal.z,',
          '  );',
          '  var mappedNormal: vec3<f32> = TCVCMatrix * (_normalMap.xyz * 2 - 1);',
          '  normal = mix(normal, mappedNormal, mapperUBO.NormalStrength);',
          '  normal = normalize(normal);',
        ]).result;
      } else {
        code = vtkWebGPUShaderCache.substitute(code, '//VTK::Normal::Impl', [
          '  var normal: vec3<f32> = input.normalVC;',
          '  if (!input.frontFacing) { normal = -normal; }',
          '  normal = normalize(normal);',
        ]).result;
      }
      fDesc.setCode(code);
    }
  };
  model.shaderReplacements.set(
    'replaceShaderNormal',
    publicAPI.replaceShaderNormal
  );

  // we only apply lighting when there is a "var normal" declaration in the
  // fragment shader code. That is the lighting trigger.
  publicAPI.replaceShaderLight = (hash, pipeline, vertexInput) => {
    if (hash.includes('sel')) return;
    const vDesc = pipeline.getShaderDescription('vertex');
    if (!vDesc.hasOutput('vertexVC')) vDesc.addOutput('vec4<f32>', 'vertexVC');

    const renderer = model.WebGPURenderer.getRenderable();

    const fDesc = pipeline.getShaderDescription('fragment');
    let code = fDesc.getCode();

    // Code that runs if the fragment shader includes normals
    if (
      code.includes('var normal:') &&
      model.useRendererMatrix &&
      !isEdges(hash) &&
      !model.is2D &&
      !hash.includes('sel')
    ) {
      const lightingCode = [
        // Constants
        '  var pi: f32 = 3.14159265359;',
        // Vectors needed for light calculations
        '  var fragPos: vec3<f32> = vec3<f32>(input.vertexVC.xyz);',
        '  var V: vec3<f32> = mix(normalize(-fragPos), vec3<f32>(0, 0, 1), f32(rendererUBO.cameraParallel)); // View Vector',
        // Values needed for light calculations
        '  var baseColor: vec3<f32> = _diffuseMap.rgb * diffuseColor.rgb;',
        '  var roughness: f32 = max(0.000001, mapperUBO.Roughness * _roughnessMap.r);', // Need to have a different way of sampling greyscale values aside from .r
        '  var metallic: f32 = mapperUBO.Metallic * _metallicMap.r;',
        '  var alpha: f32 = roughness*roughness;',
        '  var ior: f32 = mapperUBO.BaseIOR;',
        '  var k: f32 = alpha*alpha / 2;',
        // Split diffuse and specular components
        '  var diffuse: vec3<f32> = vec3<f32>(0.);',
        '  var specular: vec3<f32> = vec3<f32>(0.);',
        '  var emission: vec3<f32> = _emissionMap.rgb * mapperUBO.Emission;',
        // Summing diffuse and specular components of directional lights
        '  {',
        '    var i: i32 = 0;',
        '    loop {',
        '      if !(i < rendererUBO.LightCount) { break; }',
        '      switch (i32(rendererLightSSBO.values[i].LightData.x)) {',
        '         // Point Light',
        '         case 0 {',
        '           var color: vec3<f32> = rendererLightSSBO.values[i].LightColor.rgb * rendererLightSSBO.values[i].LightColor.w;',
        '           var pos: vec3<f32> = (rendererLightSSBO.values[i].LightPos).xyz;',
        '           var calculated: PBRData = calcPointLight(normal, V, fragPos, ior, roughness, metallic, pos, color, baseColor);',
        '           diffuse += max(vec3<f32>(0), calculated.diffuse);',
        '           specular += max(vec3<f32>(0), calculated.specular);',
        '          }',
        '         // Directional light',
        '         case 1 {',
        '           var dir: vec3<f32> = (rendererUBO.WCVCNormals * vec4<f32>(normalize(rendererLightSSBO.values[i].LightDir.xyz), 0.)).xyz;',
        '           dir = normalize(dir);',
        '           var color: vec3<f32> = rendererLightSSBO.values[i].LightColor.rgb * rendererLightSSBO.values[i].LightColor.w;',
        '           var calculated: PBRData = calcDirectionalLight(normal, V, ior, roughness, metallic, dir, color, baseColor); // diffuseColor.rgb needs to be fixed with a more dynamic diffuse color',
        '           diffuse += max(vec3<f32>(0), calculated.diffuse);',
        '           specular += max(vec3<f32>(0), calculated.specular);',
        '         }',
        '         // Spot Light',
        '         case 2 {',
        '           var color: vec3<f32> = rendererLightSSBO.values[i].LightColor.rgb * rendererLightSSBO.values[i].LightColor.w;',
        '           var pos: vec3<f32> = (rendererLightSSBO.values[i].LightPos).xyz;',
        '           var dir: vec3<f32> = (rendererUBO.WCVCNormals * vec4<f32>(normalize(rendererLightSSBO.values[i].LightDir.xyz), 0.)).xyz;',
        '           dir = normalize(dir);',
        '           var cones: vec2<f32> = vec2<f32>(rendererLightSSBO.values[i].LightData.y, rendererLightSSBO.values[i].LightData.z);',
        '           var calculated: PBRData = calcSpotLight(normal, V, fragPos, ior, roughness, metallic, pos, dir, cones, color, baseColor);',
        '           diffuse += max(vec3<f32>(0), calculated.diffuse);',
        '           specular += max(vec3<f32>(0), calculated.specular);',
        '         }',
        '         default { continue; }',
        '       }',
        '      continuing { i++; }',
        '    }',
        '  }',
        // Final variables for combining specular and diffuse
        '  var fresnel: f32 = schlickFresnelIOR(V, normal, ior, k); // Fresnel',
        '  fresnel = min(1, fresnel);',
        '  // This could be controlled with its own variable (that isnt base color) for better artistic control',
        '  var fresnelMetallic: vec3<f32> = schlickFresnelRGB(V, normal, baseColor); // Fresnel for metal, takes color into account',
        '  var kS: vec3<f32> = mix(vec3<f32>(fresnel), fresnelMetallic, metallic);',
        '  kS = min(vec3<f32>(1), kS);',
        '  var kD: vec3<f32> = (1.0 - kS) * (1.0 - metallic);',
        '  var PBR: vec3<f32> = mapperUBO.DiffuseIntensity*kD*diffuse + kS*specular;',
        '  PBR += emission;',
        '  computedColor = vec4<f32>(PBR, mapperUBO.Opacity);',
      ];
      if (renderer.getEnvironmentTexture()?.getImageLoaded()) {
        lightingCode.push(
          '  // To get diffuse IBL, the texture is sampled with normals in worldspace',
          '  var diffuseIBLCoords: vec3<f32> = (transpose(rendererUBO.WCVCNormals) * vec4<f32>(normal, 1.)).xyz;',
          '  var diffuseCoords: vec2<f32> = vecToRectCoord(diffuseIBLCoords);',
          '  // To get specular IBL, the texture is sampled as the worldspace reflection between the normal and view vectors',
          '  // Reflections are first calculated in viewspace, then converted to worldspace to sample the environment',
          '  var VreflN: vec3<f32> = normalize(reflect(-V, normal));',
          '  var reflectionIBLCoords = (transpose(rendererUBO.WCVCNormals) * vec4<f32>(VreflN, 1.)).xyz;',
          '  var specularCoords: vec2<f32> = vecToRectCoord(reflectionIBLCoords);',
          '  var diffuseIBL = textureSampleLevel(EnvironmentTexture, EnvironmentTextureSampler, diffuseCoords, rendererUBO.MaxEnvironmentMipLevel);',
          // Level multiplier should be set by UBO
          '  var level = roughness * rendererUBO.MaxEnvironmentMipLevel;',
          '  var specularIBL = textureSampleLevel(EnvironmentTexture, EnvironmentTextureSampler, specularCoords, level);', // Manual mip smoothing since not all formats support smooth level sampling
          '  var specularIBLContribution: vec3<f32> = specularIBL.rgb*rendererUBO.BackgroundSpecularStrength;',
          '  computedColor += vec4<f32>(specularIBLContribution*kS, 0);',
          '  var diffuseIBLContribution: vec3<f32> = diffuseIBL.rgb*rendererUBO.BackgroundDiffuseStrength;',
          '  diffuseIBLContribution *= baseColor * _ambientOcclusionMap.rgb;', // Multipy by baseColor may be changed
          '  computedColor += vec4<f32>(diffuseIBLContribution*kD, 0);'
        );
      }
      code = vtkWebGPUShaderCache.substitute(
        code,
        '//VTK::Light::Impl',
        lightingCode
      ).result;
      fDesc.setCode(code);
      // If theres no normals, just set the specular color to be flat
    } else {
      code = vtkWebGPUShaderCache.substitute(code, '//VTK::Light::Impl', [
        '  var diffuse: vec3<f32> = diffuseColor.rgb;',
        '  var specular: vec3<f32> = mapperUBO.SpecularColor.rgb * mapperUBO.SpecularColor.a;',
        '  computedColor = vec4<f32>(diffuse * _diffuseMap.rgb, mapperUBO.Opacity);',
      ]).result;
      fDesc.setCode(code);
    }
  };
  model.shaderReplacements.set(
    'replaceShaderLight',
    publicAPI.replaceShaderLight
  );

  publicAPI.replaceShaderColor = (hash, pipeline, vertexInput) => {
    // By default, set the colors to be flat
    if (isEdges(hash)) {
      const fDesc = pipeline.getShaderDescription('fragment');
      let code = fDesc.getCode();
      code = vtkWebGPUShaderCache.substitute(code, '//VTK::Color::Impl', [
        'ambientColor = mapperUBO.EdgeColor;',
        'diffuseColor = mapperUBO.EdgeColor;',
      ]).result;
      fDesc.setCode(code);
      return;
    }

    // If there's no vertex color buffer return the shader as is
    const colorBuffer = vertexInput.getBuffer('colorVI');
    if (!colorBuffer) return;

    // Modifies the vertex shader to include the vertex colors and interpolation in the outputs
    const vDesc = pipeline.getShaderDescription('vertex');
    vDesc.addOutput(
      'vec4<f32>',
      'color',
      colorBuffer.getArrayInformation()[0].interpolation
    );
    let code = vDesc.getCode();
    code = vtkWebGPUShaderCache.substitute(code, '//VTK::Color::Impl', [
      '  output.color = colorVI;',
    ]).result;
    vDesc.setCode(code);

    // Sets the fragment shader to accept the color inputs from the vertex shader
    const fDesc = pipeline.getShaderDescription('fragment');
    code = fDesc.getCode();
    code = vtkWebGPUShaderCache.substitute(code, '//VTK::Color::Impl', [
      'ambientColor = input.color;',
      'diffuseColor = input.color;',
      'opacity = mapperUBO.Opacity * input.color.a;',
    ]).result;
    fDesc.setCode(code);
  };
  model.shaderReplacements.set(
    'replaceShaderColor',
    publicAPI.replaceShaderColor
  );

  publicAPI.replaceShaderTCoord = (hash, pipeline, vertexInput) => {
    if (!vertexInput.hasAttribute('tcoord')) return;

    const vDesc = pipeline.getShaderDescription('vertex');
    const tcoords = vertexInput.getBuffer('tcoord');
    const numComp = vtkWebGPUTypes.getNumberOfComponentsFromBufferFormat(
      tcoords.getArrayInformation()[0].format
    );
    let code = vDesc.getCode();
    vDesc.addOutput(`vec${numComp}<f32>`, 'tcoordVS');
    code = vtkWebGPUShaderCache.substitute(code, '//VTK::TCoord::Impl', [
      '  output.tcoordVS = tcoord;',
    ]).result;
    vDesc.setCode(code);

    const fDesc = pipeline.getShaderDescription('fragment');
    code = fDesc.getCode();

    const actor = model.WebGPUActor.getRenderable();

    const checkDims = (texture) => {
      if (!texture) return false;
      const dims = texture.getDimensionality();
      return dims === numComp;
    };

    const usedTextures = [];

    if (
      actor.getProperty().getDiffuseTexture?.()?.getImageLoaded() ||
      actor.getTextures()[0] ||
      model.colorTexture
    ) {
      if (
        // Chained or statements here are questionable
        checkDims(actor.getProperty().getDiffuseTexture?.()) ||
        checkDims(actor.getTextures()[0]) ||
        checkDims(model.colorTexture)
      ) {
        usedTextures.push(
          '_diffuseMap = textureSample(DiffuseTexture, DiffuseTextureSampler, input.tcoordVS);'
        );
      }
    }
    if (actor.getProperty().getRoughnessTexture?.()?.getImageLoaded()) {
      if (checkDims(actor.getProperty().getRoughnessTexture())) {
        usedTextures.push(
          '_roughnessMap = textureSample(RoughnessTexture, RoughnessTextureSampler, input.tcoordVS);'
        );
      }
    }
    if (actor.getProperty().getMetallicTexture?.()?.getImageLoaded()) {
      if (checkDims(actor.getProperty().getMetallicTexture())) {
        usedTextures.push(
          '_metallicMap = textureSample(MetallicTexture, MetallicTextureSampler, input.tcoordVS);'
        );
      }
    }
    if (actor.getProperty().getNormalTexture?.()?.getImageLoaded()) {
      if (checkDims(actor.getProperty().getNormalTexture())) {
        usedTextures.push(
          '_normalMap = textureSample(NormalTexture, NormalTextureSampler, input.tcoordVS);'
        );
      }
    }
    if (actor.getProperty().getAmbientOcclusionTexture?.()?.getImageLoaded()) {
      if (checkDims(actor.getProperty().getAmbientOcclusionTexture())) {
        usedTextures.push(
          '_ambientOcclusionMap = textureSample(AmbientOcclusionTexture, AmbientOcclusionTextureSampler, input.tcoordVS);'
        );
      }
    }
    if (actor.getProperty().getEmissionTexture?.()?.getImageLoaded()) {
      if (checkDims(actor.getProperty().getEmissionTexture())) {
        usedTextures.push(
          '_emissionMap = textureSample(EmissionTexture, EmissionTextureSampler, input.tcoordVS);'
        );
      }
    }

    code = vtkWebGPUShaderCache.substitute(
      code,
      '//VTK::TCoord::Impl',
      usedTextures
    ).result;
    fDesc.setCode(code);
  };
  model.shaderReplacements.set(
    'replaceShaderTCoord',
    publicAPI.replaceShaderTCoord
  );

  publicAPI.replaceShaderSelect = (hash, pipeline, vertexInput) => {
    if (hash.includes('sel')) {
      const fDesc = pipeline.getShaderDescription('fragment');
      let code = fDesc.getCode();
      // by default there are no composites, so just 0
      code = vtkWebGPUShaderCache.substitute(code, '//VTK::Select::Impl', [
        '  var compositeID: u32 = 0u;',
      ]).result;
      fDesc.setCode(code);
    }
  };
  model.shaderReplacements.set(
    'replaceShaderSelect',
    publicAPI.replaceShaderSelect
  );

  publicAPI.getUsage = (rep, i) => {
    if (rep === Representation.POINTS || i === PrimitiveTypes.Points) {
      return BufferUsage.Verts;
    }

    if (i === PrimitiveTypes.Lines) {
      return BufferUsage.Lines;
    }

    if (rep === Representation.WIREFRAME) {
      if (i === PrimitiveTypes.Triangles) {
        return BufferUsage.LinesFromTriangles;
      }
      return BufferUsage.LinesFromStrips;
    }

    if (i === PrimitiveTypes.Triangles) {
      return BufferUsage.Triangles;
    }

    if (i === PrimitiveTypes.TriangleStrips) {
      return BufferUsage.Strips;
    }

    if (i === PrimitiveTypes.TriangleEdges) {
      return BufferUsage.LinesFromTriangles;
    }

    // only strip edges left which are lines
    return BufferUsage.LinesFromStrips;
  };

  publicAPI.getHashFromUsage = (usage) => `pt${usage}`;

  publicAPI.getTopologyFromUsage = (usage) => {
    switch (usage) {
      case BufferUsage.Triangles:
        return 'triangle-list';
      case BufferUsage.Verts:
        return 'point-list';
      case BufferUsage.Lines:
      default:
        return 'line-list';
    }
  };

  // TODO: calculate tangents
  publicAPI.buildVertexInput = () => {
    const pd = model.currentInput;
    const cells = model.cellArray;
    const primType = model.primitiveType;

    const actor = model.WebGPUActor.getRenderable();
    let representation = actor.getProperty().getRepresentation();
    const device = model.WebGPURenderWindow.getDevice();
    let edges = false;
    if (primType === PrimitiveTypes.TriangleEdges) {
      edges = true;
      representation = Representation.WIREFRAME;
    }

    const vertexInput = model.vertexInput;
    const points = pd.getPoints();
    let indexBuffer;

    // get the flat mapping indexBuffer for the cells
    if (cells) {
      const buffRequest = {
        hash: `R${representation}P${primType}${cells.getMTime()}`,
        usage: BufferUsage.Index,
        cells,
        numberOfPoints: points.getNumberOfPoints(),
        primitiveType: primType,
        representation,
      };
      indexBuffer = device.getBufferManager().getBuffer(buffRequest);
      vertexInput.setIndexBuffer(indexBuffer);
    } else {
      vertexInput.setIndexBuffer(null);
    }

    // hash = all things that can change the values on the buffer
    // since mtimes are unique we can use
    // - indexBuffer mtime - because cells drive how we pack
    // - relevant dataArray mtime - the source data
    // - shift - not currently captured
    // - scale - not currently captured
    // - format
    // - usage
    // - packExtra - covered by format

    // points
    if (points) {
      const shift = model.WebGPUActor.getBufferShift(model.WebGPURenderer);
      const buffRequest = {
        hash: `${points.getMTime()}I${indexBuffer.getMTime()}${shift.join()}float32x4`,
        usage: BufferUsage.PointArray,
        format: 'float32x4',
        dataArray: points,
        indexBuffer,
        shift,
        packExtra: true,
      };
      const buff = device.getBufferManager().getBuffer(buffRequest);
      vertexInput.addBuffer(buff, ['vertexBC']);
    } else {
      vertexInput.removeBufferIfPresent('vertexBC');
    }

    // normals, only used for surface rendering
    const usage = publicAPI.getUsage(representation, primType);
    model._usesCellNormals = false;
    if (
      !model.is2D && // no lighting on Property2D
      (usage === BufferUsage.Triangles || usage === BufferUsage.Strips)
    ) {
      const normals = pd.getPointData().getNormals();
      // https://vtk.org/doc/nightly/html/classvtkPolyDataTangents.html
      // Need to find some way of using precomputed tangents (or computing new ones)
      const buffRequest = {
        format: 'snorm8x4',
        indexBuffer,
        packExtra: true,
        shift: 0,
        scale: 127,
      };
      if (normals) {
        buffRequest.hash = `${normals.getMTime()}I${indexBuffer.getMTime()}snorm8x4`;
        buffRequest.dataArray = normals;
        buffRequest.usage = BufferUsage.PointArray;
        const buff = device.getBufferManager().getBuffer(buffRequest);
        vertexInput.addBuffer(buff, ['normalMC']);
      } else if (primType === PrimitiveTypes.Triangles) {
        model._usesCellNormals = true;
        buffRequest.hash = `PFN${points.getMTime()}I${indexBuffer.getMTime()}snorm8x4`;
        buffRequest.dataArray = points;
        buffRequest.cells = cells;
        buffRequest.usage = BufferUsage.NormalsFromPoints;
        const buff = device.getBufferManager().getBuffer(buffRequest);
        vertexInput.addBuffer(buff, ['normalMC']);
      } else {
        vertexInput.removeBufferIfPresent('normalMC');
      }
    } else {
      vertexInput.removeBufferIfPresent('normalMC');
    }

    // deal with colors but only if modified
    let haveColors = false;
    if (model.renderable.getScalarVisibility()) {
      const c = model.renderable.getColorMapColors();
      if (c && !edges) {
        const scalarMode = model.renderable.getScalarMode();
        let haveCellScalars = false;
        // We must figure out how the scalars should be mapped to the polydata.
        if (
          (scalarMode === ScalarMode.USE_CELL_DATA ||
            scalarMode === ScalarMode.USE_CELL_FIELD_DATA ||
            scalarMode === ScalarMode.USE_FIELD_DATA ||
            !pd.getPointData().getScalars()) &&
          scalarMode !== ScalarMode.USE_POINT_FIELD_DATA &&
          c
        ) {
          haveCellScalars = true;
        }
        const buffRequest = {
          usage: BufferUsage.PointArray,
          format: 'unorm8x4',
          hash: `${haveCellScalars}${c.getMTime()}I${indexBuffer.getMTime()}unorm8x4`,
          dataArray: c,
          indexBuffer,
          cellData: haveCellScalars,
          cellOffset: 0,
        };
        const buff = device.getBufferManager().getBuffer(buffRequest);
        vertexInput.addBuffer(buff, ['colorVI']);
        haveColors = true;
      }
    }
    if (!haveColors) {
      vertexInput.removeBufferIfPresent('colorVI');
    }

    let tcoords = null;
    if (
      model.renderable.getInterpolateScalarsBeforeMapping?.() &&
      model.renderable.getColorCoordinates()
    ) {
      tcoords = model.renderable.getColorCoordinates();
    } else {
      tcoords = pd.getPointData().getTCoords();
    }
    if (tcoords && !edges) {
      const buff = device
        .getBufferManager()
        .getBufferForPointArray(tcoords, vertexInput.getIndexBuffer());
      vertexInput.addBuffer(buff, ['tcoord']);
    } else {
      vertexInput.removeBufferIfPresent('tcoord');
    }
  };

  publicAPI.updateTextures = () => {
    // we keep track of new and used textures so
    // that we can clean up any unused textures so we don't hold onto them
    const usedTextures = [];
    const newTextures = [];

    // do we have a scalar color texture
    const idata = model.renderable.getColorTextureMap?.();
    if (idata) {
      if (!model.colorTexture) {
        model.colorTexture = vtkTexture.newInstance({ label: 'polyDataColor' });
      }
      model.colorTexture.setInputData(idata);
      newTextures.push(['Diffuse', model.colorTexture]);
    }

    // actor textures?
    const actor = model.WebGPUActor.getRenderable();
    const renderer = model.WebGPURenderer.getRenderable();

    // Reusing the old code for new and old textures, just loading in from properties instead of actor.getTextures()
    const textures = [];

    // Feels like there should be a better way than individually adding all
    if (actor.getProperty().getDiffuseTexture?.()) {
      const pair = ['Diffuse', actor.getProperty().getDiffuseTexture()];
      textures.push(pair);
    }
    if (actor.getTextures()[0]) {
      const pair = ['Diffuse', actor.getTextures()[0]];
      textures.push(pair);
    }
    if (model.colorTexture) {
      const pair = ['Diffuse', model.colorTexture];
      textures.push(pair);
    }
    if (actor.getProperty().getRoughnessTexture?.()) {
      const pair = ['Roughness', actor.getProperty().getRoughnessTexture()];
      textures.push(pair);
    }
    if (actor.getProperty().getMetallicTexture?.()) {
      const pair = ['Metallic', actor.getProperty().getMetallicTexture()];
      textures.push(pair);
    }
    if (actor.getProperty().getNormalTexture?.()) {
      const pair = ['Normal', actor.getProperty().getNormalTexture()];
      textures.push(pair);
    }
    if (actor.getProperty().getAmbientOcclusionTexture?.()) {
      const pair = [
        'AmbientOcclusion',
        actor.getProperty().getAmbientOcclusionTexture(),
      ];
      textures.push(pair);
    }
    if (actor.getProperty().getEmissionTexture?.()) {
      const pair = ['Emission', actor.getProperty().getEmissionTexture()];
      textures.push(pair);
    }
    if (renderer.getEnvironmentTexture?.()) {
      const pair = ['Environment', renderer.getEnvironmentTexture()];
      textures.push(pair);
    }

    for (let i = 0; i < textures.length; i++) {
      if (
        textures[i][1].getInputData() ||
        textures[i][1].getJsImageData() ||
        textures[i][1].getCanvas()
      ) {
        newTextures.push(textures[i]);
      }
      if (textures[i][1].getImage() && textures[i][1].getImageLoaded()) {
        newTextures.push(textures[i]);
      }
    }

    for (let i = 0; i < newTextures.length; i++) {
      const srcTexture = newTextures[i][1];
      const textureName = newTextures[i][0];
      const newTex = model.device
        .getTextureManager()
        .getTextureForVTKTexture(srcTexture); // Generates hash
      if (newTex.getReady()) {
        // is this a new texture
        let found = false;
        for (let t = 0; t < model.textures.length; t++) {
          if (model.textures[t] === newTex) {
            found = true;
            usedTextures[t] = true;
          }
        }
        if (!found) {
          usedTextures[model.textures.length] = true;
          const tview = newTex.createView(`${textureName}Texture`);
          model.textures.push(newTex);
          model.textureViews.push(tview);
          const interpolate = srcTexture.getInterpolate()
            ? 'linear'
            : 'nearest';
          let addressMode = null;
          if (
            !addressMode &&
            srcTexture.getEdgeClamp() &&
            srcTexture.getRepeat()
          )
            addressMode = 'mirror-repeat';
          if (!addressMode && srcTexture.getEdgeClamp())
            addressMode = 'clamp-to-edge';
          if (!addressMode && srcTexture.getRepeat()) addressMode = 'repeat';

          if (textureName !== 'Environment') {
            tview.addSampler(model.device, {
              addressModeU: addressMode,
              addressModeV: addressMode,
              addressModeW: addressMode,
              minFilter: interpolate,
              magFilter: interpolate,
            });
          } else {
            tview.addSampler(model.device, {
              addressModeU: 'repeat',
              addressModeV: 'clamp-to-edge',
              addressModeW: 'repeat',
              minFilter: interpolate,
              magFilter: interpolate,
              mipmapFilter: 'linear',
            });
          }
        }
      }
    }

    // remove unused textures
    for (let i = model.textures.length - 1; i >= 0; i--) {
      if (!usedTextures[i]) {
        model.textures.splice(i, 1);
        model.textureViews.splice(i, 1);
      }
    }
  };

  // compute a unique hash for a pipeline, this needs to be unique enough to
  // capture any pipeline code changes (which includes shader changes)
  // or vertex input changes/ bind groups/ etc
  publicAPI.computePipelineHash = () => {
    let pipelineHash = `pd${model.useRendererMatrix ? 'r' : ''}${
      model.forceZValue ? 'z' : ''
    }`;

    if (
      model.primitiveType === PrimitiveTypes.TriangleEdges ||
      model.primitiveType === PrimitiveTypes.TriangleStripEdges
    ) {
      pipelineHash += 'edge';
    } else {
      if (model.vertexInput.hasAttribute(`normalMC`)) {
        pipelineHash += `n`;
      }
      if (model.vertexInput.hasAttribute(`colorVI`)) {
        pipelineHash += `c`;
      }
      if (model.vertexInput.hasAttribute(`tcoord`)) {
        const tcoords = model.vertexInput.getBuffer('tcoord');
        const numComp = vtkWebGPUTypes.getNumberOfComponentsFromBufferFormat(
          tcoords.getArrayInformation()[0].format
        );
        pipelineHash += `t${numComp}`;
      }
      if (model.textures.length) {
        pipelineHash += `tx${model.textures.length}`;
      }
    }

    if (model._usesCellNormals) {
      pipelineHash += `cn`;
    }

    if (model.SSBO) {
      pipelineHash += `ssbo`;
    }

    const uhash = publicAPI.getHashFromUsage(model.usage);
    pipelineHash += uhash;
    pipelineHash += model.renderEncoder.getPipelineHash();

    model.pipelineHash = pipelineHash;
  };

  publicAPI.updateBuffers = () => {
    // handle textures if not edges
    if (
      model.primitiveType !== PrimitiveTypes.TriangleEdges &&
      model.primitiveType !== PrimitiveTypes.TriangleStripEdges
    ) {
      publicAPI.updateTextures();
    }

    const actor = model.WebGPUActor.getRenderable();
    const rep = actor.getProperty().getRepresentation();

    // handle per primitive type
    model.usage = publicAPI.getUsage(rep, model.primitiveType);
    publicAPI.buildVertexInput();

    const vbo = model.vertexInput.getBuffer('vertexBC');
    publicAPI.setNumberOfVertices(
      vbo.getSizeInBytes() / vbo.getStrideInBytes()
    );
    publicAPI.setTopology(publicAPI.getTopologyFromUsage(model.usage));
    publicAPI.updateUBO();
    if (publicAPI.haveWideLines()) {
      const ppty = actor.getProperty();
      publicAPI.setNumberOfInstances(Math.ceil(ppty.getLineWidth() * 2.0));
    } else {
      publicAPI.setNumberOfInstances(1);
    }
  };
}

// ----------------------------------------------------------------------------
// Object factory
// ----------------------------------------------------------------------------

const DEFAULT_VALUES = {
  is2D: false,
  cellArray: null,
  currentInput: null,
  cellOffset: 0,
  primitiveType: 0,
  colorTexture: null,
  renderEncoder: null,
  textures: null,
};

// ----------------------------------------------------------------------------

export function extend(publicAPI, model, initiaLalues = {}) {
  Object.assign(model, DEFAULT_VALUES, initiaLalues);

  // Inheritance
  vtkWebGPUSimpleMapper.extend(publicAPI, model, initiaLalues);

  model.fragmentShaderTemplate = vtkWebGPUPolyDataFS;
  model.vertexShaderTemplate = vtkWebGPUPolyDataVS;

  model._tmpMat3 = mat3.identity(new Float64Array(9));
  model._tmpMat4 = mat4.identity(new Float64Array(16));

  // UBO
  model.UBO = vtkWebGPUUniformBuffer.newInstance({ label: 'mapperUBO' });
  model.UBO.addEntry('BCWCMatrix', 'mat4x4<f32>');
  model.UBO.addEntry('BCSCMatrix', 'mat4x4<f32>');
  model.UBO.addEntry('MCWCNormals', 'mat4x4<f32>');
  model.UBO.addEntry('AmbientColor', 'vec4<f32>');
  model.UBO.addEntry('DiffuseColor', 'vec4<f32>');
  model.UBO.addEntry('EdgeColor', 'vec4<f32>');
  model.UBO.addEntry('SpecularColor', 'vec4<f32>');
  model.UBO.addEntry('AmbientIntensity', 'f32');
  model.UBO.addEntry('DiffuseIntensity', 'f32');
  model.UBO.addEntry('Roughness', 'f32');
  model.UBO.addEntry('Metallic', 'f32');
  model.UBO.addEntry('Ambient', 'f32');
  model.UBO.addEntry('Normal', 'f32');
  model.UBO.addEntry('Emission', 'f32');
  model.UBO.addEntry('NormalStrength', 'f32');
  model.UBO.addEntry('BaseIOR', 'f32');
  model.UBO.addEntry('SpecularIntensity', 'f32');
  model.UBO.addEntry('LineWidth', 'f32');
  model.UBO.addEntry('Opacity', 'f32');
  model.UBO.addEntry('ZValue', 'f32');
  model.UBO.addEntry('PropID', 'u32');
  model.UBO.addEntry('ClipNear', 'f32');
  model.UBO.addEntry('ClipFar', 'f32');
  model.UBO.addEntry('Time', 'u32');

  // Build VTK API
  macro.setGet(publicAPI, model, [
    'cellArray',
    'currentInput',
    'cellOffset',
    'is2D',
    'primitiveType',
    'renderEncoder',
  ]);

  model.textures = [];

  // Object methods
  vtkWebGPUCellArrayMapper(publicAPI, model);
}

// ----------------------------------------------------------------------------

export const newInstance = macro.newInstance(
  extend,
  'vtkWebGPUCellArrayMapper'
);

// ----------------------------------------------------------------------------

export default { newInstance, extend };
