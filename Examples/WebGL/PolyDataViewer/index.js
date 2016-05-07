import ConeSource from '../../../Sources/Filters/Sources/ConeSource';
import WebGlUtil from '../../../Sources/Rendering/WebGL/Utilities/WebGLUtils.js';
import CanvasOffscreenBuffer from '../../../Sources/Rendering/WebGL/Utilities/CanvasOffscreenBuffer.js';

import vertexShaderString from './basicVertex.glsl';
import framentShaderString from './basicFragment.glsl';

let numberOfPoints = 6;

function render(gl, resources, width, height) {
  // Draw to the screen framebuffer
  gl.bindFramebuffer(gl.FRAMEBUFFER, null);

  // Using the display shader program
  gl.useProgram(resources.programs.displayProgram);

  gl.clear(gl.COLOR_BUFFER_BIT);
  gl.viewport(0, 0, width, height);

  // Draw the rectangle.
  gl.drawArrays(gl.POINTS, 0, numberOfPoints);
}

function buildPositionBufferFromPoints(data) {
  return data.PolyData.Points.values;
}

// Create cone source instance
const coneSource = ConeSource.newInstance({ height: 2.0 });
const polydata = coneSource.getOutput();

console.log(polydata);

const width = 500;
const height = 500;

const glCanvas = new CanvasOffscreenBuffer(width, height);
glCanvas.el.style.display = 'block';
const pointsArray = buildPositionBufferFromPoints(polydata);
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

window.onresize = () => {
  console.log('Re-rendering');
  render(gl, glResources, width, height);
};

render(gl, glResources, width, height);
