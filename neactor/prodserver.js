import { createServer } from "http";
import { readFileSync } from "fs";
createServer(async (req, res) => {
  if (req.url === "/") {
    res.writeHead(200, { "content-type": "text/html" });
    res.end(readFileSync("./dist/index.html", "utf-8"));
  }
  if (req.url.endsWith(".js")) {
    res.writeHead(200, { "content-type": "application/javascript" });
    res.end(readFileSync("./dist/bundle.js", "utf-8"));
  }
}).listen(4000, () => console.log("prod server is running on port: 4000"));
