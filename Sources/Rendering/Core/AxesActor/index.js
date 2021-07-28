import macro from 'vtk.js/Sources/macros';
import vtkMatrixBuilder from 'vtk.js/Sources/Common/Core/MatrixBuilder';
import vtkDataArray from 'vtk.js/Sources/Common/Core/DataArray';
import vtkActor from 'vtk.js/Sources/Rendering/Core/Actor';
import vtkMapper from 'vtk.js/Sources/Rendering/Core/Mapper';
import vtkArrowSource from 'vtk.js/Sources/Filters/Sources/ArrowSource';
import vtkAppendPolyData from 'vtk.js/Sources/Filters/General/AppendPolyData';

// ----------------------------------------------------------------------------

function centerDataSet(ds) {
  const bounds = ds.getPoints().getBounds();
  const center = [
    -(bounds[0] + bounds[1]) * 0.5,
    -(bounds[2] + bounds[3]) * 0.5,
    -(bounds[4] + bounds[5]) * 0.5,
  ];
  vtkMatrixBuilder
    .buildFromDegree()
    .translate(...center)
    .apply(ds.getPoints().getData());
}

// ----------------------------------------------------------------------------

function addColor(ds, r, g, b) {
  const size = ds.getPoints().getData().length;
  const rgbArray = new Uint8Array(size);
  let offset = 0;

  while (offset < size) {
    rgbArray[offset++] = r;
    rgbArray[offset++] = g;
    rgbArray[offset++] = b;
  }

  ds.getPointData().setScalars(
    vtkDataArray.newInstance({
      name: 'color',
      numberOfComponents: 3,
      values: rgbArray,
    })
  );
}

// ----------------------------------------------------------------------------
// vtkAxesActor
// ----------------------------------------------------------------------------

function vtkAxesActor(publicAPI, model) {
  // Set our className
  model.classHierarchy.push('vtkAxesActor');

  publicAPI.update = () => {
    const xAxis = vtkArrowSource
      .newInstance({ direction: [1, 0, 0], ...model.config })
      .getOutputData();
    centerDataSet(xAxis);
    addColor(xAxis, ...model.xAxisColor);

    const yAxis = vtkArrowSource
      .newInstance({ direction: [0, 1, 0], ...model.config })
      .getOutputData();
    centerDataSet(yAxis);
    addColor(yAxis, ...model.yAxisColor);

    const zAxis = vtkArrowSource
      .newInstance({ direction: [0, 0, 1], ...model.config })
      .getOutputData();
    centerDataSet(zAxis);
    addColor(zAxis, ...model.zAxisColor);

    const source = vtkAppendPolyData.newInstance();
    source.setInputData(xAxis);
    source.addInputData(yAxis);
    source.addInputData(zAxis);

    // set mapper
    const mapper = vtkMapper.newInstance();
    mapper.setInputConnection(source.getOutputPort());
    publicAPI.setMapper(mapper);
  };

  publicAPI.update();
}

// ----------------------------------------------------------------------------
// Object factory
// ----------------------------------------------------------------------------

export const DEFAULT_VALUES = {
  config: {
    tipResolution: 60,
    tipRadius: 0.1,
    tipLength: 0.2,
    shaftResolution: 60,
    shaftRadius: 0.03,
    invert: false,
  },
  xAxisColor: [255, 0, 0],
  yAxisColor: [255, 255, 0],
  zAxisColor: [0, 128, 0],
};

// ----------------------------------------------------------------------------

export function extend(publicAPI, model, initialValues = {}) {
  Object.assign(model, DEFAULT_VALUES, initialValues);

  // Inheritance
  vtkActor.extend(publicAPI, model, initialValues);

  macro.setGet(publicAPI, model, ['config']);
  macro.setGetArray(
    publicAPI,
    model,
    ['xAxisColor', 'yAxisColor', 'zAxisColor'],
    3,
    255
  );

  // Object methods
  vtkAxesActor(publicAPI, model);
}

// ----------------------------------------------------------------------------

export const newInstance = macro.newInstance(extend, 'vtkAxesActor');

// ----------------------------------------------------------------------------

export default { newInstance, extend };
