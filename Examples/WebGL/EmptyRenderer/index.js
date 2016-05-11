import WebGLRenderWindow from '../../../Sources/Rendering/WebGL/WebGLRenderWindow';
import RenderWindow from '../../../Sources/Rendering/Core/RenderWindow';
import Renderer from '../../../Sources/Rendering/Core/Renderer';

const renWin = RenderWindow.newInstance();
const ren = Renderer.newInstance();
renWin.addRenderer(ren);

const glwindow = WebGLRenderWindow.newInstance();
glwindow.setContainer(document.querySelector('body'));
glwindow.setRenderable(renWin);
glwindow.traverseAll();
