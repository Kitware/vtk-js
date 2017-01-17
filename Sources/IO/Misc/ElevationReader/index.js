import * as macro from '../../../macro';
import vtkDataArray from '../../../Common/Core/DataArray';
import vtkPolyData from '../../../Common/DataModel/PolyData';
import vtkCellArray from '../../../Common/Core/CellArray';
import DataAccessHelper from '../../Core/DataAccessHelper';

// ----------------------------------------------------------------------------
// vtkElevationReader methods
// ----------------------------------------------------------------------------

export function vtkElevationReader(publicAPI, model) {
  // Set our className
  model.classHierarchy.push('vtkElevationReader');

  // Create default dataAccessHelper if not available
  if (!model.dataAccessHelper) {
    model.dataAccessHelper = DataAccessHelper.get('http');
  }

  // Internal method to fetch Array
  function fetchCSV(url) {
    return model.dataAccessHelper.fetchText(publicAPI, url);
  }

  // Set DataSet url
  publicAPI.setUrl = (url) => {
    if (url.indexOf('.csv') === -1) {
      model.baseURL = url;
      model.url = `${url}/index.csv`;
    } else {
      model.url = url;

      // Remove the file in the URL
      const path = url.split('/');
      path.pop();
      model.baseURL = path.join('/');
    }

    // Fetch metadata
    return publicAPI.loadData();
  };

  // Fetch the actual data arrays
  publicAPI.loadData = () => {
    const promise = fetchCSV(model.url);

    promise.then(
      (csv) => {
        model.csv = csv;
        model.elevation = [];

        // Parse data
        const lines = model.csv.split('\n');
        lines.forEach((line, lineIdx) => {
          model.elevation.push(line.split(',').map(str => Number(str)));
        });
        publicAPI.modified();
      });

    return promise;
  };


  publicAPI.requestData = (inData, outData) => {
    const polydata = vtkPolyData.newInstance();

    if (model.elevation) {
      const jSize = model.elevation.length;
      const iSize = model.elevation[0].length;

      // Handle points and polys
      const points = polydata.getPoints();
      points.setNumberOfPoints(iSize * jSize, 3);
      const pointValues = points.getData();

      const polys = vtkCellArray.newInstance({ size: (5 * (iSize - 1) * (jSize - 1)) });
      polydata.setPolys(polys);
      const polysValues = polys.getData();
      let cellOffset = 0;

      // Texture coords
      const tcData = new Float32Array(iSize * jSize * 2);
      const tcoords = vtkDataArray.newInstance({ numberOfComponents: 2, values: tcData, name: 'TextureCoordinates' });
      polydata.getPointData().setTCoords(tcoords);

      for (let j = 0; j < jSize; j++) {
        for (let i = 0; i < iSize; i++) {
          const offsetIdx = ((j * iSize) + i);
          const offsetPt = 3 * offsetIdx;

          // Fill points coordinates
          pointValues[offsetPt + 0] = model.origin[0] + (i * model.xSpacing);
          pointValues[offsetPt + 1] = model.origin[1] + (j * model.ySpacing);
          pointValues[offsetPt + 2] = model.origin[2] + (model.elevation[j][i] * model.zScaling);

          // fill in tcoords
          tcData[(offsetIdx * 2)] = i / (iSize - 1.0);
          tcData[(offsetIdx * 2) + 1] = 1.0 - j / (jSize - 1.0);

          // Fill polys
          if (i > 0 && j > 0) {
            polysValues[cellOffset++] = 4;
            polysValues[cellOffset++] = offsetIdx;
            polysValues[cellOffset++] = offsetIdx - 1;
            polysValues[cellOffset++] = offsetIdx - 1 - iSize;
            polysValues[cellOffset++] = offsetIdx - iSize;
          }
        }
      }
    }

    model.output[0] = polydata;
  };

  // return Busy state
  publicAPI.isBusy = () => !!model.requestCount;
}

// ----------------------------------------------------------------------------
// Object factory
// ----------------------------------------------------------------------------

const DEFAULT_VALUES = {
  origin: [0, 0, 0],
  xSpacing: 1,
  ySpacing: 1,
  zScaling: 1,
  requestCount: 0,
  // baseURL: null,
  // dataAccessHelper: null,
  // url: null,
};

// ----------------------------------------------------------------------------


export function extend(publicAPI, model, initialValues = {}) {
  Object.assign(model, DEFAULT_VALUES, initialValues);

  // Build VTK API
  macro.obj(publicAPI, model);
  macro.get(publicAPI, model, [
    'url',
    'baseURL',
  ]);
  macro.setGet(publicAPI, model, [
    'dataAccessHelper',
    'xSpacing',
    'ySpacing',
    'zScaling',
  ]);
  macro.algo(publicAPI, model, 0, 1);
  macro.event(publicAPI, model, 'busy');

  // Object methods
  vtkElevationReader(publicAPI, model);
}

// ----------------------------------------------------------------------------

export const newInstance = macro.newInstance(extend);

// ----------------------------------------------------------------------------

export default { newInstance, extend };
