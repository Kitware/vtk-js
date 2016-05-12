import vtkMath from '../../Core/Math';
import vtkBoundingBox from '../BoundingBox';

export function getBounds(dataset) {
  if (dataset.bounds) {
    return dataset.bounds;
  }
  if (dataset.type && dataset[dataset.type]) {
    const ds = dataset[dataset.type];
    if (ds.bounds) {
      return ds.bounds;
    }
    if (ds.Points && ds.Points.bounds) {
      return ds.Points.bounds;
    }

    if (ds.Points && ds.Points.values) {
      const array = ds.Points.values;
      const bbox = vtkBoundingBox.newInstance();
      const size = array.length;
      const delta = ds.Points.tuple ? ds.Points.tuple : 3;
      for (let idx = 0; idx < size; idx += delta) {
        bbox.addPoint(array[idx * delta], array[idx * delta + 1], array[idx * delta + 2]);
      }
      ds.Points.bounds = bbox.getBounds();
      return ds.Points.bounds;
    }
  }
  return vtkMath.createUninitializedBouds();
}

export default {
  getBounds,
};
