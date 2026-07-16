import { it, expect } from 'vitest';

import vtkFramebuffer from 'vtk.js/Sources/Rendering/OpenGL/Framebuffer';
import vtkRenderWindow from 'vtk.js/Sources/Rendering/Core/RenderWindow';
import 'vtk.js/Sources/Rendering/Misc/RenderingAPIs';

function createContextHarness() {
  const renderWindow = vtkRenderWindow.newInstance();
  const view = renderWindow.newAPISpecificView('WebGL');
  renderWindow.addView(view);
  view.initialize();
  const gl = view.getContext();

  // Count FRAMEBUFFER_BINDING readbacks while keeping getParameter working.
  const rawGetParameter = gl.getParameter.bind(gl);
  const counter = { bindingQueries: 0 };
  gl.getParameter = (pname) => {
    if (pname === gl.FRAMEBUFFER_BINDING) {
      counter.bindingQueries += 1;
    }
    return rawGetParameter(pname);
  };

  const makeFramebuffer = () => {
    const framebuffer = vtkFramebuffer.newInstance();
    framebuffer.setOpenGLRenderWindow(view);
    framebuffer.create(4, 4);
    return framebuffer;
  };

  const currentBinding = () => rawGetParameter(gl.FRAMEBUFFER_BINDING);

  // Deleting the own property restores the prototype method.
  const removeSpy = () => delete gl.getParameter;

  return { view, counter, makeFramebuffer, currentBinding, removeSpy };
}

it.skipIf(__VTK_TEST_NO_WEBGL__)(
  'save/restore reads the binding back from GL when tracking is not seeded',
  () => {
    const { view, counter, makeFramebuffer, currentBinding, removeSpy } =
      createContextHarness();
    const framebuffer = makeFramebuffer();

    expect(view.getFramebufferBinding()).toBeUndefined();

    framebuffer.saveCurrentBindingsAndBuffers();
    expect(counter.bindingQueries).toBe(1);

    framebuffer.bind();
    // Binds do not seed tracking on their own.
    expect(view.getFramebufferBinding()).toBeUndefined();

    framebuffer.restorePreviousBindingsAndBuffers();
    expect(currentBinding()).toBe(null);

    framebuffer.saveCurrentBindingsAndBuffers();
    expect(counter.bindingQueries).toBe(2);
    removeSpy();
  }
);

it.skipIf(__VTK_TEST_NO_WEBGL__)(
  'seeded binding tracking avoids getParameter and follows bind/restore',
  () => {
    const { view, counter, makeFramebuffer, currentBinding, removeSpy } =
      createContextHarness();
    const outer = makeFramebuffer();
    const inner = makeFramebuffer();

    // The caller (e.g. a host embedding vtk.js) declares what is bound.
    view.setFramebufferBinding(null);

    outer.saveCurrentBindingsAndBuffers();
    outer.bind();
    expect(view.getFramebufferBinding()).toBe(outer.getGLFramebuffer());

    // Nested save/restore (a mapper capturing state inside a render pass)
    // must see the outer binding through the mirror.
    inner.saveCurrentBindingsAndBuffers();
    inner.bind();
    expect(view.getFramebufferBinding()).toBe(inner.getGLFramebuffer());
    inner.restorePreviousBindingsAndBuffers();
    expect(currentBinding()).toBe(outer.getGLFramebuffer());
    expect(view.getFramebufferBinding()).toBe(outer.getGLFramebuffer());

    outer.restorePreviousBindingsAndBuffers();
    expect(currentBinding()).toBe(null);
    expect(view.getFramebufferBinding()).toBe(null);

    expect(counter.bindingQueries).toBe(0);
    removeSpy();
  }
);
