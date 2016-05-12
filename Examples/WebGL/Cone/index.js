import WebGLRenderWindow from '../../../Sources/Rendering/OpenGL/RenderWindow';
import RenderWindow from '../../../Sources/Rendering/Core/RenderWindow';
import Renderer from '../../../Sources/Rendering/Core/Renderer';
import ConeSource from '../../../Sources/Filters/Sources/ConeSource';
import Actor from '../../../Sources/Rendering/Core/Actor';
import Mapper from '../../../Sources/Rendering/Core/Mapper';

const renWin = RenderWindow.newInstance();
const ren = Renderer.newInstance();
renWin.addRenderer(ren);
ren.setBackground(0.7, 1.0, 0.7);

const actor = Actor.newInstance();
const mapper = Mapper.newInstance();
actor.setMapper(mapper);

const coneSource = ConeSource.newInstance({ height: 2.0 });
mapper.setInputData(coneSource.getOutput());

const glwindow = WebGLRenderWindow.newInstance();
glwindow.setContainer(document.querySelector('body'));
glwindow.setRenderable(renWin);
glwindow.traverseAllPasses();

let animating = false;

function animate() {
  glwindow.traverseAllPasses();

  if (animating) {
    window.requestAnimationFrame(animate);
  }
}

const button = document.createElement('button');
button.setAttribute('type', 'input');
button.innerHTML = 'start';
document.getElementsByTagName('body')[0].appendChild(button);
button.addEventListener('click', () => {
  animating = !animating;
  button.innerHTML = animating ? 'stop' : 'start';
  if (animating) {
    window.requestAnimationFrame(animate);
  }
});

animate();
