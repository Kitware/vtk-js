//VTK::System::Dec

/*=========================================================================

  Program:   Visualization Toolkit
  Module:    vtkPolyDataFS.glsl

  Copyright (c) Ken Martin, Will Schroeder, Bill Lorensen
  All rights reserved.
  See Copyright.txt or http://www.kitware.com/Copyright.htm for details.

     This software is distributed WITHOUT ANY WARRANTY; without even
     the implied warranty of MERCHANTABILITY or FITNESS FOR A PARTICULAR
     PURPOSE.  See the above copyright notice for more information.

=========================================================================*/
// Template for the polydata mappers fragment shader

// the output of this shader
//VTK::Output::Dec

varying vec3 vertexVCVSOutput;

// camera values
uniform float camThick;
uniform float camNear;
uniform float camFar;

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

// opacity and color textures
uniform sampler2D otexture;
uniform float oshift;
uniform float oscale;
uniform sampler2D ctexture;
uniform float cshift;
uniform float cscale;

// jitter texture
uniform sampler2D jtexture;

// some 3D texture values
uniform float sampleDistance;
uniform vec3 vVCToIJK;

// declaration for intermixed geometry
//VTK::ZBuffer::Dec

// Lighting values
//VTK::Light::Dec

// normal calc
//VTK::Normal::Dec

// gradient opacity
//VTK::GradientOpacity::Dec

//=======================================================================
// Webgl2 specific version of functions
#if __VERSION__ == 300

uniform highp sampler3D texture1;

vec4 getTextureValue(vec3 pos)
{
  return texture(texture1, pos);
}

//=======================================================================
// WebGL1 specific version of functions
#else

uniform sampler2D texture1;

//VTK::UseTrilinear

uniform float texWidth;
uniform float texHeight;
uniform int xreps;
uniform float xstride;
uniform float ystride;

// because scalars may be encoded
// this func will decode them as needed
float getScalarValue(vec2 tpos)
{
  //VTK::ScalarValueFunction::Impl
}

// act like a 3D texture even though we are 2D
vec4 texture3D(vec3 ijk)
{
  vec3 tdims = vec3(volumeDimensions);

  int z = int(ijk.z * tdims.z);
  int yz = z / xreps;
  int xz = z - yz*xreps;

  float ni = (ijk.x + float(xz)) * tdims.x/xstride;
  float nj = (ijk.y + float(yz)) * tdims.y/ystride;

  vec2 tpos = vec2(ni/texWidth, nj/texHeight);
  float val = getScalarValue(tpos);
  return vec4(val);
}

// if computime triliear values from multiple z slices
#ifdef vtkUseTriliear
vec4 getTextureValue(vec3 ijk)
{
  float zoff = 1.0/float(volumeDimensions.z);
  vec4 val1 = texture3D(ijk);
  vec4 val2 = texture3D(vec3(ijk.xy, ijk.z + zoff));
  float zmix = ijk.z - floor(ijk.z);
  return mix(val1, val2, zmix);
}
#else // nearest or fast linear
#define getTextureValue texture3D
#endif
// End of Webgl1 specific code
//=======================================================================
#endif


//=======================================================================
// compute the normal and gradient magnitude for a position
vec4 computeNormal(vec3 pos, float scalar, vec3 tstep)
{
  vec4 result;
  result.x = getTextureValue(pos + vec3(tstep.x, 0.0, 0.0)).r - scalar;
  result.y = getTextureValue(pos + vec3(0.0, tstep.y, 0.0)).r - scalar;
  result.z = getTextureValue(pos + vec3(0.0, 0.0, tstep.z)).r - scalar;

  // divide by spacing
  result.xyz /= vSpacing;

  result.w = length(result.xyz);

  // rotate to View Coords
  result.xyz =
    result.x * vPlaneNormal0 +
    result.y * vPlaneNormal2 +
    result.z * vPlaneNormal4;

  if (result.w > 0.0)
  {
    result.xyz = normalize(result.xyz);
  }
  result.xyz = result.xyz*sign(result.z);
  return result;
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
  if (result == 0.0)
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

  vec3 vSize = vSpacing*(tdims - 1.0);

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
// Compute the index space starting position (pos) and step
// Also return the float number fo steps to take numSteps
//
void computeIndexSpaceValues(out vec3 pos, out vec3 step, out float numSteps, vec3 rayDir, vec2 dists)
{
  // compute starting and ending values in volume space
  pos = vertexVCVSOutput + dists.x*rayDir;
  pos = pos - vOriginVC;

  // convert to volume basis and origin
  pos = vec3(
    dot(pos, vPlaneNormal0),
    dot(pos, vPlaneNormal2),
    dot(pos, vPlaneNormal4));
  vec3 endPos = vertexVCVSOutput + dists.y*rayDir;
  endPos = endPos - vOriginVC;
  endPos = vec3(
    dot(endPos, vPlaneNormal0),
    dot(endPos, vPlaneNormal2),
    dot(endPos, vPlaneNormal4));

  // start slightly inside and apply some jitter
  float jitter = texture2D(jtexture, gl_FragCoord.xy/32.0).r;
  vec3 delta = endPos - pos;
  pos = pos + normalize(delta)*(0.01 + 0.98*jitter)*sampleDistance;

  // update vdelta post jitter
  delta = endPos - pos;

  numSteps = length(delta) / sampleDistance;
  step = delta / numSteps;

  // vVCToIJK handles spacing going from world distances to tcoord distances
  pos *= vVCToIJK;
  step *= vVCToIJK;
}

void main()
{
  // camera is at 0,0,0 so rayDir for perspective is just the vc coord
  vec3 rayDirVC = normalize(vertexVCVSOutput);

  vec3 tdims = vec3(volumeDimensions);

  // compute the start and end points for the ray
  vec2 rayStartEndDistancesVC = computeRayDistances(rayDirVC, tdims);

  // do we need to composite? aka does the ray have any length
  if (rayStartEndDistancesVC.y > rayStartEndDistancesVC.x)
  {
    // IS = Index Space
    vec3 posIS;
    vec3 stepIS;
    float numSteps;
    computeIndexSpaceValues(posIS, stepIS, numSteps, rayDirVC, rayStartEndDistancesVC);

    // iteger number of steps to take and residual step size
    int count = int(numSteps - 0.05); // end slightly inside
    float residual = numSteps - float(count);

    // local vars for the loop
    vec4 color = vec4(0.0, 0.0, 0.0, 0.0);
    float scalar;
    vec4 scalarComps;

    vec3 tstep = 1.0/tdims;

    for (int i = 0; i < //VTK::MaximumSamplesValue ; ++i)
    {
      // compute the scalar
      scalar = getTextureValue(posIS).r;

      // now map through opacity and color
      vec4 tcolor = texture2D(ctexture, vec2(scalar * cscale + cshift, 0.5));
      tcolor.a = texture2D(otexture, vec2(scalar * oscale + oshift, 0.5)).r;

      // compute the normal if needed
      //VTK::Normal::Impl

      // handle gradient opacity
      //VTK::GradientOpacity::Impl

      // handle lighting
      //VTK::Light::Impl

      float mix = (1.0 - color.a);

      // this line should not be needed but nvidia seems to not handle
      // the break correctly on windows/chrome 58 angle
      mix = mix * sign(max(float(count - i + 1), 0.0));

      color = color + vec4(tcolor.rgb*tcolor.a, tcolor.a)*mix;
      if (i >= count) { break; }
      if (color.a > 0.99) { color.a = 1.0; break; }
      posIS += stepIS;
    }

    if (color.a < 0.99)
    {
      posIS += (residual - 1.0)*stepIS;

      // compute the scalar
      scalar = getTextureValue(posIS).r;

      // now map through opacity and color
      vec4 tcolor = texture2D(ctexture, vec2(scalar * cscale + cshift, 0.5));
      tcolor.a = residual*texture2D(otexture, vec2(scalar * oscale + oshift, 0.5)).r;

      // compute the normal if needed
      //VTK::Normal::Impl

      // handle gradient opacity
      //VTK::GradientOpacity::Impl

      // handle lighting
      //VTK::Light::Impl

      float mix = (1.0 - color.a);
      color = color + vec4(tcolor.rgb*tcolor.a, tcolor.a)*mix;
    }

    gl_FragData[0] = vec4(color.rgb/color.a, color.a);
    // gl_FragData[0] = vec4(tbounds.y/farDist, tbounds.x/farDist, color.b/color.a, 1.0);
  }
  else
  {
    discard;
  }
}
