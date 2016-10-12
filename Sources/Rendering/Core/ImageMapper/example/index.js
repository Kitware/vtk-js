import vtkImageSlice              from '../../../../../Sources/Rendering/Core/ImageSlice';
import vtkImageGridSource         from '../../../../../Sources/Filters/Sources/ImageGridSource';
import vtkImageMapper             from '../../../../../Sources/Rendering/Core/ImageMapper';
import vtkInteractorStyleImage    from '../../../../../Sources/Interaction/Style/InteractorStyleImage';
import vtkOpenGLRenderWindow      from '../../../../../Sources/Rendering/OpenGL/RenderWindow';
import vtkRenderer                from '../../../../../Sources/Rendering/Core/Renderer';
import vtkRenderWindow            from '../../../../../Sources/Rendering/Core/RenderWindow';
import vtkRenderWindowInteractor  from '../../../../../Sources/Rendering/Core/RenderWindowInteractor';

// Create some control UI
const renderWindowContainer = document.querySelector('body');
// ----------------------

const ren = vtkRenderer.newInstance();
ren.setBackground(0.32, 0.34, 0.43);

const renWin = vtkRenderWindow.newInstance();
renWin.addRenderer(ren);

const glwindow = vtkOpenGLRenderWindow.newInstance();
glwindow.setContainer(renderWindowContainer);
renWin.addView(glwindow);

const iren = vtkRenderWindowInteractor.newInstance();
iren.setInteractorStyle(vtkInteractorStyleImage.newInstance());
iren.setView(glwindow);

const actor = vtkImageSlice.newInstance();
ren.addActor(actor);

const mapper = vtkImageMapper.newInstance();
actor.getProperty().setColorWindow(255);
actor.getProperty().setColorLevel(127);
actor.setMapper(mapper);

const gridSource = vtkImageGridSource.newInstance();
gridSource.setDataExtent(0, 200, 0, 200, 0, 0);
gridSource.setGridSpacing(16, 16, 0);
gridSource.setGridOrigin(8, 8, 0);
mapper.setInputConnection(gridSource.getOutputPort());

iren.initialize();
iren.bindEvents(renderWindowContainer, document);
iren.start();
