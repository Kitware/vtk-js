## WebGL Texture

##  Create custom texture

In order to provide specific properties for rendering, you will have to add
properties into the viewSpecificProperties attribute of your mapper.

### viewSpecificProperties

#### CreateCubeFromRaw
To use the method CreateCubeFromRaw from OpenGL Texture, you have to
implement a specific object in the viewSpecificProperties attribute
as below :
```js
const textureSpecificProp = texture.getViewSpecificProperties();
textureSpecificProp['Cube'] = {
	width: ...,
	height: ...,
	nbComp: ...,
	dataType: ...,
	data: ...,
};
```
texture (vtkTexture) : import from 'vtk.js/Sources/Rendering/Core/Texture';
Cube.width (Number) : Define width of images
Cube.height (Number) : Define height of images
Cube.nbComp (Number) : Define the number of components
Cube.dataType (String) : Define the type of images
Cube.data (array[vtkImageData]) : List of the six needed images for texturing