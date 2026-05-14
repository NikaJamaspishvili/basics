import { myCreateElement } from "../index.js";
import { Child } from "./child.jsx";

function Submit() {
  alert("your form submission was succefull");
}

export const App = () => (
  <div style={{ backgroundColor: "red", color: "blue" }}>
    <form action="src/submit.jsx" onSubmit={Submit}>
      <input type="text" placeholder="insert your name..." />
      <button>submit</button>
    </form>
    <Child />
  </div>
);
