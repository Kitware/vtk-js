title: Creating a new class in vtk.js
---

This guide illustrate how to add new classes to the vtk.js repository and what are the concept behind the infrastructure we use.

First of all, vtk.js do not rely on the class definition that was brought in with the ES6 specification. Instead, vtk.js provides a closure based infrastructure which let us compose methods into specific instances without any hierarchical constraint.
On top of that, methods can be used outside of their instance context and can be directly be passed as callback due to our closure paradigm and our absence of usage of "this". 

By convention, we create a directory for each of our class. The name of that directory must be the name of the class capitalized without its "vtk" prefix. Although when importing a class, we will add that "vtk" prefix back like below and the definition of that class should be held in an "index.js" file within that directory.

```js
import vtkDataSet from 'vtk.js/Sources/Common/DataModel/DataSet';
```

The reason to use a directory instead of a simple JavaScript file is to enable the association of several resources to a specific class like a "Constants.js" file, several tests, an example or additional documentation.

Then that class should belong to a __module__ while that module should be owned by a __kit__.
__Kits__ correspond to the root directories underneath the __Sources__ directory of the repository.
Then each __kits__ contains several modules which are the directory right after the __kit__.
Then within each __module__ you find its class definitions.

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

Here is an example of how to get started writing a new class for vtk.js

```js MyClass/index.js
import * as macro     from '../../../macro';
import vtk            from '../../../vtk';
import vtkParentClass from '../../../Kit/Module/ParentClass';
import vtkOtherClass  from '../../../Kit/Module/OtherClass';

import { Representation } from './Constants';  // { POINT: 0, WIREFRAME: 1, ... }

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

export default Object.assign({ newInstance, extend }, STATIC);
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

If you want to go beyond having the code being the source of documentation, you add your own markdown to document it with code snippet and so on.
For that you just need to add an __api.md__ within the class directory like the following one.

```md
## Usage

```js
import ConeSource from 'vtk.js/Sources/Filters/Sources/ConeSource';

const coneSource = ConeSource.New({ height: 2, radius: 1, resolution: 80 });
const polydata = coneSource.getOutput();
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

