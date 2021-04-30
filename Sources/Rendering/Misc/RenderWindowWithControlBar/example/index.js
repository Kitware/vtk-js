import 'vtk.js/Sources/favicon';

// Load the rendering pieces we want to use (for both WebGL and WebGPU)
import 'vtk.js/Sources/Rendering/Profiles/Geometry';

import vtkRenderWindowWithControlBar from 'vtk.js/Sources/Rendering/Misc/RenderWindowWithControlBar';
import vtkSlider from 'vtk.js/Sources/Interaction/UI/Slider';
import vtkCornerAnnotation from 'vtk.js/Sources/Interaction/UI/CornerAnnotation';

import vtkActor from 'vtk.js/Sources/Rendering/Core/Actor';
import vtkConeSource from 'vtk.js/Sources/Filters/Sources/ConeSource';
import vtkMapper from 'vtk.js/Sources/Rendering/Core/Mapper';

// Define container size/position
const body = document.querySelector('body');
const rootContainer = document.createElement('div');
rootContainer.style.position = 'relative';
rootContainer.style.width = '500px';
rootContainer.style.height = '500px';

body.appendChild(rootContainer);
body.style.margin = '0';

// Create render window inside container
const renderWindow = vtkRenderWindowWithControlBar.newInstance({
  controlSize: 25,
});
renderWindow.setContainer(rootContainer);

// Add some content to the renderer
const coneSource = vtkConeSource.newInstance();
const mapper = vtkMapper.newInstance();
const actor = vtkActor.newInstance();

mapper.setInputConnection(coneSource.getOutputPort());
actor.setMapper(mapper);

renderWindow.getRenderer().addActor(actor);
renderWindow.getRenderer().resetCamera();
renderWindow.getRenderWindow().render();

// Set control bar to be red so we can see it + layout setup...
renderWindow.getControlContainer().style.background = '#eee';
renderWindow.getControlContainer().style.display = 'flex';
renderWindow.getControlContainer().style.alignItems = 'stretch';
renderWindow.getControlContainer().style.justifyContent = 'stretch';
renderWindow.getControlContainer().innerHTML = `
  <button alt="Left"   title="Left"   value="left">L</button>
  <button alt="Top"    title="Top"    value="top">T</button>
  <button alt="Right"  title="Right"  value="right">R</button>
  <button alt="Bottom" title="Bottom" value="bottom">B</button>
  <div class="js-slider"></div>
`;

// Add corner annotation
const cornerAnnotation = vtkCornerAnnotation.newInstance();
cornerAnnotation.setContainer(renderWindow.getRenderWindowContainer());
cornerAnnotation.getAnnotationContainer().style.color = 'white';
cornerAnnotation.updateMetadata(coneSource.get('resolution', 'mtime'));
cornerAnnotation.updateTemplates({
  nw(meta) {
    return `<b>Resolution: </b> ${meta.resolution}`;
  },
  se(meta) {
    return `<span style="font-size: 50%"><i style="color: red;">mtime:</i>${meta.mtime}</span><br/>Annotation Corner`;
  },
});

// Add slider to the control bar
const sliderContainer = renderWindow
  .getControlContainer()
  .querySelector('.js-slider');
sliderContainer.style.flex = '1';
sliderContainer.style.position = 'relative';
sliderContainer.style.minWidth = '25px';
sliderContainer.style.minHeight = '25px';

const slider = vtkSlider.newInstance();
slider.generateValues(6, 60, 55);
slider.setValue(6);
slider.setContainer(sliderContainer);
slider.onValueChange((resolution) => {
  coneSource.set({ resolution });
  renderWindow.getRenderWindow().render();
  cornerAnnotation.updateMetadata(coneSource.get('resolution', 'mtime'));
});

function updateSizeAndOrientation() {
  renderWindow.resize();
  slider.resize();
  renderWindow.getControlContainer().style.flexFlow = slider.getOrientation()
    ? 'row'
    : 'column';
  setTimeout(slider.resize, 0);
}
updateSizeAndOrientation();

// Handle UI to change bar location
function onClick(e) {
  renderWindow.setControlPosition(e.target.value);
  updateSizeAndOrientation();
}

const list = document.querySelectorAll('button');
let count = list.length;
while (count--) {
  list[count].style.width = '25px';
  list[count].style.height = '25px';
  list[count].style.flex = 'none';
  list[count].addEventListener('click', onClick);
}
