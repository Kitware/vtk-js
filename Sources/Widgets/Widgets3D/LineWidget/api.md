This class represents a line with customizable ends to show points
of interests. It consists of 2 handles linked by a line and a text area
to add annotations on the widget

## List of shapes

Shapes may be changed in the state.js file

### 3D Shapes
3D shapes include :
    - Sphere
    - Cone
    - Cube
    - Void handle (no handle on the VTK scene, the user can't interact with
      this end of the line)

### 2D Shapes
2D Shapes include :
    - triangle
    - 4 Points arrow head
    - 6 points arrow head
    - Star
    - Disk
    - Circle
    - ViewFinder

## Handle orientation

### Shape direction
Shapes meant to represent an arrow will follow the direction of the line. Those shapes include cone, arrow head (4 and 6) and triangle.

### Shape rotation
Shape rotation comes in 3 behaviors:
    - NONE : will rotate only 2d shapes to face camera
    - TRUE : will rotate every shape to face camera
    - FALSE: will not rotate shapes
These mods are set in the Constants file and are to be changed directly on the
representation of a handle

### Handle visibility
Handles can have 3 states of visibility. First the classic visible handle,
then the non visible handle that can be interacted with on mouseOver - visible feature to toggle in state.js - and the complete invisible invisible
handle with no possibility of user interaction - the voidSphere handle, a feature to activate by changing widget shape to voidSphere in state.js file.


## Text utilities
The text is an SVG element. It is meant to be placed along the line.Moving handles will cause text to reposition in order to avoid as much as possible having letters overlapping on the line representation. Position of the text along the line may be changed.
- setText : sets the SVG Text value to display text
- positionOnLine: a substate to indicate where the text should be positioned. A scalar which value should be set between 0 and 1, with 0 placing text on handle1 position and 1 on handle2 position. 
