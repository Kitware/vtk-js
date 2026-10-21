import { it, expect } from 'vitest';

import vtkHelper from 'vtk.js/Sources/Rendering/OpenGL/Helper';

it('restores an empty program after a mapper clears it on shader failure', () => {
  const helper = vtkHelper.newInstance();
  const gl = {};
  const win = { getContext: () => gl };

  helper.setOpenGLRenderWindow(win);
  // updateShaders clears the program when a shader fails to compile or bind
  helper.setProgram(null);

  // the next render pass must not dereference the null program
  expect(() => helper.setOpenGLRenderWindow(win)).not.toThrow();

  // an empty program (handle 0) re-arms getNeedToRebuildShaders so the
  // mapper retries the shader instead of leaving the viewport dead
  const program = helper.getProgram();
  expect(program.getHandle()).toBe(0);
  expect(program.getCompiled()).toBe(false);
  expect(program.getVertexShader().getContext()).toBe(gl);
});

it('keeps the existing program when it was not cleared', () => {
  const helper = vtkHelper.newInstance();
  const win = { getContext: () => ({}) };
  const program = { setContext() {} };

  helper.setProgram(program);
  helper.setOpenGLRenderWindow(win);

  // healthy frames must not discard a compiled program every pass
  expect(helper.getProgram()).toBe(program);
});
