## Introduction

The Calculator filter is a fast way to add derived data arrays to a dataset.
These arrays can be defined over points, cells, or just field data that is "uniform" across the dataset (i.e., constant over all of space).
Values in the array(s) you create are specified in terms of existing arrays via a function you provide.

The Calculator filter is similar in spirit to VTK's array calculator, so it should be familiar to VTK users but the syntax takes advantage of JavaScript's flexibility.

## Usage

There are two methods provided for configuring the filter:

+ a simple method that assumes you will only be adding a single array defined on points (or cells) and written in terms of other arrays already present on the points (or cells).

  ```js
      const calc = vtkCalculator.newInstance();
      calc.setFormulaSimple(
        FieldDataTypes.POINT,                      // Operate on point data
        ['temp', 'press', 'nR'],                   // Require these point-data arrays as input
        'rho',                                     // Name the output array 'rho'
        (temp, press, nR) => press / nR / temp);   // Apply this formula to each point to compute rho.
  ```

+ a more general method that allows multiple output arrays to be defined based on arrays held by different dataset attributes (points, cells, and uniform field data), but which requires a more verbose specification:

  ```js
      const calc = vtkCalculator.newInstance();
      calc.setFormula({
        getArrays: (inputDataSets) => ({
          input: [
            { location: FieldDataTypes.COORDINATE }], // Require point coordinates as input
          output: [ // Generate two output arrays:
            {
              location: FieldDataTypes.POINT,   // This array will be point-data ...
              name: 'sine wave',                // ... with the given name ...
              dataType: 'Float64Array',         // ... of this type ...
              attribute: AttributeTypes.SCALARS // ... and will be marked as the default scalars.
              },
            {
              location: FieldDataTypes.UNIFORM, // This array will be field data ...
              name: 'global',                   // ... with the given name ...
              dataType: 'Float32Array',         // ... of this type ...
              numberOfComponents: 1,            // ... with this many components ...
              tuples: 1                         // ... and this many tuples.
              },
          ]}),
        evaluate: (arraysIn, arraysOut) => {
          // Convert in the input arrays of vtkDataArrays into variables
          // referencing the underlying JavaScript typed-data arrays:
          const [coords] = arraysIn.map(d => d.getData());
          const [sine, glob] = arraysOut.map(d => d.getData());

          // Since we are passed coords as a 3-component array,
          // loop over all the points and compute the point-data output:
          for (let i = 0, sz = coords.length / 3; i < sz; ++i) {
            const dx = (coords[3 * i] - 0.5);
            const dy = (coords[(3 * i) + 1] - 0.5);
            sine[i] = dx * dx + dy * dy + 0.125;
          }
          // Use JavaScript's reduce method to sum the output
          // point-data array and set the uniform array's value:
          glob[0] = sine.reduce((result, value) => result + value, 0);
          // Mark the output vtkDataArray as modified
          arraysOut.forEach(x => x.modified());
        }
      });
  ```

### Formula (set/get)

An object that provides two functions:
+ a `getArrays` function that, given an input dataset, returns two arrays of objects that specify the input and output vtkDataArrays to pass your function, and
+ an `evaluate` function that, given an array of input vtkDataArrays and an array of output vtkDataArrays, populates the latter using the former.

When the filter runs, the arrays specified by `getArrays` are located (on the input) or created (and attached to the output data object) and passed to the `evaluate` function in the order specified by `getArrays`.

### FormulaSimple (set)

Accept a simple one-line format for the calculator.
This is a convenience method that allows a more terse function to compute array values, similar to the way VTK's array calculator works.
You may use it assuming that
+ you only need to generate a single output data array; and
+ your formula will only use arrays defined at the same location of the input as the output array (i.e., if the output will be point-data, only point-data arrays and point coordinates may be passed to the formula; similarly, cell-data outputs may only depend on cell-data inputs).
This method calls `setFormula()` with an object that includes the information you pass it.

The setFormulaSimple method takes:
+ a _location_ specifying where on the input and output datasets the arrays are defined;
  the location value should be a `FieldDataTypes` enum (see `Common/DataModel/DataSet/Constants.js`).
+ an array containing the names of input arrays the formula will need to compute the output
  array values. These arrays must exist on the input dataset at the given _location_ or they will be
  reported as `null` when the formula is evaluated.

  Note that when the _location_ is `FieldDataTypes.POINT`, the coordinates of each point will be automatically appended to the list of arrays you request.
+ the _name_ of the output array to create, which will be defined at the same _location_ as the input arrays.
+ a _formula_ (i.e., a JavaScript function) which takes as its input a **single** tuple of each input
  array specified and generates a **single** output tuple.
  Note that when input arrays you request have a single component, _formula_ will be called with a single number;
  when input arrays have multiple components, your _formula_ will be called with an array of values.
  As an example, if you pass `['density', 'velocity']` as the second argument, where pressure is a 1-component array and velocity is a 3-component array, then a formula that computes the momentum's magnitude would be written as

      (rho, vel) => 0.5 * rho * (vel[0]*vel[0] + vel[1]*vel[1] + vel[2]*vel[2])

+ a dictionary of _options_ that can be used to change how the formula is used:
    + if `numberOfOutputComponents` is specified and greater than 1, then the _formula_ should return a tuple instead of a single number each time it is called.
      To improve speed when this option is specified, a pre-allocated tuple is passed into your _formula_ as the final argument.
      Your function can fill this array and return it as the output value to avoid the overhead of allocating a new array each time the _formula_ is called.
    + if `outputAttribute` is specified as an `AttributeTypes` enum (see `Common/DataModel/DataSetAttributes/Constants.js`), then the output array will be marked as the given attribute type.
      If unspecified, then `AttributeTypes.SCALAR` is assumed.
