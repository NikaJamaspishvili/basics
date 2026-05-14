export function neactorCreateElement(type, props, ...children) {
  return { type, props, children };
}

const es = new EventSource("/__reload");
es.onmessage = (event) => {
  if (event.data === "reload") location.reload();
};
