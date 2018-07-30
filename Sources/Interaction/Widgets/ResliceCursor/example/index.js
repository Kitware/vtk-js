import 'vtk.js/Sources/favicon';

import vtkImageData from 'vtk.js/Sources/Common/DataModel/ImageData';
import vtkDataArray from 'vtk.js/Sources/Common/Core/DataArray';
import vtkOpenGLRenderWindow from 'vtk.js/Sources/Rendering/OpenGL/RenderWindow';
import vtkResliceCursor from 'vtk.js/Sources/Interaction/Widgets/ResliceCursor/ResliceCursor';
import vtkResliceCursorLineRepresentation from 'vtk.js/Sources/Interaction/Widgets/ResliceCursor/ResliceCursorLineRepresentation';
import vtkResliceCursorWidget from 'vtk.js/Sources/Interaction/Widgets/ResliceCursor/ResliceCursorWidget';
import vtkRenderer from 'vtk.js/Sources/Rendering/Core/Renderer';
import vtkRenderWindow from 'vtk.js/Sources/Rendering/Core/RenderWindow';
import vtkRenderWindowInteractor from 'vtk.js/Sources/Rendering/Core/RenderWindowInteractor';

// ----------------------------------------------------------------------------
// Standard rendering code setup
// ----------------------------------------------------------------------------
const container = document.querySelector('body');

// Define Image Data

const imageData = vtkImageData.newInstance();
const s = 0.1;
imageData.setSpacing(s, s, s);
imageData.setExtent(0, 127, 0, 127, 0, 127);
const dims = [128, 128, 128];

const newArray = new Uint8Array(dims[0] * dims[1] * dims[2]);

let i = 0;
for (let z = 0; z < dims[2]; z++) {
  for (let y = 0; y < dims[1]; y++) {
    for (let x = 0; x < dims[0]; x++) {
      newArray[i++] = 256 * (i % (dims[0] * dims[1])) / (dims[0] * dims[1]);
    }
  }
}

const da = vtkDataArray.newInstance({
  numberOfComponents: 1,
  values: newArray,
});
da.setName('scalars');

imageData.getPointData().setScalars(da);

// Define ResliceCursor

const resliceCursor = vtkResliceCursor.newInstance();
resliceCursor.setImage(imageData);

const renderWindows = [];
const renderers = [];
const GLWindows = [];
const interactors = [];
const resliceCursorWidgets = [];
const resliceCursorRepresentations = [];

const table = document.createElement('table');
table.setAttribute('id', 'table');
container.appendChild(table);

const tr1 = document.createElement('tr');
tr1.setAttribute('id', 'line1');
table.appendChild(tr1);

const tr2 = document.createElement('tr');
tr2.setAttribute('id', 'line2');
table.appendChild(tr2);

for (let j = 0; j < 3; ++j) {
  const element = document.createElement('td');

  if (j === 2) {
    tr2.appendChild(element);
  } else {
    tr1.appendChild(element);
  }

  renderWindows[j] = vtkRenderWindow.newInstance();
  renderers[j] = vtkRenderer.newInstance();
  renderers[j].getActiveCamera().setParallelProjection(true);
  renderWindows[j].addRenderer(renderers[j]);

  GLWindows[j] = vtkOpenGLRenderWindow.newInstance();
  GLWindows[j].setContainer(element);
  renderWindows[j].addView(GLWindows[j]);

  interactors[j] = vtkRenderWindowInteractor.newInstance();
  interactors[j].setView(GLWindows[j]);
  interactors[j].initialize();
  interactors[j].bindEvents(element);

  renderWindows[j].setInteractor(interactors[j]);

  resliceCursorWidgets[j] = vtkResliceCursorWidget.newInstance();
  resliceCursorRepresentations[
    j
  ] = vtkResliceCursorLineRepresentation.newInstance();
  resliceCursorWidgets[j].setWidgetRep(resliceCursorRepresentations[j]);
  resliceCursorRepresentations[j].getReslice().setInputData(imageData);
  resliceCursorRepresentations[j]
    .getCursorAlgorithm()
    .setResliceCursor(resliceCursor);

  resliceCursorWidgets[j].setInteractor(interactors[j]);
}

// X
resliceCursorRepresentations[0]
  .getCursorAlgorithm()
  .setReslicePlaneNormalToXAxis();

// Y
resliceCursorRepresentations[1]
  .getCursorAlgorithm()
  .setReslicePlaneNormalToYAxis();

// Z
resliceCursorRepresentations[2]
  .getCursorAlgorithm()
  .setReslicePlaneNormalToZAxis();

for (let k = 0; k < 3; k++) {
  resliceCursorWidgets[k].onInteractionEvent(() => {
    resliceCursorWidgets[0].render();
    resliceCursorWidgets[1].render();
    resliceCursorWidgets[2].render();
  });
  resliceCursorWidgets[k].setEnabled(true);

  renderers[k].resetCamera();
  renderWindows[k].render();
}

// Handle window resize
function resize() {
  renderWindows[0].render();
  renderWindows[1].render();
  renderWindows[2].render();
}

window.addEventListener('resize', resize());
