import test from 'tape-catch';
import HttpDataAccessHelper from '../HttpDataAccessHelper';

test('Test array.ref.url is used', (t) => {
  const expectedUrl = 'https://test.io/load_dataset?param1=testing';

  const array = {
    ref: {
      url: expectedUrl,
    },
  };

  const oldXmlHttpRequest = window.XMLHttpRequest;

  // Mock XmlHttpRequest
  window.XMLHttpRequest = function MockedXmlHttpRequestConstructor() {
    this.open = (method, url, async = true) => {
      t.equals(url, expectedUrl, 'xhr.open gets the same URL as array.ref.url');
      t.end();

      // Clear mock
      window.XMLHttpRequest = oldXmlHttpRequest;
    };
  };

  HttpDataAccessHelper.fetchArray({}, '', array);
});
