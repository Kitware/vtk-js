import macro from 'vtk.js/Sources/macros';
import vtkDataArray from 'vtk.js/Sources/Common/Core/DataArray';
import vtkPolyData from 'vtk.js/Sources/Common/DataModel/PolyData';
import vtkCellArray from 'vtk.js/Sources/Common/Core/CellArray';
import DataAccessHelper from 'vtk.js/Sources/IO/Core/DataAccessHelper';

// Enable several sources for DataAccessHelper
import 'vtk.js/Sources/IO/Core/DataAccessHelper/LiteHttpDataAccessHelper'; // Just need HTTP
// import 'vtk.js/Sources/IO/Core/DataAccessHelper/HttpDataAccessHelper'; // HTTP + gz
// import 'vtk.js/Sources/IO/Core/DataAccessHelper/HtmlDataAccessHelper'; // html + base64 + zip
// import 'vtk.js/Sources/IO/Core/DataAccessHelper/JSZipDataAccessHelper'; // zip

// ----------------------------------------------------------------------------
// vtkElevationReader methods
// ----------------------------------------------------------------------------

function vtkElevationReader(publicAPI, model) {
  // Set our className
  model.classHierarchy.push('vtkElevationReader');

  // Create default dataAccessHelper if not available
  if (!model.dataAccessHelper) {
    model.dataAccessHelper = DataAccessHelper.get('http');
  }

  // Internal method to fetch Array
  function fetchCSV(url, options) {
    return model.dataAccessHelper.fetchText(publicAPI, url, options);
  }

  // Set DataSet url
  publicAPI.setUrl = (url, options) => {
    model.url = url;

    // Fetch metadata
    return publicAPI.loadData(options);
  };

  // Fetch the actual data arrays
  publicAPI.loadData = (options) =>
    fetchCSV(model.url, options).then((csv) => {
      publicAPI.parseAsText(csv);
      return true;
    });

  publicAPI.parseAsText = (csv) => {
    model.csv = csv;
    model.elevation = [];

    // Parse data
    const lines = model.csv.split('\n');
    lines.forEach((line, lineIdx) => {
      model.elevation.push(line.split(',').map((str) => Number(str)));
    });
    publicAPI.modified();
  };

  publicAPI.requestData = (inData, outData) => {
    const polydata = vtkPolyData.newInstance();
    polydata.getPoints().setData(new Float32Array(0, 0, 0, 1, 1, 1), 3);

    if (model.elevation) {
      const jSize = model.elevation.length;
      const iSize = model.elevation[0].length;

      // Handle points and polys
      const points = polydata.getPoints();
      points.setNumberOfPoints(iSize * jSize, 3);
      const pointValues = points.getData();

      const polys = vtkCellArray.newInstance({
        size: 5 * (iSize - 1) * (jSize - 1),
      });
      polydata.setPolys(polys);
      const polysValues = polys.getData();
      let cellOffset = 0;

      // Texture coords
      const tcData = new Float32Array(iSize * jSize * 2);
      const tcoords = vtkDataArray.newInstance({
        numberOfComponents: 2,
        values: tcData,
        name: 'TextureCoordinates',
      });
      polydata.getPointData().setTCoords(tcoords);

      for (let j = 0; j < jSize; j++) {
        for (let i = 0; i < iSize; i++) {
          const offsetIdx = j * iSize + i;
          const offsetPt = 3 * offsetIdx;

          // Fill points coordinates
          pointValues[offsetPt + 0] =
            model.origin[0] + i * model.xSpacing * model.xDirection;
          pointValues[offsetPt + 1] =
            model.origin[1] + j * model.ySpacing * model.yDirection;
          pointValues[offsetPt + 2] =
            model.origin[2] + model.elevation[j][i] * model.zScaling;

          // fill in tcoords
          tcData[offsetIdx * 2] = i / (iSize - 1.0);
          tcData[offsetIdx * 2 + 1] = 1.0 - j / (jSize - 1.0);

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
  xDirection: 1,
  yDirection: -1,
  requestCount: 0,
  // dataAccessHelper: null,
  // url: null,
};

// ----------------------------------------------------------------------------

export function extend(publicAPI, model, initialValues = {}) {
  Object.assign(model, DEFAULT_VALUES, initialValues);

  // Build VTK API
  macro.obj(publicAPI, model);
  macro.get(publicAPI, model, ['url']);
  macro.setGet(publicAPI, model, [
    'dataAccessHelper',
    'xSpacing',
    'ySpacing',
    'zScaling',
    'xDirection',
    'yDirection',
  ]);
  macro.algo(publicAPI, model, 0, 1);
  macro.event(publicAPI, model, 'busy');

  // Object methods
  vtkElevationReader(publicAPI, model);
}

// ----------------------------------------------------------------------------

export const newInstance = macro.newInstance(extend, 'vtkElevationReader');

// ----------------------------------------------------------------------------

export default { newInstance, extend };
