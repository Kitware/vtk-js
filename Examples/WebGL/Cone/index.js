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
