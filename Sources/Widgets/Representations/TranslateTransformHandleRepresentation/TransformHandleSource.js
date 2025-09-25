import macro from 'vtk.js/Sources/macros';
import vtkMatrixBuilder from 'vtk.js/Sources/Common/Core/MatrixBuilder';
import vtkAppendPolyData from 'vtk.js/Sources/Filters/General/AppendPolyData';
import vtkCylinderSource from 'vtk.js/Sources/Filters/Sources/CylinderSource';

function rotatePolyData(pd, direction) {
  const points = pd.getPoints().getData();

  vtkMatrixBuilder
    .buildFromRadian()
    .rotateFromDirections([0, 1, 0], direction)
    .apply(points);

  pd.getPoints().modified();
  pd.modified();
}

function translatePolyData(pd, translation) {
  const points = pd.getPoints().getData();

  vtkMatrixBuilder
    .buildFromRadian()
    .translate(...translation)
    .apply(points);

  pd.modified();
}

function vtkTransformHandleSource(publicAPI, model) {
  // Set our className
  model.classHierarchy.push('vtkTransformHandleSource');

  function requestData(inData, outData) {
    const cylinderSource = vtkCylinderSource.newInstance({
      height: model.height,
      initAngle: model.initAngle,
      radius: model.radius,
      resolution: model.resolution,
      capping: model.capping,
      pointType: model.pointType,
      center: [0, 0, 0],
      direction: [0, 1, 0],
    });

    const appendFilter = vtkAppendPolyData.newInstance();
    appendFilter.setInputConnection(cylinderSource.getOutputPort(), 0);

    if (inData[0]) {
      translatePolyData(inData[0], [0, model.height / 2, 0]);
      appendFilter.addInputData(inData[0]);
    }
    if (inData[1]) {
      rotatePolyData(inData[1], [0, -1, 0]);
      translatePolyData(inData[1], [0, -model.height / 2, 0]);
      appendFilter.addInputData(inData[1]);
    }

    const poly = appendFilter.getOutputData();
    const points = poly.getPoints().getData();

    // Apply transformation to the points coordinates
    vtkMatrixBuilder
      .buildFromRadian()
      .translate(...model.center)
      .rotateFromDirections([0, 1, 0], model.direction)
      .translate(...model.center.map((c) => c * -1))
      .apply(points);

    // Update output
    outData[0] = poly;
  }

  // Expose methods
  publicAPI.requestData = requestData;
}

// ----------------------------------------------------------------------------
// Object factory
// ----------------------------------------------------------------------------

const DEFAULT_VALUES = {
  capPolyData: null,
};

// ----------------------------------------------------------------------------

export function extend(publicAPI, model, initialValues = {}) {
  Object.assign(model, DEFAULT_VALUES, initialValues);

  vtkCylinderSource.extend(publicAPI, model, initialValues);
  macro.algo(publicAPI, model, 2, 1);

  vtkTransformHandleSource(publicAPI, model);
}

// ----------------------------------------------------------------------------

export const newInstance = macro.newInstance(
  extend,
  'vtkTransformHandleSource'
);

// ----------------------------------------------------------------------------

export default { newInstance, extend };
