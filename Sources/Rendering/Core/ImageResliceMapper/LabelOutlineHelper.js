export function getInputProperty(actor, inputIndex) {
  if (!actor) {
    return null;
  }
  return actor.getProperty(inputIndex) || actor.getProperty();
}

export function findLabelOutlineProperties(actor, currentValidInputs) {
  const labelOutlineProperties = [];
  for (let i = 0; i < currentValidInputs.length; i++) {
    const property = getInputProperty(actor, currentValidInputs[i].inputIndex);
    if (property?.getUseLabelOutline()) {
      labelOutlineProperties.push({ property, arrayIndex: i });
    }
  }
  return labelOutlineProperties;
}

export function getLabelOutlineTextureParameters(
  labelOutlineProperties,
  getDataArray
) {
  const dataArrays = [];
  const hashParts = [];
  let width = 0;
  for (let row = 0; row < labelOutlineProperties.length; row++) {
    const dataArray = getDataArray(labelOutlineProperties[row].property);
    dataArrays.push(dataArray);
    hashParts.push(dataArray.join('-'));
    width = Math.max(width, dataArray.length);
  }

  return {
    dataArrays,
    hash: hashParts.join('|'),
    width,
    height: dataArrays.length,
  };
}

export function fillLabelOutlineTextureTable(table, dataArrays, width) {
  for (let row = 0; row < dataArrays.length; row++) {
    const dataArray = dataArrays[row];
    const rowOffset = row * width;
    for (let col = 0; col < width; col++) {
      table[rowOffset + col] = dataArray[col] ?? dataArray[0];
    }
  }
  return table;
}
