import { it } from 'vitest';
import {
  expectPassResourcesFreedOnDelete,
  expectSameImageAfterPassRelease,
} from 'vtk.js/Sources/Testing/renderTestUtils';

import vtkConvolution2DPass from 'vtk.js/Sources/Rendering/OpenGL/Convolution2DPass';

const createPass = (gc) =>
  gc.registerResource(vtkConvolution2DPass.newInstance());

it.skipIf(__VTK_TEST_NO_WEBGL__)(
  'frees the convolution pass GPU objects when the view is deleted',
  () => expectPassResourcesFreedOnDelete(createPass)
);

it.skipIf(__VTK_TEST_NO_WEBGL__)(
  'draws the same image after the view releases its render pass resources',
  () => expectSameImageAfterPassRelease(createPass)
);
