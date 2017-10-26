## Introduction

vtkCone computes the implicit function and/or gradient for a cone.
vtkCone is a concrete implementation of vtkImplicitFunction. 
TODO: Currently the cone's axis of rotation is along the x-axis with 
the apex at the origin. To transform this to a different location requires 
the application of a transformation matrix. This can be performed by 
supporting transforms at the implicit function level, and should be added.

### angle (set/get)

Floating value representing the angle of the cone.

### evaluateFunction(xyz)

Given the point xyz (three floating value) evaluate the cone equation and
return a floating value.

### evaluateGradient(xyz)

Given the point xyz (three floating values) evaluate the equation for the 
cone gradient. The method returns an array of three floats.

