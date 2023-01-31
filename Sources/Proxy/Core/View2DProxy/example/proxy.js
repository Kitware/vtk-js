import vtkSourceProxy from '@kitware/vtk.js/Proxy/Core/SourceProxy';
import vtkView2DProxy from '@kitware/vtk.js/Proxy/Core/View2DProxy';
import vtkIJKSliceRepresentationProxy from '@kitware/vtk.js/Proxy/Representations/SliceRepresentationProxy';

export default {
  definitions: {
    Sources: {
      TrivialProducer: {
        class: vtkSourceProxy,
      },
    },
    Representations: {
      ImageSlice: {
        class: vtkIJKSliceRepresentationProxy,
      },
    },
    Views: {
      View2D: {
        class: vtkView2DProxy,
      },
    },
  },
  representations: {
    View2D: {
      vtkImageData: { name: 'ImageSlice' },
    },
  },
  filters: {},
};
