## Introduction

vtkSphere computes the implicit function and/or gradient for a sphere.
vtkSphere is a concrete implementation of vtkImplicitFunction. Additional
methods are available for sphere-related computations, such as computing
bounding spheres for a set of points, or set of spheres. vtkSphere is a 
of the abstract class vtkImplicitFunction.

### radius (set/get)

Floating value representing the radius of the sphere.

### center (set/get)

Float array of size 3 representing the center of the sphere.

### evaluateFunction(xyz)

Given the point xyz (three floating value) evaluate the sphere equation and
return a floating value.

### evaluateGradient(xyz)

Given the point xyz (three floating values) evaluate the equation for the 
sphere gradient. The method returns an array of three floats.

### evaluate(radius,center,x)

Convenience function that enables evaluation of the sphere equation without
setting the data members center and radius.
