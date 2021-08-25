import macro from 'vtk.js/Sources/macros';
import vtkImageData from 'vtk.js/Sources/Common/DataModel/ImageData';
import vtkDataArray from 'vtk.js/Sources/Common/Core/DataArray';

const { vtkErrorMacro } = macro;

// see itk.js/PixelTypes.js
const ITKPixelTypes = {
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

/**
 * Converts an itk.js image to a vtk.js image.
 *
 * Requires an itk.js image as input.
 */
function convertItkToVtkImage(itkImage, options = {}) {
  const vtkImage = {
    origin: [0, 0, 0],
    spacing: [1, 1, 1],
  };

  const dimensions = [1, 1, 1];
  const direction = [1, 0, 0, 0, 1, 0, 0, 0, 1];

  for (let idx = 0; idx < itkImage.imageType.dimension; ++idx) {
    vtkImage.origin[idx] = itkImage.origin[idx];
    vtkImage.spacing[idx] = itkImage.spacing[idx];
    dimensions[idx] = itkImage.size[idx];
    for (let col = 0; col < itkImage.imageType.dimension; ++col) {
      // ITK (and VTKMath) use a row-major index axis, but the direction
      // matrix on the vtkImageData is a webGL matrix, which uses a
      // column-major data layout. Transpose the direction matrix from
      // itkImage when instantiating that vtkImageData direction matrix.
      direction[col + idx * 3] =
        itkImage.direction.data[idx + col * itkImage.imageType.dimension];
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
  switch (itkImage.imageType.pixelType) {
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

const vtkArrayTypeToItkComponentType = new Map([
  ['Uint8Array', 'uint8_t'],
  ['Int8Array', 'int8_t'],
  ['Uint16Array', 'uint16_t'],
  ['Int16Array', 'int16_t'],
  ['Uint32Array', 'uint32_t'],
  ['Int32Array', 'int32_t'],
  ['Float32Array', 'float'],
  ['Float64Array', 'double'],
]);

/**
 * Converts a vtk.js image to an itk.js image.
 *
 * Requires a vtk.js image as input.
 */
function convertVtkToItkImage(vtkImage, copyData = false) {
  const itkImage = {
    imageType: {
      dimension: 3,
      pixelType: ITKPixelTypes.Scalar,
      componentType: '',
      components: 1,
    },
    name: 'name',
    origin: vtkImage.getOrigin(),
    spacing: vtkImage.getSpacing(),
    direction: {
      data: [1, 0, 0, 0, 1, 0, 0, 0, 1],
    },
    size: vtkImage.getDimensions(),
  };

  const direction = vtkImage.getDirection();

  const dimension = itkImage.size.length;
  itkImage.imageType.dimension = dimension;
  itkImage.direction.rows = dimension;
  itkImage.direction.columns = dimension;

  // Transpose the direction matrix from column-major to row-major
  for (let idx = 0; idx < dimension; ++idx) {
    for (let idy = 0; idy < dimension; ++idy) {
      itkImage.direction.data[idx + idy * dimension] =
        direction[idy + idx * dimension];
    }
  }

  const pointData = vtkImage.getPointData();

  let vtkArray;
  if (pointData.getTensors() !== null) {
    itkImage.imageType.pixelType = ITKPixelTypes.DiffusionTensor3D;
    vtkArray = pointData.getTensors();
  } else if (pointData.getVectors() != null) {
    itkImage.imageType.pixelType = ITKPixelTypes.Vector;
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
