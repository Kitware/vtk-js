//VTK::System::Dec

/*=========================================================================

  Program:   Visualization Toolkit
  Module:    vtkImageResliceMapperVS.glsl

  Copyright (c) Ken Martin, Will Schroeder, Bill Lorensen
  All rights reserved.
  See Copyright.txt or http://www.kitware.com/Copyright.htm for details.

     This software is distributed WITHOUT ANY WARRANTY; without even
     the implied warranty of MERCHANTABILITY or FITNESS FOR A PARTICULAR
     PURPOSE.  See the above copyright notice for more information.

=========================================================================*/

// all variables that represent positions or directions have a suffix
// indicating the coordinate system they are in. The possible values are
// MC - Model coordinates
// WC - World coordinates
// VC - View coordinates
// DC - Display coordinates
// TC - Texture coordinates

// frag position in VC
//VTK::PositionVC::Dec

// Texture coordinates
//VTK::TCoord::Dec

// picking support
//VTK::Picking::Dec

// camera and actor matrix values
//VTK::Camera::Dec

void main()
{
  //VTK::PositionVC::Impl

  //VTK::TCoord::Impl

  //VTK::Picking::Impl
}
