import * as macro from '../../../macro';
import vtkScalarsToColors from '../ScalarsToColors';
import vtkMath from '../Math';

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
// const NUMBER_OF_SPECIAL_COLORS = ABOVE_RANGE_COLOR_INDEX + 1;

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
      // if (model.NanColor[3] < 1.0) { opaque = 0; }
      // if (this->UseBelowRangeColor && this->BelowRangeColor[3] < 1.0) { opaque = 0; }
      // if (this->UseAboveRangeColor && this->AboveRangeColor[3] < 1.0) { opaque = 0; }
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
      dIndex = (dIndex < p.maxIndex ? dIndex : p.maxIndex);
    }

    return Math.floor(dIndex);
  };

  publicAPI.linearLookup = (v, table, p) => {
    const index = publicAPI.linearIndexLookup(v, p);
    return [table[4 * index], table[4 * index + 1], table[4 * index + 2], table[4 * index + 3]];
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
  publicAPI.mapScalarsThroughTable = (input, output, outFormat) => {
    const trange = publicAPI.getTableRange();

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
      if (outFormat === 'VTK_RGBA') {
        for (let i = 0; i < length; i++) {
          const cptr = publicAPI.linearLookup(inputV[i * inIncr], model.table, p);
          outputV[i * 4] = cptr[0];
          outputV[i * 4 + 1] = cptr[1];
          outputV[i * 4 + 2] = cptr[2];
          outputV[i * 4 + 3] = cptr[3];
        }
      }
    } else {
      if (outFormat === 'VTK_RGBA') {
        for (let i = 0; i < length; i++) {
          const cptr = publicAPI.linearLookup(inputV[i * inIncr], model.table, p);
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
    // // Add "special" colors (NaN, below range, above range) to table here.
    // const numberOfColors = model.table.length;

    // // Below range color
    // if (publicAPI.getUseBelowRangeColor() || numberOfColors === 0) {
    //   vtkLookupTable::GetColorAsUnsignedChars(this->GetBelowRangeColor(), color);
    //   tptr[0] = color[0];
    //   tptr[1] = color[1];
    //   tptr[2] = color[2];
    //   tptr[3] = color[3];
    //   }
    // else
    //   {
    //   // Duplicate the first color in the table.
    //   tptr[0] = table[0];
    //   tptr[1] = table[1];
    //   tptr[2] = table[2];
    //   tptr[3] = table[3];
    //   }

    // // Above range color
    // tptr = table + 4*(numberOfColors + vtkLookupTable::ABOVE_RANGE_COLOR_INDEX);
    // if (this->GetUseAboveRangeColor() || numberOfColors == 0)
    //   {
    //   vtkLookupTable::GetColorAsUnsignedChars(this->GetAboveRangeColor(), color);
    //   tptr[0] = color[0];
    //   tptr[1] = color[1];
    //   tptr[2] = color[2];
    //   tptr[3] = color[3];
    //   }
    // else
    //   {
    //   // Duplicate the last color in the table.
    //   tptr[0] = table[4*(numberOfColors-1) + 0];
    //   tptr[1] = table[4*(numberOfColors-1) + 1];
    //   tptr[2] = table[4*(numberOfColors-1) + 2];
    //   tptr[3] = table[4*(numberOfColors-1) + 3];
    //   }

    // // Always use NanColor
    // vtkLookupTable::GetColorAsUnsignedChars(this->GetNanColor(), color);
    // tptr = table + 4*(numberOfColors + vtkLookupTable::NAN_COLOR_INDEX);
    // tptr[0] = color[0];
    // tptr[1] = color[1];
    // tptr[2] = color[2];
    // tptr[3] = color[3];
  };

  publicAPI.build = () => {
    if (model.table.length < 1 ||
        publicAPI.getMTime() > model.buildTime.getMTime()) {
      publicAPI.forceBuild();
    }
  };
}

// ----------------------------------------------------------------------------
// Object factory
// ----------------------------------------------------------------------------

const DEFAULT_VALUES = {
  numberOfColors: 256,
  table: null,

  hueRange: [0.0, 0.66667],
  saturationRange: [1.0, 1.0],
  valueRange: [1.0, 1.0],
  alphaRange: [1.0, 1.0],
  tableRange: [0.0, 1.0],

  alpha: 1.0,
  buildTime: null,
  opaqueFlagBuildTime: null,
};

// ----------------------------------------------------------------------------

export function extend(publicAPI, model, initialValues = {}) {
  Object.assign(model, DEFAULT_VALUES, initialValues);


  // Inheritance
  vtkScalarsToColors.extend(publicAPI, model);

  // Internal objects initialization
  model.table = [];

  model.buildTime = {};
  macro.obj(model.buildTime);
  model.opaqueFlagBuildTime = {};
  macro.obj(model.opaqueFlagBuildTime);

  // Object methods
  macro.obj(publicAPI, model);

  // Create get-only macros
  macro.get(publicAPI, model, [
    'buildTime',
  ]);

  // Create get-set macros
  macro.setGet(publicAPI, model, [
    'numberOfColors',
  ]);

  // Create set macros for array (needs to know size)
  macro.setArray(publicAPI, model, [
    'alphaRange',
    'hueRange',
    'saturationRange',
    'valueRange',
    'tableRange',
  ], 2);

  // Create get macros for array
  macro.getArray(publicAPI, model, [
    'hueRange',
    'saturationRange',
    'valueRange',
    'tableRange',
    'alphaRange',
  ]);

  // For more macro methods, see "Sources/macro.js"

  // Object specific methods
  vtkLookupTable(publicAPI, model);
}

// ----------------------------------------------------------------------------

export const newInstance = macro.newInstance(extend);

// ----------------------------------------------------------------------------

export default Object.assign({ newInstance, extend });
