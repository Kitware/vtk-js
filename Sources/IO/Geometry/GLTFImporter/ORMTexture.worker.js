import registerWebworker from 'webworker-promise/lib/register';

/**
 *
 * @param {ArrayBuffer} imageBuffer
 * @param {string} mimeType
 * @param {string} channel
 * @returns {Promise<ImageData>}
 */
registerWebworker(async ({ imageBuffer, mimeType, channel }) => {
  const channelsMap = {
    r: 0,
    g: 1,
    b: 2,
  };

  const blob = new Blob([imageBuffer], { type: mimeType });
  const img = await createImageBitmap(blob);
  const canvas = new OffscreenCanvas(img.width, img.height);
  const ctx = canvas.getContext('2d');

  ctx.drawImage(img, 0, 0, img.width, img.height);
  const bitmap = ctx.getImageData(0, 0, img.width, img.height);

  if (channel) {
    const idx = channelsMap[channel];
    for (let i = 0; i < bitmap.data.length; i += 4) {
      const channelValue = bitmap.data[i + idx];
      bitmap.data[i] = channelValue; // red channel
      bitmap.data[i + 1] = channelValue; // green channel
      bitmap.data[i + 2] = channelValue; // blue channel
    }
  }
  return { bitmap };
});
