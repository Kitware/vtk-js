import vtkSourceProxy from '@kitware/vtk.js/Proxy/Core/SourceProxy';
import vtkView from '@kitware/vtk.js/Proxy/Core/ViewProxy';
import vtkGeometryRepresentationProxy from '@kitware/vtk.js/Proxy/Representations/GeometryRepresentationProxy';
import vtkTimeStepBasedAnimationProxy from '@kitware/vtk.js/Proxy/Animation/TimeStepBasedAnimationHandlerProxy';
import vtkAnimationProxyManager from '@kitware/vtk.js/Proxy/Animation/AnimationProxyManager';

export default {
  definitions: {
    Sources: {
      TrivialProducer: {
        class: vtkSourceProxy,
      },
    },
    Representations: {
      Geometry: {
        class: vtkGeometryRepresentationProxy,
        props: {
          representation: 'Surface',
        },
      },
    },
    Views: {
      View3D: {
        class: vtkView,
      },
    },
    Animations: {
      AnimationManager: {
        class: vtkAnimationProxyManager,
      },
      TimeStepAnimation: {
        class: vtkTimeStepBasedAnimationProxy,
      },
    },
  },
  representations: {
    View3D: {
      vtkPolyData: { name: 'Geometry' },
    },
  },
  filters: {},
};
