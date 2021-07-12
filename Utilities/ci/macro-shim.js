// unfortunate hacks necessary to sneak past babel-plugin-macros.
const fakeBabelMacro = () => {
  return { keepImports: true };
};
fakeBabelMacro.isBabelMacro = true;
fakeBabelMacro.options = {};
fakeBabelMacro.toString = () =>
  "This is a fake babel macro whose properties match that of the vtk.js macro.js exports";


try {
  const macro = require('{{ packageName }}/macros.js');
  const keys = Object.keys(macro);
  for (let i = 0; i < keys.length; i++) {
    // assign the macro.js exports to the shim's exports
    fakeBabelMacro[prop] = macro[prop];
  }
} catch (e) {}

module.exports = fakeBabelMacro;
