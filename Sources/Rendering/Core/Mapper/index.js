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

/**
 * Increase by one the 3D coordinates
 * It will follow a zigzag pattern so that each coordinate is the neighbor of the next coordinate
 * This enables interpolation between two texels without issues
 * Note: texture coordinates can't be interpolated using this pattern
 * @param {vec3} coordinates The 3D coordinates using integers for each coorinate
 * @param {vec3} dimensions The 3D dimensions of the volume
 */
function updateZigzaggingCoordinates(coordinates, dimensions) {
  const directionX = coordinates[1] % 2 === 0 ? 1 : -1;
  coordinates[0] += directionX;
  if (coordinates[0] >= dimensions[0] || coordinates[0] < 0) {
    const directionY = coordinates[2] % 2 === 0 ? 1 : -1;
    coordinates[0] -= directionX;
    coordinates[1] += directionY;
    if (coordinates[1] >= dimensions[1] || coordinates[1] < 0) {
      coordinates[1] -= directionY;
      coordinates[2]++;
    }
  }
}

/**
 * Returns the index in the array representing the volume from a 3D coordinate
 * @param {vec3} coordinates The 3D integer coordinates
 * @param {vec3} dimensions The 3D dimensions of the volume
 * @returns The index in a flat array representing the volume
 */
function getIndexFromCoordinates(coordinates, dimensions) {
  return (
    coordinates[0] +
    dimensions[0] * (coordinates[1] + dimensions[1] * coordinates[2])
  );
}

/**
 * Write texture coordinates for the given `texelIndexPosition` in `textureCoordinate`.
 * The `texelIndexPosition` is a floating point number that represents the distance in index space
 * from the center of the first texel to the final output position.
 * The output is given in texture coordinates and not in index coordinates (this is done at the very end of the function)
 * @param {vec3} textureCoordinate The output texture coordinates (to avoid allocating a new Array)
 * @param {Number} texelIndexPosition The floating point distance from the center of the first texel, following a zigzag pattern
 * @param {vec3} dimensions The 3D dimensions of the volume
 */
function getZigZagTextureCoordinatesFromTexelPosition(
  textureCoordinate,
  texelIndexPosition,
  dimensions
) {
  // First compute the integer textureCoordinate
  const intTexelIndex = Math.floor(texelIndexPosition);
  const xCoordBeforeWrap = intTexelIndex % (2 * dimensions[0]);
  let xDirection;
  let xEndFlag;
  if (xCoordBeforeWrap < dimensions[0]) {
    textureCoordinate[0] = xCoordBeforeWrap;
    xDirection = 1;
    xEndFlag = textureCoordinate[0] === dimensions[0] - 1;
  } else {
    textureCoordinate[0] = 2 * dimensions[0] - 1 - xCoordBeforeWrap;
    xDirection = -1;
    xEndFlag = textureCoordinate[0] === 0;
  }

  const intRowIndex = Math.floor(intTexelIndex / dimensions[0]);
  const yCoordBeforeWrap = intRowIndex % (2 * dimensions[1]);
  let yDirection;
  let yEndFlag;
  if (yCoordBeforeWrap < dimensions[1]) {
    textureCoordinate[1] = yCoordBeforeWrap;
    yDirection = 1;
    yEndFlag = textureCoordinate[1] === dimensions[1] - 1;
  } else {
    textureCoordinate[1] = 2 * dimensions[1] - 1 - yCoordBeforeWrap;
    yDirection = -1;
    yEndFlag = textureCoordinate[1] === 0;
  }

  textureCoordinate[2] = Math.floor(intRowIndex / dimensions[1]);

  // Now add the remainder either in x, y or z
  const remainder = texelIndexPosition - intTexelIndex;
  if (xEndFlag) {
    if (yEndFlag) {
      textureCoordinate[2] += remainder;
    } else {
      textureCoordinate[1] += yDirection * remainder;
    }
  } else {
    textureCoordinate[0] += xDirection * remainder;
  }

  // textureCoordinates are in index space, convert to texture space
  textureCoordinate[0] = (textureCoordinate[0] + 0.5) / dimensions[0];
  textureCoordinate[1] = (textureCoordinate[1] + 0.5) / dimensions[1];
  textureCoordinate[2] = (textureCoordinate[2] + 0.5) / dimensions[2];
}

// Associate an input vtkDataArray to an object { stringHash, textureCoordinates }
// A single dataArray only caches one array of texture coordinates, so this cache is useless when
// the input data array is used with two different lookup tables (which is very unlikely)
const colorTextureCoordinatesCache = new WeakMap();
/**
 * The minimum of the range is mapped to the center of the first texel excluding min texel (texel at index distance 1)
 * The maximum of the range is mapped to the center of the last texel excluding max and NaN texels (texel at index distance numberOfColorsInRange)
 * The result is cached, and is reused if the arguments are the same and the input doesn't change
 * @param {vtkDataArray} input The input data array used for coloring
 * @param {Number} component The component of the input data array that is used for coloring (-1 for magnitude of the vectors)
 * @param {Range} range The range of the scalars
 * @param {boolean} useLogScale Should the values be transformed to logarithmic scale. When true, the range must already be in logarithmic scale.
 * @param {Number} numberOfColorsInRange The number of colors that are used in the range
 * @param {vec3} dimensions The dimensions of the texture
 * @param {boolean} useZigzagPattern If a zigzag pattern should be used. Otherwise 1 row for colors (including min and max) and 1 row for NaN are used.
 * @returns A vtkDataArray containing the texture coordinates (2D or 3D)
 */
function getOrCreateColorTextureCoordinates(
  input,
  component,
  range,
  useLogScale,
  numberOfColorsInRange,
  dimensions,
  useZigzagPattern
) {
  // Caching using the "arguments" special object (because it is a pure function)
  const argStrings = new Array(arguments.length);
  for (let argIndex = 0; argIndex < arguments.length; ++argIndex) {
    // eslint-disable-next-line prefer-rest-params
    const arg = arguments[argIndex];
    argStrings[argIndex] = arg.getMTime?.() ?? arg;
  }
  const stringHash = argStrings.join('/');

  const cachedResult = colorTextureCoordinatesCache.get(input);
  if (cachedResult && cachedResult.stringHash === stringHash) {
    return cachedResult.textureCoordinates;
  }

  // The range used for computing coordinates have to change
  // slightly to accommodate the special above- and below-range
  // colors that are the first and last texels, respectively.
  const scalarTexelWidth = (range[1] - range[0]) / (numberOfColorsInRange - 1);
  const [paddedRangeMin, paddedRangeMax] = [
    range[0] - scalarTexelWidth,
    range[1] + scalarTexelWidth,
  ];

  // Use the center of the voxel
  const textureSOrigin = paddedRangeMin - 0.5 * scalarTexelWidth;
  const textureSCoeff =
    1.0 / (paddedRangeMax - paddedRangeMin + scalarTexelWidth);

  // Compute in index space first
  const texelIndexOrigin = paddedRangeMin;
  const texelIndexCoeff =
    (numberOfColorsInRange + 1) / (paddedRangeMax - paddedRangeMin);

  const inputV = input.getData();
  const numScalars = input.getNumberOfTuples();
  const numComps = input.getNumberOfComponents();
  const useMagnitude = component < 0 || component >= numComps;
  const numberOfOutputComponents = dimensions[2] <= 1 ? 2 : 3;
  const output = vtkDataArray.newInstance({
    numberOfComponents: numberOfOutputComponents,
    values: new Float32Array(numScalars * numberOfOutputComponents),
  });
  const outputV = output.getData();

  const nanTextureCoordinate = [0, 0, 0];
  // Distance of NaN from the beginning:
  // min: 0, ...colorsInRange, max: numberOfColorsInRange + 1, NaN = numberOfColorsInRange + 2
  getZigZagTextureCoordinatesFromTexelPosition(
    nanTextureCoordinate,
    numberOfColorsInRange + 2,
    dimensions
  );

  // Set a texture coordinate in the output for each tuple in the input
  let inputIdx = 0;
  let outputIdx = 0;
  const textureCoordinate = [0.5, 0.5, 0.5];
  for (let scalarIdx = 0; scalarIdx < numScalars; ++scalarIdx) {
    // Get scalar value from magnitude or a single component
    let scalarValue;
    if (useMagnitude) {
      let sum = 0;
      for (let compIdx = 0; compIdx < numComps; ++compIdx) {
        const compValue = inputV[inputIdx + compIdx];
        sum += compValue * compValue;
      }
      scalarValue = Math.sqrt(sum);
    } else {
      scalarValue = inputV[inputIdx + component];
    }
    if (useLogScale) {
      scalarValue = Math.log10(scalarValue);
    }

    inputIdx += numComps;

    // Convert to texture coordinates and update output
    if (vtkMath.isNan(scalarValue)) {
      // Last texels are NaN colors (there is at least one NaN color)
      textureCoordinate[0] = nanTextureCoordinate[0];
      textureCoordinate[1] = nanTextureCoordinate[1];
      textureCoordinate[2] = nanTextureCoordinate[2];
    } else if (useZigzagPattern) {
      // Texel position is in [0, numberOfColorsInRange + 1]
      let texelIndexPosition =
        (scalarValue - texelIndexOrigin) * texelIndexCoeff;
      if (texelIndexPosition < 1) {
        // Use min color when smaller than range
        texelIndexPosition = 0;
      } else if (texelIndexPosition > numberOfColorsInRange) {
        // Use max color when greater than range
        texelIndexPosition = numberOfColorsInRange + 1;
      }

      // Convert the texel position into texture coordinate following a zigzag pattern
      getZigZagTextureCoordinatesFromTexelPosition(
        textureCoordinate,
        texelIndexPosition,
        dimensions
      );
    } else {
      // 0.0 in t coordinate means not NaN.  So why am I setting it to 0.49?
      // Because when you are mapping scalars and you have a NaN adjacent to
      // anything else, the interpolation everywhere should be NaN.  Thus, I
      // want the NaN color everywhere except right on the non-NaN neighbors.
      // To simulate this, I set the t coord for the real numbers close to
      // the threshold so that the interpolation almost immediately looks up
      // the NaN value.
      textureCoordinate[1] = 0.49;

      // Some implementations apparently don't handle relatively large
      // numbers (compared to the range [0.0, 1.0]) very well. In fact,
      // values above 1122.0f appear to cause texture wrap-around on
      // some systems even when edge clamping is enabled. Why 1122.0f? I
      // don't know. For safety, we'll clamp at +/- 1000. This will
      // result in incorrect images when the texture value should be
      // above or below 1000, but I don't have a better solution.
      const textureS = (scalarValue - textureSOrigin) * textureSCoeff;
      if (textureS > 1000.0) {
        textureCoordinate[0] = 1000.0;
      } else if (textureS < -1000.0) {
        textureCoordinate[0] = -1000.0;
      } else {
        textureCoordinate[0] = textureS;
      }
    }
    for (let i = 0; i < numberOfOutputComponents; ++i) {
      outputV[outputIdx++] = textureCoordinate[i];
    }
  }

  colorTextureCoordinatesCache.set(input, {
    stringHash,
    textureCoordinates: output,
  });
  return output;
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

  publicAPI.setSelectionWebGLIdsToVTKIds = (selectionWebGLIdsToVTKIds) => {
    model.selectionWebGLIdsToVTKIds = selectionWebGLIdsToVTKIds;
    // make sure we do NOT call modified()
    // this attribute is only used when processing a selection made with the hardware selector
    // the mtime of the mapper doesn't need to be changed
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
      return { scalars: null, cellFlag: false };
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
    const { scalars, cellFlag } = publicAPI.getAbstractScalars(
      input,
      model.scalarMode,
      model.arrayAccessMode,
      model.arrayId,
      model.colorByArrayName
    );
    model.areScalarsMappedFromCells = cellFlag;

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
    if (publicAPI.canUseTextureMapForColoring(scalars, cellFlag)) {
      model.mapScalarsToTexture(scalars, cellFlag, alpha);
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

  // Protected method
  model.mapScalarsToTexture = (scalars, cellFlag, alpha) => {
    const range = model.lookupTable.getRange();
    const useLogScale = model.lookupTable.usingLogScale();
    const origAlpha = model.lookupTable.getAlpha();
    const scaledRange = useLogScale
      ? [Math.log10(range[0]), Math.log10(range[1])]
      : range;

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
      const numberOfAvailableColors =
        model.lookupTable.getNumberOfAvailableColors();

      // Maximum dimensions and number of colors in range
      const maxTextureWidthForCells = 2048;
      const maxColorsInRangeForCells = maxTextureWidthForCells ** 3 - 3; // 3D but keep a color for min, max and NaN
      const maxTextureWidthForPoints = 4096;
      const maxColorsInRangeForPoints = maxTextureWidthForPoints - 2; // 1D but keep a color for min and max (NaN is in a different row)
      // Minimum number of colors in range (excluding special colors like minColor, maxColor and NaNColor)
      const minColorsInRange = 2;
      // Maximum number of colors, limited by the maximum possible texture size
      const maxColorsInRange = cellFlag
        ? maxColorsInRangeForCells
        : maxColorsInRangeForPoints;

      model.numberOfColorsInRange = Math.min(
        Math.max(numberOfAvailableColors, minColorsInRange),
        maxColorsInRange
      );
      const numberOfColorsForCells = model.numberOfColorsInRange + 3; // Add min, max and NaN
      const numberOfColorsInUpperRowForPoints = model.numberOfColorsInRange + 2; // Add min and max ; the lower row will be used for NaN color
      const textureDimensions = cellFlag
        ? [
            Math.min(
              Math.ceil(numberOfColorsForCells / maxTextureWidthForCells ** 0),
              maxTextureWidthForCells
            ),
            Math.min(
              Math.ceil(numberOfColorsForCells / maxTextureWidthForCells ** 1),
              maxTextureWidthForCells
            ),
            Math.min(
              Math.ceil(numberOfColorsForCells / maxTextureWidthForCells ** 2),
              maxTextureWidthForCells
            ),
          ]
        : [numberOfColorsInUpperRowForPoints, 2, 1];
      const textureSize =
        textureDimensions[0] * textureDimensions[1] * textureDimensions[2];

      const scalarsArray = new Float64Array(textureSize);

      // Colors for NaN by default
      scalarsArray.fill(NaN);

      // Colors in range
      // Add 2 to also get color for min and max
      const numberOfNonSpecialColors = model.numberOfColorsInRange;
      const numberOfNonNaNColors = numberOfNonSpecialColors + 2;
      const textureCoordinates = [0, 0, 0];

      const rangeMin = scaledRange[0];
      const rangeDifference = scaledRange[1] - scaledRange[0];
      for (let i = 0; i < numberOfNonNaNColors; ++i) {
        const scalarsArrayIndex = getIndexFromCoordinates(
          textureCoordinates,
          textureDimensions
        );

        // Minus 1 start at min color
        const intermediateValue =
          rangeMin +
          (rangeDifference * (i - 1)) / (numberOfNonSpecialColors - 1);
        const scalarValue = useLogScale
          ? 10.0 ** intermediateValue
          : intermediateValue;

        scalarsArray[scalarsArrayIndex] = scalarValue;

        // Colors are zigzagging to allow interpolation between two neighbor colors when coloring cells
        updateZigzaggingCoordinates(textureCoordinates, textureDimensions);
      }

      const scalarsDataArray = vtkDataArray.newInstance({
        numberOfComponents: 1,
        values: scalarsArray,
      });
      const colorsDataArray = model.lookupTable.mapScalars(
        scalarsDataArray,
        model.colorMode,
        0
      );

      model.colorTextureMap = vtkImageData.newInstance();
      model.colorTextureMap.setDimensions(textureDimensions);
      model.colorTextureMap.getPointData().setScalars(colorsDataArray);

      model.lookupTable.setAlpha(origAlpha);
    }

    // Although I like the feature of applying magnitude to single component
    // scalars, it is not how the old MapScalars for vertex coloring works.
    const scalarComponent =
      model.lookupTable.getVectorMode() === VectorMode.MAGNITUDE &&
      scalars.getNumberOfComponents() > 1
        ? -1
        : model.lookupTable.getVectorComponent();

    // Create new coordinates if necessary, this function uses cache if possible.
    // A zigzag pattern can't be used with point data, as interpolation of texture coordinates will be wrong
    // A zigzag pattern can be used with cell data, as there will be no texture coordinates interpolation
    // The texture generated using a zigzag pattern in one dimension is the same as without zigzag
    // Therefore, the same code can be used for texture generation of point/cell data but not for texture coordinates
    model.colorCoordinates = getOrCreateColorTextureCoordinates(
      scalars,
      scalarComponent,
      scaledRange,
      useLogScale,
      model.numberOfColorsInRange,
      model.colorTextureMap.getDimensions(),
      cellFlag
    );
  };

  publicAPI.getIsOpaque = () => {
    const input = publicAPI.getInputData();
    const gasResult = publicAPI.getAbstractScalars(
      input,
      model.scalarMode,
      model.arrayAccessMode,
      model.arrayId,
      model.colorByArrayName
    );
    const scalars = gasResult.scalars;
    if (!model.scalarVisibility || scalars == null) {
      // No scalar colors.
      return true;
    }
    const lut = publicAPI.getLookupTable();
    if (lut) {
      // Ensure that the lookup table is built
      lut.build();
      return lut.areScalarsOpaque(scalars, model.colorMode, -1);
    }
    return true;
  };

  publicAPI.canUseTextureMapForColoring = (scalars, cellFlag) => {
    if (cellFlag && !(model.colorMode === ColorMode.DIRECT_SCALARS)) {
      return true; // cell data always use textures.
    }

    if (!model.interpolateScalarsBeforeMapping) {
      return false; // user doesn't want us to use texture maps at all.
    }

    // index color does not use textures
    if (model.lookupTable && model.lookupTable.getIndexedLookup()) {
      return false;
    }

    if (!scalars) {
      // no scalars on this dataset, we don't care if texture is used at all.
      return false;
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
        inValue += rawLowData[pos + 2];
        inValue *= 256;
        inValue += rawLowData[pos + 1];
        inValue *= 256;
        inValue += rawLowData[pos];

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
  areScalarsMappedFromCells: false,

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
  numberOfColorsInRange: 0,

  forceCompileOnly: 0,

  useInvertibleColors: false,
  invertibleScalars: null,

  customShaderAttributes: [],
};

// ----------------------------------------------------------------------------

export function extend(publicAPI, model, initialValues = {}) {
  Object.assign(model, DEFAULT_VALUES, initialValues);

  // Inheritance
  vtkAbstractMapper3D.extend(publicAPI, model, initialValues);

  macro.get(publicAPI, model, [
    'areScalarsMappedFromCells',
    'colorCoordinates',
    'colorMapColors',
    'colorTextureMap',
    'numberOfColorsInRange',
    'selectionWebGLIdsToVTKIds',
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
    'static',
    'useLookupTableScalarRange',
    'customShaderAttributes', // point data array names that will be transferred to the VBO
  ]);
  macro.setGetArray(publicAPI, model, ['scalarRange'], 2);

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
