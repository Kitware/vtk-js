import { it, expect, vi } from 'vitest';

import vtkOpenGLRenderWindow from 'vtk.js/Sources/Rendering/OpenGL/RenderWindow';

it('does not manage externally owned canvases', () => {
  const canvas = document.createElement('canvas');
  canvas.style.display = 'inline';
  const addEventListener = vi.spyOn(canvas, 'addEventListener');
  const glWindow = vtkOpenGLRenderWindow.newInstance({
    canvas,
    manageCanvas: false,
  });

  expect(glWindow.getManageCanvas()).toBe(false);
  expect(addEventListener).not.toHaveBeenCalledWith(
    'webglcontextlost',
    expect.any(Function),
    false
  );
  expect(addEventListener).not.toHaveBeenCalledWith(
    'webglcontextrestored',
    expect.any(Function),
    false
  );

  glWindow.setRenderable({});
  glWindow.setUseOffScreen(true);
  glWindow.setSize(640, 480);

  expect(canvas.getAttribute('width')).toBe(null);
  expect(canvas.getAttribute('height')).toBe(null);
  expect(canvas.style.display).toBe('inline');
});

it('captures at the current size when a resize would be needed', async () => {
  const glWindow = vtkOpenGLRenderWindow.newInstance({ manageCanvas: false });

  // the size/scale request is dropped, so the capture takes the single-pass
  // path and resolves on the next imageReady without a canvas resize
  const sizedCapture = glWindow.captureNextImage('image/png', {
    size: [320, 300],
  });
  glWindow.invokeImageReady('data:sized');
  await expect(sizedCapture).resolves.toBe('data:sized');

  const scaledCapture = glWindow.captureNextImage('image/png', { scale: 2 });
  glWindow.invokeImageReady('data:scaled');
  await expect(scaledCapture).resolves.toBe('data:scaled');
});
