function identity(i) {
  return i;
}

function toNativeType(str) {
  if (str === null || str === 'null') {
    return null;
  }

  if (str === 'true') {
    return true;
  }

  if (str === 'false') {
    return false;
  }

  if (str === undefined || str === 'undefined') {
    return undefined;
  }

  if (str[0] === '[' && str[str.length - 1] === ']') {
    return str
      .substring(1, str.length - 1)
      .split(',')
      .map((s) => toNativeType(s.trim()));
  }

  if (str === '' || Number.isNaN(Number(str))) {
    return str;
  }

  return Number(str);
}

function extractURLParameters(
  castToNativeType = true,
  query = window.location.search
) {
  const summary = {};
  const convert = castToNativeType ? toNativeType : identity;
  const queryTokens = (query || '')
    .replace(/#.*/, '') // remove hash query
    .replace('?', '') // Remove ? from the head
    .split('&'); // extract token pair

  queryTokens.forEach((token) => {
    const [key, value] = token.split('=').map((s) => decodeURIComponent(s));
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
