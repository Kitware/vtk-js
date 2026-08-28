import { expect, it } from 'vitest';
import testUtils from 'vtk.js/Sources/Testing/testUtils';
import { createTrackedRenderView } from 'vtk.js/Sources/Testing/renderTestUtils';

import { VtkDataTypes } from 'vtk.js/Sources/Common/Core/DataArray/Constants';
import vtkOpenGLFramebuffer from 'vtk.js/Sources/Rendering/OpenGL/Framebuffer';
import vtkOpenGLTexture from 'vtk.js/Sources/Rendering/OpenGL/Texture';

function createTexture(renderWindow) {
  const texture = vtkOpenGLTexture.newInstance();
  texture.setOpenGLRenderWindow(renderWindow);
  texture.create2DFromRaw({
    width: 32,
    height: 32,
    numComps: 4,
    dataType: VtkDataTypes.UNSIGNED_CHAR,
    data: null,
  });
  return texture;
}

function releaseTexture(texture, renderWindow) {
  texture.releaseGraphicsResources(renderWindow);
  texture.delete();
}

it.skipIf(__VTK_TEST_NO_WEBGL__)(
  'releases owned resources without releasing borrowed attachments',
  () => {
    const gc = testUtils.createGarbageCollector();
    const { tracker, view, emptySceneObjects } = createTrackedRenderView(gc);

    const borrowedTexture = createTexture(view);
    const borrowedTextureObjects = tracker.count();
    expect(borrowedTextureObjects).toBeGreaterThan(emptySceneObjects);

    const framebuffer = vtkOpenGLFramebuffer.newInstance();
    framebuffer.setOpenGLRenderWindow(view);
    framebuffer.saveCurrentBindingsAndBuffers();
    framebuffer.create(32, 32);
    framebuffer.populateFramebuffer();
    const populatedObjects = tracker.count();
    expect(populatedObjects).toBeGreaterThan(borrowedTextureObjects);

    // replacing the owned attachment frees it; the replacement stays borrowed
    framebuffer.setColorBuffer(borrowedTexture);
    expect(tracker.count()).toBe(populatedObjects - 1);
    expect(view.getContext().isTexture(borrowedTexture.getHandle())).toBe(true);

    // rebuilding replaces the owned objects instead of accumulating them
    framebuffer.create(64, 64);
    framebuffer.populateFramebuffer();
    expect(tracker.count()).toBe(populatedObjects);

    const beforeRemove = tracker.count();
    framebuffer.removeColorBuffer();
    expect(tracker.count()).toBe(beforeRemove - 1);
    expect(() => framebuffer.bind()).not.toThrow();
    framebuffer.restorePreviousBindingsAndBuffers();

    framebuffer.delete();
    expect(tracker.count()).toBe(borrowedTextureObjects);

    releaseTexture(borrowedTexture, view);
    expect(tracker.count()).toBe(emptySceneObjects);
    gc.releaseResources();
  }
);

// The surface LIC passes attach at sparse locations, remove attachments while
// others stay, and recreate the framebuffer while it is bound.
it.skipIf(__VTK_TEST_NO_WEBGL__)(
  'keeps attachment slots aligned and stays bound across create',
  () => {
    const gc = testUtils.createGarbageCollector();
    const { view } = createTrackedRenderView(gc);
    const gl = view.getContext();

    const texture0 = createTexture(view);
    const texture2 = createTexture(view);
    const framebuffer = vtkOpenGLFramebuffer.newInstance();
    framebuffer.setOpenGLRenderWindow(view);
    framebuffer.saveCurrentBindingsAndBuffers();
    framebuffer.create(32, 32);
    framebuffer.bind();
    framebuffer.setColorBuffer(texture0, 0);
    framebuffer.setColorBuffer(texture2, 2);

    // Removing one attachment must not shift the others off their slots.
    framebuffer.removeColorBuffer(0);
    expect(framebuffer.getColorBuffers()[2]).toBe(texture2);
    expect(() => framebuffer.bind()).not.toThrow();

    // recreating while bound must keep the caller on the new framebuffer
    framebuffer.create(32, 32);
    expect(gl.getParameter(gl.FRAMEBUFFER_BINDING)).toBe(
      framebuffer.getGLFramebuffer()
    );

    framebuffer.restorePreviousBindingsAndBuffers();
    framebuffer.delete();
    releaseTexture(texture0, view);
    releaseTexture(texture2, view);
    gc.releaseResources();
  }
);

it.skipIf(__VTK_TEST_NO_WEBGL__)(
  'restores a saved binding that create() replaced',
  () => {
    const gc = testUtils.createGarbageCollector();
    const { renderWindow, view } = createTrackedRenderView(gc);
    renderWindow.render();
    const gl = view.getContext();

    const framebuffer = vtkOpenGLFramebuffer.newInstance();
    framebuffer.setOpenGLRenderWindow(view);
    framebuffer.create(32, 32);
    framebuffer.bind();

    // the saved binding is this framebuffer, which the next create() deletes
    framebuffer.saveCurrentBindingsAndBuffers();
    framebuffer.create(64, 64);
    framebuffer.restorePreviousBindingsAndBuffers();

    expect(gl.getError()).toBe(gl.NO_ERROR);
    expect(gl.getParameter(gl.FRAMEBUFFER_BINDING)).toBe(
      framebuffer.getGLFramebuffer()
    );

    framebuffer.delete();
  }
);
