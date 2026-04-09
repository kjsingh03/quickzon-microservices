import { Server as SocketIOServer } from "socket.io";

declare global {
  var socketIO: SocketIOServer | undefined;
}

export function getIO(): SocketIOServer | null {
  if (!global.socketIO) {
    console.error("Socket.IO not initialized yet");
    return null;
  }
  return global.socketIO;
}

export function setIO(serverIO: SocketIOServer) {
  global.socketIO = serverIO;
  console.log("✅ Socket.IO instance stored globally");
}

export function initSocket(server: any) {
  if (global.socketIO) {
    return global.socketIO;
  }

  const io = new SocketIOServer(server, {
    path: "/socket.io", // must match frontend client
    cors: { origin: [ "http://localhost:3000", "http://localhost:3001", "https://sacred-foal-secondly.ngrok-free.app"], credentials: true, methods: ["GET", "POST"],},
  });

  setIO(io); // Store globally

  io.on("connection", (socket) => {
    socket.on("join", (room: string) => {
      if (!room)
        return;
      socket.join(room);
    });

    socket.on("disconnect", () => {
      console.log("User disconnected:", socket.id);
    });
  });

  return io;
}