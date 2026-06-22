import '@kitware/vtk.js/favicon';

import '@kitware/vtk.js/Rendering/Profiles/Geometry';

import vtkFullScreenRenderWindow from '@kitware/vtk.js/Rendering/Misc/FullScreenRenderWindow';
import vtkActor from '@kitware/vtk.js/Rendering/Core/Actor';
import vtkConeSource from '@kitware/vtk.js/Filters/Sources/ConeSource';
import vtkMapper from '@kitware/vtk.js/Rendering/Core/Mapper';

// ----------------------------------------------------------------------------
// Standard rendering code setup
// ----------------------------------------------------------------------------

const fullScreenRenderer = vtkFullScreenRenderWindow.newInstance();
const renderer = fullScreenRenderer.getRenderer();
const renderWindow = fullScreenRenderer.getRenderWindow();
const interactor = renderWindow.getInteractor();

const coneSource = vtkConeSource.newInstance();
const mapper = vtkMapper.newInstance();
mapper.setInputConnection(coneSource.getOutputPort());
const actor = vtkActor.newInstance();
actor.setMapper(mapper);
renderer.addActor(actor);
renderer.resetCamera();
renderWindow.render();

fullScreenRenderer
  .getContainer()
  .addEventListener('contextmenu', (e) => e.preventDefault());

// ----------------------------------------------------------------------------
// Event log UI
// ----------------------------------------------------------------------------

const panel = document.createElement('div');
Object.assign(panel.style, {
  position: 'absolute',
  top: '8px',
  right: '8px',
  width: '320px',
  maxHeight: 'calc(100vh - 16px)',
  background: 'rgba(0, 0, 0, 0.75)',
  color: '#e0e0e0',
  fontFamily: 'monospace',
  fontSize: '12px',
  borderRadius: '6px',
  overflow: 'hidden',
  display: 'flex',
  flexDirection: 'column',
  zIndex: '100',
});
document.body.appendChild(panel);

// Header
const header = document.createElement('div');
Object.assign(header.style, {
  padding: '8px 12px',
  borderBottom: '1px solid #444',
  fontSize: '13px',
  fontWeight: 'bold',
});
header.textContent = 'Mouse Events';
panel.appendChild(header);

// Instructions
const instructions = document.createElement('div');
Object.assign(instructions.style, {
  padding: '8px 12px',
  fontSize: '11px',
  color: '#999',
  lineHeight: '1.5',
  borderBottom: '1px solid #333',
});
instructions.textContent =
  'Click in the 3D view with mouse buttons. Hold one button and press ' +
  'another to test chorded button detection. All press/release events ' +
  'should appear in the log.';
panel.appendChild(instructions);

// Button state indicators
const indicators = document.createElement('div');
Object.assign(indicators.style, {
  display: 'flex',
  gap: '8px',
  padding: '8px 12px',
  borderBottom: '1px solid #333',
});
panel.appendChild(indicators);

const buttonState = { left: false, middle: false, right: false };
const indElements = {};

['left', 'middle', 'right'].forEach((name) => {
  const el = document.createElement('span');
  Object.assign(el.style, {
    padding: '4px 12px',
    borderRadius: '4px',
    background: '#333',
    transition: 'background 0.1s',
  });
  el.textContent = name.charAt(0).toUpperCase() + name.slice(1);
  indicators.appendChild(el);
  indElements[name] = el;
});

function updateIndicators() {
  Object.entries(buttonState).forEach(([name, active]) => {
    indElements[name].style.background = active ? '#e94560' : '#333';
  });
}

// Controls
const controls = document.createElement('div');
Object.assign(controls.style, {
  display: 'flex',
  gap: '8px',
  alignItems: 'center',
  padding: '8px 12px',
});
panel.appendChild(controls);

const clearBtn = document.createElement('button');
clearBtn.textContent = 'Clear Log';
controls.appendChild(clearBtn);

const moveLabel = document.createElement('label');
Object.assign(moveLabel.style, { fontSize: '11px', cursor: 'pointer' });
const moveCheckbox = document.createElement('input');
moveCheckbox.type = 'checkbox';
moveLabel.appendChild(moveCheckbox);
moveLabel.append(' Log MouseMove');
controls.appendChild(moveLabel);

// Event log
const log = document.createElement('div');
Object.assign(log.style, {
  flex: '1',
  overflowY: 'auto',
  padding: '4px 12px',
  lineHeight: '1.6',
});
panel.appendChild(log);

let eventCount = 0;

function logEvent(name, color) {
  eventCount++;
  const entry = document.createElement('div');
  entry.style.color = color;
  entry.textContent = `${String(eventCount).padStart(4, ' ')}  ${name}`;
  log.appendChild(entry);
  log.scrollTop = log.scrollHeight;
}

clearBtn.addEventListener('click', () => {
  log.replaceChildren();
  eventCount = 0;
});

// ----------------------------------------------------------------------------
// Subscribe to interactor events
// ----------------------------------------------------------------------------

interactor.onLeftButtonPress(() => {
  buttonState.left = true;
  updateIndicators();
  logEvent('LeftButtonPress', '#53d769');
});
interactor.onLeftButtonRelease(() => {
  buttonState.left = false;
  updateIndicators();
  logEvent('LeftButtonRelease', '#fc3d39');
});

interactor.onMiddleButtonPress(() => {
  buttonState.middle = true;
  updateIndicators();
  logEvent('MiddleButtonPress', '#53d769');
});
interactor.onMiddleButtonRelease(() => {
  buttonState.middle = false;
  updateIndicators();
  logEvent('MiddleButtonRelease', '#fc3d39');
});

interactor.onRightButtonPress(() => {
  buttonState.right = true;
  updateIndicators();
  logEvent('RightButtonPress', '#53d769');
});
interactor.onRightButtonRelease(() => {
  buttonState.right = false;
  updateIndicators();
  logEvent('RightButtonRelease', '#fc3d39');
});

interactor.onMouseMove(() => {
  if (moveCheckbox.checked) {
    logEvent('MouseMove', '#888');
  }
});

// ----------------------------------------------------------------------------
// Globals for debugging
// ----------------------------------------------------------------------------

global.interactor = interactor;
global.renderWindow = renderWindow;
global.renderer = renderer;
