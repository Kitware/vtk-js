import macro from 'vtk.js/Sources/macros';
import vtkImageData from 'vtk.js/Sources/Common/DataModel/ImageData';
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
        `Cannot handle unexpected ITK.js pixel type ${itkImage.imageType.pixelType}`
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

export default {
  convertItkToVtkImage,
  convertVtkToItkImage,
};
