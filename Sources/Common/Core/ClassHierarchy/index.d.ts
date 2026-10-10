/**
 * An array of class names that ignores duplicates: pushing a name already in
 * the hierarchy leaves the array unchanged and still reports its length.
 */
export interface ClassHierarchy extends Array<string> {
  push(...names: string[]): number;
}

/**
 * The subclass carries no static members of its own; it inherits Array's.
 */
declare const ClassHierarchy: {
  new (...items: string[]): ClassHierarchy;
};
export default ClassHierarchy;
