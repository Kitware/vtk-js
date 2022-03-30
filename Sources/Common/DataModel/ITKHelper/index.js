import macro from 'vtk.js/Sources/macros';
import vtkImageData from 'vtk.js/Sources/Common/DataModel/ImageData';
import vtkPolyData from 'vtk.js/Sources/Common/DataModel/PolyData';
import vtkDataArray from 'vtk.js/Sources/Common/Core/DataArray';

const { vtkErrorMacro } = macro;

// see itk.js PixelTypes.js
const ITKJSPixelTypes = {
  Unknown: 0,
  Scalar: 1,
  RGB: 2,
  RGBA: 3,
  Offset: 4,
  Vector: 5,
  Point: 6,
  CovariantVector: 7,
  SymmetricSecondRankTensor: 8,
  DiffusionTensor3D: 9,
  Complex: 10,
  FixedArray: 11,
  Array: 12,
  Matrix: 13,
  VariableLengthVector: 14,
  VariableSizeMatrix: 15,
};

// itk-wasm pixel types from https://github.com/InsightSoftwareConsortium/itk-wasm/blob/master/src/core/PixelTypes.ts
const ITKWASMPixelTypes = {
  Unknown: 'Unknown',
  Scalar: 'Scalar',
  RGB: 'RGB',
  RGBA: 'RGBA',
  Offset: 'Offset',
  Vector: 'Vector',
  Point: 'Point',
  CovariantVector: 'CovariantVector',
  SymmetricSecondRankTensor: 'SymmetricSecondRankTensor',
  DiffusionTensor3D: 'DiffusionTensor3D',
  Complex: 'Complex',
  FixedArray: 'FixedArray',
  Array: 'Array',
  Matrix: 'Matrix',
  VariableLengthVector: 'VariableLengthVector',
  VariableSizeMatrix: 'VariableSizeMatrix',
};

const vtkArrayTypeToItkComponentType = new Map([
  ['Uint8Array', 'uint8'],
  ['Int8Array', 'int8'],
  ['Uint16Array', 'uint16'],
  ['Int16Array', 'int16'],
  ['Uint32Array', 'uint32'],
  ['Int32Array', 'int32'],
  ['Float32Array', 'float32'],
  ['Float64Array', 'float64'],
]);

const itkComponentTypeToVtkArrayType = new Map([
  ['uint8', 'Uint8Array'],
  ['int8', 'Int8Array'],
  ['uint16', 'Uint16Array'],
  ['int16', 'Int16Array'],
  ['uint32', 'Uint32Array'],
  ['int32', 'Int32Array'],
  ['float32', 'Float32Array'],
  ['float64', 'Float64Array'],
]);

/**
 * Converts an itk-wasm Image to a vtk.js vtkImageData.
 *
 * Requires an itk-wasm Image as input.
 */
function convertItkToVtkImage(itkImage, options = {}) {
  const vtkImage = {
    origin: [0, 0, 0],
    spacing: [1, 1, 1],
  };

  const dimensions = [1, 1, 1];
  const direction = [1, 0, 0, 0, 1, 0, 0, 0, 1];

  // Check whether itkImage is an itk.js Image or an itk-wasm Image?
  const isITKWasm = itkImage.direction.data === undefined;
  const ITKPixelTypes = isITKWasm ? ITKWASMPixelTypes : ITKJSPixelTypes;

  for (let idx = 0; idx < itkImage.imageType.dimension; ++idx) {
    vtkImage.origin[idx] = itkImage.origin[idx];
    vtkImage.spacing[idx] = itkImage.spacing[idx];
    dimensions[idx] = itkImage.size[idx];
    for (let col = 0; col < itkImage.imageType.dimension; ++col) {
      // ITK (and VTKMath) use a row-major index axis, but the direction
      // matrix on the vtkImageData is a webGL matrix, which uses a
      // column-major data layout. Transpose the direction matrix from
      // itkImage when instantiating that vtkImageData direction matrix.
      if (isITKWasm) {
        direction[col + idx * 3] =
          itkImage.direction[idx + col * itkImage.imageType.dimension];
      } else {
        direction[col + idx * 3] =
          itkImage.direction.data[idx + col * itkImage.imageType.dimension];
      }
    }
  }

  // Create VTK Image Data
  const imageData = vtkImageData.newInstance(vtkImage);

  // Create VTK point data -- the data associated with the pixels / voxels
  const pointData = vtkDataArray.newInstance({
    name: options.scalarArrayName || 'Scalars',
    values: itkImage.data,
    numberOfComponents: itkImage.imageType.components,
  });

  imageData.setDirection(direction);
  imageData.setDimensions(...dimensions);
  // Always associate multi-component pixel types with vtk.js point data
  // scalars to facilitate multi-component volume rendering
  imageData.getPointData().setScalars(pointData);

  // Associate the point data that are 3D vectors / tensors
  // Refer to itk-js/src/PixelTypes.js for numerical values
  switch (
    isITKWasm
      ? ITKPixelTypes[itkImage.imageType.pixelType]
      : itkImage.imageType.pixelType
  ) {
    case ITKPixelTypes.Scalar:
      break;
    case ITKPixelTypes.RGB:
      break;
    case ITKPixelTypes.RGBA:
      break;
    case ITKPixelTypes.Offset:
      break;
    case ITKPixelTypes.Vector:
      if (
        itkImage.imageType.dimension === 3 &&
        itkImage.imageType.components === 3
      ) {
        imageData.getPointData().setVectors(pointData);
      }
      break;
    case ITKPixelTypes.Point:
      break;
    case ITKPixelTypes.CovariantVector:
      if (
        itkImage.imageType.dimension === 3 &&
        itkImage.imageType.components === 3
      ) {
        imageData.getPointData().setVectors(pointData);
      }
      break;
    case ITKPixelTypes.SymmetricSecondRankTensor:
      if (
        itkImage.imageType.dimension === 3 &&
        itkImage.imageType.components === 6
      ) {
        imageData.getPointData().setTensors(pointData);
      }
      break;
    case ITKPixelTypes.DiffusionTensor3D:
      if (
        itkImage.imageType.dimension === 3 &&
        itkImage.imageType.components === 6
      ) {
        imageData.getPointData().setTensors(pointData);
      }
      break;
    case ITKPixelTypes.Complex:
      break;
    case ITKPixelTypes.FixedArray:
      break;
    case ITKPixelTypes.Array:
      break;
    case ITKPixelTypes.Matrix:
      break;
    case ITKPixelTypes.VariableLengthVector:
      break;
    case ITKPixelTypes.VariableSizeMatrix:
      break;
    default:
      vtkErrorMacro(
        `Cannot handle unexpected itk-wasm pixel type ${itkImage.imageType.pixelType}`
      );
      return null;
  }

  return imageData;
}

/**
 * Converts a vtk.js vtkImageData to an itk-wasm Image.
 *
 * Requires a vtk.js vtkImageData as input.
 *
 */
function convertVtkToItkImage(vtkImage, copyData = false) {
  const dimension = 3;
  const itkImage = {
    imageType: {
      dimension,
      pixelType: ITKWASMPixelTypes.Scalar,
      componentType: '',
      components: 1,
    },
    name: 'vtkImageData',
    origin: vtkImage.getOrigin(),
    spacing: vtkImage.getSpacing(),
    direction: new Float64Array(9),
    size: vtkImage.getDimensions(),
  };

  const direction = vtkImage.getDirection();

  // Transpose the direction matrix from column-major to row-major
  for (let idx = 0; idx < dimension; ++idx) {
    for (let idy = 0; idy < dimension; ++idy) {
      itkImage.direction[idx + idy * dimension] =
        direction[idy + idx * dimension];
    }
  }

  const pointData = vtkImage.getPointData();

  let vtkArray;
  if (pointData.getTensors() !== null) {
    itkImage.imageType.pixelType = ITKWASMPixelTypes.DiffusionTensor3D;
    vtkArray = pointData.getTensors();
  } else if (pointData.getVectors() != null) {
    itkImage.imageType.pixelType = ITKWASMPixelTypes.Vector;
    vtkArray = pointData.getVectors();
  } else {
    vtkArray = pointData.getScalars();
  }

  itkImage.imageType.componentType = vtkArrayTypeToItkComponentType.get(
    vtkArray.getDataType()
  );

  if (copyData) {
    // Copy the data array
    itkImage.data = vtkArray.getData().slice(0);
  } else {
    itkImage.data = vtkArray.getData();
  }

  return itkImage;
}

/**
 * Converts an itk-wasm PolyData to a vtk.js vtkPolyData.
 *
 * Requires an itk-wasm PolyData as input.
 */
function convertItkToVtkPolyData(itkPolyData, options = {}) {
  const pointDataArrays = [];
  if (itkPolyData.pointData.length) {
    pointDataArrays.push({
      data: {
        vtkClass: 'vtkDataArray',
        name: options.pointDataName || 'PointData',
        numberOfComponents: itkPolyData.polyDataType.pointPixelComponents,
        size: itkPolyData.pointData.length,
        dataType: itkComponentTypeToVtkArrayType.get(
          itkPolyData.polyDataType.pointPixelComponentType
        ),
        buffer: itkPolyData.pointData.buffer,
        values: itkPolyData.pointData,
      },
    });
  }
  const cellDataArrays = [];
  if (itkPolyData.cellData.length) {
    cellDataArrays.push({
      data: {
        vtkClass: 'vtkDataArray',
        name: options.cellDataName || 'CellData',
        numberOfComponents: itkPolyData.polyDataType.pointPixelComponents,
        size: itkPolyData.cellData.length,
        dataType: itkComponentTypeToVtkArrayType.get(
          itkPolyData.polyDataType.pointPixelComponentType
        ),
        buffer: itkPolyData.cellData.buffer,
        values: itkPolyData.cellData,
      },
    });
  }
  const vtkPolyDataModel = {
    points: {
      vtkClass: 'vtkPoints',
      name: '_points',
      numberOfComponents: 3,
      size: itkPolyData.numberOfPoints,
      dataType: 'Float32Array',
      buffer: itkPolyData.points.buffer,
      values: itkPolyData.points,
    },
    verts: {
      vtkClass: 'vtkCellArray',
      name: '_verts',
      numberOfComponents: 1,
      size: itkPolyData.verticesBufferSize,
      dataType: 'Uint32Array',
      buffer: itkPolyData.vertices.buffer,
      values: itkPolyData.vertices,
    },
    lines: {
      vtkClass: 'vtkCellArray',
      name: '_lines',
      numberOfComponents: 1,
      size: itkPolyData.linesBufferSize,
      dataType: 'Uint32Array',
      buffer: itkPolyData.lines.buffer,
      values: itkPolyData.lines,
    },
    polys: {
      vtkClass: 'vtkCellArray',
      name: '_polys',
      numberOfComponents: 1,
      size: itkPolyData.polygonsBufferSize,
      dataType: 'Uint32Array',
      buffer: itkPolyData.polygons.buffer,
      values: itkPolyData.polygons,
    },
    strips: {
      vtkClass: 'vtkCellArray',
      name: '_strips',
      numberOfComponents: 1,
      size: itkPolyData.triangleStripsBufferSize,
      dataType: 'Uint32Array',
      buffer: itkPolyData.triangleStrips.buffer,
      values: itkPolyData.triangleStrips,
    },
    pointData: {
      vtkClass: 'vtkDataSetAttributes',
      activeGlobalIds: -1,
      activeNormals: -1,
      activePedigreeIds: -1,
      activeScalars: -1,
      activeTCoords: -1,
      activeTensors: -1,
      activeVectors: -1,
      copyFieldFlags: [],
      doCopyAllOff: false,
      doCopyAllOn: true,
      arrays: pointDataArrays,
    },
    cellData: {
      vtkClass: 'vtkDataSetAttributes',
      activeGlobalIds: -1,
      activeNormals: -1,
      activePedigreeIds: -1,
      activeScalars: -1,
      activeTCoords: -1,
      activeTensors: -1,
      activeVectors: -1,
      copyFieldFlags: [],
      doCopyAllOff: false,
      doCopyAllOn: true,
      arrays: cellDataArrays,
    },
  };

  // Create VTK PolyData
  const polyData = vtkPolyData.newInstance(vtkPolyDataModel);
  const pd = polyData.getPointData();
  const cd = polyData.getCellData();

  if (itkPolyData.pointData.length) {
    // Associate the point data that are 3D vectors / tensors
    switch (ITKWASMPixelTypes[itkPolyData.polyDataType.pointPixelType]) {
      case ITKWASMPixelTypes.Scalar:
        pd.setScalars(pd.getArrayByIndex(0));
        break;
      case ITKWASMPixelTypes.RGB:
        break;
      case ITKWASMPixelTypes.RGBA:
        break;
      case ITKWASMPixelTypes.Offset:
        break;
      case ITKWASMPixelTypes.Vector:
        if (itkPolyData.polyDataType.pointPixelComponents === 3) {
          pd.setVectors(pd.getArrayByIndex(0));
        }
        break;
      case ITKWASMPixelTypes.Point:
        break;
      case ITKWASMPixelTypes.CovariantVector:
        if (itkPolyData.polyDataType.pointPixelComponents === 3) {
          pd.setVectors(pd.getArrayByIndex(0));
        }
        break;
      case ITKWASMPixelTypes.SymmetricSecondRankTensor:
        if (itkPolyData.polyDataType.pointPixelComponents === 6) {
          pd.setTensors(pd.getArrayByIndex(0));
        }
        break;
      case ITKWASMPixelTypes.DiffusionTensor3D:
        if (itkPolyData.polyDataType.pointPixelComponents === 6) {
          pd.setTensors(pd.getArrayByIndex(0));
        }
        break;
      case ITKWASMPixelTypes.Complex:
        break;
      case ITKWASMPixelTypes.FixedArray:
        break;
      case ITKWASMPixelTypes.Array:
        break;
      case ITKWASMPixelTypes.Matrix:
        break;
      case ITKWASMPixelTypes.VariableLengthVector:
        break;
      case ITKWASMPixelTypes.VariableSizeMatrix:
        break;
      default:
        vtkErrorMacro(
          `Cannot handle unexpected itk-wasm pixel type ${itkPolyData.polyDataType.pointPixelType}`
        );
        return null;
    }
  }

  if (itkPolyData.cellData.length) {
    // Associate the cell data that are 3D vectors / tensors
    switch (ITKWASMPixelTypes[itkPolyData.polyDataType.cellPixelType]) {
      case ITKWASMPixelTypes.Scalar:
        cd.setScalars(cd.getArrayByIndex(0));
        break;
      case ITKWASMPixelTypes.RGB:
        break;
      case ITKWASMPixelTypes.RGBA:
        break;
      case ITKWASMPixelTypes.Offset:
        break;
      case ITKWASMPixelTypes.Vector:
        if (itkPolyData.polyDataType.pointPixelComponents === 3) {
          cd.setVectors(cd.getArrayByIndex(0));
        }
        break;
      case ITKWASMPixelTypes.Point:
        break;
      case ITKWASMPixelTypes.CovariantVector:
        if (itkPolyData.polyDataType.pointPixelComponents === 3) {
          cd.setVectors(cd.getArrayByIndex(0));
        }
        break;
      case ITKWASMPixelTypes.SymmetricSecondRankTensor:
        if (itkPolyData.polyDataType.pointPixelComponents === 6) {
          cd.setTensors(cd.getArrayByIndex(0));
        }
        break;
      case ITKWASMPixelTypes.DiffusionTensor3D:
        if (itkPolyData.polyDataType.pointPixelComponents === 6) {
          cd.setTensors(cd.getArrayByIndex(0));
        }
        break;
      case ITKWASMPixelTypes.Complex:
        break;
      case ITKWASMPixelTypes.FixedArray:
        break;
      case ITKWASMPixelTypes.Array:
        break;
      case ITKWASMPixelTypes.Matrix:
        break;
      case ITKWASMPixelTypes.VariableLengthVector:
        break;
      case ITKWASMPixelTypes.VariableSizeMatrix:
        break;
      default:
        vtkErrorMacro(
          `Cannot handle unexpected itk-wasm pixel type ${itkPolyData.polyDataType.pointPixelType}`
        );
        return null;
    }
  }
  return polyData;
}

/**
 * Converts a vtk.js vtkPolyData to an itk-wasm PolyData.
 *
 * Requires a vtk.js vtkPolyData as input.
 *
 */
function convertVtkToItkPolyData(polyData, options = {}) {
  const itkPolyData = {
    polyDataType: {
      pointPixelComponentType: 'float32',
      pointPixelComponents: 1,
      pointPixelType: 'Scalar',
      cellPixelComponentType: 'float32',
      cellPixelComponents: 1,
      cellPixelType: 'Scalar',
    },
    numberOfPoints: polyData.getNumberOfPoints(),
    points: polyData.getPoints().getData(),
    verticesBufferSize: polyData.getVerts().getNumberOfValues(),
    vertices: polyData.getVerts().getData(),
    linesBufferSize: polyData.getLines().getNumberOfValues(),
    lines: polyData.getLines().getData(),
    polygonsBufferSize: polyData.getPolys().getNumberOfValues(),
    polygons: polyData.getPolys().getData(),
    triangleStripsBufferSize: polyData.getStrips().getNumberOfValues(),
    triangleStrips: polyData.getStrips().getData(),
    numberOfPointPixels: 0,
    pointData: new Float32Array(),
    numberOfCellPixels: 0,
    cellData: new Float32Array(),
  };

  const pd = polyData.getPointData();
  if (pd.getNumberOfArrays()) {
    const pdArray = options.pointDataName
      ? pd.getArrayByName(options.pointDataName)
      : pd.getArrayByIndex(0);
    itkPolyData.numberOfPointPixels = pdArray.getNumberOfTuples();
    itkPolyData.pointData = pdArray.getData();
    itkPolyData.polyDataType.pointPixelComponentType =
      vtkArrayTypeToItkComponentType.get(pdArray.getDataType());
    // default to the same type
    itkPolyData.polyDataType.cellPixelComponentType =
      itkPolyData.polyDataType.pointPixelComponentType;
    itkPolyData.polyDataType.pointPixelComponents =
      pdArray.getNumberOfComponents();
    itkPolyData.polyDataType.cellPixelComponents =
      itkPolyData.polyDataType.pointPixelComponents;
    if (pd.getTensors() === pdArray) {
      itkPolyData.polyDataType.pointPixelType =
        ITKWASMPixelTypes.SymmetricSecondRankTensor;
    } else if (pd.getVectors() === pdArray) {
      itkPolyData.polyDataType.pointPixelType = ITKWASMPixelTypes.Vector;
    }
    itkPolyData.polyDataType.cellPixelType =
      itkPolyData.polyDataType.pointPixelType;
  }

  const cd = polyData.getCellData();
  if (cd.getNumberOfArrays()) {
    const cdArray = options.cellDataName
      ? pd.getArrayByName(options.cellDataName)
      : pd.getArrayByIndex(0);
    itkPolyData.numberOfCellPixels = cdArray.getNumberOfTuples();
    itkPolyData.cellData = cdArray.getData();
    itkPolyData.polyDataType.cellPixelComponentType =
      vtkArrayTypeToItkComponentType.get(cdArray.getDataType());
    itkPolyData.polyDataType.cellPixelComponents =
      cdArray.getNumberOfComponents();
    if (cd.getTensors() === cdArray) {
      itkPolyData.polyDataType.cellPixelType =
        ITKWASMPixelTypes.SymmetricSecondRankTensor;
    } else if (cd.getVectors() === cdArray) {
      itkPolyData.polyDataType.cellPixelType = ITKWASMPixelTypes.Vector;
    } else {
      itkPolyData.polyDataType.cellPixelType = ITKWASMPixelTypes.Scalar;
    }
  }

  return itkPolyData;
}

export default {
  convertItkToVtkImage,
  convertVtkToItkImage,
  convertItkToVtkPolyData,
  convertVtkToItkPolyData,
};
