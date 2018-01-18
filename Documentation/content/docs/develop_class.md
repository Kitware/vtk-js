title: Creating a new class in vtk.js
---

This guide illustrates how to add new classes to the vtk.js repository and the concepts behind the infrastructure we use.

First of all, vtk.js does not rely on the class definition that was brought in with the ES6 specification. Instead, vtk.js provides a closure based infrastructure which lets us compose methods into specific instances without any hierarchical constraint.
Due to our closure paradigm methods can be used outside of their instance context and can be directly be passed as callbacks. Therefore their usage does not require `this` to be referenced each time.

By convention, we create a directory for each of our class. The name of the directory must be the name of the class capitalized without its "vtk" prefix (although when importing a class, we will add the "vtk" prefix). The definition of that class should be held in an "index.js" file within that directory.

```js
import vtkDataSet from 'vtk.js/Sources/Common/DataModel/DataSet';
```

The reason to use a directory instead of a simple JavaScript file is to enable the association of several resources to a specific class like a constants file, several tests, an example, and/or additional documentation.

That class should belong to a __module__ and that module should be owned by a __kit__.
__Kits__ correspond to the root directories underneath the __Sources__ directory of the repository.
Each __kit__ contains several __modules__ which are the immediate child directories within.
Within each __module__ you find its class definitions.

For instance, vtk.js currently have the following set of **kits** in bold and *modules* in italic.

- **Common**
  - *Core*
  - *DataModel*
  - *System*
- **Filters**
  - *General*
  - *Sources*
- **IO**
  - *Core*
- **Interaction**
  - *Style*
- **Rendering**
  - *Core*
  - *Misc*
  - *OpenGL*
  - *SceneGraph*

## Class definition

Here is an example of how to get started writing a new class for vtk.js.
The design inspiration originated from Douglas Crockford with functional inheritance, but we went further in some ways, too. This [blog](https://medium.com/javascript-scene/functional-mixins-composing-software-ffb66d5e731c) provides a very good background on the techniques we use and leverage inside vtk.js.
This [blog](https://medium.com/@kentcdodds/classes-complexity-and-functional-programming-a8dd86903747) also explains why classes in JavaScript are not always the best choice.


```js MyClass/index.js
import macro          from 'vtk.js/macro';
import vtk            from 'vtk.js/vtk';
import vtkParentClass from 'vtk.js/Kit/Module/ParentClass';
import vtkOtherClass  from 'vtk.js/Kit/Module/OtherClass';
import Constants      from 'vtk.js/Kit/Module/MyClass/Constants';

const { Representation } = Constants;  // { POINT: 0, WIREFRAME: 1, ... }

// ----------------------------------------------------------------------------
// Global methods
// ----------------------------------------------------------------------------

// Add module-level functions or api that you want to expose statically via
// the next section...

function moduleScopedMethod() {
  // do stuff
}

function moduleScopedStaticMethod() {
  // do more stuff
}

// ----------------------------------------------------------------------------
// Static API
// ----------------------------------------------------------------------------

export const STATIC = {
  moduleScopedStaticMethod,
};

// ----------------------------------------------------------------------------
// vtkMyClass methods
// ----------------------------------------------------------------------------

function vtkMyClass(publicAPI, model) {
  // Set our className
  model.classHierarchy.push('vtkMyClass');

  // Capture "parentClass" api for internal use
  const superClass = Object.assign({}, publicAPI);

  // Public API methods
  publicAPI.exposedMethod = () => {
    // This is a publicly exposed method of this object
  };

  publicAPI.overriddenMethod = () => {
    superClass.overriddenMethod();
    // let's add my custom code here
    // ...
  };
}

// ----------------------------------------------------------------------------
// Object factory
// ----------------------------------------------------------------------------

const DEFAULT_VALUES = {
  myProp1: [0, 0, 0],
  // myProp2: null,     // Do not initialize internal objects here
  myProp3: true,
  myProp4: 6,
  myProp5: [1, 2, 3, 4],
  myProp6: Representation.WIREFRAME,
};

// ----------------------------------------------------------------------------

export function extend(publicAPI, model, initialValues = {}) {
  Object.assign(model, DEFAULT_VALUES, initialValues);

  // Inheritance
  vtkParentClass.extend(publicAPI, model, initialValues);

  // Internal objects initialization
  if (model.myProp2) {
    model.myProp2 = vtk(model.myProp2);
  } else {
    model.myProp2 = vtkOtherClass.newInstance();
  }

  // Create get-only macros
  macro.get(publicAPI, model, ['myProp2', 'myProp4']);

  // Create get-set macros
  macro.setGet(publicAPI, model, ['myProp3']);

  // Create set macros for array (needs to know size)
  macro.setArray(publicAPI, model, ['myProp5'], 4);

  // Create get macros for array
  macro.getArray(publicAPI, model, ['myProp1', 'myProp5']);

  // Create get-set macros for enum type
  macro.getSet(publicAPI, model, [
    { name: 'myProp6', enum: Representation, type: 'enum' },
  ]);

  // For more macro methods, see "Sources/macro.js"

  // Object specific methods
  vtkMyClass(publicAPI, model);
}

// ----------------------------------------------------------------------------

export const newInstance = macro.newInstance(extend, 'vtkMyClass');

// ----------------------------------------------------------------------------

export default Object.assign({ newInstance, extend }, STATIC, Constants);
```

## Constants definition

```js MyClass/Constants.js
export const Representation = {
  POINT: 0,
  WIREFRAME: 1,
  SURFACE: 2,
};

export const Format = {
  ASCII: 0,
  BINARY: 1,
}

export default {
  Representation,
  Format,
};
```

## API documentation

If you want to go beyond the code being the sole source of documentation, you can add your own markdown file to further document it with code snippets, member variables, and method usage.
For that you need to add an __api.md__ within the class directory like the following one:

```md
## Usage

```js
import ConeSource from 'vtk.js/Sources/Filters/Sources/ConeSource';

const coneSource = ConeSource.New({ height: 2, radius: 1, resolution: 80 });
const polydata = coneSource.getOutputData();
``` 

### Height (set/get)

Floating point number representing the height of the cone.

### Radius (set/get)

Floating point number representing the radius of the cone base.

### Resolution (set/get)

Integer representing the number of points used to build the base of the cone.

### Capping (set/get)

Boolean letting you close the base of the cone.
```
