## Introduction

vtkCylinder computes the implicit function and/or gradient for a cylinder.
vtkCylinder is a concrete implementation of vtkImplicitFunction.

### radius (set/get)

Floating value representing the radius of the cylinder.

### center (set/get)

Float array of size 3 representing the center of the cylinder.

### axis (set/get)

Float array of size 3 defining the axis of the cylinder.

### evaluateFunction(xyz)

Given the point xyz (three floating value) evaluate the cylinder equation and
return a floating value.

### evaluateGradient(xyz)

Given the point xyz (three floating values) evaluate the equation for the 
cylinder gradient. The method returns an array of three floats.

### evaluate(radius,center,x)

Convenience function that enables evaluation of the cylinder equation without
setting the data members center and radius.
