## Introduction

vtkImageStreamline - integrate streamlines in a vtkImageData

vtkImageStreamline is a filter that generates streamlines from a
vtkImageData input over which a vector field is defined. This filter
will look for vectors (i.e. getVectors()) in the input. It will then
integrate these vectors, using Runge-Kutta 2, from a starting set of
seeds defined by the points of the 2nd input until a specified maximum
number of steps is reached or until the streamline leaves the domain.

The output will be a vtkPolyData which contains a polyline for each
streamline. Currently, this filter does not interpolate any
input fields to the points of the streamline.

## Public API

### integrationStep

Set/Get the step length (delT) used during integration.

### maximumNumberOfSteps

Set/Get the number of steps to be used in the integration. Integration
can terminal earlier if the streamline leaves the domain.
