import { WebSocketServer, WebSocket } from "ws";
import jwt, { JwtPayload } from "jsonwebtoken";
import { env } from "@repo/backend-common/config";
import { prismaClient } from "@repo/database/db";
const JWT_SECRET = env.JWT_SECRET;
console.log("token: " + JWT_SECRET);
if (!JWT_SECRET) {
  throw new Error("JWT_SECRET environment variable is not set");
}
const wss = new WebSocketServer({ port: 8080 });
console.log("Web Socket Server is running on port 8080");
interface User {
  userId: string;
  room: string[];
  ws: WebSocket;
}
declare global {
  namespace Express {
    export interface Request {
      userId?: string;
    }
  }
}

const users: User[] = [];
wss.on("connection", function connection(ws, request) {
  const url = request.url;
  if (!url) {
    ws.close();
    return;
  }
  const queryParam = new URLSearchParams(url.split("?")[1]);
  const token = queryParam.get("token");
  if (!token) {
    ws.close();
    return;
  }
  const userId = checkuser(token);
  if (userId == null) {
    ws.close();
    return null;
  }

  users.push({
    userId: userId,
    room: [],
    ws: ws,
  });
  ws.on("message", async function message(data) {
    let parseData;
    try {
      parseData = JSON.parse(data.toString());
    } catch (err) {
      ws.send(JSON.stringify({ type: "error", message: "Invalid JSON" }));
      return;
    }

    if (parseData.type == "join_room") {
      const user = users.find((x) => x.ws === ws);
      if (user && !user.room.includes(parseData.roomId)) {
        user?.room.push(parseData.roomId);
        broadcastUserList(parseData.roomId); // Broadcast after join
      }
    }

    if (parseData.type == "leave_room") {
      const user = users.find((x) => x.ws === ws);
      if (!user) {
        return;
      }
      user.room = user.room.filter((x) => x !== parseData.roomId);
      broadcastUserList(parseData.roomId); // Broadcast after leave
    }

    if (parseData.type == "chat") {
      const roomId = parseData.roomId;
      const message = parseData.message;

      try {
        await prismaClient.chat.create({
          data: {
            roomId: Number(roomId),
            message,
            userId,
          },
        });
      } catch (e) {
        ws.send(
          JSON.stringify({ type: "error", message: "Failed to save chat" })
        );
        return;
      }
      users.forEach((user) => {
        // Normalize types for comparison
        const userRooms = user.room.map(String);
        const targetRoomId = String(roomId);
        if (userRooms.includes(targetRoomId)) {
          if (user.ws.readyState === user.ws.OPEN) {
            try {
              user.ws.send(
                JSON.stringify({
                  type: "chat",
                  message: message,
                  roomId,
                  from: userId,
                })
              );
            } catch (err) {
              console.error("Failed to send message to user:", err);
            }
          } else {
            console.warn("WebSocket not open for user:", user.userId);
          }
        }
      });
    }
  });
  ws.on("close", () => {
    const idx = users.findIndex((u) => u.ws === ws);
    if (idx !== -1) {
      const leavingUser = users[idx];
      if (leavingUser) {
        leavingUser.room.forEach((roomId) => broadcastUserList(roomId));
      }
      users.splice(idx, 1);
    }
  });
});

function checkuser(token: string): string | null {
  try {
    //@ts-ignore
    const decoded = jwt.verify(token, JWT_SECRET) as JwtPayload;
    if (typeof decoded == "string") {
      return null;
    }

    if (!decoded || !decoded.id) {
      return null;
    }

    return decoded.id;
  } catch (e) {
    console.log("Error during CheckUser", e);
    return null;
  }
}

function broadcastUserList(roomId: string) {
  // Find all userIds in the room
  const userIds = users
    .filter((u) => u.room.includes(roomId))
    .map((u) => u.userId);
  if (userIds.length === 0) return;
  // Fetch user details from DB
  prismaClient.user
    .findMany({
      where: { id: { in: userIds } },
      select: { id: true, firstname: true, photo: true },
    })
    .then((userDetails) => {
      // Send to all users in the room
      users.forEach((u) => {
        if (u.room.includes(roomId) && u.ws.readyState === u.ws.OPEN) {
          u.ws.send(
            JSON.stringify({
              type: "user_list",
              roomId,
              users: userDetails.map((user) => ({
                userId: user.id,
                firstname: user.firstname,
                photo: user.photo,
              })),
            })
          );
        }
      });
    });
}
