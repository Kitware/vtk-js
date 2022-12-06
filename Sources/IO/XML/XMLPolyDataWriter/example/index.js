import '@kitware/vtk.js/favicon';

// Load the rendering pieces we want to use (for both WebGL and WebGPU)
import '@kitware/vtk.js/Rendering/Profiles/Geometry';

import vtkFullScreenRenderWindow from '@kitware/vtk.js/Rendering/Misc/FullScreenRenderWindow';
import vtkActor from '@kitware/vtk.js/Rendering/Core/Actor';
import vtkMapper from '@kitware/vtk.js/Rendering/Core/Mapper';

import vtkHttpDataSetReader from '@kitware/vtk.js/IO/Core/HttpDataSetReader';
import vtkXMLPolyDataReader from '@kitware/vtk.js/IO/XML/XMLPolyDataReader';
import vtkXMLPolyDataWriter from '@kitware/vtk.js/IO/XML/XMLPolyDataWriter';
import vtkXMLWriter from '@kitware/vtk.js/IO/XML/XMLWriter';

// use full HttpDataAccessHelper
import '@kitware/vtk.js/IO/Core/DataAccessHelper/HttpDataAccessHelper';

// ----------------------------------------------------------------------------
// Standard rendering code setup
// ----------------------------------------------------------------------------

const fullScreenRenderer = vtkFullScreenRenderWindow.newInstance();
const renderer = fullScreenRenderer.getRenderer();
const renderWindow = fullScreenRenderer.getRenderWindow();

const reader = vtkHttpDataSetReader.newInstance({ fetchGzip: true });

const writer = vtkXMLPolyDataWriter.newInstance();
writer.setFormat(vtkXMLWriter.FormatTypes.BINARY);
writer.setInputConnection(reader.getOutputPort());

const writerReader = vtkXMLPolyDataReader.newInstance();

reader.setUrl(`${__BASE_PATH__}/data/cow.vtp`, { loadData: true }).then(() => {
  const fileContents = writer.write(reader.getOutputData());

  // Try to read it back.
  const textEncoder = new TextEncoder();
  writerReader.parseAsArrayBuffer(textEncoder.encode(fileContents));
  renderer.resetCamera();
  renderWindow.render();

  const blob = new Blob([fileContents], { type: 'text/plain' });
  const a = window.document.createElement('a');
  a.href = window.URL.createObjectURL(blob, { type: 'text/plain' });
  a.download = 'cow.vtp';
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
