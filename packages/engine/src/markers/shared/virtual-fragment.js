import { error } from '@hybrids/debug';
import { defineLocals } from '../../expression';

const map = new WeakMap();

export default class VirtualFragment {
  constructor(fragment, target, saveReference) {
    this.items = fragment ? Array.from(fragment.childNodes) : [];
    this.target = target;

    if (saveReference) {
      if (map.get(this)) {
        error(ReferenceError, 'Multiple virtual fragments not supported');
      }

      map.set(target, this);
    }
  }

  getLastItem() {
    return this.items[this.items.length - 1];
  }

  remove() {
    this.items.forEach((item) => {
      if (item instanceof VirtualFragment) {
        item.remove();
      } else {
        const fragment = map.get(item);
        if (fragment) fragment.remove();
        item.parentNode.removeChild(item);
      }
    });
  }

  insertAfter(target = this.target) {
    if (!this.items.length) return target;

    if (target instanceof VirtualFragment) {
      target = target.getLastItem();
      if (target instanceof VirtualFragment) {
        return this.insertAfter(target);
      }
    } else if (target !== this.target && map.get(target)) {
      target = map.get(target).getLastItem() || target;
    }

    this.items.forEach((item) => {
      if (item instanceof VirtualFragment) {
        target = item.insertAfter(target);
      } else {
        target.parentNode.insertBefore(item, target.nextSibling);

        if (map.get(item)) {
          target = map.get(item).insertAfter(item);
        } else {
          target = item;
        }
      }
    });

    return target;
  }

  setLocals(locals) {
    this.items.forEach((item) => {
      if (item instanceof VirtualFragment) {
        item.setLocals(locals);
      } else {
        defineLocals(item, locals);
      }
    });
  }
}