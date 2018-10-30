import macro from 'vtk.js/Sources/macro';
import style from 'vtk.js/Sources/Interaction/UI/FPSMonitor/FPSMonitor.module.css';

const noOp = Function.prototype;

function formatNumbers(n) {
  const sections = [];
  let size = n;
  while (size > 1000) {
    sections.push(`000${size % 1000}`.slice(-3));
    size = Math.floor(size / 1000);
  }
  if (size > 0) {
    sections.push(size);
  }
  sections.reverse();
  return sections.join("'");
}

// ----------------------------------------------------------------------------
// vtkFPSMonitor methods
// ----------------------------------------------------------------------------

function vtkFPSMonitor(publicAPI, model) {
  // Set our className
  model.classHierarchy.push('vtkFPSMonitor');

  model.fpsMonitorContainer = document.createElement('div');
  model.fpsMonitorContainer.setAttribute('class', model.orientationClass);
  model.fpsMonitorContainer.innerHTML = `
    <div class="${style.leftPane}">
      <div class="js-title ${style.title}">Mean N/A - Current N/A</div>
      <canvas class="js-graph ${style.graph}"></canvas>
    </div>
    <div class="js-info ${style.rightPane}">
    </div>`;

  // Extract various containers
  model.canvas = model.fpsMonitorContainer.querySelector('.js-graph');
  model.title = model.fpsMonitorContainer.querySelector('.js-title');
  model.info = model.fpsMonitorContainer.querySelector('.js-info');

  // --------------------------------------------------------------------------
  // Private methods
  // --------------------------------------------------------------------------

  function renderTitle() {
    model.title.style.display = model.titleVisibility ? 'block' : 'none';
    if (!model.titleVisibility) {
      return;
    }
    const nextFPS = model.buffer[model.buffer.length - 1];
    const newTxt = `Mean: ${Math.round(
      model.fpsSum / model.buffer.length
    )} - Current: ${Math.round(nextFPS)}`;
    if (newTxt !== model.lastText) {
      model.lastText = newTxt;
      model.title.innerHTML = newTxt;
    }
  }

  function renderInfo() {
    model.info.style.display = model.infoVisibility ? 'grid' : 'none';
    if (!model.infoVisibility) {
      return;
    }
    const infoItems = [];
    if (model.renderWindow) {
      const realView = model.renderWindow.getViews()[0];
      if (realView && realView.getSize) {
        infoItems.push(
          `<label class="${style.label}">Resolution</label><span class="${
            style.value
          }">${realView.getSize().join('x')}</span>`
        );
      }

      const stats = Object.assign(
        {},
        model.renderWindow.getStatistics(),
        model.addOnStats
      );
      const keys = Object.keys(stats);
      keys.sort();
      for (let i = 0; i < keys.length; i++) {
        if (keys[i] === 'str') {
          continue; // eslint-disable-line
        }
        if (stats[keys[i]]) {
          infoItems.push(
            `<label class="${style.label}">${keys[i]}</label><span class="${
              style.value
            }">${formatNumbers(stats[keys[i]])}</span>`
          );
        }
      }
    }
    model.info.innerHTML = infoItems.join('');
  }

  function renderCanvas() {
    model.canvas.style.display = model.canvasVisibility ? 'block' : 'none';
    if (!model.canvasVisibility) {
      return;
    }
    // Although this is called frequently, setting an attribute to the same value is a no-op
    model.canvas.setAttribute('width', model.bufferSize);
    model.canvas.setAttribute('height', model.graphHeight);
    const ctx = model.canvas.getContext('2d');
    const { width, height } = model.canvas;
    ctx.clearRect(0, 0, width, height);
    // Current fps
    ctx.strokeStyle = 'green';
    ctx.beginPath();
    ctx.moveTo(0, height - model.buffer[0]);
    for (let i = 1; i < model.buffer.length; i++) {
      ctx.lineTo(i, height - model.buffer[i]);
    }
    ctx.stroke();
    // 60 fps ref
    ctx.strokeStyle = 'black';
    ctx.beginPath();
    ctx.moveTo(0, height - 60);
    ctx.lineTo(width, height - 60);
    ctx.stroke();
  }

  function frameChanged() {
    if (!model.interactor) {
      return;
    }
    const nextFPS = 1 / model.interactor.getLastFrameTime();
    model.buffer.push(nextFPS);
    model.fpsSum += nextFPS;
    while (model.buffer.length > model.bufferSize) {
      model.fpsSum -= model.buffer.shift();
    }
    renderTitle();
    renderCanvas();
  }

  // --------------------------------------------------------------------------
  // Public methods
  // --------------------------------------------------------------------------

  publicAPI.update = () => {
    publicAPI.render();
  };

  // --------------------------------------------------------------------------

  publicAPI.setRenderWindow = (rw) => {
    while (model.subscriptions.length) {
      model.subscriptions.pop().unsubscribe();
    }
    model.renderWindow = rw;
    model.interactor = rw ? rw.getInteractor() : null;

    if (model.interactor) {
      model.subscriptions.push(model.interactor.onAnimation(frameChanged));
    }
  };

  // --------------------------------------------------------------------------

  publicAPI.setContainer = (el) => {
    if (model.container && model.container !== el) {
      model.container.removeChild(model.fpsMonitorContainer);
    }
    if (model.container !== el) {
      model.container = el;
      if (model.container) {
        model.container.appendChild(model.fpsMonitorContainer);
        publicAPI.resize();
      }
      publicAPI.modified();
    }
  };

  // --------------------------------------------------------------------------

  publicAPI.render = () => {
    renderTitle();
    renderInfo();
    renderCanvas();
  };

  // --------------------------------------------------------------------------

  publicAPI.resize = noOp;

  // --------------------------------------------------------------------------

  publicAPI.setOrientationToHorizontal = () => {
    model.fpsMonitorContainer.classList.remove(model.orientationClass);
    model.orientationClass = style.horizontalContainer;
    model.fpsMonitorContainer.classList.add(model.orientationClass);
  };

  // --------------------------------------------------------------------------

  publicAPI.setOrientationToVertical = () => {
    model.fpsMonitorContainer.classList.remove(model.orientationClass);
    model.orientationClass = style.verticalContainer;
    model.fpsMonitorContainer.classList.add(model.orientationClass);
  };

  // --------------------------------------------------------------------------

  publicAPI.setOrientation = (mode = 'horizontal') => {
    if (mode === 'horizontal') {
      publicAPI.setOrientationToHorizontal();
    } else {
      publicAPI.setOrientationToVertical();
    }
  };

  // --------------------------------------------------------------------------

  publicAPI.setAddOnStats = (addOn) => {
    if (!model.addOnStats) {
      model.addOnStats = {};
    }
    Object.assign(model.addOnStats, addOn);
    renderInfo();
  };

  // --------------------------------------------------------------------------

  publicAPI.setMonitorVisibility = (
    title = true,
    graph = true,
    info = true
  ) => {
    publicAPI.setCanvasVisibility(graph);
    publicAPI.setInfoVisibility(info);
    publicAPI.setTitleVisibility(title);
  };

  // --------------------------------------------------------------------------

  const superDelete = publicAPI.delete;
  publicAPI.delete = () => {
    publicAPI.setRenderWindow(null);
    publicAPI.setContainer(null);
    superDelete();
  };

  // --------------------------------------------------------------------------

  model.subscriptions.push(publicAPI.onModified(publicAPI.update));
}

// ----------------------------------------------------------------------------
// Object factory
// ----------------------------------------------------------------------------

const DEFAULT_VALUES = {
  bufferSize: 200,
  graphHeight: 120,
  buffer: [60],
  subscriptions: [],
  fpsSum: 0,
  orientationClass: style.horizontalContainer,
  canvasVisibility: true,
  titleVisibility: true,
  infoVisibility: true,
};

// ----------------------------------------------------------------------------

export function extend(publicAPI, model, initialValues = {}) {
  Object.assign(model, DEFAULT_VALUES, initialValues);

  // Object methods
  macro.obj(publicAPI, model);
  macro.get(publicAPI, model, [
    'fpsMonitorContainer',
    'renderWindow',
    'addOnStats',
  ]);
  macro.setGet(publicAPI, model, [
    'bufferSize',
    'canvasVisibility',
    'infoVisibility',
    'titleVisibility',
  ]);

  // Object specific methods
  vtkFPSMonitor(publicAPI, model);
}

// ----------------------------------------------------------------------------

export const newInstance = macro.newInstance(extend, 'vtkFPSMonitor');

// ----------------------------------------------------------------------------

export default { newInstance, extend };
