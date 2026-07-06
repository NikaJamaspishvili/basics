/** @jsx Didact.createElement */
/** @jsxFrag Didact.Fragment */

let root = document.getElementById("app");

const Didact = {
  Fragment: "Fragment",
  nextUnitOfWork: null,
  wipRoot: null,
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
  createDOM: (fiber) => {
    const dom =
      fiber.type == "TEXT_ELEMENT"
        ? document.createTextNode("")
        : document.createElement(fiber.type);

    const isProperty = (key) => key !== "children";
    Object.keys(fiber.props)
      .filter(isProperty)
      .forEach((name) => {
        dom[name] = fiber.props[name];
      });

    return dom;
  },
  render: (element, container) => {
    Didact.wipRoot = {
      dom: container,
      props: {
        children: [element],
      },
    };

    Didact.nextUnitOfWork = Didact.wipRoot;
  },

  workloop: {
    findParentFiber: (fiber) => {
      let p = fiber;
      while (p && p.type === Didact.Fragment) {
        p = p.parent;
      }
      return p;
    },
    commitRoot: () => {
      Didact.workloop.commitWork(Didact.wipRoot);
      Didact.wipRoot = null;
    },
    commitWork: (fiber) => {
      if (!fiber) {
        return;
      }

      const domParentFiber = Didact.workloop.findParentFiber(fiber.parent);
      if (domParentFiber && fiber.dom)
        domParentFiber.dom.appendChild(fiber.dom);
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

      if (fiber.type !== Didact.Fragment) {
        if (!fiber.dom) {
          fiber.dom = Didact.createDOM(fiber);
        }
      }

      let children = fiber.props.children;
      let prevChildFiber = {};
      let index = 0;

      // we use linked list for the fiber tree
      // on current fiber (linked list) connect its child fiber and its siblings (this way we know the children of these fiber)

      while (index < children.length) {
        let element = children[index];

        let newfiber = {
          type: element.type,
          props: element.props,
          parent: fiber,
          dom: null,
        };

        if (index === 0) fiber.child = newfiber;
        else prevChildFiber.sibling = newfiber;

        prevChildFiber = newfiber;
        index++;
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
  },
};

data = ["one name", "two name"];

const element = (
  <div>
    <>
      <h1>hello</h1>
      <section style="color: red;">
        <p>hello</p> <h1 style="color: blue;">my friend</h1>
      </section>
    </>
    <>hello </>
  </div>
);

function kickStartRender() {
  Didact.render(element, root);
  requestIdleCallback(Didact.workloop.execute);
}

kickStartRender();
