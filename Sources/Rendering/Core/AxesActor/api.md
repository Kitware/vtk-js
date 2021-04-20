## Introduction

vtkAxesActor is a hybrid 2D/3D actor used to represent 3D axes in a scene. 
The user can define the geometry to use for the shaft or the tip, 
and the user can set the text for the three axes. The text will appear 
to follow the camera since it is implemented by means of vtkCaptionActor2D. 
All of the functionality of the underlying vtkCaptionActor2D objects are accessible so that, 
for instance, the font attributes of the axes text can be manipulated through vtkTextProperty. 
Since this class inherits from vtkProp3D, one can apply a user transform to the underlying 
geometry and the positioning of the labels. For example, a rotation transform could be used to 
generate a left-handed axes representation.




## See Also

[vtkAnnotatedCubeActor](./Rendering_Core_AnnotatedCubeActor.html)

[vtkOrientationMarkerWidget](./Interaction_Widgets_OrientationMarkerWidget.html)

## Methods


### extend

Method use to decorate a given object (publicAPI+model) with vtkAxesActor characteristics.


| Argument | Type | Description |
| ------------- | ------------- | ----- |
| **publicAPI** | <span class="arg-type"></span></br></span><span class="arg-required">required</span> | object on which methods will be bounds (public) |
| **model** | <span class="arg-type"></span></br></span><span class="arg-required">required</span> | object on which data structure will be bounds (protected) |
| **initialValues** | <span class="arg-type"></span></br></span><span class="arg-required">required</span> | (default: {}) |


### getConfig





### getXAxisColor





### getXAxisColorByReference





### getYAxisColor





### getYAxisColorByReference





### getZAxisColor





### getZAxisColorByReference





### newInstance

Method use to create a new instance of vtkAxesActor.


| Argument | Type | Description |
| ------------- | ------------- | ----- |
| **initialValues** | <span class="arg-type"></span></br></span><span class="arg-required">required</span> | for pre-setting some of its content |


### setConfig




| Argument | Type | Description |
| ------------- | ------------- | ----- |
| **config** | <span class="arg-type"></span></br></span><span class="arg-required">required</span> |  |


### setXAxisColor




| Argument | Type | Description |
| ------------- | ------------- | ----- |
| **r** | <span class="arg-type"></span></br></span><span class="arg-required">required</span> |  |
| **g** | <span class="arg-type"></span></br></span><span class="arg-required">required</span> |  |
| **b** | <span class="arg-type"></span></br></span><span class="arg-required">required</span> |  |


### setXAxisColorFrom




| Argument | Type | Description |
| ------------- | ------------- | ----- |
| **XAxisColor** | <span class="arg-type"></span></br></span><span class="arg-required">required</span> |  |


### setYAxisColor




| Argument | Type | Description |
| ------------- | ------------- | ----- |
| **r** | <span class="arg-type"></span></br></span><span class="arg-required">required</span> |  |
| **g** | <span class="arg-type"></span></br></span><span class="arg-required">required</span> |  |
| **b** | <span class="arg-type"></span></br></span><span class="arg-required">required</span> |  |


### setYAxisColorFrom




| Argument | Type | Description |
| ------------- | ------------- | ----- |
| **YAxisColor** | <span class="arg-type"></span></br></span><span class="arg-required">required</span> |  |


### setZAxisColor




| Argument | Type | Description |
| ------------- | ------------- | ----- |
| **r** | <span class="arg-type"></span></br></span><span class="arg-required">required</span> |  |
| **g** | <span class="arg-type"></span></br></span><span class="arg-required">required</span> |  |
| **b** | <span class="arg-type"></span></br></span><span class="arg-required">required</span> |  |


### setZAxisColorFrom




| Argument | Type | Description |
| ------------- | ------------- | ----- |
| **ZAxisColor** | <span class="arg-type"></span></br></span><span class="arg-required">required</span> |  |


### update





