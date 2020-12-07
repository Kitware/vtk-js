## Introduction

vtkInteractorStyleUnicam is an interactor style used to interact with the camera using only the left mouse button. 

It inherits [vtkInteractorStyleManipulator](Interaction_Style_InteractorStyleManipulator.html).

## Interactions

Three different types of interactions are available.

### Pan  

One can start a pan motion of the camera by holding the left mouse button and initially moving either to the left or to the right. The camera will then follow the cursor while the left mouse button is held.

### Dolly + Pan

One can start a dolly and pan motion by holding the left mouse button and initially moving either up or down. While holding the left mouse button, moving the mouse down will dolly towards the picked point, moving the mouse up will dolly away from it, and horizontal mouse movements will pan the camera left and right.

### Rotate

A rotation motion can be achieved by two methods.  

The first one is to press and release the left mouse button anywhere on the screen, which will place a 'focus dot'. This focus dot will be used as the center of rotation. One this dot is placed, holding the left mouse button and moving the mouse will perform a rotation. Once the left mouse button is released, the focus dot will disappear.  

The second method is to start holding the left mouse button from within 10% of the window border. The last focus dot will be used to define the center of rotation, or a point at the coordinates (0,0,0) if no focus dot has been placed yet. The rotation motion stops when the left mouse button is released.

## Parameters

### worldUpVec (get/set): [x, y, z]

All the following explanations are true only if *useWorldVec* is set to *true*.  

A 3D vector defining an "up" direction for the world. This vector is used to make sure the camera "up" direction is always the same as the world "up" direction. This prevents rotating the camera past the "top" and the "bottom" which would imply turning the world "upside down".  

By default, the vector <0,1,0> is used as the "up" direction.  

### useWorldUpVec (get/set): Boolean

Indicates if the worldUpVec is used by the InteractorStyleUnicam. Setting this value to *true* will enable the behavior described previously. Setting this value to *false* will allow to rotate the camera freely.

### useHardwareSelector (get/set): Boolean

Indicates if the point picking is done using a vtkOpenGLHardwareSelector. This picking method is preferred over the use of a vtkPicker which is the alternative method, because vtkPicker does not follow the actors surfaces making the picking less precise.  
Set this property to *false* if the use of the hardware selector is causing issues.

### focusSphereColor (get/set): [r, g, b]

Defines the color of the focus sphere.  
The default value is (0.89, 0.66, 0.41).

### focusSphereRadiusFactor (get/set): Number

Applies a factor to the radius of the focus sphere.