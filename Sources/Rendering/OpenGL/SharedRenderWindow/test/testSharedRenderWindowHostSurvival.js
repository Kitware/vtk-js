import test from 'tape';
import testUtils from 'vtk.js/Sources/Testing/testUtils';

import vtkActor from 'vtk.js/Sources/Rendering/Core/Actor';
import vtkMapper from 'vtk.js/Sources/Rendering/Core/Mapper';
import 'vtk.js/Sources/Rendering/Misc/RenderingAPIs';
import vtkRenderer from 'vtk.js/Sources/Rendering/Core/Renderer';
import vtkRenderWindow from 'vtk.js/Sources/Rendering/Core/RenderWindow';
import vtkConeSource from 'vtk.js/Sources/Filters/Sources/ConeSource';
import vtkSharedRenderWindow from 'vtk.js/Sources/Rendering/OpenGL/SharedRenderWindow';
import { GET_UNDERLYING_CONTEXT } from 'vtk.js/Sources/Rendering/OpenGL/RenderWindow/ContextProxy';

const VERT_SRC = `
  attribute vec2 aPos;
  void main() { gl_Position = vec4(aPos, 0.0, 1.0); }
`;
const FRAG_SRC = `
  precision mediump float;
  uniform vec4 uColor;
  void main() { gl_FragColor = uColor; }
`;

function createHostProgram(gl) {
  const vs = gl.createShader(gl.VERTEX_SHADER);
  gl.shaderSource(vs, VERT_SRC);
  gl.compileShader(vs);

  const fs = gl.createShader(gl.FRAGMENT_SHADER);
  gl.shaderSource(fs, FRAG_SRC);
  gl.compileShader(fs);

  const prog = gl.createProgram();
  gl.attachShader(prog, vs);
  gl.attachShader(prog, fs);
  gl.linkProgram(prog);
  return prog;
}

function createHostVAO(gl, prog) {
  const verts = new Float32Array([-1, -1, 1, -1, -1, 1, -1, 1, 1, -1, 1, 1]);
  const vao = gl.createVertexArray();
  gl.bindVertexArray(vao);
  const buf = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, buf);
  gl.bufferData(gl.ARRAY_BUFFER, verts, gl.STATIC_DRAW);
  const loc = gl.getAttribLocation(prog, 'aPos');
  gl.enableVertexAttribArray(loc);
  gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0);
  gl.bindVertexArray(null);
  return vao;
}

function setupHostState(gl, prog, vao, width, height) {
  gl.useProgram(prog);
  gl.bindVertexArray(vao);
  gl.viewport(width / 2, 0, width / 2, height);
  gl.scissor(width / 2, 0, width / 2, height);
  gl.enable(gl.SCISSOR_TEST);
  gl.enable(gl.BLEND);
  gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
  gl.disable(gl.DEPTH_TEST);
  gl.depthMask(false);
}

function hostDraw(gl, prog) {
  const colorLoc = gl.getUniformLocation(prog, 'uColor');
  gl.uniform4f(colorLoc, 0.0, 0.8, 0.0, 1.0);
  gl.drawArrays(gl.TRIANGLES, 0, 6);
}

test.onlyIfWebGL(
  'Test host raw WebGL rendering can resume after renderShared when state is rebound',
  (t) => {
    const gc = testUtils.createGarbageCollector();

    const container = document.querySelector('body');
    const renderWindowContainer = gc.registerDOMElement(
      document.createElement('div')
    );
    container.appendChild(renderWindowContainer);

    const renderWindow = gc.registerResource(vtkRenderWindow.newInstance());
    const renderer = gc.registerResource(vtkRenderer.newInstance());
    renderWindow.addRenderer(renderer);
    renderer.setBackground(0.1, 0.1, 0.2);

    const actor = gc.registerResource(vtkActor.newInstance());
    renderer.addActor(actor);
    const mapper = gc.registerResource(vtkMapper.newInstance());
    actor.setMapper(mapper);
    const cone = gc.registerResource(vtkConeSource.newInstance());
    mapper.setInputConnection(cone.getOutputPort());

    const glWindow = gc.registerResource(renderWindow.newAPISpecificView());
    glWindow.setContainer(renderWindowContainer);
    renderWindow.addView(glWindow);
    glWindow.setSize(400, 400);

    const glProxy = glWindow.get3DContext();
    const gl = glProxy?.[GET_UNDERLYING_CONTEXT]?.();
    t.ok(gl, 'WebGL context created');

    const sharedWindow = gc.registerResource(
      vtkSharedRenderWindow.createFromContext(glWindow.getCanvas(), gl)
    );
    sharedWindow.setAutoClear(true);
    sharedWindow.setSize(400, 400);
    renderWindow.removeView(glWindow);
    renderWindow.addView(sharedWindow);
    renderer.resetCamera();

    const hostProg = createHostProgram(gl);
    const hostVAO = createHostVAO(gl, hostProg);
    const W = 400;
    const H = 400;

    setupHostState(gl, hostProg, hostVAO, W, H);
    hostDraw(gl, hostProg);

    sharedWindow.renderShared();

    setupHostState(gl, hostProg, hostVAO, W, H);
    hostDraw(gl, hostProg);

    gl.bindFramebuffer(gl.FRAMEBUFFER, null);
    const px = new Uint8Array(4);
    gl.readPixels(300, 200, 1, 1, gl.RGBA, gl.UNSIGNED_BYTE, px);
    t.ok(
      px[1] > 150 && px[0] < 50 && px[2] < 50,
      `Right half center should be green, got rgba(${px[0]},${px[1]},${px[2]},${px[3]})`
    );

    gl.readPixels(100, 200, 1, 1, gl.RGBA, gl.UNSIGNED_BYTE, px);
    const isHostGreen = px[1] > 150 && px[0] < 50 && px[2] < 50;
    t.notOk(
      isHostGreen,
      `Left half should not be host green, got rgba(${px[0]},${px[1]},${px[2]},${px[3]})`
    );

    gl.deleteProgram(hostProg);
    gl.deleteVertexArray(hostVAO);
    gc.releaseResources();
    t.end();
  }
);
