import vtkDataSetAttributes from 'vtk.js/Sources/Common/DataModel/DataSetAttributes';

const CLASS_NAME = 'vtkDataSetAttributes';
const ARRAYS = [
  'Scalars',
  'Vectors',
  'Normals',
  'TCoords',
  'Tensors',
  'GlobalIds',
  'PedigreeIds',
];

function canSerialize(obj) {
  return obj && obj.isA && obj.isA(CLASS_NAME);
}

function canDeserialize(obj) {
  return obj && obj.vtkClass && obj.vtkClass === CLASS_NAME;
}

function serialize(obj, arrayHandler) {
  const output = {
    vtkClass: CLASS_NAME,
  };
  const indexMapping = [];
  const arrays = obj.getArrays();
  for (let i = 0; i < arrays.length; i++) {
    indexMapping.push(arrayHandler.serialize(arrays[i]));
  }
  ARRAYS.forEach((attrType) => {
    const arrayIdx = obj[`getActive${attrType}`]();
    if (arrayIdx !== -1) {
      output[attrType] = indexMapping[arrayIdx];
    }
  });
  // List all arrays
  output.arrays = indexMapping;

  return output;
}

function deserialize(obj, arrayHandler) {
  const ds = vtkDataSetAttributes.newInstance();
  for (let i = 0; i < obj.arrays.length; i++) {
    ds.addArray(arrayHandler.deserialize(obj.arrays[i]));
  }
  ARRAYS.forEach((attrType) => {
    ds[`set${attrType}`](arrayHandler.deserialize(obj[attrType]));
  });
  return ds;
}

export default {
  canSerialize,
  serialize,
  canDeserialize,
  deserialize,
};
