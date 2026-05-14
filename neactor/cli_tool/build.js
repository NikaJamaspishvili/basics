// build.mjs
import * as esbuild from "esbuild";
import fs from "fs";
import crypto from "crypto";
import { fileURLToPath } from "url";

const jsxShimPath = fileURLToPath(new URL("./jsx-shim.js", import.meta.url));

export const build = async () => {
  // 1. Bundle JS
  const result = await esbuild.build({
    entryPoints: ["./src/main.jsx"],
    bundle: true,
    outdir: "dist",
    format: "esm",
    jsxFactory: "neactorCreateElement",
    jsx: "transform",
    jsxFactory: "neactorCreateElement",
    jsxImportSource: "neactor-dom",
    inject: [jsxShimPath],
    entryNames: "bundle",
    write: true,
    metafile: true,
  });

  // 2. Get the output filename
  const outputFile = Object.keys(result.metafile.outputs)[0];

  // 3. Rewrite index.html
  let html = fs.readFileSync("index.html", "utf8");
  html = html.replace(
    /<script type="module" src="[^"]+"><\/script>/,
    `<script type="module" src="./bundle.js"></script>`,
  );

  fs.mkdirSync("dist", { recursive: true });
  fs.writeFileSync("dist/index.html", html);
};
