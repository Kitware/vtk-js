## Introduction
Generate texture coordinates by mapping points to sphere
The TCoords DataArray is name 'Texture Coordinate'

## (Set/Get) Center
Specify a point defining the center of the sphere.

## (Set/Get) AutomaticSphereGeneration
Turn on/off automatic sphere generation.

This means it automatically finds the sphere center.

## (Set/Get) PreventSeam
Control how the texture coordinates are generated.

If PreventSeam is set, the s-coordinate ranges :

- from 0->1 and 1->0 corresponding to the theta angle variation between 0->180 and 180->0 degrees
- Otherwise, the s-coordinate ranges from 0->1 between 0->360 degrees.
