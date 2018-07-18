import macro from 'vtk.js/Sources/macro';
import vtkMapper from 'vtk.js/Sources/Rendering/Core/Mapper';
import vtkScalarsToColors from 'vtk.js/Sources/Common/Core/ScalarsToColors';

// ----------------------------------------------------------------------------
// vtkAbstractRepresentationProxy methods
// ----------------------------------------------------------------------------

function vtkAbstractRepresentationProxy(publicAPI, model) {
  // Set our className
  model.classHierarchy.push('vtkAbstractRepresentationProxy');

  function updateConnectivity() {
    if (model.input) {
      for (let i = 0; i < model.sourceDependencies.length; ++i) {
        model.sourceDependencies[i].setInputData(model.input.getDataset());
      }
    }
  }

  publicAPI.setInput = (source) => {
    if (model.sourceSubscription) {
      model.sourceSubscription.unsubscribe();
      model.sourceSubscription = null;
    }
    publicAPI.gcPropertyLinks('source');
    model.input = source;
    publicAPI.updateColorByDomain();

    if (model.input) {
      updateConnectivity();
      model.sourceSubscription = model.input.onDatasetChange(
        updateConnectivity
      );
    }

    // Allow dynamic registration of links at the source level
    if (model.links) {
      for (let i = 0; i < model.links.length; i++) {
        const { link, property, persistent, updateOnBind, type } = model.links[
          i
        ];
        if (type === undefined || type === 'source') {
          const sLink = source.getPropertyLink(link, persistent);
          publicAPI.registerPropertyLinkForGC(sLink, 'source');
          sLink.bind(publicAPI, property, updateOnBind);
        }
      }
    }
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

      if (model.mapper.setLookupTable) {
        model.mapper.setLookupTable(lookupTable);
      }
      publicAPI.rescaleTransferFunctionToDataRange(
        arrayName,
        arrayLocation,
        componentIndex
      );
    }

    // Not all mappers have those fields
    model.mapper.set(
      {
        colorByArrayName,
        colorMode,
        scalarMode,
        scalarVisibility,
      },
      true
    );
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

  publicAPI.delete = macro.chain(() => {
    if (model.sourceSubscription) {
      model.sourceSubscription.unsubscribe();
      model.sourceSubscription = null;
    }
  }, publicAPI.delete);
}

// ----------------------------------------------------------------------------
// Object factory
// ----------------------------------------------------------------------------

const DEFAULT_VALUES = {
  actors: [],
  volumes: [],
  sourceDependencies: [],
};

// ----------------------------------------------------------------------------

function extend(publicAPI, model, initialValues = {}) {
  Object.assign(model, DEFAULT_VALUES, initialValues);

  macro.obj(publicAPI, model);
  macro.get(publicAPI, model, ['input', 'mapper', 'actors', 'volumes']);

  // Object specific methods
  vtkAbstractRepresentationProxy(publicAPI, model);
  macro.proxy(publicAPI, model);
}

export default { extend };
