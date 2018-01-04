const head = document.querySelector('head');

if (head) {
  [16, 32, 96, 160, 196].forEach((resolution) => {
    const link = document.createElement('link');
    link.setAttribute('rel', 'icon');
    link.setAttribute(
      'href',
      `http://kitware.github.io/vtk-js/icon/favicon-${resolution}x${resolution}.png`
    );
    link.setAttribute('sizes', `${resolution}x${resolution}`);
    link.setAttribute('type', 'image/png');
    head.appendChild(link);
  });
}
