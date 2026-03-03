import { it, expect } from 'vitest';
import macro from 'vtk.js/Sources/macros';
import vtkProxyManager from 'vtk.js/Sources/Proxy/Core/ProxyManager';

// ----------------------------------------------------------------------------
// vtkTestProxyClass methods
// ----------------------------------------------------------------------------
function testProxyClass(publicAPI, model) {
  // Set our className
  model.classHierarchy.push('vtkTestProxyClass');
}

// ----------------------------------------------------------------------------
// Object factory
// ----------------------------------------------------------------------------
const DEFAULT_VALUES = {};

// ----------------------------------------------------------------------------
function extend(publicAPI, model, initialValues = {}) {
  Object.assign(model, DEFAULT_VALUES, initialValues);

  // Object methods
  macro.obj(publicAPI, model);

  // Proxy methods
  macro.proxy(publicAPI, model);

  testProxyClass(publicAPI, model);
}

const vtkTestProxyClass = {
  newInstance: macro.newInstance(extend, 'vtkTestProxyClass'),
};

// ----------------------------------------------------------------------------

const defaultConfig = {
  definitions: {
    Sources: {
      TrivialProducer: {
        class: vtkTestProxyClass,
        options: {
          activateOnCreate: true,
        },
      },
    },
  },
};

function newProxyManager(proxyConfiguration = defaultConfig) {
  return vtkProxyManager.newInstance({ proxyConfiguration });
}

// ----------------------------------------------------------------------------
// Tests
// ----------------------------------------------------------------------------

it('Proxy activation via config', () => {
  const proxyManager = newProxyManager();
  expect(proxyManager.getActiveSource()).toBe(undefined);

  const proxy = proxyManager.createProxy('Sources', 'TrivialProducer');
  expect(proxyManager.getActiveSource()).toBe(proxy);

  proxyManager.onModified(() => {
    expect.fail(
      'Proxy manager should not be modified when activating proxy twice'
    );
  });
  proxy.activate();

  proxy.getState();
});

it('Proxy activation via .activate()', () => {
  const proxyManager = newProxyManager();
  expect(proxyManager.getActiveSource()).toBe(undefined);

  const proxy = proxyManager.createProxy('Sources', 'TrivialProducer', {
    // Inhibit the default { activateOnCreate: true }
    activateOnCreate: false,
  });
  expect(proxyManager.getActiveSource()).toBe(undefined);

  proxyManager.onModified(() => {});

  proxy.activate();
  expect(proxyManager.getActiveSource()).toBe(proxy);
});
