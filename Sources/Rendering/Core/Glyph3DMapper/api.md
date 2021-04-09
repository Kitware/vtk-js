




## Methods


### buildArrays





### extend

Method use to decorate a given object (publicAPI+model) with vtkGlyph3DMapper characteristics.


| Argument | Type | Description |
| ------------- | ------------- | ----- |
| **publicAPI** | <span class="arg-type"></span></br></span><span class="arg-required">required</span> | object on which methods will be bounds (public) |
| **model** | <span class="arg-type"></span></br></span><span class="arg-required">required</span> | object on which data structure will be bounds (protected) |
| **initialValues** | <span class="arg-type"></span></br></span><span class="arg-required">required</span> | (default: {}) |


### getBounds

Get the bounds for this mapper as [Xmin,Xmax,Ymin,Ymax,Zmin,Zmax].

#### Returns

| Type | Description |
| ----- | ------------- |
| <span class="arg-type"></span> |  |


### getOrientationArrayData

Get orientation as array



### getOrientationMode

An orientation array is a vtkDataArray with 3 components. The first
component is the angle of rotation along the X axis. The second
component is the angle of rotation along the Y axis. The third
component is the angle of rotation along the Z axis. Orientation is
specified in X,Y,Z order but the rotations are performed in Z,X an Y.
This definition is compliant with SetOrientation method on vtkProp3D.
By using vector or normal there is a degree of freedom or rotation
left (underconstrained). With the orientation array, there is no degree of
freedom left.



### getOrientationModeAsString

Get orientation as string



### getPrimitiveCount





### getScaleArrayData

Get scale mode as array



### getScaleFactor





### getScaleMode

Get scale mode



### getScaleModeAsString

Get scale mode as string



### lines





### newInstance

Method use to create a new instance of vtkGlyph3DMapper


| Argument | Type | Description |
| ------------- | ------------- | ----- |
| **initialValues** | <span class="arg-type"></span></br></span><span class="arg-required">required</span> | for pre-setting some of its content |


### points





### setOrientationMode

Orientation mode indicates if the OrientationArray provides the direction 
vector for the orientation or the rotations around each axes.



### setOrientationModeToDirection





### setOrientationModeToMatrix





### setOrientationModeToRotation





### setScaleFactor




| Argument | Type | Description |
| ------------- | ------------- | ----- |
| **scaleFactor** | <span class="arg-type"></span></br></span><span class="arg-required">required</span> |  |


### setScaleMode

Either scale by individual components (SCALE_BY_COMPONENTS) or magnitude (SCALE_BY_MAGNITUDE) of the chosen array to SCALE with or disable scaling using data array all together (SCALE_BY_MAGNITUDE).


| Argument | Type | Description |
| ------------- | ------------- | ----- |
| **ScaleMode** | <span class="arg-type"></span></br></span><span class="arg-required">required</span> |  |


### setScaleModeToScaleByComponents

Set scale to SCALE_BY_CONSTANT



### setScaleModeToScaleByConstant

Set scale to SCALE_BY_CONSTANT



### setScaleModeToScaleByMagnitude

Set scale to SCALE_BY_MAGNITUDE



### triangles





### verts





