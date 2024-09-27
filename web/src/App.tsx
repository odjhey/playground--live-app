import { useState } from "react";
import "./App.css";

import { io } from "socket.io-client";

const socket = io("/", {
  transports: ["websocket"],
  path: "/live",
  autoConnect: false,
});

// @todo should be common between server and client
// @todo see if can use Zod
type MessageTypes = {
  bid: {
    by: string;
    amount: number;
    from: string;
  };
};

function App() {
  const [count, setCount] = useState(0);
  const [connectStatus, setConnectStatus] = useState(socket.connected);
  const [fromServer, setFromServer] = useState("");
  const [name, setName] = useState("");
  const [bidResult, setBidResult] = useState();

  socket.on("connect", () => {
    setConnectStatus(true);
  });
  socket.on("disconnect", () => {
    setConnectStatus(false);
  });
  socket.on("connect_error", () => {
    setConnectStatus(false);
  });
  socket.on("wspong", (msg) => {
    setBidResult(msg);
  });
  socket.on("server_message", (args) => {
    console.log("server_message", args);
    setFromServer(JSON.stringify(args));
  });

  const bid = (args: MessageTypes["bid"]) => {
    socket.emit("wsping", JSON.stringify(args));
  };
  const getReference = () => {
    console.log("from server", fromServer);
    if (fromServer) {
      return JSON.parse(fromServer).reference;
    }
  };

  const getCurrentBid = () => {
    if (fromServer) {
      const v = JSON.parse(fromServer);
      return `${v.amount} - ${v.by}`;
    }
    return "";
  };

  return (
    <>
      <h1>Bid: {getCurrentBid()}</h1>
      <div className="card">
        name <input onChange={(e) => setName(e.target.value)}></input>
        <br />
        <button onClick={() => setCount((count) => count + 1)}>
          bid is {count}
        </button>
        <p>server message: {fromServer}</p>
      </div>
      <p>is connected: {connectStatus ? "true" : "false"}</p>
      <button
        onClick={() => {
          socket.connect();
          bid({
            by: name,
            amount: count,
            from: getReference(),
          });
        }}
      >
        Click
      </button>
      <br />
      <p>{bidResult}</p>
    </>
  );
}

export default App;
