import { it, expect, vi } from 'vitest';

import vtkShaderProgram from 'vtk.js/Sources/Rendering/OpenGL/ShaderProgram';

function createContext() {
  let nextHandle = 1;
  return {
    VERTEX_SHADER: 'VERTEX_SHADER',
    FRAGMENT_SHADER: 'FRAGMENT_SHADER',
    createShader: () => nextHandle++,
    shaderSource() {},
    compileShader() {},
    getShaderParameter: () => true,
    deleteShader() {},
    createProgram: () => nextHandle++,
    attachShader() {},
    detachShader: vi.fn(),
    linkProgram() {},
    getProgramParameter: vi.fn(() => true),
    getProgramInfoLog: () => 'link failed',
    deleteProgram: vi.fn(),
  };
}

it('deletes the program when its link fails so a retry starts clean', () => {
  const gl = createContext();
  const program = vtkShaderProgram.newInstance();
  program.setContext(gl);
  program.getVertexShader().setSource('void main() {}');
  program.getFragmentShader().setSource('void main() {}');

  vi.spyOn(console, 'error').mockImplementation(() => {});
  gl.getProgramParameter.mockReturnValueOnce(false);
  expect(program.compileShader()).toBe(0);
  const failedHandle = gl.deleteProgram.mock.calls[0]?.[0];
  expect(failedHandle).toBeTruthy();
  expect(program.getHandle()).toBe(0);

  // the retry creates a new program; detaching the old shaders from it is
  // INVALID_OPERATION, so the stale attachment handles must be cleared
  expect(program.compileShader()).toBe(1);
  expect(program.getHandle()).not.toBe(failedHandle);
  expect(gl.detachShader).not.toHaveBeenCalled();
  vi.restoreAllMocks();
});
