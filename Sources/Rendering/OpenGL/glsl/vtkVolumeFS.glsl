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

const float infinity = 3.402823466e38;

// the output of this shader
//VTK::Output::Dec

in vec3 vertexVCVSOutput;

// From Sources\Rendering\Core\VolumeProperty\Constants.js
#define COMPOSITE_BLEND 0
#define MAXIMUM_INTENSITY_BLEND 1
#define MINIMUM_INTENSITY_BLEND 2
#define AVERAGE_INTENSITY_BLEND 3
#define ADDITIVE_INTENSITY_BLEND 4
#define RADON_TRANSFORM_BLEND 5
#define LABELMAP_EDGE_PROJECTION_BLEND 6

#define vtkNumberOfLights //VTK::NumberOfLights
#define vtkMaxLaoKernelSize //VTK::MaxLaoKernelSize
#define vtkNumberOfVolumes //VTK::NumberOfVolumes
#define vtkBlendMode //VTK::BlendMode

//VTK::EnabledColorFunctions

//VTK::EnabledLightings

//VTK::EnableForceNearestInterpolation

uniform int maximumNumberOfSamples;
uniform int twoSidedLighting;

#if vtkMaxLaoKernelSize > 0
vec2 kernelSample[vtkMaxLaoKernelSize];
#endif

// Textures
uniform highp sampler3D volumeTexture[vtkNumberOfVolumes];
uniform sampler2D colorTexture[vtkNumberOfVolumes];
uniform sampler2D opacityTexture[vtkNumberOfVolumes];

vec4 fetchVolumeTexture(ivec3 pos, int vIdx) {
  // Texture arrays indices have to be constant, equivalent to:
  // return texelFetch(volumeTexture[vIdx], pos, 0);
  switch (vIdx) {
    //VTK::fetchVolumeTexture
  }
}

vec4 sampleVolumeTexture(vec3 pos, int vIdx) {
  // Texture arrays indices have to be constant, equivalent to:
  // return texture(volumeTexture[vIdx], pos);
  switch (vIdx) {
    //VTK::sampleVolumeTexture
  }
}

vec4 sampleColorTexture(vec2 pos, int vIdx) {
  // Texture arrays indices have to be constant, equivalent to:
  // return texture2D(colorTexture[vIdx], pos);
  switch (vIdx) {
    //VTK::sampleColorTexture
  }
}

vec4 sampleOpacityTexture(vec2 pos, int vIdx) {
  // Texture arrays indices have to be constant, equivalent to:
  // return texture2D(opacityTexture[vIdx], pos);
  switch (vIdx) {
    //VTK::sampleOpacityTexture
  }
}

struct Volume {
  // ---- Volume geometry settings ----

  vec3 originVC;          // in VC
  vec3 size;              // in VC (spacing * dimensions)
  vec3 inverseSize;       // 1/size
  vec3 spacing;           // in VC per IC
  vec3 inverseSpacing;    // 1/spacing
  ivec3 dimensions;       // in IC
  vec3 inverseDimensions; // 1/vec3(dimensions)
  mat3 ISVCNormalMatrix;  // pure rotation from VC to IS, transposed of
                          // VCISNormalMatrix
  mat3 VCISNormalMatrix;  // pure rotation from IS to VC, transposed of
                          // ISVCNormalMatrix
  mat4 PCWCMatrix;
  mat4 worldToIndex;
  float diagonalLength; // in VC, this is: length(size)

  // ---- Main rendering settings ----

  int useIndependentComponents;
  int numberOfComponents;
  int colorForValueFunctionId;
  ivec4 isComponentNearestInterpolationForced;
  ivec4 isComponentProportional;

  // ---- Texture settings ----

  // Texture shift and scale
  vec4 colorTextureScale;
  vec4 colorTextureShift;
  vec4 opacityTextureScale;
  vec4 opacityTextureShift;

  // The heights defined below are the locations for the up to four components
  // of the transfer functions. The transfer functions have a height of (2 *
  // numberOfComponents) pixels so the values are computed to hit the middle of
  // the two rows for that component
  vec4 transferFunctionsSampleHeight;

  // ---- Mode specific settings ----

  // Independent component default preset settings per component
  vec4 independentComponentMix;

  // Additive / average blending mode settings
  vec4 ipScalarRangeMin;
  vec4 ipScalarRangeMax;

  // ---- Rendering settings ----

  // Lighting
  float ambient;
  float diffuse;
  float specular;
  float specularPower;
  int computeNormalFromOpacity;

  // Gradient opacity
  int isGradientOpacityEnabled;
  vec4 gradientOpacityScale;
  vec4 gradientOpacityShift;
  vec4 gradientOpacityMin;
  vec4 gradientOpacityMax;

  // Volume shadow
  float volumetricScatteringBlending;
  float globalIlluminationReach;
  float anisotropy;
  float anisotropySquared;

  // LAO
  int kernelSize;
  int kernelRadius;

  // Label outline
  float outlineOpacity;
};
uniform Volume volumes[vtkNumberOfVolumes];

struct Light {
  vec3 color;
  vec3 positionVC;
  vec3 directionVC; // normalized
  vec3 halfAngleVC;
  vec3 attenuation;
  float exponent;
  float coneAngle;
  int isPositional;
};
#if vtkNumberOfLights > 0
uniform Light lights[vtkNumberOfLights];
#endif

uniform float vpWidth;
uniform float vpHeight;
uniform float vpOffsetX;
uniform float vpOffsetY;

// Bitmasks for label outline
const int MAX_SEGMENT_INDEX = 256; // Define as per expected maximum
#define MAX_SEGMENTS 256
#define UINT_SIZE 32
// We add UINT_SIZE - 1, as we want the ceil of the division instead of the
// floor
#define BITMASK_SIZE ((MAX_SEGMENTS + UINT_SIZE - 1) / UINT_SIZE)
uint labelOutlineBitmasks[BITMASK_SIZE];

// Set the corresponding bit in the bitmask
void setLabelOutlineBit(int segmentIndex) {
  int arrayIndex = segmentIndex / UINT_SIZE;
  int bitIndex = segmentIndex % UINT_SIZE;
  labelOutlineBitmasks[arrayIndex] |= 1u << bitIndex;
}

// Check if a bit is set in the bitmask
bool isLabelOutlineBitSet(int segmentIndex) {
  int arrayIndex = segmentIndex / UINT_SIZE;
  int bitIndex = segmentIndex % UINT_SIZE;
  return ((labelOutlineBitmasks[arrayIndex] & (1u << bitIndex)) != 0u);
}

// if you want to see the raw tiled
// data in webgl1 uncomment the following line
// #define debugtile

// camera values
uniform float camThick;
uniform float camNear;
uniform float camFar;
uniform int cameraParallel;

//VTK::ClipPlane::Dec

// jitter texture
uniform sampler2D jtexture;

// label outline thickness texture
uniform sampler2D labelOutlineThicknessTexture;

// A random number between 0 and 1 that only depends on the fragment
// It uses the jtexture, so this random seed repeats by blocks of 32 fragments
// in screen space
float fragmentSeed;

// sample texture is global
uniform float sampleDistance;
uniform float volumeShadowSampleDistance;

// declaration for intermixed geometry
//VTK::ZBuffer::Dec

//=======================================================================
// global and custom variables (a temporary section before photorealistics
// rendering module is complete)
vec3 rayDirVC;

#define INV4PI 0.0796
#define EPSILON 0.001
#define PI 3.1415
#define PI2 9.8696

vec4 getTextureValue(vec3 pos, int vIdx) {
  vec4 tmp = sampleVolumeTexture(pos, vIdx);

#ifdef EnableForceNearestInterpolation
  if (!all(equal(volumes[vIdx].isComponentNearestInterpolationForced,
                 ivec4(0)))) {
    vec3 nearestPos = (floor(pos * vec3(volumes[vIdx].dimensions)) + 0.5) *
                      volumes[vIdx].inverseDimensions;
    vec4 nearestValue = sampleVolumeTexture(nearestPos, vIdx);
    vec4 forceNearestMask =
        vec4(volumes[vIdx].isComponentNearestInterpolationForced);
    tmp = tmp * (1.0 - forceNearestMask) + nearestValue * forceNearestMask;
  }
#endif

  if (volumes[vIdx].useIndependentComponents == 0) {
    int nComps = volumes[vIdx].numberOfComponents;
    if (nComps == 1) {
      tmp.a = tmp.r;
    } else if (nComps == 2) {
      tmp.a = tmp.g;
    } else if (nComps == 3) {
      tmp.a = length(tmp.rgb);
    }
  }

  return tmp;
}

// `height` is usually `volumes[vIdx].transferFunctionsSampleHeight[component]`
// when using independent component and `0.5` otherwise. Don't move the if
// statement in these function, as the callers usually already knows if it is
// using independent component or not
float getOpacityFromTexture(float scalar, int vIdx, int component,
                            float height) {
  float scaledScalar = scalar * volumes[vIdx].opacityTextureScale[component] +
                       volumes[vIdx].opacityTextureShift[component];
  return sampleOpacityTexture(vec2(scaledScalar, height), vIdx).r;
}
vec3 getColorFromTexture(float scalar, int vIdx, int component, float height) {
  float scaledScalar = scalar * volumes[vIdx].colorTextureScale[component] +
                       volumes[vIdx].colorTextureShift[component];
  return sampleColorTexture(vec2(scaledScalar, height), vIdx).rgb;
}

//=======================================================================
// transformation between VC and IS space

// convert vector position from idx to vc
vec3 IStoVC(vec3 posIS, int vIdx) {
  return volumes[vIdx].ISVCNormalMatrix * (posIS * volumes[vIdx].size) +
         volumes[vIdx].originVC;
}

// convert vector position from vc to idx
vec3 VCtoIS(vec3 posVC, int vIdx) {
  return (volumes[vIdx].VCISNormalMatrix * (posVC - volumes[vIdx].originVC)) *
         volumes[vIdx].inverseSize;
}

// Rotate vector to view coordinate
vec3 rotateToVC(vec3 dirIS, int vIdx) {
  return volumes[vIdx].ISVCNormalMatrix * dirIS;
}

// Rotate vector to idx coordinate
vec3 rotateToIS(vec3 dirVC, int vIdx) {
  return volumes[vIdx].VCISNormalMatrix * dirVC;
}

//=======================================================================
// Given a normal compute the gradient opacity factors
float computeGradientOpacityFactor(float normalMag, int vIdx, int component) {
  float goscale = volumes[vIdx].gradientOpacityScale[component];
  float goshift = volumes[vIdx].gradientOpacityShift[component];
  float gomin = volumes[vIdx].gradientOpacityMin[component];
  float gomax = volumes[vIdx].gradientOpacityMax[component];
  return clamp(normalMag * goscale + goshift, gomin, gomax);
}

#ifdef vtkClippingPlanesOn
bool isPointClipped(vec3 posVC) {
  for (int i = 0; i < clip_numPlanes; ++i) {
    if (dot(vec3(vClipPlaneOrigins[i] - posVC), vClipPlaneNormals[i]) > 0.0) {
      return true;
    }
  }
  return false;
}
#endif

//=======================================================================
// compute the normal and gradient magnitude for a position, uses forward
// difference

// The output normal is in VC
vec4 computeDensityNormal(vec3 opacityUCoords[2], float opacityTextureHeight,
                          float gradientOpacity, int component, int vIdx) {
  // Pass the scalars through the opacity functions
  vec4 opacityG;
  opacityG.x += getOpacityFromTexture(opacityUCoords[0].x, vIdx, component,
                                      opacityTextureHeight);
  opacityG.y += getOpacityFromTexture(opacityUCoords[0].y, vIdx, component,
                                      opacityTextureHeight);
  opacityG.z += getOpacityFromTexture(opacityUCoords[0].z, vIdx, component,
                                      opacityTextureHeight);
  opacityG.x -= getOpacityFromTexture(opacityUCoords[1].x, vIdx, component,
                                      opacityTextureHeight);
  opacityG.y -= getOpacityFromTexture(opacityUCoords[1].y, vIdx, component,
                                      opacityTextureHeight);
  opacityG.z -= getOpacityFromTexture(opacityUCoords[1].z, vIdx, component,
                                      opacityTextureHeight);

  // Divide by spacing
  opacityG.xyz *= gradientOpacity * volumes[vIdx].inverseSpacing;

  // Get length
  opacityG.w = length(opacityG.xyz);
  if (opacityG.w == 0.0) {
    return vec4(0.0);
  }

  // Normalize and rotate to VC
  opacityG.xyz = rotateToVC(opacityG.xyz / opacityG.w, vIdx);
  return opacityG;
}

// The output normal is in VC
vec4 computeNormalForDensity(vec3 posIS, out vec3 scalarInterp[2],
                             const int opacityComponent, int vIdx) {
  vec3 offsetedPosIS;
  for (int axis = 0; axis < 3; ++axis) {
    // Positive direction
    offsetedPosIS = posIS;
    offsetedPosIS[axis] += volumes[vIdx].inverseDimensions[axis];
    scalarInterp[0][axis] =
        getTextureValue(offsetedPosIS, vIdx)[opacityComponent];
#ifdef vtkClippingPlanesOn
    if (isPointClipped(IStoVC(offsetedPosIS, vIdx))) {
      scalarInterp[0][axis] = 0.0;
    }
#endif

    // Negative direction
    offsetedPosIS = posIS;
    offsetedPosIS[axis] -= volumes[vIdx].inverseDimensions[axis];
    scalarInterp[1][axis] =
        getTextureValue(offsetedPosIS, vIdx)[opacityComponent];
#ifdef vtkClippingPlanesOn
    if (isPointClipped(IStoVC(offsetedPosIS, vIdx))) {
      scalarInterp[1][axis] = 0.0;
    }
#endif
  }

  vec4 result;
  result.xyz =
      (scalarInterp[0] - scalarInterp[1]) * volumes[vIdx].inverseSpacing;
  result.w = length(result.xyz);
  if (result.w == 0.0) {
    return vec4(0.0);
  }
  result.xyz = rotateToVC(result.xyz, vIdx);
  return vec4(result.xyz / result.w, result.w);
}

vec4 fragCoordToPCPos(vec4 fragCoord) {
  return vec4((fragCoord.x / vpWidth - vpOffsetX - 0.5) * 2.0,
              (fragCoord.y / vpHeight - vpOffsetY - 0.5) * 2.0,
              (fragCoord.z - 0.5) * 2.0, 1.0);
}

vec4 pcPosToWorldCoord(vec4 pcPos, int vIdx) {
  return volumes[vIdx].PCWCMatrix * pcPos;
}

vec3 fragCoordToIndexSpace(vec4 fragCoord, int vIdx) {
  vec4 pcPos = fragCoordToPCPos(fragCoord);
  vec4 worldCoord = pcPosToWorldCoord(pcPos, vIdx);
  vec4 vertex = (worldCoord / worldCoord.w);

  vec3 index = (volumes[vIdx].worldToIndex * vertex).xyz;

  // half voxel fix for labelmapOutline
  return (index + vec3(0.5)) * volumes[vIdx].inverseDimensions;
}

vec3 fragCoordToWorld(vec4 fragCoord, int vIdx) {
  vec4 pcPos = fragCoordToPCPos(fragCoord);
  vec4 worldCoord = pcPosToWorldCoord(pcPos, vIdx);
  return worldCoord.xyz;
}

//=======================================================================
// Compute the normals and gradient magnitudes for a position for independent
// components The output normals are in VC
mat4 computeMat4Normal(vec3 posIS, vec4 tValue, int vIdx) {
  vec3 xvec = vec3(volumes[vIdx].inverseDimensions.x, 0.0, 0.0);
  vec3 yvec = vec3(0.0, volumes[vIdx].inverseDimensions.y, 0.0);
  vec3 zvec = vec3(0.0, 0.0, volumes[vIdx].inverseDimensions.z);

  vec4 distX = getTextureValue(posIS + xvec, vIdx) - tValue;
  vec4 distY = getTextureValue(posIS + yvec, vIdx) - tValue;
  vec4 distZ = getTextureValue(posIS + zvec, vIdx) - tValue;

  // divide by spacing
  distX *= volumes[vIdx].inverseSpacing.x;
  distY *= volumes[vIdx].inverseSpacing.y;
  distZ *= volumes[vIdx].inverseSpacing.z;

  mat4 result;

  for (int component = 0; component < volumes[vIdx].numberOfComponents;
       ++component) {
    if (volumes[vIdx].isComponentProportional[component] == 0) {
      result[component].xyz =
          vec3(distX[component], distY[component], distZ[component]);
      result[component].a = length(result[component].xyz);
      result[component].xyz = rotateToVC(result[component].xyz, vIdx);
      if (result[component].w > 0.0) {
        result[component].xyz /= result[component].w;
      }
    }
  }

  return result;
}

//=======================================================================
// global shadow - secondary ray

// henyey greenstein phase function
float phaseFunction(float cos_angle, int vIdx) {
  // divide by 2.0 instead of 4pi to increase intensity
  float anisotropy = volumes[vIdx].anisotropy;
  if (abs(anisotropy) <= EPSILON) {
    // isotropic scatter returns 0.5 instead of 1/4pi to increase intensity
    return 0.5;
  }
  float anisotropy2 = volumes[vIdx].anisotropySquared;
  return ((1.0 - anisotropy2) /
          pow(1.0 + anisotropy2 - 2.0 * anisotropy * cos_angle, 1.5)) /
         2.0;
}

// As rayIntersectVolumeDistances requires the inverse of the ray coords,
// this function is used to avoid numerical issues
void safe_0_vector(inout vec3 dir) {
  if (abs(dir.x) < EPSILON)
    dir.x = sign(dir.x) * EPSILON;
  if (abs(dir.y) < EPSILON)
    dir.y = sign(dir.y) * EPSILON;
  if (abs(dir.z) < EPSILON)
    dir.z = sign(dir.z) * EPSILON;
}

// Compute the two intersection distances of the ray with the volume in VC
// The entry point is `rayOriginVC + distanceMin * rayDirVC` and the exit point
// is `rayOriginVC + distanceMax * rayDirVC` If distanceMin < distanceMax, the
// volume is not intersected The ray origin is inside the box when distanceMin <
// 0.0 < distanceMax
vec2 rayIntersectVolumeDistances(vec3 rayOriginVC, vec3 rayDirVC, int vIdx) {
  // Compute origin and direction in IS
  vec3 rayOriginIS = VCtoIS(rayOriginVC, vIdx);
  vec3 rayDirIS = rotateToIS(rayDirVC, vIdx);
  safe_0_vector(rayDirIS);
  // Scale the inverse direction using the size, because we want the distances
  // in VC instead of IS
  vec3 invDir = volumes[vIdx].size / rayDirIS;

  // We have: bound = origin + t * dir
  // So: t = (1/dir) * (bound - origin)
  vec3 distancesTo0 = invDir * (vec3(0.0) - rayOriginIS);
  vec3 distancesTo1 = invDir * (vec3(1.0) - rayOriginIS);
  // Min and max distances to plane intersection per plane
  vec3 dMin = min(distancesTo0, distancesTo1);
  vec3 dMax = max(distancesTo0, distancesTo1);
  // Overall first and last intersection
  float distanceMin = max(dMin.x, max(dMin.y, dMin.z));
  float distanceMax = min(dMax.x, min(dMax.y, dMax.z));
  return vec2(distanceMin, distanceMax);
}

float computeVolumeShadowWithoutCache(vec3 posVC, vec3 lightDirNormVC) {
  // modify sample distance with a random number between 1.5 and 3.0
  float rayStepLength =
      volumeShadowSampleDistance * mix(1.5, 3.0, fragmentSeed);

  // in case the first sample near surface has a very tiled light ray, we need
  // to offset start position
  vec3 initialPosVC = posVC + rayStepLength * lightDirNormVC;

#ifdef vtkClippingPlanesOn
  float clippingPlanesMaxDistance = infinity;
  for (int i = 0; i < clip_numPlanes; ++i) {
    // Find distance of intersection with the plane
    // Points are clipped when:
    // dot(planeOrigin - (rayOrigin + distance * rayDirection), planeNormal) > 0
    // This is equivalent to:
    // dot(planeOrigin - rayOrigin, planeNormal) - distance * dot(rayDirection,
    // planeNormal) > 0.0
    // We precompute the dot products, so we clip ray points when:
    // dotOrigin - distance * dotDirection > 0.0
    float dotOrigin =
        dot(vClipPlaneOrigins[i] - initialPosVC, vClipPlaneNormals[i]);
    if (dotOrigin > 0.0) {
      // The initialPosVC is clipped by this plane
      return 1.0;
    }
    float dotDirection = dot(lightDirNormVC, vClipPlaneNormals[i]);
    if (dotDirection < 0.0) {
      // We only hit the plane if dotDirection is negative, as (distance is
      // positive)
      float intersectionDistance =
          dotOrigin / dotDirection; // negative divided by negative => positive
      clippingPlanesMaxDistance =
          min(clippingPlanesMaxDistance, intersectionDistance);
    }
  }
#endif

  float shadow = 1.0;
  for (int vIdx = 0; vIdx < vtkNumberOfVolumes; ++vIdx) {
    vec2 intersectionDistances =
        rayIntersectVolumeDistances(initialPosVC, lightDirNormVC, vIdx);

    if (intersectionDistances[1] <= intersectionDistances[0] ||
        intersectionDistances[1] <= 0.0) {
      // Volume not hit or behind the ray
      continue;
    }

    // When globalIlluminationReach is 0, no sample at all
    // When globalIlluminationReach is 1, the ray will go through the whole
    // volume
    float maxTravelDistance = mix(0.0, volumes[vIdx].diagonalLength,
                                  volumes[vIdx].globalIlluminationReach);
    float startDistance = max(intersectionDistances[0], 0.0);
    float endDistance =
        min(intersectionDistances[1], startDistance + maxTravelDistance);
#ifdef vtkClippingPlanesOn
    endDistance = min(endDistance, clippingPlanesMaxDistance);
#endif
    if (endDistance - startDistance < EPSILON) {
      continue;
    }

    // These two variables are used to compute posIS, without having to call
    // VCtoIS at each step
    vec3 initialPosIS = VCtoIS(initialPosVC, vIdx);
    // The light dir is scaled and rotated, but not translated, as it is a
    // vector (w = 0)
    vec3 scaledLightDirIS =
        rotateToIS(lightDirNormVC, vIdx) * volumes[vIdx].inverseSize;

    bool useGradientOpacity = volumes[vIdx].isGradientOpacityEnabled == 1 &&
                              volumes[vIdx].useIndependentComponents == 0;

    for (float currentDistance = startDistance; currentDistance < endDistance;
         currentDistance += rayStepLength) {
      vec3 posIS = initialPosIS + currentDistance * scaledLightDirIS;
      vec4 scalar = getTextureValue(posIS, vIdx);
      float opacity = getOpacityFromTexture(scalar.r, vIdx, 0, 0.5);
      if (useGradientOpacity) {
        vec3 scalarInterp[2];
        vec4 normal = computeNormalForDensity(posIS, scalarInterp, 3, vIdx);
        float opacityFactor = computeGradientOpacityFactor(normal.w, vIdx, 0);
        opacity *= opacityFactor;
      }
      shadow *= 1.0 - opacity;

      // Early termination if shadow coeff is near 0.0
      if (shadow < EPSILON) {
        return 0.0;
      }
    }
  }
  return shadow;
}

// Some cache for volume shadows
struct {
  vec3 posVC;
  float shadow;
} cachedShadows[vtkNumberOfLights];

float computeVolumeShadow(vec3 posVC, vec3 lightDirNormVC, int lightIdx) {
  if (posVC == cachedShadows[lightIdx].posVC) {
    return cachedShadows[lightIdx].shadow;
  }
  float shadow = computeVolumeShadowWithoutCache(posVC, lightDirNormVC);
  cachedShadows[lightIdx].posVC = posVC;
  cachedShadows[lightIdx].shadow = shadow;
  return shadow;
}

//=======================================================================
// local ambient occlusion
#if vtkMaxLaoKernelSize > 0

// Return a random point on the unit sphere
vec3 sampleDirectionUniform(int rayIndex) {
  // Each ray of each fragment should be different, two sources of randomness
  // are used. Only depends on ray index
  vec2 rayRandomness = kernelSample[rayIndex];
  // Only depends on fragment
  float fragmentRandomness = fragmentSeed;
  // Merge both source of randomness in a single uniform random variable using
  // the formula (x+y < 1 ? x+y : x+y-1). The simpler formula (x+y)/2 doesn't
  // result in a uniform distribution
  vec2 mergedRandom = rayRandomness + vec2(fragmentRandomness);
  mergedRandom -= vec2(greaterThanEqual(mergedRandom, vec2(1.0)));

  // Insipred by:
  // https://karthikkaranth.me/blog/generating-random-points-in-a-sphere/#better-choice-of-spherical-coordinates
  float u = mergedRandom[0];
  float v = mergedRandom[1];
  float theta = u * 2.0 * PI;
  float phi = acos(2.0 * v - 1.0);
  float sinTheta = sin(theta);
  float cosTheta = cos(theta);
  float sinPhi = sin(phi);
  float cosPhi = cos(phi);
  return vec3(sinPhi * cosTheta, sinPhi * sinTheta, cosPhi);
}

float computeLAO(vec3 posVC, vec4 normalVC, float originalOpacity, int vIdx) {
  // apply LAO only at selected locations, otherwise return full brightness
  if (volumes[vIdx].kernelSize > 0 || normalVC.w <= 0.0 ||
      originalOpacity <= 0.05) {
    return 1.0;
  }

  float occlusionSum = 0.0;
  float weightSum = 0.0;
  bool isGradientOpacityEnabled = volumes[vIdx].isGradientOpacityEnabled == 1;
  for (int i = 0; i < volumes[vIdx].kernelSize; i++) {
    // Only sample on an hemisphere around the -normalVC.xyz axis, so
    // normalDotRay should be negative
    vec3 rayDirectionVC = sampleDirectionUniform(i);
    float normalDotRay = dot(normalVC.xyz, rayDirectionVC);
    if (normalDotRay > 0.0) {
      // Flip rayDirectionVC when it is in the wrong hemisphere
      rayDirectionVC = -rayDirectionVC;
      normalDotRay = -normalDotRay;
    }

    vec3 currPosIS = VCtoIS(posVC, vIdx);
    float transmittance = 1.0;
    float gradientOpacityFactor =
        computeGradientOpacityFactor(normalVC.w, vIdx, 0);
    vec3 randomDirStepIS = rotateToIS(rayDirectionVC * sampleDistance, vIdx) *
                           volumes[vIdx].inverseSize;
    for (int j = 0; j < volumes[vIdx].kernelRadius; j++) {
      currPosIS += randomDirStepIS;
      // Check if it's at clipping plane, if so return full brightness
      if (any(lessThan(currPosIS, vec3(EPSILON))) ||
          any(greaterThan(currPosIS, vec3(1.0 - EPSILON)))) {
        break;
      }
      float opacity = getOpacityFromTexture(getTextureValue(currPosIS, vIdx).r,
                                            vIdx, 0, 0.5);
      if (isGradientOpacityEnabled) {
        opacity *= gradientOpacityFactor;
      }
      transmittance *= 1.0 - opacity;
      if (transmittance < EPSILON) {
        transmittance = 0.0;
        break;
      }
    }
    float rayOcclusion = (1.0 - transmittance);
    float rayWeight = -normalDotRay;
    occlusionSum += rayOcclusion * rayWeight;
    weightSum += rayWeight;
  }
  // Lao is the average occlusion
  float lao = occlusionSum / weightSum;
  // Reduce variance by clamping
  return clamp(lao, 0.3, 1.0);
}
#endif

//=======================================================================
// surface light contribution
#if vtkNumberOfLights > 0
vec3 applyLighting(vec3 tColor, vec4 normalVC, int vIdx) {
  vec3 diffuse = vec3(0.0, 0.0, 0.0);
  vec3 specular = vec3(0.0, 0.0, 0.0);
  for (int lightIdx = 0; lightIdx < vtkNumberOfLights; lightIdx++) {
    float df = abs(dot(normalVC.xyz, -lights[lightIdx].directionVC));
    diffuse += df * lights[lightIdx].color;
    float sf = pow(abs(dot(lights[lightIdx].halfAngleVC, normalVC.xyz)),
                   volumes[vIdx].specularPower);
    specular += sf * lights[lightIdx].color;
  }
  return tColor * (diffuse * volumes[vIdx].diffuse + volumes[vIdx].ambient) +
         specular * volumes[vIdx].specular;
}

vec3 applySurfaceShadowLighting(vec3 tColor, float alpha, vec3 posVC,
                                vec4 normalVC, int vIdx) {
  // everything in VC
  vec3 diffuse = vec3(0.0);
  vec3 specular = vec3(0.0);
  for (int ligthIdx = 0; ligthIdx < vtkNumberOfLights; ligthIdx++) {
    vec3 vertLightDirection;
    float attenuation;
    if (lights[ligthIdx].isPositional == 1) {
      vertLightDirection = posVC - lights[ligthIdx].positionVC;
      float lightDistance = length(vertLightDirection);
      // Normalize with precomputed length
      vertLightDirection = vertLightDirection / lightDistance;
      // Base attenuation
      vec3 attenuationPolynom = lights[ligthIdx].attenuation;
      attenuation =
          1.0 / (attenuationPolynom[0] +
                 lightDistance * (attenuationPolynom[1] +
                                  lightDistance * attenuationPolynom[2]));
      // Cone attenuation
      float coneDot = dot(vertLightDirection, lights[ligthIdx].directionVC);
      // Per OpenGL standard cone angle is 90 or less for a spot light
      if (lights[ligthIdx].coneAngle <= 90.0) {
        if (coneDot >= cos(radians(lights[ligthIdx].coneAngle))) {
          // Inside the cone
          attenuation *= pow(coneDot, lights[ligthIdx].exponent);
        } else {
          // Outside the cone
          attenuation = 0.0;
        }
      }
    } else {
      vertLightDirection = lights[ligthIdx].directionVC;
      attenuation = 1.0;
    }

    float ndotL = dot(normalVC.xyz, vertLightDirection);
    if (ndotL < 0.0 && twoSidedLighting == 1) {
      ndotL = -ndotL;
    }
    if (ndotL > 0.0) {
      // Diffuse
      diffuse += ndotL * attenuation * lights[ligthIdx].color;
      // Specular
      float vdotR =
          dot(-rayDirVC, vertLightDirection - 2.0 * ndotL * normalVC.xyz);
      if (vdotR > 0.0) {
        specular += pow(vdotR, volumes[vIdx].specularPower) * attenuation *
                    lights[ligthIdx].color;
      }
    }
  }
#if vtkMaxLaoKernelSize > 0
  float laoFactor = computeLAO(posVC, normalVC, alpha, vIdx);
#else
  const float laoFactor = 1.0;
#endif
  return tColor * (diffuse * volumes[vIdx].diffuse +
                   volumes[vIdx].ambient * laoFactor) +
         specular * volumes[vIdx].specular;
}

vec3 applyVolumeShadowLighting(vec3 tColor, vec3 posVC, int vIdx) {
  // Here we assume only positional light, no effect of cones and achromatic
  // light (only intensity)
  vec3 diffuse = vec3(0.0);
  for (int lightIdx = 0; lightIdx < vtkNumberOfLights; lightIdx++) {
    vec3 lightDirVC = lights[lightIdx].isPositional == 1
                          ? normalize(lights[lightIdx].positionVC - posVC)
                          : -lights[lightIdx].directionVC;
    float shadowCoeff = computeVolumeShadow(posVC, lightDirVC, lightIdx);
    float phaseAttenuation = phaseFunction(dot(rayDirVC, lightDirVC), vIdx);
    diffuse += phaseAttenuation * shadowCoeff * lights[lightIdx].color;
  }
  return tColor * (diffuse * volumes[vIdx].diffuse + volumes[vIdx].ambient);
}
#endif

// LAO of surface shadows and volume shadows only work with dependent components
vec3 applyAllLightning(vec3 tColor, float alpha, vec3 posVC,
                       vec4 surfaceNormalVC, int vIdx) {
#if vtkNumberOfLights > 0
  // 0 <= volCoeff < EPSILON => only surface shadows
  // EPSILON <= volCoeff < 1 - EPSILON => mix of surface and volume shadows
  // 1 - EPSILON <= volCoeff => only volume shadows
  float volCoeff = volumes[vIdx].volumetricScatteringBlending *
                   (1.0 - alpha / 2.0) *
                   (1.0 - atan(surfaceNormalVC.w) * INV4PI);

  // Compute the different possible lightings
  vec3 surfaceShadedColor = tColor;
#ifdef EnableSurfaceLighting
  if (volCoeff < 1.0 - EPSILON) {
    surfaceShadedColor =
        applySurfaceShadowLighting(tColor, alpha, posVC, surfaceNormalVC, vIdx);
  }
#endif
  vec3 volumeShadedColor = tColor;
#ifdef EnableVolumeLighting
  if (volCoeff >= EPSILON) {
    volumeShadedColor = applyVolumeShadowLighting(tColor, posVC, vIdx);
  }
#endif

  // Return the right mix
  if (volCoeff < EPSILON) {
    // Surface shadows
    return surfaceShadedColor;
  }
  if (volCoeff >= 1.0 - EPSILON) {
    // Volume shadows
    return volumeShadedColor;
  }
  // Mix of surface and volume shadows
  return mix(surfaceShadedColor, volumeShadedColor, volCoeff);
#endif
  return tColor;
}

vec4 getColorForLabelOutline(int vIdx) {
  vec3 centerPosIS =
      fragCoordToIndexSpace(gl_FragCoord, vIdx); // pos in texture space
  vec4 centerValue = getTextureValue(centerPosIS, vIdx);
  bool pixelOnBorder = false;
  vec4 tColor = vec4(getColorFromTexture(centerValue.r, vIdx, 0, 0.5),
                     getOpacityFromTexture(centerValue.r, vIdx, 0, 0.5));

  int segmentIndex = int(centerValue.r * 255.0);

  // Use texture sampling for outlineThickness
  float textureCoordinate = float(segmentIndex - 1) / 1024.0;
  float textureValue =
      texture2D(labelOutlineThicknessTexture, vec2(textureCoordinate, 0.5)).r;
  int actualThickness = int(textureValue * 255.0);

  // If it is the background (segment index 0), we should quickly bail out.
  // Previously, this was determined by tColor.a, which was incorrect as it
  // prevented the outline from appearing when the fill is 0.
  if (segmentIndex == 0) {
    return vec4(0, 0, 0, 0);
  }

  // Only perform outline check on fragments rendering voxels that aren't
  // invisible. Saves a bunch of needless checks on the background.
  // TODO define epsilon when building shader?
  for (int i = -actualThickness; i <= actualThickness; i++) {
    for (int j = -actualThickness; j <= actualThickness; j++) {
      if (i == 0 || j == 0) {
        continue;
      }

      vec4 neighborPixelCoord =
          vec4(gl_FragCoord.x + float(i), gl_FragCoord.y + float(j),
               gl_FragCoord.z, gl_FragCoord.w);

      vec3 neighborPosIS = fragCoordToIndexSpace(neighborPixelCoord, vIdx);
      vec4 value = getTextureValue(neighborPosIS, vIdx);

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
    tColor.a = volumes[vIdx].outlineOpacity;
  }

  return tColor;
}

vec4 getColorForAdditivePreset(vec4 tValue, vec3 posVC, vec3 posIS, int vIdx) {
  // compute normals
  mat4 normalMat = computeMat4Normal(posIS, tValue, vIdx);
  vec4 normalLights[2];
  normalLights[0] = normalMat[0];
  normalLights[1] = normalMat[1];
#if vtkNumberOfLights > 0
  if (volumes[vIdx].computeNormalFromOpacity == 1) {
    for (int component = 0; component < 2; ++component) {
      vec3 scalarInterp[2];
      float height = volumes[vIdx].transferFunctionsSampleHeight[component];
      computeNormalForDensity(posIS, scalarInterp, component, vIdx);
      normalLights[component] =
          computeDensityNormal(scalarInterp, height, 1.0, component, vIdx);
    }
  }
#endif

  // compute opacities
  float opacities[2];
  opacities[0] = getOpacityFromTexture(
      tValue.r, vIdx, 0, volumes[vIdx].transferFunctionsSampleHeight[0]);
  opacities[1] = getOpacityFromTexture(
      tValue.r, vIdx, 1, volumes[vIdx].transferFunctionsSampleHeight[1]);
  if (volumes[vIdx].isGradientOpacityEnabled == 1) {
    for (int component = 0; component < 2; ++component) {
      opacities[component] *=
          computeGradientOpacityFactor(normalMat[component].a, vIdx, component);
    }
  }
  float opacitySum = opacities[0] + opacities[1];
  if (opacitySum <= 0.0) {
    return vec4(0.0);
  }

  // mix the colors and opacities
  vec3 colors[2];
  for (int component = 0; component < 2; ++component) {
    float sampleHeight = volumes[vIdx].transferFunctionsSampleHeight[component];
    vec3 color = getColorFromTexture(tValue.r, vIdx, component, sampleHeight);
    color = applyAllLightning(color, opacities[component], posVC,
                              normalLights[component], vIdx);
    colors[component] = color;
  }
  vec3 mixedColor =
      (opacities[0] * colors[0] + opacities[1] * colors[1]) / opacitySum;
  return vec4(mixedColor, min(1.0, opacitySum));
}

vec4 getColorForColorizePreset(vec4 tValue, vec3 posVC, vec3 posIS, int vIdx) {
  // compute normals
  mat4 normalMat = computeMat4Normal(posIS, tValue, vIdx);
  vec4 normalLight = normalMat[0];
#if vtkNumberOfLights > 0
  if (volumes[vIdx].computeNormalFromOpacity == 1) {
    vec3 scalarInterp[2];
    float height = volumes[vIdx].transferFunctionsSampleHeight[0];
    computeNormalForDensity(posIS, scalarInterp, 0, vIdx);
    normalLight = computeDensityNormal(scalarInterp, height, 1.0, 0, vIdx);
  }
#endif

  // compute opacities
  float opacity = getOpacityFromTexture(
      tValue.r, vIdx, 0, volumes[vIdx].transferFunctionsSampleHeight[0]);
  if (volumes[vIdx].isGradientOpacityEnabled == 1) {
    opacity *= computeGradientOpacityFactor(normalMat[0].a, vIdx, 0);
  }

  // colorizing component
  vec3 colorizingColor = getColorFromTexture(
      tValue.r, vIdx, 1, volumes[vIdx].transferFunctionsSampleHeight[1]);
  float colorizingOpacity = getOpacityFromTexture(
      tValue.r, vIdx, 1, volumes[vIdx].transferFunctionsSampleHeight[1]);

  // mix the colors and opacities
  vec3 color =
      getColorFromTexture(tValue.r, vIdx, 0,
                          volumes[vIdx].transferFunctionsSampleHeight[0]) *
      mix(vec3(1.0), colorizingColor, colorizingOpacity);
  color = applyAllLightning(color, opacity, posVC, normalLight, vIdx);
  return vec4(color, opacity);
}

vec4 getColorForDefaultIndependentPreset(vec4 tValue, vec3 posIS, int vIdx) {
  // compute the normal vectors as needed
  mat4 normalMat;
  if (vtkNumberOfLights > 0 || volumes[vIdx].isGradientOpacityEnabled == 1) {
    normalMat = computeMat4Normal(posIS, tValue, vIdx);
  }

  // compute gradient opacity factors as needed
  vec4 goFactor = vec4(1.0);
  if (volumes[vIdx].isGradientOpacityEnabled == 1) {
    for (int component = 0; component < volumes[vIdx].numberOfComponents;
         ++component) {
      if (volumes[vIdx].isComponentProportional[component] == 0) {
        goFactor[component] = computeGradientOpacityFactor(
            normalMat[component].a, vIdx, component);
      }
    }
  }
  // sample textures
  vec3 colors[4];

  // process color and opacity for each component
  // initial value of alpha is determined by wether the first component is
  // proportional or not
  // when it is not proportional, it starts at 0 (neutral for additions)
  // when it is proportional, it starts at 1 (neutral for multiplications)
  float alpha = float(volumes[vIdx].isComponentProportional[0] == 0);
  vec3 mixedColor = vec3(0.0);
  for (int component = 0; component < volumes[vIdx].numberOfComponents;
       ++component) {
    vec3 color = getColorFromTexture(
        tValue.r, vIdx, component,
        volumes[vIdx].transferFunctionsSampleHeight[component]);
    float opacity = getOpacityFromTexture(
        tValue.r, vIdx, component,
        volumes[vIdx].transferFunctionsSampleHeight[component]);
    if (volumes[vIdx].isComponentProportional[component] == 0) {
      alpha += goFactor[component] *
               volumes[vIdx].independentComponentMix[component] * opacity;
#if vtkNumberOfLights > 0
      color = applyLighting(color, normalMat[component], vIdx);
#endif
    } else {
      color *= opacity;
      alpha *= mix(opacity, 1.0,
                   (1.0 - volumes[vIdx].independentComponentMix[component]));
    }
    mixedColor += volumes[vIdx].independentComponentMix[component] * color;
  }

  return vec4(mixedColor, alpha);
}

vec4 getColorForDependentComponents(vec4 tValue, vec3 posVC, vec3 posIS,
                                    int vIdx) {
  // compute normal and scalarInterp if needed
  vec4 normal0;
  vec3 scalarInterp[2];
  if (vtkNumberOfLights > 0 || volumes[vIdx].isGradientOpacityEnabled == 1) {
    // use component 3 of the opacity texture as getTextureValue() sets alpha to
    // the opacity value
    normal0 = computeNormalForDensity(posIS, scalarInterp, 3, vIdx);
  }

  // compute gradient opacity factor
  float gradientOpacity;
  if (volumes[vIdx].isGradientOpacityEnabled == 1) {
    gradientOpacity = computeGradientOpacityFactor(normal0.a, vIdx, 0);
  } else {
    gradientOpacity = 1.0;
  }

  // get color and opacity
  vec3 tColor;
  float alpha;
  switch (volumes[vIdx].numberOfComponents) {
  case 1:
    tColor = getColorFromTexture(tValue.r, vIdx, 0, 0.5);
    alpha = gradientOpacity * getOpacityFromTexture(tValue.r, vIdx, 0, 0.5);
    if (alpha < EPSILON) {
      return vec4(0.0);
    }
    break;
  case 2:
    tColor = vec3(tValue.r * volumes[vIdx].colorTextureScale[0] +
                  volumes[vIdx].colorTextureShift[0]);
    alpha = gradientOpacity * getOpacityFromTexture(tValue.a, vIdx, 1, 0.5);
    break;
  case 3:
    tColor = tValue.rgb * volumes[vIdx].colorTextureScale.rgb +
             volumes[vIdx].colorTextureShift.rgb;
    alpha = gradientOpacity * getOpacityFromTexture(tValue.a, vIdx, 0, 0.5);
    break;
  case 4:
    tColor = tValue.rgb * volumes[vIdx].colorTextureScale.rgb +
             volumes[vIdx].colorTextureShift.rgb;
    alpha = gradientOpacity * getOpacityFromTexture(tValue.a, vIdx, 3, 0.5);
    break;
  }

// lighting
#if vtkNumberOfLights > 0
  vec4 normalLight;
  if (volumes[vIdx].computeNormalFromOpacity == 1) {
    if (normal0[3] != 0.0) {
      normalLight =
          computeDensityNormal(scalarInterp, 0.5, gradientOpacity, 0, vIdx);
      if (normalLight[3] == 0.0) {
        normalLight = normal0;
      }
    }
  } else {
    normalLight = normal0;
  }
  tColor = applyAllLightning(tColor, alpha, posVC, normalLight, vIdx);
#endif

  return vec4(tColor, alpha);
}

vec4 getColorForValue(vec4 tValue, vec3 posVC, vec3 posIS, int vIdx) {
  switch (volumes[vIdx].colorForValueFunctionId) {
#ifdef EnableColorForValueFunctionId0
  case 0:
    return getColorForDependentComponents(tValue, posVC, posIS, vIdx);
#endif

#ifdef EnableColorForValueFunctionId1
  case 1:
    return getColorForAdditivePreset(tValue, posVC, posIS, vIdx);
#endif

#ifdef EnableColorForValueFunctionId2
  case 2:
    return getColorForColorizePreset(tValue, posVC, posIS, vIdx);
#endif

#ifdef EnableColorForValueFunctionId3
  case 3:
    /*
     * Mix the color information from all the independent components to get a
     * single rgba output. See other shader functions like
     * `getColorForAdditivePreset` to learn how to create a custom color mix.
     * The custom color mix should return a value, but if it doesn't, it will
     * fallback on the default shading
     */
    //VTK::CustomColorMix
#endif

#ifdef EnableColorForValueFunctionId4
  case 4:
    return getColorForDefaultIndependentPreset(tValue, posIS, vIdx);
#endif

#ifdef EnableColorForValueFunctionId5
  case 5:
    return getColorForLabelOutline(vIdx);
#endif
  }
}

bool valueWithinScalarRange(vec4 val, int vIdx) {
  int numberOfComponents = volumes[vIdx].numberOfComponents;
  if (numberOfComponents > 1 && volumes[vIdx].useIndependentComponents == 0) {
    return false;
  }
  vec4 rangeMin = volumes[vIdx].ipScalarRangeMin;
  vec4 rangeMax = volumes[vIdx].ipScalarRangeMax;
  for (int component = 0; component < numberOfComponents; ++component) {
    if (val[component] < rangeMin[component] ||
        rangeMax[component] < val[component]) {
      return false;
    }
  }
  return true;
}

#if vtkBlendMode == LABELMAP_EDGE_PROJECTION_BLEND
bool checkOnEdgeForNeighbor(int xFragmentOffset, int yFragmentOffset,
                            int segmentIndex, vec3 stepIS, int vIdx) {
  vec3 volumeDimensions = vec3(volumes[vIdx].dimensions);
  vec4 neighborPixelCoord = vec4(gl_FragCoord.x + float(xFragmentOffset),
                                 gl_FragCoord.y + float(yFragmentOffset),
                                 gl_FragCoord.z, gl_FragCoord.w);
  vec3 originalNeighborPosIS = fragCoordToIndexSpace(neighborPixelCoord, vIdx);

  vec3 neighborPosIS = originalNeighborPosIS;
  for (int k = 0; k < maximumNumberOfSamples / 2; ++k) {
    ivec3 texCoord = ivec3(neighborPosIS * volumeDimensions);
    vec4 texValue = fetchVolumeTexture(texCoord, vIdx);
    if (int(texValue.g) == segmentIndex) {
      // not on edge
      return false;
    }
    neighborPosIS += stepIS;
  }

  neighborPosIS = originalNeighborPosIS;
  for (int k = 0; k < maximumNumberOfSamples / 2; ++k) {
    ivec3 texCoord = ivec3(neighborPosIS * volumeDimensions);
    vec4 texValue = fetchVolumeTexture(texCoord, vIdx);
    if (int(texValue.g) == segmentIndex) {
      // not on edge
      return false;
    }
    neighborPosIS -= stepIS;
  }

  // onedge
  float sampleHeight = volumes[vIdx].transferFunctionsSampleHeight[1];
  vec3 tColorSegment =
      getColorFromTexture(float(segmentIndex), vIdx, 1, sampleHeight);
  float pwfValueSegment =
      getOpacityFromTexture(float(segmentIndex), vIdx, 1, sampleHeight);
  gl_FragData[0] = vec4(tColorSegment, pwfValueSegment);
  return true;
}
#endif

vec4 getColorAtPos(vec3 posVC) {
  float transmittanceProduct = 1.0;
  vec3 weightedColors = vec3(0.0);
  float weightSum = 0.0;
  for (int vIdx = 0; vIdx < vtkNumberOfVolumes; ++vIdx) {
    vec3 posIS = VCtoIS(posVC, vIdx);
    if (any(lessThan(posIS, vec3(0.0))) || any(greaterThan(posIS, vec3(1.0)))) {
      continue;
    }
    vec4 texValue = getTextureValue(posIS, vIdx);
    vec4 currentColor = getColorForValue(texValue, posVC, posIS, vIdx);
    float currentTransmittance = 1.0 - currentColor.a;
    if (currentTransmittance == 0.0) {
      return currentColor;
    }
    transmittanceProduct *= currentTransmittance;
    float weight = -log(currentTransmittance);
    weightedColors += currentColor.rgb * weight;
    weightSum += weight;
  }
  if (weightSum == 0.0) {
    return vec4(0.0);
  }
  vec3 finalColor = weightedColors / weightSum;
  float finalOpacity = 1.0 - transmittanceProduct;
  return vec4(finalColor, finalOpacity);
}

//=======================================================================
// Apply the specified blend mode operation along the ray's path.
//
void applyBlend(vec3 rayOriginVC, vec3 rayDirVC, float minDistance,
                float maxDistance, int minDistanceVolumeIdx) {
  // start slightly inside and apply some jitter
  vec3 stepVC = rayDirVC * sampleDistance;
  float raySteps = (maxDistance - minDistance) / sampleDistance;

  // Avoid 0.0 jitter
  float jitter = 0.01 + 0.99 * fragmentSeed;

#if vtkBlendMode == COMPOSITE_BLEND
  // now map through opacity and color
  vec3 firstPosVC = rayOriginVC + minDistance * rayDirVC;
  vec4 firstColor = getColorAtPos(firstPosVC);

  // handle very thin volumes
  if (raySteps <= 1.0) {
    firstColor.a = 1.0 - pow(1.0 - firstColor.a, raySteps);
    gl_FragData[0] = firstColor;
    return;
  }

  // first color only counts for `jitter` factor of the step
  firstColor.a = 1.0 - pow(1.0 - firstColor.a, jitter);
  vec4 color = vec4(firstColor.rgb * firstColor.a, firstColor.a);
  vec3 posVC = firstPosVC + jitter * stepVC;
  float stepsTraveled = jitter;

  while (stepsTraveled + 1.0 < raySteps) {
    vec4 tColor = getColorAtPos(posVC);

    color = color + vec4(tColor.rgb * tColor.a, tColor.a) * (1.0 - color.a);
    stepsTraveled++;
    posVC += stepVC;
    if (color.a > 0.99) {
      color.a = 1.0;
      break;
    }
  }

  if (color.a < 0.99 && (raySteps - stepsTraveled) > 0.0) {
    vec3 endPosVC = rayOriginVC + maxDistance * rayDirVC;
    vec4 tColor = getColorAtPos(endPosVC);
    tColor.a = 1.0 - pow(1.0 - tColor.a, raySteps - stepsTraveled);

    float mix = (1.0 - color.a);
    color = color + vec4(tColor.rgb * tColor.a, tColor.a) * mix;
  }

  gl_FragData[0] = vec4(color.rgb / color.a, color.a);
#endif

#if vtkBlendMode == MAXIMUM_INTENSITY_BLEND ||                                 \
    vtkBlendMode == MINIMUM_INTENSITY_BLEND
// Find maximum/minimum intensity along the ray.

// Define the operation we will use (min or max)
#if vtkBlendMode == MAXIMUM_INTENSITY_BLEND
#define OP max
#else
#define OP min
#endif

  vec3 posVC = rayOriginVC + minDistance * rayDirVC;
  float stepsTraveled = 0.0;

  // Find a value to initialize the selected variables
  vec4 selectedValue;
  vec3 selectedPosVC;
  vec3 selectedPosIS;
  int selectedVIdx;
  {
    int vIdx = minDistanceVolumeIdx;
    vec3 posIS = VCtoIS(posVC, vIdx);
    selectedValue = getTextureValue(posIS, vIdx);
    selectedPosVC = posVC;
    selectedPosIS = posIS;
    selectedVIdx = vIdx;
  }

  // If the clipping range is shorter than the sample distance
  // we can skip the sampling loop along the ray.
  if (raySteps <= 1.0) {
    gl_FragData[0] = getColorForValue(selectedValue, selectedPosVC,
                                      selectedPosIS, selectedVIdx);
    return;
  }

  posVC += jitter * stepVC;
  stepsTraveled += jitter;

  // Sample along the ray until maximumNumberOfSamples,
  // ending slightly inside the total distance
  for (int i = 0; i < maximumNumberOfSamples; ++i) {
    // If we have reached the last step, break
    if (stepsTraveled + 1.0 >= raySteps) {
      break;
    }

    for (int vIdx = 0; vIdx < vtkNumberOfVolumes; ++vIdx) {
      vec3 posIS = VCtoIS(posVC, vIdx);
      if (any(lessThan(posIS, vec3(0.0))) ||
          any(greaterThan(posIS, vec3(1.0)))) {
        continue;
      }

      // Get selected values
      vec4 previousSelectedValue = selectedValue;
      vec4 currentValue = getTextureValue(posIS, vIdx);
      selectedValue = OP(selectedValue, currentValue);
      if (previousSelectedValue != selectedValue) {
        selectedPosVC = posVC;
        selectedPosIS = posIS;
        selectedVIdx = vIdx;
      }
    }

    // Otherwise, continue along the ray
    stepsTraveled++;
    posVC += stepVC;
  }

  // Perform the last step along the ray using the
  // residual distance
  posVC = rayOriginVC + maxDistance * rayDirVC;
  for (int vIdx = 0; vIdx < vtkNumberOfVolumes; ++vIdx) {
    vec3 posIS = VCtoIS(posVC, vIdx);
    // Epsilon margin to make sure that the selectedValue is initialized
    if (any(lessThan(posIS, vec3(-EPSILON))) ||
        any(greaterThan(posIS, vec3(1.0 + EPSILON)))) {
      continue;
    }
    posIS = clamp(posIS, 0.0, 1.0);

    // Get selected values
    vec4 previousSelectedValue = selectedValue;
    vec4 currentValue = getTextureValue(posIS, vIdx);
    selectedValue = OP(selectedValue, currentValue);
    if (previousSelectedValue != selectedValue) {
      selectedPosVC = posVC;
      selectedPosIS = posIS;
      selectedVIdx = vIdx;
    }
  }

  gl_FragData[0] = getColorForValue(selectedValue, selectedPosVC, selectedPosIS,
                                    selectedVIdx);
#endif

#if vtkBlendMode == ADDITIVE_INTENSITY_BLEND ||                                \
    vtkBlendMode == AVERAGE_INTENSITY_BLEND
  vec4 sum = vec4(0.);
#if vtkBlendMode == AVERAGE_INTENSITY_BLEND
  float totalWeight = 0.0;
#endif
  vec3 posVC = rayOriginVC + minDistance * rayDirVC;
  float stepsTraveled = 0.0;
  int lastSampledVolumeIdx = 0;

  for (int vIdx = 0; vIdx < vtkNumberOfVolumes; ++vIdx) {
    vec3 posIS = VCtoIS(posVC, vIdx);
    if (any(lessThan(posIS, vec3(0.0))) || any(greaterThan(posIS, vec3(1.0)))) {
      continue;
    }
    vec4 value = getTextureValue(posIS, vIdx);
    if (valueWithinScalarRange(value, vIdx)) {
      sum += value;
      totalWeight++;
      lastSampledVolumeIdx = vIdx;
    }
  }

  if (raySteps <= 1.0) {
    vec3 posIS = VCtoIS(posVC, lastSampledVolumeIdx);
    gl_FragData[0] = getColorForValue(sum, posVC, posIS, lastSampledVolumeIdx);
    return;
  }

  posVC += jitter * stepVC;
  stepsTraveled += jitter;

  // Sample along the ray until maximumNumberOfSamples,
  // ending slightly inside the total distance
  for (int i = 0; i < maximumNumberOfSamples; ++i) {
    // If we have reached the last step, break
    if (stepsTraveled + 1.0 >= raySteps) {
      break;
    }

    for (int vIdx = 0; vIdx < vtkNumberOfVolumes; ++vIdx) {
      vec3 posIS = VCtoIS(posVC, vIdx);
      if (any(lessThan(posIS, vec3(0.0))) ||
          any(greaterThan(posIS, vec3(1.0)))) {
        continue;
      }
      vec4 value = getTextureValue(posIS, vIdx);
      // One can control the scalar range by setting the AverageIPScalarRange to
      // disregard scalar values, not in the range of interest, from the average
      // computation. Notes:
      // - We are comparing all values in the texture to see if any of them
      //   are outside of the scalar range. In the future we might want to allow
      //   scalar ranges for each component.
      if (valueWithinScalarRange(value, vIdx)) {
        sum += value;
        totalWeight++;
        lastSampledVolumeIdx = vIdx;
      }
    }

    stepsTraveled++;
    posVC += stepVC;
  }

  // Perform the last step along the ray using the
  // residual distance
  posVC = rayOriginVC + maxDistance * rayDirVC;

  for (int vIdx = 0; vIdx < vtkNumberOfVolumes; ++vIdx) {
    vec3 posIS = VCtoIS(posVC, vIdx);
    if (any(lessThan(posIS, vec3(0.0))) || any(greaterThan(posIS, vec3(1.0)))) {
      continue;
    }
    vec4 value = getTextureValue(posIS, vIdx);
    if (valueWithinScalarRange(value, vIdx)) {
      sum += value;
      totalWeight++;
      lastSampledVolumeIdx = vIdx;
    }
  }

#if vtkBlendMode == AVERAGE_INTENSITY_BLEND
  sum /= vec4(totalWeight, totalWeight, totalWeight, 1.0);
#endif

  vec3 posIS = VCtoIS(posVC, lastSampledVolumeIdx);
  gl_FragData[0] = getColorForValue(sum, posVC, posIS, lastSampledVolumeIdx);
#endif

#if vtkBlendMode == RADON_TRANSFORM_BLEND
  float normalizedRayIntensity = 1.0;
  vec3 posVC = rayOriginVC + minDistance * rayDirVC;
  float stepsTraveled = 0.0;

  // handle very thin volumes
  if (raySteps <= 1.0) {
    int vIdx = minDistanceVolumeIdx;
    vec3 posIS = VCtoIS(posVC, vIdx);
    vec4 tValue = getTextureValue(posIS, vIdx);
    normalizedRayIntensity -= raySteps * sampleDistance *
                              getOpacityFromTexture(tValue.r, 0, vIdx, 0.5);
    gl_FragData[0] =
        vec4(getColorFromTexture(normalizedRayIntensity, 0, vIdx, 0.5), 1.0);
    return;
  }

  posVC += jitter * stepVC;
  stepsTraveled += jitter;

  for (int i = 0; i < maximumNumberOfSamples; ++i) {
    if (stepsTraveled + 1.0 >= raySteps) {
      break;
    }

    for (int vIdx = 0; vIdx < vtkNumberOfVolumes; ++vIdx) {
      vec3 posIS = VCtoIS(posVC, vIdx);
      if (any(lessThan(posIS, vec3(0.0))) ||
          any(greaterThan(posIS, vec3(1.0)))) {
        continue;
      }
      vec4 value = getTextureValue(posIS, vIdx);
      // Convert scalar value to normalizedRayIntensity coefficient and
      // accumulate normalizedRayIntensity
      normalizedRayIntensity -=
          sampleDistance * getOpacityFromTexture(value.r, 0, vIdx, 0.5);
    }

    posVC += stepVC;
    stepsTraveled++;
  }

  // map normalizedRayIntensity to color
  int vIdx = 0;
  gl_FragData[0] =
      vec4(getColorFromTexture(normalizedRayIntensity, 0, vIdx, 0.5), 1.0);
#endif

#if vtkBlendMode == LABELMAP_EDGE_PROJECTION_BLEND
  // Only works with a single volume
  const int vIdx = 0;
  vec3 posVC = rayOriginVC + minDistance * rayDirVC;
  float stepsTraveled = 0.0;
  vec3 posIS = VCtoIS(posVC, vIdx);
  vec4 tValue = getTextureValue(posIS, vIdx);
  if (raySteps <= 1.0) {
    gl_FragData[0] = getColorForValue(tValue, posVC, posIS, vIdx);
    return;
  }

  vec3 stepIS = rotateToIS(stepVC, vIdx) * volumes[vIdx].inverseSize;
  vec4 value = tValue;
  posIS += jitter * stepIS;
  stepsTraveled += jitter;
  vec3 maxPosIS = posIS; // Store the position of the max value
  int segmentIndex = int(value.g);
  bool originalPosHasSeenNonZero = false;

  if (segmentIndex != 0) {
    // Tried using the segment index in an boolean array but reading
    // from the array by dynamic indexing was horrondously slow
    // so use bit masking instead and assign 1 to the bit corresponding to the
    // segment index and later check if the bit is set via bit operations
    setLabelOutlineBit(segmentIndex);
  }

  // Sample along the ray until maximumNumberOfSamples,
  // ending slightly inside the total distance
  for (int i = 0; i < maximumNumberOfSamples; ++i) {
    // If we have reached the last step, break
    if (stepsTraveled + 1.0 >= raySteps) {
      break;
    }

    // compute the scalar
    tValue = getTextureValue(posIS, vIdx);
    segmentIndex = int(tValue.g);

    if (segmentIndex != 0) {
      originalPosHasSeenNonZero = true;
      setLabelOutlineBit(segmentIndex);
    }

    if (tValue.r > value.r) {
      value = tValue;   // Update the max value
      maxPosIS = posIS; // Update the position where max occurred
    }

    // Otherwise, continue along the ray
    stepsTraveled++;
    posIS += stepIS;
  }

  // Perform the last step along the ray using the
  // residual distance
  posIS = VCtoIS(rayOriginVC + maxDistance * rayDirVC, vIdx);
  tValue = getTextureValue(posIS, vIdx);

  if (tValue.r > value.r) {
    value = tValue;   // Update the max value
    maxPosIS = posIS; // Update the position where max occurred
  }

  // If we have not seen any non-zero segments, we can return early
  // and grab color from the actual center value first component (image)
  if (!originalPosHasSeenNonZero) {
    vec3 maxPosVC = IStoVC(maxPosIS, vIdx);
    gl_FragData[0] = getColorForValue(value, maxPosVC, maxPosIS, vIdx);
    return;
  }

  vec3 neighborRayStepsIS = stepIS;
  float neighborRaySteps = raySteps;
  bool shouldLookInAllNeighbors = false;

  vec3 volumeSpacings = volumes[vIdx].spacing;
  float minVoxelSpacing =
      min(volumeSpacings[0], min(volumeSpacings[1], volumeSpacings[2]));
  vec4 base =
      vec4(gl_FragCoord.x, gl_FragCoord.y, gl_FragCoord.z, gl_FragCoord.w);

  vec4 baseXPlus = vec4(gl_FragCoord.x + 1.0, gl_FragCoord.y, gl_FragCoord.z,
                        gl_FragCoord.w);
  vec4 baseYPlus = vec4(gl_FragCoord.x, gl_FragCoord.y + 1.0, gl_FragCoord.z,
                        gl_FragCoord.w);

  vec3 baseWorld = fragCoordToWorld(base, vIdx);
  vec3 baseXPlusWorld = fragCoordToWorld(baseXPlus, vIdx);
  vec3 baseYPlusWorld = fragCoordToWorld(baseYPlus, vIdx);

  float XPlusDiff = length(baseXPlusWorld - baseWorld);
  float YPlusDiff = length(baseYPlusWorld - baseWorld);

  float minFragSpacingWorld = min(XPlusDiff, YPlusDiff);

  for (int s = 1; s < MAX_SEGMENT_INDEX; s++) {
    // bail out quickly if the segment index has not
    // been seen by the center segment
    if (!isLabelOutlineBitSet(s)) {
      continue;
    }

    // Use texture sampling for outlineThickness so that we can have
    // per segment thickness
    float textureCoordinate = float(s - 1) / 1024.0;
    float textureValue =
        texture2D(labelOutlineThicknessTexture, vec2(textureCoordinate, 0.5)).r;

    int actualThickness = int(textureValue * 255.0);

    // check the extreme points in the neighborhood since there is a better
    // chance of finding the edge there, so that we can bail out
    // faster if we find the edge
    bool onEdge = checkOnEdgeForNeighbor(-actualThickness, -actualThickness, s,
                                         stepIS, vIdx) ||
                  checkOnEdgeForNeighbor(actualThickness, actualThickness, s,
                                         stepIS, vIdx) ||
                  checkOnEdgeForNeighbor(actualThickness, -actualThickness, s,
                                         stepIS, vIdx) ||
                  checkOnEdgeForNeighbor(-actualThickness, +actualThickness, s,
                                         stepIS, vIdx);

    if (onEdge) {
      return;
    }

    // since the next step is computationally expensive, we need to perform
    // some optimizations to avoid it if possible. One of the optimizations
    // is to check the whether the minimum of the voxel spacing is greater than
    // the 2 * the thickness of the outline segment. If that is the case
    // then we can safely skip the next step since we can be sure that the
    // the previous 4 checks on the extreme points would caught the entirety
    // of the all the fragments inside. i.e., this happens when we zoom out,
    if (minVoxelSpacing >
        (2.0 * float(actualThickness) - 1.0) * minFragSpacingWorld) {
      continue;
    }

    // Loop through the rest, skipping the processed extremes and the center
    for (int i = -actualThickness; i <= actualThickness; i++) {
      for (int j = -actualThickness; j <= actualThickness; j++) {
        if (i == 0 && j == 0)
          continue; // Skip the center
        if (abs(i) == actualThickness && abs(j) == actualThickness)
          continue; // Skip corners
        if (checkOnEdgeForNeighbor(i, j, s, stepIS, vIdx)) {
          return;
        }
      }
    }
  }

  float sampleHeight = volumes[vIdx].transferFunctionsSampleHeight[0];
  vec3 tColor0 = getColorFromTexture(value.r, vIdx, 0, sampleHeight);
  float pwfValue0 = getOpacityFromTexture(value.r, vIdx, 0, sampleHeight);
  gl_FragData[0] = vec4(tColor0, pwfValue0);
#endif
}

//=======================================================================
// given a
// - ray direction (rayDir)
// - starting point (vertexVCVSOutput)
// - bounding planes of the volume
// - optionally depth buffer values
// - far clipping plane
// compute the start/end distances of the ray we need to cast
vec2 computeRayDistances(vec3 rayOriginVC, vec3 rayDirVC, int vIdx) {
  vec2 dists = rayIntersectVolumeDistances(rayOriginVC, rayDirVC, vIdx);

  //VTK::ClipPlane::Impl

  // do not go behind front clipping plane
  dists.x = max(0.0, dists.x);

  // do not go PAST far clipping plane
  float farDist = -camThick / rayDirVC.z;
  dists.y = min(farDist, dists.y);

  // Do not go past the zbuffer value if set
  // This is used for intermixing opaque geometry
  //VTK::ZBuffer::Impl

  return dists;
}

float getFragmentSeed() {
  // This first noise has a diagonal pattern
  float firstNoise =
      fract(sin(dot(gl_FragCoord.xy, vec2(12.9898, 78.233))) * 43758.5453);
  // This second noise is made out of blocks of CPU generated noise
  float secondNoise = texture2D(jtexture, gl_FragCoord.xy / 32.0).r;
  // Combine the two sources of noise in a way that the distribution is uniform
  // in [0,1[
  float noiseSum = firstNoise + secondNoise;
  return noiseSum < 1.0 ? noiseSum : noiseSum - 1.0;
}

void main() {
  fragmentSeed = getFragmentSeed();

  if (cameraParallel == 1) {
    // Camera is parallel, so the rayDir is just the direction of the camera.
    rayDirVC = vec3(0.0, 0.0, -1.0);
  } else {
    // camera is at 0,0,0 so rayDir for perspective is just the vc coord
    rayDirVC = normalize(vertexVCVSOutput);
  }

  vec2 mergedStartEndDistancesVC = vec2(infinity, -infinity);
  vec3 rayOriginVC = vertexVCVSOutput;
  int minDistanceVolumeIdx = 0;
  for (int vIdx = 0; vIdx < vtkNumberOfVolumes; ++vIdx) {
    // compute the start and end points for the ray
    vec2 rayStartEndDistancesVC =
        computeRayDistances(rayOriginVC, rayDirVC, vIdx);
    if (rayStartEndDistancesVC.y <= rayStartEndDistancesVC.x ||
        rayStartEndDistancesVC.y <= 0.0) {
      continue;
    }
    if (rayStartEndDistancesVC.x < mergedStartEndDistancesVC.x) {
      mergedStartEndDistancesVC.x = rayStartEndDistancesVC.x;
      minDistanceVolumeIdx = vIdx;
    }
    if (rayStartEndDistancesVC.y > mergedStartEndDistancesVC.y) {
      mergedStartEndDistancesVC.y = rayStartEndDistancesVC.y;
    }
  }

  // Perform the blending operation along the ray
  applyBlend(rayOriginVC, rayDirVC, mergedStartEndDistancesVC.x,
             mergedStartEndDistancesVC.y, minDistanceVolumeIdx);
}
