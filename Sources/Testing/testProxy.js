import test from 'tape-catch';
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

test('Proxy activation via config', (t) => {
  const proxyManager = newProxyManager();
  t.equal(
    proxyManager.getActiveSource(),
    undefined,
    'No initial active source'
  );

  const proxy = proxyManager.createProxy('Sources', 'TrivialProducer');
  t.equal(
    proxyManager.getActiveSource(),
    proxy,
    'Active source set after proxy creation'
  );

  proxyManager.onModified(() => {
    t.fail('Proxy manager should not be modified when activating proxy twice');
  });
  proxy.activate();

  proxy.getState();
  t.end();
});

test('Proxy activation via .activate()', (t) => {
  const proxyManager = newProxyManager();
  t.equal(
    proxyManager.getActiveSource(),
    undefined,
    'No initial active source'
  );

  const proxy = proxyManager.createProxy('Sources', 'TrivialProducer', {
    // Inhibit the default { activateOnCreate: true }
    activateOnCreate: false,
  });
  t.equal(
    proxyManager.getActiveSource(),
    undefined,
    'No active source after proxy creation'
  );

  proxyManager.onModified(() => {
    t.pass('Proxy manager should be modified after proxy activation');
  });

  proxy.activate();
  t.equal(proxyManager.getActiveSource(), proxy, 'Active source set');

  t.end();
});
