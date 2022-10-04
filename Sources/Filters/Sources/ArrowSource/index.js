import macro from 'vtk.js/Sources/macros';
import vtkAppendPolyData from 'vtk.js/Sources/Filters/General/AppendPolyData';
import vtkConeSource from 'vtk.js/Sources/Filters/Sources/ConeSource';
import vtkCylinderSource from 'vtk.js/Sources/Filters/Sources/CylinderSource';
import vtkMatrixBuilder from 'vtk.js/Sources/Common/Core/MatrixBuilder';

// ----------------------------------------------------------------------------
// vtkArrowSource methods
// ----------------------------------------------------------------------------

function vtkArrowSource(publicAPI, model) {
  // Set our className
  model.classHierarchy.push('vtkArrowSource');

  function requestData(inData, outData) {
    if (model.deleted) {
      return;
    }

    const cylinder = vtkCylinderSource.newInstance({ capping: true });
    cylinder.setResolution(model.shaftResolution);
    cylinder.setRadius(model.shaftRadius);
    cylinder.setHeight(1.0 - model.tipLength);
    cylinder.setCenter(0, (1.0 - model.tipLength) * 0.5, 0.0);

    const cylinderPD = cylinder.getOutputData();
    const cylinderPts = cylinderPD.getPoints().getData();
    const cylinderNormals = cylinderPD.getPointData().getNormals().getData();

    // Apply transformation to the cylinder
    vtkMatrixBuilder
      .buildFromDegree()
      .rotateZ(-90)
      .apply(cylinderPts)
      .apply(cylinderNormals);

    const cone = vtkConeSource.newInstance();
    cone.setResolution(model.tipResolution);
    cone.setHeight(model.tipLength);
    cone.setRadius(model.tipRadius);

    const conePD = cone.getOutputData();
    const conePts = conePD.getPoints().getData();

    // Apply transformation to the cone
    vtkMatrixBuilder
      .buildFromRadian()
      .translate(1.0 - model.tipLength * 0.5, 0.0, 0.0)
      .apply(conePts);

    const append = vtkAppendPolyData.newInstance();
    append.setInputData(cylinderPD);
    append.addInputData(conePD);

    const appendPD = append.getOutputData();
    const appendPts = appendPD.getPoints().getData();
    // Center the arrow about [0, 0, 0]
    vtkMatrixBuilder
      .buildFromRadian()
      .translate(-0.5 + model.tipLength * 0.5, 0.0, 0.0)
      .apply(appendPts);
    if (model.invert) {
      // Apply transformation to the arrow
      vtkMatrixBuilder
        .buildFromRadian()
        .rotateFromDirections([1, 0, 0], model.direction)
        .scale(-1, -1, -1)
        .apply(appendPts);

      // Update output
      outData[0] = appendPD;
    } else {
      // Apply transformation to the arrow
      vtkMatrixBuilder
        .buildFromRadian()
        .rotateFromDirections([1, 0, 0], model.direction)
        .scale(1, 1, 1)
        .apply(appendPts);

      // Update output
      outData[0] = append.getOutputData();
    }
  }

  // Expose methods
  publicAPI.requestData = requestData;
}

// ----------------------------------------------------------------------------
// Object factory
// ----------------------------------------------------------------------------

const DEFAULT_VALUES = {
  tipResolution: 6,
  tipRadius: 0.1,
  tipLength: 0.35,
  shaftResolution: 6,
  shaftRadius: 0.03,
  invert: false,
  direction: [1.0, 0.0, 0.0],
  pointType: 'Float64Array',
};

// ----------------------------------------------------------------------------

export function extend(publicAPI, model, initialValues = {}) {
  Object.assign(model, DEFAULT_VALUES, initialValues);

  // Build VTK API
  macro.obj(publicAPI, model);
  macro.setGet(publicAPI, model, [
    'tipResolution',
    'tipRadius',
    'tipLength',
    'shaftResolution',
    'shaftRadius',
    'invert',
  ]);
  macro.setGetArray(publicAPI, model, ['direction'], 3);
  macro.algo(publicAPI, model, 0, 1);
  vtkArrowSource(publicAPI, model);
}

// ----------------------------------------------------------------------------

export const newInstance = macro.newInstance(extend, 'vtkArrowSource');

// ----------------------------------------------------------------------------

export default { newInstance, extend };
