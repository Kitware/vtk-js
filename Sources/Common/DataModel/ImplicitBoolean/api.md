## Introduction

vtkImplicitBoolean enables boolean combinations of implicit functions like Plane, Sphere, Cylinder, and Box. Operations include union, intersection, and difference. Multiple implicit functions can be specified (all combined with the same operation).

### operation (set/get)

Specify the operation to use: 'UNION' (<=0), 'INTERSECTION' (=1), 'DIFFERENCE' (>=2)

### addFunction(actor) / removeFunction(actor) / getFunctions() : []

Add an implicit function to the list of functions.

### evaluateFunction(xyz)

Given the point xyz (three floating values) evaluate the boolean combination of 
implicit functions to return the combined function value.

### evaluateGradient(xyz)

Given the point xyz (three floating values) evaluate the boolean combination of 
implicit functions to return the combined gradient value. The method returns an array of three floats. 


