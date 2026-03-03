import { it, expect } from 'vitest';
import HttpDataAccessHelper from '../HttpDataAccessHelper';

it('Test array.ref.url is used', async () => {
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
        expect(url).toBe(expectedUrl);

        // Clear mock
        window.XMLHttpRequest = oldXmlHttpRequest;

        resolve();
      };
      this.send = () => {};
      this.setRequestHeader = () => {};
    };

    HttpDataAccessHelper.fetchArray({}, '', array);
  });
});
