import macro from 'vtk.js/Sources/macro';
import vtkMapper from 'vtk.js/Sources/Rendering/Core/Mapper';
import vtkScalarsToColors from 'vtk.js/Sources/Common/Core/ScalarsToColors';

// ----------------------------------------------------------------------------

function connectMapper(mapper, input) {
  const algo = input.getAlgo();
  if (algo) {
    mapper.setInputConnection(algo.getOutputPort());
  } else {
    mapper.setInputData(input.getDataset());
  }
}

// ----------------------------------------------------------------------------
// vtkAbstractRepresentationProxy methods
// ----------------------------------------------------------------------------

function vtkAbstractRepresentationProxy(publicAPI, model) {
  // Set our className
  model.classHierarchy.push('vtkAbstractRepresentationProxy');

  publicAPI.setInput = (source) => {
    publicAPI.gcPropertyLinks();
    model.input = source;
    publicAPI.updateColorByDomain();
  };

  publicAPI.getInputDataSet = () =>
    model.input ? model.input.getDataset() : null;

  publicAPI.getDataArray = (arrayName, arrayLocation) => {
    const [selectedArray, selectedLocation] = publicAPI.getColorBy();
    const ds = publicAPI.getInputDataSet();
    const fields = ds
      ? ds.getReferenceByName(arrayLocation || selectedLocation)
      : null;
    const array = fields
      ? fields.getArrayByName(arrayName || selectedArray)
      : null;
    return array;
  };

  publicAPI.getLookupTableProxy = (arrayName) => {
    const arrayNameToUse = arrayName || publicAPI.getColorBy()[0];
    if (arrayNameToUse) {
      return model.proxyManager.getLookupTable(arrayNameToUse);
    }
    return null;
  };

  publicAPI.setLookupTableProxy = (lutProxy) => {
    // In place edits, no need to re-assign it...
    console.log(
      'setLookupTable',
      lutProxy.getPresetName(),
      lutProxy.getDataRange()
    );
  };

  publicAPI.getPiecewiseFunctionProxy = (arrayName) => {
    const arrayNameToUse = arrayName || publicAPI.getColorBy()[0];
    if (arrayNameToUse) {
      return model.proxyManager.getPiecewiseFunction(arrayNameToUse);
    }
    return null;
  };

  publicAPI.setPiecewiseFunctionProxy = (pwfProxy) => {
    // In place edits, no need to re-assign it...
    console.log('setPiecewiseFunction', pwfProxy.getDataRange());
  };

  publicAPI.rescaleTransferFunctionToDataRange = (n, l, c = -1) => {
    const array = publicAPI.getDataArray(n, l);
    const dataRange = array.getRange(c);
    model.proxyManager.rescaleTransferFunctionToDataRange(n, dataRange);
  };

  publicAPI.isVisible = () => {
    if (model.actors.length) {
      return model.actors[0].getVisibility();
    }
    if (model.volumes.length) {
      return model.volumes[0].getVisibility();
    }
    return false;
  };

  publicAPI.setVisibility = (visible) => {
    let count = model.actors.length;
    while (count--) {
      model.actors[count].setVisibility(visible);
    }
    count = model.volumes.length;
    while (count--) {
      model.volumes[count].setVisibility(visible);
    }
  };

  publicAPI.setColorBy = (arrayName, arrayLocation, componentIndex = -1) => {
    let colorMode = vtkMapper.ColorMode.DEFAULT;
    let scalarMode = vtkMapper.ScalarMode.DEFAULT;
    const colorByArrayName = arrayName;
    const interpolateScalarsBeforeMapping = arrayLocation === 'pointData';
    const activeArray = publicAPI.getDataArray(arrayName, arrayLocation);
    const scalarVisibility = !!activeArray;
    const lookupTable = arrayName
      ? publicAPI.getLookupTableProxy(arrayName).getLookupTable()
      : null;

    if (lookupTable) {
      if (componentIndex === -1) {
        lookupTable.setVectorModeToMagnitude();
      } else {
        lookupTable.setVectorModeToComponent();
        lookupTable.setVectorComponent(componentIndex);
      }
    }

    if (scalarVisibility) {
      colorMode = vtkMapper.ColorMode.MAP_SCALARS;
      scalarMode =
        arrayLocation === 'pointData'
          ? vtkMapper.ScalarMode.USE_POINT_FIELD_DATA
          : vtkMapper.ScalarMode.USE_CELL_FIELD_DATA;

      model.mapper.setLookupTable(lookupTable);
      publicAPI.rescaleTransferFunctionToDataRange(
        arrayName,
        arrayLocation,
        componentIndex
      );
    }

    model.mapper.set({
      colorByArrayName,
      colorMode,
      interpolateScalarsBeforeMapping,
      scalarMode,
      scalarVisibility,
    });
  };

  publicAPI.getColorBy = () => {
    if (!model.mapper.getColorByArrayName) {
      const ds = publicAPI.getInputDataSet();
      if (ds.getPointData().getScalars()) {
        return [
          ds
            .getPointData()
            .getScalars()
            .getName(),
          'pointData',
          -1,
        ];
      }
      if (ds.getCellData().getScalars()) {
        return [
          ds
            .getCellData()
            .getScalars()
            .getName(),
          'cellData',
          -1,
        ];
      }
      if (ds.getPointData().getNumberOfArrays()) {
        return [
          ds
            .getPointData()
            .getArrayByIndex(0)
            .getName(),
          'pointData',
          -1,
        ];
      }
      if (ds.getCellData().getNumberOfArrays()) {
        return [
          ds
            .getCellData()
            .getArrayByIndex(0)
            .getName(),
          'cellData',
          -1,
        ];
      }
      return [];
    }
    const result = [];
    const {
      colorByArrayName,
      colorMode,
      scalarMode,
      scalarVisibility,
    } = model.mapper.get(
      'colorByArrayName',
      'colorMode',
      'scalarMode',
      'scalarVisibility'
    );

    if (scalarVisibility && colorByArrayName) {
      result.push(colorByArrayName);
      result.push(
        scalarMode === vtkMapper.ScalarMode.USE_POINT_FIELD_DATA
          ? 'pointData'
          : 'cellData'
      );
    }

    if (colorMode === vtkMapper.ColorMode.MAP_SCALARS && colorByArrayName) {
      const lut = publicAPI
        .getLookupTableProxy(colorByArrayName)
        .getLookupTable();
      const componentIndex =
        lut.getVectorMode() === vtkScalarsToColors.VectorMode.MAGNITUDE
          ? -1
          : lut.getVectorComponent();
      result.push(componentIndex);
    }
    return result;
  };

  publicAPI.listDataArrays = () => {
    const arrayList = [];
    if (!model.input) {
      return arrayList;
    }

    const dataset = publicAPI.getInputDataSet();

    // Point data
    const pointData = dataset.getPointData();
    let size = pointData.getNumberOfArrays();
    for (let idx = 0; idx < size; idx++) {
      const array = pointData.getArrayByIndex(idx);
      arrayList.push({
        name: array.getName(),
        location: 'pointData',
        numberOfComponents: array.getNumberOfComponents(),
        dataRange: array.getRange(),
      });
    }

    // Cell data
    const cellData = dataset.getCellData();
    size = cellData.getNumberOfArrays();
    for (let idx = 0; idx < size; idx++) {
      const array = cellData.getArrayByIndex(idx);
      arrayList.push({
        name: array.getName(),
        location: 'cellData',
        numberOfComponents: array.getNumberOfComponents(),
        dataRange: array.getRange(),
      });
    }

    return arrayList;
  };

  publicAPI.updateColorByDomain = () => {
    publicAPI.updateProxyProperty('colorBy', {
      domain: {
        arrays: publicAPI.listDataArrays(),
        solidColor: !model.disableSolidColor,
      },
    });
  };
}

// ----------------------------------------------------------------------------
// Object factory
// ----------------------------------------------------------------------------

const DEFAULT_VALUES = {
  actors: [],
  volumes: [],
};

// ----------------------------------------------------------------------------

function extend(publicAPI, model, initialValues = {}) {
  Object.assign(model, DEFAULT_VALUES, initialValues);

  macro.obj(publicAPI, model);
  macro.get(publicAPI, model, ['input', 'actors', 'volumes']);

  // Object specific methods
  vtkAbstractRepresentationProxy(publicAPI, model);
  macro.proxy(publicAPI, model);
}

export default { extend, connectMapper };
