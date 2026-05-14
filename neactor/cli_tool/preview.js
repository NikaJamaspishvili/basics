import { createServer } from "http";
import fs from "fs";
import path from "path";

const mimeTypes = {
  ".html": "text/html; charset=utf-8",
  ".js": "application/javascript; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".map": "application/json; charset=utf-8",
};

export const preview = async () => {
  createServer((req, res) => {
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
  }).listen(4000, () => console.log("prod server is running on port: 4000"));
};
