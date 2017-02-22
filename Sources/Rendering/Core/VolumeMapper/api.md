## Introduction

A volume mapper that performs ray casting on 
the GPU using fragment programs.

## Methods

### set/getSampleDistance

Set/Get the distance between samples used for rendering
Initial value is 1.0.

### set/getImageSampleDistance

Sampling distance in the XY image dimensions. Default value of 1 meaning
1 ray cast per pixel. If set to 0.5, 4 rays will be cast per pixel. If
set to 2.0, 1 ray will be cast for every 4 (2 by 2) pixels. T
