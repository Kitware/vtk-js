import macro from 'vtk.js/Sources/macros';

const { vtkErrorMacro } = macro;

// ----------------------------------------------------------------------------
// vtkPiecewiseFunction methods
// ----------------------------------------------------------------------------

function vtkPiecewiseFunction(publicAPI, model) {
  // Set our className
  model.classHierarchy.push('vtkPiecewiseFunction');

  // Return the number of points which specify this function
  publicAPI.getSize = () => model.nodes.length;

  // Return the type of function stored in object:
  // Function Types:
  //    0 : Constant        (No change in slope between end points)
  //    1 : NonDecreasing   (Always increasing or zero slope)
  //    2 : NonIncreasing   (Always decreasing or zero slope)
  //    3 : Varied          (Contains both decreasing and increasing slopes)
  //    4 : Unknown         (Error condition)
  //
  publicAPI.getType = () => {
    let value;
    let prevValue = 0.0;
    let functionType = 0;

    if (model.nodes.length > 0) {
      prevValue = model.nodes[0].y;
    }

    for (let i = 1; i < model.nodes.length; i++) {
      value = model.nodes[i].y;

      // Do not change the function type if equal
      if (value !== prevValue) {
        if (value > prevValue) {
          switch (functionType) {
            case 0:
            case 1:
              // NonDecreasing
              functionType = 1;
              break;
            case 2:
            default:
              // Varied
              functionType = 3;
              break;
          }
        } else {
          // value < prev_value
          switch (functionType) {
            case 0:
            case 2:
              // NonIncreasing
              functionType = 2;
              break;
            case 1:
            default:
              // Varied
              functionType = 3;
              break;
          }
        }
      }

      prevValue = value;

      // Exit loop if we find a Varied function
      if (functionType === 3) {
        break;
      }
    }

    switch (functionType) {
      case 0:
        return 'Constant';
      case 1:
        return 'NonDecreasing';
      case 2:
        return 'NonIncreasing';
      case 3:
      default:
        return 'Varied';
    }
  };

  // Since we no longer store the data in an array, we must
  // copy out of the vector into an array. No modified check -
  // could be added if performance is a problem
  publicAPI.getDataPointer = () => {
    const size = model.nodes.length;

    model.function = null;

    if (size > 0) {
      model.function = [];
      for (let i = 0; i < size; i++) {
        model.function[2 * i] = model.nodes[i].x;
        model.function[2 * i + 1] = model.nodes[i].y;
      }
    }
    return model.function;
  };

  // Returns the first point location which starts a non-zero segment of the
  // function. Note that the value at this point may be zero.
  publicAPI.getFirstNonZeroValue = () => {
    // Check if no points specified
    if (model.nodes.length === 0) {
      return 0;
    }

    let allZero = 1;
    let x = 0.0;
    let i = 0;
    for (; i < model.nodes.length; i++) {
      if (model.nodes[i].y !== 0.0) {
        allZero = 0;
        break;
      }
    }

    // If every specified point has a zero value then return
    // a large value
    if (allZero) {
      x = Number.MAX_VALUE;
    } else if (i > 0) {
      // A point was found with a non-zero value
      // Return the value of the point that precedes this one
      x = model.nodes[i - 1].x;
    } else if (model.clamping) {
      // If this is the first point in the function, return its
      // value is clamping is off, otherwise VTK_DOUBLE_MIN if
      // clamping is on.
      x = -Number.MAX_VALUE;
    } else {
      x = model.nodes[0].x;
    }

    return x;
  };

  // For a specified index value, get the node parameters
  publicAPI.getNodeValue = (index, val) => {
    const size = model.nodes.length;

    if (index < 0 || index >= size) {
      vtkErrorMacro('Index out of range!');
      return -1;
    }

    val[0] = model.nodes[index].x;
    val[1] = model.nodes[index].y;
    val[2] = model.nodes[index].midpoint;
    val[3] = model.nodes[index].sharpness;

    return 1;
  };

  // For a specified index value, get the node parameters
  publicAPI.setNodeValue = (index, val) => {
    const size = model.nodes.length;

    if (index < 0 || index >= size) {
      vtkErrorMacro('Index out of range!');
      return -1;
    }

    const oldX = model.nodes[index].x;
    model.nodes[index].x = val[0];
    model.nodes[index].y = val[1];
    model.nodes[index].midpoint = val[2];
    model.nodes[index].sharpness = val[3];

    if (oldX !== val[0]) {
      // The point has been moved, the order of points or the range might have
      // been modified.
      publicAPI.sortAndUpdateRange();
      // No need to call Modified() here because SortAndUpdateRange() has done it
      // already.
    } else {
      publicAPI.modified();
    }

    return 1;
  };

  // Adds a point to the function. If a duplicate point is inserted
  // then the function value at that location is set to the new value.
  // This is the legacy version that assumes midpoint = 0.5 and
  // sharpness = 0.0
  publicAPI.addPoint = (x, y) => publicAPI.addPointLong(x, y, 0.5, 0.0);

  // Adds a point to the function and returns the array index of the point.
  publicAPI.addPointLong = (x, y, midpoint, sharpness) => {
    // Error check
    if (midpoint < 0.0 || midpoint > 1.0) {
      vtkErrorMacro('Midpoint outside range [0.0, 1.0]');
      return -1;
    }

    if (sharpness < 0.0 || sharpness > 1.0) {
      vtkErrorMacro('Sharpness outside range [0.0, 1.0]');
      return -1;
    }

    // remove any node already at this X location
    if (!model.allowDuplicateScalars) {
      publicAPI.removePoint(x);
    }

    // Create the new node
    const node = { x, y, midpoint, sharpness };

    // Add it, then sort to get everything in order
    model.nodes.push(node);
    publicAPI.sortAndUpdateRange();

    // Now find this node so we can return the index
    let i;
    for (i = 0; i < model.nodes.length; i++) {
      if (model.nodes[i].x === x) {
        break;
      }
    }

    // If we didn't find it, something went horribly wrong so
    // return -1
    if (i < model.nodes.length) {
      return i;
    }

    return -1;
  };

  publicAPI.setNodes = (nodes) => {
    if (model.nodes !== nodes) {
      model.nodes = nodes;
      publicAPI.sortAndUpdateRange();
    }
  };

  // Sort the vector in increasing order, then fill in
  // the Range
  publicAPI.sortAndUpdateRange = () => {
    model.nodes.sort((a, b) => a.x - b.x);
    const modifiedInvoked = publicAPI.updateRange();
    // If range is updated, Modified() has been called, don't call it again.
    if (!modifiedInvoked) {
      publicAPI.modified();
    }
  };

  //----------------------------------------------------------------------------
  publicAPI.updateRange = () => {
    const oldRange = model.range.slice();

    const size = model.nodes.length;
    if (size) {
      model.range[0] = model.nodes[0].x;
      model.range[1] = model.nodes[size - 1].x;
    } else {
      model.range[0] = 0;
      model.range[1] = 0;
    }
    // If the rage is the same, then no need to call Modified()
    if (oldRange[0] === model.range[0] && oldRange[1] === model.range[1]) {
      return false;
    }

    publicAPI.modified();
    return true;
  };

  // Removes a point from the function. If no point is found then function
  // remains the same.
  publicAPI.removePoint = (x) => {
    // First find the node since we need to know its
    // index as our return value
    let i;
    for (i = 0; i < model.nodes.length; i++) {
      if (model.nodes[i].x === x) {
        break;
      }
    }

    // If the node doesn't exist, we return -1
    if (i >= model.nodes.length) {
      return -1;
    }

    const retVal = i;

    // If the first or last point has been removed, then we update the range
    // No need to sort here as the order of points hasn't changed.
    let modifiedInvoked = false;
    model.nodes.splice(i, 1);
    if (i === 0 || i === model.nodes.length) {
      modifiedInvoked = publicAPI.updateRange();
    }
    if (!modifiedInvoked) {
      publicAPI.modified();
    }

    return retVal;
  };

  // Removes all points from the function.
  publicAPI.removeAllPoints = () => {
    model.nodes = [];
    publicAPI.sortAndUpdateRange();
  };

  // Add in end points of line and remove any points between them
  // Legacy method with no way to specify midpoint and sharpness
  publicAPI.addSegment = (x1, y1, x2, y2) => {
    // First, find all points in this range and remove them
    publicAPI.sortAndUpdateRange();
    for (let i = 0; i < model.nodes.length; ) {
      if (model.nodes[i].x >= x1 && model.nodes[i].x <= x2) {
        model.nodes.splice(i, 1);
      } else {
        i++;
      }
    }

    // Now add the points
    publicAPI.addPoint(x1, y1, 0.5, 0.0);
    publicAPI.addPoint(x2, y2, 0.5, 0.0);
  };

  // Return the value of the function at a position
  publicAPI.getValue = (x) => {
    const table = [];
    publicAPI.getTable(x, x, 1, table);
    return table[0];
  };

  // Remove all points outside the range, and make sure a point
  // exists at each end of the range. Used as a convenience method
  // for transfer function editors
  publicAPI.adjustRange = (range) => {
    if (range.length < 2) {
      return 0;
    }

    const functionRange = publicAPI.getRange();

    // Make sure we have points at each end of the range
    if (functionRange[0] < range[0]) {
      publicAPI.addPoint(range[0], publicAPI.getValue(range[0]));
    } else {
      publicAPI.addPoint(range[0], publicAPI.getValue(functionRange[0]));
    }

    if (functionRange[1] > range[1]) {
      publicAPI.addPoint(range[1], publicAPI.getValue(range[1]));
    } else {
      publicAPI.addPoint(range[1], publicAPI.getValue(functionRange[1]));
    }

    // Remove all points out-of-range
    publicAPI.sortAndUpdateRange();
    for (let i = 0; i < model.nodes.length; ) {
      if (model.nodes[i].x >= range[0] && model.nodes[i].x <= range[1]) {
        model.nodes.splice(i, 1);
      } else {
        ++i;
      }
    }

    publicAPI.sortAndUpdateRange();
    return 1;
  };

  //--------------------------------------------------------------------------
  publicAPI.estimateMinNumberOfSamples = (x1, x2) => {
    const d = publicAPI.findMinimumXDistance();
    return Math.ceil((x2 - x1) / d);
  };

  //----------------------------------------------------------------------------
  publicAPI.findMinimumXDistance = () => {
    const size = model.nodes.length;
    if (size < 2) {
      return -1.0;
    }

    let distance = model.nodes[1].x - model.nodes[0].x;
    for (let i = 0; i < size - 1; i++) {
      const currentDist = model.nodes[i + 1].x - model.nodes[i].x;
      if (currentDist < distance) {
        distance = currentDist;
      }
    }

    return distance;
  };

  // Returns a table of function values evaluated at regular intervals
  /* eslint-disable prefer-destructuring */
  /* eslint-disable no-continue */
  publicAPI.getTable = (xStart, xEnd, size, table, stride = 1) => {
    let i;
    let idx = 0;
    const numNodes = model.nodes.length;

    // Need to keep track of the last value so that
    // we can fill in table locations past this with
    // this value if Clamping is On.
    let lastValue = 0.0;
    if (numNodes !== 0) {
      lastValue = model.nodes[numNodes - 1].y;
    }

    let x = 0.0;
    let x1 = 0.0;
    let x2 = 0.0;
    let y1 = 0.0;
    let y2 = 0.0;
    let midpoint = 0.0;
    let sharpness = 0.0;

    // For each table entry
    for (i = 0; i < size; i++) {
      // Find our location in the table
      const tidx = stride * i;

      // Find our X location. If we are taking only 1 sample, make
      // it halfway between start and end (usually start and end will
      // be the same in this case)
      if (size > 1) {
        x = xStart + (i / (size - 1.0)) * (xEnd - xStart);
      } else {
        x = 0.5 * (xStart + xEnd);
      }

      // Do we need to move to the next node?
      while (idx < numNodes && x > model.nodes[idx].x) {
        idx++;
        // If we are at a valid point index, fill in
        // the value at this node, and the one before (the
        // two that surround our current sample location)
        // idx cannot be 0 since we just incremented it.
        if (idx < numNodes) {
          x1 = model.nodes[idx - 1].x;
          x2 = model.nodes[idx].x;

          y1 = model.nodes[idx - 1].y;
          y2 = model.nodes[idx].y;

          // We only need the previous midpoint and sharpness
          // since these control this region
          midpoint = model.nodes[idx - 1].midpoint;
          sharpness = model.nodes[idx - 1].sharpness;

          // Move midpoint away from extreme ends of range to avoid
          // degenerate math
          if (midpoint < 0.00001) {
            midpoint = 0.00001;
          }

          if (midpoint > 0.99999) {
            midpoint = 0.99999;
          }
        }
      }

      // Are we at the end? If so, just use the last value
      if (idx >= numNodes) {
        table[tidx] = model.clamping ? lastValue : 0.0;
      } else if (idx === 0) {
        // Are we before the first node? If so, duplicate this nodes values
        table[tidx] = model.clamping ? model.nodes[0].y : 0.0;
      } else {
        // Otherwise, we are between two nodes - interpolate
        // Our first attempt at a normalized location [0,1] -
        // we will be modifying this based on midpoint and
        // sharpness to get the curve shape we want and to have
        // it pass through (y1+y2)/2 at the midpoint.
        let s = (x - x1) / (x2 - x1);

        // Readjust based on the midpoint - linear adjustment
        if (s < midpoint) {
          s = (0.5 * s) / midpoint;
        } else {
          s = 0.5 + (0.5 * (s - midpoint)) / (1.0 - midpoint);
        }

        // override for sharpness > 0.99
        // In this case we just want piecewise constant
        if (sharpness > 0.99) {
          // Use the first value since we are below the midpoint
          if (s < 0.5) {
            table[tidx] = y1;
            continue;
          } else {
            // Use the second value at or above the midpoint
            table[tidx] = y2;
            continue;
          }
        }

        // Override for sharpness < 0.01
        // In this case we want piecewise linear
        if (sharpness < 0.01) {
          // Simple linear interpolation
          table[tidx] = (1 - s) * y1 + s * y2;
          continue;
        }

        // We have a sharpness between [0.01, 0.99] - we will
        // used a modified hermite curve interpolation where we
        // derive the slope based on the sharpness, and we compress
        // the curve non-linearly based on the sharpness

        // First, we will adjust our position based on sharpness in
        // order to make the curve sharper (closer to piecewise constant)
        if (s < 0.5) {
          s = 0.5 * (s * 2) ** (1.0 + 10 * sharpness);
        } else if (s > 0.5) {
          s = 1.0 - 0.5 * ((1.0 - s) * 2) ** (1 + 10 * sharpness);
        }

        // Compute some coefficients we will need for the hermite curve
        const ss = s * s;
        const sss = ss * s;

        const h1 = 2 * sss - 3 * ss + 1;
        const h2 = -2 * sss + 3 * ss;
        const h3 = sss - 2 * ss + s;
        const h4 = sss - ss;

        // Use one slope for both end points
        const slope = y2 - y1;
        const t = (1.0 - sharpness) * slope;

        // Compute the value
        table[tidx] = h1 * y1 + h2 * y2 + h3 * t + h4 * t;

        // Final error check to make sure we don't go outside
        // the Y range
        const min = y1 < y2 ? y1 : y2;
        const max = y1 > y2 ? y1 : y2;

        table[tidx] = table[tidx] < min ? min : table[tidx];
        table[tidx] = table[tidx] > max ? max : table[tidx];
      }
    }
  };
}
/* eslint-enable prefer-destructuring */
/* eslint-enable no-continue */

// ----------------------------------------------------------------------------
// Object factory
// ----------------------------------------------------------------------------

const DEFAULT_VALUES = {
  // model.function = NULL;
  range: [0, 0],
  clamping: true,
  allowDuplicateScalars: false,
};

// ----------------------------------------------------------------------------

export function extend(publicAPI, model, initialValues = {}) {
  Object.assign(model, DEFAULT_VALUES, initialValues);

  // Inheritance
  macro.obj(publicAPI, model);

  // Internal objects initialization
  model.nodes = [];

  // Create get-set macros
  macro.setGet(publicAPI, model, ['allowDuplicateScalars', 'clamping']);

  macro.setArray(publicAPI, model, ['range'], 2);

  // Create get macros for array
  macro.getArray(publicAPI, model, ['range']);

  // For more macro methods, see "Sources/macros.js"

  // Object specific methods
  vtkPiecewiseFunction(publicAPI, model);
}

// ----------------------------------------------------------------------------

export const newInstance = macro.newInstance(extend, 'vtkPiecewiseFunction');

// ----------------------------------------------------------------------------

export default { newInstance, extend };
