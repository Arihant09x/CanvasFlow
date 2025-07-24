"use client";
// @ts-nocheck
import { useParams, useRouter } from "next/navigation";
import React, { useEffect, useState } from "react";
import { getRoomInfo } from "../../../service/api";
import { env } from "@repo/backend-common/config";
import { Canvas } from "../../Component/Canvas";
import { ArrowUpRight, Circle, LogOut, Square, Type } from "lucide-react";
import { showFancyToast } from "../../../hook/use_toast";

export default function Page() {
  const param = useParams();
  const slug = param.roomId;
  const router = useRouter();
  const [roomId, setRoomId] = useState<string | null>(null);
  const [socket, setSocket] = useState<WebSocket | null>(null);
  const [selectedTool, setSelectedTool] = useState("select");
  const [connectedUsers, setConnectedUsers] = useState<
    { userId: string; firstname: string; photo: string }[]
  >([]);

  useEffect(() => {
    async function fetchSocket() {
      const token = localStorage.getItem("token");
      const res = await getRoomInfo(slug as string, token as string);
      const id = res.room.id;
      setRoomId(id);
      const WS_URL =
        env.NEXT_PUBLIC_WS_URL || "ws://canvasflow.devvault.site/ws";
      const ws = new WebSocket(`${WS_URL}/?token=${token}`);
      ws.onopen = () => {
        setSocket(ws);
        ws.send(
          JSON.stringify({
            type: "join_room",
            roomId: id as string,
          })
        );
      };
      ws.onmessage = (event) => {
        try {
          const message = JSON.parse(event.data);
          if (message.type === "user_list" && message.roomId === id) {
            setConnectedUsers(message.users || []);
          }
        } catch (e) {
          // ignore
        }
      };
    }
    if (slug) {
      fetchSocket();
    }
  }, []);

  if (!socket) {
    return (
      <div className="flex gap-2 items-center justify-center text-center h-screen">
        Connecting to the server...{" "}
        <div className="flex items-center justify-center -mt-3 w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!roomId) return null;

  return (
    <div>
      <ExcailDrawNavBar
        selectedTool={selectedTool}
        onSelectTool={setSelectedTool}
        roomId={roomId}
        socket={socket}
        connectedUsers={connectedUsers}
        router={router}
      />
      <Canvas roomId={roomId} socket={socket} selectedTool={selectedTool} />
    </div>
  );
}

// ✅ ✅ ✅ LOCAL COMPONENT ONLY — NOT EXPORTED
function ExcailDrawNavBar({
  onSelectTool,
  roomId,
  socket,
  selectedTool,
  connectedUsers,
  router,
}: {
  onSelectTool: (tool: string) => void;
  selectedTool: string;
  roomId: string;
  socket: WebSocket;
  connectedUsers: { userId: string; firstname: string; photo: string }[];
  router: ReturnType<typeof useRouter>;
}) {
  const [hoveredUserId, setHoveredUserId] = useState<string | null>(null);
  const tools = [
    { name: "Rectangle", icon: <Square />, value: "rect" },
    { name: "Circle", icon: <Circle />, value: "circle" },
    { name: "Arrow", icon: <ArrowUpRight />, value: "arrow" },
    { name: "Text", icon: <Type />, value: "text" },
  ];

  const handleLeaveRoom = () => {
    socket.send(
      JSON.stringify({
        type: "Leave_room",
        roomId: roomId,
      })
    );
    showFancyToast({
      title: "Leaving Room",
      description: "You are now leaving the room",
      type: "success",
    });
    router.push("/canvas");
  };

  return (
    <div>
      <nav
        className="flex items-center gap-2 border border-[#403e6a] rounded-xl px-2 py-1 fixed top-6 left-1/2 -translate-x-1/2 z-50"
        style={{ background: "#232329" }}
      >
        {/* User Avatars */}
        <div className="flex items-center gap-2 mr-4">
          {connectedUsers.map((user) => (
            <div
              key={user.userId}
              className="relative flex flex-col items-center"
              onMouseEnter={() => setHoveredUserId(user.userId)}
              onMouseLeave={() => setHoveredUserId(null)}
            >
              <span
                className={`absolute -top-7 left-1/2 -translate-x-1/2 px-2 py-1 rounded-lg text-xs font-semibold bg-black/80 text-white shadow-lg pointer-events-none transition-all duration-300 ease-in-out ${
                  hoveredUserId === user.userId
                    ? "opacity-100 translate-y-0"
                    : "opacity-0 -translate-y-2"
                }`}
                style={{ whiteSpace: "nowrap", zIndex: 10 }}
              >
                {user?.firstname || "?"}
              </span>
              <div
                className="w-8 h-8 rounded-full flex items-center justify-center bg-gradient-to-br from-purple-500 to-pink-500 text-white font-bold shadow-md border-2 border-white hover:scale-110 transition-transform overflow-hidden"
                title={user.firstname}
              >
                {user.photo ? (
                  <img
                    src={user.photo}
                    alt={user.firstname}
                    className="w-full h-full object-cover rounded-full"
                  />
                ) : (
                  <span className="text-lg">
                    {user.firstname?.[0]?.toUpperCase() || "?"}
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* Tool Buttons */}
        {tools.map((tool) => (
          <button
            key={tool.value}
            onClick={() => onSelectTool(tool.value)}
            className={`flex flex-col items-center justify-center rounded-lg transition-all duration-150 ${
              selectedTool === tool.value ? "shadow" : ""
            }`}
            style={{
              width: "60px",
              height: "50px",
              background:
                selectedTool === tool.value ? "#5c59a6" : "transparent",
              color: selectedTool === tool.value ? "#fff" : "#bdbcf1",
            }}
            onMouseEnter={(e) => {
              if (selectedTool !== tool.value) {
                e.currentTarget.style.background = "#313051";
                e.currentTarget.style.color = "#fff";
              }
            }}
            onMouseLeave={(e) => {
              if (selectedTool !== tool.value) {
                e.currentTarget.style.background = "transparent";
                e.currentTarget.style.color = "#bdbcf1";
              }
            }}
            title={tool.value}
          >
            {tool.icon}
            <span className="text-[10px] mt-0.5 font-medium">{tool.name}</span>
          </button>
        ))}
      </nav>
      <button
        onClick={handleLeaveRoom}
        className="flex justify-center items-center gap-2 absolute right-0 top-6 mr-5 px-5 py-2 rounded-full bg-gradient-to-r from-pink-500 via-purple-500 to-indigo-500 text-white font-semibold shadow-lg hover:scale-105 hover:shadow-xl active:scale-95 transition-all duration-200 border-none outline-none focus:ring-2 focus:ring-pink-300"
      >
        <LogOut size={19} className="drop-shadow" />
        <span className="tracking-wide">Leave Room</span>
      </button>
    </div>
  );
}
