## Introduction

vtkProperty is an object that represents lighting and other surface
properties of a geometric object. The primary properties that can be
set are colors (overall, ambient, diffuse, specular, and edge color);
specular power; opacity of the object; the representation of the
object (points, wireframe, or surface); and the shading method to be
used (flat, Gouraud, and Phong). Also, some special graphics features
like backface properties can be set and manipulated with this object.




## See Also

## Methods


### addShaderVariable

Not Implemented yet



### ambient

The lighting coefficient.



### ambientColor

The ambient surface color.



### backfaceCulling





### color





### computeCompositeColor

Not Implemented yet



### diffuse

The diffuse lighting coefficient.



### diffuseColor

The diffuse surface color.



### edgeColor

The color of primitive edges



### edgeVisibility

The visibility of edges.



### extend

Method use to decorate a given object (publicAPI+model) with vtkProperty characteristics.


| Argument | Type | Description |
| ------------- | ------------- | ----- |
| **publicAPI** | <span class="arg-type"></span></br></span><span class="arg-required">required</span> | object on which methods will be bounds (public) |
| **model** | <span class="arg-type"></span></br></span><span class="arg-required">required</span> | object on which data structure will be bounds (protected) |
| **initialValues** | <span class="arg-type"></span></br></span><span class="arg-required">required</span> | (default: {}) |


### frontfaceCulling





### getAmbient

Get the lighting coefficient.



### getAmbientColor





### getAmbientColorByReference





### getBackfaceCulling





### getColor

Get the color of the object.the color of the object



### getDiffuse

Get the diffuse lighting coefficient.



### getDiffuseColor





### getDiffuseColorByReference





### getEdgeColor





### getEdgeColorByReference





### getEdgeVisibility





### getFrontfaceCulling

Get the fast culling of polygons based on orientation of normal
with respect to camera. If frontface culling is on, polygons facing
towards camera are not drawn.



### getInterpolation

Get the shading interpolation method for an object.



### getInterpolationAsString

Map the interpolation integer to the corresponding ShadingModel.



### getLighting

Get lighting flag for an object. 



### getLineWidth

Get the width of a Line. The width is expressed in screen units.



### getOpacity

Get the opacity of the object. Set/Get the object's opacity. 
1.0 is totally opaque and 0.0 is completely transparent.



### getPointSize

Get the diameter of a point. The size is expressed in screen units.



### getRepresentation

Get the surface geometry representation for the object.



### getRepresentationAsString

Get the surface geometry representation for the object as string.

#### Returns

| Type | Description |
| ----- | ------------- |
| <span class="arg-type"></span> |  |


### getShading





### getSpecular

Get the specular lighting coefficient.



### getSpecularColor





### getSpecularColorByReference





### getSpecularPower

Get the specular power.



### lighting

Lighting flag for an object. 



### lineWidth





### newInstance

Method use to create a new instance of vtkProperty with object color, ambient color, diffuse color,
specular color, and edge color white; ambient coefficient=0; diffuse
coefficient=0; specular coefficient=0; specular power=1; Gouraud shading;
and surface representation. Backface and frontface culling are off.


| Argument | Type | Description |
| ------------- | ------------- | ----- |
| **initialValues** | <span class="arg-type"></span></br></span><span class="arg-required">required</span> | for pre-setting some of its content |


### opacity

The object’s opacity. 1.0 is totally opaque 
and 0.0 is completely transparent.



### pointSize





### setAmbient




| Argument | Type | Description |
| ------------- | ------------- | ----- |
| **ambient** | <span class="arg-type"></span></br></span><span class="arg-required">required</span> |  |


### setAmbientColor

Set the ambient surface color. Not all renderers support separate
ambient and diffuse colors. From a physical standpoint it really
doesn't make too much sense to have both. For the rendering
libraries that don’t support both, the diffuse color is used.


| Argument | Type | Description |
| ------------- | ------------- | ----- |
| **ambientColor** | <span class="arg-type"></span></br></span><span class="arg-required">required</span> |  |


### setAmbientColor

Set the ambient surface color. Not all renderers support separate
ambient and diffuse colors. From a physical standpoint it really
doesn't make too much sense to have both. For the rendering
libraries that don’t support both, the diffuse color is used.


| Argument | Type | Description |
| ------------- | ------------- | ----- |
| **r** | <span class="arg-type"></span></br></span><span class="arg-required">required</span> |  |
| **g** | <span class="arg-type"></span></br></span><span class="arg-required">required</span> |  |
| **b** | <span class="arg-type"></span></br></span><span class="arg-required">required</span> |  |


### setAmbientColorFrom

Set the ambient surface color from an RGB array


| Argument | Type | Description |
| ------------- | ------------- | ----- |
| **ambientColor** | <span class="arg-type"></span></br></span><span class="arg-required">required</span> |  |


### setBackfaceCulling

Turn on/off fast culling of polygons based on orientation of normal
with respect to camera. If backface culling is on, polygons facing
away from camera are not drawn.


| Argument | Type | Description |
| ------------- | ------------- | ----- |
| **backfaceCulling** | <span class="arg-type"></span></br></span><span class="arg-required">required</span> |  |


### setColor

Set the color of the object. Has the side effect of setting the
ambient diffuse and specular colors as well. This is basically
a quick overall color setting method.


| Argument | Type | Description |
| ------------- | ------------- | ----- |
| **r** | <span class="arg-type"></span></br></span><span class="arg-required">required</span> |  |
| **g** | <span class="arg-type"></span></br></span><span class="arg-required">required</span> |  |
| **b** | <span class="arg-type"></span></br></span><span class="arg-required">required</span> |  |


### setColor

Set the color of the object. Has the side effect of setting the
ambient diffuse and specular colors as well. This is basically
a quick overall color setting method.


| Argument | Type | Description |
| ------------- | ------------- | ----- |
| **color** | <span class="arg-type"></span></br></span><span class="arg-required">required</span> |  |


### setDiffuse

Set the diffuse lighting coefficient.


| Argument | Type | Description |
| ------------- | ------------- | ----- |
| **diffuse** | <span class="arg-type"></span></br></span><span class="arg-required">required</span> |  |


### setDiffuseColor

Set the diffuse surface color.


| Argument | Type | Description |
| ------------- | ------------- | ----- |
| **r** | <span class="arg-type"></span></br></span><span class="arg-required">required</span> |  |
| **g** | <span class="arg-type"></span></br></span><span class="arg-required">required</span> |  |
| **b** | <span class="arg-type"></span></br></span><span class="arg-required">required</span> |  |


### setDiffuseColor

Set the diffuse surface color.


| Argument | Type | Description |
| ------------- | ------------- | ----- |
| **diffuseColor** | <span class="arg-type"></span></br></span><span class="arg-required">required</span> |  |


### setDiffuseColorFrom

Set the diffuse surface color from an RGB array


| Argument | Type | Description |
| ------------- | ------------- | ----- |
| **diffuseColor** | <span class="arg-type"></span></br></span><span class="arg-required">required</span> |  |


### setEdgeColor

Set the color of primitive edges (if edge visibility is enabled).


| Argument | Type | Description |
| ------------- | ------------- | ----- |
| **edgeColor** | <span class="arg-type"></span></br></span><span class="arg-required">required</span> |  |


### setEdgeColor

Set the color of primitive edges (if edge visibility is enabled).


| Argument | Type | Description |
| ------------- | ------------- | ----- |
| **r** | <span class="arg-type"></span></br></span><span class="arg-required">required</span> |  |
| **g** | <span class="arg-type"></span></br></span><span class="arg-required">required</span> |  |
| **b** | <span class="arg-type"></span></br></span><span class="arg-required">required</span> |  |


### setEdgeColorFrom

Set the color of primitive edges from an RGB array.


| Argument | Type | Description |
| ------------- | ------------- | ----- |
| **edgeColor** | <span class="arg-type"></span></br></span><span class="arg-required">required</span> |  |


### setEdgeVisibility

Turn on/off the visibility of edges. On some renderers it is
possible to render the edges of geometric primitives separately
from the interior.


| Argument | Type | Description |
| ------------- | ------------- | ----- |
| **edgeVisibility** | <span class="arg-type"></span></br></span><span class="arg-required">required</span> |  |


### setFrontfaceCulling

Turn on/off fast culling of polygons based on orientation of normal
with respect to camera. If frontface culling is on, polygons facing
towards camera are not drawn.


| Argument | Type | Description |
| ------------- | ------------- | ----- |
| **frontfaceCulling** | <span class="arg-type"></span></br></span><span class="arg-required">required</span> |  |


### setInterpolation

Set the shading interpolation method for an object.



### setInterpolationToFlat

Set interpolation to 0 => 'FLAT'.



### setInterpolationToGouraud

Set interpolation to 1 => 'GOURAUD'.



### setInterpolationToPhong

Set interpolation to 2 => 'PHONG'.



### setLighting

Set lighting flag for an object.


| Argument | Type | Description |
| ------------- | ------------- | ----- |
| **lighting** | <span class="arg-type"></span></br></span><span class="arg-required">required</span> |  |


### setLineWidth

Set the width of a Line. The width is expressed in screen units.
This is only implemented for OpenGL.


| Argument | Type | Description |
| ------------- | ------------- | ----- |
| **lineWidth** | <span class="arg-type"></span></br></span><span class="arg-required">required</span> |  |


### setOpacity

Set the object's opacity. 1.0 is totally opaque and 0.0 is 
completely transparent.


| Argument | Type | Description |
| ------------- | ------------- | ----- |
| **opacity** | <span class="arg-type"></span></br></span><span class="arg-required">required</span> |  |


### setPointSize

Set the diameter of a point. The size is expressed in screen units.
This is only implemented for OpenGL.


| Argument | Type | Description |
| ------------- | ------------- | ----- |
| **pointSize** | <span class="arg-type"></span></br></span><span class="arg-required">required</span> |  |


### setRepresentation

Control the surface geometry representation for the object.


| Argument | Type | Description |
| ------------- | ------------- | ----- |
| **representation** | <span class="arg-type"></span></br></span><span class="arg-required">required</span> |  |


### setRepresentationToPoints

Set representation to 0 => 'POINTS'



### setRepresentationToSurface

Set representation to 2 => 'SURFACE'



### setRepresentationToWireframe

Set representation to 1 => 'WIREFRAME'



### setShading

Enable/Disable shading.


| Argument | Type | Description |
| ------------- | ------------- | ----- |
| **shading** | <span class="arg-type"></span></br></span><span class="arg-required">required</span> |  |


### setSpecular

Set the specular lighting coefficient.


| Argument | Type | Description |
| ------------- | ------------- | ----- |
| **specular** | <span class="arg-type"></span></br></span><span class="arg-required">required</span> |  |


### setSpecularColor

Set the specular surface color.


| Argument | Type | Description |
| ------------- | ------------- | ----- |
| **r** | <span class="arg-type"></span></br></span><span class="arg-required">required</span> |  |
| **g** | <span class="arg-type"></span></br></span><span class="arg-required">required</span> |  |
| **b** | <span class="arg-type"></span></br></span><span class="arg-required">required</span> |  |


### setSpecularColor

Set the specular surface color from an RGB array


| Argument | Type | Description |
| ------------- | ------------- | ----- |
| **specularColor** | <span class="arg-type"></span></br></span><span class="arg-required">required</span> |  |


### setSpecularColorFrom

Set the specular surface color from an RGB array


| Argument | Type | Description |
| ------------- | ------------- | ----- |
| **specularColor** | <span class="arg-type"></span></br></span><span class="arg-required">required</span> |  |


### setSpecularPower

Set the specular power.


| Argument | Type | Description |
| ------------- | ------------- | ----- |
| **specularPower** | <span class="arg-type"></span></br></span><span class="arg-required">required</span> |  |


### shading





### specular

The specular lighting coefficient.



### specularColor

The specular surface color.



### specularPower

The specular power.



