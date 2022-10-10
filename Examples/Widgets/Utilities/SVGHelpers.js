import {
  init,
  classModule,
  propsModule,
  styleModule,
  eventListenersModule,
  h,
  attributesModule,
} from 'snabbdom';

const patch = init([
  attributesModule,
  classModule,
  propsModule,
  styleModule,
  eventListenersModule,
]);

function mountDummySVGContainer(canvas) {
  const container = canvas.parentElement;

  const dummy = document.createElement('div');
  container.insertBefore(dummy, canvas.nextSibling);

  const containerStyles = window.getComputedStyle(container);
  if (containerStyles.position === 'static') {
    container.style.position = 'relative';
  }

  return dummy;
}

export function bindSVGRepresentation(
  renderer,
  widgetState,
  { mapState, render }
) {
  const view = renderer.getRenderWindow().getViews()[0];
  const canvas = view.getCanvas();

  const getSize = () => {
    const [width, height] = view.getSize();
    const ratio = window.devicePixelRatio || 1;
    return {
      width: width / ratio,
      height: height / ratio,
      viewBox: `0 0 ${width} ${height}`,
    };
  };

  const renderState = (state) => {
    const repData = mapState(state, {
      size: view.getSize(),
    });
    const rendered = render(repData, h);
    return h(
      'svg',
      {
        attrs: getSize(),
        style: {
          position: 'absolute',
          top: '0',
          left: '0',
          width: '100%',
          height: '100%',
        },
      },
      Array.isArray(rendered) ? rendered : [rendered]
    );
  };

  const dummy = mountDummySVGContainer(canvas);
  let vnode = patch(dummy, renderState(widgetState));

  const updateVNode = () => {
    vnode = patch(vnode, renderState(widgetState));
  };

  const stateSub = widgetState.onModified(() => updateVNode());
  const cameraSub = renderer.getActiveCamera().onModified(() => updateVNode());
  const observer = new ResizeObserver(() => updateVNode());
  observer.observe(canvas);

  return () => {
    stateSub.unsubscribe();
    cameraSub.unsubscribe();
    observer.disconnect();
    patch(vnode, h('!')); // unmount hack
    vnode = null;
  };
}

export default { bindSVGRepresentation };
