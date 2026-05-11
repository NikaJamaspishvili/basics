import * as esbuild from "esbuild";
import { createServer } from "http";
import { readFileSync } from "fs";

createServer(async (req, res) => {
  console.log("jsx request came in", req.url);

  if (req.url === "/") {
    res.writeHead(200, { "Content-Type": "text/html" });
    res.end(readFileSync("./index.html"));
  } else if (req.url.endsWith(".tsx") || req.url.endsWith(".jsx")) {
    const filePath = `.${req.url}`;
    const result = await esbuild.transform(readFileSync(filePath, "utf8"), {
      loader: "tsx",
      jsxFactory: "myCreateElement",
    });
    res.writeHead(200, { "Content-Type": "application/javascript" });
    res.end(result.code);
  }

  // handle .js files too
  else if (req.url.endsWith(".js")) {
    console.log("js request came in", req.url);
    const filePath = `.${req.url}`;
    res.writeHead(200, { "Content-Type": "application/javascript" });
    res.end(readFileSync(filePath, "utf8"));
    console.log("js sending request", req.url);
  } else {
    res.writeHead(404);
    console.log("request not found", req.url);
    res.end("not found");
  }
}).listen(3000, () => console.log("running on http://localhost:3000"));
