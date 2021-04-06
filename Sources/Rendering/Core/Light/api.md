## Introduction

vtkLight is a virtual light for 3D rendering. It provides methods to locate
and point the light, turn it on and off, and set its brightness and color.
In addition to the basic infinite distance point light source attributes,
you also can specify the light attenuation values and cone angle.
These attributes are only used if the light is a positional light.
The default is a directional light (e.g. infinite point light source).

Lights have a type that describes how the light should move with respect
to the camera. A Headlight is always located at the current camera position
and shines on the camera’s focal point. A CameraLight also moves with
the camera, but may not be coincident to it. CameraLights are defined
in a normalized coordinate space where the camera is located at (0, 0, 1),
the camera is looking at (0, 0, 0), and up is (0, 1, 0). Finally, a
SceneLight is part of the scene itself and does not move with the camera.
(Renderers are responsible for moving the light based on its type.)

Lights have a transformation matrix that describes the space in which
they are positioned. A light’s world space position and focal point
are defined by their local position and focal point, transformed by
their transformation matrix (if it exists).




## Methods


### extend

Method use to decorate a given object (publicAPI+model) with vtkLight characteristics.


| Argument | Type | Description |
| ------------- | ------------- | ----- |
| **publicAPI** | <span class="arg-type"></span></br></span><span class="arg-required">required</span> | object on which methods will be bounds (public) |
| **model** | <span class="arg-type"></span></br></span><span class="arg-required">required</span> | object on which data structure will be bounds (protected) |
| **initialValues** | <span class="arg-type"></span></br></span><span class="arg-required">required</span> | (default: {}) |


### getAttenuationValues





### getAttenuationValuesByReference





### getColor





### getColorByReference





### getConeAngle





### getDirection





### getExponent

Get the exponent of the cosine used in positional lighting.



### getFocalPoint

Get the focal point.



### getFocalPointByReference

Get the focal point.



### getIntensity

Get the brightness of the light



### getLightType

Get the type of the light.



### getPosition





### getPositionByReference





### getPositional





### getTransformedFocalPoint

Get the focal point of the light, modified by the transformation matrix (if it exists).



### getTransformedPosition

Get the position of the light, modified by the transformation matrix (if it exists).



### lightTypeIsCameraLight

Check if the type of the light is CameraLight.



### lightTypeIsHeadLight

Check if the type of the light is HeadLight.



### lightTypeIsSceneLight

Check if the type of the light is SceneLight.



### newInstance

Method use to create a new instance of vtkLight with the focal point at the origin and its position
set to [0, 0, 1]. The light is a SceneLight, its color is white, intensity=1, the light is turned on, 
positional lighting is off, coneAngle=30, AttenuationValues=[1, 0, 0], exponent=1 and the transformMatrix is null.


| Argument | Type | Description |
| ------------- | ------------- | ----- |
| **initialValues** | <span class="arg-type"></span></br></span><span class="arg-required">required</span> | for pre-setting some of its content |


### setAttenuationValues

Set the quadratic attenuation constants.


| Argument | Type | Description |
| ------------- | ------------- | ----- |
| **a** | <span class="arg-type"></span></br></span><span class="arg-required">required</span> |  |
| **b** | <span class="arg-type"></span></br></span><span class="arg-required">required</span> |  |
| **c** | <span class="arg-type"></span></br></span><span class="arg-required">required</span> |  |


### setAttenuationValuesFrom

Set the quadratic attenuation constants from an array.


| Argument | Type | Description |
| ------------- | ------------- | ----- |
| **attenuationValues** | <span class="arg-type"></span></br></span><span class="arg-required">required</span> |  |


### setColor




| Argument | Type | Description |
| ------------- | ------------- | ----- |
| **r** | <span class="arg-type"></span></br></span><span class="arg-required">required</span> |  |
| **g** | <span class="arg-type"></span></br></span><span class="arg-required">required</span> |  |
| **b** | <span class="arg-type"></span></br></span><span class="arg-required">required</span> |  |


### setColorFrom




| Argument | Type | Description |
| ------------- | ------------- | ----- |
| **color** | <span class="arg-type"></span></br></span><span class="arg-required">required</span> |  |


### setConeAngle

Set the lighting cone angle of a positional light in degrees.
This is the angle between the axis of the cone and a ray along the edge of the cone. 
A value of 90 (or more) indicates that you want no spot lighting effects just a positional light.


| Argument | Type | Description |
| ------------- | ------------- | ----- |
| **coneAngle** | <span class="arg-type"></span></br></span><span class="arg-required">required</span> |  |


### setDirectionAngle

Set the position and focal point of a light based on elevation and azimuth.
The light is moved so it is shining from the given angle.
Angles are given in degrees. If the light is a positional light, it is made directional instead.


| Argument | Type | Description |
| ------------- | ------------- | ----- |
| **elevation** | <span class="arg-type"></span></br></span><span class="arg-required">required</span> |  |
| **azimuth** | <span class="arg-type"></span></br></span><span class="arg-required">required</span> |  |


### setExponent

Set the exponent of the cosine used in positional lighting.


| Argument | Type | Description |
| ------------- | ------------- | ----- |
| **exponent** | <span class="arg-type"></span></br></span><span class="arg-required">required</span> |  |


### setFocalPoint

Set the focal point.


| Argument | Type | Description |
| ------------- | ------------- | ----- |
| **x** | <span class="arg-type"></span></br></span><span class="arg-required">required</span> |  |
| **y** | <span class="arg-type"></span></br></span><span class="arg-required">required</span> |  |
| **z** | <span class="arg-type"></span></br></span><span class="arg-required">required</span> |  |


### setFocalPointFrom

Set the focal point from an array


| Argument | Type | Description |
| ------------- | ------------- | ----- |
| **focalPoint** | <span class="arg-type"></span></br></span><span class="arg-required">required</span> |  |


### setIntensity

Set the brightness of the light (from one to zero).


| Argument | Type | Description |
| ------------- | ------------- | ----- |
| **intensity** | <span class="arg-type"></span></br></span><span class="arg-required">required</span> |  |


### setLightType

Set the type of the light to lightType


| Argument | Type | Description |
| ------------- | ------------- | ----- |
| **lightType** | <span class="arg-type"></span></br></span><span class="arg-required">required</span> |  |


### setLightTypeToCameraLight

Set the type of the light is CameraLight.



### setLightTypeToHeadLight

Set the the type of the light is HeadLight.



### setLightTypeToSceneLight

Set the the type of the light is SceneLight.



### setPosition




| Argument | Type | Description |
| ------------- | ------------- | ----- |
| **x** | <span class="arg-type"></span></br></span><span class="arg-required">required</span> |  |
| **y** | <span class="arg-type"></span></br></span><span class="arg-required">required</span> |  |
| **z** | <span class="arg-type"></span></br></span><span class="arg-required">required</span> |  |


### setPositionFrom




| Argument | Type | Description |
| ------------- | ------------- | ----- |
| **position** | <span class="arg-type"></span></br></span><span class="arg-required">required</span> |  |


### setPositional




| Argument | Type | Description |
| ------------- | ------------- | ----- |
| **positional** | <span class="arg-type"></span></br></span><span class="arg-required">required</span> |  |


### setShadowAttenuation




| Argument | Type | Description |
| ------------- | ------------- | ----- |
| **shadowAttenuation** | <span class="arg-type"></span></br></span><span class="arg-required">required</span> |  |


### setSwitch




| Argument | Type | Description |
| ------------- | ------------- | ----- |
| **switchValue** | <span class="arg-type"></span></br></span><span class="arg-required">required</span> |  |


### setTransformMatrix




| Argument | Type | Description |
| ------------- | ------------- | ----- |
| **transformMatrix** | <span class="arg-type"></span></br></span><span class="arg-required">required</span> |  |


