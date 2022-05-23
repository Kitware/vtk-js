import macro from 'vtk.js/Sources/macros';
import vtkAbstractMapper3D from 'vtk.js/Sources/Rendering/Core/AbstractMapper3D';
import vtkDataArray from 'vtk.js/Sources/Common/Core/DataArray';
import vtkImageData from 'vtk.js/Sources/Common/DataModel/ImageData';
import vtkLookupTable from 'vtk.js/Sources/Common/Core/LookupTable';
import * as vtkMath from 'vtk.js/Sources/Common/Core/Math';
import vtkScalarsToColors from 'vtk.js/Sources/Common/Core/ScalarsToColors/Constants'; // Need to go inside Constants otherwise dependency loop

import CoincidentTopologyHelper from 'vtk.js/Sources/Rendering/Core/Mapper/CoincidentTopologyHelper';
import Constants from 'vtk.js/Sources/Rendering/Core/Mapper/Constants';

import vtkDataSet from 'vtk.js/Sources/Common/DataModel/DataSet';

import { PassTypes } from 'vtk.js/Sources/Rendering/OpenGL/HardwareSelector/Constants';

const { FieldAssociations } = vtkDataSet;

const { staticOffsetAPI, otherStaticMethods } = CoincidentTopologyHelper;

const { ColorMode, ScalarMode, GetArray } = Constants;
const { VectorMode } = vtkScalarsToColors;
const { VtkDataTypes } = vtkDataArray;

// ----------------------------------------------------------------------------

function notImplemented(method) {
  return () => macro.vtkErrorMacro(`vtkMapper::${method} - NOT IMPLEMENTED`);
}

// ----------------------------------------------------------------------------
// vtkMapper methods
// ----------------------------------------------------------------------------

function vtkMapper(publicAPI, model) {
  // Set our className
  model.classHierarchy.push('vtkMapper');

  publicAPI.getBounds = () => {
    const input = publicAPI.getInputData();
    if (!input) {
      model.bounds = vtkMath.createUninitializedBounds();
    } else {
      if (!model.static) {
        publicAPI.update();
      }
      model.bounds = input.getBounds();
    }
    return model.bounds;
  };

  publicAPI.setForceCompileOnly = (v) => {
    model.forceCompileOnly = v;
    // make sure we do NOT call modified()
  };

  publicAPI.createDefaultLookupTable = () => {
    model.lookupTable = vtkLookupTable.newInstance();
  };

  publicAPI.getColorModeAsString = () =>
    macro.enumToString(ColorMode, model.colorMode);

  publicAPI.setColorModeToDefault = () => publicAPI.setColorMode(0);
  publicAPI.setColorModeToMapScalars = () => publicAPI.setColorMode(1);
  publicAPI.setColorModeToDirectScalars = () => publicAPI.setColorMode(2);

  publicAPI.getScalarModeAsString = () =>
    macro.enumToString(ScalarMode, model.scalarMode);

  publicAPI.setScalarModeToDefault = () => publicAPI.setScalarMode(0);
  publicAPI.setScalarModeToUsePointData = () => publicAPI.setScalarMode(1);
  publicAPI.setScalarModeToUseCellData = () => publicAPI.setScalarMode(2);
  publicAPI.setScalarModeToUsePointFieldData = () => publicAPI.setScalarMode(3);
  publicAPI.setScalarModeToUseCellFieldData = () => publicAPI.setScalarMode(4);
  publicAPI.setScalarModeToUseFieldData = () => publicAPI.setScalarMode(5);

  publicAPI.getAbstractScalars = (
    input,
    scalarMode,
    arrayAccessMode,
    arrayId,
    arrayName
  ) => {
    // make sure we have an input
    if (!input || !model.scalarVisibility) {
      return { scalars: null, cellFLag: false };
    }

    let scalars = null;
    let cellFlag = false;

    // get and scalar data according to scalar mode
    if (scalarMode === ScalarMode.DEFAULT) {
      scalars = input.getPointData().getScalars();
      if (!scalars) {
        scalars = input.getCellData().getScalars();
        cellFlag = true;
      }
    } else if (scalarMode === ScalarMode.USE_POINT_DATA) {
      scalars = input.getPointData().getScalars();
    } else if (scalarMode === ScalarMode.USE_CELL_DATA) {
      scalars = input.getCellData().getScalars();
      cellFlag = true;
    } else if (scalarMode === ScalarMode.USE_POINT_FIELD_DATA) {
      const pd = input.getPointData();
      if (arrayAccessMode === GetArray.BY_ID) {
        scalars = pd.getArrayByIndex(arrayId);
      } else {
        scalars = pd.getArrayByName(arrayName);
      }
    } else if (scalarMode === ScalarMode.USE_CELL_FIELD_DATA) {
      const cd = input.getCellData();
      cellFlag = true;
      if (arrayAccessMode === GetArray.BY_ID) {
        scalars = cd.getArrayByIndex(arrayId);
      } else {
        scalars = cd.getArrayByName(arrayName);
      }
    } else if (scalarMode === ScalarMode.USE_FIELD_DATA) {
      const fd = input.getFieldData();
      if (arrayAccessMode === GetArray.BY_ID) {
        scalars = fd.getArrayByIndex(arrayId);
      } else {
        scalars = fd.getArrayByName(arrayName);
      }
    }

    return { scalars, cellFlag };
  };

  publicAPI.mapScalars = (input, alpha) => {
    const scalars = publicAPI.getAbstractScalars(
      input,
      model.scalarMode,
      model.arrayAccessMode,
      model.arrayId,
      model.colorByArrayName
    ).scalars;

    if (!scalars) {
      model.colorCoordinates = null;
      model.colorTextureMap = null;
      model.colorMapColors = null;
      return;
    }

    // we want to only recompute when something has changed
    const toString = `${publicAPI.getMTime()}${scalars.getMTime()}${alpha}`;
    if (model.colorBuildString === toString) return;

    if (!model.useLookupTableScalarRange) {
      publicAPI
        .getLookupTable()
        .setRange(model.scalarRange[0], model.scalarRange[1]);
    }

    // Decide between texture color or vertex color.
    // Cell data always uses vertex color.
    // Only point data can use both texture and vertex coloring.
    if (publicAPI.canUseTextureMapForColoring(input)) {
      publicAPI.mapScalarsToTexture(scalars, alpha);
    } else {
      model.colorCoordinates = null;
      model.colorTextureMap = null;

      const lut = publicAPI.getLookupTable();
      if (lut) {
        // Ensure that the lookup table is built
        lut.build();
        model.colorMapColors = lut.mapScalars(
          scalars,
          model.colorMode,
          model.fieldDataTupleId
        );
      }
    }
    model.colorBuildString = `${publicAPI.getMTime()}${scalars.getMTime()}${alpha}`;
  };

  //-----------------------------------------------------------------------------
  publicAPI.scalarToTextureCoordinate = (
    scalarValue, // Input scalar
    rangeMin, // range[0]
    invRangeWidth
  ) => {
    // 1/(range[1]-range[0])
    let texCoordS = 0.5; // Scalar value is arbitrary when NaN
    let texCoordT = 1.0; // 1.0 in t coordinate means NaN
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
    useLogScale
  ) => {
    // We have to change the range used for computing texture
    // coordinates slightly to accommodate the special above- and
    // below-range colors that are the first and last texels,
    // respectively.
    const scalarTexelWidth = (range[1] - range[0]) / tableNumberOfColors;

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
          sum += inputV[count] * inputV[count];
          count++;
        }
        let magnitude = Math.sqrt(sum);
        if (useLogScale) {
          magnitude = vtkLookupTable.applyLogScale(
            magnitude,
            tableRange,
            range
          );
        }
        const outputs = publicAPI.scalarToTextureCoordinate(
          magnitude,
          paddedRange[0],
          invRangeWidth
        );
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
            inputValue,
            tableRange,
            range
          );
        }
        const outputs = publicAPI.scalarToTextureCoordinate(
          inputValue,
          paddedRange[0],
          invRangeWidth
        );
        outputV[outputCount] = outputs.texCoordS;
        outputV[outputCount + 1] = outputs.texCoordT;
        outputCount += 2;
        count += numComps;
      }
    }
  };

  publicAPI.mapScalarsToTexture = (scalars, alpha) => {
    const range = model.lookupTable.getRange();
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
    if (
      model.colorTextureMap == null ||
      publicAPI.getMTime() > model.colorTextureMap.getMTime() ||
      model.lookupTable.getMTime() > model.colorTextureMap.getMTime() ||
      model.lookupTable.getAlpha() !== alpha
    ) {
      model.lookupTable.setAlpha(alpha);
      model.colorTextureMap = null;

      // Get the texture map from the lookup table.
      // Create a dummy ramp of scalars.
      // In the future, we could extend vtkScalarsToColors.
      model.lookupTable.build();
      let numberOfColors = model.lookupTable.getNumberOfAvailableColors();
      if (numberOfColors > 4094) {
        numberOfColors = 4094;
      }
      numberOfColors += 2;
      const k = (range[1] - range[0]) / (numberOfColors - 1 - 2);

      const newArray = new Float64Array(numberOfColors * 2);

      for (let i = 0; i < numberOfColors; ++i) {
        newArray[i] = range[0] + i * k - k; // minus k to start at below range color
        if (useLogScale) {
          newArray[i] = 10.0 ** newArray[i];
        }
      }
      // Dimension on NaN.
      for (let i = 0; i < numberOfColors; ++i) {
        newArray[i + numberOfColors] = NaN;
      }

      model.colorTextureMap = vtkImageData.newInstance();
      model.colorTextureMap.setExtent(0, numberOfColors - 1, 0, 1, 0, 0);

      const tmp = vtkDataArray.newInstance({
        numberOfComponents: 1,
        values: newArray,
      });

      model.colorTextureMap
        .getPointData()
        .setScalars(model.lookupTable.mapScalars(tmp, model.colorMode, 0));
      model.lookupTable.setAlpha(origAlpha);
    }

    // Create new coordinates if necessary.
    // Need to compare lookup table in case the range has changed.
    if (
      !model.colorCoordinates ||
      publicAPI.getMTime() > model.colorCoordinates.getMTime() ||
      publicAPI.getInputData(0).getMTime() >
        model.colorCoordinates.getMTime() ||
      model.lookupTable.getMTime() > model.colorCoordinates.getMTime()
    ) {
      // Get rid of old colors
      model.colorCoordinates = null;

      // Now create the color texture coordinates.
      const numComps = scalars.getNumberOfComponents();
      const num = scalars.getNumberOfTuples();

      // const fArray = new FloatArray(num * 2);
      model.colorCoordinates = vtkDataArray.newInstance({
        numberOfComponents: 2,
        values: new Float32Array(num * 2),
      });

      let scalarComponent = model.lookupTable.getVectorComponent();
      // Although I like the feature of applying magnitude to single component
      // scalars, it is not how the old MapScalars for vertex coloring works.
      if (
        model.lookupTable.getVectorMode() === VectorMode.MAGNITUDE &&
        scalars.getNumberOfComponents() > 1
      ) {
        scalarComponent = -1;
      }

      publicAPI.createColorTextureCoordinates(
        scalars,
        model.colorCoordinates,
        num,
        numComps,
        scalarComponent,
        range,
        model.lookupTable.getRange(),
        model.colorTextureMap.getPointData().getScalars().getNumberOfTuples() /
          2 -
          2,
        useLogScale
      );
    }
  };

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
    if (model.lookupTable && model.lookupTable.getIndexedLookup()) {
      return false;
    }

    const gasResult = publicAPI.getAbstractScalars(
      input,
      model.scalarMode,
      model.arrayAccessMode,
      model.arrayId,
      model.colorByArrayName
    );
    const scalars = gasResult.scalars;

    if (!scalars) {
      // no scalars on this dataset, we don't care if texture is used at all.
      return false;
    }

    if (gasResult.cellFlag) {
      return false; // cell data colors, don't use textures.
    }

    if (
      (model.colorMode === ColorMode.DEFAULT &&
        scalars.getDataType() === VtkDataTypes.UNSIGNED_CHAR) ||
      model.colorMode === ColorMode.DIRECT_SCALARS
    ) {
      // Don't use texture is direct coloring using RGB unsigned chars is
      // requested.
      return false;
    }

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

  publicAPI.getMTime = () => {
    let mt = model.mtime;
    if (model.lookupTable !== null) {
      const time = model.lookupTable.getMTime();
      mt = time > mt ? time : mt;
    }
    return mt;
  };

  publicAPI.getPrimitiveCount = () => {
    const input = publicAPI.getInputData();
    const pcount = {
      points: input.getPoints().getNumberOfValues() / 3,
      verts:
        input.getVerts().getNumberOfValues() -
        input.getVerts().getNumberOfCells(),
      lines:
        input.getLines().getNumberOfValues() -
        2 * input.getLines().getNumberOfCells(),
      triangles:
        input.getPolys().getNumberOfValues() -
        3 * input.getPolys().getNumberOfCells(),
    };
    return pcount;
  };

  publicAPI.acquireInvertibleLookupTable = notImplemented(
    'AcquireInvertibleLookupTable'
  );
  publicAPI.valueToColor = notImplemented('ValueToColor');
  publicAPI.colorToValue = notImplemented('ColorToValue');
  publicAPI.useInvertibleColorFor = notImplemented('UseInvertibleColorFor');
  publicAPI.clearInvertibleColor = notImplemented('ClearInvertibleColor');

  publicAPI.processSelectorPixelBuffers = (selector, pixelOffsets) => {
    /* eslint-disable no-bitwise */
    if (
      !selector ||
      !model.selectionWebGLIdsToVTKIds ||
      !model.populateSelectionSettings
    ) {
      return;
    }

    const rawLowData = selector.getRawPixelBuffer(PassTypes.ID_LOW24);
    const rawHighData = selector.getRawPixelBuffer(PassTypes.ID_HIGH24);
    const currentPass = selector.getCurrentPass();
    const fieldAssociation = selector.getFieldAssociation();

    let idMap = null;
    if (fieldAssociation === FieldAssociations.FIELD_ASSOCIATION_POINTS) {
      idMap = model.selectionWebGLIdsToVTKIds.points;
    } else if (fieldAssociation === FieldAssociations.FIELD_ASSOCIATION_CELLS) {
      idMap = model.selectionWebGLIdsToVTKIds.cells;
    }

    if (!idMap) {
      return;
    }

    pixelOffsets.forEach((pos) => {
      if (currentPass === PassTypes.ID_LOW24) {
        let inValue = 0;
        if (rawHighData) {
          inValue += rawHighData[pos];
          inValue *= 256;
        }
        inValue += rawLowData[pos + 2];
        inValue *= 256;
        inValue += rawLowData[pos + 1];
        inValue *= 256;
        inValue += rawLowData[pos];

        const outValue = idMap[inValue];
        const lowData = selector.getPixelBuffer(PassTypes.ID_LOW24);
        lowData[pos] = outValue & 0xff;
        lowData[pos + 1] = (outValue & 0xff00) >> 8;
        lowData[pos + 2] = (outValue & 0xff0000) >> 16;
      } else if (currentPass === PassTypes.ID_HIGH24 && rawHighData) {
        let inValue = 0;
        inValue += rawHighData[pos];
        inValue *= 256;
        inValue += rawLowData[pos];
        inValue *= 256;
        inValue += rawLowData[pos + 1];
        inValue *= 256;
        inValue += rawLowData[pos + 2];

        const outValue = idMap[inValue];
        const highData = selector.getPixelBuffer(PassTypes.ID_HIGH24);
        highData[pos] = (outValue & 0xff000000) >> 24;
      }
    });
    /* eslint-enable no-bitwise */
  };
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
  arrayAccessMode: 1, // By_NAME

  renderTime: 0,

  colorByArrayName: null,

  fieldDataTupleId: -1,

  populateSelectionSettings: true,
  selectionWebGLIdsToVTKIds: null,

  interpolateScalarsBeforeMapping: false,
  colorCoordinates: null,
  colorTextureMap: null,

  forceCompileOnly: 0,

  useInvertibleColors: false,
  invertibleScalars: null,

  viewSpecificProperties: null,

  customShaderAttributes: [],
};

// ----------------------------------------------------------------------------

export function extend(publicAPI, model, initialValues = {}) {
  Object.assign(model, DEFAULT_VALUES, initialValues);

  // Inheritance
  vtkAbstractMapper3D.extend(publicAPI, model, initialValues);

  macro.get(publicAPI, model, [
    'colorCoordinates',
    'colorMapColors',
    'colorTextureMap',
  ]);
  macro.setGet(publicAPI, model, [
    'colorByArrayName',
    'arrayAccessMode',
    'colorMode',
    'fieldDataTupleId',
    'interpolateScalarsBeforeMapping',
    'lookupTable',
    'populateSelectionSettings',
    'renderTime',
    'scalarMode',
    'scalarVisibility',
    'selectionWebGLIdsToVTKIds',
    'static',
    'useLookupTableScalarRange',
    'viewSpecificProperties',
    'customShaderAttributes', // point data array names that will be transferred to the VBO
  ]);
  macro.setGetArray(publicAPI, model, ['scalarRange'], 2);

  if (!model.viewSpecificProperties) {
    model.viewSpecificProperties = {};
  }

  CoincidentTopologyHelper.implementCoincidentTopologyMethods(publicAPI, model);

  // Object methods
  vtkMapper(publicAPI, model);
}

// ----------------------------------------------------------------------------

export const newInstance = macro.newInstance(extend, 'vtkMapper');

// ----------------------------------------------------------------------------

export default {
  newInstance,
  extend,
  ...staticOffsetAPI,
  ...otherStaticMethods,
  ...Constants,
};
