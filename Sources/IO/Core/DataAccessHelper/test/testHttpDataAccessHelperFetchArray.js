import test from 'tape';
import HttpDataAccessHelper from '../HttpDataAccessHelper';

test('Test array.ref.url is used', async (t) => {
  const expectedUrl = 'https://test.io/load_dataset?param1=testing';

  const array = {
    ref: {
      url: expectedUrl,
    },
  };

  const oldXmlHttpRequest = window.XMLHttpRequest;

  await new Promise((resolve) => {
    // Mock XmlHttpRequest
    window.XMLHttpRequest = function MockedXmlHttpRequestConstructor() {
      this.open = (method, url, async = true) => {
        t.equals(
          url,
          expectedUrl,
          'xhr.open gets the same URL as array.ref.url'
        );

        // Clear mock
        window.XMLHttpRequest = oldXmlHttpRequest;

        resolve();
      };
    };

    HttpDataAccessHelper.fetchArray({}, '', array);
  });

  t.end();
});
