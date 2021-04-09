import vtkSourceProxy from 'vtk.js/Sources/Proxy/Core/SourceProxy';
import vtkView from 'vtk.js/Sources/Proxy/Core/ViewProxy';
import vtkGeometryRepresentationProxy from 'vtk.js/Sources/Proxy/Representations/GeometryRepresentationProxy';
import vtkTimeStepBasedAnimationProxy from 'vtk.js/Sources/Proxy/Animation/TimeStepBasedAnimationHandlerProxy';
import vtkAnimationProxyManager from 'vtk.js/Sources/Proxy/Animation/AnimationProxyManager';

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
