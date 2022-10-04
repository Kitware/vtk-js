module.exports = (code, replaceFunc) => {
  const importRegex = /(?:import|from) ['"]([^'"]*)['"]/g;
  let m;
  while ((m = importRegex.exec(code)) !== null) {
    // This is necessary to avoid infinite loops with zero-width matches
    if (m.index === importRegex.lastIndex) {
      importRegex.lastIndex++;
    }

    if (m[1].startsWith('../') || m[1].startsWith('./')) {
      const importPath = replaceFunc(m[1]);
      code = code.replace(m[0], `from '${importPath}'`);
    }
  }
  return code;
};
