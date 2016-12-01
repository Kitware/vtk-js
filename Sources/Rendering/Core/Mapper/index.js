import * as CoincidentTopologyHelper              from './CoincidentTopologyHelper';
import * as macro                                 from '../../../macro';
import otherStaticMethods                         from './Static';
import vtkDataArray                               from '../../../Common/Core/DataArray';
import vtkImageData                               from '../../../Common/DataModel/ImageData';
import vtkLookupTable                             from '../../../Common/Core/LookupTable';
import vtkMath                                    from '../../../Common/Core/Math';
import { VTK_VECTOR_MODE } from '../../../Common/Core/ScalarsToColors/Constants';
import { VTK_COLOR_MODE, VTK_SCALAR_MODE, VTK_MATERIALMODE, VTK_GET_ARRAY } from './Constants';

function notImplemented(method) {
  return () => console.log(`vtkMapper::${method} - NOT IMPLEMENTED`);
}

// CoincidentTopology static methods ------------------------------------------
/* eslint-disable arrow-body-style */

const staticOffsetModel = {
  Polygon: { factor: 2, unit: 2 },
  Line: { factor: 1, unit: 1 },
  Point: { factor: 0, unit: 0 },
};
const staticOffsetAPI = {};

CoincidentTopologyHelper.addCoincidentTopologyMethods(
  staticOffsetAPI,
  staticOffsetModel,
  CoincidentTopologyHelper.CATEGORIES
    .map(key => ({ key, method: `ResolveCoincidentTopology${key}OffsetParameters` }))
);

// ----------------------------------------------------------------------------
// vtkMapper methods
// ----------------------------------------------------------------------------

function vtkMapper(publicAPI, model) {
  // Set our className
  model.classHierarchy.push('vtkMapper');

  publicAPI.getBounds = () => {
    const input = publicAPI.getInputData();
    if (!input) {
      model.bounds = vtkMath.createUninitializedBouds();
    } else {
      if (!model.static) {
        publicAPI.update();
      }
      model.bounds = input.getBounds();
    }
    return model.bounds;
  };

  publicAPI.update = () => {
    publicAPI.getInputData();
  };

  publicAPI.setForceCompileOnly = (v) => {
    model.forceCompileOnly = v;
    // make sure we do NOT call modified()
  };

  publicAPI.createDefaultLookupTable = () => {
    model.lookupTable = vtkLookupTable.newInstance();
  };

  publicAPI.getColorModeAsString = () => macro.enumToString(VTK_COLOR_MODE, model.colorMode);

  publicAPI.setColorModeToDefault = () => publicAPI.setColorMode(0);
  publicAPI.setColorModeToMapScalars = () => publicAPI.setColorMode(1);
  publicAPI.setColorModeToDirectScalars = () => publicAPI.setColorMode(2);

  publicAPI.getScalarModeAsString = () => macro.enumToString(VTK_SCALAR_MODE, model.scalarMode);

  publicAPI.setScalarModeToDefault = () => publicAPI.setScalarMode(0);
  publicAPI.setScalarModeToUsePointData = () => publicAPI.setScalarMode(1);
  publicAPI.setScalarModeToUseCellData = () => publicAPI.setScalarMode(2);
  publicAPI.setScalarModeToUsePointFieldData = () => publicAPI.setScalarMode(3);
  publicAPI.setScalarModeToUseCellFieldData = () => publicAPI.setScalarMode(4);
  publicAPI.setScalarModeToUseFieldData = () => publicAPI.setScalarMode(5);

  // Add Static methods to our instance
  Object.keys(otherStaticMethods).forEach((methodName) => {
    publicAPI[methodName] = otherStaticMethods[methodName];
  });
  Object.keys(staticOffsetAPI).forEach((methodName) => {
    publicAPI[methodName] = staticOffsetAPI[methodName];
  });

  // Relative metods
  /* eslint-disable arrow-body-style */
  model.topologyOffset = {
    Polygon: { factor: 0, unit: 0 },
    Line: { factor: 0, unit: 0 },
    Point: { factor: 0, unit: 0 },
  };
  CoincidentTopologyHelper.addCoincidentTopologyMethods(
    publicAPI,
    model.topologyOffset,
    CoincidentTopologyHelper.CATEGORIES
      .map(key => ({ key, method: `RelativeCoincidentTopology${key}OffsetParameters` }))
  );
  /* eslint-enable arrow-body-style */

  publicAPI.getCoincidentTopologyPolygonOffsetParameters = () => {
    const globalValue = staticOffsetAPI.getResolveCoincidentTopologyPolygonOffsetParameters();
    const localValue = publicAPI.getRelativeCoincidentTopologyPolygonOffsetParameters();
    return {
      factor: globalValue.factor + localValue.factor,
      units: globalValue.units + localValue.units,
    };
  };

  publicAPI.getCoincidentTopologyLineOffsetParameters = () => {
    const globalValue = staticOffsetAPI.getResolveCoincidentTopologyLineOffsetParameters();
    const localValue = publicAPI.getRelativeCoincidentTopologyLineOffsetParameters();
    return {
      factor: globalValue.factor + localValue.factor,
      units: globalValue.units + localValue.units,
    };
  };

  publicAPI.getCoincidentTopologyPointOffsetParameter = () => {
    const globalValue = staticOffsetAPI.getResolveCoincidentTopologyPointOffsetParameters();
    const localValue = publicAPI.getRelativeCoincidentTopologyPointOffsetParameters();
    return {
      factor: globalValue.factor + localValue.factor,
      units: globalValue.units + localValue.units,
    };
  };

  publicAPI.getAbstractScalars = (input, scalarMode, arrayAccessMode,
    arrayId, arrayName) => {
    // make sure we have an input
    if (!input) {
      return null;
    }

    let scalars = null;

    // get and scalar data according to scalar mode
    if (scalarMode === VTK_SCALAR_MODE.DEFAULT) {
      scalars = input.getPointData().getScalars();
      if (!scalars) {
        scalars = input.getCellData().getScalars();
      }
    } else if (scalarMode === VTK_SCALAR_MODE.USE_POINT_DATA) {
      scalars = input.getPointData().getScalars();
    } else if (scalarMode === VTK_SCALAR_MODE.USE_CELL_DATA) {
      scalars = input.getCellData().getScalars();
    } else if (scalarMode === VTK_SCALAR_MODE.USE_POINT_FIELD_DATA) {
      const pd = input.getPointData();
      if (arrayAccessMode === VTK_GET_ARRAY.BY_ID) {
        scalars = pd.getAbstractArray(arrayId);
      } else {
        scalars = pd.getAbstractArray(arrayName);
      }
    } else if (scalarMode === VTK_SCALAR_MODE.USE_CELL_FIELD_DATA) {
      const cd = input.getCellData();
      if (arrayAccessMode === VTK_GET_ARRAY.BY_ID) {
        scalars = cd.getAbstractArray(arrayId);
      } else {
        scalars = cd.getAbstractArray(arrayName);
      }
    } else if (scalarMode === VTK_SCALAR_MODE.USE_FIELD_DATA) {
      const fd = input.getFieldData();
      if (arrayAccessMode === VTK_GET_ARRAY.BY_ID) {
        scalars = fd.getAbstractArray(arrayId);
      } else {
        scalars = fd.getAbstractArray(arrayName);
      }
    }

    return scalars;
  };

  publicAPI.mapScalars = (input, alpha) => {
    const scalars = publicAPI.getAbstractScalars(input, model.scalarMode,
      model.arrayAccessMode, model.arrayId, model.colorByArrayName);

    if (!scalars) {
      model.colorCoordinates = null;
      model.colorTextureMap = null;
      model.colorMapColors = null;
      return;
    }

    if (!model.useLookupTableScalarRange) {
      model.lookupTable.setTableRange(
        model.scalarRange[0], model.scalarRange[1]);
    }

    // Decide betweeen texture color or vertex color.
    // Cell data always uses vertex color.
    // Only point data can use both texture and vertex coloring.
    if (publicAPI.canUseTextureMapForColoring(input)) {
      publicAPI.mapScalarsToTexture(scalars, alpha);
      return;
    }

    model.colorCoordinates = null;
    model.colorTextureMap = null;

    const lut = publicAPI.getLookupTable();
    if (lut) {
      // Ensure that the lookup table is built
      lut.build();
      model.colorMapColors = lut.mapScalars(scalars, model.colorMode, 0);
    }
  };

  //-----------------------------------------------------------------------------
  publicAPI.scalarToTextureCoordinate = (
    scalarValue,         // Input scalar
    rangeMin,       // range[0]
    invRangeWidth) => { // 1/(range[1]-range[0])
    let texCoordS = 0.5;  // Scalar value is arbitrary when NaN
    let texCoordT = 1.0;  // 1.0 in t coordinate means NaN
    if (!vtkMath.isNan(scalarValue)) {
      // 0.0 in t coordinate means not NaN.  So why am I setting it to 0.49?
      // Because when you are mapping scalars and you have a NaN adjacent to
      // anything else, the interpolation everywhere should be NaN.  Thus, I
      // want the NaN color everywhere except right on the non-NaN neighbors.
      // To simulate this, I set the t coord for the real numbers close to
      // the threshold so that the interpolation almost immediately looks up
      // the NaN value.
      texCoordT = 0.49;

      texCoordS = (scalarValue - rangeMin) * invRangeWidth;

      // Some implementations apparently don't handle relatively large
      // numbers (compared to the range [0.0, 1.0]) very well. In fact,
      // values above 1122.0f appear to cause texture wrap-around on
      // some systems even when edge clamping is enabled. Why 1122.0f? I
      // don't know. For safety, we'll clamp at +/- 1000. This will
      // result in incorrect images when the texture value should be
      // above or below 1000, but I don't have a better solution.
      if (texCoordS > 1000.0) {
        texCoordS = 1000.0;
      } else if (texCoordS < -1000.0) {
        texCoordS = -1000.0;
      }
    }
    return { texCoordS, texCoordT };
  };

  //-----------------------------------------------------------------------------
  publicAPI.createColorTextureCoordinates = (
    input,
    output,
    numScalars,
    numComps,
    component,
    range,
    tableRange,
    tableNumberOfColors,
    useLogScale) => {
    // We have to change the range used for computing texture
    // coordinates slightly to accomodate the special above- and
    // below-range colors that are the first and last texels,
    // respectively.
    const scalarTexelWidth =
      (range[1] - range[0]) / tableNumberOfColors;

    const paddedRange = [];
    paddedRange[0] = range[0] - scalarTexelWidth;
    paddedRange[1] = range[1] + scalarTexelWidth;
    const invRangeWidth = 1.0 / (paddedRange[1] - paddedRange[0]);

    const outputV = output.getData();
    const inputV = input.getData();

    let count = 0;
    let outputCount = 0;
    if (component < 0 || component >= numComps) {
      for (let scalarIdx = 0; scalarIdx < numScalars; ++scalarIdx) {
        let sum = 0;
        for (let compIdx = 0; compIdx < numComps; ++compIdx) {
          sum += (inputV[count] * inputV[count]);
          count++;
        }
        let magnitude = Math.sqrt(sum);
        if (useLogScale) {
          magnitude = vtkLookupTable.applyLogScale(
            magnitude, tableRange, range);
        }
        const outputs =
          publicAPI.scalarToTextureCoordinate(
            magnitude, paddedRange[0],
            invRangeWidth);
        outputV[outputCount] = outputs.texCoordS;
        outputV[outputCount + 1] = outputs.texCoordT;
        outputCount += 2;
      }
    } else {
      count += component;
      for (let scalarIdx = 0; scalarIdx < numScalars; ++scalarIdx) {
        let inputValue = inputV[count];
        if (useLogScale) {
          inputValue = vtkLookupTable.applyLogScale(
            inputValue, tableRange, range);
        }
        const outputs =
          publicAPI.scalarToTextureCoordinate(
            inputValue, paddedRange[0], invRangeWidth);
        outputV[outputCount] = outputs.texCoordS;
        outputV[outputCount + 1] = outputs.texCoordT;
        outputCount += 2;
        count += numComps;
      }
    }
  };

  publicAPI.mapScalarsToTexture = (scalars, alpha) => {
    const range = model.lookupTable.getTableRange();
    const useLogScale = model.lookupTable.usingLogScale();
    if (useLogScale) {
      // convert range to log.
      vtkLookupTable.getLogRange(range, range);
    }

    const origAlpha = model.lookupTable.getAlpha();

    // Get rid of vertex color array.  Only texture or vertex coloring
    // can be active at one time.  The existence of the array is the
    // signal to use that technique.
    model.colorMapColors = null;

    // If the lookup table has changed, then recreate the color texture map.
    // Set a new lookup table changes this->MTime.
    if (model.colorTextureMap == null ||
        publicAPI.getMTime() > model.colorTextureMap.getMTime() ||
        model.lookupTable.getMTime() > model.colorTextureMap.getMTime() ||
        model.lookupTable.getAlpha() !== alpha) {
      model.lookupTable.setAlpha(alpha);
      model.colorTextureMap = null;

      // Get the texture map from the lookup table.
      // Create a dummy ramp of scalars.
      // In the future, we could extend vtkScalarsToColors.
      model.lookupTable.build();
      let numberOfColors = model.lookupTable.getNumberOfColors();
      numberOfColors += 2;
      const k = (range[1] - range[0]) / (numberOfColors - 1 - 2);

      const newArray = new Float64Array(numberOfColors * 2);

      for (let i = 0; i < numberOfColors; ++i) {
        newArray[i] = range[0] + (i * k) - k; // minus k to start at below range color
        if (useLogScale) {
          newArray[i] = Math.pow(10.0, newArray[i]);
        }
      }
      // Dimension on NaN.
      for (let i = 0; i < numberOfColors; ++i) {
        newArray[i + numberOfColors] = NaN;
      }

      model.colorTextureMap = vtkImageData.newInstance();
      model.colorTextureMap.setExtent(
        0, numberOfColors - 1, 0, 1, 0, 0);

      const tmp = vtkDataArray.newInstance({ tuple: 1, values: newArray });

      model.colorTextureMap.getPointData().setScalars(
           model.lookupTable.mapScalars(tmp, model.colorMode, 0));
      model.lookupTable.setAlpha(origAlpha);
    }

    // Create new coordinates if necessary.
    // Need to compare lookup table incase the range has changed.
    if (!model.colorCoordinates ||
        publicAPI.getMTime() > model.colorCoordinates.getMTime() ||
        publicAPI.getInputData(0).getMTime() >
        model.colorCoordinates.getMTime() ||
        model.lookupTable.getMTime() > model.colorCoordinates.getMTime()) {
      // Get rid of old colors
      model.colorCoordinates = null;

      // Now create the color texture coordinates.
      const numComps = scalars.getNumberOfComponents();
      const num = scalars.getNumberOfTuples();

      // const fArray = new FloatArray(num * 2);
      model.colorCoordinates =
        vtkDataArray.newInstance({ tuple: 2, values: new Float32Array(num * 2) });

      let scalarComponent = model.lookupTable.getVectorComponent();
      // Although I like the feature of applying magnitude to single component
      // scalars, it is not how the old MapScalars for vertex coloring works.
      if (model.lookupTable.getVectorMode() === VTK_VECTOR_MODE.MAGNITUDE &&
          scalars.getNumberOfComponents() > 1) {
        scalarComponent = -1;
      }

      publicAPI.createColorTextureCoordinates(
        scalars,
        model.colorCoordinates,
        num, numComps,
        scalarComponent, range,
        model.lookupTable.getTableRange(),
        model.lookupTable.getNumberOfAvailableColors(),
        useLogScale);
    }
  };


  publicAPI.setScalarMaterialModeToDefault = () => publicAPI.setScalarMaterialMode(VTK_MATERIALMODE.DEFAULT);
  publicAPI.setScalarMaterialModeToAmbient = () => publicAPI.setScalarMaterialMode(VTK_MATERIALMODE.AMBIENT);
  publicAPI.setScalarMaterialModeToDiffuse = () => publicAPI.setScalarMaterialMode(VTK_MATERIALMODE.DIFFUSE);
  publicAPI.setScalarMaterialModeToAmbientAndDiffuse = () => publicAPI.setScalarMaterialMode(VTK_MATERIALMODE.AMBIENT_AND_DIFFUSE);
  publicAPI.getScalarMaterialModeAsString = () => macro.enumToString(VTK_MATERIALMODE, model.scalarMaterialMode);

  publicAPI.getIsOpaque = () => {
    const lut = publicAPI.getLookupTable();
    if (lut) {
      // Ensure that the lookup table is built
      lut.build();
      return lut.isOpaque();
    }
    return true;
  };

  publicAPI.canUseTextureMapForColoring = (input) => {
    if (!model.interpolateScalarsBeforeMapping) {
      return false; // user doesn't want us to use texture maps at all.
    }

    // index color does not use textures
    // if (model.lookupTable &&
    //     model.lookupTable.getIndexedLookup()) {
    //   return false;
    // }

    return true;
  };

  publicAPI.clearColorArrays = () => {
    model.colorMapColors = null;
    model.colorCoordinates = null;
    model.colorTextureMap = null;
  };

  publicAPI.getLookupTable = () => {
    if (!model.lookupTable) {
      publicAPI.createDefaultLookupTable();
    }
    return model.lookupTable;
  };

  publicAPI.acquireInvertibleLookupTable = notImplemented('AcquireInvertibleLookupTable');
  publicAPI.valueToColor = notImplemented('ValueToColor');
  publicAPI.colorToValue = notImplemented('ColorToValue');
  publicAPI.useInvertibleColorFor = notImplemented('UseInvertibleColorFor');
  publicAPI.clearInvertibleColor = notImplemented('ClearInvertibleColor');
}

// ----------------------------------------------------------------------------
// Object factory
// ----------------------------------------------------------------------------

const DEFAULT_VALUES = {
  colorMapColors: null, // Same as this->Colors

  static: false,
  lookupTable: null,

  scalarVisibility: true,
  scalarRange: [0, 1],
  useLookupTableScalarRange: false,

  colorMode: 0,
  scalarMode: 0,
  scalarMaterialMode: 0,

  bounds: [1, -1, 1, -1, 1, -1],
  center: [0, 0],

  renderTime: 0,

  colorByArrayName: null,
  colorByArrayComponent: -1,

  fieldDataTupleId: -1,

  interpolateScalarsBeforeMapping: false,
  colorCoordinates: null,
  colorTextureMap: null,

  forceCompileOnly: 0,

  useInvertibleColors: false,
  invertibleScalars: null,
  resolveCoincidentTopology: false,
};

// ----------------------------------------------------------------------------

export function extend(publicAPI, model, initialValues = {}) {
  Object.assign(model, DEFAULT_VALUES, initialValues);

  // Build VTK API
  macro.obj(publicAPI, model); // FIXME parent is not vtkObject
  macro.algo(publicAPI, model, 1, 0);
  macro.get(publicAPI, model, [
    'colorCoordinates',
    'colorMapColors',
    'colorTextureMap',
  ]);
  macro.setGet(publicAPI, model, [
    'colorByArrayComponent',
    'colorByArrayName',
    'colorMode',
    'fieldDataTupleId',
    'interpolateScalarsBeforeMapping',
    'lookupTable',
    'renderTime',
    'resolveCoincidentTopology',
    'scalarMaterialMode',
    'scalarMode',
    'scalarVisibility',
    'static',
    'useLookupTableScalarRange',
  ]);
  macro.setGetArray(publicAPI, model, [
    'scalarRange',
  ], 2);

  // Object methods
  vtkMapper(publicAPI, model);
}

// ----------------------------------------------------------------------------

export const newInstance = macro.newInstance(extend);

// ----------------------------------------------------------------------------

export default Object.assign({ newInstance, extend }, staticOffsetAPI, otherStaticMethods);
