import '@kitware/vtk.js/favicon';

// Load the rendering pieces we want to use (for both WebGL and WebGPU)
import '@kitware/vtk.js/Rendering/Profiles/Geometry';

import vtkFullScreenRenderWindow from '@kitware/vtk.js/Rendering/Misc/FullScreenRenderWindow';
import vtkActor from '@kitware/vtk.js/Rendering/Core/Actor';
import vtkMapper from '@kitware/vtk.js/Rendering/Core/Mapper';

import vtkPLYWriter from '@kitware/vtk.js/IO/Geometry/PLYWriter';
import vtkPLYReader from '@kitware/vtk.js/IO/Geometry/PLYReader';
import vtkPolyDataReader from '@kitware/vtk.js/IO/Legacy/PolyDataReader';
// ----------------------------------------------------------------------------
// Standard rendering code setup
// ----------------------------------------------------------------------------

const fullScreenRenderer = vtkFullScreenRenderWindow.newInstance();
const renderer = fullScreenRenderer.getRenderer();
const renderWindow = fullScreenRenderer.getRenderWindow();

const reader = vtkPolyDataReader.newInstance();
const writerReader = vtkPLYReader.newInstance();

const writer = vtkPLYWriter.newInstance();
writer.setInputConnection(reader.getOutputPort());
reader
  .setUrl(`${__BASE_PATH__}/data/legacy/sphere.vtk`, { loadData: true })
  .then(() => {
    // writer.setTextureFileName('mytexture.jpg');

    const fileContents = writer.getOutputData();
    writerReader.parseAsText(new TextEncoder().encode(fileContents));
    // Can also use a static function to write to PLY:
    // const fileContents = vtkPLYWriter.writePLY(reader.getOutputData());
    // writerReader.parseAsArrayBuffer(fileContents.buffer);

    // Display the resulting PLY
    renderer.resetCamera();
    renderWindow.render();

    // Add a download link for it
    const blob = new Blob([fileContents], { type: 'application/octet-steam' });
    const a = window.document.createElement('a');
    a.href = window.URL.createObjectURL(blob, {
      type: 'application/octet-steam',
    });
    a.download = 'sphere.ply';
    a.text = 'Download';
    a.style.position = 'absolute';
    a.style.left = '50%';
    a.style.bottom = '10px';
    document.body.appendChild(a);
    a.style.background = 'white';
    a.style.padding = '5px';
  });

const actor = vtkActor.newInstance();
const mapper = vtkMapper.newInstance();
actor.setMapper(mapper);

mapper.setInputConnection(writerReader.getOutputPort());

renderer.addActor(actor);

global.writer = writer;
global.writerReader = writerReader;
global.mapper = mapper;
global.actor = actor;
global.renderer = renderer;
global.renderWindow = renderWindow;
