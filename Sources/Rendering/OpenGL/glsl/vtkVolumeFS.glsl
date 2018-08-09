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
uniform vec3 vSize;
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
uniform sampler2D texture1;
uniform float sampleDistance;
uniform vec3 vVCToIJK;
uniform float texWidth;
uniform float texHeight;
uniform int xreps;
uniform float xstride;
uniform float ystride;
uniform int repWidth;
uniform int repHeight;
uniform int repDepth;

// declaration for intermixed geometry
//VTK::ZBuffer::Dec

// Lighting values
//VTK::Light::Dec

// normal calc
//VTK::Normal::Dec

// gradient opacity
//VTK::GradientOpacity::Dec

vec2 getTextureCoord(vec3 ijk, float offset)
{
  // uncomment the following line to see  the  packed  texture
  // return vec2(ijk.x/float(repWidth), ijk.y/float(repHeight));
  int z = int(ijk.z + offset);
  int yz = z / xreps;
  int xz = z - yz*xreps;

  float ni = (ijk.x + float(xz * repWidth))/xstride;
  float nj = (ijk.y + float(yz * repHeight))/ystride;

  vec2 tpos = vec2(ni/texWidth, nj/texHeight);

  return tpos;
}

// because scalars may be encoded
// this func will decode them as needed
float getScalarValue(vec2 tpos)
{
  //VTK::ScalarValueFunction::Impl
}

vec2 getRayPointIntersectionBounds(
  vec3 rayPos, vec3 rayDir,
  vec3 planeDir, float planeDist,
  vec2 tbounds, vec3 vPlaneX, vec3 vPlaneY,
  float vSize1, float vSize2)
{
  float result = dot(rayDir, planeDir);
  if (result == 0.0)
  {
    return tbounds;
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

  return mix(
   vec2(min(tbounds.x, result), max(tbounds.y, result)), // in value
   tbounds, // out value
   check);  // 0 in 1 out
}

void main()
{
  float scalar;
  vec4 scalarComps;

  // camera is at 0,0,0 so rayDir for perspective is just the vc coord
  vec3 rayDir = normalize(vertexVCVSOutput);
  vec2 tbounds = vec2(100.0*camFar, -1.0);

  // all this is in View Coordinates
  tbounds = getRayPointIntersectionBounds(vertexVCVSOutput, rayDir,
    vPlaneNormal0, vPlaneDistance0, tbounds, vPlaneNormal2, vPlaneNormal4,
    vSize.y, vSize.z);
  tbounds = getRayPointIntersectionBounds(vertexVCVSOutput, rayDir,
    vPlaneNormal1, vPlaneDistance1, tbounds, vPlaneNormal2, vPlaneNormal4,
    vSize.y, vSize.z);
  tbounds = getRayPointIntersectionBounds(vertexVCVSOutput, rayDir,
    vPlaneNormal2, vPlaneDistance2, tbounds, vPlaneNormal0, vPlaneNormal4,
    vSize.x, vSize.z);
  tbounds = getRayPointIntersectionBounds(vertexVCVSOutput, rayDir,
    vPlaneNormal3, vPlaneDistance3, tbounds, vPlaneNormal0, vPlaneNormal4,
    vSize.x, vSize.z);
  tbounds = getRayPointIntersectionBounds(vertexVCVSOutput, rayDir,
    vPlaneNormal4, vPlaneDistance4, tbounds, vPlaneNormal0, vPlaneNormal2,
    vSize.x, vSize.y);
  tbounds = getRayPointIntersectionBounds(vertexVCVSOutput, rayDir,
    vPlaneNormal5, vPlaneDistance5, tbounds, vPlaneNormal0, vPlaneNormal2,
    vSize.x, vSize.y);

  // do not go behind front clipping plane
  tbounds.x = max(0.0,tbounds.x);

  // do not go PAST far clipping plane
  float farDist = -camThick/rayDir.z;
  tbounds.y = min(farDist,tbounds.y);

  // Do not go past the zbuffer value if set
  // This is used for intermixing opaque geometry
  //VTK::ZBuffer::Impl

  // do we need to composite?
  if (tbounds.y > tbounds.x)
  {
    // compute starting and ending values in volume space
    vec3 startVC = vertexVCVSOutput + tbounds.x*rayDir;
    startVC = startVC - vOriginVC;

    // vpos and endvpos are in VolumeCoords not Index yet
    vec3 vpos = vec3(
      dot(startVC, vPlaneNormal0),
      dot(startVC, vPlaneNormal2),
      dot(startVC, vPlaneNormal4));
    vec3 endVC = vertexVCVSOutput + tbounds.y*rayDir;
    endVC = endVC - vOriginVC;
    vec3 endvpos = vec3(
      dot(endVC, vPlaneNormal0),
      dot(endVC, vPlaneNormal2),
      dot(endVC, vPlaneNormal4));

    // start slightly inside and apply some jitter
    float jitter = texture2D(jtexture, gl_FragCoord.xy/32.0).r;
    vec3 vdelta = endvpos - vpos;
    vpos = vpos + normalize(vdelta)*(0.01 + 0.98*jitter)*sampleDistance;

    // update vdelta post jitter
    vdelta = endvpos - vpos;
    float numSteps = length(vdelta) / sampleDistance;
    vdelta = vdelta / float(numSteps);

    vec4 color = vec4(0.0, 0.0, 0.0, 0.0);
    int count = int(numSteps - 0.05); // end slightly inside

    vec3 ijk = vpos * vVCToIJK;
    vdelta = vdelta * vVCToIJK;
    for (int i = 0; i < //VTK::MaximumSamplesValue ; ++i)
    {
      // compute the 2d texture coordinate/s
      //VTK::ComputeTCoords

      // compute the scalar
      //VTK::ScalarFunction

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
      ijk += vdelta;
    }

    gl_FragData[0] = vec4(color.rgb/color.a, color.a);
    // gl_FragData[0] = vec4(tbounds.y/farDist, tbounds.x/farDist, color.b/color.a, 1.0);
  }
  else
  {
    discard;
  }
}
