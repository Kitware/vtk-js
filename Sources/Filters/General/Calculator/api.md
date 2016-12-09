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
          arraysOut.forEach(x => { x.modified(); });
        }
      });
  ```

### Formula (set/get)

An object that provides two functions:
+ a `getArrays` function that, given the input dataset,
  returns two arrays of objects that specify the input
  and output vtkDataArrays to pass your function, and
+ an `evaluate` function that, given an array of
  input vtkDataArrays and an array of output vtkDataArrays,
  populates the latter using the former.

### SimpleFormula (set)

Accept a simple one-line format for the calculator.
This is a convenience method that allows a more terse function
to compute array values, similar to the way VTK's array
calculator works.
It calls `setFormula()` with an object that includes the
information you pass it.
