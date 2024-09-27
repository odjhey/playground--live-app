import fastify from "fastify";
import fastifySocketIO from "fastify-socket.io";

const server = fastify({ logger: true });

let lastMessage: string = "";
server.register(fastifySocketIO, {
  path: "/live", // Serve WebSocket connections under /live
});

server.get("/ping", async (request, reply) => {
  return "pong\n";
});

server.post("/message", async (request, reply) => {
  const m = (request.body as any).message;
  server.io.emit("server_message", m); // Emit 'server_message' event to all connected clients
  lastMessage = m;
  return "ok";
});

server.ready((err) => {
  if (err) throw err;

  server.io.on("connection", (socket) => {
    console.log("A client connected");

    server.io.emit("server_message", lastMessage);

    // Handle incoming 'ping' event and reply with 'wspong'
    socket.on("wsping", (args) => {
      console.log("Received ping", args);
      socket.emit("wspong", "lasdjf"); // Emit 'wspong' event back to client
    });

    // Handle disconnect event
    socket.on("disconnect", () => {
      console.log("Client disconnected");
    });
  });
});

server.listen({ port: 8080 }, (err, address) => {
  if (err) {
    console.error(err);
    process.exit(1);
  }
  console.log(`Server listening at ${address}`);
});
