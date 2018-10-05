import macro from 'vtk.js/Sources/macro';

// ----------------------------------------------------------------------------
// Global methods
// ----------------------------------------------------------------------------

// ----------------------------------------------------------------------------
// vtkImagePointDataIterator methods
// ----------------------------------------------------------------------------

function vtkImagePointDataIterator(publicAPI, model) {
  // Set our className
  model.classHierarchy.push('vtkImagePointDataIterator');

  publicAPI.initialize = (image, inExtent, stencil, algorithm) => {
    const dataExtent = image.getExtent();
    let extent = inExtent;
    if (extent == null) {
      extent = dataExtent;
    }
    let emptyExtent = false;
    for (let i = 0; i < 6; i += 2) {
      model.extent[i] = Math.max(extent[i], dataExtent[i]);
      model.extent[i + 1] = Math.min(extent[i + 1], dataExtent[i + 1]);
      if (model.extent[i] > model.extent[i + 1]) {
        emptyExtent = true;
      }
    }
    model.rowIncrement = dataExtent[1] - dataExtent[0] + 1;
    model.sliceIncrement =
      model.rowIncrement * (dataExtent[3] - dataExtent[2] + 1);

    let rowSpan;
    let sliceSpan;
    let volumeSpan;

    if (!emptyExtent) {
      // Compute the span of the image region to be covered.
      rowSpan = model.extent[1] - model.extent[0] + 1;
      sliceSpan = model.extent[3] - model.extent[2] + 1;
      volumeSpan = model.extent[5] - model.extent[4] + 1;
      model.id =
        model.extent[0] -
        dataExtent[0] +
        (model.extent[2] - dataExtent[2]) * model.rowIncrement +
        (model.extent[4] - dataExtent[4]) * model.sliceIncrement;

      // Compute the end increments (continous increments).
      model.rowEndIncrement = model.rowIncrement - rowSpan;
      model.sliceEndIncrement =
        model.rowEndIncrement +
        model.sliceIncrement -
        model.rowIncrement * sliceSpan;
    } else {
      // Extent is empty, isAtEnd() will immediately return "true"
      rowSpan = 0;
      sliceSpan = 0;
      volumeSpan = 0;
      model.id = 0;
      model.rowEndIncrement = 0;
      model.sliceEndIncrement = 0;
      for (let i = 0; i < 6; i += 2) {
        model.extent[i] = dataExtent[i];
        model.extent[i + 1] = dataExtent[i] - 1;
      }
    }

    // Get the end pointers for row, slice, and volume.
    model.spanEnd = model.id + rowSpan;
    model.rowEnd = model.id + rowSpan;
    model.sliceEnd =
      model.id + (model.rowIncrement * sliceSpan - model.rowEndIncrement);
    model.end =
      model.id + (model.sliceIncrement * volumeSpan - model.sliceEndIncrement);

    // For keeping track of the current x,y,z index.
    model.index[0] = model.extent[0];
    model.index[1] = model.extent[2];
    model.index[2] = model.extent[4];

    // For resetting the Y index after each slice.
    model.startY = model.index[1];

    // Code for when a stencil is provided.
    if (stencil) {
      model.hasStencil = true;
      model.inStencil = false;

      model.spanIndex = 0;
      const stencilExtent = stencil.getExtent();

      // The stencil has a YZ array of span lists, we need increments
      // to get to the next Z position in the YZ array.
      model.spanSliceIncrement = 0;
      model.spanSliceEndIncrement = 0;

      if (
        stencilExtent[3] >= stencilExtent[2] &&
        stencilExtent[5] >= stencilExtent[4]
      ) {
        model.spanSliceIncrement = stencilExtent[3] - stencilExtent[2] + 1;
        const botOffset = model.extent[2] - stencilExtent[2];
        if (botOffset >= 0) {
          model.spanSliceEndIncrement += botOffset;
        }
        const topOffset = stencilExtent[3] - model.extent[3];
        if (topOffset >= 0) {
          model.spanSliceEndIncrement += topOffset;
        }
      }

      // Find the offset to the start position within the YZ array.
      let startOffset = 0;

      const yOffset = model.extent[2] - stencilExtent[2];
      if (yOffset < 0) {
        model.extent[2] = stencilExtent[2];
        // starting before start of stencil: subtract the increment that
        // will be added in NextSpan() upon entry into stencil extent
        startOffset -= 1;
      } else {
        // starting partway into the stencil, so add an offset
        startOffset += yOffset;
      }

      if (stencilExtent[3] <= model.extent[3]) {
        model.extent[3] = stencilExtent[3];
      }

      const zOffset = model.extent[4] - stencilExtent[4];
      if (zOffset < 0) {
        model.extent[4] = stencilExtent[4];
        // starting before start of stencil: subtract the increment that
        // will be added in NextSpan() upon entry into stencil extent
        if (yOffset >= 0) {
          startOffset -= 1 + model.spanSliceEndIncrement;
        }
      } else {
        // starting partway into the stencil, so add an offset
        startOffset += zOffset * model.spanSliceIncrement;
      }

      if (stencilExtent[5] <= model.extent[5]) {
        model.extent[5] = stencilExtent[5];
      }

      if (
        model.extent[2] <= model.extent[3] &&
        model.extent[4] <= model.extent[5]
      ) {
        model.spanCountPointer = stencil.extentListLengths.subarray(
          startOffset
        );

        model.spanListPointer = stencil.extentLists.subarray(startOffset);

        // Get the current position within the span list for the current row
        if (yOffset >= 0 && zOffset >= 0) {
          // If starting within stencil extent, check stencil immediately
          model.inStencil = true;
          model.setSpanState(model.extent[0]);
        }
      } else {
        model.spanCountPointer = null;
        model.spanListPointer = null;
        model.inStencil = false;
      }
    } else {
      model.hasStencil = false;
      model.inStencil = true;
      model.spanSliceEndIncrement = 0;
      model.spanSliceIncrement = 0;
      model.spanIndex = 0;
      model.spanCountPointer = null;
      model.spanListPointer = null;
    }

    if (algorithm) {
      model.algorithm = algorithm;
      const maxCount = sliceSpan * volumeSpan;
      model.target = maxCount / 50 + 1;
      model.count =
        model.target * 50 - (maxCount / model.target) * model.target + 1;
    } else {
      model.algorithm = null;
      model.target = 0;
      model.count = 0;
    }
  };

  publicAPI.setSpanState = (idX) => {
    // Find the span that includes idX
    let inStencil = false;
    const spans = model.spanListPointer;
    const n = model.spanCountPointer[0];
    let i;
    for (i = 0; i < n; ++i) {
      if (spans[i] > idX) {
        break;
      }
      inStencil = !inStencil;
    }

    // Set the primary span state variables
    model.spanIndex = i;
    model.inStencil = inStencil;

    // Clamp the span end to MaxX+1
    let endIdX = model.extent[1] + 1;
    if (i < n && spans[i] <= model.extent[1]) {
      endIdX = spans[i];
    }

    // Compute the pointers for idX and endIdX
    const rowStart =
      model.rowEnd - (model.rowIncrement - model.rowEndIncrement);

    model.id = rowStart + (idX - model.extent[0]);
    model.spanEnd = rowStart + (endIdX - model.extent[0]);
  };

  publicAPI.nextSpan = () => {
    if (model.spanEnd === model.rowEnd) {
      let spanIncr = 1;

      if (model.spanEnd !== model.sliceEnd) {
        // Move to the next row
        model.id = model.rowEnd + model.rowEndIncrement;
        model.rowEnd += model.rowIncrement;
        model.spanEnd = model.rowEnd;
        model.index[1]++;
      } else if (model.spanEnd !== model.end) {
        // Move to the next slice
        model.id = model.sliceEnd + model.sliceEndIncrement;
        model.sliceEnd += model.sliceIncrement;
        model.rowEnd = model.id + (model.rowIncrement - model.rowEndIncrement);
        model.spanEnd = model.rowEnd;
        model.index[1] = model.startY;
        model.index[2]++;
        spanIncr += model.spanSliceEndIncrement;
      } else {
        // reached End
        model.id = model.end;
        return;
      }

      // Start of next row
      model.index[0] = model.extent[0];

      if (model.hasStencil) {
        if (
          model.index[1] >= model.extent[2] &&
          model.index[1] <= model.extent[3] &&
          model.index[2] >= model.extent[4] &&
          model.index[2] <= model.extent[5]
        ) {
          model.spanCountPointer = model.spanCountPointer.subarray(spanIncr);
          model.spanListPointer = model.spanListPointer.subarray(spanIncr);
          publicAPI.setSpanState(model.extent[0]);
        } else {
          model.inStencil = false;
        }
      }

      if (model.algorithm) {
        publicAPI.reportProgress();
      }
    } else {
      // Move to the next span in the current row
      model.id = model.spanEnd;
      const spanCount = model.spanCountPointer[0];
      let endIdX = model.extent[1] + 1;
      model.index[0] = endIdX;
      if (model.spanIndex < spanCount) {
        const tmpIdX = model.spanListPointer[model.spanIndex];
        if (tmpIdX < endIdX) {
          model.index[0] = tmpIdX;
        }
      }

      // Get the index to the start of the span after the next
      model.spanIndex++;
      if (model.spanIndex < spanCount) {
        const tmpIdX = model.spanListPointer[model.spanIndex];
        if (tmpIdX < endIdX) {
          endIdX = tmpIdX;
        }
      }

      // Compute the end of the span
      model.spanEnd =
        model.rowEnd -
        (model.rowIncrement - model.rowEndIncrement) +
        (endIdX - model.extent[0]);

      // Flip the state
      model.inStencil = !model.inStencil;
    }
  };

  publicAPI.isAtEnd = () => model.id === model.end;
  publicAPI.isInStencil = () => model.inStencil;
  publicAPI.spanEndId = () => model.spanEnd;

  publicAPI.reportProgress = () => {};

  publicAPI.getArray = (array, i) =>
    array.getData().subarray(i * array.getNumberOfComponents());

  publicAPI.getScalars = (image, i = 0) =>
    publicAPI.getArray(image.getPointData().getScalars(), i);
}

// ----------------------------------------------------------------------------
// Object factory
// ----------------------------------------------------------------------------

const DEFAULT_VALUES = {
  spanState: 0,
  extent: [0, -1, 0, -1, 0, -1],
  end: 0,
  spanEnd: 0,
  rowEnd: 0,
  sliceEnd: 0,
  rowIncrement: 0,
  rowEndIncrement: 0,
  sliceIncrement: 0,
  sliceEndIncrement: 0,
  id: 0,
  index: [0, 0, 0],
  startY: 0,
  hasStencil: false,
  inStencil: true,
  spanIndex: 0,
  spanSliceIncrement: 0,
  spanSliceEndIncrement: 0,
  spanCountPointer: null,
  spanListPointer: null,
  algorithm: null,
  target: 0,
  count: 0,
};

// ----------------------------------------------------------------------------

export function extend(publicAPI, model, initialValues = {}) {
  Object.assign(model, DEFAULT_VALUES, initialValues);

  // Object methods
  macro.obj(publicAPI, model);

  macro.get(publicAPI, model, ['id', 'index']);

  // Object specific methods
  vtkImagePointDataIterator(publicAPI, model);
}

// ----------------------------------------------------------------------------

export const newInstance = macro.newInstance(
  extend,
  'vtkImagePointDataIterator'
);

// ----------------------------------------------------------------------------

export default Object.assign({ newInstance, extend });
