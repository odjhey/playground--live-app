import { useState } from "react";
import "./App.css";

import { io } from "socket.io-client";

const socket = io("/", {
  transports: ["websocket"],
  path: "/live",
  autoConnect: false,
});

function App() {
  const [count, setCount] = useState(0);
  const [connectStatus, setConnectStatus] = useState(socket.connected);
  const [fromServer, setFromServer] = useState("");
  const [name, setName] = useState("");

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
    console.log(msg);
  });
  socket.on("server_message", (args) => {
    setFromServer(args);
  });

  return (
    <>
      <h1>React</h1>
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
          socket.emit("wsping", `${name} ${count}`);
        }}
      >
        Click
      </button>
    </>
  );
}

export default App;
