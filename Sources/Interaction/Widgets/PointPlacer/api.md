## Introduction

Abstract interface to translate 2D display positions to world coordinates

## pixelTolerance (set/get Number)

Define the pixel tolerance (default = 5)

## worldTolerance (set/get Number)

Define the worls tolerance (default = 0.001)

## computeWorkdPositon(renderer, displayPos, worldPos)

- renderer : vtkRenderer
- displayPos : 2D position
- worldPos : computed world position filled in the function
Return 1 if success to convert position, else 0
