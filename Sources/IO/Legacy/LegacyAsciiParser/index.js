import vtkDataArray from 'vtk.js/Sources/Common/Core/DataArray';
import vtkPolyData from 'vtk.js/Sources/Common/DataModel/PolyData';

const METHOD_MAPPING = {
  POINTS: 'getPoints',
  VERTICES: 'getVerts',
  LINES: 'getLines',
  TRIANGLE_STRIPS: 'getStrips',
  POLYGONS: 'getPolys',
  POINT_DATA: 'getPointData',
  CELL_DATA: 'getCellData',
  FIELD: 'getFieldData',
};

const DATATYPES = {
  bit: Uint8Array,
  unsigned_char: Uint8Array,
  char: Int8Array,
  unsigned_short: Uint16Array,
  short: Int16Array,
  unsigned_int: Uint32Array,
  int: Int32Array,
  unsigned_long: Uint32Array,
  long: Int32Array,
  float: Float32Array,
  double: Float64Array,
};

const REGISTER_MAPPING = {
  SCALARS: 'addArray',
  COLOR_SCALARS: 'addArray',
  VECTORS: 'setVectors',
  NORMALS: 'setNormals',
  TEXTURE_COORDINATES: 'setTCoords',
  TENSORS: 'setTensors',
  FIELD: 'addArray',
};

function createArrayHandler(array, setData, nbComponents) {
  let offset = 0;

  function fillWith(line) {
    line.split(' ').forEach((token) => {
      if (token.length) {
        array[offset++] = Number(token);
      }
    });
    if (offset < array.length) {
      return true;
    }
    setData(array, nbComponents);
    return false;
  }

  return fillWith;
}

const GENERIC_CELL_HANDLER = {
  init(line, dataModel) {
    const [name, nbCells, nbValues] = line.split(' ');
    const cellArray = dataModel.dataset[METHOD_MAPPING[name]]();
    cellArray.set({ numberOfCells: Number(nbCells) }, true); // Force numberOfCells update
    dataModel.arrayHandler = createArrayHandler(
      new Uint32Array(Number(nbValues)),
      cellArray.setData,
      1
    );
    return true;
  },
  parse(line, dataModel) {
    return dataModel.arrayHandler(line);
  },
};

const TYPE_PARSER = {
  DATASET: {
    init(line, datamodel) {
      const type = line.split(' ')[1];
      switch (type) {
        case 'POLYDATA':
          datamodel.dataset = vtkPolyData.newInstance();
          break;
        default:
          console.error(`Dataset of type ${type} not supported`);
      }
      return false;
    },
    parse(line, datamodel) {
      return false;
    },
  },
  POINTS: {
    init(line, dataModel) {
      const [name, size, type] = line.split(' ');
      const array =
        type === 'float'
          ? new Float32Array(3 * Number(size))
          : new Float64Array(3 * Number(size));
      const dataArray = dataModel.dataset.getPoints();
      dataArray.setName(name);
      dataModel.arrayHandler = createArrayHandler(array, dataArray.setData, 3);
      return true;
    },
    parse(line, dataModel) {
      return dataModel.arrayHandler(line);
    },
  },
  METADATA: {
    init(line, dataModel) {
      return true;
    },
    parse(line, dataModel) {
      return !!line.length;
    },
  },
  VERTICES: GENERIC_CELL_HANDLER,
  LINES: GENERIC_CELL_HANDLER,
  TRIANGLE_STRIPS: GENERIC_CELL_HANDLER,
  POLYGONS: GENERIC_CELL_HANDLER,
  POINT_DATA: {
    init(line, dataModel) {
      dataModel.POINT_DATA = Number(line.split(' ')[1]);
      dataModel.activeFieldLocation = 'POINT_DATA';
      return false;
    },
    parse(line, dataModel) {
      return false;
    },
  },
  CELL_DATA: {
    init(line, dataModel) {
      dataModel.CELL_DATA = Number(line.split(' ')[1]);
      dataModel.activeFieldLocation = 'CELL_DATA';
      return false;
    },
    parse(line, dataModel) {
      return false;
    },
  },
  SCALARS: {
    init(line, dataModel) {
      const [type, name, dataType, numComp] = line.split(' ');
      const numOfComp = Number(numComp) > 0 ? Number(numComp) : 1;
      const size = dataModel[dataModel.activeFieldLocation] * numOfComp;
      const array = new DATATYPES[dataType](size);
      const dataArray = vtkDataArray.newInstance({ name, empty: true });
      dataModel.dataset[METHOD_MAPPING[dataModel.activeFieldLocation]]()[
        REGISTER_MAPPING[type]
      ](dataArray);
      dataModel.arrayHandler = createArrayHandler(
        array,
        dataArray.setData,
        numOfComp
      );
      return true;
    },
    parse(line, dataModel) {
      if (line.split(' ')[0] === 'LOOKUP_TABLE') {
        return true;
      }
      return dataModel.arrayHandler(line);
    },
  },
  COLOR_SCALARS: {
    init(line, dataModel) {
      const [type, name, numComp] = line.split(' ');
      const numOfComp = Number(numComp) > 0 ? Number(numComp) : 1;
      const size = dataModel[dataModel.activeFieldLocation] * numOfComp;
      const array = new Uint8Array(size);
      const dataArray = vtkDataArray.newInstance({ name, empty: true });
      dataModel.dataset[METHOD_MAPPING[dataModel.activeFieldLocation]]()[
        REGISTER_MAPPING[type]
      ](dataArray);
      dataModel.arrayHandler = createArrayHandler(
        array,
        dataArray.setData,
        numOfComp
      );
      return true;
    },
    parse(line, dataModel) {
      if (line.split(' ')[0] === 'LOOKUP_TABLE') {
        return true;
      }
      return dataModel.arrayHandler(line);
    },
  },
  VECTORS: {
    init(line, dataModel) {
      const [type, name, dataType] = line.split(' ');
      const size = dataModel[dataModel.activeFieldLocation] * 3;
      const array = new DATATYPES[dataType](size);
      const dataArray = vtkDataArray.newInstance({ name, empty: true });
      dataModel.dataset[METHOD_MAPPING[dataModel.activeFieldLocation]]()[
        REGISTER_MAPPING[type]
      ](dataArray);
      dataModel.arrayHandler = createArrayHandler(array, dataArray.setData, 3);
      return true;
    },
    parse(line, dataModel) {
      return dataModel.arrayHandler(line);
    },
  },
  NORMALS: {
    init(line, dataModel) {
      const [type, name] = line.split(' ');
      const size = dataModel[dataModel.activeFieldLocation] * 3;
      const array = new Float32Array(size);
      const dataArray = vtkDataArray.newInstance({ name, empty: true });
      dataModel.dataset[METHOD_MAPPING[dataModel.activeFieldLocation]]()[
        REGISTER_MAPPING[type]
      ](dataArray);
      dataModel.arrayHandler = createArrayHandler(array, dataArray.setData, 3);
      return true;
    },
    parse(line, dataModel) {
      return dataModel.arrayHandler(line);
    },
  },
  TEXTURE_COORDINATES: {
    init(line, dataModel) {
      const [type, name, numberOfComponents, dataType] = line.split(' ');
      const size =
        dataModel[dataModel.activeFieldLocation] * Number(numberOfComponents);
      const array = new DATATYPES[dataType](size);
      const dataArray = vtkDataArray.newInstance({ name, empty: true });
      dataModel.dataset[METHOD_MAPPING[dataModel.activeFieldLocation]]()[
        REGISTER_MAPPING[type]
      ](dataArray);
      dataModel.arrayHandler = createArrayHandler(array, dataArray.setData, 3);
      return true;
    },
    parse(line, dataModel) {
      return dataModel.arrayHandler(line);
    },
  },
  TENSORS: {
    init(line, dataModel) {
      const [type, name, dataType] = line.split(' ');
      const size = dataModel[dataModel.activeFieldLocation] * 9;
      const array = new DATATYPES[dataType](size);
      const dataArray = vtkDataArray.newInstance({ name, empty: true });
      dataModel.dataset[METHOD_MAPPING[dataModel.activeFieldLocation]]()[
        REGISTER_MAPPING[type]
      ](dataArray);
      dataModel.arrayHandler = createArrayHandler(array, dataArray.setData, 9);
      return true;
    },
    parse(line, dataModel) {
      return dataModel.arrayHandler(line);
    },
  },
};

function getParser(line, dataModel) {
  const tokens = line.split(' ');
  return TYPE_PARSER[tokens[0]];
}

function parseLegacyASCII(content, dataModel = {}) {
  let parser = null;
  const separatorRegExp = /\r?\n/;
  const separatorRes = separatorRegExp.exec(content);
  const separator = separatorRes !== null ? separatorRes[0] : null;
  content.split(separator).forEach((line, index) => {
    if (index < 2) {
      return;
    }
    if (!parser) {
      parser = getParser(line, dataModel);
      if (!parser) {
        return;
      }
      parser = parser.init(line, dataModel) ? parser : null;
      return;
    }

    if (parser && !parser.parse(line, dataModel)) {
      parser = null;
    }
  });
  return dataModel;
}

export default {
  parseLegacyASCII,
};
