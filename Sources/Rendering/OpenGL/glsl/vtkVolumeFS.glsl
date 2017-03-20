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
//VTK::ZBuffer::Decl

vec4 getVolumeColor(vec3 vpos)
{
  // convert from vpos to 3d ijk
  vec3 ijk = vpos * vVCToIJK;
  ijk += 0.5;

  int z = int(ijk.z);
  int yz = z / xreps;
  int xz = z - yz*xreps;

  float ni = (ijk.x + float(xz * repWidth))/xstride;
  float nj = (ijk.y + float(yz * repHeight))/ystride;

  float scalar;
  vec2 tpos = vec2(ni/texWidth, nj/texHeight);
  //VTK::ScalarValueFunction::Impl

  // now map through opacity and color
  vec4 color = texture2D(ctexture, vec2(scalar * cscale + cshift, 0.5));
  color.a = texture2D(otexture, vec2(scalar * oscale + oshift, 0.5)).r;

  return color;
}

vec4 getVolumeColorLinearZ(vec3 vpos)
{
  // convert from vpos to 3d ijk
  vec3 ijk = vpos * vVCToIJK;
  int z = int(ijk.z);

  float zmix = ijk.z - float(z);

  ijk += 0.5;

  int yz = z / xreps;
  int xz = z - yz*xreps;

  float ni = (ijk.x + float(xz * repWidth))/xstride;
  float nj = (ijk.y + float(yz * repHeight))/ystride;

  float scalar;
  vec2 tpos = vec2(ni/texWidth, nj/texHeight);
  //VTK::ScalarValueFunction::Impl
  float scalar1 = scalar;

  int z2 = z + 1;
  if (z2 >= repDepth)
  {
    z2 = repDepth -1;
  }
  int yz2 = z2 / xreps;
  int xz2 = z2 - yz2*xreps;

  ni = (ijk.x + float(xz2 * repWidth))/xstride;
  nj = (ijk.y + float(yz2 * repHeight))/ystride;

  tpos = vec2(ni/texWidth, nj/texHeight);
  //VTK::ScalarValueFunction::Impl

  scalar = mix(scalar1, scalar, zmix);

  // now map through opacity and color
  vec4 color = texture2D(ctexture, vec2(scalar * cscale + cshift, 0.5));
  color.a = texture2D(otexture, vec2(scalar * oscale + oshift, 0.5)).r;

  return color;
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
  if (vpos.x < 0.0 || vpos.x > vSize1 ||
      vpos.y < 0.0 || vpos.y > vSize2)
  {
    return tbounds;
  }
  return vec2(min(tbounds.x, result), max(tbounds.y,result));
}

void main()
{
  // camera is at 0,0,0 so rayDir for perspective is just the vc coord
  vec3 rayDir = normalize(vertexVCVSOutput);
  vec2 tbounds = vec2(100.0*camFar, -1.0);

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
  if (tbounds.y >= tbounds.x)
  {
    // compute starting and ending values in volume space
    vec3 startVC = vertexVCVSOutput + tbounds.x*rayDir;
    startVC = startVC - vOriginVC;
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
    vec3 vdelta = endvpos - vpos;
    float numSteps = length(vdelta) / sampleDistance;
    vdelta = vdelta / numSteps;

    // start slightly inside
    vpos = vpos + vdelta*0.1;
    bool done = false;
    vec4 color = vec4(0.0, 0.0, 0.0, 0.0);
    int count = int(numSteps - 0.2); // end slightly inside
    for (int i = 0; i < //VTK::MaximumSamplesValue ; ++i)
    {
      vec4 tcolor = //VTK::VolumeColorFunctionCall

      float mix = (1.0 - color.a);
      color = color + vec4(tcolor.rgb*tcolor.a, tcolor.a)*mix;
      if (i > count) { break; }
      if (color.a > 0.99) { color.a = 1.0; break; }
      vpos += vdelta;
    }

    gl_FragData[0] = vec4(color.rgb/color.a, color.a);
  }
  else
  {
    discard;
  }
}
