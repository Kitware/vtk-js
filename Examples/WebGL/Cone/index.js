import vtkOpenGLRenderWindow from '../../../Sources/Rendering/OpenGL/RenderWindow';
import vtkRenderWindow from '../../../Sources/Rendering/Core/RenderWindow';
import vtkRenderer from '../../../Sources/Rendering/Core/Renderer';
import vtkConeSource from '../../../Sources/Filters/Sources/ConeSource';
import vtkActor from '../../../Sources/Rendering/Core/Actor';
import vtkMapper from '../../../Sources/Rendering/Core/Mapper';
import vtkCamera from '../../../Sources/Rendering/Core/Camera';
import vtkRenderWindowInteractor from '../../../Sources/Rendering/Core/RenderWindowInteractor';
import vtkInteractorStyleTrackballCamera from '../../../Sources/Interaction/Style/InteractorStyleTrackballCamera';

const renWin = vtkRenderWindow.newInstance();
const ren = vtkRenderer.newInstance();
renWin.addRenderer(ren);
ren.setBackground(0.7, 1.0, 0.7);
const iren = vtkRenderWindowInteractor.newInstance();
iren.setRenderWindow(renWin);
const style = vtkInteractorStyleTrackballCamera.newInstance();
iren.setInteractorStyle(style);

const actor = vtkActor.newInstance();
ren.addActor(actor);
// actor.getProperty().setRepresentationToWireframe();
// actor.getProperty().setAmbient(1.0);
// actor.getProperty().setAmbientColor(1.0, 0.5, 0.0);

const mapper = vtkMapper.newInstance();
actor.setMapper(mapper);

const cam = vtkCamera.newInstance();
ren.setActiveCamera(cam);
cam.setFocalPoint(0, 0, 0);
cam.setPosition(0, 0, 3);
cam.setClippingRange(0.1, 50.0);

const coneSource = vtkConeSource.newInstance({ height: 1.0 });
mapper.setInputData(coneSource.getOutput());

const glwindow = vtkOpenGLRenderWindow.newInstance();
glwindow.setContainer(document.querySelector('body'));
renWin.addView(glwindow);

iren.initialize();
iren.bindEvents(document.querySelector('body'), document);
iren.start();

// function updateMapper() {
//   mapper.setInputData(coneSource.getOutput());
// }

// glwindow.traverseAllPasses();

// let animating = false;

// function animate() {
//   glwindow.traverseAllPasses();
//   cam.roll(1.0);

//   if (animating) {
//     window.requestAnimationFrame(animate);
//   }
// }

// const button = document.createElement('button');
// button.setAttribute('type', 'input');
// button.innerHTML = 'start';
// document.getElementsByTagName('body')[0].appendChild(button);
// button.addEventListener('click', () => {
//   animating = !animating;
//   button.innerHTML = animating ? 'stop' : 'start';
//   if (animating) {
//     window.requestAnimationFrame(animate);
//   }
// });

// animate();

// window.coneSource = coneSource;
// window.updateMapper = updateMapper;
