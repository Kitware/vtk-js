export const vtkWebGPUPolyDataVS = `
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

export const vtkWebGPUPolyDataFS = `
const pi: f32 = 3.14159265359;
const epsilon: f32 = 0.000001;

// Khronos reference: Lambertian diffuse BRDF
fn BRDF_lambertian(diffuseColor: vec3<f32>) -> vec3<f32> {
  return diffuseColor / pi;
}

// Khronos D_GGX_anisotropic
fn D_GGX_anisotropic(NdH: f32, TdH: f32, BdH: f32, at: f32, ab: f32) -> f32 {
  var a2: f32 = at * ab;
  var v: vec3<f32> = vec3<f32>(ab * TdH, at * BdH, a2 * NdH);
  var v2: f32 = dot(v, v);
  return a2 * a2 / max(pi * v2 * v2, epsilon);
}

// Khronos V_GGX_anisotropic
fn V_GGX_anisotropic(at: f32, ab: f32, TdV: f32, BdV: f32, TdL: f32, BdL: f32, NdV: f32, NdL: f32) -> f32 {
  var lambdaV: f32 = NdL * length(vec3<f32>(at * TdV, ab * BdV, NdV));
  var lambdaL: f32 = NdV * length(vec3<f32>(at * TdL, ab * BdL, NdL));
  return 0.5 / max(lambdaV + lambdaL, epsilon);
}

// Schlick Fresnel with vec3 F0
fn fresnelSchlickVec3(F0: vec3<f32>, F90: vec3<f32>, HdL: f32) -> vec3<f32> {
  return F0 + (F90 - F0) * pow(1.0 - HdL, 5.0);
}

// Smith Joint GGX Visibility
// Note: Vis = G / (4 * NdotL * NdotV) — denominator is built in
fn V_GGX(NdL: f32, NdV: f32, alphaRoughness: f32) -> f32 {
  let a2 = alphaRoughness * alphaRoughness;
  let GGXV = NdL * sqrt(NdV * NdV * (1.0 - a2) + a2);
  let GGXL = NdV * sqrt(NdL * NdL * (1.0 - a2) + a2);
  let GGX = GGXV + GGXL;
  if (GGX >= epsilon) {
    return 0.5 / GGX;
  }
  return 0.0;
}

// GGX/Trowbridge Reitz NDF
fn D_GGX(NdH: f32, alphaRoughness: f32) -> f32 {
  let a2 = alphaRoughness * alphaRoughness;
  let f = (NdH * NdH) * (a2 - 1.0) + 1.0;
  return a2 / max(pi * f * f, epsilon);
}

// Khronos reference: BRDF_specularGGX = V_GGX * D_GGX (no Fresnel)
fn BRDF_specularGGX(alphaRoughness: f32, NdL: f32, NdV: f32, NdH: f32) -> f32 {
  return V_GGX(NdL, NdV, alphaRoughness) * D_GGX(NdH, alphaRoughness);
}

// Khronos BRDF_specularGGXAnisotropy (brdf.glsl) — V*D only, no Fresnel
fn specularAnisotropicBRDF(
  at: f32, ab: f32, L: vec3<f32>, T: vec3<f32>, B: vec3<f32>,
  H: vec3<f32>, TdV: f32, BdV: f32, NdH: f32, NdV: f32, NdL: f32
) -> f32 {
  var TdH: f32 = dot(T, H);
  var BdH: f32 = dot(B, H);
  var TdL: f32 = dot(T, L);
  var BdL: f32 = dot(B, L);
  var D: f32 = D_GGX_anisotropic(NdH, TdH, BdH, at, ab);
  var Vis: f32 = V_GGX_anisotropic(at, ab, TdV, BdV, TdL, BdL, NdV, NdL);
  return D * Vis;
}

// Clearcoat BRDF without Fresnel
fn clearcoatBRDF(NdH: f32, NdV: f32, NdL: f32, roughness: f32) -> f32 {
  let alpha = roughness * roughness;
  return BRDF_specularGGX(alpha, NdL, NdV, NdH);
}

// Per light transmission BTDF
fn applyIorToRoughness(roughness: f32, ior: f32) -> f32 {
  return roughness * clamp(ior * 2.0 - 2.0, 0.0, 1.0);
}

fn getPunctualRadianceTransmission(n: vec3<f32>, v: vec3<f32>, l: vec3<f32>, alphaRoughness: f32, baseColor: vec3<f32>, ior: f32) -> vec3<f32> {
  let transmissionRoughness = applyIorToRoughness(alphaRoughness, ior);
  let l_mirror = normalize(l + 2.0 * n * dot(-l, n));
  let h = normalize(l_mirror + v);
  let NdH = clamp(dot(n, h), 0.0, 1.0);
  let NdL = clamp(dot(n, l_mirror), 0.0, 1.0);
  let NdV = clamp(dot(n, v), 0.0, 1.0);
  let D = D_GGX(NdH, transmissionRoughness);
  let Vis = V_GGX(NdL, NdV, transmissionRoughness);
  return baseColor * D * Vis;
}

// Volume attenuation (Beer's law)
fn applyVolumeAttenuation(radiance: vec3<f32>, transmissionDistance: f32, attenuationColor: vec3<f32>, attenuationDistance: f32) -> vec3<f32> {
  if (attenuationDistance <= 0.0) {
    return radiance;
  }
  let transmittance = pow(max(attenuationColor, vec3<f32>(0.0001)), vec3<f32>(transmissionDistance / max(attenuationDistance, epsilon)));
  return transmittance * radiance;
}

// Thin film iridescence (KHR_materials_iridescence)
// Ref: https://belcour.github.io/blog/research/2017/05/01/brdf-thin-film.html

fn sq(x: f32) -> f32 { return x * x; }
fn sqVec3(x: vec3<f32>) -> vec3<f32> { return x * x; }

fn xyzToSRGB(xyz: vec3<f32>) -> vec3<f32> {
  return vec3<f32>(
    3.2404542 * xyz.x - 1.5371385 * xyz.y - 0.4985314 * xyz.z,
    -0.9692660 * xyz.x + 1.8760108 * xyz.y + 0.0415560 * xyz.z,
    0.0556434 * xyz.x - 0.2040259 * xyz.y + 1.0572252 * xyz.z
  );
}

fn fresnel0ToIor(f0: vec3<f32>) -> vec3<f32> {
  let sqrtF0 = sqrt(f0);
  return vec3<f32>(
    (1.0 + sqrtF0.x) / max(1.0 - sqrtF0.x, epsilon),
    (1.0 + sqrtF0.y) / max(1.0 - sqrtF0.y, epsilon),
    (1.0 + sqrtF0.z) / max(1.0 - sqrtF0.z, epsilon)
  );
}

fn iorToFresnel0Vec3(transmittedIor: vec3<f32>, incidentIor: f32) -> vec3<f32> {
  let numerator = transmittedIor - vec3<f32>(incidentIor);
  let denominator = transmittedIor + vec3<f32>(incidentIor);
  return vec3<f32>(
    sq(numerator.x / max(denominator.x, epsilon)),
    sq(numerator.y / max(denominator.y, epsilon)),
    sq(numerator.z / max(denominator.z, epsilon))
  );
}

fn iorToFresnel0(transmittedIor: f32, incidentIor: f32) -> f32 {
  return sq((transmittedIor - incidentIor) / max(transmittedIor + incidentIor, epsilon));
}

fn fresnelSchlickScalar(f0: f32, cosTheta: f32) -> f32 {
  return f0 + (1.0 - f0) * pow(1.0 - cosTheta, 5.0);
}

fn fresnelSchlickScalarVec3(f0: vec3<f32>, cosTheta: f32) -> vec3<f32> {
  return f0 + (vec3<f32>(1.0) - f0) * pow(1.0 - cosTheta, 5.0);
}

fn evalSensitivity(OPD: f32, shift: vec3<f32>) -> vec3<f32> {
  let phase = 2.0 * pi * OPD * 1.0e-9;
  let val = vec3<f32>(5.4856e-13, 4.4201e-13, 5.2481e-13);
  let pos = vec3<f32>(1.6810e+06, 1.7953e+06, 2.2084e+06);
  let vr = vec3<f32>(4.3278e+09, 9.3046e+09, 6.6121e+09);
  var xyz = val * sqrt(2.0 * pi * vr) * cos(pos * phase + shift) * exp(-sqVec3(vec3<f32>(phase)) * vr);
  xyz.x += 9.7470e-14 * sqrt(2.0 * pi * 4.5282e+09) * cos(2.2399e+06 * phase + shift.x) * exp(-4.5282e+09 * sq(phase));
  xyz = xyz / 1.0685e-7;
  return xyzToSRGB(xyz);
}

fn evalIridescence(outsideIOR: f32, eta2: f32, cosTheta1: f32, thinFilmThickness: f32, baseF0: vec3<f32>) -> vec3<f32> {
  let iridescenceIor = mix(outsideIOR, eta2, smoothstep(0.0, 0.03, thinFilmThickness));
  let sinTheta2Sq = sq(outsideIOR / max(iridescenceIor, epsilon)) * (1.0 - sq(cosTheta1));
  let cosTheta2Sq = 1.0 - sinTheta2Sq;
  if (cosTheta2Sq < 0.0) { return vec3<f32>(1.0); }
  let cosTheta2 = sqrt(cosTheta2Sq);

  let R0 = iorToFresnel0(iridescenceIor, outsideIOR);
  let R12 = fresnelSchlickScalar(R0, cosTheta1);
  let T121 = 1.0 - R12;
  var phi12: f32 = 0.0;
  if (iridescenceIor < outsideIOR) { phi12 = pi; }
  let phi21 = pi - phi12;

  let baseIOR = fresnel0ToIor(clamp(baseF0, vec3<f32>(0.0), vec3<f32>(0.9999)));
  let R1 = iorToFresnel0Vec3(baseIOR, iridescenceIor);
  let R23 = fresnelSchlickScalarVec3(R1, cosTheta2);
  var phi23 = vec3<f32>(0.0);
  if (baseIOR.x < iridescenceIor) { phi23.x = pi; }
  if (baseIOR.y < iridescenceIor) { phi23.y = pi; }
  if (baseIOR.z < iridescenceIor) { phi23.z = pi; }

  let OPD = 2.0 * iridescenceIor * thinFilmThickness * cosTheta2;
  let phi = vec3<f32>(phi21) + phi23;

  let R123 = clamp(R12 * R23, vec3<f32>(1e-5), vec3<f32>(0.9999));
  let r123 = sqrt(R123);
  let Rs = vec3<f32>(sq(T121)) * R23 / (vec3<f32>(1.0) - R123);

  var I = vec3<f32>(R12) + Rs;
  var Cm = Rs - vec3<f32>(T121);
  Cm = Cm * r123;
  I += Cm * 2.0 * evalSensitivity(1.0 * OPD, 1.0 * phi);
  Cm = Cm * r123;
  I += Cm * 2.0 * evalSensitivity(2.0 * OPD, 2.0 * phi);

  return max(I, vec3<f32>(0.0));
}

// Sheen BRDF
// Charlie distribution for velvet/fabric
fn distributionCharlie(sheenRoughness: f32, NdotH: f32) -> f32 {
  let alphaG = sheenRoughness * sheenRoughness;
  let invAlpha = 1.0 / max(alphaG, epsilon);
  let cos2h = NdotH * NdotH;
  let sin2h = max(1.0 - cos2h, 0.0);
  return (2.0 + invAlpha) * pow(sin2h, invAlpha * 0.5) / (2.0 * pi);
}

// Sheen visibility (Khronos reference: V_Sheen from brdf.glsl)
fn lambdaSheenNumericHelper(x: f32, alphaG: f32) -> f32 {
  let oneMinusAlphaSq = (1.0 - alphaG) * (1.0 - alphaG);
  let a = mix(21.5473, 25.3245, oneMinusAlphaSq);
  let b = mix(3.82987, 3.32435, oneMinusAlphaSq);
  let c = mix(0.19823, 0.16801, oneMinusAlphaSq);
  let d = mix(-1.97760, -1.27393, oneMinusAlphaSq);
  let e = mix(-4.32054, -4.85967, oneMinusAlphaSq);
  return a / (1.0 + b * pow(x, c)) + d * x + e;
}

fn lambdaSheen(cosTheta: f32, alphaG: f32) -> f32 {
  if (abs(cosTheta) < 0.5) {
    return exp(lambdaSheenNumericHelper(cosTheta, alphaG));
  }
  return exp(2.0 * lambdaSheenNumericHelper(0.5, alphaG) - lambdaSheenNumericHelper(1.0 - cosTheta, alphaG));
}

fn V_Sheen(NdL: f32, NdV: f32, sheenRoughness: f32) -> f32 {
  let sr = max(sheenRoughness, epsilon);
  let alphaG = sr * sr;
  let visibility = (1.0 + lambdaSheen(NdV, alphaG) + lambdaSheen(NdL, alphaG)) *
    (4.0 * NdV * NdL);
  return clamp(1.0 / max(visibility, epsilon), 0.0, 1.0);
}

// IBL helper functions
// Karis analytical approximation of the BRDF LUT (replaces u_GGXLUT texture)
fn EnvBRDFApprox(NdotV: f32, roughness: f32) -> vec2<f32> {
  let c0 = vec4<f32>(-1.0, -0.0275, -0.572, 0.022);
  let c1 = vec4<f32>(1.0, 0.0425, 1.04, -0.04);
  let r = roughness * c0 + c1;
  let a004 = min(r.x * r.x, exp2(-9.28 * NdotV)) * r.x + r.y;
  return vec2<f32>(-1.04, 1.04) * a004 + r.zw;
}

// Roughness dependent Fresnel with multi-scattering (Fdez-Aguera)
fn getIBLGGXFresnel(NdotV: f32, roughness: f32, F0: vec3<f32>, specularWeight: f32) -> vec3<f32> {
  let f_ab = EnvBRDFApprox(NdotV, roughness);
  let Fr = max(vec3<f32>(1.0 - roughness), F0) - F0;
  let k_S = F0 + Fr * pow(1.0 - NdotV, 5.0);
  let FssEss = specularWeight * (k_S * f_ab.x + f_ab.y);
  // Multi-scattering correction (Fdez-Aguera)
  let Ems = 1.0 - (f_ab.x + f_ab.y);
  let F_avg = specularWeight * (F0 + (1.0 - F0) / 21.0);
  let FmsEms = Ems * FssEss * F_avg / max(1.0 - F_avg * Ems, vec3<f32>(epsilon));
  return FssEss + FmsEms;
}

// Per channel Fresnel mix for iridescence IBL
fn rgb_mix(base: vec3<f32>, layer: vec3<f32>, rgb_alpha: vec3<f32>) -> vec3<f32> {
  let rgb_alpha_max = max(rgb_alpha.r, max(rgb_alpha.g, rgb_alpha.b));
  return (1.0 - rgb_alpha_max) * base + rgb_alpha * layer;
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

  // Resolve actual front facing (accounts for negative scale transforms)
  var isFront: bool = input.frontFacing;
  if (mapperUBO.FlipFrontFacing > 0.5) { isFront = !isFront; }

  if (!isFront) {
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
  var _anisotropyMap: vec4<f32> = vec4<f32>(1.0, 0.5, 1.0, 1.0);
  var _coatMap: vec4<f32> = vec4<f32>(1.0);
  var _coatRoughnessMap: vec4<f32> = vec4<f32>(1.0);
  var _coatNormalMap: vec4<f32> = vec4<f32>(0.0, 0.0, 1.0, 0.0);
  var _displacementMap: vec4<f32> = vec4<f32>(0.0);
  var _transmissionMap: vec4<f32> = vec4<f32>(1.0);
  var _thicknessMap: vec4<f32> = vec4<f32>(1.0);
  var _iridescenceMap: vec4<f32> = vec4<f32>(1.0);
  var _iridescenceThicknessMap: vec4<f32> = vec4<f32>(1.0);
  var _sheenColorMap: vec4<f32> = vec4<f32>(1.0);
  var _sheenRoughnessMap: vec4<f32> = vec4<f32>(1.0);
  var _diffuseTransmissionMap: vec4<f32> = vec4<f32>(1.0);
  var _diffuseTransmissionColorMap: vec4<f32> = vec4<f32>(1.0);
  var _specularMap: vec4<f32> = vec4<f32>(1.0);
  var _specularColorMap: vec4<f32> = vec4<f32>(1.0);

  //VTK::Color::Impl

  //VTK::TCoord::Impl

  //VTK::Normal::Impl

  var computedColor: vec4<f32> = vec4<f32>(diffuseColor.rgb, 1.0);

  //VTK::Light::Impl

  //VTK::Select::Impl

  //VTK::Alpha::Impl

  //VTK::Position::Impl

  //VTK::RenderEncoder::Impl

  return output;
}
`;
