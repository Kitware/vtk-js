/* eslint-disable prefer-rest-params */
export default class ClassHierarchy extends Array {
  push() {
    for (let i = 0; i < arguments.length; i++) {
      if (!this.includes(arguments[i])) {
        super.push(arguments[i]);
      }
    }

    return this.length;
  }
}
