import macro from 'vtk.js/Sources/macros';
import vtkPolyData from 'vtk.js/Sources/Common/DataModel/PolyData';
import DataAccessHelper from 'vtk.js/Sources/IO/Core/DataAccessHelper';

// Enable several sources for DataAccessHelper
import 'vtk.js/Sources/IO/Core/DataAccessHelper/LiteHttpDataAccessHelper'; // Just need HTTP
// import 'vtk.js/Sources/IO/Core/DataAccessHelper/HttpDataAccessHelper'; // HTTP + gz
// import 'vtk.js/Sources/IO/Core/DataAccessHelper/HtmlDataAccessHelper'; // html + base64 + zip
// import 'vtk.js/Sources/IO/Core/DataAccessHelper/JSZipDataAccessHelper'; // zip

// ----------------------------------------------------------------------------
// vtkElevationReader methods
// ----------------------------------------------------------------------------

function vtkJSONNucleoReader(publicAPI, model) {
  // Set our className
  model.classHierarchy.push('vtkJSONNucleoReader');

  // Create default dataAccessHelper if not available
  if (!model.dataAccessHelper) {
    model.dataAccessHelper = DataAccessHelper.get('http');
  }

  // Internal method to fetch Array
  function fetchText(url, options) {
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
    fetchText(model.url, options).then((csv) => {
      publicAPI.parseAsText(csv);
      return true;
    });

  publicAPI.parseAsText = (jsonAsTxt) => {
    const { vertices, indices } = JSON.parse(jsonAsTxt);
    const nbIndices = indices.length;
    const nbTriangles = nbIndices / 3;
    const nbCellsValues = nbTriangles + nbIndices;

    model.points = Float32Array.from(vertices);
    model.polys =
      nbCellsValues < 65535
        ? new Uint16Array(nbCellsValues)
        : new Uint32Array(nbCellsValues);
    let srcOffset = 0;
    let destOffset = 0;
    while (destOffset < model.polys.length) {
      model.polys[destOffset++] = 3;
      model.polys[destOffset++] = indices[srcOffset++];
      model.polys[destOffset++] = indices[srcOffset++];
      model.polys[destOffset++] = indices[srcOffset++];
    }

    publicAPI.modified();
  };

  publicAPI.requestData = (inData, outData) => {
    const polydata = vtkPolyData.newInstance();
    polydata.getPoints().setData(model.points, 3);
    polydata.getPolys().setData(model.polys);
    model.output[0] = polydata;
  };
}

// ----------------------------------------------------------------------------
// Object factory
// ----------------------------------------------------------------------------

const DEFAULT_VALUES = {
  // dataAccessHelper: null,
  // url: null,
};

// ----------------------------------------------------------------------------

export function extend(publicAPI, model, initialValues = {}) {
  Object.assign(model, DEFAULT_VALUES, initialValues);

  // Build VTK API
  macro.obj(publicAPI, model);
  macro.get(publicAPI, model, ['url']);
  macro.setGet(publicAPI, model, ['dataAccessHelper']);
  macro.algo(publicAPI, model, 0, 1);

  // Object methods
  vtkJSONNucleoReader(publicAPI, model);
}

// ----------------------------------------------------------------------------

export const newInstance = macro.newInstance(extend, 'vtkJSONNucleoReader');

// ----------------------------------------------------------------------------

export default { newInstance, extend };
