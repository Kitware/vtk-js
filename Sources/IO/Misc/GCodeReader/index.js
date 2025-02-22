import macro from 'vtk.js/Sources/macros';
import BinaryHelper from 'vtk.js/Sources/IO/Core/BinaryHelper';
import DataAccessHelper from 'vtk.js/Sources/IO/Core/DataAccessHelper';
import vtkPolyData from 'vtk.js/Sources/Common/DataModel/PolyData';
import vtkPoints from 'vtk.js/Sources/Common/Core/Points';
import vtkCellArray from 'vtk.js/Sources/Common/Core/CellArray';

// Enable several sources for DataAccessHelper
import 'vtk.js/Sources/IO/Core/DataAccessHelper/LiteHttpDataAccessHelper'; // Just need HTTP
// import 'vtk.js/Sources/IO/Core/DataAccessHelper/HttpDataAccessHelper'; // HTTP + gz
// import 'vtk.js/Sources/IO/Core/DataAccessHelper/HtmlDataAccessHelper'; // html + base64 + zip
// import 'vtk.js/Sources/IO/Core/DataAccessHelper/JSZipDataAccessHelper'; // zip

// ----------------------------------------------------------------------------
// vtkGCodeReader methods
// ----------------------------------------------------------------------------
function vtkGCodeReader(publicAPI, model) {
  const state = {
    currentPosition: { x: 0, y: 0, z: 0 },
    offset: { x: 0, y: 0, z: 0 },
    currentLayer: 0,
    layers: new Map(), // Map to store layer data
    isAbsolute: true, // G90 is default
    isMetric: true, // G21 is default
    lastZ: 0, // Track Z changes for layer detection
  };

  model.classHierarchy.push('vtkGCodeReader');

  if (!model.dataAccessHelper) {
    model.dataAccessHelper = DataAccessHelper.get('http');
  }

  function fetchData(url, option = {}) {
    const { compression, progressCallback } = model;
    if (option.binary) {
      return model.dataAccessHelper.fetchBinary(url, {
        compression,
        progressCallback,
      });
    }
    return model.dataAccessHelper.fetchText(publicAPI, url, {
      compression,
      progressCallback,
    });
  }

  function detectLayerChange(newZ) {
    if (Math.abs(newZ - state.lastZ) > 0.001) {
      state.currentLayer++;
      state.lastZ = newZ;
      return true;
    }
    return false;
  }

  function initializeLayer() {
    if (!state.layers.has(state.currentLayer)) {
      const points = vtkPoints.newInstance();
      const lines = vtkCellArray.newInstance();
      const polyData = vtkPolyData.newInstance();

      polyData.setPoints(points);
      polyData.setLines(lines);

      state.layers.set(state.currentLayer, {
        polyData,
        points,
        lines,
        zHeight: state.lastZ,
      });
    }
  }

  function addLineToLayer(startPoint, endPoint) {
    initializeLayer();
    const layer = state.layers.get(state.currentLayer);

    // Add points and get their indices
    const startIndex = layer.points.insertNextPoint(
      startPoint[0],
      startPoint[1],
      startPoint[2]
    );
    const endIndex = layer.points.insertNextPoint(
      endPoint[0],
      endPoint[1],
      endPoint[2]
    );

    // Add line cell
    layer.lines.insertNextCell([startIndex, endIndex]);
  }

  function processMove(params) {
    const newPosition = { ...state.currentPosition };
    let positionChanged = false;

    ['X', 'Y', 'Z'].forEach((axis) => {
      if (axis in params) {
        const value = state.isMetric ? params[axis] : params[axis] * 25.4;
        newPosition[axis.toLowerCase()] = state.isAbsolute
          ? value + state.offset[axis.toLowerCase()]
          : state.currentPosition[axis.toLowerCase()] + value;
        positionChanged = true;
      }
    });

    if (positionChanged) {
      if ('Z' in params) {
        detectLayerChange(newPosition.z);
      }

      const startPoint = [
        state.currentPosition.x,
        state.currentPosition.y,
        state.currentPosition.z,
      ];
      const endPoint = [newPosition.x, newPosition.y, newPosition.z];

      addLineToLayer(startPoint, endPoint);
      state.currentPosition = newPosition;
    }
  }

  function processG92(params) {
    ['X', 'Y', 'Z'].forEach((axis) => {
      if (axis in params) {
        state.offset[axis.toLowerCase()] =
          state.currentPosition[axis.toLowerCase()] -
          (state.isMetric ? params[axis] : params[axis] * 25.4);
      }
    });
  }

  function processCommand(command, params) {
    switch (command) {
      case 'G0': // Rapid move
      case 'G1': // Linear move
        processMove(params);
        break;
      case 'G20': // Imperial
        state.isMetric = false;
        break;
      case 'G21': // Metric
        state.isMetric = true;
        break;
      case 'G90': // Absolute positioning
        state.isAbsolute = true;
        break;
      case 'G91': // Relative positioning
        state.isAbsolute = false;
        break;
      case 'G92': // Set position
        processG92(params);
        break;
      default:
        break;
    }
  }

  function parseGCode(gcodeText) {
    const lines = gcodeText.split('\n');

    lines.forEach((line) => {
      const sline = line.split(';')[0].trim();
      if (!sline) return;

      const tokens = sline.split(' ');
      const command = tokens[0];

      const params = {};
      tokens.slice(1).forEach((token) => {
        const param = token[0];
        const value = parseFloat(token.slice(1));
        if (!Number.isNaN(value)) {
          params[param] = value;
        }
      });

      processCommand(command, params);
    });
  }

  // Public methods
  publicAPI.setUrl = (url, option = { binary: true }) => {
    model.url = url;
    const path = url.split('/');
    path.pop();
    model.baseURL = path.join('/');
    model.compression = option.compression;

    return publicAPI.loadData({
      progressCallback: option.progressCallback,
      binary: !!option.binary,
    });
  };

  publicAPI.loadData = (option = {}) => {
    const promise = fetchData(model.url, option);
    promise.then(publicAPI.parse);
    return promise;
  };

  publicAPI.parseAsText = (content) => {
    parseGCode(content);
  };

  publicAPI.parseAsArrayBuffer = (content) => {
    const data = BinaryHelper.arrayBufferToString(content);
    parseGCode(data);
  };

  publicAPI.parse = (content) => {
    if (typeof content === 'string') {
      publicAPI.parseAsText(content);
    } else {
      publicAPI.parseAsArrayBuffer(content);
    }

    state.layers.forEach((layer, i) => {
      model.output[i] = layer.polyData;
    });
  };

  publicAPI.requestData = (inData, outData) => {
    publicAPI.parse(model.parseData);
  };

  publicAPI.getNumberOfOutputPorts = () => state.layers.size;
}

const DEFAULT_VALUES = {
  // baseURL: null,
  // dataAccessHelper: null,
  // url: null,
};

export function extend(publicAPI, model, initialValues = {}) {
  Object.assign(model, DEFAULT_VALUES, initialValues);

  // Build VTK API
  macro.obj(publicAPI, model);
  macro.get(publicAPI, model, ['url', 'baseURL']);
  macro.setGet(publicAPI, model, ['dataAccessHelper']);
  macro.algo(publicAPI, model, 0, 1);
  macro.event(publicAPI, model, 'ready');

  vtkGCodeReader(publicAPI, model);
}

export const newInstance = macro.newInstance(extend, 'vtkGCodeReader');

export default {
  extend,
  newInstance,
};
