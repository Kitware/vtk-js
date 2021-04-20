## Introduction

vtkVolumeMapper inherits from vtkMapper.
A volume mapper that performs ray casting on the GPU using fragment programs.




## Methods


### extend

Method use to decorate a given object (publicAPI+model) with vtkVolumeMapper characteristics.


| Argument | Type | Description |
| ------------- | ------------- | ----- |
| **publicAPI** | <span class="arg-type"></span></br></span><span class="arg-required">required</span> | object on which methods will be bounds (public) |
| **model** | <span class="arg-type"></span></br></span><span class="arg-required">required</span> | object on which data structure will be bounds (protected) |
| **initialValues** | <span class="arg-type"></span></br></span><span class="arg-required">required</span> | (default: {}) |


### getAutoAdjustSampleDistances





### getAverageIPScalarRange





### getAverageIPScalarRangeByReference





### getBlendMode





### getBlendModeAsString





### getBounds

Get the bounds as [xmin, xmax, ymin, ymax, zmin, zmax].



### getImageSampleDistance

Sampling distance in the XY image dimensions. 
Default value of 1 meaning 1 ray cast per pixel. If set to 0.5, 4 rays will be cast per pixel. 
If set to 2.0, 1 ray will be cast for every 4 (2 by 2) pixels. T



### getMaximumSamplesPerRay





### getSampleDistance

Get the distance between samples used for rendering



### newInstance

Method use to create a new instance of vtkVolumeMapper



### setAutoAdjustSampleDistances




| Argument | Type | Description |
| ------------- | ------------- | ----- |
| **autoAdjustSampleDistances** | <span class="arg-type"></span></br></span><span class="arg-required">required</span> |  |


### setAverageIPScalarRange




| Argument | Type | Description |
| ------------- | ------------- | ----- |
| **x** | <span class="arg-type"></span></br></span><span class="arg-required">required</span> |  |
| **y** | <span class="arg-type"></span></br></span><span class="arg-required">required</span> |  |


### setAverageIPScalarRangeFrom




| Argument | Type | Description |
| ------------- | ------------- | ----- |
| **averageIPScalarRange** | <span class="arg-type"></span></br></span><span class="arg-required">required</span> |  |


### setBlendMode

Set blend mode to COMPOSITE_BLEND


| Argument | Type | Description |
| ------------- | ------------- | ----- |
| **blendMode** | <span class="arg-type"></span></br></span><span class="arg-required">required</span> |  |


### setBlendModeToAverageIntensity

Set blend mode to AVERAGE_INTENSITY_BLEND



### setBlendModeToComposite

Set blend mode to COMPOSITE_BLEND



### setBlendModeToMaximumIntensity

Set blend mode to MAXIMUM_INTENSITY_BLEND



### setBlendModeToMinimumIntensity

Set blend mode to MINIMUM_INTENSITY_BLEND



### setImageSampleDistance




| Argument | Type | Description |
| ------------- | ------------- | ----- |
| **imageSampleDistance** | <span class="arg-type"></span></br></span><span class="arg-required">required</span> |  |


### setMaximumSamplesPerRay




| Argument | Type | Description |
| ------------- | ------------- | ----- |
| **maximumSamplesPerRay** | <span class="arg-type"></span></br></span><span class="arg-required">required</span> |  |


### setSampleDistance

Get the distance between samples used for rendering


| Argument | Type | Description |
| ------------- | ------------- | ----- |
| **sampleDistance** | <span class="arg-type"></span></br></span><span class="arg-required">required</span> |  |


### update





