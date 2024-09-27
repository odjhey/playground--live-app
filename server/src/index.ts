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

// @todo should be common between server and client
// @todo see if can use Zod
type MessageTypes = {
  bid: {
    by: string;
    amount: number;
    from: string;
  };
  bidResponse: {
    by: string;
    amount: number;
    reference: string;
  };
};

const broadcastBid = (bidInfo: MessageTypes["bidResponse"]) => {
  lastMessage = JSON.stringify(bidInfo);
  server.io.emit("server_message", bidInfo);
};

const getLastBid = (): MessageTypes["bid"] => {
  if (lastMessage) {
    console.log("--lastMessage", lastMessage);
    return JSON.parse(lastMessage) as MessageTypes["bid"];
  }
  return {
    by: "",
    amount: 0,
    from: "",
  };
};

server.ready((err) => {
  if (err) throw err;

  server.io.on("connection", (socket) => {
    console.log("A client connected");

    console.log(lastMessage);
    if (lastMessage) {
      socket.emit("server_message", JSON.parse(lastMessage));
    }

    // Handle incoming 'ping' event and reply with 'wspong'
    socket.on("wsping", (args: string) => {
      const bid = JSON.parse(args) as MessageTypes["bid"];
      console.log("Received ping", args);

      if (bid.amount < 1) {
        socket.emit("wspong", "invalid amount"); // Emit 'wspong' event back to client
      } else {
        const lastBid = getLastBid();
        if (lastBid.from && lastBid.from !== bid.from) {
          console.log(
            `stale: last bid ${JSON.stringify(lastBid)}, current bid: ${
              bid.from
            }`
          );
          socket.emit("wspong", "stale"); // Emit 'wspong' event back to client
        } else {
          if (lastBid.amount >= bid.amount) {
            socket.emit("wspong", "bid too low"); // Emit 'wspong' event back to client
          } else {
            broadcastBid({
              by: bid.by,
              amount: bid.amount,
              reference: Date.now().toString(), // modify to be unique
            });
            socket.emit("wspong", '("./)b'); // Emit 'wspong' event back to client
          }
        }
      }
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
