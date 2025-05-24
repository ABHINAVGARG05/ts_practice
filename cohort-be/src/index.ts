import WebSocket, { WebSocketServer } from "ws";
import http from "http";

const server = http.createServer(function (request: any, response: any) {
  console.log(new Date() + " Received request for " + request.url);
  response.end("hi there");
});

const wss = new WebSocketServer({ server });

wss.on("connection", function connection(ws) {
  ws.on("error", console.error);

  ws.on("message", function message(data, isBinary) {
    wss.clients.forEach(function each(client) {
      if (client.readyState === WebSocket.OPEN) {
        client.send(data, { binary: isBinary });
      }
    });
  });

  ws.send("Hello! Message From Server!!");
});

wss.on("connection", function (ws) {
  ws.on("error", (err) => console.error(err));

  ws.on("close", function () {
    wss.clients.forEach(function each(client) {
      if (client !== ws && client.readyState === WebSocket.OPEN) {
        client.send("Signing off Abhinav Garg");
      }
    });
  });
});

server.listen(8080, function () {
  console.log(new Date() + " Server is listening on port 8080");
});
