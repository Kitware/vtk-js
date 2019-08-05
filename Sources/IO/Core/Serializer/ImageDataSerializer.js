import vtkImageData from 'vtk.js/Sources/Common/DataModel/ImageData';
import vtkFieldDataSerializer from 'vtk.js/Sources/IO/Core/Serializer/FieldDataSerializer';

const CLASS_NAME = 'vtkImageData';

function canSerialize(obj) {
  return obj && obj.isA && obj.isA(CLASS_NAME);
}

function canDeserialize(obj) {
  return obj && obj.vtkClass && obj.vtkClass === CLASS_NAME;
}

function serialize(obj, arrayHandler) {
  const output = Object.assign(
    obj.get('direction', 'spacing', 'origin', 'extent'),
    {
      vtkClass: CLASS_NAME,
    }
  );

  // Handle fields
  output.pointData = vtkFieldDataSerializer.serialize(
    obj.getPointData(),
    arrayHandler
  );
  output.cellData = vtkFieldDataSerializer.serialize(
    obj.getCellData(),
    arrayHandler
  );
  output.fieldData = vtkFieldDataSerializer.serialize(
    obj.getFieldData(),
    arrayHandler
  );
  return output;
}

function deserialize(obj, arrayHandler) {
  const { direction, spacing, origin, extent } = obj;
  const ds = vtkImageData.newInstance({ direction, spacing, origin, extent });

  // Handle fields
  ds.setPointData(
    vtkFieldDataSerializer.deserialize(obj.pointData, arrayHandler)
  );
  ds.setCellData(
    vtkFieldDataSerializer.deserialize(obj.cellData, arrayHandler)
  );
  ds.setFieldData(
    vtkFieldDataSerializer.deserialize(obj.fieldData, arrayHandler)
  );

  return ds;
}

export default {
  canSerialize,
  serialize,
  canDeserialize,
  deserialize,
};
