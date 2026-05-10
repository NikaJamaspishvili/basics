(() => {
  // index.js
  function myCreateElement(type, props, ...children) {
    return { type, props, children };
  }
  function render(vdom, container) {
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

  // child.jsx
  var Child = (props) => {
    return /* @__PURE__ */ myCreateElement("div", { ...props }, /* @__PURE__ */ myCreateElement("h1", null, "what is going on guys"), /* @__PURE__ */ myCreateElement("p", null, "hello guyyss how are you"), /* @__PURE__ */ myCreateElement(GrandChild, null));
  };
  function onClick() {
    alert("clicked");
  }
  var GrandChild = () => {
    return /* @__PURE__ */ myCreateElement("div", null, /* @__PURE__ */ myCreateElement("input", { type: "text", placeholder: "insert your name" }), /* @__PURE__ */ myCreateElement("button", { onClick }, "click"));
  };

  // app.jsx
  var App = () => /* @__PURE__ */ myCreateElement("div", { style: { backgroundColor: "red", color: "blue" } }, /* @__PURE__ */ myCreateElement("p", null, "hello"), /* @__PURE__ */ myCreateElement("h1", null, "Hello Worldddddd"), /* @__PURE__ */ myCreateElement("section", null, /* @__PURE__ */ myCreateElement("h3", null, "hello again")), /* @__PURE__ */ myCreateElement(Child, { style: { backgroundColor: "green" } }));

  // main.jsx
  render(App(), document.getElementById("root"));
})();
