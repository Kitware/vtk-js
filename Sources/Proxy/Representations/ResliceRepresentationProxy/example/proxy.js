import vtkSourceProxy from '@kitware/vtk.js/Proxy/Core/SourceProxy';
import vtkView2DProxy from '@kitware/vtk.js/Proxy/Core/View2DProxy';
import vtkResliceRepresentationProxy from '@kitware/vtk.js/Proxy/Representations/ResliceRepresentationProxy';

export default {
  definitions: {
    Sources: {
      TrivialProducer: {
        class: vtkSourceProxy,
      },
    },
    Representations: {
      ImageSlice: {
        class: vtkResliceRepresentationProxy,
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
