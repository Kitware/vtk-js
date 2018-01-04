function identity(i) {
  return i;
}

function toNativeType(str) {
  if (str === null || str === 'null') {
    return null;
  } else if (str === 'true') {
    return true;
  } else if (str === 'false') {
    return false;
  } else if (str === undefined || str === 'undefined') {
    return undefined;
  } else if (str === '' || Number.isNaN(str)) {
    return str;
  }
  return parseFloat(str);
}

function extractURLParameters(castToNativeType = true, query = window.location.search) {
  const summary = {};
  const convert = castToNativeType ? toNativeType : identity;
  const queryTokens = (query || '')
    .replace(/#.*/, '') // remove hash query
    .replace('?', '') // Remove ? from the head
    .split('&'); // extract token pair

  queryTokens.forEach((token) => {
    const [key, value] = token.split('=').map(s => decodeURIComponent(s));
    if (key) {
      summary[key] = value ? convert(value) : true;
    }
  });

  return summary;
}

export default {
  toNativeType,
  extractURLParameters,
};
