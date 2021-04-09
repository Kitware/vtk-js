## Introduction

vtkActor2D is used to represent a 2D entity in a rendering scene. It inherits
functions related to the actors position, and orientation from
vtkProp. The actor also has scaling and maintains a reference to the
defining geometry (i.e., the mapper), rendering properties, and possibly a
texture map.




## See Also

[vtkMapper](./Rendering_Core_Mapper.html)2D

[vtkProperty](./Rendering_Core_Property.html)2D

## Methods


### extend

Method use to decorate a given object (publicAPI+model) with vtkActor2D characteristics.


| Argument | Type | Description |
| ------------- | ------------- | ----- |
| **publicAPI** | <span class="arg-type"></span></br></span><span class="arg-required">required</span> | object on which methods will be bounds (public) |
| **model** | <span class="arg-type"></span></br></span><span class="arg-required">required</span> | object on which data structure will be bounds (protected) |
| **initialValues** | <span class="arg-type"></span></br></span><span class="arg-required">required</span> | (default: {}) |


### getActors2D



#### Returns

| Type | Description |
| ----- | ------------- |
| <span class="arg-type"></span> |  |


### getActualPositionCoordinate

Return the actual vtkCoordinate reference that the mapper should use
to position the actor. This is used internally by the mappers and should
be overridden in specialized subclasses and otherwise ignored.



### getActualPositionCoordinate2





### getBounds

Get the bounds as [xmin, xmax, ymin, ymax, zmin, zmax].



### getHeight

----------------------------------------------------------------------------



### getIsOpaque



#### Returns

| Type | Description |
| ----- | ------------- |
| <span class="arg-type"></span> |  |


### getProperty

Return the property object that controls this actors surface
properties. This should be an instance of a vtkProperty object. Every
actor must have a property associated with it. If one isn’t specified,
then one will be generated automatically. Multiple actors can share one
property object.



### getWidth

----------------------------------------------------------------------------



### hasTranslucentPolygonalGeometry



#### Returns

| Type | Description |
| ----- | ------------- |
| <span class="arg-type"></span> |  |


### newInstance

Method use to create a new instance of vtkActor2D


| Argument | Type | Description |
| ------------- | ------------- | ----- |
| **initialValues** | <span class="arg-type"></span></br></span><span class="arg-required">required</span> | for pre-setting some of its content |


### setDisplayPosition

----------------------------------------------------------------------------
Set the Prop2D's position in display coordinates.


| Argument | Type | Description |
| ------------- | ------------- | ----- |
| **XPos** | <span class="arg-type"></span></br></span><span class="arg-required">required</span> |  |
| **YPos** | <span class="arg-type"></span></br></span><span class="arg-required">required</span> |  |


### setHeight

----------------------------------------------------------------------------


| Argument | Type | Description |
| ------------- | ------------- | ----- |
| **w** | <span class="arg-type"></span></br></span><span class="arg-required">required</span> |  |


### setWidth

----------------------------------------------------------------------------


| Argument | Type | Description |
| ------------- | ------------- | ----- |
| **w** | <span class="arg-type"></span></br></span><span class="arg-required">required</span> |  |


