import test from 'tape-catch';

import vtkHttpDataSetReader from '..';
import MockDataAccessHelper from '../../DataAccessHelper/MockDataAccessHelper';

function runTests(testCases) {
  testCases.reverse();

  const processNextTestCase = () => {
    const testCase = testCases.pop();
    if (!testCase) {
      return;
    }

    new Promise(testCase).then(
      (_) => {
        processNextTestCase();
      },
      (err) => {
        console.error(err);
      }
    );
  };

  processNextTestCase();
}

function equals(t, actual, expected, description) {
  let testDescription = description;
  if (actual !== expected) {
    testDescription += ` (Expected "${expected}" but got "${actual}")`;
  }
  t.equals(actual, expected, testDescription);
}

function fetchArrayTest(
  t,
  reader,
  callTracker,
  url,
  shouldBeCached,
  finalExpectedCacheItems = undefined
) {
  return (resolve, reject) => {
    // store how many times the fetch methods have been called before the test
    const [fetchJSONCallCount, fetchArrayCallCount] = [
      callTracker.fetchJSON.length,
      callTracker.fetchArray.length,
    ];
    reader.setUrl(url, { loadData: true }).then(
      (v) => {
        // determine the expected amount of calls of the fetch methods
        // -> Call amount should not change if results where cached
        const [expectedFetchJSONCallCount, expectedFetchArrayCallCount] = [
          fetchJSONCallCount + 1,
          shouldBeCached ? fetchArrayCallCount : fetchArrayCallCount + 1,
        ];

        // verify that the amount of calls matches the expectation
        // given if the data was cached or not
        const cachedDescription = shouldBeCached
          ? 'should be cached'
          : 'not cached';
        const prefix = `[${url} (${cachedDescription})]`;
        equals(
          t,
          callTracker.fetchJSON.length,
          expectedFetchJSONCallCount,
          `${prefix} Method "fetchJSON()" is called ${expectedFetchJSONCallCount} times.`
        );
        equals(
          t,
          callTracker.fetchArray.length,
          expectedFetchArrayCallCount,
          `${prefix} Method "fetchArray()" is called ${expectedFetchArrayCallCount} times.`
        );

        if (finalExpectedCacheItems && Array.isArray(finalExpectedCacheItems)) {
          const cachedArrayIds = reader.getCachedArrayIds().sort().join(',');
          const expectedArrayIds = finalExpectedCacheItems.sort().join(',');
          if (expectedArrayIds === cachedArrayIds) {
            t.pass(
              `${prefix} Cache contains expected elements: ${cachedArrayIds}`
            );
          } else {
            t.fail(
              `${prefix} Cache does not contain expected elements: Expected "${expectedArrayIds}" but got "${cachedArrayIds}"`
            );
          }
        }

        resolve(v);
      },
      (err) => reject(err)
    );
  };
}

test('Caching capabilities of vtkHttpDataSetReader with unlimited cache.', (t) => {
  const reader = vtkHttpDataSetReader.newInstance({ fetchGzip: true });
  reader.setDataAccessHelper(MockDataAccessHelper);

  const callTracker = MockDataAccessHelper.getCallTracker();

  runTests([
    // set cache to unlimited size
    (resolve, _) => {
      reader.setMaxCacheSize(undefined);
      t.equals(
        reader.getMaxCacheSize(),
        undefined,
        'Cache was set to "undefined" for unlimited caching'
      );
      resolve();
    },

    // load non-cached array 1
    fetchArrayTest(t, reader, callTracker, 'http://mockData/test01', false),

    // load non-cached array 2
    fetchArrayTest(t, reader, callTracker, 'http://mockData/test02', false),

    // load cached array
    fetchArrayTest(t, reader, callTracker, 'http://mockData/test01', true),

    // load non-cached array 3
    fetchArrayTest(t, reader, callTracker, 'http://mockData/test03', false),

    // load cached array
    fetchArrayTest(t, reader, callTracker, 'http://mockData/test02', true),

    // load cached array
    fetchArrayTest(t, reader, callTracker, 'http://mockData/test03', true),
  ]);
});

test.only('Caching capabilities of vtkHttpDataSetReader with limited cache.', (t) => {
  const reader = vtkHttpDataSetReader.newInstance({ fetchGzip: true });
  reader.setDataAccessHelper(MockDataAccessHelper);

  const callTracker = MockDataAccessHelper.getCallTracker();

  runTests([
    // set cache to 300 MiB -> Forces to dispose items accessed furthest in the past
    (resolve, _) => {
      reader.setMaxCacheSize(300);
      t.equals(reader.getMaxCacheSize(), 300, 'Cache was set to "300 MiB"');
      resolve();
    },

    // load non-cached array 1
    fetchArrayTest(t, reader, callTracker, 'http://mockData/test01', false, [
      'test01|vtkDataArray',
    ]),

    // load non-cached array 2
    fetchArrayTest(t, reader, callTracker, 'http://mockData/test02', false, [
      'test01|vtkDataArray',
      'test02|vtkDataArray',
    ]),

    // load cached array -> Prioritizes this array to be kept in cache over previous
    fetchArrayTest(t, reader, callTracker, 'http://mockData/test01', true, [
      'test01|vtkDataArray',
      'test02|vtkDataArray',
    ]),

    // load non-cached array 3 -> Forces array 2 to be disposed
    fetchArrayTest(t, reader, callTracker, 'http://mockData/test03', false, [
      'test01|vtkDataArray',
      'test03|vtkDataArray',
    ]),

    // load cached array
    fetchArrayTest(t, reader, callTracker, 'http://mockData/test03', true, [
      'test01|vtkDataArray',
      'test03|vtkDataArray',
    ]),

    // load array that is too big for cache -> Cache will become empty
    fetchArrayTest(t, reader, callTracker, 'http://mockData/test04', false, []),
  ]);
});
