export default class ClassHierarchy extends Array {
  push(...args) {
    // no perf issue since args.length should be small
    const newArgs = args.filter((arg) => !this.includes(arg));
    return super.push(...newArgs);
  }
}
