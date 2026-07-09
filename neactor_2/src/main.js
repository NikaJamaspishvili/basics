/** @jsx Didact.createElement */
/** @jsxFrag Didact.Fragment */

let root = document.getElementById("app");

const Didact = {
  Fragment: "Fragment",
  nextUnitOfWork: null,
  wipRoot: null,
  currentRoot: null,
  deletions: null,
  createElement: (type, props, ...children) => {
    return {
      type,
      props: {
        ...props,
        children: children.flat().map((child) =>
          typeof child !== "object"
            ? {
                type: "TEXT_ELEMENT",
                props: { nodeValue: child, children: [] },
              }
            : child,
        ),
      },
    };
  },
  hooks: {
    wipFiber: null,
    hookIndex: null,

    useState: (initial) => {
      let oldHook =
        Didact.hooks.wipFiber.alternate &&
        Didact.hooks.wipFiber.alternate.hooks &&
        Didact.hooks.wipFiber.alternate.hooks[Didact.hooks.hookIndex];

      const hook = {
        state: oldHook ? oldHook.state : initial,
        queue: [],
      };

      const actions = oldHook ? oldHook.queue : [];
      actions.forEach((action) => {
        hook.state = action(hook.state);
      });

      const setState = (action) => {
        hook.queue.push(action);
        if (Didact.currentRoot) {
          Didact.wipRoot = {
            dom: Didact.currentRoot.dom,
            props: Didact.currentRoot.props,
            alternate: Didact.currentRoot,
          };
        }
        Didact.nextUnitOfWork = Didact.wipRoot;
        Didact.deletions = [];
      };

      Didact.hooks.wipFiber.hooks.push(hook);
      Didact.hooks.hookIndex++;
      return [hook.state, setState];
    },
  },

  createDOM: (fiber) => {
    const dom =
      fiber.type == "TEXT_ELEMENT"
        ? document.createTextNode("")
        : document.createElement(fiber.type);

    Didact.workloop.updateDom(dom, {}, fiber.props);
    return dom;
  },
  render: (element, container) => {
    Didact.wipRoot = {
      dom: container,
      props: {
        children: [element],
      },
      alternate: Didact.currentRoot,
    };
    Didact.deletions = [];
    Didact.nextUnitOfWork = Didact.wipRoot;
  },

  workloop: {
    findParentFiber: (fiber) => {
      let p = fiber;
      while (p && (p.type === Didact.Fragment || p.dom === null)) {
        p = p.parent;
      }
      return p;
    },
    commitRoot: () => {
      Didact.deletions.forEach(Didact.workloop.commitWork);
      Didact.workloop.commitWork(Didact.wipRoot);
      Didact.currentRoot = Didact.wipRoot;
      Didact.wipRoot = null;
    },

    updateDom: (fiberDom, prevProps, nextProps) => {
      const isEvent = (key) => key.startsWith("on");
      const isProperty = (key) => key !== "children" && !isEvent(key);
      const isNew = (prev, next) => (key) => prev[key] !== next[key];
      const isGone = (prev, next) => (key) => !(key in next);

      //Remove old or changed event listeners
      Object.keys(prevProps)
        .filter(isEvent)
        .filter(
          (key) => !(key in nextProps) || isNew(prevProps, nextProps)(key),
        )
        .forEach((name) => {
          const eventType = name.toLowerCase().substring(2);
          fiberDom.removeEventListener(eventType, prevProps[name]);
        });

      // Remove old properties
      Object.keys(prevProps)
        .filter(isProperty)
        .filter(isGone(prevProps, nextProps))
        .forEach((name) => {
          fiberDom[name] = "";
        });
      // Set new or changed properties
      Object.keys(nextProps)
        .filter(isProperty)
        .filter(isNew(prevProps, nextProps))
        .forEach((name) => {
          fiberDom[name] = nextProps[name];
        });

      // Add event listeners
      Object.keys(nextProps)
        .filter(isEvent)
        .filter(isNew(prevProps, nextProps))
        .forEach((name) => {
          const eventType = name.toLowerCase().substring(2);
          fiberDom.addEventListener(eventType, nextProps[name]);
        });
    },
    commitWork: (fiber) => {
      if (!fiber) {
        return;
      }

      const domParentFiber = Didact.workloop.findParentFiber(fiber.parent);
      if (fiber.dom !== null && fiber.effectTag === "PLACEMENT") {
        // means we have to add this new element to the DOM

        domParentFiber.dom.appendChild(fiber.dom);
      } else if (fiber.dom !== null && fiber.effectTag === "UPDATE") {
        Didact.workloop.updateDom(
          fiber.dom,
          fiber.alternate.props,
          fiber.props,
        );
      } else if (fiber.effectTag === "DELETION") {
        domParentFiber.dom.removeChild(fiber.dom);
      }
      Didact.workloop.commitWork(fiber.child);
      Didact.workloop.commitWork(fiber.sibling);
    },
    execute: (deadline) => {
      let shouldYield = null;
      while (Didact.nextUnitOfWork && !shouldYield) {
        Didact.nextUnitOfWork = Didact.workloop.performUnitOfWork(
          Didact.nextUnitOfWork,
        );
        shouldYield = deadline.timeRemaining() < 1;
      }

      if (!Didact.nextUnitOfWork && Didact.wipRoot) {
        Didact.workloop.commitRoot();
      }

      requestIdleCallback(Didact.workloop.execute);
    },
    performUnitOfWork: (fiber) => {
      // fully ignore the fragment and skip it.
      // if block for detecting the fragment jsx
      // if fragment is detected -> dont render it in DOM + fiber.children (fragment's children) fibers should point to parent of this fragment to effectively ignore it.
      const isFunctionComponent = fiber.type instanceof Function;

      if (isFunctionComponent) {
        Didact.workloop.updateFunctionComponent(fiber);
      } else {
        Didact.workloop.updateHostComponent(fiber);
      }

      // if there was child detected we return it for the next operation
      if (fiber.child) return fiber.child;

      // if there was no child meaning we have hit the bottom of a tree we look for the siblings
      let nextFiber = fiber;

      while (nextFiber) {
        // if there was a sibling we return it
        if (nextFiber.sibling) return nextFiber.sibling;
        // if there was no sibling we start processing the uncles (parents syblings).
        nextFiber = nextFiber.parent;
      }
    },

    updateFunctionComponent: (fiber) => {
      Didact.hooks.wipFiber = fiber;
      Didact.hooks.hookIndex = 0;
      Didact.hooks.wipFiber.hooks = [];

      const children = [fiber.type(fiber.props)];

      Didact.workloop.reconcileChildren(fiber, children);
    },

    updateHostComponent: (fiber) => {
      if (fiber.type !== Didact.Fragment) {
        if (!fiber.dom) {
          fiber.dom = Didact.createDOM(fiber);
        }
      }
      const children = fiber.props.children;

      Didact.workloop.reconcileChildren(fiber, fiber.props.children);
    },

    reconcileChildren: (fiber, children) => {
      let index = 0;
      let prevSibling = {};

      let oldFiberChild = fiber.alternate && fiber.alternate.child;

      while (index < children.length || oldFiberChild != null) {
        let currentTreeWorkingChild = children[index];
        let newFiber = null;

        let sameType =
          oldFiberChild &&
          currentTreeWorkingChild &&
          oldFiberChild.type === currentTreeWorkingChild.type;

        // now we have to determine if element needs adding or updating or deleting

        if (sameType) {
          // tod0: means the new and old fiber tree are same and only maybe props of this fiber element might need upgrade
          newFiber = {
            type: oldFiberChild.type,
            props: currentTreeWorkingChild.props,
            dom: oldFiberChild.dom,
            parent: fiber,
            alternate: oldFiberChild,
            effectTag: "UPDATE",
          };
        }

        if (!sameType && currentTreeWorkingChild) {
          // tod0: add this fiber element because there was no element before in the tree or it was replaced

          newFiber = {
            type: currentTreeWorkingChild.type,
            props: currentTreeWorkingChild.props,
            dom: null,
            parent: fiber,
            alternate: null,
            effectTag: "PLACEMENT",
          };
        }

        if (!sameType && oldFiberChild) {
          // tod0: delete the old child, this includes the type distinction and solves it.
          oldFiberChild.effectTag = "DELETION";
          Didact.deletions.push(oldFiberChild);
        }

        if (oldFiberChild) {
          oldFiberChild = oldFiberChild.sibling;
        }

        if (index === 0) {
          fiber.child = newFiber;
        } else if (newFiber) {
          prevSibling.sibling = newFiber;
        }

        if (newFiber) {
          prevSibling = newFiber;
        }
        index += 1;
      }
    },
  },
};

data = ["one name", "two name"];

function App({ message }) {
  const [count, setCounter] = Didact.hooks.useState(0);

  return (
    <div>
      <h1>{count} hello my friend</h1>
      <button
        style="color:red;"
        onClick={() => {
          setCounter((count) => count + 1);
        }}
      >
        {message}
      </button>
    </div>
  );
}

const element = (
  <>
    <h1>hello1</h1>
    <p style="color:red;">hello2</p>
    <h3>hello3</h3>
    <App message={"hello how are you"} />
  </>
);

function kickStartRender() {
  Didact.render(element, root);
  requestIdleCallback(Didact.workloop.execute);
}

kickStartRender();
