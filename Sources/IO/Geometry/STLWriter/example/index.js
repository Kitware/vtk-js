import 'vtk.js/Sources/favicon';

import vtkFullScreenRenderWindow from 'vtk.js/Sources/Rendering/Misc/FullScreenRenderWindow';
import vtkActor from 'vtk.js/Sources/Rendering/Core/Actor';
import vtkMapper from 'vtk.js/Sources/Rendering/Core/Mapper';

import vtkHttpDataSetReader from 'vtk.js/Sources/IO/Core/HttpDataSetReader';
import vtkSTLWriter from 'vtk.js/Sources/IO/Geometry/STLWriter';
import vtkSTLReader from 'vtk.js/Sources/IO/Geometry/STLReader';

// ----------------------------------------------------------------------------
// Standard rendering code setup
// ----------------------------------------------------------------------------

const fullScreenRenderer = vtkFullScreenRenderWindow.newInstance();
const renderer = fullScreenRenderer.getRenderer();
const renderWindow = fullScreenRenderer.getRenderWindow();

const reader = vtkHttpDataSetReader.newInstance({ fetchGzip: true });
const writerReader = vtkSTLReader.newInstance();

const writer = vtkSTLWriter.newInstance();
// writer.setInputConnection(reader.getOutputPort());

reader.setUrl(`${__BASE_PATH__}/data/cow.vtp`, { loadData: true }).then(() => {
  // const fileContents = writer.write(reader.getOutputData());

  global.readerOutput = reader.getOutputData();
  writer.setInputData(reader.getOutputData());
  const fileContents = writer.getOutputData();
  
  // Try to read it back.
  /*const textEncoder = new TextEncoder();
  
  writerReader.parseAsArrayBuffer(textEncoder.encode(fileContents.buffer.prototype.buffer));
  renderer.resetCamera();
  renderWindow.render();
  */

  const blob = new Blob([fileContents], { type: 'application/octet-steam' });
  const a = window.document.createElement('a');
  a.href = window.URL.createObjectURL(blob, {
    type: 'application/octet-steam',
  });
  a.download = 'cow.stl';
  a.text = 'Download';
  a.style.position = 'absolute';
  a.style.left = '50%';
  a.style.bottom = '10px';
  document.body.appendChild(a);
  a.style.background = 'white';
  a.style.padding = '5px';
});

/*const actor = vtkActor.newInstance();
const mapper = vtkMapper.newInstance();
actor.setMapper(mapper);

mapper.setInputConnection(writerReader.getOutputPort()); // TODO: replace writerReader by STLReader

renderer.addActor(actor);

global.writer = writer;
global.writerReader = writerReader;
global.mapper = mapper;
global.actor = actor;
global.renderer = renderer;
global.renderWindow = renderWindow;*/
