const SVG_XMLNS = 'http://www.w3.org/2000/svg';

function attrDelta(oldObj, newObj) {
  const set = [];
  const remove = [];
  const oldKeysArray = Object.keys(oldObj);
  const newKeysArray = Object.keys(newObj);
  const oldKeys = new Set(oldKeysArray);
  const newKeys = new Set(newKeysArray);
  for (let i = 0; i < oldKeysArray.length; i++) {
    const key = oldKeysArray[i];
    if (newKeys.has(key)) {
      if (oldObj[key] !== newObj[key]) {
        set.push([key, newObj[key]]);
      }
    } else {
      remove.push(key);
    }
  }
  for (let i = 0; i < newKeysArray.length; i++) {
    const key = newKeysArray[i];
    if (!oldKeys.has(key)) {
      set.push([key, newObj[key]]);
    }
  }

  return [set, remove];
}

export function render(vnode) {
  const node = document.createElementNS(SVG_XMLNS, vnode.name);

  const keys = Object.keys(vnode.attrs);
  for (let i = 0; i < keys.length; i++) {
    const key = keys[i];
    node.setAttribute(key, vnode.attrs[key]);
  }
  // TODO: support removing event listener (e.g. use snabbdom)
  Object.keys(vnode.eventListeners).forEach((key) => {
    node.addEventListener(key, vnode.eventListeners[key]);
  });

  if (vnode.textContent) {
    node.textContent = vnode.textContent;
  } else {
    for (let i = 0; i < vnode.children.length; i++) {
      node.appendChild(render(vnode.children[i]));
    }
  }

  return node;
}

/**
 * Returns a set of patch functions to be applied to a document node.
 *
 * Patch functions must return the effective result node.
 */
export function diff(oldVTree, newVTree) {
  if (newVTree.textContent !== null && newVTree.children.length) {
    throw new Error('Tree cannot have both children and textContent!');
  }

  if (!oldVTree) {
    return [() => render(newVTree)];
  }

  if (!newVTree) {
    return [(node) => node.remove()];
  }

  if (oldVTree.name !== newVTree.name) {
    return [
      (node) => {
        const newNode = render(newVTree);
        node.replaceWith(newNode);
        return newNode;
      },
    ];
  }

  const patchFns = [];

  const [attrsSet, attrsRemove] = attrDelta(oldVTree.attrs, newVTree.attrs);
  if (attrsSet.length || attrsRemove.length) {
    patchFns.push((node) => {
      for (let i = 0; i < attrsSet.length; i++) {
        const [name, value] = attrsSet[i];
        node.setAttribute(name, value);
      }
      for (let i = 0; i < attrsRemove.length; i++) {
        const name = attrsRemove[i];
        node.removeAttribute(name);
      }
      return node;
    });
  }

  if (
    oldVTree.textContent !== newVTree.textContent &&
    newVTree.textContent !== null
  ) {
    patchFns.push((node) => {
      node.textContent = newVTree.textContent;
      return node;
    });
  }

  if (newVTree.textContent === null) {
    const min = Math.min(oldVTree.children.length, newVTree.children.length);
    for (let i = 0; i < min; i++) {
      const childPatches = diff(oldVTree.children[i], newVTree.children[i]);
      patchFns.push((node) => {
        for (let p = 0; p < childPatches.length; p++) {
          childPatches[p](node.children[i]);
        }
        return node;
      });
    }
    if (oldVTree.children.length < newVTree.children.length) {
      for (let i = min; i < newVTree.children.length; i++) {
        patchFns.push((node) => {
          node.appendChild(render(newVTree.children[i]));
          return node;
        });
      }
    } else {
      // always delete nodes in reverse
      for (let i = oldVTree.children.length - 1; i >= min; i--) {
        patchFns.push((node) => {
          node.children[i].remove();
          return node;
        });
      }
    }
  }

  return patchFns;
}
