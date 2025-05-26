import '@kitware/vtk.js/favicon';

// Load the rendering pieces we want to use (for both WebGL and WebGPU)
import '@kitware/vtk.js/Rendering/Profiles/Geometry';

import '@kitware/vtk.js/IO/Core/DataAccessHelper/HttpDataAccessHelper'; // HTTP + zip

import vtkActor from '@kitware/vtk.js/Rendering/Core/Actor';
import vtkCubeSource from '@kitware/vtk.js/Filters/Sources/CubeSource';
import vtkDataArray from '@kitware/vtk.js/Common/Core/DataArray';
import vtkFullScreenRenderWindow from '@kitware/vtk.js/Rendering/Misc/FullScreenRenderWindow';
import vtkMapper from '@kitware/vtk.js/Rendering/Core/Mapper';
import vtkOBJWriter from '@kitware/vtk.js/IO/Misc/OBJWriter';
import vtkTexture from '@kitware/vtk.js/Rendering/Core/Texture';

// ----------------------------------------------------------------------------
// Standard rendering code setup
// ----------------------------------------------------------------------------

const fullScreenRenderer = vtkFullScreenRenderWindow.newInstance();
const renderer = fullScreenRenderer.getRenderer();
const renderWindow = fullScreenRenderer.getRenderWindow();

const resetCamera = renderer.resetCamera;
const render = renderWindow.render;

// Create a colored texture for each face of the cube
const canvas = document.createElement('canvas');
canvas.width = 256;
canvas.height = 256;
const ctx = canvas.getContext('2d');

// Define colors for each face (order: +X, -X, +Y, -Y, +Z, -Z)
const faceColors = [
  '#FF0000', // +X: Red
  '#00FF00', // -X: Green
  '#0000FF', // +Y: Blue
  '#FFFF00', // -Y: Yellow
  '#00FFFF', // +Z: Cyan
  '#FF00FF', // -Z: Magenta
];

// Draw each face as a square in a 3x2 grid
const faceSize = 128;
for (let i = 0; i < 6; i++) {
  const x = (i % 3) * faceSize;
  const y = Math.floor(i / 3) * faceSize;
  ctx.fillStyle = faceColors[i];
  ctx.fillRect(x, y, faceSize, faceSize);
}

function callback(source, tex) {
  const writer = vtkOBJWriter.newInstance();
  writer.setInputData(source.getOutputData());
  writer.setTexture(tex);

  // const objContent = writer.getOutputData();
  // const mtlContent = writer.getMtl();

  const zip = writer.exportAsZip();
  zip.then((zipData) => {
    const blob = new Blob([zipData], { type: 'application/zip' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.text = 'Download';
    link.style.position = 'absolute';
    link.style.left = '50%';
    link.style.bottom = '10px';
    link.style.background = 'white';
    link.style.padding = '5px';
    global.writer = writer;
    document.body.appendChild(link);
  });
}

// Create a cube source
const cubeSource = vtkCubeSource.newInstance({
  xLength: 1,
  yLength: 1,
  zLength: 1,
});

// Create vtkTexture from canvas
const texture = vtkTexture.newInstance();
const image = new Image();
image.src = canvas.toDataURL();
image.onload = () => {
  texture.setImage(image);
  callback(cubeSource, texture);
  render();
};

// Add tcoords to the cube for proper texture mapping
const addCubeTCoords = (polyData) => {
  const points = polyData.getPoints().getData();
  const numPoints = points.length / 3;
  const tcoords = new Float32Array(numPoints * 2);

  // Map each face to a region of the texture
  const polys = polyData.getPolys().getData();
  const faces = [];
  const f = [];
  let i = 0;
  while (i < polys.length) {
    f.length = 0; // Reset face array
    const n = polys[i++];
    for (let j = 0; j < n; j++) {
      f.push(polys[i++]);
    }
    faces.push(f);
  }

  // Map each face's points to the corresponding region in the texture
  faces.forEach((face, faceIdx) => {
    // Compute texture region for this face
    const col = faceIdx % 3;
    const row = Math.floor(faceIdx / 3);
    const u0 = col / 3;
    const v0 = row / 2;
    const u1 = (col + 1) / 3;
    const v1 = (row + 1) / 2;

    // Assign tcoords to each point in the face
    face.forEach((ptIdx, j) => {
      // For quads, assign corners in order
      // For triangles, just map to the region
      let u;
      let v;
      if (face.length === 4) {
        // Map corners: 0-bottom left, 1-bottom right, 2-top right, 3-top left
        if (j === 0) {
          u = u0;
          v = v0;
        } else if (j === 1) {
          u = u1;
          v = v0;
        } else if (j === 2) {
          u = u1;
          v = v1;
        } else {
          u = u0;
          v = v1;
        }
      } else {
        // For triangles, just use barycentric mapping
        u = u0 + (u1 - u0) * (j % 2);
        v = v0 + (v1 - v0) * Math.floor(j / 2);
      }
      tcoords[ptIdx * 2] = u;
      tcoords[ptIdx * 2 + 1] = v;
    });
  });

  const tcoordArray = vtkDataArray.newInstance({
    name: 'TextureCoordinates',
    numberOfComponents: 2,
    values: tcoords,
  });
  polyData.getPointData().setTCoords(tcoordArray);
};

const polyData = cubeSource.getOutputData();
addCubeTCoords(polyData);

const mapper = vtkMapper.newInstance();
mapper.setInputData(polyData);

const actor = vtkActor.newInstance();
actor.setMapper(mapper);
actor.addTexture(texture);

renderer.addActor(actor);
resetCamera();
render();

global.fullScreenRenderer = fullScreenRenderer;
