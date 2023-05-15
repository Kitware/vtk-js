//VTK::System::Dec

/*=========================================================================

  Program:   Visualization Toolkit
  Module:    vtkVolumeFS.glsl

  Copyright (c) Ken Martin, Will Schroeder, Bill Lorensen
  All rights reserved.
  See Copyright.txt or http://www.kitware.com/Copyright.htm for details.

     This software is distributed WITHOUT ANY WARRANTY; without even
     the implied warranty of MERCHANTABILITY or FITNESS FOR A PARTICULAR
     PURPOSE.  See the above copyright notice for more information.

=========================================================================*/
// Template for the volume mappers fragment shader

// the output of this shader
//VTK::Output::Dec

varying vec3 vertexVCVSOutput;

// first declare the settings from the mapper
// that impact the code paths in here

// always set vtkNumComponents 1,2,3,4
//VTK::NumComponents

// possibly define vtkTrilinearOn
//VTK::TrilinearOn

// possibly define vtkIndependentComponents
//VTK::IndependentComponentsOn

// possibly define any "proportional" components
//VTK::vtkProportionalComponents

// Define the blend mode to use
#define vtkBlendMode //VTK::BlendMode

// Possibly define vtkImageLabelOutlineOn
//VTK::ImageLabelOutlineOn

#ifdef vtkImageLabelOutlineOn
uniform int outlineThickness;
uniform float outlineOpacity;
uniform float vpWidth;
uniform float vpHeight;
uniform float vpOffsetX;
uniform float vpOffsetY;
uniform mat4 PCWCMatrix;
uniform mat4 vWCtoIDX;
#endif

// define vtkLightComplexity
//VTK::LightComplexity
#if vtkLightComplexity > 0
uniform float vSpecularPower;
uniform float vAmbient;
uniform float vDiffuse;
uniform float vSpecular;
//VTK::Light::Dec
#endif

//VTK::VolumeShadowOn
//VTK::SurfaceShadowOn
//VTK::localAmbientOcclusionOn
//VTK::LAO::Dec
//VTK::VolumeShadow::Dec

// define vtkComputeNormalFromOpacity
//VTK::vtkComputeNormalFromOpacity

// possibly define vtkGradientOpacityOn
//VTK::GradientOpacityOn
#ifdef vtkGradientOpacityOn
uniform float goscale0;
uniform float goshift0;
uniform float gomin0;
uniform float gomax0;
#if defined(vtkIndependentComponentsOn) && (vtkNumComponents > 1)
uniform float goscale1;
uniform float goshift1;
uniform float gomin1;
uniform float gomax1;
#if vtkNumComponents >= 3
uniform float goscale2;
uniform float goshift2;
uniform float gomin2;
uniform float gomax2;
#endif
#if vtkNumComponents >= 4
uniform float goscale3;
uniform float goshift3;
uniform float gomin3;
uniform float gomax3;
#endif
#endif
#endif

// if you want to see the raw tiled
// data in webgl1 uncomment the following line
// #define debugtile

// camera values
uniform float camThick;
uniform float camNear;
uniform float camFar;
uniform int cameraParallel;

// values describing the volume geometry
uniform vec3 vOriginVC;
uniform vec3 vSpacing;
uniform ivec3 volumeDimensions; // 3d texture dimensions
uniform vec3 vPlaneNormal0;
uniform float vPlaneDistance0;
uniform vec3 vPlaneNormal1;
uniform float vPlaneDistance1;
uniform vec3 vPlaneNormal2;
uniform float vPlaneDistance2;
uniform vec3 vPlaneNormal3;
uniform float vPlaneDistance3;
uniform vec3 vPlaneNormal4;
uniform float vPlaneDistance4;
uniform vec3 vPlaneNormal5;
uniform float vPlaneDistance5;

//VTK::ClipPlane::Dec

// opacity and color textures
uniform sampler2D otexture;
uniform float oshift0;
uniform float oscale0;
uniform sampler2D ctexture;
uniform float cshift0;
uniform float cscale0;

// jitter texture
uniform sampler2D jtexture;

// some 3D texture values
uniform float sampleDistance;
uniform vec3 vVCToIJK;

// the heights defined below are the locations
// for the up to four components of the tfuns
// the tfuns have a height of 2XnumComps pixels so the
// values are computed to hit the middle of the two rows
// for that component
#ifdef vtkIndependentComponentsOn
#if vtkNumComponents == 2
uniform float mix0;
uniform float mix1;
#define height0 0.25
#define height1 0.75
#endif
#if vtkNumComponents == 3
uniform float mix0;
uniform float mix1;
uniform float mix2;
#define height0 0.17
#define height1 0.5
#define height2 0.83
#endif
#if vtkNumComponents == 4
uniform float mix0;
uniform float mix1;
uniform float mix2;
uniform float mix3;
#define height0 0.125
#define height1 0.375
#define height2 0.625
#define height3 0.875
#endif
#endif

#if vtkNumComponents >= 2
uniform float oshift1;
uniform float oscale1;
uniform float cshift1;
uniform float cscale1;
#endif
#if vtkNumComponents >= 3
uniform float oshift2;
uniform float oscale2;
uniform float cshift2;
uniform float cscale2;
#endif
#if vtkNumComponents >= 4
uniform float oshift3;
uniform float oscale3;
uniform float cshift3;
uniform float cscale3;
#endif

uniform vec4 ipScalarRangeMin;
uniform vec4 ipScalarRangeMax;

// declaration for intermixed geometry
//VTK::ZBuffer::Dec

//=======================================================================
// global and custom variables (a temporary section before photorealistics rendering module is complete)
vec3 rayDirVC;
float sampleDistanceISVS;
float sampleDistanceIS;

#define SQRT3    1.7321
#define INV4PI   0.0796
#define EPSILON  0.001
#define PI       3.1415
#define PI2      9.8696

//=======================================================================
// Webgl2 specific version of functions
#if __VERSION__ == 300

uniform highp sampler3D texture1;

vec4 getTextureValue(vec3 pos)
{
  vec4 tmp = texture(texture1, pos);
#if vtkNumComponents == 1
  tmp.a = tmp.r;
#endif
#if vtkNumComponents == 2
  tmp.a = tmp.g;
#endif
#if vtkNumComponents == 3
  tmp.a = length(tmp.rgb);
#endif
  return tmp;
}

//=======================================================================
// WebGL1 specific version of functions
#else

uniform sampler2D texture1;

uniform float texWidth;
uniform float texHeight;
uniform int xreps;
uniform int xstride;
uniform int ystride;

// if computing trilinear values from multiple z slices
#ifdef vtkTrilinearOn
vec4 getTextureValue(vec3 ijk)
{
  float zoff = 1.0/float(volumeDimensions.z);
  vec4 val1 = getOneTextureValue(ijk);
  vec4 val2 = getOneTextureValue(vec3(ijk.xy, ijk.z + zoff));

  float indexZ = float(volumeDimensions)*ijk.z;
  float zmix =  indexZ - floor(indexZ);

  return mix(val1, val2, zmix);
}

vec4 getOneTextureValue(vec3 ijk)
#else // nearest or fast linear
vec4 getTextureValue(vec3 ijk)
#endif
{
  vec3 tdims = vec3(volumeDimensions);

#ifdef debugtile
  vec2 tpos = vec2(ijk.x, ijk.y);
  vec4 tmp = texture2D(texture1, tpos);
  tmp.a = 1.0;

#else
  int z = int(ijk.z * tdims.z);
  int yz = z / xreps;
  int xz = z - yz*xreps;

  int tileWidth = volumeDimensions.x/xstride;
  int tileHeight = volumeDimensions.y/ystride;

  xz *= tileWidth;
  yz *= tileHeight;

  float ni = float(xz) + (ijk.x*float(tileWidth));
  float nj = float(yz) + (ijk.y*float(tileHeight));

  vec2 tpos = vec2(ni/texWidth, nj/texHeight);

  vec4 tmp = texture2D(texture1, tpos);

#if vtkNumComponents == 1
  tmp.a = tmp.r;
#endif
#if vtkNumComponents == 2
  tmp.g = tmp.a;
#endif
#if vtkNumComponents == 3
  tmp.a = length(tmp.rgb);
#endif
#endif

  return tmp;
}

// End of Webgl1 specific code
//=======================================================================
#endif

//=======================================================================
// transformation between VC and IS space

// convert vector position from idx to vc
#if (vtkLightComplexity > 0) || (defined vtkClippingPlanesOn)
vec3 IStoVC(vec3 posIS){
  vec3 posVC = posIS / vVCToIJK;
  return posVC.x * vPlaneNormal0 +
         posVC.y * vPlaneNormal2 +
         posVC.z * vPlaneNormal4 +
         vOriginVC;
}

// convert vector position from vc to idx
vec3 VCtoIS(vec3 posVC){
  posVC = posVC - vOriginVC;
  posVC = vec3(
    dot(posVC, vPlaneNormal0),
    dot(posVC, vPlaneNormal2),
    dot(posVC, vPlaneNormal4));
  return posVC * vVCToIJK;
}
#endif

//Rotate vector to view coordinate
#if (vtkLightComplexity > 0) || (defined vtkGradientOpacityOn)
void rotateToViewCoord(inout vec3 dirIS){
  dirIS.xyz =
    dirIS.x * vPlaneNormal0 +
    dirIS.y * vPlaneNormal2 +
    dirIS.z * vPlaneNormal4;
}

//Rotate vector to idx coordinate
vec3 rotateToIDX(vec3 dirVC){
  vec3 dirIS;
  dirIS.xyz = vec3(
    dot(dirVC, vPlaneNormal0),
    dot(dirVC, vPlaneNormal2),
    dot(dirVC, vPlaneNormal4));
  return dirIS;
}
#endif

//=======================================================================
// Given a normal compute the gradient opacity factors
float computeGradientOpacityFactor(
  float normalMag, float goscale, float goshift, float gomin, float gomax)
{
#if defined(vtkGradientOpacityOn)
  return clamp(normalMag * goscale + goshift, gomin, gomax);
#else
  return 1.0;
#endif
}

//=======================================================================
// compute the normal and gradient magnitude for a position, uses forward difference
#if (vtkLightComplexity > 0) || (defined vtkGradientOpacityOn)
#ifdef vtkClippingPlanesOn
  void adjustClippedVoxelValues(vec3 pos, vec3 texPos[3], inout vec3 g1)
  {
    vec3 g1VC[3];
    for (int i = 0; i < 3; ++i)
    {
      g1VC[i] = IStoVC(texPos[i]);
    }
    vec3 posVC = IStoVC(pos);
    for (int i = 0; i < clip_numPlanes; ++i)
    {
      for (int j = 0; j < 3; ++j)
      {
        if(dot(vec3(vClipPlaneOrigins[i] - g1VC[j].xyz), vClipPlaneNormals[i]) > 0.0)
        {
          g1[j] = 0.0;
        }
      }
    }
  }
#endif

  #ifdef vtkComputeNormalFromOpacity
    #ifdef vtkGradientOpacityOn
      vec4 computeDensityNormal(float gradientMag, vec3 scalarInterp[2])
      {
    #else
      //if gradient opacity not on but using density gradient
      vec4 computeDensityNormal(vec3 scalarInterp[2])
      {
    #endif
        vec3 opacityG1, opacityG2;
        opacityG1.x = texture2D(otexture, vec2(scalarInterp[0].x * oscale0 + oshift0, 0.5)).r;
        opacityG1.y = texture2D(otexture, vec2(scalarInterp[0].y * oscale0 + oshift0, 0.5)).r;
        opacityG1.z = texture2D(otexture, vec2(scalarInterp[0].z * oscale0 + oshift0, 0.5)).r;
        opacityG2.x = texture2D(otexture, vec2(scalarInterp[1].x * oscale0 + oshift0, 0.5)).r;
        opacityG2.y = texture2D(otexture, vec2(scalarInterp[1].y * oscale0 + oshift0, 0.5)).r;
        opacityG2.z = texture2D(otexture, vec2(scalarInterp[1].z * oscale0 + oshift0, 0.5)).r;
    #ifdef vtkGradientOpacityOn
        float gradOpacityFactor = 1.0f;
        if (gradientMag >= 0.0){
          gradOpacityFactor = computeGradientOpacityFactor(gradientMag, goscale0, goshift0, gomin0, gomax0);
        }
        opacityG1.xyz *= gradOpacityFactor;
        opacityG2.xyz *= gradOpacityFactor;
    #endif

        vec4 opacityG = vec4(opacityG1 - opacityG2, 1.0f);
        // divide by spacing
        opacityG.xyz /= vSpacing;
        opacityG.w = length(opacityG.xyz);
        // rotate to View Coords
        rotateToViewCoord(opacityG.xyz);
        if (length(opacityG.xyz) > 0.0) {
          return vec4(normalize(opacityG.xyz),opacityG.w);
        } else {
          return vec4(0.0);
        }
      }

      vec4 computeNormalForDensity(vec3 pos, vec3 tstep, out vec3 scalarInterp[2])
      {
        vec3 xvec = vec3(tstep.x, 0.0, 0.0);
        vec3 yvec = vec3(0.0, tstep.y, 0.0);
        vec3 zvec = vec3(0.0, 0.0, tstep.z);
        vec3 texPosPVec[3];
        texPosPVec[0] = pos + xvec;
        texPosPVec[1] = pos + yvec;
        texPosPVec[2] = pos + zvec;
        vec3 texPosNVec[3];
        texPosNVec[0] = pos - xvec;
        texPosNVec[1] = pos - yvec;
        texPosNVec[2] = pos - zvec;
        vec3 g1, g2;

        scalarInterp[0].x = getTextureValue(texPosPVec[0]).a;
        scalarInterp[0].y = getTextureValue(texPosPVec[1]).a;
        scalarInterp[0].z = getTextureValue(texPosPVec[2]).a;
        scalarInterp[1].x = getTextureValue(texPosNVec[0]).a;
        scalarInterp[1].y = getTextureValue(texPosNVec[1]).a;
        scalarInterp[1].z = getTextureValue(texPosNVec[2]).a;

        #ifdef vtkClippingPlanesOn
          adjustClippedVoxelValues(pos, texPosPVec, scalarInterp[0]);
          adjustClippedVoxelValues(pos, texPosNVec, scalarInterp[1]);
        #endif
        vec4 result;
        result.x = scalarInterp[0].x - scalarInterp[1].x;
        result.y = scalarInterp[0].y - scalarInterp[1].y;
        result.z = scalarInterp[0].z - scalarInterp[1].z;
        // divide by spacing
        result.xyz /= vSpacing;
        result.w = length(result.xyz);
        // rotate to View Coords
        rotateToViewCoord(result.xyz);
        if (length(result.xyz) > 0.0) {
          return vec4(normalize(result.xyz),result.w);
        } else {
          return vec4(0.0);
        }
      }
  #endif

  vec4 computeNormal(vec3 pos, vec3 tstep)
  {
    vec3 xvec = vec3(tstep.x, 0.0, 0.0);
    vec3 yvec = vec3(0.0, tstep.y, 0.0);
    vec3 zvec = vec3(0.0, 0.0, tstep.z);
    vec3 texPosPVec[3];
    texPosPVec[0] = pos + xvec;
    texPosPVec[1] = pos + yvec;
    texPosPVec[2] = pos + zvec;
    vec3 texPosNVec[3];
    texPosNVec[0] = pos - xvec;
    texPosNVec[1] = pos - yvec;
    texPosNVec[2] = pos - zvec;
    vec3 g1, g2;
    g1.x = getTextureValue(texPosPVec[0]).a;
    g1.y = getTextureValue(texPosPVec[1]).a;
    g1.z = getTextureValue(texPosPVec[2]).a;
    g2.x = getTextureValue(texPosNVec[0]).a;
    g2.y = getTextureValue(texPosNVec[1]).a;
    g2.z = getTextureValue(texPosNVec[2]).a;
    #ifdef vtkClippingPlanesOn
      adjustClippedVoxelValues(pos, texPosPVec, g1);
      adjustClippedVoxelValues(pos, texPosNVec, g2);
    #endif
    vec4 result;
    result = vec4(g1 - g2, -1.0);
    // divide by spacing
    result.xyz /= vSpacing;
    result.w = length(result.xyz);
    if (result.w > 0.0){
      // rotate to View Coords
      rotateToViewCoord(result.xyz);
      return vec4(normalize(result.xyz),result.w);
    } else {
      return vec4(0.0);
    }
  }
#endif

#ifdef vtkImageLabelOutlineOn
vec3 fragCoordToIndexSpace(vec4 fragCoord) {
  vec4 pcPos = vec4(
    (fragCoord.x / vpWidth - vpOffsetX - 0.5) * 2.0,
    (fragCoord.y / vpHeight - vpOffsetY - 0.5) * 2.0,
    (fragCoord.z - 0.5) * 2.0,
    1.0);

  vec4 worldCoord = PCWCMatrix * pcPos;
  vec4 vertex = (worldCoord/worldCoord.w);

  vec3 index = (vWCtoIDX * vertex).xyz;

  // half voxel fix for labelmapOutline
  return (index + vec3(0.5)) / vec3(volumeDimensions);
}
#endif

//=======================================================================
// compute the normals and gradient magnitudes for a position
// for independent components
mat4 computeMat4Normal(vec3 pos, vec4 tValue, vec3 tstep)
{
  mat4 result;
  vec4 distX = getTextureValue(pos + vec3(tstep.x, 0.0, 0.0)) - tValue;
  vec4 distY = getTextureValue(pos + vec3(0.0, tstep.y, 0.0)) - tValue;
  vec4 distZ = getTextureValue(pos + vec3(0.0, 0.0, tstep.z)) - tValue;

  // divide by spacing
  distX /= vSpacing.x;
  distY /= vSpacing.y;
  distZ /= vSpacing.z;

  mat3 rot;
  rot[0] = vPlaneNormal0;
  rot[1] = vPlaneNormal2;
  rot[2] = vPlaneNormal4;

#if !defined(vtkComponent0Proportional)
  result[0].xyz = vec3(distX.r, distY.r, distZ.r);
  result[0].a = length(result[0].xyz);
  result[0].xyz *= rot;
  if (result[0].w > 0.0)
  {
    result[0].xyz /= result[0].w;
  }
#endif

// optionally compute the 2nd component
#if vtkNumComponents >= 2 && !defined(vtkComponent1Proportional)
  result[1].xyz = vec3(distX.g, distY.g, distZ.g);
  result[1].a = length(result[1].xyz);
  result[1].xyz *= rot;
  if (result[1].w > 0.0)
  {
    result[1].xyz /= result[1].w;
  }
#endif

// optionally compute the 3rd component
#if vtkNumComponents >= 3 && !defined(vtkComponent2Proportional)
  result[2].xyz = vec3(distX.b, distY.b, distZ.b);
  result[2].a = length(result[2].xyz);
  result[2].xyz *= rot;
  if (result[2].w > 0.0)
  {
    result[2].xyz /= result[2].w;
  }
#endif

// optionally compute the 4th component
#if vtkNumComponents >= 4 && !defined(vtkComponent3Proportional)
  result[3].xyz = vec3(distX.a, distY.a, distZ.a);
  result[3].a = length(result[3].xyz);
  result[3].xyz *= rot;
  if (result[3].w > 0.0)
  {
    result[3].xyz /= result[3].w;
  }
#endif

  return result;
}

//=======================================================================
// global shadow - secondary ray
#if defined(VolumeShadowOn) || defined(localAmbientOcclusionOn)
float random()
{
  float rand = fract(sin(dot(gl_FragCoord.xy,vec2(12.9898,78.233)))*43758.5453123);
  float jitter=texture2D(jtexture,gl_FragCoord.xy/32.).r;
  uint pcg_state = floatBitsToUint(jitter);
  uint state = pcg_state;
  pcg_state = pcg_state * uint(747796405) + uint(2891336453);
  uint word = ((state >> ((state >> uint(28)) + uint(4))) ^ state) * uint(277803737);
  return (float((((word >> uint(22)) ^ word) >> 1 ))/float(2147483647) + rand)/2.0;
}
#endif

#ifdef VolumeShadowOn
// henyey greenstein phase function
float phase_function(float cos_angle)
{
  // divide by 2.0 instead of 4pi to increase intensity
  return ((1.0-anisotropy2)/pow(1.0+anisotropy2-2.0*anisotropy*cos_angle, 1.5))/2.0;
}

// Computes the intersection between a ray and a box
struct Hit
{
  float tmin;
  float tmax;
};

struct Ray
{
  vec3 origin;
  vec3 dir;
  vec3 invDir;
};

bool BBoxIntersect(vec3 boundMin, vec3 boundMax, const Ray r, out Hit hit)
{
  vec3 tbot = r.invDir * (boundMin - r.origin);
  vec3 ttop = r.invDir * (boundMax - r.origin);
  vec3 tmin = min(ttop, tbot);
  vec3 tmax = max(ttop, tbot);
  vec2 t = max(tmin.xx, tmin.yz);
  float t0 = max(t.x, t.y);
  t = min(tmax.xx, tmax.yz);
  float t1 = min(t.x, t.y);
  hit.tmin = t0;
  hit.tmax = t1;
  return t1 > max(t0,0.0);
}

// As BBoxIntersect requires the inverse of the ray coords,
// this function is used to avoid numerical issues
void safe_0_vector(inout Ray ray)
{
  if(abs(ray.dir.x) < EPSILON) ray.dir.x = sign(ray.dir.x) * EPSILON;
  if(abs(ray.dir.y) < EPSILON) ray.dir.y = sign(ray.dir.y) * EPSILON;
  if(abs(ray.dir.z) < EPSILON) ray.dir.z = sign(ray.dir.z) * EPSILON;
}

float volume_shadow(vec3 posIS, vec3 lightDirNormIS)
{
  float shadow = 1.0;
  float opacity = 0.0;

  // modify sample distance with a random number between 1.5 and 3.0
  float sampleDistanceISVS_jitter = sampleDistanceISVS * mix(1.5, 3.0, random());
  float opacityPrev = texture2D(otexture, vec2(getTextureValue(posIS).r * oscale0 + oshift0, 0.5)).r;

  // in case the first sample near surface has a very tiled light ray, we need to offset start position
  posIS += sampleDistanceISVS_jitter * lightDirNormIS;

  // compute the start and end points for the ray
  Ray ray;
  Hit hit;
  ray.origin = posIS;
  ray.dir = lightDirNormIS;
  safe_0_vector(ray);
  ray.invDir = 1.0/ray.dir;

  if(!BBoxIntersect(vec3(0.0),vec3(1.0), ray, hit))
  {
    return 1.0;
  }
  float maxdist = hit.tmax;

  // interpolate shadow ray length between: 1 unit of sample distance in IS to SQRT3, based on globalIlluminationReach
  float maxgi = mix(sampleDistanceISVS_jitter,SQRT3,giReach);
  maxdist = min(maxdist,maxgi);
  if(maxdist < EPSILON) {
    return 1.0;
  }

  // support gradient opacity
  #ifdef vtkGradientOpacityOn
    vec4 normal;
  #endif

  float current_dist = 0.0;
  float current_step = length(sampleDistanceISVS_jitter * lightDirNormIS);
  float clamped_step = 0.0;

  vec4 scalar = vec4(0.0);
  while(current_dist < maxdist)
  {
#ifdef vtkClippingPlanesOn
    vec3 posVC = IStoVC(posIS);
    for (int i = 0; i < clip_numPlanes; ++i)
    {
      if (dot(vec3(vClipPlaneOrigins[i] - posVC), vClipPlaneNormals[i]) > 0.0)
      {
        current_dist = maxdist;
      }
    }
#endif
    scalar = getTextureValue(posIS);
    opacity = texture2D(otexture, vec2(scalar.r * oscale0 + oshift0, 0.5)).r;
    #ifdef vtkGradientOpacityOn
      normal = computeNormal(posIS, vec3(1.0/vec3(volumeDimensions)));
      opacity *= computeGradientOpacityFactor(normal.w, goscale0, goshift0, gomin0, gomax0);
    #endif
    shadow *= 1.0 - opacity;

    // optimization: early termination
    if (shadow < EPSILON){
      return 0.0;
    }

    clamped_step = min(maxdist - current_dist, current_step);
    posIS += clamped_step * lightDirNormIS;
    current_dist += current_step;
  }

  return shadow;
}

vec3 applyShadowRay(vec3 tColor, vec3 posIS, vec3 viewDirectionVC)
{
  vec3 vertLight = vec3(0.0);
  vec3 secondary_contrib = vec3(0.0);
  // here we assume only positional light, no effect of cones
  for (int i = 0; i < lightNum; i++)
  {
    #if(vtkLightComplexity==3)
      if (lightPositional[i] == 1){
        vertLight = lightPositionVC[i] - IStoVC(posIS);
      }else{
        vertLight = - lightDirectionVC[i];
      }
    #else
      vertLight = - lightDirectionVC[i];
    #endif
    // here we assume achromatic light, only intensity
    float dDotL = dot(viewDirectionVC, normalize(vertLight));
    // isotropic scatter returns 0.5 instead of 1/4pi to increase intensity
    float phase_attenuation = 0.5;
    if (abs(anisotropy) > EPSILON){
      phase_attenuation = phase_function(dDotL);
    }
    float vol_shadow = volume_shadow(posIS, normalize(rotateToIDX(vertLight)));
    secondary_contrib += tColor * vDiffuse * lightColor[i] * vol_shadow * phase_attenuation;
    secondary_contrib += tColor * vAmbient;
  }
  return secondary_contrib;
}
#endif

//=======================================================================
// local ambient occlusion
#ifdef localAmbientOcclusionOn
vec3 sample_direction_uniform(int i)
{
  float rand = random() * 0.5;
  float theta = PI2 * (kernelSample[i][0] + rand);
  float phi = acos(2.0 * (kernelSample[i][1] + rand) -1.0) / 2.5;
  return normalize(vec3(cos(theta)*sin(phi), sin(theta)*sin(phi), cos(phi)));
}

// return a matrix that transform startDir into z axis; startDir should be normalized
mat3 zBaseRotationalMatrix(vec3 startDir){
  vec3 axis = cross(startDir, vec3(0.0,0.0,1.0));
  float cosA = startDir.z;
  float k = 1.0 / (1.0 + cosA);
  mat3 matrix = mat3((axis.x * axis.x * k) + cosA, (axis.y * axis.x * k) - axis.z, (axis.z * axis.x * k) + axis.y,
              (axis.x * axis.y * k) + axis.z, (axis.y * axis.y * k) + cosA, (axis.z * axis.y * k) - axis.x,
              (axis.x * axis.z * k) - axis.y, (axis.y * axis.z * k) + axis.x, (axis.z * axis.z * k) + cosA);
  return matrix;
}

float computeLAO(vec3 posIS, float op, vec3 lightDir, vec4 normal){
  // apply LAO only at selected locations, otherwise return full brightness
  if (normal.w > 0.0 && op > 0.05){
    float total_transmittance = 0.0;
    mat3 inverseRotateBasis = inverse(zBaseRotationalMatrix(normalize(-normal.xyz)));
    vec3 currPos, randomDirStep;
    float weight, transmittance, opacity;
    for (int i = 0; i < kernelSize; i++)
    {
      randomDirStep = inverseRotateBasis * sample_direction_uniform(i) * sampleDistanceIS;
      weight = 1.0 - dot(normalize(lightDir), normalize(randomDirStep));
      currPos = posIS;
      transmittance = 1.0;
      for (int j = 0; j < kernelRadius ; j++){
        currPos += randomDirStep;
        // check if it's at clipping plane, if so return full brightness
        if (all(greaterThan(currPos, vec3(EPSILON))) && all(lessThan(currPos,vec3(1.0-EPSILON)))){
          opacity = texture2D(otexture, vec2(getTextureValue(currPos).r * oscale0 + oshift0, 0.5)).r;
          #ifdef vtkGradientOpacityOn
             opacity *= computeGradientOpacityFactor(normal.w, goscale0, goshift0, gomin0, gomax0);
          #endif
          transmittance *= 1.0 - opacity;
        }
        else{
          break;
        }
      }
      total_transmittance += transmittance / float(kernelRadius) * weight;

      // early termination if fully translucent
      if (total_transmittance > 1.0 - EPSILON){
        return 1.0;
      }
    }
    // average transmittance and reduce variance
    return clamp(total_transmittance / float(kernelSize), 0.3, 1.0);
  } else {
    return 1.0;
  }
}
#endif

//=======================================================================
// surface light contribution
#if vtkLightComplexity > 0
  void applyLighting(inout vec3 tColor, vec4 normal)
  {
    vec3 diffuse = vec3(0.0, 0.0, 0.0);
    vec3 specular = vec3(0.0, 0.0, 0.0);
    float df, sf = 0.0;
    for (int i = 0; i < lightNum; i++){
        df = abs(dot(normal.rgb, -lightDirectionVC[i]));
        diffuse += df * lightColor[i];
        sf = pow( abs(dot(lightHalfAngleVC[i],normal.rgb)), vSpecularPower);
        specular += sf * lightColor[i];
    }
    tColor.rgb = tColor.rgb*(diffuse*vDiffuse + vAmbient) + specular*vSpecular;
  }
  #ifdef SurfaceShadowOn
  #if vtkLightComplexity < 3
    vec3 applyLightingDirectional(vec3 posIS, vec4 tColor, vec4 normal)
    {
      // everything in VC
      vec3 diffuse = vec3(0.0);
      vec3 specular = vec3(0.0);
      #ifdef localAmbientOcclusionOn
        vec3 ambient = vec3(0.0);
      #endif
      vec3 vertLightDirection;
      for (int i = 0; i < lightNum; i++){
        float ndotL,vdotR;
        vertLightDirection = lightDirectionVC[i];
        ndotL = dot(normal.xyz, vertLightDirection);
        if (ndotL < 0.0 && twoSidedLighting)
        {
          ndotL = -ndotL;
        }
        if (ndotL > 0.0)
        {
          diffuse += ndotL * lightColor[i];
          //specular
          vdotR = dot(-rayDirVC, normalize(2.0 * ndotL * -normal.xyz + vertLightDirection));
          if (vdotR > 0.0)
          {
            specular += pow(vdotR, vSpecularPower) * lightColor[i];
          }
        }
        #ifdef localAmbientOcclusionOn
            ambient += computeLAO(posIS, tColor.a, vertLightDirection, normal);
        #endif
      }
      #ifdef localAmbientOcclusionOn
        return tColor.rgb * (diffuse * vDiffuse + vAmbient * ambient) + specular*vSpecular;
      #else
        return tColor.rgb * (diffuse * vDiffuse + vAmbient) + specular*vSpecular;
      #endif
    }
  #else
    vec3 applyLightingPositional(vec3 posIS, vec4 tColor, vec4 normal, vec3 posVC)
    {
      // everything in VC
      vec3 diffuse = vec3(0.0);
      vec3 specular = vec3(0.0);
      #ifdef localAmbientOcclusionOn
        vec3 ambient = vec3(0.0);
      #endif
      vec3 vertLightDirection;
      for (int i = 0; i < lightNum; i++){
        float distance,attenuation,ndotL,vdotR;
        vec3 lightDir;
        if (lightPositional[i] == 1){
          lightDir = lightDirectionVC[i];
          vertLightDirection = posVC - lightPositionVC[i];
          distance = length(vertLightDirection);
          vertLightDirection = normalize(vertLightDirection);
          attenuation = 1.0 / (lightAttenuation[i].x
                              + lightAttenuation[i].y * distance
                              + lightAttenuation[i].z * distance * distance);
          // per OpenGL standard cone angle is 90 or less for a spot light
          if (lightConeAngle[i] <= 90.0){
            float coneDot = dot(vertLightDirection, lightDir);
            if (coneDot >= cos(radians(lightConeAngle[i]))){  // if inside cone
              attenuation = attenuation * pow(coneDot, lightExponent[i]);
            }
            else {
              attenuation = 0.0;
            }
          }
          ndotL = dot(normal.xyz, vertLightDirection);
          if (ndotL < 0.0 && twoSidedLighting)
          {
            ndotL = -ndotL;
          }
          if (ndotL > 0.0)
          {
            diffuse += ndotL * attenuation * lightColor[i];
            //specular
            vdotR = dot(-rayDirVC, normalize(2.0 * ndotL * -normal.xyz + vertLightDirection));
            if (vdotR > 0.0)
            {
              specular += pow(vdotR, vSpecularPower) * attenuation * lightColor[i];
            }
          }
          #ifdef localAmbientOcclusionOn
            ambient += computeLAO(posIS, tColor.a, vertLightDirection, normal);
          #endif
        } else {
          vertLightDirection = lightDirectionVC[i];
          ndotL = dot(normal.xyz, vertLightDirection);
          if (ndotL < 0.0 && twoSidedLighting)
          {
            ndotL = -ndotL;
          }
          if (ndotL > 0.0)
          {
            diffuse += ndotL * lightColor[i];
            //specular
            vdotR = dot(-rayDirVC, normalize(2.0 * ndotL * -normal.xyz + vertLightDirection));
            if (vdotR > 0.0)
            {
              specular += pow(vdotR, vSpecularPower) * lightColor[i];
            }
          }
          #ifdef localAmbientOcclusionOn
            ambient += computeLAO(posIS, tColor.a, vertLightDirection, normal);
          #endif
        }
      }
      #ifdef localAmbientOcclusionOn
        return tColor.rgb * (diffuse * vDiffuse + vAmbient * ambient) + specular*vSpecular;
      #else
        return tColor.rgb * (diffuse * vDiffuse + vAmbient) + specular*vSpecular;
      #endif
    }
  #endif
  #endif
#endif

//=======================================================================
// Given a texture value compute the color and opacity
//
vec4 getColorForValue(vec4 tValue, vec3 posIS, vec3 tstep)
{
#ifdef vtkImageLabelOutlineOn
  vec3 centerPosIS = fragCoordToIndexSpace(gl_FragCoord); // pos in texture space
  vec4 centerValue = getTextureValue(centerPosIS);
  bool pixelOnBorder = false;
  vec4 tColor = texture2D(ctexture, vec2(centerValue.r * cscale0 + cshift0, 0.5));

  // Get alpha of segment from opacity function.
  tColor.a = texture2D(otexture, vec2(centerValue.r * oscale0 + oshift0, 0.5)).r;

  // Only perform outline check on fragments rendering voxels that aren't invisible.
  // Saves a bunch of needless checks on the background.
  // TODO define epsilon when building shader?
  if (float(tColor.a) > 0.01) {
    for (int i = -outlineThickness; i <= outlineThickness; i++) {
      for (int j = -outlineThickness; j <= outlineThickness; j++) {
        if (i == 0 || j == 0) {
          continue;
        }

        vec4 neighborPixelCoord = vec4(gl_FragCoord.x + float(i),
          gl_FragCoord.y + float(j),
          gl_FragCoord.z, gl_FragCoord.w);

        vec3 neighborPosIS = fragCoordToIndexSpace(neighborPixelCoord);
        vec4 value = getTextureValue(neighborPosIS);

        // If any of my neighbours are not the same value as I
        // am, this means I am on the border of the segment.
        // We can break the loops
        if (any(notEqual(value, centerValue))) {
          pixelOnBorder = true;
          break;
        }
      }

      if (pixelOnBorder == true) {
        break;
      }
    }

    // If I am on the border, I am displayed at full opacity
    if (pixelOnBorder == true) {
      tColor.a = outlineOpacity;
    }
  }

#else
  // compute the normal and gradient magnitude if needed
  // We compute it as a vec4 if possible otherwise a mat4
  //
  vec4 goFactor = vec4(1.0,1.0,1.0,1.0);

  // compute the normal vectors as needed
  #if (vtkLightComplexity > 0) || defined(vtkGradientOpacityOn)
    #if defined(vtkIndependentComponentsOn) && (vtkNumComponents > 1)
      mat4 normalMat = computeMat4Normal(posIS, tValue, tstep);
      #if !defined(vtkComponent0Proportional)
        vec4 normal0 = normalMat[0];
      #endif
      #if !defined(vtkComponent1Proportional)
        vec4 normal1 = normalMat[1];
      #endif
      #if vtkNumComponents > 2
        #if !defined(vtkComponent2Proportional)
          vec4 normal2 = normalMat[2];
        #endif
        #if vtkNumComponents > 3
          #if !defined(vtkComponent3Proportional)
            vec4 normal3 = normalMat[3];
          #endif
        #endif
      #endif
    #else
      vec4 normalLight;
      #ifdef vtkComputeNormalFromOpacity
        vec3 scalarInterp[2];
        vec4 normal0 = computeNormalForDensity(posIS, tstep, scalarInterp);
        if (length(normal0)>0.0){
          #ifdef vtkGradientOpacityOn
            normalLight = computeDensityNormal(normal0.w, scalarInterp);
          #else
            normalLight = computeDensityNormal(scalarInterp);
          #endif
          if (length(normalLight) == 0.0){
            normalLight = normal0;
          }
        }
      #else
        vec4 normal0 = computeNormal(posIS, tstep);
        normalLight = normal0;
      #endif
    #endif
  #endif

  // compute gradient opacity factors as needed
  #if defined(vtkGradientOpacityOn)
    #if !defined(vtkComponent0Proportional)
      goFactor.x =
        computeGradientOpacityFactor(normal0.a, goscale0, goshift0, gomin0, gomax0);
    #endif
    #if defined(vtkIndependentComponentsOn) && (vtkNumComponents > 1)
      #if !defined(vtkComponent1Proportional)
        goFactor.y =
          computeGradientOpacityFactor(normal1.a, goscale1, goshift1, gomin1, gomax1);
      #endif
      #if vtkNumComponents > 2
        #if !defined(vtkComponent2Proportional)
          goFactor.z =
            computeGradientOpacityFactor(normal2.a, goscale2, goshift2, gomin2, gomax2);
        #endif
        #if vtkNumComponents > 3
          #if !defined(vtkComponent3Proportional)
            goFactor.w =
              computeGradientOpacityFactor(normal3.a, goscale3, goshift3, gomin3, gomax3);
          #endif
        #endif
      #endif
    #endif
  #endif

  // single component is always independent
  #if vtkNumComponents == 1
    vec4 tColor = texture2D(ctexture, vec2(tValue.r * cscale0 + cshift0, 0.5));
    tColor.a = goFactor.x*texture2D(otexture, vec2(tValue.r * oscale0 + oshift0, 0.5)).r;
    if (tColor.a < EPSILON){
      return vec4(0.0);
    }
  #endif

  #if defined(vtkIndependentComponentsOn) && vtkNumComponents >= 2
    vec4 tColor = mix0*texture2D(ctexture, vec2(tValue.r * cscale0 + cshift0, height0));
    #if !defined(vtkComponent0Proportional)
      tColor.a = goFactor.x*mix0*texture2D(otexture, vec2(tValue.r * oscale0 + oshift0, height0)).r;
    #else
      float pwfValue = texture2D(otexture, vec2(tValue.r * oscale0 + oshift0, height0)).r;
      tColor *= pwfValue;
      tColor.a *= mix(pwfValue, 1.0, (1.0 - mix0));
    #endif

    vec3 tColor1 = mix1*texture2D(ctexture, vec2(tValue.g * cscale1 + cshift1, height1)).rgb;
    #if !defined(vtkComponent1Proportional)
      tColor.a += goFactor.y*mix1*texture2D(otexture, vec2(tValue.g * oscale1 + oshift1, height1)).r;
    #else
      float pwfValue = texture2D(otexture, vec2(tValue.g * oscale1 + oshift1, height1)).r;
      tColor1 *= pwfValue;
      tColor.a *= mix(pwfValue, 1.0, (1.0 - mix1));
    #endif

    #if vtkNumComponents >= 3
      vec3 tColor2 = mix2*texture2D(ctexture, vec2(tValue.b * cscale2 + cshift2, height2)).rgb;
      #if !defined(vtkComponent2Proportional)
        tColor.a += goFactor.z*mix2*texture2D(otexture, vec2(tValue.b * oscale2 + oshift2, height2)).r;
      #else
        float pwfValue = texture2D(otexture, vec2(tValue.b * oscale2 + oshift2, height2)).r;
        tColor2 *= pwfValue;
        tColor.a *= mix(pwfValue, 1.0, (1.0 - mix2));
      #endif

      #if vtkNumComponents >= 4
        vec3 tColor3 = mix3*texture2D(ctexture, vec2(tValue.a * cscale3 + cshift3, height3)).rgb;
        #if !defined(vtkComponent3Proportional)
          tColor.a += goFactor.w*mix3*texture2D(otexture, vec2(tValue.a * oscale3 + oshift3, height3)).r;
        #else
          float pwfValue = texture2D(otexture, vec2(tValue.a * oscale3 + oshift3, height3)).r;
          tColor3 *= pwfValue;
          tColor.a *= mix(pwfValue, 1.0, (1.0 - mix3));
        #endif
      #endif
    #endif
  #else // then not independent

  #if vtkNumComponents == 2
    float lum = tValue.r * cscale0 + cshift0;
    float alpha = goFactor.x*texture2D(otexture, vec2(tValue.a * oscale1 + oshift1, 0.5)).r;
    vec4 tColor = vec4(lum, lum, lum, alpha);
  #endif
  #if vtkNumComponents == 3
    vec4 tColor;
    tColor.r = tValue.r * cscale0 + cshift0;
    tColor.g = tValue.g * cscale1 + cshift1;
    tColor.b = tValue.b * cscale2 + cshift2;
    tColor.a = goFactor.x*texture2D(otexture, vec2(tValue.a * oscale0 + oshift0, 0.5)).r;
  #endif
  #if vtkNumComponents == 4
    vec4 tColor;
    tColor.r = tValue.r * cscale0 + cshift0;
    tColor.g = tValue.g * cscale1 + cshift1;
    tColor.b = tValue.b * cscale2 + cshift2;
    tColor.a = goFactor.x*texture2D(otexture, vec2(tValue.a * oscale3 + oshift3, 0.5)).r;
  #endif
  #endif // dependent

  // apply lighting if requested as appropriate
  #if vtkLightComplexity > 0
    #if !defined(vtkComponent0Proportional)
      #if vtkNumComponents == 1
        #ifdef SurfaceShadowOn
            #if vtkLightComplexity < 3
                vec3 tColorS = applyLightingDirectional(posIS, tColor, normalLight);
            #else
                vec3 tColorS = applyLightingPositional(posIS, tColor, normalLight, IStoVC(posIS));
            #endif
        #endif

        #ifdef VolumeShadowOn
          vec3 tColorVS = applyShadowRay(tColor.rgb, posIS, rayDirVC);
          #ifdef SurfaceShadowOn
            float vol_coef = volumetricScatteringBlending * (1.0 - tColor.a / 2.0) * (1.0 - atan(normalLight.w) * INV4PI);
            tColor.rgb = (1.0-vol_coef) * tColorS + vol_coef * tColorVS;
          #else
            tColor.rgb = tColorVS;
          #endif
        #else
            tColor.rgb = tColorS;
        #endif

      #else
        applyLighting(tColor.rgb, normal0);
      #endif
    #endif

    #if defined(vtkIndependentComponentsOn) && vtkNumComponents >= 2
      #if !defined(vtkComponent1Proportional)
        applyLighting(tColor1, normal1);
      #endif
    #if vtkNumComponents >= 3
      #if !defined(vtkComponent2Proportional)
        applyLighting(tColor2, normal2);
      #endif
    #if vtkNumComponents >= 4
      #if !defined(vtkComponent3Proportional)
        applyLighting(tColor3, normal3);
      #endif
    #endif
    #endif
    #endif
  #endif

// perform final independent blend as needed
#if defined(vtkIndependentComponentsOn) && vtkNumComponents >= 2
  tColor.rgb += tColor1;
#if vtkNumComponents >= 3
  tColor.rgb += tColor2;
#if vtkNumComponents >= 4
  tColor.rgb += tColor3;
#endif
#endif
#endif

#endif
return tColor;
}

bool valueWithinScalarRange(vec4 val, vec4 min, vec4 max) {
  bool withinRange = false;
  #if vtkNumComponents == 1
    if (val.r >= min.r && val.r <= max.r) {
      withinRange = true;
    }
  #endif
  #if defined(vtkIndependentComponentsOn) && vtkNumComponents == 2
     if (val.r >= min.r && val.r <= max.r &&
        val.g >= min.g && val.g <= max.g) {
      withinRange = true;
    }
  #endif
  #if defined(vtkIndependentComponentsOn) && vtkNumComponents >= 3
    if (all(greaterThanEqual(val, ipScalarRangeMin)) &&
        all(lessThanEqual(val, ipScalarRangeMax))) {
      withinRange = true;
    }
  #endif
  return withinRange;
}

//=======================================================================
// Apply the specified blend mode operation along the ray's path.
//
void applyBlend(vec3 posIS, vec3 endIS, vec3 tdims)
{
  vec3 tstep = 1.0/tdims;

  // start slightly inside and apply some jitter
  vec3 delta = endIS - posIS;
  vec3 stepIS = normalize(delta)*sampleDistanceIS;
  float raySteps = length(delta)/sampleDistanceIS;

  // avoid 0.0 jitter
  float jitter = 0.01 + 0.99*texture2D(jtexture, gl_FragCoord.xy/32.0).r;
  float stepsTraveled = jitter;

  // local vars for the loop
  vec4 color = vec4(0.0, 0.0, 0.0, 0.0);
  vec4 tValue;
  vec4 tColor;

  // if we have less than one step then pick the middle point
  // as our value
  // if (raySteps <= 1.0)
  // {
  //   posIS = (posIS + endIS)*0.5;
  // }

  // Perform initial step at the volume boundary
  // compute the scalar
  tValue = getTextureValue(posIS);

  #if vtkBlendMode == 0 // COMPOSITE_BLEND
    // now map through opacity and color
    tColor = getColorForValue(tValue, posIS, tstep);

    // handle very thin volumes
    if (raySteps <= 1.0)
    {
      tColor.a = 1.0 - pow(1.0 - tColor.a, raySteps);
      gl_FragData[0] = tColor;
      return;
    }

    tColor.a = 1.0 - pow(1.0 - tColor.a, jitter);
    color = vec4(tColor.rgb*tColor.a, tColor.a);
    posIS += (jitter*stepIS);

    for (int i = 0; i < //VTK::MaximumSamplesValue ; ++i)
    {
      if (stepsTraveled + 1.0 >= raySteps) { break; }

      // compute the scalar
      tValue = getTextureValue(posIS);

      // now map through opacity and color
      tColor = getColorForValue(tValue, posIS, tstep);

      float mix = (1.0 - color.a);

      // this line should not be needed but nvidia seems to not handle
      // the break correctly on windows/chrome 58 angle
      //mix = mix * sign(max(raySteps - stepsTraveled - 1.0, 0.0));

      color = color + vec4(tColor.rgb*tColor.a, tColor.a)*mix;
      stepsTraveled++;
      posIS += stepIS;
      if (color.a > 0.99) { color.a = 1.0; break; }
    }

    if (color.a < 0.99 && (raySteps - stepsTraveled) > 0.0)
    {
      posIS = endIS;

      // compute the scalar
      tValue = getTextureValue(posIS);

      // now map through opacity and color
      tColor = getColorForValue(tValue, posIS, tstep);
      tColor.a = 1.0 - pow(1.0 - tColor.a, raySteps - stepsTraveled);

      float mix = (1.0 - color.a);
      color = color + vec4(tColor.rgb*tColor.a, tColor.a)*mix;
    }

    gl_FragData[0] = vec4(color.rgb/color.a, color.a);
  #endif
  #if vtkBlendMode == 1 || vtkBlendMode == 2
    // MAXIMUM_INTENSITY_BLEND || MINIMUM_INTENSITY_BLEND
    // Find maximum/minimum intensity along the ray.

    // Define the operation we will use (min or max)
    #if vtkBlendMode == 1
    #define OP max
    #else
    #define OP min
    #endif

    // If the clipping range is shorter than the sample distance
    // we can skip the sampling loop along the ray.
    if (raySteps <= 1.0)
    {
      gl_FragData[0] = getColorForValue(tValue, posIS, tstep);
      return;
    }

    vec4 value = tValue;
    posIS += (jitter*stepIS);

    // Sample along the ray until MaximumSamplesValue,
    // ending slightly inside the total distance
    for (int i = 0; i < //VTK::MaximumSamplesValue ; ++i)
    {
      // If we have reached the last step, break
      if (stepsTraveled + 1.0 >= raySteps) { break; }

      // compute the scalar
      tValue = getTextureValue(posIS);

      // Update the maximum value if necessary
      value = OP(tValue, value);

      // Otherwise, continue along the ray
      stepsTraveled++;
      posIS += stepIS;
    }

    // Perform the last step along the ray using the
    // residual distance
    posIS = endIS;
    tValue = getTextureValue(posIS);
    value = OP(tValue, value);

    // Now map through opacity and color
    gl_FragData[0] = getColorForValue(value, posIS, tstep);
  #endif
  #if vtkBlendMode == 3 || vtkBlendMode == 4 //AVERAGE_INTENSITY_BLEND || ADDITIVE_BLEND
    vec4 sum = vec4(0.);

    if (valueWithinScalarRange(tValue, ipScalarRangeMin, ipScalarRangeMax)) {
      sum += tValue;
    }

    if (raySteps <= 1.0) {
      gl_FragData[0] = getColorForValue(sum, posIS, tstep);
      return;
    }

    posIS += (jitter*stepIS);

    // Sample along the ray until MaximumSamplesValue,
    // ending slightly inside the total distance
    for (int i = 0; i < //VTK::MaximumSamplesValue ; ++i)
    {
      // If we have reached the last step, break
      if (stepsTraveled + 1.0 >= raySteps) { break; }

      // compute the scalar
      tValue = getTextureValue(posIS);

      // One can control the scalar range by setting the AverageIPScalarRange to disregard scalar values, not in the range of interest, from the average computation.
      // Notes:
      // - We are comparing all values in the texture to see if any of them
      //   are outside of the scalar range. In the future we might want to allow
      //   scalar ranges for each component.
      if (valueWithinScalarRange(tValue, ipScalarRangeMin, ipScalarRangeMax)) {
        // Sum the values across each step in the path
        sum += tValue;
      }
      stepsTraveled++;
      posIS += stepIS;
    }

    // Perform the last step along the ray using the
    // residual distance
    posIS = endIS;

    // compute the scalar
    tValue = getTextureValue(posIS);

    // One can control the scalar range by setting the IPScalarRange to disregard scalar values, not in the range of interest, from the average computation
    if (valueWithinScalarRange(tValue, ipScalarRangeMin, ipScalarRangeMax)) {
      sum += tValue;

      stepsTraveled++;
    }

    #if vtkBlendMode == 3 // Average
      sum /= vec4(stepsTraveled, stepsTraveled, stepsTraveled, 1.0);
    #endif

    gl_FragData[0] = getColorForValue(sum, posIS, tstep);
  #endif
  #if vtkBlendMode == 5 // RADON
    float normalizedRayIntensity = 1.0;

    // handle very thin volumes
    if (raySteps <= 1.0)
    {
      tValue = getTextureValue(posIS);
      normalizedRayIntensity = normalizedRayIntensity - sampleDistance*texture2D(otexture, vec2(tValue.r * oscale0 + oshift0, 0.5)).r;
      gl_FragData[0] = texture2D(ctexture, vec2(normalizedRayIntensity, 0.5));
      return;
    }

    posIS += (jitter*stepIS);

    for (int i = 0; i < //VTK::MaximumSamplesValue ; ++i)
    {
      if (stepsTraveled + 1.0 >= raySteps) { break; }

      // compute the scalar value
      tValue = getTextureValue(posIS);

      // Convert scalar value to normalizedRayIntensity coefficient and accumulate normalizedRayIntensity
      normalizedRayIntensity = normalizedRayIntensity - sampleDistance*texture2D(otexture, vec2(tValue.r * oscale0 + oshift0, 0.5)).r;

      posIS += stepIS;
      stepsTraveled++;
    }

    // map normalizedRayIntensity to color
    gl_FragData[0] = texture2D(ctexture, vec2(normalizedRayIntensity , 0.5));

  #endif
}

//=======================================================================
// Compute a new start and end point for a given ray based
// on the provided bounded clipping plane (aka a rectangle)
void getRayPointIntersectionBounds(
  vec3 rayPos, vec3 rayDir,
  vec3 planeDir, float planeDist,
  inout vec2 tbounds, vec3 vPlaneX, vec3 vPlaneY,
  float vSize1, float vSize2)
{
  float result = dot(rayDir, planeDir);
  if (abs(result) < 1e-6)
  {
    return;
  }
  result = -1.0 * (dot(rayPos, planeDir) + planeDist) / result;
  vec3 xposVC = rayPos + rayDir*result;
  vec3 vxpos = xposVC - vOriginVC;
  vec2 vpos = vec2(
    dot(vxpos, vPlaneX),
    dot(vxpos, vPlaneY));

  // on some apple nvidia systems this does not work
  // if (vpos.x < 0.0 || vpos.x > vSize1 ||
  //     vpos.y < 0.0 || vpos.y > vSize2)
  // even just
  // if (vpos.x < 0.0 || vpos.y < 0.0)
  // fails
  // so instead we compute a value that represents in and out
  //and then compute the return using this value
  float xcheck = max(0.0, vpos.x * (vpos.x - vSize1)); //  0 means in bounds
  float check = sign(max(xcheck, vpos.y * (vpos.y - vSize2))); //  0 means in bounds, 1 = out

  tbounds = mix(
   vec2(min(tbounds.x, result), max(tbounds.y, result)), // in value
   tbounds, // out value
   check);  // 0 in 1 out
}

//=======================================================================
// given a
// - ray direction (rayDir)
// - starting point (vertexVCVSOutput)
// - bounding planes of the volume
// - optionally depth buffer values
// - far clipping plane
// compute the start/end distances of the ray we need to cast
vec2 computeRayDistances(vec3 rayDir, vec3 tdims)
{
  vec2 dists = vec2(100.0*camFar, -1.0);

  vec3 vSize = vSpacing*tdims;

  // all this is in View Coordinates
  getRayPointIntersectionBounds(vertexVCVSOutput, rayDir,
    vPlaneNormal0, vPlaneDistance0, dists, vPlaneNormal2, vPlaneNormal4,
    vSize.y, vSize.z);
  getRayPointIntersectionBounds(vertexVCVSOutput, rayDir,
    vPlaneNormal1, vPlaneDistance1, dists, vPlaneNormal2, vPlaneNormal4,
    vSize.y, vSize.z);
  getRayPointIntersectionBounds(vertexVCVSOutput, rayDir,
    vPlaneNormal2, vPlaneDistance2, dists, vPlaneNormal0, vPlaneNormal4,
    vSize.x, vSize.z);
  getRayPointIntersectionBounds(vertexVCVSOutput, rayDir,
    vPlaneNormal3, vPlaneDistance3, dists, vPlaneNormal0, vPlaneNormal4,
    vSize.x, vSize.z);
  getRayPointIntersectionBounds(vertexVCVSOutput, rayDir,
    vPlaneNormal4, vPlaneDistance4, dists, vPlaneNormal0, vPlaneNormal2,
    vSize.x, vSize.y);
  getRayPointIntersectionBounds(vertexVCVSOutput, rayDir,
    vPlaneNormal5, vPlaneDistance5, dists, vPlaneNormal0, vPlaneNormal2,
    vSize.x, vSize.y);

  //VTK::ClipPlane::Impl

  // do not go behind front clipping plane
  dists.x = max(0.0,dists.x);

  // do not go PAST far clipping plane
  float farDist = -camThick/rayDir.z;
  dists.y = min(farDist,dists.y);

  // Do not go past the zbuffer value if set
  // This is used for intermixing opaque geometry
  //VTK::ZBuffer::Impl

  return dists;
}

//=======================================================================
// Compute the index space starting position (pos) and end
// position
//
void computeIndexSpaceValues(out vec3 pos, out vec3 endPos, vec3 rayDir, vec2 dists)
{
  // compute starting and ending values in volume space
  pos = vertexVCVSOutput + dists.x*rayDir;
  pos = pos - vOriginVC;
  // convert to volume basis and origin
  pos = vec3(
    dot(pos, vPlaneNormal0),
    dot(pos, vPlaneNormal2),
    dot(pos, vPlaneNormal4));

  endPos = vertexVCVSOutput + dists.y*rayDir;
  endPos = endPos - vOriginVC;
  endPos = vec3(
    dot(endPos, vPlaneNormal0),
    dot(endPos, vPlaneNormal2),
    dot(endPos, vPlaneNormal4));

  float delta = length(endPos - pos);

  pos *= vVCToIJK;
  endPos *= vVCToIJK;

  float delta2 = length(endPos - pos);
  sampleDistanceIS = sampleDistance*delta2/delta;
  #ifdef VolumeShadowOn
    sampleDistanceISVS = sampleDistanceIS * volumeShadowSamplingDistFactor;
  #endif
}

void main()
{

  if (cameraParallel == 1)
  {
    // Camera is parallel, so the rayDir is just the direction of the camera.
    rayDirVC = vec3(0.0, 0.0, -1.0);
  } else {
    // camera is at 0,0,0 so rayDir for perspective is just the vc coord
    rayDirVC = normalize(vertexVCVSOutput);
  }

  vec3 tdims = vec3(volumeDimensions);

  // compute the start and end points for the ray
  vec2 rayStartEndDistancesVC = computeRayDistances(rayDirVC, tdims);

  // do we need to composite? aka does the ray have any length
  // If not, bail out early
  if (rayStartEndDistancesVC.y <= rayStartEndDistancesVC.x)
  {
    discard;
  }

  // IS = Index Space
  vec3 posIS;
  vec3 endIS;
  computeIndexSpaceValues(posIS, endIS, rayDirVC, rayStartEndDistancesVC);

  // Perform the blending operation along the ray
  applyBlend(posIS, endIS, tdims);
}
