/**
 * Converts a binary buffer in an ArrayBuffer to a string.
 *
 * Note this does not take encoding into consideration, so don't
 * expect proper Unicode or any other encoding.
 */
function arrayBufferToString(arrayBuffer) {
  const decoder = new TextDecoder('latin1');
  return decoder.decode(arrayBuffer);
}

/**
 * Extracts binary data out of a file ArrayBuffer given a prefix/suffix.
 */
function extractBinary(arrayBuffer, prefixRegex, suffixRegex = null) {
  const str = arrayBufferToString(arrayBuffer);

  const prefixMatch = prefixRegex.exec(str);
  if (!prefixMatch) {
    return { text: str };
  }

  const dataStartIndex = prefixMatch.index + prefixMatch[0].length;
  const strFirstHalf = str.substring(0, dataStartIndex);
  let retVal = null;

  const suffixMatch = suffixRegex ? suffixRegex.exec(str) : null;
  if (suffixMatch) {
    const strSecondHalf = str.substr(suffixMatch.index);
    retVal = {
      text: strFirstHalf + strSecondHalf,
      binaryBuffer: arrayBuffer.slice(dataStartIndex, suffixMatch.index),
    };
  } else {
    // no suffix, so just take all the data starting from dataStartIndex
    retVal = {
      text: strFirstHalf,
      binaryBuffer: arrayBuffer.slice(dataStartIndex),
    };
  }

  return retVal;
}

export default {
  arrayBufferToString,
  extractBinary,
};
