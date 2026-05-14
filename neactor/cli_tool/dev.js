import * as esbuild from "esbuild";
import fs from "fs";
import http from "http";
import path from "path";
import { fileURLToPath } from "url";

const jsxShimPath = fileURLToPath(new URL("./jsx-shim.js", import.meta.url));

export const dev = async () => {
  const clients = new Set();

  const ctx = await esbuild.context({
    entryPoints: ["./src/main.jsx"],
    bundle: true,
    outdir: "dist",
    sourcemap: true,
    format: "esm",
    jsx: "transform",
    jsxFactory: "neactorCreateElement",
    jsxImportSource: "neactor-dom",
    inject: [jsxShimPath],
    plugins: [
      {
        name: "live-reload",
        setup(build) {
          build.onEnd(() => {
            clients.forEach((res) => res.write("data: reload\n\n"));
          });
        },
      },
    ],
  });

  await ctx.watch();

  let html = fs.readFileSync("index.html", "utf8");
  html = html.replace(
    /<script type="module" src="[^"]+"><\/script>/,
    `<script type="module" src="./main.js"></script>`,
  );
  fs.mkdirSync("dist", { recursive: true });
  fs.writeFileSync("dist/index.html", html);

  const mimeTypes = {
    ".html": "text/html; charset=utf-8",
    ".js": "application/javascript; charset=utf-8",
    ".map": "application/json; charset=utf-8",
    ".css": "text/css; charset=utf-8",
    ".json": "application/json; charset=utf-8",
  };

  http
    .createServer((req, res) => {
      if (req.url === "/__reload") {
        res.writeHead(200, {
          "Content-Type": "text/event-stream",
          "Cache-Control": "no-cache",
          Connection: "keep-alive",
        });
        clients.add(res);
        req.on("close", () => clients.delete(res));
        return;
      }

      const requestPath = req.url === "/" ? "/index.html" : req.url;
      const filePath = path.join("dist", requestPath);

      fs.readFile(filePath, (err, data) => {
        if (err) {
          res.writeHead(404, { "Content-Type": "text/plain; charset=utf-8" });
          res.end("Not Found");
          return;
        }

        const ext = path.extname(filePath);
        res.writeHead(200, {
          "Content-Type": mimeTypes[ext] || "application/octet-stream",
        });
        res.end(data);
      });
    })
    .listen(3000, () => console.log("http://localhost:3000"));
};
