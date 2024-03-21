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

function shiftDataset(ds, axis, invert = false) {
  const bounds = ds.getPoints().getBounds();
  const center = [0, 0, 0];
  if (invert) {
    center[axis] = -bounds[axis * 2 + 1];
  } else {
    center[axis] = -bounds[axis * 2];
  }
  vtkMatrixBuilder
    .buildFromDegree()
    .translate(...center)
    .apply(ds.getPoints().getData());
}

// ----------------------------------------------------------------------------

function addColor(ds, r, g, b) {
  const size = ds.getPoints().getData().length;
  const rgbArray = new Uint8ClampedArray(size);
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

  const _mapper = vtkMapper.newInstance();
  publicAPI.setMapper(_mapper);

  publicAPI.update = () => {
    let currentConfig = {
      ...model.config,
      ...model.xConfig,
    };

    const xAxis = vtkArrowSource
      .newInstance({ direction: [1, 0, 0], ...currentConfig })
      .getOutputData();
    if (model.config.recenter) {
      centerDataSet(xAxis);
    } else {
      shiftDataset(xAxis, 0, currentConfig.invert);
    }
    addColor(xAxis, ...currentConfig.color);

    currentConfig = {
      ...model.config,
      ...model.yConfig,
    };
    const yAxis = vtkArrowSource
      .newInstance({ direction: [0, 1, 0], ...currentConfig })
      .getOutputData();
    if (model.config.recenter) {
      centerDataSet(yAxis);
    } else {
      shiftDataset(yAxis, 1, currentConfig.invert);
    }
    addColor(yAxis, ...currentConfig.color);

    currentConfig = {
      ...model.config,
      ...model.zConfig,
    };
    const zAxis = vtkArrowSource
      .newInstance({ direction: [0, 0, 1], ...currentConfig })
      .getOutputData();
    if (model.config.recenter) {
      centerDataSet(zAxis);
    } else {
      shiftDataset(zAxis, 2, currentConfig.invert);
    }
    addColor(zAxis, ...currentConfig.color);

    const source = vtkAppendPolyData.newInstance();
    source.setInputData(xAxis);
    source.addInputData(yAxis);
    source.addInputData(zAxis);

    _mapper.setInputConnection(source.getOutputPort());
  };

  publicAPI.update();
  const _debouncedUpdate = macro.debounce(publicAPI.update, 0);

  publicAPI.setXAxisColor = (color) =>
    publicAPI.setXConfig({ ...publicAPI.getXConfig(), color });

  publicAPI.setYAxisColor = (color) =>
    publicAPI.setYConfig({ ...publicAPI.getYConfig(), color });

  publicAPI.setZAxisColor = (color) =>
    publicAPI.setZConfig({ ...publicAPI.getZConfig(), color });

  publicAPI.getXAxisColor = () => model.getXConfig().color;

  publicAPI.getYAxisColor = () => model.getYConfig().color;

  publicAPI.getZAxisColor = () => model.getZConfig().color;

  model._onConfigChanged = _debouncedUpdate;
  model._onXConfigChanged = _debouncedUpdate;
  model._onYConfigChanged = _debouncedUpdate;
  model._onZConfigChanged = _debouncedUpdate;
}

// ----------------------------------------------------------------------------
// Object factory
// ----------------------------------------------------------------------------

function defaultValues(initialValues) {
  return {
    config: {
      recenter: true,
      tipResolution: 60,
      tipRadius: 0.1,
      tipLength: 0.2,
      shaftResolution: 60,
      shaftRadius: 0.03,
      invert: false,
      ...initialValues?.config,
    },
    xConfig: {
      color: [255, 0, 0],
      invert: false,
      ...initialValues?.xConfig,
    },
    yConfig: {
      color: [255, 255, 0],
      invert: false,
      ...initialValues?.yConfig,
    },
    zConfig: {
      color: [0, 128, 0],
      invert: false,
      ...initialValues?.zConfig,
    },
  };
}

// ----------------------------------------------------------------------------

export function extend(publicAPI, model, initialValues = {}) {
  // Inheritance
  vtkActor.extend(publicAPI, model, defaultValues(initialValues));

  macro.setGet(publicAPI, model, ['config', 'xConfig', 'yConfig', 'zConfig']);

  // Object methods
  vtkAxesActor(publicAPI, model);
}

// ----------------------------------------------------------------------------

export const newInstance = macro.newInstance(extend, 'vtkAxesActor');

// ----------------------------------------------------------------------------

export default { newInstance, extend };
