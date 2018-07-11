## Introduction

vtkLight is a virtual light for 3D rendering. It provides methods to locate
and point the light, turn it on and off, and set its brightness and color.
In addition to the basic infinite distance point light source attributes,
you also can specify the light attenuation values and cone angle.
These attributes are only used if the light is a positional light.
The default is a directional light (e.g. infinite point light source).

Lights have a type that describes how the light should move with respect
to the camera. A Headlight is always located at the current camera position
and shines on the camera's focal point. A CameraLight also moves with
the camera, but may not be coincident to it. CameraLights are defined
in a normalized coordinate space where the camera is located at (0, 0, 1),
the camera is looking at (0, 0, 0), and up is (0, 1, 0). Finally, a
SceneLight is part of the scene itself and does not move with the camera.
(Renderers are responsible for moving the light based on its type.)

Lights have a transformation matrix that describes the space in which
they are positioned. A light's world space position and focal point
are defined by their local position and focal point, transformed by
their transformation matrix (if it exists).

## newInstance()

Create a light with the focal point at the origin and its position
set to (0,0,1). The light is a SceneLight, its color is white,
intensity=1, the light is turned on, positional lighting is off,
ConeAngle=30, AttenuationValues=(1,0,0), Exponent=1 and the
TransformMatrix is NULL.

### color

Set/Get the color of the light.

### position

Set/Get the position of the light.
Note: The position of the light is defined in the coordinate
space indicated by its transformation matrix (if it exists).
Thus, to get the light's world space position, use
vtkGetTransformedPosition() instead of vtkGetPosition().

### focalPoint

Set/Get the point at which the light is shining.
Note: The focal point of the light is defined in the coordinate
space indicated by its transformation matrix (if it exists).
Thus, to get the light's world space focal point, use
vtkGetTransformedFocalPoint() instead of vtkGetFocalPoint().

### intensity

Set/Get the brightness of the light (from one to zero).

### switch

Turn the light on or off.

### positional

Turn positional lighting on or off.

### exponent

Set/Get the exponent of the cosine used in positional lighting.

### coneAngle

Set/Get the lighting cone angle of a positional light in degrees.
This is the angle between the axis of the cone and a ray along the edge of
the cone.
A value of 180 indicates that you want no spot lighting effects
just a positional light.

### attenuationValues

Set/Get the quadratic attenuation constants. They are specified as
constant, linear, and quadratic, in that order.

### transformMatrix

Set/Get the light's transformation matrix. If a matrix is set for
a light, the light's parameters (position and focal point) are
transformed by the matrix before being rendered.

(glMatrix 4x4)

### getTransformedPosition() : [x, y, z]

Get the position of the light, modified by the transformation matrix
(if it exists).

### getTransformedFocalPoint() : [x, y, z]

Get the focal point of the light, modified by the transformation matrix
(if it exists).

### setDirectionAngle(elevation, azimuth)

Set the position and focal point of a light based on elevation and
azimuth. The light is moved so it is shining from the given angle.
Angles are given in degrees. If the light is a
positional light, it is made directional instead.

### lightType ('HeadLight', 'CameraLight', 'SceneLight')

Set/Get the type of the light.
A SceneLight is a light located in the world coordinate space. A light
is initially created as a scene light.

A Headlight is always located at the camera and is pointed at the
camera's focal point. The renderer is free to modify the position and
focal point of the camera at any time.

A CameraLight is also attached to the camera, but is not necessarily
located at the camera's position. CameraLights are defined in a
coordinate space where the camera is located at (0, 0, 1), looking
towards (0, 0, 0) at a distance of 1, with up being (0, 1, 0).

Note: Use setLightTypeToSceneLight, rather than SetLightType(3), since
the former clears the light's transform matrix.

### lightTypeIsHeadlight() : Boolean

Return true if the light type is 'HeadLight'.

### lightTypeIsSceneLight() : Boolean

Return true if the light type is 'SceneLight'.

### lightTypeIsCameraLight() : Boolean

Return true if the light type is 'CameraLight'.

### shadowAttenuation

Set/Get the shadow intensity
By default a light will be completely blocked when in shadow
by setting this value to less than 1.0 you can control how much
light is attenuated when in shadow

