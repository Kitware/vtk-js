import '@kitware/vtk.js/favicon';

import '@kitware/vtk.js/Rendering/Profiles/Geometry';
import '@kitware/vtk.js/IO/Core/DataAccessHelper/HttpDataAccessHelper';

import vtkActor from '@kitware/vtk.js/Rendering/Core/Actor';
import vtkClipPolyData from '@kitware/vtk.js/Filters/Core/ClipPolyData';
import vtkFullScreenRenderWindow from '@kitware/vtk.js/Rendering/Misc/FullScreenRenderWindow';
import vtkHttpDataSetReader from '@kitware/vtk.js/IO/Core/HttpDataSetReader';
import vtkMapper from '@kitware/vtk.js/Rendering/Core/Mapper';
import vtkPlane from '@kitware/vtk.js/Common/DataModel/Plane';
import vtkTriangleFilter from '@kitware/vtk.js/Filters/General/TriangleFilter';
import GUI from 'lil-gui';

const fullScreenRenderer = vtkFullScreenRenderWindow.newInstance();
const renderer = fullScreenRenderer.getRenderer();
const renderWindow = fullScreenRenderer.getRenderWindow();

const plane = vtkPlane.newInstance({
  origin: [0, 0, 0],
  normal: [1, 0, 0],
});

const reader = vtkHttpDataSetReader.newInstance({ fetchGzip: true });
const triangleFilter = vtkTriangleFilter.newInstance();
triangleFilter.setInputConnection(reader.getOutputPort());
const clipper = vtkClipPolyData.newInstance({
  clipFunction: plane,
  generateClippedOutput: true,
});
clipper.setInputConnection(triangleFilter.getOutputPort());

const keptMapper = vtkMapper.newInstance();
keptMapper.setInputConnection(clipper.getOutputPort());
keptMapper.setScalarVisibility(false);

const keptActor = vtkActor.newInstance();
keptActor.setMapper(keptMapper);
keptActor.getProperty().setColor(0.9, 0.3, 0.2);
keptActor.getProperty().setOpacity(0.85);

const clippedMapper = vtkMapper.newInstance();
clippedMapper.setInputConnection(clipper.getOutputPort(1));
clippedMapper.setScalarVisibility(false);

const clippedActor = vtkActor.newInstance();
clippedActor.setMapper(clippedMapper);
clippedActor.getProperty().setColor(0.2, 0.55, 0.95);
clippedActor.getProperty().setOpacity(0.45);

const state = {
  clipX: 0,
};

const gui = new GUI();
let bounds = null;

function addLegendLabel(folder, text, color) {
  const row = document.createElement('div');
  row.style.padding = '6px 10px';
  row.style.fontSize = '12px';
  row.style.lineHeight = '1.4';
  row.style.color = '#f3f4f6';

  const swatch = document.createElement('span');
  swatch.style.display = 'inline-block';
  swatch.style.width = '10px';
  swatch.style.height = '10px';
  swatch.style.marginRight = '8px';
  swatch.style.borderRadius = '999px';
  swatch.style.background = color;
  swatch.style.verticalAlign = 'middle';

  const label = document.createElement('span');
  label.textContent = text;

  row.appendChild(swatch);
  row.appendChild(label);
  folder.domElement.appendChild(row);
}

function updatePlane() {
  if (!bounds) {
    return;
  }

  plane.setOrigin(
    state.clipX,
    0.5 * (bounds[2] + bounds[3]),
    0.5 * (bounds[4] + bounds[5])
  );
  renderWindow.render();
}

reader.setUrl(`${__BASE_PATH__}/data/cow.vtp`).then(() => {
  reader.loadData().then(() => {
    const input = reader.getOutputData();
    bounds = input.getBounds();
    state.clipX = 0.5 * (bounds[0] + bounds[1]);
    updatePlane();

    addLegendLabel(gui, 'Kept side', '#e54d33');
    addLegendLabel(gui, 'Clipped side', '#338ce5');

    gui
      .add(state, 'clipX', bounds[0], bounds[1], 0.01)
      .name('Clip')
      .onChange((value) => {
        state.clipX = Number(value);
        updatePlane();
      });

    renderer.addActor(keptActor);
    renderer.addActor(clippedActor);

    renderer.resetCamera();
    renderWindow.render();
  });
});
