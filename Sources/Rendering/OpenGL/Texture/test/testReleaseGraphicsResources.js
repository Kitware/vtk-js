import { it, expect } from 'vitest';
import testUtils from 'vtk.js/Sources/Testing/testUtils';
import { createTrackedRenderView } from 'vtk.js/Sources/Testing/renderTestUtils';

import vtkActor from 'vtk.js/Sources/Rendering/Core/Actor';
import vtkMapper from 'vtk.js/Sources/Rendering/Core/Mapper';
import vtkOpenGLTexture from 'vtk.js/Sources/Rendering/OpenGL/Texture';
import vtkOpenGLFramebuffer from 'vtk.js/Sources/Rendering/OpenGL/Framebuffer';
import vtkOpenGLRenderWindow from 'vtk.js/Sources/Rendering/OpenGL/RenderWindow';
import vtkRenderWindow from 'vtk.js/Sources/Rendering/Core/RenderWindow';
import vtkPlaneSource from 'vtk.js/Sources/Filters/Sources/PlaneSource';
import vtkTexture from 'vtk.js/Sources/Rendering/Core/Texture';
import { VtkDataTypes } from 'vtk.js/Sources/Common/Core/DataArray/Constants';

function createCoreTexture(gc) {
  const image = new ImageData(2, 1);
  image.data.set([255, 0, 0, 255, 0, 0, 255, 255]);
  const texture = gc.registerResource(vtkTexture.newInstance());
  texture.setJsImageData(image);
  return texture;
}

function createRenderView(gc) {
  const view = gc.registerResource(vtkOpenGLRenderWindow.newInstance());
  gc.registerResource(vtkRenderWindow.newInstance()).addView(view);
  view.initialize();
  const gl = view.getContext();
  gc.registerResource(
    { delete: () => gl.getExtension('WEBGL_lose_context')?.loseContext() },
    -1
  );
  return view;
}

function expectFloatPixels(view, texture, data) {
  const gl = view.getContext();
  const framebuffer = vtkOpenGLFramebuffer.newInstance();
  framebuffer.setOpenGLRenderWindow(view);
  framebuffer.saveCurrentBindingsAndBuffers();
  try {
    framebuffer.create(1, 1);
    framebuffer.bind();
    framebuffer.setColorBuffer(texture);
    expect(gl.checkFramebufferStatus(gl.FRAMEBUFFER)).toBe(
      gl.FRAMEBUFFER_COMPLETE
    );
    expect(
      gl.getFramebufferAttachmentParameter(
        gl.FRAMEBUFFER,
        gl.COLOR_ATTACHMENT0,
        gl.FRAMEBUFFER_ATTACHMENT_RED_SIZE
      )
    ).toBe(16);
    const actual = new Float32Array(4);
    gl.readPixels(0, 0, 1, 1, gl.RGBA, gl.FLOAT, actual);
    expect(actual).toEqual(data);
  } finally {
    framebuffer.restorePreviousBindingsAndBuffers();
    framebuffer.delete();
  }
  expect(gl.getError()).toBe(gl.NO_ERROR);
}

function createTexturedActor(gc, texture = createCoreTexture(gc)) {
  const plane = gc.registerResource(vtkPlaneSource.newInstance());
  const mapper = gc.registerResource(vtkMapper.newInstance());
  mapper.setInputConnection(plane.getOutputPort());
  const actor = gc.registerResource(vtkActor.newInstance());
  actor.setMapper(mapper);
  actor.addTexture(texture);
  return actor;
}

it.skipIf(__VTK_TEST_NO_WEBGL__)(
  'frees an actor texture when the actor leaves the view or the view is deleted',
  () => {
    const gc = testUtils.createGarbageCollector();
    const { tracker, renderer, renderWindow, view } =
      createTrackedRenderView(gc);
    const gl = view.getContext();
    const sharedTexture = createCoreTexture(gc);
    const staying = createTexturedActor(gc, sharedTexture);
    renderer.addActor(staying);
    renderer.resetCamera();
    renderWindow.render();
    const oneActorObjects = tracker.count();

    const stayingHandle = view
      .getViewNodeFor(staying)
      .getViewNodeFor(sharedTexture)
      .getHandle();
    const leaving = createTexturedActor(gc, sharedTexture);
    renderer.addActor(leaving);
    renderWindow.render();
    expect(tracker.count()).toBeGreaterThan(oneActorObjects);
    const leavingHandle = view
      .getViewNodeFor(leaving)
      .getViewNodeFor(sharedTexture)
      .getHandle();

    renderer.removeActor(leaving);
    renderWindow.render();
    expect(tracker.count()).toBe(oneActorObjects);
    expect(gl.isTexture(leavingHandle)).toBe(false);
    expect(gl.isTexture(stayingHandle)).toBe(true);
    expect(gl.getError()).toBe(gl.NO_ERROR);

    gc.releaseResources();
    expect(tracker.count()).toBe(0);
  }
);

it.skipIf(__VTK_TEST_NO_WEBGL__)(
  'releases an active texture without a window argument and renders it again',
  async () => {
    const gc = testUtils.createGarbageCollector();
    const { tracker, renderer, renderWindow, view } =
      createTrackedRenderView(gc);
    const capture = () => {
      const image = view.captureNextImage();
      renderWindow.render();
      return image;
    };
    const background = await capture();

    const actor = createTexturedActor(gc);
    renderer.addActor(actor);
    renderer.resetCamera();
    const beforeRelease = await capture();
    const objectsInUse = tracker.count();
    expect(beforeRelease).not.toBe(background);

    const gl = view.getContext();
    const texture = view.getViewNodeFor(actor.getTextures()[0]);
    texture.activate();
    const handle = texture.getHandle();
    expect(texture.getTextureUnit()).toBeGreaterThanOrEqual(0);
    const otherUnit =
      gl.getParameter(gl.ACTIVE_TEXTURE) === gl.TEXTURE0
        ? gl.TEXTURE0 + 1
        : gl.TEXTURE0;
    gl.activeTexture(otherUnit);

    texture.releaseGraphicsResources();
    expect(gl.getParameter(gl.ACTIVE_TEXTURE)).toBe(otherUnit);
    expect(texture.getTextureUnit()).toBe(-1);
    expect(gl.isTexture(handle)).toBe(false);
    expect(tracker.count()).toBe(objectsInUse - 1);

    expect(await capture()).toBe(beforeRelease);
    expect(tracker.count()).toBe(objectsInUse);
    expect(gl.getError()).toBe(gl.NO_ERROR);
  }
);

it.skipIf(__VTK_TEST_NO_WEBGL__)(
  'frees a texture deleted after its render window',
  () => {
    const gc = testUtils.createGarbageCollector();
    const { tracker, view, emptySceneObjects } = createTrackedRenderView(gc);

    const resources = testUtils.createGarbageCollector();
    const texture = resources.registerResource(vtkOpenGLTexture.newInstance());
    const gl = view.getContext();
    texture.setOpenGLRenderWindow(view);
    texture.create2DFromRaw({
      width: 2,
      height: 2,
      numComps: 4,
      dataType: VtkDataTypes.UNSIGNED_CHAR,
      data: null,
    });
    expect(tracker.count()).toBe(emptySceneObjects + 1);

    const handle = texture.getHandle();
    expect(gl.isTexture(handle)).toBe(true);
    gc.releaseResources();
    expect(gl.isTexture(handle)).toBe(true);
    texture.delete();
    expect(gl.isTexture(handle)).toBe(false);
    expect(tracker.count()).toBe(0);
    expect(gl.getError()).toBe(gl.NO_ERROR);
  }
);

it.skipIf(__VTK_TEST_NO_WEBGL__)(
  'preserves explicit precision after release and migration to another context',
  ({ skip }) => {
    const gc = testUtils.createGarbageCollector();
    const view = createRenderView(gc);
    const otherView = createRenderView(gc);
    const gl = view.getContext();
    const otherGL = otherView.getContext();
    if (
      [gl, otherGL].some((ctx) => !ctx.getExtension('EXT_color_buffer_float'))
    ) {
      skip('Floating-point color attachments are unavailable.');
    }

    const texture = gc.registerResource(vtkOpenGLTexture.newInstance(), 1);
    texture.setOpenGLRenderWindow(view);
    texture.setInternalFormat(gl.RGBA16F);
    const data = Float32Array.from([0.25, 0.5, 0.75, 1]);
    const upload = (destination) => {
      expect(
        texture.create2DFromRaw({
          width: 1,
          height: 1,
          numComps: 4,
          dataType: VtkDataTypes.FLOAT,
          data,
        })
      ).toBe(true);
      expectFloatPixels(destination, texture, data);
    };
    upload(view);

    const firstHandle = texture.getHandle();
    texture.releaseGraphicsResources();
    expect(gl.isTexture(firstHandle)).toBe(false);
    upload(view);

    const secondHandle = texture.getHandle();
    texture.setOpenGLRenderWindow(otherView);
    expect(gl.isTexture(secondHandle)).toBe(false);
    expect(gl.getError()).toBe(gl.NO_ERROR);
    upload(otherView);
  }
);
