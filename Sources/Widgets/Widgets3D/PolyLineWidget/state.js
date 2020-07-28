import vtkStateBuilder from 'vtk.js/Sources/Widgets/Core/StateBuilder';

export default function generateState() {
  return vtkStateBuilder
    .createBuilder()
    .addStateFromMixin({
      labels: ['moveHandle'],
      mixins: ['origin', 'color', 'scale1', 'visible'],
      name: 'moveHandle',
      initialValues: {
        // when scaleInPixels=true, the handles have 30px height
        scale1: 30,
        origin: [-1, -1, -1],
        visible: false,
      },
    })
    .addDynamicMixinState({
      labels: ['handles'],
      mixins: ['origin', 'color', 'scale1'],
      name: 'handle',
      initialValues: {
        scale1: 30,
        origin: [-1, -1, -1],
      },
    })
    .build();
}
