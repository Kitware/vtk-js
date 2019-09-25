const LOADED_URLS = [];

export function loadScript(url) {
  return new Promise((resolve, reject) => {
    if (LOADED_URLS.indexOf(url) === -1) {
      LOADED_URLS.push(url);
      const newScriptTag = document.createElement('script');
      newScriptTag.type = 'text/javascript';
      newScriptTag.src = url;
      newScriptTag.onload = resolve;
      newScriptTag.onerror = reject;
      document.body.appendChild(newScriptTag);
    } else {
      resolve(false);
    }
  });
}

// <link href=/css/app.44f7bc81.css rel=preload as=style>
export function loadCSS(url) {
  return new Promise((resolve, reject) => {
    if (LOADED_URLS.indexOf(url) === -1) {
      LOADED_URLS.push(url);
      const newScriptTag = document.createElement('link');
      newScriptTag.rel = 'stylesheet';
      newScriptTag.href = url;
      newScriptTag.onload = resolve;
      newScriptTag.onerror = reject;
      document.head.appendChild(newScriptTag);
    } else {
      resolve(false);
    }
  });
}

export default {
  loadScript,
  loadCSS,
  LOADED_URLS,
};
