import { it, expect, vi } from 'vitest';

import vtkOpenGLRenderWindow from 'vtk.js/Sources/Rendering/OpenGL/RenderWindow';

it.skipIf(__VTK_TEST_NO_WEBGL__)(
  'only requests WEBGL_debug_renderer_info when unmasked values are read',
  () => {
    const getExtension = vi.spyOn(
      WebGL2RenderingContext.prototype,
      'getExtension'
    );
    const glWindow = vtkOpenGLRenderWindow.newInstance();

    try {
      const info = glWindow.getGLInformations();
      expect(info.RENDERER.value).toBeTruthy();
      expect(info.UNMASKED_RENDERER.label).toBe('Unmasked Renderer');
      // Firefox logs a deprecation warning whenever this extension is
      // requested, so getting the regular GL informations must not do it.
      expect(getExtension).not.toHaveBeenCalledWith(
        'WEBGL_debug_renderer_info'
      );

      const unmaskedRenderer = info.UNMASKED_RENDERER.value;
      const unmaskedVendor = info.UNMASKED_VENDOR.value;
      expect(getExtension).toHaveBeenCalledWith('WEBGL_debug_renderer_info');
      const calls = getExtension.mock.calls.filter(
        ([name]) => name === 'WEBGL_debug_renderer_info'
      ).length;
      expect(calls).toBe(1);

      const debugInfo = glWindow
        .get3DContext()
        .getExtension('WEBGL_debug_renderer_info');
      if (debugInfo) {
        const gl = glWindow.get3DContext();
        expect(unmaskedRenderer).toBe(
          gl.getParameter(debugInfo.UNMASKED_RENDERER_WEBGL)
        );
        expect(unmaskedVendor).toBe(
          gl.getParameter(debugInfo.UNMASKED_VENDOR_WEBGL)
        );
      } else {
        expect(unmaskedRenderer).toBeFalsy();
        expect(unmaskedVendor).toBeFalsy();
      }

      // values are cached and enumerable like the other entries
      expect(info.UNMASKED_RENDERER.value).toBe(unmaskedRenderer);
      expect(Object.keys(info.UNMASKED_RENDERER)).toEqual(['label', 'value']);
    } finally {
      getExtension.mockRestore();
      glWindow.delete();
    }
  }
);
