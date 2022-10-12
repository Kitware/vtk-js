/* eslint-disable prefer-rest-params */
export default class ClassHierarchy extends Array {
  push() {
    // using a for loop because a filter would trigger the garbage collector
    const newArgs = [];
    for (let i = 0; i < arguments.length; i++) {
      if (!this.includes(arguments[i])) {
        newArgs.push(arguments[i]);
      }
    }

    return super.push(...newArgs);
  }
}
