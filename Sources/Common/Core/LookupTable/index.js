import macro from 'vtk.js/Sources/macro';
import vtkMath from 'vtk.js/Sources/Common/Core/Math';
import vtkScalarsToColors from 'vtk.js/Sources/Common/Core/ScalarsToColors';
import { ScalarMappingTarget } from 'vtk.js/Sources/Common/Core/ScalarsToColors/Constants';

// ----------------------------------------------------------------------------
// Global methods
// ----------------------------------------------------------------------------

// Add module-level functions or api that you want to expose statically via
// the next section...

// ----------------------------------------------------------------------------
// Static API
// ----------------------------------------------------------------------------

const BELOW_RANGE_COLOR_INDEX = 0;
const ABOVE_RANGE_COLOR_INDEX = 1;
const NAN_COLOR_INDEX = 2;

// ----------------------------------------------------------------------------
// vtkMyClass methods
// ----------------------------------------------------------------------------

function vtkLookupTable(publicAPI, model) {
  // Set our className
  model.classHierarchy.push('vtkLookupTable');

  //----------------------------------------------------------------------------
  // Description:
  // Return true if all of the values defining the mapping have an opacity
  // equal to 1. Default implementation return true.
  publicAPI.isOpaque = () => {
    if (model.opaqueFlagBuildTime.getMTime() < publicAPI.getMTime()) {
      let opaque = true;
      if (model.nanColor[3] < 1.0) {
        opaque = 0;
      }
      if (model.useBelowRangeColor && model.belowRangeColor[3] < 1.0) {
        opaque = 0;
      }
      if (model.useAboveRangeColor && model.aboveRangeColor[3] < 1.0) {
        opaque = 0;
      }
      for (let i = 3; i < model.table.length && opaque; i += 4) {
        if (model.table[i] < 255) {
          opaque = false;
        }
      }
      model.opaqueFlag = opaque;
      model.opaqueFlagBuildTime.modified();
    }

    return model.opaqueFlag;
  };

  publicAPI.usingLogScale = () => false;

  //----------------------------------------------------------------------------
  publicAPI.getNumberOfAvailableColors = () => model.table.length;

  //----------------------------------------------------------------------------
  // Apply shift/scale to the scalar value v and return the index.
  publicAPI.linearIndexLookup = (v, p) => {
    let dIndex = 0;

    if (v < p.range[0]) {
      dIndex = p.maxIndex + BELOW_RANGE_COLOR_INDEX + 1.5;
    } else if (v > p.range[1]) {
      dIndex = p.maxIndex + ABOVE_RANGE_COLOR_INDEX + 1.5;
    } else {
      dIndex = (v + p.shift) * p.scale;

      // This conditional is needed because when v is very close to
      // p.Range[1], it may map above p.MaxIndex in the linear mapping
      // above.
      dIndex = dIndex < p.maxIndex ? dIndex : p.maxIndex;
    }

    return Math.floor(dIndex);
  };

  publicAPI.linearLookup = (v, table, p) => {
    let index = 0;
    if (vtkMath.isNan(v)) {
      index = Math.floor(p.maxIndex + 1.5 + NAN_COLOR_INDEX);
    } else {
      index = publicAPI.linearIndexLookup(v, p);
    }
    return [
      table[4 * index],
      table[4 * index + 1],
      table[4 * index + 2],
      table[4 * index + 3],
    ];
  };

  publicAPI.indexedLookupFunction = (v, table, p) => {
    const index = publicAPI.getAnnotatedValueIndexInternal(v);
    return [
      table[4 * index],
      table[4 * index + 1],
      table[4 * index + 2],
      table[4 * index + 3],
    ];
  };

  //----------------------------------------------------------------------------
  publicAPI.lookupShiftAndScale = (range, p) => {
    p.shift = -range[0];
    p.scale = Number.MAX_VALUE;
    if (range[1] > range[0]) {
      p.scale = (p.maxIndex + 1) / (range[1] - range[0]);
    }
  };

  // Public API methods
  publicAPI.mapScalarsThroughTable = (
    input,
    output,
    outFormat,
    inputOffset
  ) => {
    let lookupFunc = publicAPI.linearLookup;
    if (model.indexedLookup) {
      lookupFunc = publicAPI.indexedLookupFunction;
    }

    const trange = publicAPI.getMappingRange();

    const p = {
      maxIndex: publicAPI.getNumberOfColors() - 1,
      range: trange,
      shift: 0.0,
      scale: 0.0,
    };
    publicAPI.lookupShiftAndScale(trange, p);

    const alpha = publicAPI.getAlpha();
    const length = input.getNumberOfTuples();
    const inIncr = input.getNumberOfComponents();

    const outputV = output.getData();
    const inputV = input.getData();

    if (alpha >= 1.0) {
      if (outFormat === ScalarMappingTarget.RGBA) {
        for (let i = 0; i < length; i++) {
          const cptr = lookupFunc(
            inputV[i * inIncr + inputOffset],
            model.table,
            p
          );
          outputV[i * 4] = cptr[0];
          outputV[i * 4 + 1] = cptr[1];
          outputV[i * 4 + 2] = cptr[2];
          outputV[i * 4 + 3] = cptr[3];
        }
      }
    } else {
      /* eslint-disable no-lonely-if */
      if (outFormat === ScalarMappingTarget.RGBA) {
        for (let i = 0; i < length; i++) {
          const cptr = lookupFunc(
            inputV[i * inIncr + inputOffset],
            model.table,
            p
          );
          outputV[i * 4] = cptr[0];
          outputV[i * 4 + 1] = cptr[1];
          outputV[i * 4 + 2] = cptr[2];
          outputV[i * 4 + 3] = Math.floor(cptr[3] * alpha + 0.5);
        }
      }
    } // alpha blending
  };

  publicAPI.forceBuild = () => {
    let hinc = 0.0;
    let sinc = 0.0;
    let vinc = 0.0;
    let ainc = 0.0;

    const maxIndex = model.numberOfColors - 1;

    if (maxIndex) {
      hinc = (model.hueRange[1] - model.hueRange[0]) / maxIndex;
      sinc = (model.saturationRange[1] - model.saturationRange[0]) / maxIndex;
      vinc = (model.valueRange[1] - model.valueRange[0]) / maxIndex;
      ainc = (model.alphaRange[1] - model.alphaRange[0]) / maxIndex;
    }

    const hsv = [];
    const rgba = [];
    for (let i = 0; i <= maxIndex; i++) {
      hsv[0] = model.hueRange[0] + i * hinc;
      hsv[1] = model.saturationRange[0] + i * sinc;
      hsv[2] = model.valueRange[0] + i * vinc;

      vtkMath.hsv2rgb(hsv, rgba);
      rgba[3] = model.alphaRange[0] + i * ainc;

      //  case VTK_RAMP_LINEAR:
      model.table[i * 4] = rgba[0] * 255.0 + 0.5;
      model.table[i * 4 + 1] = rgba[1] * 255.0 + 0.5;
      model.table[i * 4 + 2] = rgba[2] * 255.0 + 0.5;
      model.table[i * 4 + 3] = rgba[3] * 255.0 + 0.5;
    }

    publicAPI.buildSpecialColors();

    model.buildTime.modified();
  };

  publicAPI.buildSpecialColors = () => {
    // Add "special" colors (NaN, below range, above range) to table here.
    const { numberOfColors } = model;

    const tptr = model.table;
    let base = (model.numberOfColors + BELOW_RANGE_COLOR_INDEX) * 4;

    // Below range color
    if (model.useBelowRangeColor || numberOfColors === 0) {
      tptr[base] = model.belowRangeColor[0] * 255.0 + 0.5;
      tptr[base + 1] = model.belowRangeColor[1] * 255.0 + 0.5;
      tptr[base + 2] = model.belowRangeColor[2] * 255.0 + 0.5;
      tptr[base + 3] = model.belowRangeColor[3] * 255.0 + 0.5;
    } else {
      // Duplicate the first color in the table.
      tptr[base] = tptr[0];
      tptr[base + 1] = tptr[1];
      tptr[base + 2] = tptr[2];
      tptr[base + 3] = tptr[3];
    }

    // Above range color
    base = (model.numberOfColors + ABOVE_RANGE_COLOR_INDEX) * 4;
    if (model.useAboveRangeColor || numberOfColors === 0) {
      tptr[base] = model.aboveRangeColor[0] * 255.0 + 0.5;
      tptr[base + 1] = model.aboveRangeColor[1] * 255.0 + 0.5;
      tptr[base + 2] = model.aboveRangeColor[2] * 255.0 + 0.5;
      tptr[base + 3] = model.aboveRangeColor[3] * 255.0 + 0.5;
    } else {
      // Duplicate the last color in the table.
      tptr[base] = tptr[4 * (numberOfColors - 1) + 0];
      tptr[base + 1] = tptr[4 * (numberOfColors - 1) + 1];
      tptr[base + 2] = tptr[4 * (numberOfColors - 1) + 2];
      tptr[base + 3] = tptr[4 * (numberOfColors - 1) + 3];
    }

    // Always use NanColor
    base = (model.numberOfColors + NAN_COLOR_INDEX) * 4;
    tptr[base] = model.nanColor[0] * 255.0 + 0.5;
    tptr[base + 1] = model.nanColor[1] * 255.0 + 0.5;
    tptr[base + 2] = model.nanColor[2] * 255.0 + 0.5;
    tptr[base + 3] = model.nanColor[3] * 255.0 + 0.5;
  };

  publicAPI.build = () => {
    if (
      model.table.length < 1 ||
      publicAPI.getMTime() > model.buildTime.getMTime()
    ) {
      publicAPI.forceBuild();
    }
  };
}

// ----------------------------------------------------------------------------
// Object factory
// ----------------------------------------------------------------------------

const DEFAULT_VALUES = {
  numberOfColors: 256,
  // table: null,

  hueRange: [0.0, 0.66667],
  saturationRange: [1.0, 1.0],
  valueRange: [1.0, 1.0],
  alphaRange: [1.0, 1.0],

  nanColor: [0.5, 0.0, 0.0, 1.0],
  belowRangeColor: [0.0, 0.0, 0.0, 1.0],
  aboveRangeColor: [1.0, 1.0, 1.0, 1.0],
  useAboveRangeColor: false,
  useBelowRangeColor: false,

  alpha: 1.0,
  // buildTime: null,
  // opaqueFlagBuildTime: null,
};

// ----------------------------------------------------------------------------

export function extend(publicAPI, model, initialValues = {}) {
  Object.assign(model, DEFAULT_VALUES, initialValues);

  // Inheritance
  vtkScalarsToColors.extend(publicAPI, model, initialValues);

  // Internal objects initialization
  if (!model.table) {
    model.table = [];
  }

  model.buildTime = {};
  macro.obj(model.buildTime);

  model.opaqueFlagBuildTime = {};
  macro.obj(model.opaqueFlagBuildTime, { mtime: 0 });

  // Create get-only macros
  macro.get(publicAPI, model, ['buildTime']);

  // Create get-set macros
  macro.setGet(publicAPI, model, [
    'numberOfColors',
    'useAboveRangeColor',
    'useBelowRangeColor',
  ]);

  // Create set macros for array (needs to know size)
  macro.setArray(
    publicAPI,
    model,
    ['alphaRange', 'hueRange', 'saturationRange', 'valueRange'],
    2
  );

  macro.setArray(
    publicAPI,
    model,
    ['nanColor', 'belowRangeColor', 'aboveRangeColor'],
    4
  );

  // Create get macros for array
  macro.getArray(publicAPI, model, [
    'hueRange',
    'saturationRange',
    'valueRange',
    'alphaRange',
    'nanColor',
    'belowRangeColor',
    'aboveRangeColor',
  ]);

  // For more macro methods, see "Sources/macro.js"

  // Object specific methods
  vtkLookupTable(publicAPI, model);
}

// ----------------------------------------------------------------------------

export const newInstance = macro.newInstance(extend, 'vtkLookupTable');

// ----------------------------------------------------------------------------

export default Object.assign({ newInstance, extend });
