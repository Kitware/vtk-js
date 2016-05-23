title: How to create a new class
---

Here is an example of how to get started writing a new class for vtk.js

```js
import * as macro from '../../../macro';
import { MY_ENUM_OBJECT } from './Constants';  // { ENUM_1: 0, ENUM_2: 1, ... }

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

function myClass(publicAPI, model) {
  // Set our className
  model.classHierarchy.push('vtkMyClass');

  // Public API methods
  publicAPI.exposedMethod = () => {
    // This is a publicly exposed method of this object
  };
}

// ----------------------------------------------------------------------------
// Object factory
// ----------------------------------------------------------------------------

const DEFAULT_VALUES = {
  myProp1: [0, 0, 0],
  myProp2: null,          // Do not initialize internal objects here
  myProp3: true,
  myProp4: 6,
  myProp5: [1, 2, 3, 4],
  myProp6: myEnumType,
};

// ----------------------------------------------------------------------------

export function extend(publicAPI, model, initialValues = {}) {
  Object.assign(model, DEFAULT_VALUES, initialValues);

  // Internal objects initialization
  model.myProp2 = new Thing() || {};

  // Object methods
  macro.obj(publicAPI, model);

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
    { name: 'myEnumType', enum: MY_ENUM_OBJECT, type: 'enum' },
  ]);

  // For more macro methods, see "Sources/macro.js"

  // Object specific methods
  myClass(publicAPI, model);
}

// ----------------------------------------------------------------------------

export const newInstance = macro.newInstance(extend, 'vtkMyClass');

// ----------------------------------------------------------------------------

export default Object.assign({ newInstance, extend }, STATIC);
```
