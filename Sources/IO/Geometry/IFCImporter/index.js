import macro from 'vtk.js/Sources/macros';

// Enable data soure for DataAccessHelper
import 'vtk.js/Sources/IO/Core/DataAccessHelper/LiteHttpDataAccessHelper'; // Just need HTTP
// import 'vtk.js/Sources/IO/Core/DataAccessHelper/HttpDataAccessHelper'; // HTTP + zip
// import 'vtk.js/Sources/IO/Core/DataAccessHelper/HtmlDataAccessHelper'; // html + base64 + zip
// import 'vtk.js/Sources/IO/Core/DataAccessHelper/JSZipDataAccessHelper'; // zip

import DataAccessHelper from 'vtk.js/Sources/IO/Core/DataAccessHelper';
import vtkActor from 'vtk.js/Sources/Rendering/Core/Actor';
import vtkMapper from 'vtk.js/Sources/Rendering/Core/Mapper';
import vtkDataArray from 'vtk.js/Sources/Common/Core/DataArray';
import vtkPolyData from 'vtk.js/Sources/Common/DataModel/PolyData';
import vtkCellArray from 'vtk.js/Sources/Common/Core/CellArray';
import vtkAppendPolyData from 'vtk.js/Sources/Filters/General/AppendPolyData';
import vtkMatrixBuilder from 'vtk.js/Sources/Common/Core/MatrixBuilder';
import { mat3 } from 'gl-matrix';

const { vtkErrorMacro } = macro;

let WebIFC;

/**
 * Set WebIFC api to be used by vtkIFCImporter
 * @param {object} ifcApi
 */
function setIFCAPI(ifcApi) {
  WebIFC = ifcApi;
}

function vtkIFCImporter(publicAPI, model) {
  model.classHierarchy.push('vtkIFCImporter');
  const meshes = [];

  /**
   * Create a vtkPolyData from an IFC mesh object
   * @param {object} mesh the IFC web mesh object
   * @returns vtkPolyData
   */
  function createPolyDataFromIFCMesh(mesh) {
    const { vertices, indices } = mesh;
    const pd = vtkPolyData.newInstance();
    const cells = vtkCellArray.newInstance();

    const pointValues = new Float32Array(vertices.length / 2);
    const normalsArray = new Float32Array(vertices.length / 2);

    for (let i = 0; i < vertices.length; i += 6) {
      pointValues[i / 2] = vertices[i];
      pointValues[i / 2 + 1] = vertices[i + 1];
      pointValues[i / 2 + 2] = vertices[i + 2];

      normalsArray[i / 2] = vertices[i + 3];
      normalsArray[i / 2 + 1] = vertices[i + 4];
      normalsArray[i / 2 + 2] = vertices[i + 5];
    }

    const nCells = indices.length;
    cells.resize((3 * nCells) / 3);
    for (let cellId = 0; cellId < nCells; cellId += 3) {
      const cell = indices.slice(cellId, cellId + 3);
      cells.insertNextCell(cell);
    }

    pd.getPoints().setData(pointValues, 3);
    pd.setStrips(cells);
    pd.getPointData().setNormals(
      vtkDataArray.newInstance({
        name: 'Normals',
        values: normalsArray,
        numberOfComponents: 3,
      })
    );

    return pd;
  }

  /**
   * Create a colored vtkPolyData from an IFC mesh object
   * @param {object} mesh the IFC mesh object
   * @returns vtkPolyData
   */
  function createColoredPolyDataFromIFCMesh(mesh) {
    const { vertices, indices, color, userMatrix } = mesh;

    const pd = vtkPolyData.newInstance();
    const cells = vtkCellArray.newInstance();

    const pointValues = new Float32Array(vertices.length / 2);
    const normalsArray = new Float32Array(vertices.length / 2);
    const colorArray = new Float32Array(vertices.length / 2);

    if (userMatrix) {
      const transformMatrix = vtkMatrixBuilder
        .buildFromRadian()
        .setMatrix(userMatrix);

      const normalMatrix = vtkMatrixBuilder
        .buildFromRadian()
        .multiply3x3(mat3.fromMat4(mat3.create(), userMatrix));

      for (let i = 0; i < vertices.length; i += 6) {
        const point = [vertices[i], vertices[i + 1], vertices[i + 2]];
        const normal = [vertices[i + 3], vertices[i + 4], vertices[i + 5]];

        transformMatrix.apply(point);
        normalMatrix.apply(normal);

        pointValues[i / 2] = point[0];
        pointValues[i / 2 + 1] = point[1];
        pointValues[i / 2 + 2] = point[2];

        normalsArray[i / 2] = normal[0];
        normalsArray[i / 2 + 1] = normal[1];
        normalsArray[i / 2 + 2] = normal[2];

        const colorIndex = i / 2;
        colorArray[colorIndex] = color.x;
        colorArray[colorIndex + 1] = color.y;
        colorArray[colorIndex + 2] = color.z;
      }
    } else {
      for (let i = 0; i < vertices.length; i += 6) {
        pointValues[i / 2] = vertices[i];
        pointValues[i / 2 + 1] = vertices[i + 1];
        pointValues[i / 2 + 2] = vertices[i + 2];

        normalsArray[i / 2] = vertices[i + 3];
        normalsArray[i / 2 + 1] = vertices[i + 4];
        normalsArray[i / 2 + 2] = vertices[i + 5];

        const colorIndex = i / 2;
        colorArray[colorIndex] = color.x;
        colorArray[colorIndex + 1] = color.y;
        colorArray[colorIndex + 2] = color.z;
      }
    }

    const nCells = indices.length;
    cells.resize((3 * nCells) / 3);
    for (let cellId = 0; cellId < nCells; cellId += 3) {
      const cell = indices.slice(cellId, cellId + 3);
      cells.insertNextCell(cell);
    }

    pd.getPoints().setData(pointValues, 3);
    pd.setPolys(cells);
    pd.getPointData().setNormals(
      vtkDataArray.newInstance({
        name: 'Normals',
        values: normalsArray,
        numberOfComponents: 3,
      })
    );

    pd.getPointData().setScalars(
      vtkDataArray.newInstance({
        name: 'Colors',
        values: colorArray,
        numberOfComponents: 3,
      })
    );

    return pd;
  }

  function parseIfc(content) {
    const modelID = model._ifcApi.OpenModel(new Uint8Array(content), {
      COORDINATE_TO_ORIGIN: true,
      USE_FAST_BOOLS: true,
    });

    model._ifcApi.StreamAllMeshes(modelID, (mesh) => {
      const placedGeometries = mesh.geometries;

      for (let i = 0; i < placedGeometries.size(); i++) {
        const placedGeometry = placedGeometries.get(i);

        const ifcGeometryData = model._ifcApi.GetGeometry(
          modelID,
          placedGeometry.geometryExpressID
        );

        const ifcVertices = model._ifcApi.GetVertexArray(
          ifcGeometryData.GetVertexData(),
          ifcGeometryData.GetVertexDataSize()
        );

        const ifcIndices = model._ifcApi.GetIndexArray(
          ifcGeometryData.GetIndexData(),
          ifcGeometryData.GetIndexDataSize()
        );

        meshes.push({
          vertices: ifcVertices,
          indices: ifcIndices,
          color: placedGeometry.color,
          userMatrix: placedGeometry.flatTransformation,
        });
      }
    });

    model._ifcApi.CloseModel(modelID);
  }

  if (!model.dataAccessHelper) {
    model.dataAccessHelper = DataAccessHelper.get('http');
  }

  function fetchData(url, options = {}) {
    const { compression, progressCallback } = model;
    return model.dataAccessHelper.fetchBinary(url, {
      compression,
      progressCallback,
    });
  }

  publicAPI.setUrl = (url, options = { binary: true }) => {
    model.url = url;
    model.baseURL = url.split('/').slice(0, -1).join('/');
    model.compression = options.compression;
    return publicAPI.loadData(options);
  };

  publicAPI.loadData = (options = {}) =>
    fetchData(model.url, options).then(publicAPI.parse);

  publicAPI.parse = (content) => {
    publicAPI.parseAsArrayBuffer(content);
  };

  publicAPI.parseAsArrayBuffer = (content) => {
    if (!content) {
      vtkErrorMacro('No content to parse.');
      return;
    }

    if (!WebIFC) {
      vtkErrorMacro('vtkIFCImporter requires WebIFC API to be set.');
      return;
    }

    model._ifcApi = new WebIFC.IfcAPI();
    model._ifcApi.Init().then(() => {
      parseIfc(content);
      publicAPI.invokeReady();
    });
  };

  publicAPI.importActors = (renderer) => {
    if (model.mergeGeometries) {
      const opaqueMeshes = meshes.filter((mesh) => mesh.color.w === 1);
      const oapd = vtkAppendPolyData.newInstance();

      opaqueMeshes.forEach((mesh) => {
        const pd = createColoredPolyDataFromIFCMesh(mesh);
        oapd.addInputData(pd);
      });

      let mapper = vtkMapper.newInstance();
      mapper.setColorModeToDirectScalars();
      mapper.setInputConnection(oapd.getOutputPort());

      let actor = vtkActor.newInstance();
      actor.setMapper(mapper);
      renderer.addActor(actor);

      const transparentMeshes = meshes.filter((mesh) => mesh.color.w < 1);
      const tapd = vtkAppendPolyData.newInstance();

      transparentMeshes.forEach((mesh) => {
        const pd = createColoredPolyDataFromIFCMesh(mesh);
        tapd.addInputData(pd);
      });

      mapper = vtkMapper.newInstance();
      mapper.setColorModeToDirectScalars();
      mapper.setInputConnection(tapd.getOutputPort());

      actor = vtkActor.newInstance();
      actor.setMapper(mapper);
      actor.getProperty().setOpacity(0.5);
      renderer.addActor(actor);
    } else {
      meshes.forEach((mesh) => {
        const pd = createPolyDataFromIFCMesh(mesh);

        const mapper = vtkMapper.newInstance();
        mapper.setInputData(pd);

        const actor = vtkActor.newInstance();
        actor.setMapper(mapper);

        const { x, y, z, w } = mesh.color;
        actor.getProperty().setColor(x, y, z);
        actor.getProperty().setOpacity(w);

        actor.setUserMatrix(mesh.userMatrix);
        renderer.addActor(actor);
      });
    }
  };
}

const DEFAULT_VALUES = {
  mergeGeometries: false,
};

export function extend(publicAPI, model, initialValues = {}) {
  Object.assign(model, DEFAULT_VALUES, initialValues);

  macro.obj(publicAPI, model);
  macro.get(publicAPI, model, ['url', 'baseURL']);
  macro.setGet(publicAPI, model, ['dataAccessHelper', 'mergeGeometries']);
  macro.event(publicAPI, model, 'ready');
  macro.algo(publicAPI, model, 0, 1);

  vtkIFCImporter(publicAPI, model);
}

export const newInstance = macro.newInstance(extend, 'vtkIFCImporter');

export default {
  newInstance,
  extend,
  setIFCAPI,
};
