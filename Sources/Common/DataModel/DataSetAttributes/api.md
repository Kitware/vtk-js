## Introduction

vtkDataSetAttributes is a class that is used to represent and manipulate
attribute data (e.g., scalars, vectors, normals, texture coordinates,
tensors, global ids, pedigree ids, and field data).

This adds to vtkFieldData the ability to pick one of the arrays from the
field as the currently active array for each attribute type. In other words,
you pick one array to be called "THE" Scalars, and then filters down the
pipeline will treat that array specially. For example vtkContourFilter will
contour "THE" Scalar array unless a different array is asked for.

Additionally vtkDataSetAttributes provides methods that filters call to pass
data through, copy data into, and interpolate from Fields. PassData passes
entire arrays from the source to the destination. Copy passes through some
subset of the tuples from the source to the destination. Interpolate
interpolates from the chosen tuple(s) in the source data, using the provided
weights, to produce new tuples in the destination. Each attribute type has
pass, copy and interpolate "copy" flags that can be set in the destination to
choose which attribute arrays will be transferred from the source to the
destination.

Finally this class provides a mechanism to determine which attributes a group
of sources have in common, and to copy tuples from a source into the
destination, for only those attributes that are held by all.




## Methods


### checkNumberOfComponents




| Argument | Type | Description |
| ------------- | ------------- | ----- |
| **x** | <span class="arg-type"></span></br></span><span class="arg-required">required</span> |  |


### copyGlobalIdsOff





### copyNormalsOff





### copyPedigreeIdsOff





### copyScalarsOff





### copyTCoordsOff





### copyTensorsOff





### copyVectorsOff





### extend

Method used to decorate a given object (publicAPI+model) with vtkDataSetAttributes characteristics.


| Argument | Type | Description |
| ------------- | ------------- | ----- |
| **publicAPI** | <span class="arg-type"></span></br></span><span class="arg-required">required</span> | object on which methods will be bounds (public) |
| **model** | <span class="arg-type"></span></br></span><span class="arg-required">required</span> | object on which data structure will be bounds (protected) |
| **initialValues** | <span class="arg-type"></span></br></span><span class="arg-required">required</span> | (default: {}) |


### getActiveAttribute




| Argument | Type | Description |
| ------------- | ------------- | ----- |
| **attType** | <span class="arg-type"></span></br></span><span class="arg-required">required</span> |  |


### getActiveGlobalIds





### getActiveNormals





### getActivePedigreeIds





### getActiveScalars





### getActiveTCoords





### getActiveTensors





### getActiveVectors





### getGlobalIds





### getNormals





### getPedigreeIds





### getScalars





### getTCoords





### getTensors





### getVectors





### initializeAttributeCopyFlags





### newInstance

Method used to create a new instance of vtkDataSetAttributes.


| Argument | Type | Description |
| ------------- | ------------- | ----- |
| **initialValues** | <span class="arg-type"></span></br></span><span class="arg-required">required</span> | for pre-setting some of its content |


### removeAllArrays

Override to allow proper handling of active attributes



### removeArray

Override to allow proper handling of active attributes


| Argument | Type | Description |
| ------------- | ------------- | ----- |
| **arrayName** | <span class="arg-type"></span></br></span><span class="arg-required">required</span> |  |


### removeArrayByIndex

Override to allow proper handling of active attributes


| Argument | Type | Description |
| ------------- | ------------- | ----- |
| **arrayIdx** | <span class="arg-type"></span></br></span><span class="arg-required">required</span> |  |


### setActiveAttributeByIndex




| Argument | Type | Description |
| ------------- | ------------- | ----- |
| **arrayIdx** | <span class="arg-type"></span></br></span><span class="arg-required">required</span> |  |
| **uncleanAttType** | <span class="arg-type"></span></br></span><span class="arg-required">required</span> |  |


### setActiveAttributeByName




| Argument | Type | Description |
| ------------- | ------------- | ----- |
| **arrayName** | <span class="arg-type"></span></br></span><span class="arg-required">required</span> |  |
| **attType** | <span class="arg-type"></span></br></span><span class="arg-required">required</span> |  |


### setActiveGlobalIds




| Argument | Type | Description |
| ------------- | ------------- | ----- |
| **activeGlobalIds** | <span class="arg-type"></span></br></span><span class="arg-required">required</span> |  |


### setActiveGlobalIds




| Argument | Type | Description |
| ------------- | ------------- | ----- |
| **arrayName** | <span class="arg-type"></span></br></span><span class="arg-required">required</span> |  |


### setActiveNormals




| Argument | Type | Description |
| ------------- | ------------- | ----- |
| **activeNormals** | <span class="arg-type"></span></br></span><span class="arg-required">required</span> |  |


### setActiveNormals




| Argument | Type | Description |
| ------------- | ------------- | ----- |
| **arrayName** | <span class="arg-type"></span></br></span><span class="arg-required">required</span> |  |


### setActivePedigreeIds




| Argument | Type | Description |
| ------------- | ------------- | ----- |
| **activePedigreeIds** | <span class="arg-type"></span></br></span><span class="arg-required">required</span> |  |


### setActivePedigreeIds




| Argument | Type | Description |
| ------------- | ------------- | ----- |
| **arrayName** | <span class="arg-type"></span></br></span><span class="arg-required">required</span> |  |


### setActiveScalars




| Argument | Type | Description |
| ------------- | ------------- | ----- |
| **arrayName** | <span class="arg-type"></span></br></span><span class="arg-required">required</span> |  |


### setActiveScalars




| Argument | Type | Description |
| ------------- | ------------- | ----- |
| **activeScalars** | <span class="arg-type"></span></br></span><span class="arg-required">required</span> |  |


### setActiveTCoords




| Argument | Type | Description |
| ------------- | ------------- | ----- |
| **activeTCoords** | <span class="arg-type"></span></br></span><span class="arg-required">required</span> |  |


### setActiveTCoords




| Argument | Type | Description |
| ------------- | ------------- | ----- |
| **arrayName** | <span class="arg-type"></span></br></span><span class="arg-required">required</span> |  |


### setActiveTensors




| Argument | Type | Description |
| ------------- | ------------- | ----- |
| **activeTensors** | <span class="arg-type"></span></br></span><span class="arg-required">required</span> |  |


### setActiveTensors




| Argument | Type | Description |
| ------------- | ------------- | ----- |
| **arrayName** | <span class="arg-type"></span></br></span><span class="arg-required">required</span> |  |


### setActiveVectors




| Argument | Type | Description |
| ------------- | ------------- | ----- |
| **activeVectors** | <span class="arg-type"></span></br></span><span class="arg-required">required</span> |  |


### setActiveVectors




| Argument | Type | Description |
| ------------- | ------------- | ----- |
| **arrayName** | <span class="arg-type"></span></br></span><span class="arg-required">required</span> |  |


### setAttribute




| Argument | Type | Description |
| ------------- | ------------- | ----- |
| **arr** | <span class="arg-type"></span></br></span><span class="arg-required">required</span> |  |
| **uncleanAttType** | <span class="arg-type"></span></br></span><span class="arg-required">required</span> |  |


### setGlobalIds




| Argument | Type | Description |
| ------------- | ------------- | ----- |
| **globalids** | <span class="arg-type"></span></br></span><span class="arg-required">required</span> |  |


### setNormals




| Argument | Type | Description |
| ------------- | ------------- | ----- |
| **normals** | <span class="arg-type"></span></br></span><span class="arg-required">required</span> |  |


### setPedigreeIds




| Argument | Type | Description |
| ------------- | ------------- | ----- |
| **pedigreeids** | <span class="arg-type"></span></br></span><span class="arg-required">required</span> |  |


### setScalars




| Argument | Type | Description |
| ------------- | ------------- | ----- |
| **scalars** | <span class="arg-type"></span></br></span><span class="arg-required">required</span> |  |


### setTCoords




| Argument | Type | Description |
| ------------- | ------------- | ----- |
| **tcoords** | <span class="arg-type"></span></br></span><span class="arg-required">required</span> |  |


### setTensors




| Argument | Type | Description |
| ------------- | ------------- | ----- |
| **tensors** | <span class="arg-type"></span></br></span><span class="arg-required">required</span> |  |


### setVectors




| Argument | Type | Description |
| ------------- | ------------- | ----- |
| **vectors** | <span class="arg-type"></span></br></span><span class="arg-required">required</span> |  |


### shallowCopy




| Argument | Type | Description |
| ------------- | ------------- | ----- |
| **other** | <span class="arg-type"></span></br></span><span class="arg-required">required</span> |  |
| **debug** | <span class="arg-type"></span></br></span><span class="arg-required">required</span> |  |


