import vtkStateBuilder from 'vtk.js/Sources/Widgets/Core/StateBuilder';

import {
  AXES,
  handleTypeFromName,
} from 'vtk.js/Sources/Widgets/Widgets3D/ImageCroppingWidget/helpers';

export default function build() {
  // create our state builder
  const builder = vtkStateBuilder.createBuilder();

  // add image data description fields
  builder
    .addField({
      name: 'indexToWorldT',
      initialValue: Array(16).fill(0),
    })
    .addField({
      name: 'worldToIndexT',
      initialValue: Array(16).fill(0),
    });

  // make cropping planes a sub-state so we can listen to it
  // separately from the rest of the widget state.
  const croppingState = vtkStateBuilder
    .createBuilder()
    .addField({
      name: 'planes',
      // index space
      initialValue: [0, 1, 0, 1, 0, 1],
    })
    .build();

  // add cropping planes state to our primary state
  builder.addStateFromInstance({
    labels: ['croppingPlanes'],
    name: 'croppingPlanes',
    instance: croppingState,
  });

  // add all handle states
  // default bounds is [-1, 1] in all dimensions
  for (let i = -1; i < 2; i++) {
    for (let j = -1; j < 2; j++) {
      for (let k = -1; k < 2; k++) {
        // skip center of box
        if (i !== 0 || j !== 0 || k !== 0) {
          const name = AXES[i + 1] + AXES[j + 1] + AXES[k + 1];
          const type = handleTypeFromName(name);

          // since handle states are rendered via vtkSphereHandleRepresentation,
          // we can dictate the handle origin, size (scale1), color, and visibility.
          builder.addStateFromMixin({
            labels: ['handles', name, type],
            mixins: [
              'name',
              'origin',
              'color',
              'scale1',
              'visible',
              'manipulator',
            ],
            name,
            initialValues: {
              scale1: 10,
              origin: [i, j, k],
              visible: true,
              name,
            },
          });
        }
      }
    }
  }

  return builder.build();
}
