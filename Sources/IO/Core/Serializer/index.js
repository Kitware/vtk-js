import vtkArraySerializer from 'vtk.js/Sources/IO/Core/Serializer/ArraySerializer';
import vtkFieldDataSerializer from 'vtk.js/Sources/IO/Core/Serializer/FieldDataSerializer';
import vtkImageDataSerializer from 'vtk.js/Sources/IO/Core/Serializer/ImageDataSerializer';
import vtkPolyDataSerializer from 'vtk.js/Sources/IO/Core/Serializer/PolyDataSerializer';

const LIST = [
  vtkFieldDataSerializer,
  vtkImageDataSerializer,
  vtkPolyDataSerializer,
];

function getSerializer(obj) {
  return LIST.find((s) => s.canSerialize(obj));
}

function getDeserializer(obj) {
  return LIST.find((s) => s.canDeserialize(obj));
}

export default {
  vtkArraySerializer,
  getSerializer,
  getDeserializer,
};
