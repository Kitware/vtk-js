import * as macro from '../../../macro';
import { VECTOR_MODE } from './Constants';  // { ENUM_1: 0, ENUM_2: 1, ... }
import { VTK_COLOR_MODE } from '../../../Rendering/Core/Mapper/Constants';
import { VTK_DATATYPES } from '../DataArray/Constants';
import vtkDataArray from '../DataArray';

// ----------------------------------------------------------------------------
// Global methods
// ----------------------------------------------------------------------------

/* global window */

// Add module-level functions or api that you want to expose statically via
// the next section...

// ----------------------------------------------------------------------------
// Static API
// ----------------------------------------------------------------------------

function intColorToUChar(c) { return c; }
function floatColorToUChar(c) { return Math.floor((c * 255.0) + 0.5); }

// ----------------------------------------------------------------------------
// vtkMyClass methods
// ----------------------------------------------------------------------------

function vtkScalarsToColors(publicAPI, model) {
  // Set our className
  model.classHierarchy.push('vtkScalarsToColors');

  // Description:
  // Internal methods that map a data array into a 4-component,
  // unsigned char RGBA array. The color mode determines the behavior
  // of mapping. If VTK_COLOR_MODE_DEFAULT is set, then unsigned char
  // data arrays are treated as colors (and converted to RGBA if
  // necessary); If VTK_COLOR_MODE_DIRECT_SCALARS is set, then all arrays
  // are treated as colors (integer types are clamped in the range 0-255,
  // floating point arrays are clamped in the range 0.0-1.0. Note 'char' does
  // not have enough values to represent a color so mapping this type is
  // considered an error);
  // otherwise, the data is mapped through this instance
  // of ScalarsToColors. The component argument is used for data
  // arrays with more than one component; it indicates which component
  // to use to do the blending.  When the component argument is -1,
  // then the this object uses its own selected technique to change a
  // vector into a scalar to map.
  publicAPI.mapScalars = (scalars, colorMode, componentIn) => {
    const numberOfComponents = scalars.getNumberOfComponents();

    let newColors = null;

    // map scalars through lookup table only if needed
    if ((colorMode === VTK_COLOR_MODE.DEFAULT &&
         scalars.getDataType() === VTK_DATATYPES.UNSIGNED_CHAR) ||
        (colorMode === VTK_COLOR_MODE.DIRECT_SCALARS && scalars)) {
      newColors = publicAPI.convertToRGBA(scalars, numberOfComponents,
                        scalars.getNumberOfTuples());
    } else {
      const newscalars = {
        type: 'vtkDataArray',
        name: 'temp',
        tuple: 4,
        dataType: 'Uint8ClampedArray',
      };

      const s = new window[newscalars.dataType](4 * scalars.getNumberOfTuples());
      for (let i = 0; i < s.length; i++) {
        s[i] = Math.random();
      }
      newscalars.values = s;
      newscalars.size = s.length;
      newColors = vtkDataArray.newInstance(newscalars);

      // let component = componentIn;

      // // If mapper did not specify a component, use the VectorMode
      // if (component < 0 && numberOfComponents > 1) {
      //   publicAPI.mapVectorsThroughTable(scalars,
      //                                newColors,
      //                                VTK_RGBA);
      // } else {
      //   if (component < 0) {
      //     component = 0;
      //   }
      //   if (component >= numberOfComponents) {
      //     component = numberOfComponents - 1;
      //   }

      // Map the scalars to colors
      publicAPI.mapScalarsThroughTable(scalars, newColors, 'VTK_RGBA');
      // }
    }

    return newColors;
  };

  publicAPI.luminanceToRGBA = (newColors, colors, alpha, convtFun) => {
    const a = convtFun(alpha);

    const values = colors.getData();
    const size = values.length;
    const component = 0;
    const tuple = 1;

    let count = 0;
    for (let i = component; i < size; i += tuple) {
      const l = convtFun(values[i]);
      newColors[(count * 4)] = l;
      newColors[(count * 4) + 1] = l;
      newColors[(count * 4) + 2] = l;
      newColors[(count * 4) + 3] = a;
      count++;
    }
  };

  publicAPI.luminanceAlphaToRGBA = (newColors, colors, alpha, convtFun) => {
    const values = colors.getData();
    const size = values.length;
    const component = 0;
    const tuple = 2;

    let count = 0;
    for (let i = component; i < size; i += tuple) {
      const l = convtFun(values[i]);
      newColors[count] = l;
      newColors[count + 1] = l;
      newColors[count + 2] = l;
      newColors[count + 3] = convtFun(values[i + 1]);
      count += 4;
    }
  };

  publicAPI.rGBToRGBA = (newColors, colors, alpha, convtFun) => {
    const a = convtFun(alpha);

    const values = colors.getData();
    const size = values.length;
    const component = 0;
    const tuple = 3;

    let count = 0;
    for (let i = component; i < size; i += tuple) {
      newColors[(count * 4)] = convtFun(values[i]);
      newColors[(count * 4) + 1] = convtFun(values[i + 1]);
      newColors[(count * 4) + 2] = convtFun(values[i + 2]);
      newColors[(count * 4) + 3] = a;
      count++;
    }
  };

  publicAPI.rGBAToRGBA = (newColors, colors, alpha, convtFun) => {
    const values = colors.getData();
    const size = values.length;
    const component = 0;
    const tuple = 4;

    let count = 0;
    for (let i = component; i < size; i += tuple) {
      newColors[(count * 4)] = convtFun(values[i]);
      newColors[(count * 4) + 1] = convtFun(values[i + 1]);
      newColors[(count * 4) + 2] = convtFun(values[i + 2]);
      newColors[(count * 4) + 3] = convtFun(values[i + 3]) * alpha;
      count++;
    }
  };

  //----------------------------------------------------------------------------
  publicAPI.convertToRGBA = (colors, numComp, numTuples) => {
    if (numComp === 4 && model.alpha >= 1.0 &&
        colors.getDataType() === VTK_DATATYPES.UNSIGNED_CHAR) {
      return colors;
    }

    const newColors = vtkDataArray.newInstance({ dataType: VTK_DATATYPES.UNSIGNED_CHAR });
    newColors.setNumberOfComponents(4);
    newColors.setNumberOfTuples(numTuples);

    if (numTuples <= 0) {
      return newColors;
    }

    let alpha = model.alpha;
    alpha = (alpha > 0 ? alpha : 0);
    alpha = (alpha < 1 ? alpha : 1);

    let convtFun = intColorToUChar;
    if ((colors.getDataType() === VTK_DATATYPES.FLOAT) ||
      colors.getDataType() === VTK_DATATYPES.DOUBLE) {
      convtFun = floatColorToUChar;
    }

    switch (numComp) {
      case 1:
        publicAPI.luminanceToRGBA(newColors, colors, alpha, convtFun);
        break;

      case 2:
        publicAPI.luminanceAlphaToRGBA(newColors, colors, convtFun);
        break;

      case 3:
        publicAPI.rGBToRGBA(newColors, colors, alpha, convtFun);
        break;

      case 4:
        publicAPI.rGBAToRGBA(newColors, colors, alpha, convtFun);
        break;

      default:
        vtkErrorMacro('Cannot convert colors');
        return null;
    }

    return newColors;
  };

  publicAPI.setRange = (min, max) => publicAPI.setInputRange(min, max);
}

// ----------------------------------------------------------------------------
// Object factory
// ----------------------------------------------------------------------------

const DEFAULT_VALUES = {
  alpha: 1.0,
  vectorComponent: 0,
  vectorSize: -1,
  vectorMode: VECTOR_MODE.COMPONENT,
  inputRange: [0, 255],
};

// ----------------------------------------------------------------------------

export function extend(publicAPI, model, initialValues = {}) {
  Object.assign(model, DEFAULT_VALUES, initialValues);

  // Internal objects initialization
  // model.myProp2 = new Thing() || {};

  // Object methods
  macro.obj(publicAPI, model);

  // Create get-only macros
  // macro.get(publicAPI, model, ['myProp2', 'myProp4']);

  // Create get-set macros
  macro.setGet(publicAPI, model, [
    'vectorComponent',
    'alpha',
  ]);

  // Create get-set macros for enum type
  // macro.setGet(publicAPI, model, [
  //   { name: 'vectorMode', enum: VECTOR_MODE, type: 'enum' },
  // ]);

  // For more macro methods, see "Sources/macro.js"

  // Object specific methods
  vtkScalarsToColors(publicAPI, model);
}

// ----------------------------------------------------------------------------

export const newInstance = macro.newInstance(extend);

// ----------------------------------------------------------------------------

export default Object.assign({ newInstance, extend });
