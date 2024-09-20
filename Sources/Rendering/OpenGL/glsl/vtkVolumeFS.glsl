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
#define vtkNumberOfComponents //VTK::NumberOfComponents
#define vtkBlendMode //VTK::BlendMode
#define vtkMaximumNumberOfSamples //VTK::MaximumNumberOfSamples

//VTK::EnabledColorFunctions

//VTK::EnabledLightings

//VTK::EnabledMultiTexturePerVolume

//VTK::EnabledGradientOpacity

//VTK::EnabledIndependentComponents

//VTK::vtkProportionalComponents

//VTK::vtkForceNearestComponents

uniform int twoSidedLighting;

#if vtkMaxLaoKernelSize > 0
  vec2 kernelSample[vtkMaxLaoKernelSize];
#endif

// Textures
#ifdef EnabledMultiTexturePerVolume
  #define vtkNumberOfVolumeTextures vtkNumberOfComponents
#else
  #define vtkNumberOfVolumeTextures 1
#endif
uniform highp sampler3D volumeTexture[vtkNumberOfVolumeTextures];
uniform sampler2D colorTexture;
uniform sampler2D opacityTexture;
uniform sampler2D jtexture;
uniform sampler2D labelOutlineThicknessTexture;

struct Volume {
  // ---- Volume geometry settings ----

  vec3 originVC;          // in VC
  vec3 spacing;           // in VC per IC
  vec3 inverseSpacing;    // 1/spacing
  ivec3 dimensions;       // in IC
  vec3 inverseDimensions; // 1/vec3(dimensions)
  mat3 vecISToVCMatrix;   // convert from IS to VC without translation
  mat3 vecVCToISMatrix;   // convert from VC to IS without translation
  mat4 PCWCMatrix;
  mat4 worldToIndex;
  float diagonalLength; // in VC, this is: length(size)

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
uniform Volume volume;

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

vec4 rawSampleTexture(vec3 pos) {
  #ifdef EnabledMultiTexturePerVolume
    vec4 rawSample;
    rawSample[0] = texture(volumeTexture[0], pos)[0];
  #if vtkNumberOfComponents > 1
    rawSample[1] = texture(volumeTexture[1], pos)[0];
  #endif
  #if vtkNumberOfComponents > 2
    rawSample[2] = texture(volumeTexture[2], pos)[0];
  #endif
  #if vtkNumberOfComponents > 3
    rawSample[3] = texture(volumeTexture[3], pos)[0];
  #endif
    return rawSample;
  #else
    return texture(volumeTexture[0], pos);
  #endif
}

vec4 rawFetchTexture(ivec3 pos) {
  #ifdef EnabledMultiTexturePerVolume
    vec4 rawSample;
    #if vtkNumberOfComponents > 0
      rawSample[0] = texelFetch(volumeTexture[0], pos, 0)[0];
    #endif
    #if vtkNumberOfComponents > 1
      rawSample[1] = texelFetch(volumeTexture[1], pos, 0)[0];
    #endif
    #if vtkNumberOfComponents > 2
      rawSample[2] = texelFetch(volumeTexture[2], pos, 0)[0];
    #endif
    #if vtkNumberOfComponents > 3
      rawSample[3] = texelFetch(volumeTexture[3], pos, 0)[0];
    #endif
    return rawSample;
  #else
    return texelFetch(volumeTexture[0], pos, 0);
  #endif
}

vec4 getTextureValue(vec3 pos) {
  vec4 tmp = rawSampleTexture(pos);

  // Force nearest
  #if defined(vtkComponent0ForceNearest) || \
      defined(vtkComponent1ForceNearest) || \
      defined(vtkComponent2ForceNearest) || \
      defined(vtkComponent3ForceNearest)
    vec3 nearestPos = (floor(pos * vec3(volume.dimensions)) + 0.5) *
                      volume.inverseDimensions;
    vec4 nearestValue = rawSampleTexture(nearestPos);
    #ifdef vtkComponent0ForceNearest
      tmp[0] = nearestValue[0];
    #endif
    #ifdef vtkComponent1ForceNearest
      tmp[1] = nearestValue[1];
    #endif
    #ifdef vtkComponent2ForceNearest
      tmp[2] = nearestValue[2];
    #endif
    #ifdef vtkComponent3ForceNearest
      tmp[3] = nearestValue[3];
    #endif
  #endif

  // Set alpha when using dependent components
  #ifndef EnabledIndependentComponents
    #if vtkNumberOfComponents == 1
      tmp.a = tmp.r;
    #endif
    #if vtkNumberOfComponents == 2
      tmp.a = tmp.g;
    #endif
    #if vtkNumberOfComponents == 3
      tmp.a = length(tmp.rgb);
    #endif
  #endif

  return tmp;
}

// `height` is usually `volume.transferFunctionsSampleHeight[component]`
// when using independent component and `0.5` otherwise. Don't move the if
// statement in these function, as the callers usually already knows if it is
// using independent component or not
float getOpacityFromTexture(float scalar, int component, float height) {
  float scaledScalar = scalar * volume.opacityTextureScale[component] +
                       volume.opacityTextureShift[component];
  return texture2D(opacityTexture, vec2(scaledScalar, height)).r;
}
vec3 getColorFromTexture(float scalar, int component, float height) {
  float scaledScalar = scalar * volume.colorTextureScale[component] +
                       volume.colorTextureShift[component];
  return texture2D(colorTexture, vec2(scaledScalar, height)).rgb;
}

//=======================================================================
// transformation between VC and IS space

// convert vector position from idx to vc
vec3 posIStoVC(vec3 posIS) {
  return volume.vecISToVCMatrix * posIS + volume.originVC;
}

// convert vector position from vc to idx
vec3 posVCtoIS(vec3 posVC) {
  return volume.vecVCToISMatrix * (posVC - volume.originVC);
}

// Rotate vector to view coordinate
vec3 vecISToVC(vec3 dirIS) {
  return volume.vecISToVCMatrix * dirIS;
}

// Rotate vector to idx coordinate
vec3 vecVCToIS(vec3 dirVC) {
  return volume.vecVCToISMatrix * dirVC;
}

//=======================================================================
// Given a normal compute the gradient opacity factors
float computeGradientOpacityFactor(float normalMag, int component) {
  float goscale = volume.gradientOpacityScale[component];
  float goshift = volume.gradientOpacityShift[component];
  float gomin = volume.gradientOpacityMin[component];
  float gomax = volume.gradientOpacityMax[component];
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
                          float gradientOpacity, int component) {
  // Pass the scalars through the opacity functions
  vec4 opacityG;
  opacityG.x += getOpacityFromTexture(opacityUCoords[0].x, component,
                                      opacityTextureHeight);
  opacityG.y += getOpacityFromTexture(opacityUCoords[0].y, component,
                                      opacityTextureHeight);
  opacityG.z += getOpacityFromTexture(opacityUCoords[0].z, component,
                                      opacityTextureHeight);
  opacityG.x -= getOpacityFromTexture(opacityUCoords[1].x, component,
                                      opacityTextureHeight);
  opacityG.y -= getOpacityFromTexture(opacityUCoords[1].y, component,
                                      opacityTextureHeight);
  opacityG.z -= getOpacityFromTexture(opacityUCoords[1].z, component,
                                      opacityTextureHeight);

  // Divide by spacing and convert to VC
  opacityG.xyz *= gradientOpacity * volume.inverseSpacing;
  opacityG.w = length(opacityG.xyz);
  if (opacityG.w == 0.0) {
    return vec4(0.0);
  }

  // Normalize
  opacityG.xyz = normalize(vecISToVC(opacityG.xyz));

  return opacityG;
}

// The output normal is in VC
vec4 computeNormalForDensity(vec3 posIS, out vec3 scalarInterp[2],
                             const int opacityComponent) {
  vec3 offsetedPosIS;
  for (int axis = 0; axis < 3; ++axis) {
    // Positive direction
    offsetedPosIS = posIS;
    offsetedPosIS[axis] += volume.inverseDimensions[axis];
    scalarInterp[0][axis] =
        getTextureValue(offsetedPosIS)[opacityComponent];
    #ifdef vtkClippingPlanesOn
      if (isPointClipped(posIStoVC(offsetedPosIS))) {
        scalarInterp[0][axis] = 0.0;
      }
    #endif

    // Negative direction
    offsetedPosIS = posIS;
    offsetedPosIS[axis] -= volume.inverseDimensions[axis];
    scalarInterp[1][axis] =
        getTextureValue(offsetedPosIS)[opacityComponent];
    #ifdef vtkClippingPlanesOn
      if (isPointClipped(posIStoVC(offsetedPosIS))) {
        scalarInterp[1][axis] = 0.0;
      }
    #endif
  }

  vec4 result;
  result.xyz = (scalarInterp[0] - scalarInterp[1]) * volume.inverseSpacing;
  result.w = length(result.xyz);
  if (result.w == 0.0) {
    return vec4(0.0);
  }
  result.xyz = normalize(vecISToVC(result.xyz));
  return result;
}

vec4 fragCoordToPCPos(vec4 fragCoord) {
  return vec4((fragCoord.x / vpWidth - vpOffsetX - 0.5) * 2.0,
              (fragCoord.y / vpHeight - vpOffsetY - 0.5) * 2.0,
              (fragCoord.z - 0.5) * 2.0, 1.0);
}

vec4 pcPosToWorldCoord(vec4 pcPos) {
  return volume.PCWCMatrix * pcPos;
}

vec3 fragCoordToIndexSpace(vec4 fragCoord) {
  vec4 pcPos = fragCoordToPCPos(fragCoord);
  vec4 worldCoord = pcPosToWorldCoord(pcPos);
  vec4 vertex = (worldCoord / worldCoord.w);

  vec3 index = (volume.worldToIndex * vertex).xyz;

  // half voxel fix for labelmapOutline
  return (index + vec3(0.5)) * volume.inverseDimensions;
}

vec3 fragCoordToWorld(vec4 fragCoord) {
  vec4 pcPos = fragCoordToPCPos(fragCoord);
  vec4 worldCoord = pcPosToWorldCoord(pcPos);
  return worldCoord.xyz;
}

//=======================================================================
// Compute the normals and gradient magnitudes for a position for independent
// components The output normals are in VC
mat4 computeMat4Normal(vec3 posIS, vec4 tValue) {
  vec3 xvec = vec3(volume.inverseDimensions.x, 0.0, 0.0);
  vec3 yvec = vec3(0.0, volume.inverseDimensions.y, 0.0);
  vec3 zvec = vec3(0.0, 0.0, volume.inverseDimensions.z);

  vec4 distX = getTextureValue(posIS + xvec) - getTextureValue(posIS - xvec);
  vec4 distY = getTextureValue(posIS + yvec) - getTextureValue(posIS - yvec);
  vec4 distZ = getTextureValue(posIS + zvec) - getTextureValue(posIS - zvec);

  // divide by spacing
  distX *= 0.5 * volume.inverseSpacing.x;
  distY *= 0.5 * volume.inverseSpacing.y;
  distZ *= 0.5 * volume.inverseSpacing.z;

  mat4 result;

  // optionally compute the 1st component
  #if vtkNumberOfComponents > 0 && !defined(vtkComponent0Proportional)
    {
      const int component = 0;
      vec3 normal = vec3(distX[component], distY[component], distZ[component]);
      float normalLength = length(normal);
      if (normalLength > 0.0) {
        normal = normalize(vecISToVC(normal));
      }
      result[component] = vec4(normal, normalLength);
    }
  #endif

  // optionally compute the 2nd component
  #if vtkNumberOfComponents > 1 && !defined(vtkComponent1Proportional)
    {
      const int component = 1;
      vec3 normal = vec3(distX[component], distY[component], distZ[component]);
      float normalLength = length(normal);
      if (normalLength > 0.0) {
        normal = normalize(vecISToVC(normal));
      }
      result[component] = vec4(normal, normalLength);
    }
  #endif

  // optionally compute the 3rd component
  #if vtkNumberOfComponents > 2 && !defined(vtkComponent2Proportional)
    {
      const int component = 2;
      vec3 normal = vec3(distX[component], distY[component], distZ[component]);
      float normalLength = length(normal);
      if (normalLength > 0.0) {
        normal = normalize(vecISToVC(normal));
      }
      result[component] = vec4(normal, normalLength);
    }
  #endif

  // optionally compute the 4th component
  #if vtkNumberOfComponents > 3 && !defined(vtkComponent3Proportional)
    {
      const int component = 3;
      vec3 normal = vec3(distX[component], distY[component], distZ[component]);
      float normalLength = length(normal);
      if (normalLength > 0.0) {
        normal = normalize(vecISToVC(normal));
      }
      result[component] = vec4(normal, normalLength);
    }
  #endif

  return result;
}

//=======================================================================
// global shadow - secondary ray

// henyey greenstein phase function
float phaseFunction(float cos_angle) {
  // divide by 2.0 instead of 4pi to increase intensity
  float anisotropy = volume.anisotropy;
  if (abs(anisotropy) <= EPSILON) {
    // isotropic scatter returns 0.5 instead of 1/4pi to increase intensity
    return 0.5;
  }
  float anisotropy2 = volume.anisotropySquared;
  return ((1.0 - anisotropy2) /
          pow(1.0 + anisotropy2 - 2.0 * anisotropy * cos_angle, 1.5)) /
         2.0;
}

// Compute the two intersection distances of the ray with the volume in VC
// The entry point is `rayOriginVC + distanceMin * rayDirVC` and the exit point
// is `rayOriginVC + distanceMax * rayDirVC` If distanceMin < distanceMax, the
// volume is not intersected The ray origin is inside the box when distanceMin <
// 0.0 < distanceMax
vec2 rayIntersectVolumeDistances(vec3 rayOriginVC, vec3 rayDirVC) {
  // Compute origin and direction in IS
  vec3 rayOriginIS = posVCtoIS(rayOriginVC);
  vec3 rayDirIS = vecVCToIS(rayDirVC);
  // Don't check for infinity as the min/max combination afterward will always
  // find an intersection before infinity
  vec3 invDir = 1.0 / rayDirIS;

  // We have: bound = origin + t * dir
  // So: t = (1/dir) * (bound - origin)
  vec3 distancesTo0 = invDir * (vec3(0.0) - rayOriginIS);
  vec3 distancesTo1 = invDir * (vec3(1.0) - rayOriginIS);
  // Min and max distances to plane intersection per plane
  vec3 dMinPerAxis = min(distancesTo0, distancesTo1);
  vec3 dMaxPerAxis = max(distancesTo0, distancesTo1);
  // Overall first and last intersection
  float distanceMin = max(dMinPerAxis.x, max(dMinPerAxis.y, dMinPerAxis.z));
  float distanceMax = min(dMaxPerAxis.x, min(dMaxPerAxis.y, dMaxPerAxis.z));
  return vec2(distanceMin, distanceMax);
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

  float computeLAO(vec3 posVC, vec4 normalVC, float originalOpacity) {
    // apply LAO only at selected locations, otherwise return full brightness
    if (normalVC.w <= 0.0 || originalOpacity <= 0.05) {
      return 1.0;
    }

    #ifdef EnabledGradientOpacity
      float gradientOpacityFactor = computeGradientOpacityFactor(normalVC.w, 0);
    #endif

    float visibilitySum = 0.0;
    float weightSum = 0.0;
    for (int i = 0; i < volume.kernelSize; i++) {
      // Only sample on an hemisphere around the normalVC.xyz axis, so
      // normalDotRay should be negative
      vec3 rayDirectionVC = sampleDirectionUniform(i);
      float normalDotRay = dot(normalVC.xyz, rayDirectionVC);
      if (normalDotRay > 0.0) {
        // Flip rayDirectionVC when it is in the wrong hemisphere
        rayDirectionVC = -rayDirectionVC;
        normalDotRay = -normalDotRay;
      }

      vec3 currPosIS = posVCtoIS(posVC);
      float visibility = 1.0;
      vec3 randomDirStepIS = vecVCToIS(rayDirectionVC * sampleDistance);
      for (int j = 0; j < volume.kernelRadius; j++) {
        currPosIS += randomDirStepIS;
        // If out of the volume, we are done
        if (any(lessThan(currPosIS, vec3(0.0))) ||
            any(greaterThan(currPosIS, vec3(1.0)))) {
          break;
        }
        float opacity = getOpacityFromTexture(getTextureValue(currPosIS).r, 0, 0.5);
        #ifdef EnabledGradientOpacity
          opacity *= gradientOpacityFactor;
        #endif
        visibility *= 1.0 - opacity;
        // If visibility is less than EPSILON, consider it to be 0
        if (visibility < EPSILON) {
          visibility = 0.0;
          break;
        }
      }
      float rayWeight = -normalDotRay;
      visibilitySum += visibility * rayWeight;
      weightSum += rayWeight;
    }

    // If no sample, LAO factor is one
    if (weightSum == 0.0) {
      return 1.0;
    }

    // LAO factor is the average visibility:
    // - visibility low => ambient low
    // - visibility high => ambient high
    float lao = visibilitySum / weightSum;

    // Reduce variance by clamping
    return clamp(lao, 0.3, 1.0);
  }
#endif

//=======================================================================
// Volume shadows
#if vtkNumberOfLights > 0

  // Non-memoised version
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

    vec2 intersectionDistances =
        rayIntersectVolumeDistances(initialPosVC, lightDirNormVC);

    if (intersectionDistances[1] <= intersectionDistances[0] ||
        intersectionDistances[1] <= 0.0) {
      // Volume not hit or behind the ray
      return 1.0;
    }

    // When globalIlluminationReach is 0, no sample at all
    // When globalIlluminationReach is 1, the ray will go through the whole
    // volume
    float maxTravelDistance = mix(0.0, volume.diagonalLength,
                                  volume.globalIlluminationReach);
    float startDistance = max(intersectionDistances[0], 0.0);
    float endDistance = min(intersectionDistances[1], startDistance + maxTravelDistance);
    #ifdef vtkClippingPlanesOn
      endDistance = min(endDistance, clippingPlanesMaxDistance);
    #endif
    if (endDistance - startDistance < 0.0) {
      return 1.0;
    }

    // These two variables are used to compute posIS, without having to call
    // VCtoIS at each step
    vec3 initialPosIS = posVCtoIS(initialPosVC);
    // The light dir is scaled and rotated, but not translated, as it is a
    // vector (w = 0)
    vec3 scaledLightDirIS = vecVCToIS(lightDirNormVC);

    float shadow = 1.0;
    for (float currentDistance = startDistance; currentDistance <= endDistance;
          currentDistance += rayStepLength) {
      vec3 posIS = initialPosIS + currentDistance * scaledLightDirIS;
      vec4 scalar = getTextureValue(posIS);
      float opacity = getOpacityFromTexture(scalar.r, 0, 0.5);
      #if defined(EnabledGradientOpacity) && !defined(EnabledIndependentComponents)
        vec3 scalarInterp[2];
        vec4 normal = computeNormalForDensity(posIS, scalarInterp, 3);
        float opacityFactor = computeGradientOpacityFactor(normal.w, 0);
        opacity *= opacityFactor;
      #endif
      shadow *= 1.0 - opacity;

      // Early termination if shadow coeff is near 0.0
      if (shadow < EPSILON) {
        return 0.0;
      }
    }
    return shadow;
  }

  // Some cache for volume shadows
  struct {
    vec3 posVC;
    float shadow;
  } cachedShadows[vtkNumberOfLights];

  // Memoised version
  float computeVolumeShadow(vec3 posVC, vec3 lightDirNormVC, int lightIdx) {
    if (posVC == cachedShadows[lightIdx].posVC) {
      return cachedShadows[lightIdx].shadow;
    }
    float shadow = computeVolumeShadowWithoutCache(posVC, lightDirNormVC);
    cachedShadows[lightIdx].posVC = posVC;
    cachedShadows[lightIdx].shadow = shadow;
    return shadow;
  }

#endif

//=======================================================================
// surface light contribution
#if vtkNumberOfLights > 0
  vec3 applyLighting(vec3 tColor, vec4 normalVC) {
    vec3 diffuse = vec3(0.0, 0.0, 0.0);
    vec3 specular = vec3(0.0, 0.0, 0.0);
    for (int lightIdx = 0; lightIdx < vtkNumberOfLights; lightIdx++) {
      float df = dot(normalVC.xyz, lights[lightIdx].directionVC);
      if (df > 0.0) {
        diffuse += df * lights[lightIdx].color;
        float sf = dot(normalVC.xyz, -lights[lightIdx].halfAngleVC);
        if (sf > 0.0) {
          specular += pow(sf, volume.specularPower) * lights[lightIdx].color;
        }
      }
    }
    return tColor * (diffuse * volume.diffuse + volume.ambient) +
          specular * volume.specular;
  }

  vec3 applySurfaceShadowLighting(vec3 tColor, float alpha, vec3 posVC,
                                  vec4 normalVC) {
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
            dot(-rayDirVC, normalize(vertLightDirection - 2.0 * ndotL * normalVC.xyz));
        if (vdotR > 0.0) {
          specular += pow(vdotR, volume.specularPower) * attenuation *
                      lights[ligthIdx].color;
        }
      }
    }
    #if vtkMaxLaoKernelSize > 0
      float laoFactor = computeLAO(posVC, normalVC, alpha);
    #else
      const float laoFactor = 1.0;
    #endif
    return tColor * (diffuse * volume.diffuse +
                    volume.ambient * laoFactor) +
          specular * volume.specular;
  }

  vec3 applyVolumeShadowLighting(vec3 tColor, vec3 posVC) {
    // Here we have no effect of cones and no attenuation
    vec3 diffuse = vec3(0.0);
    for (int lightIdx = 0; lightIdx < vtkNumberOfLights; lightIdx++) {
      vec3 lightDirVC = lights[lightIdx].isPositional == 1
                            ? normalize(lights[lightIdx].positionVC - posVC)
                            : -lights[lightIdx].directionVC;
      float shadowCoeff = computeVolumeShadow(posVC, lightDirVC, lightIdx);
      float phaseAttenuation = phaseFunction(dot(rayDirVC, lightDirVC));
      diffuse += phaseAttenuation * shadowCoeff * lights[lightIdx].color;
    }
    return tColor * (diffuse * volume.diffuse + volume.ambient);
  }
#endif

// LAO of surface shadows and volume shadows only work with dependent components
vec3 applyAllLightning(vec3 tColor, float alpha, vec3 posVC,
                       vec4 surfaceNormalVC) {
  #if vtkNumberOfLights > 0
    // 0 <= volCoeff < EPSILON => only surface shadows
    // EPSILON <= volCoeff < 1 - EPSILON => mix of surface and volume shadows
    // 1 - EPSILON <= volCoeff => only volume shadows
    float volCoeff = volume.volumetricScatteringBlending *
                    (1.0 - alpha / 2.0) *
                    (1.0 - atan(surfaceNormalVC.w) * INV4PI);

    // Compute surface lighting if needed
    vec3 surfaceShadedColor = tColor;
    #ifdef EnableSurfaceLighting
      if (volCoeff < 1.0 - EPSILON) {
        surfaceShadedColor =
            applySurfaceShadowLighting(tColor, alpha, posVC, surfaceNormalVC);
      }
    #endif

    // Compute volume lighting if needed
    vec3 volumeShadedColor = tColor;
    #ifdef EnableVolumeLighting
      if (volCoeff >= EPSILON) {
        volumeShadedColor = applyVolumeShadowLighting(tColor, posVC);
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

vec4 getColorForLabelOutline() {
  vec3 centerPosIS =
      fragCoordToIndexSpace(gl_FragCoord); // pos in texture space
  vec4 centerValue = getTextureValue(centerPosIS);
  bool pixelOnBorder = false;
  vec4 tColor = vec4(getColorFromTexture(centerValue.r, 0, 0.5),
                     getOpacityFromTexture(centerValue.r, 0, 0.5));

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
    tColor.a = volume.outlineOpacity;
  }

  return tColor;
}

vec4 getColorForAdditivePreset(vec4 tValue, vec3 posVC, vec3 posIS) {
  // compute normals
  mat4 normalMat = computeMat4Normal(posIS, tValue);
  vec4 normalLights[2];
  normalLights[0] = normalMat[0];
  normalLights[1] = normalMat[1];
  #if vtkNumberOfLights > 0
    if (volume.computeNormalFromOpacity == 1) {
      for (int component = 0; component < 2; ++component) {
        vec3 scalarInterp[2];
        float height = volume.transferFunctionsSampleHeight[component];
        computeNormalForDensity(posIS, scalarInterp, component);
        normalLights[component] =
            computeDensityNormal(scalarInterp, height, 1.0, component);
      }
    }
  #endif

  // compute opacities
  float opacities[2];
  opacities[0] = getOpacityFromTexture(
      tValue[0], 0, volume.transferFunctionsSampleHeight[0]);
  opacities[1] = getOpacityFromTexture(
      tValue[1], 1, volume.transferFunctionsSampleHeight[1]);
  #ifdef EnabledGradientOpacity
    for (int component = 0; component < 2; ++component) {
      opacities[component] *=
          computeGradientOpacityFactor(normalMat[component].a, component);
    }
  #endif
  float opacitySum = opacities[0] + opacities[1];
  if (opacitySum <= 0.0) {
    return vec4(0.0);
  }

  // mix the colors and opacities
  vec3 colors[2];
  for (int component = 0; component < 2; ++component) {
    float sampleHeight = volume.transferFunctionsSampleHeight[component];
    vec3 color = getColorFromTexture(tValue[component], component, sampleHeight);
    color = applyAllLightning(color, opacities[component], posVC,
                              normalLights[component]);
    colors[component] = color;
  }
  vec3 mixedColor =
      (opacities[0] * colors[0] + opacities[1] * colors[1]) / opacitySum;
  return vec4(mixedColor, min(1.0, opacitySum));
}

vec4 getColorForColorizePreset(vec4 tValue, vec3 posVC, vec3 posIS) {
  // compute normals
  mat4 normalMat = computeMat4Normal(posIS, tValue);
  vec4 normalLight = normalMat[0];
  #if vtkNumberOfLights > 0
    if (volume.computeNormalFromOpacity == 1) {
      vec3 scalarInterp[2];
      float height = volume.transferFunctionsSampleHeight[0];
      computeNormalForDensity(posIS, scalarInterp, 0);
      normalLight = computeDensityNormal(scalarInterp, height, 1.0, 0);
    }
  #endif

  // compute opacities
  float opacity = getOpacityFromTexture(
      tValue[0], 0, volume.transferFunctionsSampleHeight[0]);
  #ifdef EnabledGradientOpacity
    opacity *= computeGradientOpacityFactor(normalMat[0].a, 0);
  #endif

  // colorizing component
  vec3 colorizingColor = getColorFromTexture(
      tValue[0], 1, volume.transferFunctionsSampleHeight[1]);
  float colorizingOpacity = getOpacityFromTexture(
      tValue[1], 1, volume.transferFunctionsSampleHeight[1]);

  // mix the colors and opacities
  vec3 color =
      getColorFromTexture(tValue[0], 0,
                          volume.transferFunctionsSampleHeight[0]) *
      mix(vec3(1.0), colorizingColor, colorizingOpacity);
  color = applyAllLightning(color, opacity, posVC, normalLight);
  return vec4(color, opacity);
}

vec4 getColorForDefaultIndependentPreset(vec4 tValue, vec3 posIS) {

  // compute the normal vectors as needed
  #if defined(EnabledGradientOpacity) || vtkNumberOfLights > 0
    mat4 normalMat = computeMat4Normal(posIS, tValue);
  #endif

  // process color and opacity for each component
  // initial value of alpha is determined by wether the first component is
  // proportional or not
  #if defined(vtkComponent0Proportional)
    // when it is proportional, it starts at 1 (neutral for multiplications)
    float alpha = 1.0;
  #else
    // when it is not proportional, it starts at 0 (neutral for additions)
    float alpha = 0.0;
  #endif

  vec3 mixedColor = vec3(0.0);
  #if vtkNumberOfComponents > 0
    {
      const int component = 0;
      vec3 color = getColorFromTexture(
          tValue[component], component,
          volume.transferFunctionsSampleHeight[component]);
      float opacity = getOpacityFromTexture(
          tValue[component], component,
          volume.transferFunctionsSampleHeight[component]);
      #if !defined(vtkComponent0Proportional)
        float alphaContribution = volume.independentComponentMix[component] * opacity;
        #ifdef EnabledGradientOpacity
          alphaContribution *= computeGradientOpacityFactor(normalMat[component].a, component);
        #endif
        alpha += alphaContribution;
        #if vtkNumberOfLights > 0
          color = applyLighting(color, normalMat[component]);
        #endif
      #else
        color *= opacity;
        alpha *= mix(opacity, 1.0,
                    (1.0 - volume.independentComponentMix[component]));
      #endif
      mixedColor += volume.independentComponentMix[component] * color;
    }
  #endif
  #if vtkNumberOfComponents > 1
    {
      const int component = 1;
      vec3 color = getColorFromTexture(
          tValue[component], component,
          volume.transferFunctionsSampleHeight[component]);
      float opacity = getOpacityFromTexture(
          tValue[component], component,
          volume.transferFunctionsSampleHeight[component]);
      #if !defined(vtkComponent1Proportional)
        float alphaContribution = volume.independentComponentMix[component] * opacity;
        #ifdef EnabledGradientOpacity
          alphaContribution *= computeGradientOpacityFactor(normalMat[component].a, component);
        #endif
        alpha += alphaContribution;
        #if vtkNumberOfLights > 0
          color = applyLighting(color, normalMat[component]);
        #endif
      #else
        color *= opacity;
        alpha *= mix(opacity, 1.0,
                    (1.0 - volume.independentComponentMix[component]));
      #endif
      mixedColor += volume.independentComponentMix[component] * color;
    }
  #endif
  #if vtkNumberOfComponents > 2
    {
      const int component = 2;
      vec3 color = getColorFromTexture(
          tValue[component], component,
          volume.transferFunctionsSampleHeight[component]);
      float opacity = getOpacityFromTexture(
          tValue[component], component,
          volume.transferFunctionsSampleHeight[component]);
      #if !defined(vtkComponent2Proportional)
        float alphaContribution = volume.independentComponentMix[component] * opacity;
        #ifdef EnabledGradientOpacity
          alphaContribution *= computeGradientOpacityFactor(normalMat[component].a, component);
        #endif
        alpha += alphaContribution;
        #if vtkNumberOfLights > 0
          color = applyLighting(color, normalMat[component]);
        #endif
      #else
        color *= opacity;
        alpha *= mix(opacity, 1.0,
                    (1.0 - volume.independentComponentMix[component]));
      #endif
      mixedColor += volume.independentComponentMix[component] * color;
    }
  #endif
  #if vtkNumberOfComponents > 3
    {
      const int component = 3;
      vec3 color = getColorFromTexture(
          tValue[component], component,
          volume.transferFunctionsSampleHeight[component]);
      float opacity = getOpacityFromTexture(
          tValue[component], component,
          volume.transferFunctionsSampleHeight[component]);
      #if !defined(vtkComponent3Proportional)
        float alphaContribution = volume.independentComponentMix[component] * opacity;
        #ifdef EnabledGradientOpacity
          alphaContribution *= computeGradientOpacityFactor(normalMat[component].a, component);
        #endif
        alpha += alphaContribution;
        #if vtkNumberOfLights > 0
          color = applyLighting(color, normalMat[component]);
        #endif
      #else
        color *= opacity;
        alpha *= mix(opacity, 1.0,
                    (1.0 - volume.independentComponentMix[component]));
      #endif
      mixedColor += volume.independentComponentMix[component] * color;
    }
  #endif

  return vec4(mixedColor, alpha);
}

vec4 getColorForDependentComponents(vec4 tValue, vec3 posVC, vec3 posIS) {
  #if defined(EnabledGradientOpacity) || vtkNumberOfLights > 0
    // use component 3 of the opacity texture as getTextureValue() sets alpha to
    // the opacity value
    vec3 scalarInterp[2];
    vec4 normal0 = computeNormalForDensity(posIS, scalarInterp, 3);
    float gradientOpacity = computeGradientOpacityFactor(normal0.a, 0);
  #endif

  // get color and opacity
  #if vtkNumberOfComponents == 1
    vec3 tColor = getColorFromTexture(tValue.r, 0, 0.5);
    float alpha = getOpacityFromTexture(tValue.r, 0, 0.5);
  #endif
  #if vtkNumberOfComponents == 2
    vec3 tColor = vec3(tValue.r * volume.colorTextureScale[0] +
                  volume.colorTextureShift[0]);
    float alpha = getOpacityFromTexture(tValue.a, 1, 0.5);
  #endif
  #if vtkNumberOfComponents == 3
      vec3 tColor = tValue.rgb * volume.colorTextureScale.rgb +
              volume.colorTextureShift.rgb;
      float alpha = getOpacityFromTexture(tValue.a, 0, 0.5);
  #endif
  #if vtkNumberOfComponents == 4
      vec3 tColor = tValue.rgb * volume.colorTextureScale.rgb +
              volume.colorTextureShift.rgb;
      float alpha = getOpacityFromTexture(tValue.a, 3, 0.5);
  #endif

  // Apply gradient opacity
  #if defined(EnabledGradientOpacity)
    alpha *= gradientOpacity;
  #endif

  #if vtkNumberOfComponents == 1
    if (alpha < EPSILON) {
      return vec4(0.0);
    }
  #endif

  // lighting
  #if vtkNumberOfLights > 0
    vec4 normalLight;
    if (volume.computeNormalFromOpacity == 1) {
      if (normal0[3] != 0.0) {
        normalLight =
            computeDensityNormal(scalarInterp, 0.5, gradientOpacity, 0);
        if (normalLight[3] == 0.0) {
          normalLight = normal0;
        }
      }
    } else {
      normalLight = normal0;
    }
    tColor = applyAllLightning(tColor, alpha, posVC, normalLight);
  #endif

  return vec4(tColor, alpha);
}

vec4 getColorForValue(vec4 tValue, vec3 posVC, vec3 posIS) {
  #ifdef EnableColorForValueFunctionId0
    return getColorForDependentComponents(tValue, posVC, posIS);
  #endif

  #ifdef EnableColorForValueFunctionId1
    return getColorForAdditivePreset(tValue, posVC, posIS);
  #endif

  #ifdef EnableColorForValueFunctionId2
    return getColorForColorizePreset(tValue, posVC, posIS);
  #endif

  #ifdef EnableColorForValueFunctionId3
    /*
      * Mix the color information from all the independent components to get a
      * single rgba output. See other shader functions like
      * `getColorForAdditivePreset` to learn how to create a custom color mix.
      * The custom color mix should return a value, but if it doesn't, it will
      * fallback on the default shading
      */
    //VTK::CustomColorMix
  #endif

  #if defined(EnableColorForValueFunctionId4) || defined(EnableColorForValueFunctionId3)
    return getColorForDefaultIndependentPreset(tValue, posIS);
  #endif

  #ifdef EnableColorForValueFunctionId5
    return getColorForLabelOutline();
  #endif
}

bool valueWithinScalarRange(vec4 val) {
  #if vtkNumberOfComponents > 1 && !defined(EnabledIndependentComponents)
    return false;
  #endif
  vec4 rangeMin = volume.ipScalarRangeMin;
  vec4 rangeMax = volume.ipScalarRangeMax;
  for (int component = 0; component < vtkNumberOfComponents; ++component) {
    if (val[component] < rangeMin[component] ||
        rangeMax[component] < val[component]) {
      return false;
    }
  }
  return true;
}

#if vtkBlendMode == LABELMAP_EDGE_PROJECTION_BLEND
  bool checkOnEdgeForNeighbor(int xFragmentOffset, int yFragmentOffset,
                              int segmentIndex, vec3 stepIS) {
    vec3 volumeDimensions = vec3(volume.dimensions);
    vec4 neighborPixelCoord = vec4(gl_FragCoord.x + float(xFragmentOffset),
                                  gl_FragCoord.y + float(yFragmentOffset),
                                  gl_FragCoord.z, gl_FragCoord.w);
    vec3 originalNeighborPosIS = fragCoordToIndexSpace(neighborPixelCoord);

    vec3 neighborPosIS = originalNeighborPosIS;
    for (int k = 0; k < vtkMaximumNumberOfSamples / 2; ++k) {
      ivec3 texCoord = ivec3(neighborPosIS * volumeDimensions);
      vec4 texValue = rawFetchTexture(texCoord);
      if (int(texValue.g) == segmentIndex) {
        // not on edge
        return false;
      }
      neighborPosIS += stepIS;
    }

    neighborPosIS = originalNeighborPosIS;
    for (int k = 0; k < vtkMaximumNumberOfSamples / 2; ++k) {
      ivec3 texCoord = ivec3(neighborPosIS * volumeDimensions);
      vec4 texValue = rawFetchTexture(texCoord);
      if (int(texValue.g) == segmentIndex) {
        // not on edge
        return false;
      }
      neighborPosIS -= stepIS;
    }

    // onedge
    float sampleHeight = volume.transferFunctionsSampleHeight[1];
    vec3 tColorSegment =
        getColorFromTexture(float(segmentIndex), 1, sampleHeight);
    float pwfValueSegment =
        getOpacityFromTexture(float(segmentIndex), 1, sampleHeight);
    gl_FragData[0] = vec4(tColorSegment, pwfValueSegment);
    return true;
  }
#endif

vec4 getColorAtPos(vec3 posVC) {
  vec3 posIS = posVCtoIS(posVC);
  vec4 texValue = getTextureValue(posIS);
  return getColorForValue(texValue, posVC, posIS);
}

//=======================================================================
// Apply the specified blend mode operation along the ray's path.
//
void applyBlend(vec3 rayOriginVC, vec3 rayDirVC, float minDistance,
                float maxDistance) {
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

    for (int i = 0; i < vtkMaximumNumberOfSamples; ++i) {
      // If we have reached the last step, break
      if (stepsTraveled + 1.0 >= raySteps) {
        break;
      }
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
    {
      vec3 posIS = posVCtoIS(posVC);
      selectedValue = getTextureValue(posIS);
      selectedPosVC = posVC;
      selectedPosIS = posIS;
    }

    // If the clipping range is shorter than the sample distance
    // we can skip the sampling loop along the ray.
    if (raySteps <= 1.0) {
      gl_FragData[0] = getColorForValue(selectedValue, selectedPosVC, selectedPosIS);
      return;
    }

    posVC += jitter * stepVC;
    stepsTraveled += jitter;

    // Sample along the ray until vtkMaximumNumberOfSamples,
    // ending slightly inside the total distance
    for (int i = 0; i < vtkMaximumNumberOfSamples; ++i) {
      // If we have reached the last step, break
      if (stepsTraveled + 1.0 >= raySteps) {
        break;
      }

      // Get selected values
      vec3 posIS = posVCtoIS(posVC);
      vec4 previousSelectedValue = selectedValue;
      vec4 currentValue = getTextureValue(posIS);
      selectedValue = OP(selectedValue, currentValue);
      if (previousSelectedValue != selectedValue) {
        selectedPosVC = posVC;
        selectedPosIS = posIS;
      }

      // Otherwise, continue along the ray
      stepsTraveled++;
      posVC += stepVC;
    }

    // Perform the last step along the ray using the
    // residual distance
    posVC = rayOriginVC + maxDistance * rayDirVC;
    {
      vec3 posIS = posVCtoIS(posVC);
      vec4 previousSelectedValue = selectedValue;
      vec4 currentValue = getTextureValue(posIS);
      selectedValue = OP(selectedValue, currentValue);
      if (previousSelectedValue != selectedValue) {
        selectedPosVC = posVC;
        selectedPosIS = posIS;
      }
    }

    gl_FragData[0] = getColorForValue(selectedValue, selectedPosVC, selectedPosIS);
  #endif

  #if vtkBlendMode == ADDITIVE_INTENSITY_BLEND ||                                \
      vtkBlendMode == AVERAGE_INTENSITY_BLEND
    vec4 sum = vec4(0.);
    #if vtkBlendMode == AVERAGE_INTENSITY_BLEND
      float totalWeight = 0.0;
    #endif
    vec3 posVC = rayOriginVC + minDistance * rayDirVC;
    float stepsTraveled = 0.0;

    vec3 posIS = posVCtoIS(posVC);
    vec4 value = getTextureValue(posIS);

    if (raySteps <= 1.0) {
      gl_FragData[0] = getColorForValue(value * raySteps, posVC, posIS);
      return;
    }

    if (valueWithinScalarRange(value)) {
      sum += value * jitter;
      #if vtkBlendMode == AVERAGE_INTENSITY_BLEND
        totalWeight += jitter;
      #endif
    }
    posVC += jitter * stepVC;
    stepsTraveled += jitter;

    // Sample along the ray until vtkMaximumNumberOfSamples,
    // ending slightly inside the total distance
    for (int i = 0; i < vtkMaximumNumberOfSamples; ++i) {
      // If we have reached the last step, break
      if (stepsTraveled + 1.0 >= raySteps) {
        break;
      }

      posIS = posVCtoIS(posVC);
      value = getTextureValue(posIS);
      // One can control the scalar range by setting the AverageIPScalarRange to
      // disregard scalar values, not in the range of interest, from the average
      // computation. Notes:
      // - We are comparing all values in the texture to see if any of them
      //   are outside of the scalar range. In the future we might want to allow
      //   scalar ranges for each component.
      if (valueWithinScalarRange(value)) {
        sum += value;
        #if vtkBlendMode == AVERAGE_INTENSITY_BLEND
          totalWeight++;
        #endif
      }

      stepsTraveled++;
      posVC += stepVC;
    }

    // Perform the last step along the ray using the
    // residual distance
    posVC = rayOriginVC + maxDistance * rayDirVC;
    posIS = posVCtoIS(posVC);
    value = getTextureValue(posIS);
    if (valueWithinScalarRange(value)) {
      sum += value;
      #if vtkBlendMode == AVERAGE_INTENSITY_BLEND
        totalWeight += raySteps - stepsTraveled;
      #endif
    }

    #if vtkBlendMode == AVERAGE_INTENSITY_BLEND
      sum /= vec4(totalWeight, totalWeight, totalWeight, 1.0);
    #endif

    gl_FragData[0] = getColorForValue(sum, posVC, posIS);
  #endif

  #if vtkBlendMode == RADON_TRANSFORM_BLEND
    float normalizedRayIntensity = 1.0;
    vec3 posVC = rayOriginVC + minDistance * rayDirVC;
    float stepsTraveled = 0.0;

    // handle very thin volumes
    if (raySteps <= 1.0) {
      vec3 posIS = posVCtoIS(posVC);
      vec4 tValue = getTextureValue(posIS);
      normalizedRayIntensity -= raySteps * sampleDistance *
                                getOpacityFromTexture(tValue.r, 0, 0.5);
      gl_FragData[0] =
          vec4(getColorFromTexture(normalizedRayIntensity, 0, 0.5), 1.0);
      return;
    }

    posVC += jitter * stepVC;
    stepsTraveled += jitter;

    for (int i = 0; i < vtkMaximumNumberOfSamples; ++i) {
      if (stepsTraveled + 1.0 >= raySteps) {
        break;
      }

      vec3 posIS = posVCtoIS(posVC);
      vec4 value = getTextureValue(posIS);
      // Convert scalar value to normalizedRayIntensity coefficient and
      // accumulate normalizedRayIntensity
      normalizedRayIntensity -=
          sampleDistance * getOpacityFromTexture(value.r, 0, 0.5);

      posVC += stepVC;
      stepsTraveled++;
    }

    // map normalizedRayIntensity to color
    gl_FragData[0] =
        vec4(getColorFromTexture(normalizedRayIntensity, 0, 0.5), 1.0);
  #endif

  #if vtkBlendMode == LABELMAP_EDGE_PROJECTION_BLEND
    // Only works with a single volume
    vec3 posVC = rayOriginVC + minDistance * rayDirVC;
    float stepsTraveled = 0.0;
    vec3 posIS = posVCtoIS(posVC);
    vec4 tValue = getTextureValue(posIS);
    if (raySteps <= 1.0) {
      gl_FragData[0] = getColorForValue(tValue, posVC, posIS);
      return;
    }

    vec3 stepIS = vecVCToIS(stepVC);
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

    // Sample along the ray until vtkMaximumNumberOfSamples,
    // ending slightly inside the total distance
    for (int i = 0; i < vtkMaximumNumberOfSamples; ++i) {
      // If we have reached the last step, break
      if (stepsTraveled + 1.0 >= raySteps) {
        break;
      }

      // compute the scalar
      tValue = getTextureValue(posIS);
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
    posIS = posVCtoIS(rayOriginVC + maxDistance * rayDirVC);
    tValue = getTextureValue(posIS);

    if (tValue.r > value.r) {
      value = tValue;   // Update the max value
      maxPosIS = posIS; // Update the position where max occurred
    }

    // If we have not seen any non-zero segments, we can return early
    // and grab color from the actual center value first component (image)
    if (!originalPosHasSeenNonZero) {
      vec3 maxPosVC = posIStoVC(maxPosIS);
      gl_FragData[0] = getColorForValue(value, maxPosVC, maxPosIS);
      return;
    }

    vec3 neighborRayStepsIS = stepIS;
    float neighborRaySteps = raySteps;
    bool shouldLookInAllNeighbors = false;

    vec3 volumeSpacings = volume.spacing;
    float minVoxelSpacing =
        min(volumeSpacings[0], min(volumeSpacings[1], volumeSpacings[2]));
    vec4 base =
        vec4(gl_FragCoord.x, gl_FragCoord.y, gl_FragCoord.z, gl_FragCoord.w);

    vec4 baseXPlus = vec4(gl_FragCoord.x + 1.0, gl_FragCoord.y, gl_FragCoord.z,
                          gl_FragCoord.w);
    vec4 baseYPlus = vec4(gl_FragCoord.x, gl_FragCoord.y + 1.0, gl_FragCoord.z,
                          gl_FragCoord.w);

    vec3 baseWorld = fragCoordToWorld(base);
    vec3 baseXPlusWorld = fragCoordToWorld(baseXPlus);
    vec3 baseYPlusWorld = fragCoordToWorld(baseYPlus);

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
                                          stepIS) ||
                    checkOnEdgeForNeighbor(actualThickness, actualThickness, s,
                                          stepIS) ||
                    checkOnEdgeForNeighbor(actualThickness, -actualThickness, s,
                                          stepIS) ||
                    checkOnEdgeForNeighbor(-actualThickness, +actualThickness, s,
                                          stepIS);

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
          if (checkOnEdgeForNeighbor(i, j, s, stepIS)) {
            return;
          }
        }
      }
    }

    float sampleHeight = volume.transferFunctionsSampleHeight[0];
    vec3 tColor0 = getColorFromTexture(value.r, 0, sampleHeight);
    float pwfValue0 = getOpacityFromTexture(value.r, 0, sampleHeight);
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
vec2 computeRayDistances(vec3 rayOriginVC, vec3 rayDirVC) {
  vec2 dists = rayIntersectVolumeDistances(rayOriginVC, rayDirVC);

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

  vec3 rayOriginVC = vertexVCVSOutput;
  vec2 rayStartEndDistancesVC = computeRayDistances(rayOriginVC, rayDirVC);
  if (rayStartEndDistancesVC[1] <= rayStartEndDistancesVC[0] ||
      rayStartEndDistancesVC[1] <= 0.0) {
    // Volume not hit or behind the ray
    discard;
  }

  // Perform the blending operation along the ray
  applyBlend(rayOriginVC, rayDirVC, rayStartEndDistancesVC[0], rayStartEndDistancesVC[1]);
}
