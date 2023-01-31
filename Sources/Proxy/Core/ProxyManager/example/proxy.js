import vtkLookupTableProxy from '@kitware/vtk.js/Proxy/Core/LookupTableProxy';
import vtkPiecewiseFunctionProxy from '@kitware/vtk.js/Proxy/Core/PiecewiseFunctionProxy';
import vtkSourceProxy from '@kitware/vtk.js/Proxy/Core/SourceProxy';
import vtkViewProxy from '@kitware/vtk.js/Proxy/Core/ViewProxy';
import vtkView2DProxy from '@kitware/vtk.js/Proxy/Core/View2DProxy';
import vtkVolumeRepresentationProxy from '@kitware/vtk.js/Proxy/Representations/VolumeRepresentationProxy';
import vtkIJKSliceRepresentationProxy from '@kitware/vtk.js/Proxy/Representations/SliceRepresentationProxy';

export default {
  definitions: {
    Proxy: {
      LookupTable: {
        class: vtkLookupTableProxy,
      },
      PiecewiseFunction: {
        class: vtkPiecewiseFunctionProxy,
      },
    },
    Sources: {
      TrivialProducer: {
        class: vtkSourceProxy,
      },
    },
    Representations: {
      Volume: {
        class: vtkVolumeRepresentationProxy,
      },
      ImageSlice: {
        class: vtkIJKSliceRepresentationProxy,
      },
    },
    Views: {
      View3D: {
        class: vtkViewProxy,
      },
      View2D: {
        class: vtkView2DProxy,
      },
    },
  },
  representations: {
    View3D: {
      vtkImageData: { name: 'Volume' },
    },
    View2D: {
      vtkImageData: { name: 'ImageSlice' },
    },
  },
  filters: {},
};
