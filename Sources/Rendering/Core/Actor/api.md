## Introduction

vtkActor is used to represent an entity in a rendering scene. It inherits
functions related to the actors position, and orientation from
vtkProp3D. The actor also has scaling and maintains a reference to the
defining geometry (i.e., the mapper), rendering properties, and possibly a
texture map. vtkActor combines these instance variables into one 4x4
transformation matrix as follows: [x y z 1] = [x y z 1] Translate(-origin)
Scale(scale) Rot(y) Rot(x) Rot (z) Trans(origin) Trans(position)




## See Also

[vtkMapper](./Rendering_Core_Mapper.html)

[vtkProperty](./Rendering_Core_Property.html)

## Methods


### extend

Method used to decorate a given object (publicAPI+model) with vtkActor characteristics.


| Argument | Type | Description |
| ------------- | ------------- | ----- |
| **publicAPI** | <span class="arg-type"></span></br></span><span class="arg-required">required</span> | object on which methods will be bounds (public) |
| **model** | <span class="arg-type"></span></br></span><span class="arg-required">required</span> | object on which data structure will be bounds (protected) |
| **initialValues** | <span class="arg-type"></span></br></span><span class="arg-required">required</span> | (default: {}) |


### getActors

For some exporters and other other operations we must be
able to collect all the actors or volumes. These methods
are used in that process.

#### Returns

| Type | Description |
| ----- | ------------- |
| <span class="arg-type">Array.<vtkActor></span> | list of actors |


### getBackfaceProperty



#### Returns

| Type | Description |
| ----- | ------------- |
| <span class="arg-type">vtkProperty</span> | the backface property. |


### getBounds

Get the bounds for this Actor as (Xmin,Xmax,Ymin,Ymax,Zmin,Zmax).



### getForceOpaque

Check whether the opaque is forced or not.



### getForceTranslucent

Check whether the translucency is forced or not.



### getIsOpaque

Check if the actor is opaque or not

#### Returns

| Type | Description |
| ----- | ------------- |
| <span class="arg-type"></span> | true if the actor is opaque |


### getMapper





### getProperty

Get the property object that controls this actors surface
properties. This should be an instance of a vtkProperty object. Every
actor must have a property associated with it. If one isn’t specified,
then one will be generated automatically. Multiple actors can share one
property object.

#### Returns

| Type | Description |
| ----- | ------------- |
| <span class="arg-type"></span> | vtkProperty |


### getSupportsSelection

Return if the actor supports selection

#### Returns

| Type | Description |
| ----- | ------------- |
| <span class="arg-type"></span> |  |


### hasTranslucentPolygonalGeometry

Return if the prop have some translucent polygonal geometry

#### Returns

| Type | Description |
| ----- | ------------- |
| <span class="arg-type"></span> |  |


### makeProperty

Create a new property suitable for use with this type of Actor.



### newInstance

Method used to create a new instance of vtkActor with the following defaults:

* origin = [0, 0, 0]
* position = [0, 0, 0]
* scale = [1, 1, 1]
* visibility = 1
* pickable = 1
* dragable = 1
* orientation = [0, 0, 0]

No user defined matrix and no texture map.


| Argument | Type | Description |
| ------------- | ------------- | ----- |
| **initialValues** | <span class="arg-type"></span></br></span><span class="arg-required">required</span> | for pre-setting some of its content |


### setBackfaceProperty




| Argument | Type | Description |
| ------------- | ------------- | ----- |
| **backfaceProperty** | <span class="arg-type"></span></br></span><span class="arg-required">required</span> |  |


### setForceOpaque




| Argument | Type | Description |
| ------------- | ------------- | ----- |
| **forceOpaque** | <span class="arg-type"></span></br></span><span class="arg-required">required</span> |  |


### setForceTranslucent




| Argument | Type | Description |
| ------------- | ------------- | ----- |
| **forceTranslucent** | <span class="arg-type"></span></br></span><span class="arg-required">required</span> |  |


### setMapper




| Argument | Type | Description |
| ------------- | ------------- | ----- |
| **mapper** | <span class="arg-type"></span></br></span><span class="arg-required">required</span> |  |


### setProperty




| Argument | Type | Description |
| ------------- | ------------- | ----- |
| **property** | <span class="arg-type"></span></br></span><span class="arg-required">required</span> |  |


