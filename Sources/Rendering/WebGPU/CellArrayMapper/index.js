import { mat3, mat4 } from 'gl-matrix';

import * as macro from 'vtk.js/Sources/macros';
import vtkDataSet from 'vtk.js/Sources/Common/DataModel/DataSet';
import CoincidentTopologyHelper from 'vtk.js/Sources/Rendering/Core/Mapper/CoincidentTopologyHelper';
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
import {
  addClipPlaneEntries,
  getClippingPlaneEquationsInCoords,
  getClipPlaneShaderChecks,
  MAX_CLIPPING_PLANES,
} from 'vtk.js/Sources/Rendering/WebGPU/Helpers/ClippingPlanes';

const { Resolve } = CoincidentTopologyHelper;
const { FieldAssociations } = vtkDataSet;
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

struct Material {
  ior: f32,
  roughness: f32,
  metallic: f32,
  base: vec3<f32>,
};

struct DirectionalLight {
  direction: vec3<f32>,
  color: vec3<f32>,
};

struct PointLight {
  position: vec3<f32>,
  color: vec3<f32>,
};

struct SpotLight {
  position: vec3<f32>,
  direction: vec3<f32>,
  cones: vec2<f32>,
  color: vec3<f32>,
};

const pi: f32 = 3.14159265359;

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
  d = pow((d + 1.0) / 2.0, 2.6);
  return d;
}

// Lambertian diffuse model
fn lambertDiffuse(base: vec3<f32>, N: vec3<f32>, L: vec3<f32>) -> vec3<f32> {
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
  var t: f32 = mix(1.0, max(NdotL, NdotV), step(0.0, s)); // Mix with step is the equivalent of an if statement
  var A: vec3<f32> = 0.5*(o2 / (o2 + 0.33)) + 0.17*p*(o2 / (o2 + 0.13));
  A = invpi*(1 - A);
  var B: f32 = 0.45*(o2 / (o2 + 0.09));
  B = invpi*B;

  return p*NdotL*(A + B*(s/t));
}

// Fresnel portion of BRDF (IOR only, simplified)
fn schlickFresnelIOR(V: vec3<f32>, N: vec3<f32>, ior: f32, k: f32) -> f32 {
  var NdotV: f32 = mdot(V, N);
  var F0: f32 = (pow((ior - 1.0), 2.0) + k*k) / (pow((ior + 1.0), 2.0) + k*k); // This takes into account the roughness, which the other one does not
  return F0 + (1.0 - F0) * pow((1.0-NdotV), 5.0);
}

// Fresnel portion of BRDF (Color ior, better)
fn schlickFresnelRGB(V: vec3<f32>, N: vec3<f32>, F0: vec3<f32>) -> vec3<f32> {
  var NdotV: f32 = mdot(V, N);
  return F0 + (1.0 - F0) * pow((1-NdotV), 5.0);
}

// Normal portion of BRDF
// https://learnopengl.com/PBR/Theory
// Trowbridge-Reitz GGX functions: normal, halfway, roughness^2
fn trGGX(N: vec3<f32>, H: vec3<f32>, a: f32) -> f32 {
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
  return NdotX / max(0.000001, (NdotX*(1.0-k) + k));
}

fn smithSurfaceRoughness(N: vec3<f32>, V: vec3<f32>, L: vec3<f32>, k: f32) -> f32 {
  var ggx1: f32 = min(1.0, schlickGGX(N, V, k));
  var ggx2: f32 = min(1.0, schlickGGX(N, L, k));
  return ggx1*ggx2;
}

// BRDF Combination
fn cookTorrance(D: f32, F: f32, G: f32, N: vec3<f32>, V: vec3<f32>, L: vec3<f32>) -> f32 {
  var num: f32 = D*F*G;
  var denom: f32 = 4*cdot(V, N)*cdot(L, N);

  return num / max(denom, 0.000001);
}

// Different lighting calculations for different light sources
fn calcDirectionalLight(N: vec3<f32>, V: vec3<f32>, mat: Material, light: DirectionalLight) -> PBRData {
  var L: vec3<f32> = normalize(light.direction); // Light Vector
  var H: vec3<f32> = normalize(L + V); // Halfway Vector

  var alpha = mat.roughness * mat.roughness;
  var k: f32 = alpha * alpha / 2.0;

  var D: f32 = trGGX(N, H, alpha); // Distribution
  // var F: f32 = schlickFresnelIOR(V, N, ior, k); // Fresnel
  var G: f32 = smithSurfaceRoughness(N, V, L, k); // Geometry

  var brdf: f32 = cookTorrance(D, 1.0, G, N, V, L); // Fresnel term is replaced with 1 because it is added later
  var incoming: vec3<f32> = light.color;
  var angle: f32 = mdot(L, N);
  angle = pow(angle, 1.5);

  var specular: vec3<f32> = brdf * incoming * angle;
  // Oren-Nayar gives a clay-like effect when fully rough which some people may not want, so it might be better to give a separate
  // control property for the diffuse vs specular roughness
  var diffuse: vec3<f32> = incoming * fujiiOrenNayar(mat.base, mat.roughness, N, L, V);
  // Stores the specular and diffuse separately to allow for finer post processing
  var out = PBRData(diffuse, specular);

  return out; // Returns angle along with color of light so the final color can be multiplied by angle as well (creates black areas)
}

fn calcPointLight(N: vec3<f32>, V: vec3<f32>, fragPos: vec3<f32>, mat: Material, light: PointLight) -> PBRData {
  var L: vec3<f32> = normalize(light.position - fragPos);
  var H: vec3<f32> = normalize(L + V);
  var dist = distance(light.position, fragPos);

  var alpha = mat.roughness * mat.roughness;
  var k: f32 = alpha * alpha / 2.0;

  var D: f32 = trGGX(N, H, alpha); // Distribution
  var F: f32 = schlickFresnelIOR(V, N, mat.ior, k); // Fresnel
  var G: f32 = smithSurfaceRoughness(N, V, L, k); // Geometry

  var brdf: f32 = cookTorrance(D, 1.0, G, N, V, L);
  var incoming: vec3<f32> = light.color * (1.0 / (dist * dist));
  var angle: f32 = mdot(L, N);
  angle = pow(angle, 1.5); // Smoothing factor makes it less accurate, but reduces ugly "seams" between light sources

  var specular: vec3<f32> = brdf * incoming * angle;
  var diffuse: vec3<f32> = incoming * fujiiOrenNayar(mat.base, mat.roughness, N, L, V);
  // Stores the specular and diffuse separately to allow for finer post processing
  // Could also be done (propably more properly) with a struct
  var out = PBRData(diffuse, specular);

  return out; // Returns angle along with color of light so the final color can be multiplied by angle as well (creates black areas)
}

// For a reason unknown to me, spheres dont seem to behave propperly with head-on spot lights
fn calcSpotLight(N: vec3<f32>, V: vec3<f32>, fragPos: vec3<f32>, mat: Material, light: SpotLight) -> PBRData {
  var L: vec3<f32> = normalize(light.position - fragPos);
  var H: vec3<f32> = normalize(L + V); // Halfway Vector
  var dist = distance(light.position, fragPos);

  var alpha = mat.roughness * mat.roughness;
  var k: f32 = alpha * alpha / 2.0; // could also be pow(alpha + 1.0, 2) / 8

  var D: f32 = trGGX(N, H, alpha); // Distribution
  // var F: f32 = schlickFresnelIOR(V, N, ior, k); // Fresnel
  var G: f32 = smithSurfaceRoughness(N, V, L, k); // Geometry

  var brdf: f32 = cookTorrance(D, 1.0, G, N, V, L);

  var theta: f32 = mdot(normalize(light.direction), L);
  var epsilon: f32 = light.cones.x - light.cones.y;
  var intensity: f32 = (theta - light.cones.y) / epsilon;
  intensity = clamp(intensity, 0.0, 1.0);
  intensity /= dist * dist;

  var incoming: vec3<f32> = light.color * intensity;

  var angle: f32 = mdot(L, N);
  angle = pow(angle, 1.5); // Smoothing factor makes it less accurate, but reduces ugly "seams" between light sources

  var specular: vec3<f32> = brdf * incoming * angle;
  var diffuse: vec3<f32> = incoming * fujiiOrenNayar(mat.base, mat.roughness, N, L, V);

  // Stores the specular and diffuse separately to allow for finer post processing
  // Could also be done (propably more properly) with a struct
  var out = PBRData(diffuse, specular);

  return out; // Returns angle along with color of light so the final color can be multiplied by angle as well (creates black areas)
}

// Environment mapping stuff
// Takes in a vector and converts it to an equivalent coordinate in a rectilinear texture. Should be replaced with cubemaps at some point
fn vecToRectCoord(dir: vec3<f32>) -> vec2<f32> {
  var tau: f32 = 6.28318530718;
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
  var ambientIntensity: f32 = mapperUBO.AmbientIntensity;
  var diffuseIntensity: f32 = mapperUBO.DiffuseIntensity;
  var specularColor: vec4<f32> = mapperUBO.SpecularColor;
  var specularIntensity: f32 = mapperUBO.SpecularIntensity;
  var opacity: f32 = mapperUBO.Opacity;
  var ior: f32 = mapperUBO.BaseIOR;
  var normalStrengthUniform: f32 = mapperUBO.NormalStrength;
  var roughnessUniform: f32 = mapperUBO.Roughness;
  var metallicUniform: f32 = mapperUBO.Metallic;
  var emissionUniform: f32 = mapperUBO.Emission;

  if (!input.frontFacing) {
    ambientColor = mapperUBO.AmbientColorBF;
    diffuseColor = mapperUBO.DiffuseColorBF;
    ambientIntensity = mapperUBO.AmbientIntensityBF;
    diffuseIntensity = mapperUBO.DiffuseIntensityBF;
    specularColor = mapperUBO.SpecularColorBF;
    specularIntensity = mapperUBO.SpecularIntensityBF;
    opacity = mapperUBO.OpacityBF;
    ior = mapperUBO.BaseIORBF;
    normalStrengthUniform = mapperUBO.NormalStrengthBF;
    roughnessUniform = mapperUBO.RoughnessBF;
    metallicUniform = mapperUBO.MetallicBF;
    emissionUniform = mapperUBO.EmissionBF;
  }

  // This should be declared somewhere else
  var _diffuseMap: vec4<f32> = vec4<f32>(1.0);
  var _roughnessMap: vec4<f32> = vec4<f32>(1.0);
  var _metallicMap: vec4<f32> = vec4<f32>(1.0);
  var _normalMap: vec4<f32> = vec4<f32>(0.0, 0.0, 1.0, 0.0); // normal map was setting off the normal vector detection in fragment
  var _ambientOcclusionMap: vec4<f32> = vec4<f32>(1.);
  var _emissionMap: vec4<f32> = vec4<f32>(0.);

  //VTK::Color::Impl

  //VTK::TCoord::Impl

  //VTK::Normal::Impl

  var computedColor: vec4<f32> = vec4<f32>(diffuseColor.rgb, 1.0);

  //VTK::Light::Impl

  //VTK::Select::Impl

  // Use texture alpha for transparency
  computedColor.a = opacity * _diffuseMap.a;
  if (computedColor.a == 0.0) { discard; };

  //VTK::Position::Impl

  //VTK::RenderEncoder::Impl

  return output;
}
`;

const tmp2Mat4 = new Float64Array(16);

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

  publicAPI.isEdgePrimitive = () =>
    model.primitiveType === PrimitiveTypes.TriangleEdges ||
    model.primitiveType === PrimitiveTypes.TriangleStripEdges;

  publicAPI.shouldSkipPass = () =>
    publicAPI.isEdgePrimitive() && (model.depthOnlyPass || model.selectionPass);

  // Renders myself
  publicAPI.renderForPass = (renderEncoder, depthOnly = false) => {
    model.depthOnlyPass = depthOnly;
    model.selectionPass = renderEncoder?.getPipelineHash?.() === 'sel';
    if (publicAPI.shouldSkipPass()) {
      model.depthOnlyPass = false;
      model.selectionPass = false;
      return;
    }
    publicAPI.prepareToDraw(renderEncoder);
    model.renderEncoder.registerDrawCallback(model.pipeline, publicAPI.draw);
    model.depthOnlyPass = false;
    model.selectionPass = false;
  };

  publicAPI.translucentPass = (prepass) => {
    if (prepass) {
      publicAPI.renderForPass(model.WebGPURenderer.getRenderEncoder());
    }
  };

  publicAPI.opaquePass = (prepass) => {
    if (prepass) {
      publicAPI.renderForPass(model.WebGPURenderer.getRenderEncoder());
    }
  };

  publicAPI.zBufferPass = (prepass) => {
    if (prepass) {
      publicAPI.renderForPass(model.WebGPURenderer.getRenderEncoder(), true);
    }
  };

  publicAPI.opaqueZBufferPass = (prepass) => publicAPI.zBufferPass(prepass);

  publicAPI.updateUBO = () => {
    const actor = model.WebGPUActor.getRenderable();
    const ppty = actor.getProperty();
    const clippingPlanesMTime = model.renderable.getClippingPlanesMTime();
    const backfaceProperty = actor.getBackfaceProperty?.() ?? ppty;
    const selector = model.WebGPURenderer?.getSelector?.();
    const utime = model.UBO.getSendTime();
    if (
      !selector &&
      publicAPI.getMTime() <= utime &&
      ppty.getMTime() <= utime &&
      backfaceProperty.getMTime() <= utime &&
      model.renderable.getMTime() <= utime &&
      clippingPlanesMTime <= utime
    ) {
      return;
    }

    // --- Matrix Updates ---
    const keyMats = model.WebGPUActor.getKeyMatrices(model.WebGPURenderer);
    model.UBO.setArray('BCWCMatrix', keyMats.bcwc);
    model.UBO.setArray('BCSCMatrix', keyMats.bcsc);
    model.UBO.setArray('MCWCNormals', keyMats.normalMatrix);

    // --- 2D or 3D ---
    if (model.is2D) {
      const displayLoc =
        ppty.getDisplayLocation?.() ?? DisplayLocation.BACKGROUND;
      model.UBO.setValue(
        'ZValue',
        displayLoc === DisplayLocation.FOREGROUND ? 1.0 : 0.0
      );
      const aColor = ppty.getColorByReference();
      model.UBO.setValue('AmbientIntensity', 1.0);
      model.UBO.setArray('AmbientColor', [...aColor, 1.0]);
      model.UBO.setArray('DiffuseColor', [...aColor, 1.0]);
      model.UBO.setValue('DiffuseIntensity', 0.0);
      model.UBO.setArray('SpecularColor', [1.0, 1.0, 1.0, 1.0]);
      model.UBO.setValue('SpecularIntensity', 0.0);
      model.UBO.setValue('Roughness', 1.0);
      model.UBO.setValue('BaseIOR', 1.45);
      model.UBO.setValue('Metallic', 0.0);
      model.UBO.setValue('Emission', 1.0);
      model.UBO.setValue('NormalStrength', 1.0);
      model.UBO.setValue('AmbientIntensityBF', 1.0);
      model.UBO.setArray('AmbientColorBF', [...aColor, 1.0]);
      model.UBO.setValue('DiffuseIntensityBF', 0.0);
      model.UBO.setArray('DiffuseColorBF', [...aColor, 1.0]);
      model.UBO.setArray('SpecularColorBF', [1.0, 1.0, 1.0, 1.0]);
      model.UBO.setValue('SpecularIntensityBF', 0.0);
      model.UBO.setValue('RoughnessBF', 1.0);
      model.UBO.setValue('BaseIORBF', 1.45);
      model.UBO.setValue('MetallicBF', 0.0);
      model.UBO.setValue('EmissionBF', 1.0);
      model.UBO.setValue('NormalStrengthBF', 1.0);
      model.UBO.setValue('OpacityBF', ppty.getOpacity());
    } else {
      // Base Colors
      model.UBO.setValue('AmbientIntensity', ppty.getAmbient());
      model.UBO.setArray('AmbientColor', [
        ...ppty.getAmbientColorByReference(),
        1.0,
      ]);
      model.UBO.setValue('DiffuseIntensity', ppty.getDiffuse());
      model.UBO.setArray('DiffuseColor', [
        ...ppty.getDiffuseColorByReference(),
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
      model.UBO.setArray('SpecularColor', [
        ...ppty.getSpecularColorByReference(),
        1.0,
      ]);

      model.UBO.setValue('AmbientIntensityBF', backfaceProperty.getAmbient());
      model.UBO.setArray('AmbientColorBF', [
        ...backfaceProperty.getAmbientColorByReference(),
        1.0,
      ]);
      model.UBO.setValue('DiffuseIntensityBF', backfaceProperty.getDiffuse());
      model.UBO.setArray('DiffuseColorBF', [
        ...backfaceProperty.getDiffuseColorByReference(),
        1.0,
      ]);
      model.UBO.setValue('RoughnessBF', backfaceProperty.getRoughness());
      model.UBO.setValue('BaseIORBF', backfaceProperty.getBaseIOR());
      model.UBO.setValue('MetallicBF', backfaceProperty.getMetallic());
      model.UBO.setValue('EmissionBF', backfaceProperty.getEmission());
      model.UBO.setValue(
        'NormalStrengthBF',
        backfaceProperty.getNormalStrength()
      );
      model.UBO.setValue('SpecularIntensityBF', backfaceProperty.getSpecular());
      model.UBO.setArray('SpecularColorBF', [
        ...backfaceProperty.getSpecularColorByReference(),
        1.0,
      ]);
      model.UBO.setValue('OpacityBF', backfaceProperty.getOpacity());
    }

    // --- Edge and Misc ---
    const edgeColor = ppty.getEdgeColorByReference?.();
    if (edgeColor) model.UBO.setArray('EdgeColor', [...edgeColor, 1.0]);
    model.UBO.setValue('LineWidth', ppty.getLineWidth());
    const edgeLikeRepresentation =
      model.primitiveType === PrimitiveTypes.TriangleEdges ||
      model.primitiveType === PrimitiveTypes.TriangleStripEdges ||
      ppty.getRepresentation() === Representation.WIREFRAME;
    model.UBO.setValue(
      'Opacity',
      edgeLikeRepresentation ? ppty.getEdgeOpacity() : ppty.getOpacity()
    );
    const runtimePropID = model.WebGPUActor.getPropID();
    model.UBO.setValue(
      'PropID',
      selector?.getPropIDForSelection
        ? selector.getPropIDForSelection(runtimePropID, actor) + 1
        : runtimePropID
    );
    const cp = publicAPI.getCoincidentParameters();
    model.UBO.setValue('CoincidentFactor', cp.factor);
    model.UBO.setValue('CoincidentOffset', cp.offset);
    model.UBO.setValue('NumClipPlanes', 0);

    if (!model.is2D && model.useRendererMatrix) {
      const center = model.WebGPURenderer.getStabilizedCenterByReference();
      mat4.fromTranslation(tmp2Mat4, [-center[0], -center[1], -center[2]]);
      const numClipPlanes = getClippingPlaneEquationsInCoords(
        model.renderable,
        tmp2Mat4,
        model.clipPlanes
      );
      model.UBO.setValue('NumClipPlanes', numClipPlanes);

      if (numClipPlanes > 0) {
        for (let i = 0; i < numClipPlanes; i++) {
          model.UBO.setArray(`ClipPlane${i}`, model.clipPlanes[i]);
        }
      }
    }

    // Only send if needed
    model.UBO.sendIfNeeded(model.WebGPURenderWindow.getDevice());
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

  publicAPI.getCullMode = () => {
    const actor = model.WebGPUActor.getRenderable();
    const property = actor.getProperty();
    if (property.getFrontfaceCulling()) {
      return 'front';
    }
    if (property.getBackfaceCulling()) {
      return 'back';
    }
    return 'none';
  };

  publicAPI.getPipelineSettings = () => ({
    primitive: {
      cullMode: publicAPI.getCullMode(),
    },
    ...(model.depthOnlyPass
      ? {
          fragment: {
            targets: [
              {
                format: 'rgba16float',
                writeMask: 0,
              },
            ],
          },
        }
      : {}),
  });

  publicAPI.getCoincidentParameters = () => {
    let cp = {
      factor: 0.0,
      offset: 0.0,
    };

    const actor = model.WebGPUActor?.getRenderable();
    const prop = actor?.getProperty?.();
    if (!prop) {
      return cp;
    }

    if (
      // backwards compat with code that (errorneously) set this to boolean
      // eslint-disable-next-line eqeqeq
      model.renderable.getResolveCoincidentTopology() ==
        Resolve.PolygonOffset ||
      (prop.getEdgeVisibility() &&
        prop.getRepresentation() === Representation.SURFACE)
    ) {
      const primType = model.primitiveType;
      if (
        primType === PrimitiveTypes.Verts ||
        prop.getRepresentation() === Representation.POINTS
      ) {
        cp = model.renderable.getCoincidentTopologyPointOffsetParameter();
      } else if (
        primType === PrimitiveTypes.Lines ||
        prop.getRepresentation() === Representation.WIREFRAME
      ) {
        cp = model.renderable.getCoincidentTopologyLineOffsetParameters();
      } else if (
        primType === PrimitiveTypes.Triangles ||
        primType === PrimitiveTypes.TriangleStrips
      ) {
        cp = model.renderable.getCoincidentTopologyPolygonOffsetParameters();
      }

      if (
        primType === PrimitiveTypes.TriangleEdges ||
        primType === PrimitiveTypes.TriangleStripEdges
      ) {
        cp = model.renderable.getCoincidentTopologyPolygonOffsetParameters();
        cp.factor /= 2.0;
        cp.offset /= 2.0;
      }
    }

    // Hardware point picking always offsets due to the saved depth buffer.
    const selector = model.WebGPURenderer?.getSelector?.();
    if (
      selector &&
      selector.getFieldAssociation() ===
        FieldAssociations.FIELD_ASSOCIATION_POINTS
    ) {
      cp.offset -= 2.0;
    }

    return cp;
  };

  publicAPI.replaceShaderPosition = (hash, pipeline, vertexInput) => {
    const vDesc = pipeline.getShaderDescription('vertex');
    vDesc.addBuiltinOutput('vec4<f32>', '@builtin(position) Position');
    if (!vDesc.hasOutput('vertexVC')) vDesc.addOutput('vec4<f32>', 'vertexVC');
    if (!vDesc.hasOutput('vertexSC')) vDesc.addOutput('vec4<f32>', 'vertexSC');
    let code = vDesc.getCode();
    if (model.useRendererMatrix) {
      code = vtkWebGPUShaderCache.substitute(code, '//VTK::Position::Impl', [
        '    output.vertexSC = mapperUBO.BCSCMatrix * vec4<f32>(vertexBC.xyz, 1.0);',
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
      // Match the OpenGL coincident-topology constant offset scale (~1 / 2^16 = 0.000016)
      '    pCoord.z = clamp(pCoord.z - 0.000016 * mapperUBO.CoincidentOffset * pCoord.w, 0.0, pCoord.w);',
      '    output.Position = pCoord;',
    ]).result;
    vDesc.setCode(code);

    const fDesc = pipeline.getShaderDescription('fragment');
    code = fDesc.getCode();
    const clipPlaneChecks = getClipPlaneShaderChecks({
      countName: 'mapperUBO.NumClipPlanes',
      planePrefix: 'mapperUBO.ClipPlane',
      positionName: 'input.vertexSC',
    });
    code = vtkWebGPUShaderCache.substitute(code, '//VTK::Position::Impl', [
      ...clipPlaneChecks,
      '//VTK::Position::Impl',
    ]).result;
    fDesc.setCode(code);
  };
  model.shaderReplacements.set(
    'replaceShaderPosition',
    publicAPI.replaceShaderPosition
  );

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
  model.shaderReplacements.set(
    'replaceShaderCoincidentOffset',
    publicAPI.replaceShaderCoincidentOffset
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
          '  normal = mix(normal, mappedNormal, normalStrengthUniform);',
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
    const hasNormal = code.includes('var normal:');
    const needLighting =
      hasNormal &&
      model.useRendererMatrix &&
      !isEdges(hash) &&
      !model.is2D &&
      !hash.includes('sel');
    if (needLighting) {
      const lightingCode = [
        // Vectors needed for light calculations
        '  let fragPos = vec3<f32>(input.vertexVC.xyz);',
        '  let V = mix(normalize(-fragPos), vec3<f32>(0, 0, 1), f32(rendererUBO.cameraParallel)); // View Vector',
        // Values needed for light calculations
        '  let baseColor = _diffuseMap.rgb * diffuseColor.rgb;',
        '  let roughness = max(0.000001, roughnessUniform * _roughnessMap.r);', // Need to have a different way of sampling greyscale values aside from .r
        '  let metallic = metallicUniform * _metallicMap.r;',
        '  let alpha = roughness * roughness;',
        '  let k = alpha * alpha / 2.0;',
        // Split diffuse and specular components
        '  var diffuse = vec3<f32>(0.);',
        '  var specular = vec3<f32>(0.);',
        '  let emission = _emissionMap.rgb * emissionUniform;',
        '',
        '  // Material struct',
        '  let mat = Material(ior, roughness, metallic, baseColor);',
        '',
        // Summing diffuse and specular components of directional lights
        '  {',
        '    var i = 0;',
        '    loop {',
        '      if (!(i < rendererUBO.LightCount)) { break; }',
        '      switch (i32(rendererLightSSBO.values[i].LightData.x)) {',
        '         // Point Light',
        '         case 0 {',
        '           let color = rendererLightSSBO.values[i].LightColor.rgb * rendererLightSSBO.values[i].LightColor.w;',
        '           let pos = (rendererLightSSBO.values[i].LightPos).xyz;',
        '           let pointLight = PointLight(pos, color);',
        '           let result = calcPointLight(normal, V, fragPos, mat, pointLight);',
        '           diffuse += max(vec3<f32>(0), result.diffuse);',
        '           specular += max(vec3<f32>(0), result.specular);',
        '          }',
        '         // Directional light',
        '         case 1 {',
        '           let dir = normalize((rendererUBO.WCVCNormals * vec4<f32>(normalize(rendererLightSSBO.values[i].LightDir.xyz), 0.)).xyz);',
        '           let color = rendererLightSSBO.values[i].LightColor.rgb * rendererLightSSBO.values[i].LightColor.w;',
        '           let dirLight = DirectionalLight(dir, color);',
        '           let result = calcDirectionalLight(normal, V, mat, dirLight); // diffuseColor.rgb needs to be fixed with a more dynamic diffuse color',
        '           diffuse += max(vec3<f32>(0), result.diffuse);',
        '           specular += max(vec3<f32>(0), result.specular);',
        '         }',
        '         // Spot Light',
        '         case 2 {',
        '           let color = rendererLightSSBO.values[i].LightColor.rgb * rendererLightSSBO.values[i].LightColor.w;',
        '           let pos = (rendererLightSSBO.values[i].LightPos).xyz;',
        '           let dir = normalize((rendererUBO.WCVCNormals * vec4<f32>(normalize(rendererLightSSBO.values[i].LightDir.xyz), 0.)).xyz);',
        '           let cones = vec2<f32>(rendererLightSSBO.values[i].LightData.y, rendererLightSSBO.values[i].LightData.z);',
        '           let spotLight = SpotLight(pos, dir, cones, color);',
        '           let result = calcSpotLight(normal, V, fragPos, mat, spotLight);',
        '           diffuse += max(vec3<f32>(0), result.diffuse);',
        '           specular += max(vec3<f32>(0), result.specular);',
        '         }',
        '         default { continue; }',
        '       }',
        '      continuing { i++; }',
        '    }',
        '  }',
        // Final variables for combining specular and diffuse
        '  let fresnel = min(1.0, schlickFresnelIOR(V, normal, ior, k)); // Fresnel',
        '  // This could be controlled with its own variable (that isnt base color) for better artistic control',
        '  let fresnelMetallic = schlickFresnelRGB(V, normal, baseColor); // Fresnel for metal, takes color into account',
        '  let kS = min(vec3<f32>(1.0), mix(vec3<f32>(fresnel), fresnelMetallic, metallic));',
        '  let kD = (1.0 - kS) * (1.0 - metallic);',
        '  let specularMaterial = specularColor.rgb * specularColor.a;',
        '  let PBR = diffuseIntensity * kD * diffuse + kS * specularIntensity * specular * specularMaterial;',
        '  computedColor = vec4<f32>(PBR + emission, opacity);',
      ];
      if (renderer.getEnvironmentTexture()?.getImageLoaded()) {
        lightingCode.push(
          '  // To get diffuse IBL, the texture is sampled with normals in worldspace',
          '  let diffuseIBLCoords = (transpose(rendererUBO.WCVCNormals) * vec4<f32>(normal, 1.)).xyz;',
          '  let diffuseCoords = vecToRectCoord(diffuseIBLCoords);',
          '  // To get specular IBL, the texture is sampled as the worldspace reflection between the normal and view vectors',
          '  // Reflections are first calculated in viewspace, then converted to worldspace to sample the environment',
          '  let VreflN = normalize(reflect(-V, normal));',
          '  let reflectionIBLCoords = (transpose(rendererUBO.WCVCNormals) * vec4<f32>(VreflN, 1.)).xyz;',
          '  let specularCoords = vecToRectCoord(reflectionIBLCoords);',
          '  let diffuseIBL = textureSampleLevel(EnvironmentTexture, EnvironmentTextureSampler, diffuseCoords, rendererUBO.MaxEnvironmentMipLevel);',
          // Level multiplier should be set by UBO
          '  let level = roughness * rendererUBO.MaxEnvironmentMipLevel;',
          '  let specularIBL = textureSampleLevel(EnvironmentTexture, EnvironmentTextureSampler, specularCoords, level);', // Manual mip smoothing since not all formats support smooth level sampling
          '  let specularIBLContribution = specularIBL.rgb * rendererUBO.BackgroundSpecularStrength;',
          '  computedColor += vec4<f32>(specularIBLContribution * kS, 0);',
          '  let diffuseIBLContribution = diffuseIBL.rgb * rendererUBO.BackgroundDiffuseStrength;',
          '  computedColor += vec4<f32>(diffuseIBLContribution * baseColor * _ambientOcclusionMap.rgb * kD, 0);'
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
        '  let diffuse = diffuseColor.rgb;',
        '  let specular = specularColor.rgb * specularColor.a;',
        '  computedColor = vec4<f32>(diffuse * _diffuseMap.rgb, opacity);',
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

    // Check if using texture based coloring (color coordinates from mapper)
    const useTextureColoring =
      (model.renderable.getAreScalarsMappedFromCells() ||
        model.renderable.getInterpolateScalarsBeforeMapping?.()) &&
      model.renderable.getColorCoordinates() &&
      vertexInput.hasAttribute('tcoord') &&
      model.colorTexture;

    if (useTextureColoring) {
      // Use texture sampling for colors (cell scalars or interpolated point scalars)
      const fDesc = pipeline.getShaderDescription('fragment');
      let code = fDesc.getCode();
      code = vtkWebGPUShaderCache.substitute(code, '//VTK::Color::Impl', [
        'var texColor = textureSample(DiffuseTexture, DiffuseTextureSampler, input.tcoordVS);',
        'diffuseColor = vec4<f32>(texColor.rgb, 1.0);',
        'ambientColor = vec4<f32>(texColor.rgb, 1.0);',
        'opacity = opacity * texColor.a;',
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
      'opacity = opacity * input.color.a;',
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
    const arrayInfo = tcoords.getArrayInformation()[0];
    const numComp = vtkWebGPUTypes.getNumberOfComponentsFromBufferFormat(
      arrayInfo.format
    );
    const interpolation = arrayInfo.interpolation;
    let code = vDesc.getCode();
    vDesc.addOutput(`vec${numComp}<f32>`, 'tcoordVS', interpolation);
    code = vtkWebGPUShaderCache.substitute(code, '//VTK::TCoord::Impl', [
      '  output.tcoordVS = tcoord;',
    ]).result;
    vDesc.setCode(code);

    const fDesc = pipeline.getShaderDescription('fragment');
    code = fDesc.getCode();

    const actor = model.WebGPUActor.getRenderable();
    const property = actor.getProperty();

    const checkDims = (texture) => {
      if (!texture) return false;
      const dims = texture.getDimensionality();
      return dims === numComp;
    };

    const usedTextures = [];
    const diffuseTexture = property.getDiffuseTexture?.();

    if (
      diffuseTexture?.getImageLoaded() ||
      actor.getTextures()[0] ||
      model.colorTexture
    ) {
      if (
        // Chained or statements here are questionable
        checkDims(diffuseTexture) ||
        checkDims(actor.getTextures()[0]) ||
        checkDims(model.colorTexture)
      ) {
        usedTextures.push(
          '_diffuseMap = textureSample(DiffuseTexture, DiffuseTextureSampler, input.tcoordVS);'
        );
      }
    }

    const ormTexture = property.getORMTexture?.();
    const rmTexture = property.getRMTexture?.();
    const roughnessTexture = property.getRoughnessTexture?.();
    const metallicTexture = property.getMetallicTexture?.();
    const ambientOcclusionTexture = property.getAmbientOcclusionTexture?.();
    const emissionTexture = property.getEmissionTexture?.();
    const normalTexture = property.getNormalTexture?.();

    // ORM texture support: if present, sample R/G/B for AO/Roughness/Metallic
    if (ormTexture?.getImageLoaded()) {
      if (checkDims(ormTexture)) {
        usedTextures.push(
          'let ormSample = textureSample(ORMTexture, ORMTextureSampler, input.tcoordVS);',
          '_ambientOcclusionMap = ormSample.rrra;',
          '_roughnessMap = ormSample.ggga;',
          '_metallicMap = ormSample.bbba;'
        );
      }
    } else if (rmTexture?.getImageLoaded()) {
      if (checkDims(rmTexture)) {
        usedTextures.push(
          'let rmSample = textureSample(RMTexture, RMTextureSampler, input.tcoordVS);',
          '_roughnessMap = rmSample.ggga;',
          '_metallicMap = rmSample.bbba;'
        );
      }
    } else {
      if (roughnessTexture?.getImageLoaded()) {
        if (checkDims(roughnessTexture)) {
          usedTextures.push(
            '_roughnessMap = textureSample(RoughnessTexture, RoughnessTextureSampler, input.tcoordVS).ggga;'
          );
        }
      }
      if (metallicTexture?.getImageLoaded()) {
        if (checkDims(metallicTexture)) {
          usedTextures.push(
            '_metallicMap = textureSample(MetallicTexture, MetallicTextureSampler, input.tcoordVS).bbba;'
          );
        }
      }
      if (ambientOcclusionTexture?.getImageLoaded()) {
        if (checkDims(ambientOcclusionTexture)) {
          usedTextures.push(
            '_ambientOcclusionMap = textureSample(AmbientOcclusionTexture, AmbientOcclusionTextureSampler, input.tcoordVS).rrra;'
          );
        }
      }
    }
    if (emissionTexture?.getImageLoaded()) {
      if (checkDims(emissionTexture)) {
        usedTextures.push(
          '_emissionMap = textureSample(EmissionTexture, EmissionTextureSampler, input.tcoordVS);'
        );
      }
    }
    if (normalTexture?.getImageLoaded()) {
      if (checkDims(normalTexture)) {
        usedTextures.push(
          '_normalMap = textureSample(NormalTexture, NormalTextureSampler, input.tcoordVS);'
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
      const selectBuffer = vertexInput.getBuffer('selectId');
      if (selectBuffer) {
        const vDesc = pipeline.getShaderDescription('vertex');
        vDesc.addOutput(
          'u32',
          'attributeID',
          selectBuffer.getArrayInformation()[0].interpolation
        );
        vDesc.addOutput(
          'u32',
          'compositeID',
          selectBuffer.getArrayInformation()[0].interpolation
        );
        let code = vDesc.getCode();
        code = vtkWebGPUShaderCache.substitute(code, '//VTK::Select::Impl', [
          '  output.compositeID = 1u;',
          '  output.attributeID = selectId + 1u;',
        ]).result;
        vDesc.setCode(code);
      }

      const fDesc = pipeline.getShaderDescription('fragment');
      let code = fDesc.getCode();
      const selectImpl = selectBuffer
        ? [
            '  var compositeID: u32 = input.compositeID;',
            '  var attributeID: u32 = input.attributeID;',
          ]
        : ['  var compositeID: u32 = 0u;', '  var attributeID: u32 = 0u;'];
      code = vtkWebGPUShaderCache.substitute(
        code,
        '//VTK::Select::Impl',
        selectImpl
      ).result;
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

    // --- Index Buffer ---
    let indexBuffer = null;
    if (cells) {
      indexBuffer = device.getBufferManager().getBuffer({
        hash: `R${representation}P${primType}O${
          model.cellOffset
        }${cells.getMTime()}`,
        usage: BufferUsage.Index,
        cells,
        numberOfPoints: points.getNumberOfPoints(),
        primitiveType: primType,
        representation,
        cellOffset: model.cellOffset,
      });
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
    // --- Points Buffer ---
    if (points) {
      const shift = model.WebGPUActor.getBufferShift(model.WebGPURenderer);
      vertexInput.addBuffer(
        device.getBufferManager().getBuffer({
          hash: `${points.getMTime()}I${
            indexBuffer?.getMTime?.() ?? 0
          }${shift.join()}float32x4`,
          usage: BufferUsage.PointArray,
          format: 'float32x4',
          dataArray: points,
          indexBuffer,
          shift,
          packExtra: true,
        }),
        ['vertexBC']
      );
    } else {
      vertexInput.removeBufferIfPresent('vertexBC');
    }

    // --- Normals ---
    const usage = publicAPI.getUsage(representation, primType);
    model._usesCellNormals = false;
    // Add normals for triangles/strips, AND for lines in wireframe mode (converted from triangles)
    const isWireframeFromTriangles =
      representation === Representation.WIREFRAME &&
      (primType === PrimitiveTypes.Triangles ||
        primType === PrimitiveTypes.TriangleStrips);
    if (
      !model.is2D && // no lighting on Property2D
      (usage === BufferUsage.Triangles ||
        usage === BufferUsage.Strips ||
        isWireframeFromTriangles)
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
        vertexInput.addBuffer(
          device.getBufferManager().getBuffer(buffRequest),
          ['normalMC']
        );
      } else if (primType === PrimitiveTypes.Triangles) {
        model._usesCellNormals = true;
        buffRequest.hash = `PFN${points.getMTime()}I${indexBuffer.getMTime()}snorm8x4`;
        buffRequest.dataArray = points;
        buffRequest.cells = cells;
        buffRequest.usage = BufferUsage.NormalsFromPoints;
        buffRequest.cellOffset = model.cellOffset;
        vertexInput.addBuffer(
          device.getBufferManager().getBuffer(buffRequest),
          ['normalMC']
        );
      } else {
        vertexInput.removeBufferIfPresent('normalMC');
      }
    } else {
      vertexInput.removeBufferIfPresent('normalMC');
    }

    // --- Colors ---
    let haveColors = false;
    if (model.renderable.getScalarVisibility()) {
      const c = model.renderable.getColorMapColors();
      if (c && !edges) {
        const scalarMode = model.renderable.getScalarMode();
        // We must figure out how the scalars should be mapped to the polydata.
        const haveCellScalars =
          (scalarMode === ScalarMode.USE_CELL_DATA ||
            scalarMode === ScalarMode.USE_CELL_FIELD_DATA ||
            scalarMode === ScalarMode.USE_FIELD_DATA ||
            !pd.getPointData().getScalars()) &&
          scalarMode !== ScalarMode.USE_POINT_FIELD_DATA &&
          c;
        vertexInput.addBuffer(
          device.getBufferManager().getBuffer({
            usage: BufferUsage.PointArray,
            format: 'unorm8x4',
            hash: `${haveCellScalars}${c.getMTime()}I${indexBuffer.getMTime()}O${
              model.cellOffset
            }unorm8x4`,
            dataArray: c,
            indexBuffer,
            cellData: haveCellScalars,
            cellOffset: model.cellOffset,
          }),
          ['colorVI']
        );
        haveColors = true;
      }
    }
    if (!haveColors) vertexInput.removeBufferIfPresent('colorVI');

    // --- Texture Coordinates ---
    let tcoords = null;
    let useCellTCoords = false;
    if (
      (model.renderable.getAreScalarsMappedFromCells() ||
        model.renderable.getInterpolateScalarsBeforeMapping?.()) &&
      model.renderable.getColorCoordinates()
    ) {
      tcoords = model.renderable.getColorCoordinates();
      useCellTCoords = model.renderable.getAreScalarsMappedFromCells();
    } else {
      tcoords = pd.getPointData().getTCoords();
    }
    if (tcoords && !edges) {
      vertexInput.addBuffer(
        useCellTCoords
          ? device
              .getBufferManager()
              .getBufferForCellArray(
                tcoords,
                vertexInput.getIndexBuffer(),
                model.cellOffset
              )
          : device
              .getBufferManager()
              .getBufferForPointArray(tcoords, vertexInput.getIndexBuffer()),
        ['tcoord']
      );
    } else {
      vertexInput.removeBufferIfPresent('tcoord');
    }

    // --- Selection IDs ---
    const selector = model.WebGPURenderer?.getSelector?.();
    if (selector && !edges && indexBuffer) {
      let selectIds = null;
      if (
        selector.getFieldAssociation() ===
        FieldAssociations.FIELD_ASSOCIATION_POINTS
      ) {
        selectIds = indexBuffer.getFlatIdToPointId();
      } else if (
        selector.getFieldAssociation() ===
        FieldAssociations.FIELD_ASSOCIATION_CELLS
      ) {
        selectIds = indexBuffer.getFlatIdToCellId();
      }

      if (selectIds) {
        vertexInput.addBuffer(
          device.getBufferManager().getBuffer({
            hash: `sel${selector.getFieldAssociation()}I${indexBuffer.getMTime()}`,
            usage: BufferUsage.RawVertex,
            format: 'uint32',
            interpolation: 'flat',
            nativeArray:
              selectIds instanceof Uint32Array
                ? selectIds
                : Uint32Array.from(selectIds),
          }),
          ['selectId']
        );
      } else {
        vertexInput.removeBufferIfPresent('selectId');
      }
    } else {
      vertexInput.removeBufferIfPresent('selectId');
    }
  };

  publicAPI.updateTextures = () => {
    // Track textures in-use and new
    const usedTextures = [];
    const newTextures = [];

    // Add scalar color texture if available
    const idata = model.renderable.getColorTextureMap?.();
    if (idata && !model.colorTexture) {
      model.colorTexture = vtkTexture.newInstance({ label: 'polyDataColor' });
    }
    if (idata) {
      model.colorTexture.setInputData(idata);
      newTextures.push(['DiffuseTexture', model.colorTexture]);
    }

    const actor = model.WebGPUActor.getRenderable();
    const renderer = model.WebGPURenderer.getRenderable();
    const textures = [
      ['DiffuseTexture', actor.getProperty().getDiffuseTexture?.()],
      ['DiffuseTexture', actor.getTextures()[0]],
      ['DiffuseTexture', model.colorTexture],
      ['ORMTexture', actor.getProperty().getORMTexture?.()],
      ['RMTexture', actor.getProperty().getRMTexture?.()],
      ['RoughnessTexture', actor.getProperty().getRoughnessTexture?.()],
      ['MetallicTexture', actor.getProperty().getMetallicTexture?.()],
      ['NormalTexture', actor.getProperty().getNormalTexture?.()],
      [
        'AmbientOcclusionTexture',
        actor.getProperty().getAmbientOcclusionTexture?.(),
      ],
      ['EmissionTexture', actor.getProperty().getEmissionTexture?.()],
      ['EnvironmentTexture', renderer.getEnvironmentTexture?.()],
    ];
    textures.forEach(([name, tex]) => {
      if (!tex) return;
      if (
        tex.getInputData() ||
        tex.getJsImageData() ||
        tex.getCanvas() ||
        tex.getImageBitmap()
      ) {
        newTextures.push([name, tex]);
      }
      if (tex.getImage() && tex.getImageLoaded()) {
        newTextures.push([name, tex]);
      }
    });

    // Add textures to manager only if not present
    newTextures.forEach(([textureName, srcTexture]) => {
      const newTex = model.device
        .getTextureManager()
        .getTextureForVTKTexture(srcTexture, textureName);

      if (!newTex.getReady()) return;
      let found = false;
      for (let t = 0; t < model.textures.length; ++t) {
        if (model.textures[t] === newTex) {
          found = true;
          usedTextures[t] = true;
          break;
        }
      }
      if (!found) {
        usedTextures[model.textures.length] = true;
        const tview = newTex.createView(textureName);
        model.textures.push(newTex);
        model.textureViews.push(tview);

        // Sampler setup
        const interpolate = srcTexture.getInterpolate() ? 'linear' : 'nearest';
        let addressMode = null;
        if (srcTexture.getEdgeClamp() && srcTexture.getRepeat())
          addressMode = 'mirror-repeat';
        else if (srcTexture.getEdgeClamp()) addressMode = 'clamp-to-edge';
        else if (srcTexture.getRepeat()) addressMode = 'repeat';

        // Handle environment texture separately
        let options = {
          addressModeU: addressMode,
          addressModeV: addressMode,
          addressModeW: addressMode,
          minFilter: interpolate,
          magFilter: interpolate,
        };

        if (textureName === 'EnvironmentTexture') {
          options = {
            addressModeU: 'repeat',
            addressModeV: 'clamp-to-edge',
            addressModeW: 'repeat',
            minFilter: interpolate,
            magFilter: interpolate,
            mipmapFilter: 'linear',
          };
        }

        tview.addSampler(model.device, options);
      }
    });

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
    if (model.depthOnlyPass) {
      pipelineHash += 'd';
    }
    if (model.selectionPass) {
      pipelineHash += 's';
    }

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
    pipelineHash += `cm${publicAPI.getCullMode()}`;
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
  depthOnlyPass: false,
  selectionPass: false,
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

  // UBO
  model.UBO = vtkWebGPUUniformBuffer.newInstance({ label: 'mapperUBO' });
  model.UBO.addEntry('BCWCMatrix', 'mat4x4<f32>');
  model.UBO.addEntry('BCSCMatrix', 'mat4x4<f32>');
  model.UBO.addEntry('MCWCNormals', 'mat4x4<f32>');
  model.UBO.addEntry('AmbientColor', 'vec4<f32>');
  model.UBO.addEntry('AmbientColorBF', 'vec4<f32>');
  model.UBO.addEntry('DiffuseColor', 'vec4<f32>');
  model.UBO.addEntry('DiffuseColorBF', 'vec4<f32>');
  model.UBO.addEntry('EdgeColor', 'vec4<f32>');
  model.UBO.addEntry('SpecularColor', 'vec4<f32>');
  model.UBO.addEntry('SpecularColorBF', 'vec4<f32>');
  model.UBO.addEntry('AmbientIntensity', 'f32');
  model.UBO.addEntry('AmbientIntensityBF', 'f32');
  model.UBO.addEntry('DiffuseIntensity', 'f32');
  model.UBO.addEntry('DiffuseIntensityBF', 'f32');
  model.UBO.addEntry('Roughness', 'f32');
  model.UBO.addEntry('RoughnessBF', 'f32');
  model.UBO.addEntry('Metallic', 'f32');
  model.UBO.addEntry('MetallicBF', 'f32');
  model.UBO.addEntry('Ambient', 'f32');
  model.UBO.addEntry('Normal', 'f32');
  model.UBO.addEntry('Emission', 'f32');
  model.UBO.addEntry('EmissionBF', 'f32');
  model.UBO.addEntry('NormalStrength', 'f32');
  model.UBO.addEntry('NormalStrengthBF', 'f32');
  model.UBO.addEntry('BaseIOR', 'f32');
  model.UBO.addEntry('BaseIORBF', 'f32');
  model.UBO.addEntry('SpecularIntensity', 'f32');
  model.UBO.addEntry('SpecularIntensityBF', 'f32');
  model.UBO.addEntry('LineWidth', 'f32');
  model.UBO.addEntry('Opacity', 'f32');
  model.UBO.addEntry('OpacityBF', 'f32');
  model.UBO.addEntry('ZValue', 'f32');
  model.UBO.addEntry('CoincidentFactor', 'f32');
  model.UBO.addEntry('CoincidentOffset', 'f32');
  model.UBO.addEntry('PropID', 'u32');
  model.UBO.addEntry('ClipNear', 'f32');
  model.UBO.addEntry('ClipFar', 'f32');
  model.UBO.addEntry('Time', 'u32');
  addClipPlaneEntries(model.UBO, 'ClipPlane');
  model.UBO.addEntry('NumClipPlanes', 'u32');

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
  model.clipPlanes = Array.from({ length: MAX_CLIPPING_PLANES }, () => [
    0.0, 0.0, 0.0, 0.0,
  ]);

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
