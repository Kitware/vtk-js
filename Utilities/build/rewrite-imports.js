module.exports = (code, replaceFunc) => {
  const importRegex = /(?:import|from)\s+['"]([^'"]*)['"]/g;
  let m;
  while ((m = importRegex.exec(code)) != null) {
    // This is necessary to avoid infinite loops with zero-width matches
    if (m.index === importRegex.lastIndex) {
      importRegex.lastIndex++;
    }

    if (m[1].startsWith('../') || m[1].startsWith('./')) {
      const importPath = replaceFunc(m[1]);
      const origLen = code.length;
      code = code.replace(m[0], `from '${importPath}'`);
      const lenDiff = code.length - origLen;
      importRegex.lastIndex += lenDiff;
    }
  }
  return code;
};
