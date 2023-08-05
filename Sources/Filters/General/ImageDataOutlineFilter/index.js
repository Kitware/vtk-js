import macro from 'vtk.js/Sources/macros';
import vtkBoundingBox from 'vtk.js/Sources/Common/DataModel/BoundingBox';
import vtkCellArray from 'vtk.js/Sources/Common/Core/CellArray';
import vtkCubeSource from 'vtk.js/Sources/Filters/Sources/CubeSource';
import vtkPolyData from 'vtk.js/Sources/Common/DataModel/PolyData';
import vtkTransform from 'vtk.js/Sources/Common/Transform/Transform';

const { vtkErrorMacro } = macro;

// prettier-ignore
export const LINE_ARRAY = [
  2, 0, 1,
  2, 2, 3,
  2, 4, 5,
  2, 6, 7,
  2, 0, 2,
  2, 1, 3,
  2, 4, 6,
  2, 5, 7,
  2, 0, 4,
  2, 1, 5,
  2, 2, 6,
  2, 3, 7,
];

// ----------------------------------------------------------------------------
// vtkImageDataOutlineFilter methods
// ----------------------------------------------------------------------------

function vtkImageDataOutlineFilter(publicAPI, model) {
  // Set our className
  model.classHierarchy.push('vtkImageDataOutlineFilter');

  publicAPI.requestData = (inData, outData) => {
    // implement requestData
    const input = inData[0];

    if (!input || !input.isA('vtkImageData')) {
      vtkErrorMacro('Invalid or missing input');
      return;
    }

    if (!model._tmpOut) {
      // allocate output object if not done previously.
      model._tmpOut = vtkPolyData.newInstance();
    }

    // First create a cube polydata in the index-space of the image.
    const spatialExt = input.getSpatialExtent();
    if (!spatialExt) {
      vtkErrorMacro('Unable to fetch spatial extents of input image.');
      return;
    }

    model._boundingBox.setBounds(spatialExt);
    const lengths = model._boundingBox.getLengths();
    model._cubeSource.setXLength(lengths[0]);
    model._cubeSource.setYLength(lengths[1]);
    model._cubeSource.setZLength(lengths[2]);
    model._cubeSource.setCenter(model._boundingBox.getCenter());
    model._cubeSource.update();

    const out = model._cubeSource.getOutputData();
    model._tmpOut.getPoints().deepCopy(out.getPoints());

    // Now, transform the cube polydata points in-place
    // using the image's indexToWorld transformation.
    model._transform.setMatrix(input.getIndexToWorld());
    model._transform.transformPoints(
      model._tmpOut.getPoints().getData(),
      model._tmpOut.getPoints().getData()
    );

    // Lastly, generate the necessary cell arrays.
    if (model.generateFaces) {
      model._tmpOut.getPolys().deepCopy(out.getPolys());
    } else {
      model._tmpOut.getPolys().initialize();
    }
    if (model.generateLines) {
      model._tmpOut.getLines().deepCopy(model._lineCells);
    } else {
      model._tmpOut.getLines().initialize();
    }

    model._tmpOut.modified();
    outData[0] = model._tmpOut;
  };
}

// ----------------------------------------------------------------------------
// Object factory
// ----------------------------------------------------------------------------

const DEFAULT_VALUES = {
  generateFaces: false,
  generateLines: true,
};

// ----------------------------------------------------------------------------

export function extend(publicAPI, model, initialValues = {}) {
  Object.assign(model, DEFAULT_VALUES, initialValues);

  // Make this a VTK object
  macro.obj(publicAPI, model);

  macro.setGet(publicAPI, model, ['generateFaces', 'generateLines']);

  // Also make it an algorithm with one input and one output
  macro.algo(publicAPI, model, 1, 1);

  // Internal persistent objects
  model._boundingBox = vtkBoundingBox.newInstance();
  model._cubeSource = vtkCubeSource.newInstance();
  model._tmpOut = vtkPolyData.newInstance();
  model._lineCells = vtkCellArray.newInstance({
    values: Uint16Array.from(LINE_ARRAY),
  });
  model._transform = vtkTransform.newInstance();

  macro.moveToProtected(publicAPI, model, [
    'boundingBox',
    'cubeSource',
    'tmpOut',
    'lineCells',
    'transform',
  ]);

  // Object specific methods
  vtkImageDataOutlineFilter(publicAPI, model);
}

// ----------------------------------------------------------------------------

export const newInstance = macro.newInstance(
  extend,
  'vtkImageDataOutlineFilter'
);

// ----------------------------------------------------------------------------

export default { newInstance, extend };
