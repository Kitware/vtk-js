import 'vtk.js/Sources/favicon';

import vtkHttpDataSetReader from 'vtk.js/IO/Core/HttpDataSetReader';
import vtkOpenGLRenderWindow from 'vtk.js/Rendering/OpenGL/RenderWindow';
import vtkResliceCursor from 'vtk.js/Interaction/Widgets/ResliceCursor/ResliceCursor';
import vtkResliceCursorLineRepresentation from 'vtk.js/Interaction/Widgets/ResliceCursor/ResliceCursorLineRepresentation';
import vtkResliceCursorWidget from 'vtk.js/Interaction/Widgets/ResliceCursor/ResliceCursorWidget';
import vtkRenderer from 'vtk.js/Rendering/Core/Renderer';
import vtkRenderWindow from 'vtk.js/Rendering/Core/RenderWindow';
import vtkRenderWindowInteractor from 'vtk.js/Rendering/Core/RenderWindowInteractor';

// ----------------------------------------------------------------------------
// Standard rendering code setup
// ----------------------------------------------------------------------------
const container = document.querySelector('body');

// Define ResliceCursor

const resliceCursor = vtkResliceCursor.newInstance();

const reader = vtkHttpDataSetReader.newInstance({ fetchGzip: true });
reader.setUrl(`${__BASE_PATH__}/data/volume/LIDC2.vti`).then(() => {
  reader.loadData().then(() => {
    const image = reader.getOutputData();
    resliceCursor.setImage(image);

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
      resliceCursorRepresentations[j].getReslice().setInputData(image);
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
  });
});
