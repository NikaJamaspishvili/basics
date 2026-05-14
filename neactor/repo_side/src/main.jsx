/** @jsx myCreateElement */
import { App } from "./app.jsx";
import { render, myCreateElement } from "../index.js";

render(App(), document.getElementById("root"));
