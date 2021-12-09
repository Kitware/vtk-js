## WebGL 2D poly data mapper
vtkWebGLPolyDataMapper2D is designed to view/render a vtkPolyDataMapper2D

## Methods
### build(prepass)

Prepare for rendering.

### render(prepass)

Do the rendering.

## Shader customization

In order to provide specific properties for rendering, you will have to add
properties into the viewSpecificProperties attribute of your mapper.

### viewSpecificProperties attribute:

##### Initialization
Here how to initialize viewSpecificProperties to be usable in PolyDataMapper.
It is not necessary to declare all of them if they're not needed.
```js
const mapperSpecificProp = mapper.getViewSpecificProperties();
mapperSpecificProp['OpenGL'] = {
  ShaderReplacements: [],
  VertexShaderCode: '',
  FragmentShaderCode: '',
  GeometryShaderCode: ''
};
```

- OpenGL.ShaderReplacements (Array) will contain shader replacements properties
- OpenGL.VertexShaderCode (String) will contain a vertex shader code to use
- OpenGL.FragmentShaderCode (String) will contain a fragment shader code to use
- OpenGL.GeometryShaderCode (String) will contain a geometry shader code to use

### ShaderReplacement:
##### Add a shader replacement value

```js
mapperSpecificProp['OpenGL']['ShaderReplacements'].push({
  shaderType: ...,
  originalValue: ...,
  replaceFirst: ...,
  replacementValue: ...,
  replaceAll: ...
});
```

Expected Values:
- shaderType: string:  'Vertex', 'Geometry' or 'Fragment'
- originalValue: string: value to replace
- replaceFirst: boolean that defines if this replacement will be done before (true)
the default or not (false)
- replacementValue: string: replacement value
- replaceAll: boolean: defines if need to replace only the first occurrence (false)
or all of them (true)


##### Remove one specific shader replacement
```js
const shaderReplacement = mapperSpecificProp.['OpenGL']['ShaderReplacements'];
let indexToRemove = -1;

for (let i = 0; i < shaderReplacements.length; i++) {
  if (shaderReplacement[i].shaderType === _shaderType &&
    shaderReplacement[i].originalValue === _originalValue &&
    shaderReplacement[i].replaceFirst === _replaceFirst) {
    indexToRemove = i;
    break;
  }
}
if (indexToRemove > -1) {
  shaderReplacement.splice(indexToRemove, 1);
}
```

##### Examples
- Add 'addShaderReplacement' function
```js
mapperSpecificProp['addShaderReplacement'] =
 (_shaderType, _originalValue, _replaceFirst, _replacementValue, _replaceAll) => {
   mapperSpecificProp['OpenGL']['ShaderReplacements'].push({
     shaderType: _shaderType,
     originalValue: _originalValue,
     replaceFirst: _replaceFirst,
     replacementValue: _replacementValue,
     replaceAll: _replaceAll,
   });
 };

// To use it
mapperSpecificProp.addShaderReplacement(shaderType, originalValue,
 replaceFirst, replacementValue, replaceAll);
```

- Add 'clearShaderReplacement' function
```js
mapperSpecificProp['clearShaderReplacement'] =
 (_shaderType, _originalValue, _replaceFirst) => {
   const shaderReplacement = mapperSpecificProp['OpenGL']['ShaderReplacements'];
   let indexToRemove = -1;

   for (let i = 0; i < shaderReplacement.length; i++) {
     if (shaderReplacement[i].shaderType === _shaderType &&
       shaderReplacement[i].originalValue === _originalValue &&
       shaderReplacement[i].replaceFirst === _replaceFirst) {
       indexToRemove = i;
       break;
     }
   }
   if (indexToRemove > -1) {
     shaderReplacement.splice(indexToRemove, 1);
   }
 };

// To use it
mapperSpecificProp.clearShaderReplacement(shaderType, originalValue, replaceFirst);
```

### VertexShaderCode - FragmentShaderCode - GeometryShaderCode
##### Change shader code
```js
mapperSpecificProp['OpenGL']['VertexShaderCode'] = 'MyNewVertexShaderCode';
mapperSpecificProp['OpenGL']['FragmentShaderCode'] = 'MyNewFragmentShaderCode';
mapperSpecificProp['OpenGL']['GeometryShaderCode'] = 'MyNewGeometryShaderCode';
```

### CallBack:
You may want to update some shader code by using callback :

```js
const mapperSpecificProp = mapper.getViewSpecificProperties();
mapperSpecificProp.ShaderCallbacks = [];
mapperSpecificProp.ShaderCallbacks.push({
	userData: ...,
	callback: function(userData, cellBO, ren, actor) {
		const program = cellBO.getProgram();
		program.setUniformi(...);
	}
});
```

Defined 'userData' will be the first parameters which will be passed to the callback.
These callbacks will be executed when updateShaders() of OpenGLPolyDataMapper is called.

