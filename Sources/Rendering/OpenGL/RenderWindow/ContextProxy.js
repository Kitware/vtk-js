export function createContextProxyHandler() {
  const cache = new Map();

  const getParameterHandler = {
    apply(target, gl, args) {
      if (cache.has(args[0])) {
        return cache.get(args[0]);
      }
      return target.apply(gl, args);
    },
  };

  // only supports single-value setters
  function cachedSetterHandler(key) {
    return {
      apply(target, gl, args) {
        cache.set(key, args[0]);
        return target.apply(gl, args);
      },
    };
  }

  // When a property is accessed on the webgl context proxy,
  // it's accessed is intercepted. If the property name matches
  // any of the keys of `propHandlers`, then that handler is called
  // with the following arguments: (gl, prop, receiver, propValue)
  // - gl (WebGL2RenderingContext): the underlying webgl context
  // - propName (string): the property name
  // - receiver (Proxy): the webgl context proxy
  // - propValue (unknown): the value of `gl[propName]`

  const propHandlers = Object.create(null);

  // Sets getParameter(property) as a cached getter proxy.
  // propValue.bind(gl) is to avoid Illegal Invocation errors.
  propHandlers.getParameter = (gl, prop, receiver, propValue) =>
    new Proxy(propValue.bind(gl), getParameterHandler);

  // Sets depthMask(flag) as a cached setter proxy.
  propHandlers.depthMask = (gl, prop, receiver, propValue) =>
    new Proxy(propValue.bind(gl), cachedSetterHandler(gl.DEPTH_WRITEMASK));

  return {
    get(gl, prop, receiver) {
      let value = Reflect.get(gl, prop, gl);
      if (value instanceof Function) {
        // prevents Illegal Invocation errors
        value = value.bind(gl);
      }

      const propHandler = propHandlers[prop];
      if (propHandler) {
        return propHandler(gl, prop, receiver, value);
      }

      return value;
    },
  };
}

export default { createContextProxyHandler };
