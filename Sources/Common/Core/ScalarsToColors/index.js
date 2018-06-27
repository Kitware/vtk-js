import macro from 'vtk.js/Sources/macro';
import vtkDataArray from 'vtk.js/Sources/Common/Core/DataArray';
import Constants from 'vtk.js/Sources/Common/Core/ScalarsToColors/Constants';
import vtkMapper from 'vtk.js/Sources/Rendering/Core/Mapper/Constants'; // Need to go inside Constants otherwise dependency loop

const { ScalarMappingTarget, VectorMode } = Constants;
const { VtkDataTypes } = vtkDataArray;
const { ColorMode } = vtkMapper;
const { vtkErrorMacro } = macro;

// ----------------------------------------------------------------------------
// Global methods
// ----------------------------------------------------------------------------

// Add module-level functions or api that you want to expose statically via
// the next section...

// ----------------------------------------------------------------------------
// Static API
// ----------------------------------------------------------------------------

function intColorToUChar(c) {
  return c;
}
function floatColorToUChar(c) {
  return Math.floor(c * 255.0 + 0.5);
}

// ----------------------------------------------------------------------------
// vtkScalarsToColors methods
// ----------------------------------------------------------------------------

function vtkScalarsToColors(publicAPI, model) {
  // Set our className
  model.classHierarchy.push('vtkScalarsToColors');

  publicAPI.setVectorModeToMagnitude = () =>
    publicAPI.setVectorMode(VectorMode.MAGNITUDE);
  publicAPI.setVectorModeToComponent = () =>
    publicAPI.setVectorMode(VectorMode.COMPONENT);
  publicAPI.setVectorModeToRGBColors = () =>
    publicAPI.setVectorMode(VectorMode.RGBCOLORS);

  publicAPI.build = () => {};

  publicAPI.isOpaque = () => true;

  //----------------------------------------------------------------------------
  publicAPI.setAnnotations = (values, annotations) => {
    if ((values && !annotations) || (!values && annotations)) {
      return;
    }

    if (
      values &&
      annotations &&
      values.getNumberOfTuples() !== annotations.getNumberOfTuples()
    ) {
      vtkErrorMacro(
        'Values and annotations do not have the same number of tuples so ignoring'
      );
      return;
    }

    model.annotationArray = [];

    if (annotations && values) {
      const num = annotations.getNumberOfTuples();
      for (let i = 0; i < num; i++) {
        model.annotationArray.push({
          value: values[i],
          annotation: annotations[i],
        });
      }
    }

    publicAPI.updateAnnotatedValueMap();
    publicAPI.modified();
  };

  //----------------------------------------------------------------------------
  publicAPI.setAnnotation = (value, annotation) => {
    let i = publicAPI.checkForAnnotatedValue(value);
    let modified = false;
    if (i >= 0) {
      if (model.annotationArray[i].annotation !== annotation) {
        model.annotationArray[i].annotation = annotation;
        modified = true;
      }
    } else {
      model.annotationArray.push({ value, annotation });
      i = model.annotationArray.length - 1;
      modified = true;
    }
    if (modified) {
      publicAPI.updateAnnotatedValueMap();
      publicAPI.modified();
    }
    return i;
  };

  //----------------------------------------------------------------------------
  publicAPI.getNumberOfAnnotatedValues = () => model.annotationArray.length;

  //----------------------------------------------------------------------------
  publicAPI.getAnnotatedValue = (idx) => {
    if (idx < 0 || idx >= model.annotationArray.length) {
      return null;
    }
    return model.annotationArray[idx].value;
  };

  //----------------------------------------------------------------------------
  publicAPI.getAnnotation = (idx) => {
    if (model.annotationArray[idx] === undefined) {
      return null;
    }
    return model.annotationArray[idx].annotation;
  };

  //----------------------------------------------------------------------------
  publicAPI.getAnnotatedValueIndex = (val) =>
    model.annotationArray.length ? publicAPI.checkForAnnotatedValue(val) : -1;

  //----------------------------------------------------------------------------
  publicAPI.removeAnnotation = (value) => {
    const i = publicAPI.checkForAnnotatedValue(value);
    const needToRemove = i >= 0;
    if (needToRemove) {
      model.annotationArray.splice(i, 1);
      publicAPI.updateAnnotatedValueMap();
      publicAPI.modified();
    }
    return needToRemove;
  };

  //----------------------------------------------------------------------------
  publicAPI.resetAnnotations = () => {
    model.annotationArray = [];
    model.annotatedValueMap = [];
    publicAPI.modified();
  };

  //----------------------------------------------------------------------------
  publicAPI.getAnnotationColor = (val, rgba) => {
    if (model.indexedLookup) {
      const i = publicAPI.getAnnotatedValueIndex(val);
      publicAPI.getIndexedColor(i, rgba);
    } else {
      publicAPI.getColor(parseFloat(val), rgba);
      rgba[3] = 1.0;
    }
  };

  //----------------------------------------------------------------------------
  publicAPI.checkForAnnotatedValue = (value) =>
    publicAPI.getAnnotatedValueIndexInternal(value);

  //----------------------------------------------------------------------------
  // An unsafe version of vtkScalarsToColors::CheckForAnnotatedValue for
  // internal use (no pointer checks performed)
  publicAPI.getAnnotatedValueIndexInternal = (value) => {
    if (model.annotatedValueMap[value] !== undefined) {
      const na = model.annotationArray.length;
      return model.annotatedValueMap[value] % na;
    }
    return -1;
  };

  //----------------------------------------------------------------------------
  publicAPI.getIndexedColor = (val, rgba) => {
    rgba[0] = 0.0;
    rgba[1] = 0.0;
    rgba[2] = 0.0;
    rgba[3] = 0.0;
  };

  //----------------------------------------------------------------------------
  publicAPI.updateAnnotatedValueMap = () => {
    model.annotatedValueMap = [];

    const na = model.annotationArray.length;
    for (let i = 0; i < na; ++i) {
      model.annotatedValueMap[model.annotationArray[i].value] = i;
    }
  };

  // Description:
  // Internal methods that map a data array into a 4-component,
  // unsigned char RGBA array. The color mode determines the behavior
  // of mapping. If ColorMode.DEFAULT is set, then unsigned char
  // data arrays are treated as colors (and converted to RGBA if
  // necessary); If ColorMode.DIRECT_SCALARS is set, then all arrays
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
    if (
      (colorMode === ColorMode.DEFAULT &&
        scalars.getDataType() === VtkDataTypes.UNSIGNED_CHAR) ||
      (colorMode === ColorMode.DIRECT_SCALARS && scalars)
    ) {
      newColors = publicAPI.convertToRGBA(
        scalars,
        numberOfComponents,
        scalars.getNumberOfTuples()
      );
    } else {
      const newscalars = {
        type: 'vtkDataArray',
        name: 'temp',
        numberOfComponents: 4,
        dataType: VtkDataTypes.UNSIGNED_CHAR,
      };

      const s = new window[newscalars.dataType](
        4 * scalars.getNumberOfTuples()
      );
      newscalars.values = s;
      newscalars.size = s.length;
      newColors = vtkDataArray.newInstance(newscalars);

      let component = componentIn;

      // If mapper did not specify a component, use the VectorMode
      if (component < 0 && numberOfComponents > 1) {
        publicAPI.mapVectorsThroughTable(
          scalars,
          newColors,
          ScalarMappingTarget.RGBA,
          -1,
          -1
        );
      } else {
        if (component < 0) {
          component = 0;
        }
        if (component >= numberOfComponents) {
          component = numberOfComponents - 1;
        }

        // Map the scalars to colors
        publicAPI.mapScalarsThroughTable(
          scalars,
          newColors,
          ScalarMappingTarget.RGBA,
          component
        );
      }
    }

    return newColors;
  };

  publicAPI.mapVectorsToMagnitude = (input, output, compsToUse) => {
    const length = input.getNumberOfTuples();
    const inIncr = input.getNumberOfComponents();

    const outputV = output.getData();
    const inputV = input.getData();

    for (let i = 0; i < length; i++) {
      let sum = 0.0;
      for (let j = 0; j < compsToUse; j++) {
        sum += inputV[i * inIncr + j] * inputV[i * inIncr + j];
      }
      outputV[i] = Math.sqrt(sum);
    }
  };

  //----------------------------------------------------------------------------
  // Map a set of vector values through the table
  publicAPI.mapVectorsThroughTable = (
    input,
    output,
    outputFormat,
    vectorComponentIn,
    vectorSizeIn
  ) => {
    let vectorMode = publicAPI.getVectorMode();
    let vectorSize = vectorSizeIn;
    let vectorComponent = vectorComponentIn;
    const inComponents = input.getNumberOfComponents();

    if (vectorMode === VectorMode.COMPONENT) {
      // make sure vectorComponent is within allowed range
      if (vectorComponent === -1) {
        // if set to -1, use default value provided by table
        vectorComponent = publicAPI.getVectorComponent();
      }
      if (vectorComponent < 0) {
        vectorComponent = 0;
      }
      if (vectorComponent >= inComponents) {
        vectorComponent = inComponents - 1;
      }
    } else {
      // make sure vectorSize is within allowed range
      if (vectorSize === -1) {
        // if set to -1, use default value provided by table
        vectorSize = publicAPI.getVectorSize();
      }
      if (vectorSize <= 0) {
        vectorComponent = 0;
        vectorSize = inComponents;
      } else {
        if (vectorComponent < 0) {
          vectorComponent = 0;
        }
        if (vectorComponent >= inComponents) {
          vectorComponent = inComponents - 1;
        }
        if (vectorComponent + vectorSize > inComponents) {
          vectorSize = inComponents - vectorComponent;
        }
      }

      if (
        vectorMode === VectorMode.MAGNITUDE &&
        (inComponents === 1 || vectorSize === 1)
      ) {
        vectorMode = VectorMode.COMPONENT;
      }
    }

    // increment input pointer to the first component to map
    let inputOffset = 0;
    if (vectorComponent > 0) {
      inputOffset = vectorComponent;
    }

    // map according to the current vector mode
    switch (vectorMode) {
      case VectorMode.COMPONENT: {
        publicAPI.mapScalarsThroughTable(
          input,
          output,
          outputFormat,
          inputOffset
        );
        break;
      }

      default:
      case VectorMode.MAGNITUDE: {
        const magValues = vtkDataArray.newInstance({
          numberOfComponents: 1,
          values: new Float32Array(input.getNumberOfTuples()),
        });

        publicAPI.mapVectorsToMagnitude(input, magValues, vectorSize);
        publicAPI.mapScalarsThroughTable(magValues, output, outputFormat, 0);
        break;
      }

      case VectorMode.RGBCOLORS: {
        // publicAPI.mapColorsToColors(
        //   input, output, inComponents, vectorSize,
        //   outputFormat);
        break;
      }
    }
  };

  publicAPI.luminanceToRGBA = (newColors, colors, alpha, convtFun) => {
    const a = convtFun(alpha);

    const values = colors.getData();
    const newValues = newColors.getData();
    const size = values.length;
    const component = 0;
    const tuple = 1;

    let count = 0;
    for (let i = component; i < size; i += tuple) {
      const l = convtFun(values[i]);
      newValues[count * 4] = l;
      newValues[count * 4 + 1] = l;
      newValues[count * 4 + 2] = l;
      newValues[count * 4 + 3] = a;
      count++;
    }
  };

  publicAPI.luminanceAlphaToRGBA = (newColors, colors, alpha, convtFun) => {
    const values = colors.getData();
    const newValues = newColors.getData();
    const size = values.length;
    const component = 0;
    const tuple = 2;

    let count = 0;
    for (let i = component; i < size; i += tuple) {
      const l = convtFun(values[i]);
      newValues[count] = l;
      newValues[count + 1] = l;
      newValues[count + 2] = l;
      newValues[count + 3] = convtFun(values[i + 1]) * alpha;
      count += 4;
    }
  };

  publicAPI.rGBToRGBA = (newColors, colors, alpha, convtFun) => {
    const a = floatColorToUChar(alpha);

    const values = colors.getData();
    const newValues = newColors.getData();
    const size = values.length;
    const component = 0;
    const tuple = 3;

    let count = 0;
    for (let i = component; i < size; i += tuple) {
      newValues[count * 4] = convtFun(values[i]);
      newValues[count * 4 + 1] = convtFun(values[i + 1]);
      newValues[count * 4 + 2] = convtFun(values[i + 2]);
      newValues[count * 4 + 3] = a;
      count++;
    }
  };

  publicAPI.rGBAToRGBA = (newColors, colors, alpha, convtFun) => {
    const values = colors.getData();
    const newValues = newColors.getData();
    const size = values.length;
    const component = 0;
    const tuple = 4;

    let count = 0;
    for (let i = component; i < size; i += tuple) {
      newValues[count * 4] = convtFun(values[i]);
      newValues[count * 4 + 1] = convtFun(values[i + 1]);
      newValues[count * 4 + 2] = convtFun(values[i + 2]);
      newColors[count * 4 + 3] = convtFun(values[i + 3]) * alpha;
      count++;
    }
  };

  //----------------------------------------------------------------------------
  publicAPI.convertToRGBA = (colors, numComp, numTuples) => {
    let { alpha } = model;
    if (
      numComp === 4 &&
      alpha >= 1.0 &&
      colors.getDataType() === VtkDataTypes.UNSIGNED_CHAR
    ) {
      return colors;
    }

    const newColors = vtkDataArray.newInstance({
      numberOfComponents: 4,
      empty: true,
      size: 4 * numTuples,
      dataType: VtkDataTypes.UNSIGNED_CHAR,
    });

    if (numTuples <= 0) {
      return newColors;
    }

    alpha = alpha > 0 ? alpha : 0;
    alpha = alpha < 1 ? alpha : 1;

    let convtFun = intColorToUChar;
    if (
      colors.getDataType() === VtkDataTypes.FLOAT ||
      colors.getDataType() === VtkDataTypes.DOUBLE
    ) {
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

  publicAPI.usingLogScale = () => false;

  publicAPI.getNumberOfAvailableColors = () => 256 * 256 * 256;

  publicAPI.setRange = (min, max) => publicAPI.setMappingRange(min, max);
  publicAPI.getRange = (min, max) => publicAPI.getMappingRange();
}

// ----------------------------------------------------------------------------
// Object factory
// ----------------------------------------------------------------------------

const DEFAULT_VALUES = {
  alpha: 1.0,
  vectorComponent: 0,
  vectorSize: -1,
  vectorMode: VectorMode.COMPONENT,
  mappingRange: null,
  annotationArray: null,
  annotatedValueMap: null,
  indexedLookup: false,
};

// ----------------------------------------------------------------------------

export function extend(publicAPI, model, initialValues = {}) {
  Object.assign(model, DEFAULT_VALUES, initialValues);

  // Object methods
  macro.obj(publicAPI, model);

  model.mappingRange = [0, 255];
  model.annotationArray = [];
  model.annotatedValueMap = [];

  // Create get-set macros
  macro.setGet(publicAPI, model, [
    'vectorSize',
    'vectorComponent',
    'vectorMode',
    'alpha',
    'indexedLookup',
  ]);

  // Create set macros for array (needs to know size)
  macro.setArray(publicAPI, model, ['mappingRange'], 2);

  // Create get macros for array
  macro.getArray(publicAPI, model, ['mappingRange']);

  // For more macro methods, see "Sources/macro.js"

  // Object specific methods
  vtkScalarsToColors(publicAPI, model);
}

// ----------------------------------------------------------------------------

export const newInstance = macro.newInstance(extend, 'vtkScalarsToColors');

// ----------------------------------------------------------------------------

export default Object.assign({ newInstance, extend }, Constants);
