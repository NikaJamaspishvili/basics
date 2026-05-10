export function myCreateElement(type, props, ...children) {
  return { type, props, children };
}

export function render(vdom, container) {
  if (typeof vdom === "string") {
    const textNode = document.createTextNode(vdom);
    container.appendChild(textNode);
  } else if (typeof vdom.type === "function") {
    const childDom = vdom.type(vdom.props);
    render(childDom, container);
  } else {
    const element = document.createElement(vdom.type);
    if (vdom.props) {
      Object.keys(vdom.props).map((key) => {
        if (key === "style") {
          Object.assign(element.style, vdom.props.style);
        } else if (key.startsWith("on")) {
          element[key.toLocaleLowerCase()] = vdom.props[key];
        } else {
          element[key] = vdom.props[key];
        }
      });
    }
    if (vdom.children) {
      vdom.children.forEach((child) => {
        render(child, element);
      });
    }

    container.appendChild(element);
  }
}
