import vtkStateBuilder from 'vtk.js/Sources/Widgets/Core/StateBuilder';
import {
  ROTATE_HANDLE_PIXEL_SCALE,
  SCALE_HANDLE_PIXEL_SCALE,
} from './constants';

export default function stateGenerator() {
  const transformState = vtkStateBuilder
    .createBuilder()
    .addField({
      name: 'translation',
      initialValue: [0, 0, 0],
    })
    .addField({
      name: 'scale',
      initialValue: [1, 1, 1],
    })
    .addField({
      name: 'rotation',
      initialValue: [0, 0, 0, 1],
    })
    .build();

  return (
    vtkStateBuilder
      .createBuilder()
      .addStateFromInstance({
        labels: [],
        name: 'transform',
        instance: transformState,
      })

      // translate state
      .addStateFromMixin({
        labels: ['handles', 'translateHandles'],
        mixins: [
          'name',
          'origin',
          'color3',
          'scale3',
          'orientation',
          'visible',
        ],
        name: 'translateHandleZ',
        initialValues: {
          name: 'translate:Z',
          scale3: [1, 1, SCALE_HANDLE_PIXEL_SCALE],
          origin: [0, 0, 0],
          color3: [0, 255, 0],
          // these are fixed to the world axes
          up: [0, 1, 0],
          right: [1, 0, 0],
          direction: [0, 0, 1],
        },
      })
      .addStateFromMixin({
        labels: ['handles', 'translateHandles'],
        mixins: [
          'name',
          'origin',
          'color3',
          'scale3',
          'orientation',
          'visible',
        ],
        name: 'translateHandleX',
        initialValues: {
          name: 'translate:X',
          scale3: [1, 1, SCALE_HANDLE_PIXEL_SCALE],
          origin: [0, 0, 0],
          color3: [0, 0, 255],
          // these are fixed to the world axes
          up: [0, 1, 0],
          right: [0, 0, -1],
          direction: [1, 0, 0],
        },
      })
      .addStateFromMixin({
        labels: ['handles', 'translateHandles'],
        mixins: [
          'name',
          'origin',
          'color3',
          'scale3',
          'orientation',
          'visible',
        ],
        name: 'translateHandleY',
        initialValues: {
          name: 'translate:Y',
          scale3: [1, 1, SCALE_HANDLE_PIXEL_SCALE],
          origin: [0, 0, 0],
          color3: [255, 0, 0],
          // these are fixed to the world axes
          up: [0, 0, 1],
          right: [1, 0, 0],
          direction: [0, 1, 0],
        },
      })

      // scale state
      .addStateFromMixin({
        labels: ['handles', 'scaleHandles'],
        mixins: [
          'name',
          'origin',
          'color3',
          'scale3',
          'orientation',
          'visible',
        ],
        name: 'scaleHandleZ',
        initialValues: {
          name: 'scale:Z',
          scale3: [1, 1, SCALE_HANDLE_PIXEL_SCALE],
          origin: [0, 0, 0],
          color3: [0, 255, 0],
          // these are set via setHandleOrientationsFromQuat
          up: [0, 0, 1],
          right: [0, 1, 0],
          direction: [1, 0, 0],
        },
      })
      .addStateFromMixin({
        labels: ['handles', 'scaleHandles'],
        mixins: [
          'name',
          'origin',
          'color3',
          'scale3',
          'orientation',
          'visible',
        ],
        name: 'scaleHandleX',
        initialValues: {
          name: 'scale:X',
          scale3: [1, 1, SCALE_HANDLE_PIXEL_SCALE],
          origin: [0, 0, 0],
          color3: [0, 0, 255],
          // these are set via setHandleOrientationsFromQuat
          up: [1, 0, 0],
          right: [0, -1, 0],
          direction: [0, 0, 1],
        },
      })
      .addStateFromMixin({
        labels: ['handles', 'scaleHandles'],
        mixins: [
          'name',
          'origin',
          'color3',
          'scale3',
          'orientation',
          'visible',
        ],
        name: 'scaleHandleY',
        initialValues: {
          name: 'scale:Y',
          scale3: [1, 1, SCALE_HANDLE_PIXEL_SCALE],
          origin: [0, 0, 0],
          color3: [255, 0, 0],
          // these are set via setHandleOrientationsFromQuat
          up: [0, 1, 0],
          right: [1, 0, 0],
          direction: [0, 0, 1],
        },
      })

      // rotation state
      .addStateFromMixin({
        labels: ['handles', 'rotateHandles'],
        mixins: [
          'name',
          'origin',
          'color3',
          'scale1',
          'orientation',
          'visible',
        ],
        name: 'rotateHandleZ',
        initialValues: {
          name: 'rotate:Z',
          scale1: ROTATE_HANDLE_PIXEL_SCALE,
          origin: [0, 0, 0],
          color3: [0, 255, 0],
          // these are set via setHandleOrientationsFromQuat
          up: [0, 1, 0],
          right: [1, 0, 0],
          direction: [0, 0, 1],
        },
      })
      .addStateFromMixin({
        labels: ['handles', 'rotateHandles'],
        mixins: [
          'name',
          'origin',
          'color3',
          'scale1',
          'orientation',
          'visible',
        ],
        name: 'rotateHandleX',
        initialValues: {
          name: 'rotate:X',
          scale1: ROTATE_HANDLE_PIXEL_SCALE,
          origin: [0, 0, 0],
          color3: [0, 0, 255],
          // these are set via setHandleOrientationsFromQuat
          up: [0, 1, 0],
          right: [0, 0, -1],
          direction: [1, 0, 0],
        },
      })
      .addStateFromMixin({
        labels: ['handles', 'rotateHandles'],
        mixins: [
          'name',
          'origin',
          'color3',
          'scale1',
          'orientation',
          'visible',
        ],
        name: 'rotateHandleY',
        initialValues: {
          name: 'rotate:Y',
          scale1: ROTATE_HANDLE_PIXEL_SCALE,
          origin: [0, 0, 0],
          color3: [255, 0, 0],
          // these are set via setHandleOrientationsFromQuat
          up: [0, 0, 1],
          right: [1, 0, 0],
          direction: [0, 1, 0],
        },
      })
      .build()
  );
}
