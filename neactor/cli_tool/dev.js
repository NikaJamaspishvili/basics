import * as esbuild from "esbuild";
import fs from "fs";
import http from "http";

export const dev = async () => {
  const clients = new Set();

  const ctx = await esbuild.context({
    entryPoints: ["./src/main.jsx"],
    bundle: true,
    outdir: "dist",
    sourcemap: true,
    jsxFactory: "myCreateElement",
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
    /<script src="[^"]+"><\/script>/,
    `<script src="./main.js"></script>`,
  );
  fs.mkdirSync("dist", { recursive: true });
  fs.writeFileSync("dist/index.html", html);

  // simple server that serves dist/ + SSE endpoint
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

      // serve files from dist/
      const filePath = `dist${req.url === "/" ? "/index.html" : req.url}`;
      fs.readFile(filePath, (err, data) => {
        if (err) {
          res.writeHead(404);
          res.end();
          return;
        }
        res.writeHead(200);
        res.end(data);
      });
    })
    .listen(3000, () => console.log("http://localhost:3000"));
};
