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

export const VerticalTextAlignment = {
  TOP: 1,
  MIDDLE: 2,
  BOTTOM: 3,
};

/**
 * Computes the relative dy values around 0 for multiline text.
 *
 * @param nLines
 * @param fontSize
 * @returns a list of vertical offsets (from a zero origin) for placing multiline text.
 */
export function multiLineTextCalculator(
  nLines,
  fontSize,
  alignment = VerticalTextAlignment.BOTTOM
) {
  const dys = [];
  for (let i = 0; i < nLines; i++) {
    switch (alignment) {
      case VerticalTextAlignment.TOP:
        dys.push(fontSize * (i + 1));
        break;
      case VerticalTextAlignment.MIDDLE:
        dys.push(-fontSize * (0.5 * nLines - i - 1));
        break;
      case VerticalTextAlignment.BOTTOM:
      default:
        dys.push(-fontSize * (nLines - i - 1));
    }
  }
  return dys;
}

/**
 * Automatically updates an SVG rendering whenever a widget's state is updated.
 *
 * This update is done in two phases:
 * 1. mapState(widgetState) takes the widget state and transforms it into an intermediate data representation.
 * 2. render(data, h) takes the intermediate data representation and a createElement `h` function, and returns
 *    an SVG rendering of the state encoded in `data`.
 *
 * See snabbdom's documentation for how to use the `h` function passed to `render()`.
 *
 * @param renderer the widget manager's renderer
 * @param widgetState the widget state
 * @param mapState (object parameter) transforms the given widget's state into an intermediate data representation to be passed to render().
 * @param render (object parameter) returns the SVG representation given the data from mapState() and snabbdom's h render function.
 */
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
          // deny pointer events by default
          'pointer-events': 'none',
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

/**
 * Applies a set of default interaction handling behavior.
 *
 * Typically, firing pointerenter means that the pointer is
 * "hovering", meaning the associated widget state should
 * be selected. (This is on the user to do this step.)
 * Accordingly, pointerleave means no more hovering.
 *
 * However, vtk.js captures the pointer on pointerdown,
 * which means that clicking on an SVG element will result
 * in a pointerleave being triggered, deselecting the
 * widget state.
 *
 * The abridged sequence of events is as follows:
 * 1. pointerenter on the SVG element (mouse moves over SVG handle)
 * 2. pointerdown on the SVG element (left button press)
 * 2. pointerdown on the vtk.js canvas (left button press)
 * 3. pointer captured on the vtk.js canvas (left button press)
 * 4. pointerleave on the SVG element as soon as the mouse is moved,
 *    since the capture target is now the canvas.
 * 5. pointerenter on the SVG element when the mouse/pointer is released.
 *
 * To workaround this issue, we conditionally fire the user's
 * pointerleave listener only when we are "locked", which means
 * we saw a pointerdown and so the vtk.js canvas is capturing
 * the current pointer.
 */
function applyDefaultInteractions(userListeners) {
  let locked = false;
  return {
    ...userListeners,
    pointerdown(ev) {
      locked = true;
      return userListeners?.pointerdown?.(ev);
    },
    pointerenter(ev) {
      if (locked) {
        locked = false;
      }
      return userListeners?.pointerenter?.(ev);
    },
    pointerleave(ev) {
      if (!locked) {
        return userListeners?.pointerleave?.(ev);
      }
      return undefined;
    },
  };
}

/**
 * Requires the snabbdom eventlisteners and style modules.
 * @param vnode
 * @returns
 */
export function makeListenableSVGNode(vnode) {
  // allow pointer events on this vnode
  vnode.data.style = {
    ...vnode.data.style,
    'pointer-events': 'all',
  };
  vnode.data.on = applyDefaultInteractions(vnode.data.on);
  return vnode;
}

export default { bindSVGRepresentation, multiLineTextCalculator };
