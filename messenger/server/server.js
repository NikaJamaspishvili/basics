const { WebSocketServer } = require("ws");

const wss = new WebSocketServer({ port: 3000 }, () =>
  console.log("ws connection established on port 3000"),
);

const connections = new Map();

wss.on("connection", (ws, req) => {
  const fullUrl = new URL(req.url, `http://${req.headers.host}`);
  const userId = parseInt(fullUrl.searchParams.get("id"));

  connections.set(userId, ws);
  console.log(userId, "was set for connection");
  ws.on("message", (buffer) => {
    const payload = JSON.parse(buffer.toString());
    const recipientWs = connections.get(payload.sendingTo);
    console.log(payload);
    if (recipientWs && recipientWs.readyState === 1) {
      console.log("sending to user with id: ", payload.sendingTo);
      recipientWs.send(payload.message);
    }
  });
});
