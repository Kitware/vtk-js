import { it } from 'vitest';
import {
  expectPassResourcesFreedOnDelete,
  expectSameImageAfterPassRelease,
} from 'vtk.js/Sources/Testing/renderTestUtils';

import vtkRadialDistortionPass from 'vtk.js/Sources/Rendering/OpenGL/RadialDistortionPass';

// A zero distortion pass is a no-op that never allocates.
const createPass = (gc) => {
  const pass = gc.registerResource(vtkRadialDistortionPass.newInstance());
  pass.setK1(0.2);
  return pass;
};

it.skipIf(__VTK_TEST_NO_WEBGL__)(
  'frees the radial distortion pass GPU objects when the view is deleted',
  () => expectPassResourcesFreedOnDelete(createPass)
);

it.skipIf(__VTK_TEST_NO_WEBGL__)(
  'draws the same image after the view releases its render pass resources',
  () => expectSameImageAfterPassRelease(createPass)
);
