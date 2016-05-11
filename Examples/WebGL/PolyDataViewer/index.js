import ConeSource from '../../../Sources/Filters/Sources/ConeSource';
import WebGlUtil from './WebGLUtils.js';
import CanvasOffscreenBuffer from './CanvasOffscreenBuffer.js';
import Camera from '../../../Sources/Rendering/Core/Camera';
import { mat4 } from 'gl-matrix';

import vertexShaderString from './basicVertex.glsl';
import framentShaderString from './basicFragment.glsl';

const mvp = mat4.create();
let numberOfPoints = 6;

function webGlRender(gl, resources, width, height) {
  // Draw to the screen framebuffer
  gl.bindFramebuffer(gl.FRAMEBUFFER, null);

  // Using the display shader program
  gl.useProgram(resources.programs.displayProgram);

  gl.clear(gl.COLOR_BUFFER_BIT);
  gl.viewport(0, 0, width, height);

  const mvpLoc = gl.getUniformLocation(resources.programs.displayProgram, 'mvp');
  gl.uniformMatrix4fv(mvpLoc, false, mvp);

  // Draw the rectangle.
  gl.drawArrays(gl.POINTS, 0, numberOfPoints);
}

// Create cone source instance
const coneSource = ConeSource.newInstance({ height: 2.0 });
const polydata = coneSource.getOutput();

console.log(polydata);

const width = 500;
const height = 500;

const glCanvas = new CanvasOffscreenBuffer(width, height);
glCanvas.el.style.display = 'block';
const pointsArray = polydata.PolyData.Points.values;
numberOfPoints = pointsArray.length / 3;

// Inialize GL context
const gl = glCanvas.get3DContext();
if (!gl) {
  throw new Error('Unable to get WebGl context');
}

// Set clear color to white, fully transparent
gl.clearColor(0.0, 0.0, 0.0, 1.0);

// Set up GL resources
const glConfig = {
  programs: {
    displayProgram: {
      vertexShader: vertexShaderString,
      fragmentShader: framentShaderString,
      mapping: 'default',
    },
  },
  resources: {
    buffers: [
      {
        id: 'posCoord',
        data: pointsArray,
      },
    ],

  },
  mappings: {
    default: [
      {
        id: 'posCoord',
        name: 'positionLocation',
        attribute: 'a_position',
        format: [3, gl.FLOAT, false, 0, 0],
      },
    ],
  },
};

const glResources = WebGlUtil.createGLResources(gl, glConfig);

const camera = Camera.newInstance({
  position: [0, 0, 4],
  parallelProjection: true,
  parallelScale: 2,
});

let viewMatrix = null;
let projMatrix = null;
let animating = false;

function animate() {
  camera.roll(5);
  viewMatrix = camera.getViewTransformMatrix();
  projMatrix = camera.getProjectionTransformMatrix(1, 0.01, 20.01);
  mat4.multiply(mvp, projMatrix, viewMatrix);

  webGlRender(gl, glResources, width, height);

  if (animating) {
    window.requestAnimationFrame(animate);
  }
}

const button = document.createElement('button');
button.setAttribute('type', 'input');
button.innerHTML = 'start';
document.getElementsByTagName('body')[0].appendChild(button);
button.addEventListener('click', () => {
  animating = !animating;
  button.innerHTML = animating ? 'stop' : 'start';
  if (animating) {
    window.requestAnimationFrame(animate);
  }
});

animate();
