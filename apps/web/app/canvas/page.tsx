"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  Globe,
  Users,
  Palette,
  Zap,
  Paintbrush,
  Target,
  LogOut,
  Plus,
  LucideProps,
} from "lucide-react";
import Beams from "../Component/Gemontry";
import { motion } from "framer-motion";
import { showFancyToast } from "../../hook/use_toast";
import { createRoom, getRoom, setAuthToken } from "../../service/api";
import CreateRoomForm from "../Component/CreateRoomForm";

interface RoomItem {
  id: number;
  roomName: string;
  adminName: string;
  slug: string;
  imageUrl: string;
}
interface BentoItem {
  title: string;
  description: string;
  icon: React.ReactNode;
  status?: string;
  tags?: string[];
  cta?: string;
  meta?: string;
  hasPersistentHover?: boolean;
}

interface ClickableBentoGridProps {
  items: BentoItem[];
  onItemClick?: (index: number) => void;
}

const Page = () => {
  const [rooms, setRooms] = useState<RoomItem[]>([]);
  const [loading, setLoading] = useState(true);

  const router = useRouter();

  const [showCreateForm, setShowCreateForm] = useState(false);
  const handleCreateRoom = () => {
    setShowCreateForm(true);
  };
  const handleCreate = async (newRoomName: string) => {
    try {
      const token = localStorage.getItem("token");
      if (token) {
        setAuthToken(token); // set token without Bearer prefix
      } else {
        setAuthToken(null);
      }
      const response = await getRoom(token as string);
      const existingRooms = response.rooms || [];
      const slug = newRoomName.toLowerCase().replace(/\s+/g, "-");
      const roomExists = existingRooms.some(
        (room: any) => room.slug.toLowerCase() === slug
      );
      if (roomExists) {
        showFancyToast({
          title: "Room Creation Failed",
          description: "Room name already exists. Please choose another name.",
          type: "error",
        });
        return;
      }
      // Create room on backend
      const createResponse = await createRoom(slug, token as string);
      const createdRoom = createResponse.room;
      if (!createdRoom) {
        showFancyToast({
          title: "Room Creation Failed",
          description: "Failed to create room on server.",
          type: "error",
        });
        return;
      }
      const newRoom = {
        id: createdRoom.id,
        roomName: createdRoom.slug,
        adminName: "You",
        slug: createdRoom.slug,
        imageUrl:
          "https://upload.wikimedia.org/wikipedia/commons/3/3a/Excalidraw_logo.png",
      };
      showFancyToast({
        title: "Room Created",
        description: "The Room Has Been Created Successfully",
        type: "success",
      });
      setRooms([...rooms, newRoom]);
      setShowCreateForm(false);
      router.push(`/canvas/${slug}`);
    } catch (error) {
      showFancyToast({
        title: "Error",
        description: "Failed to check room name availability or create room.",
        type: "error",
      });
    }
  };

  const handleCancel = () => {
    setShowCreateForm(false);
  };

  function ClickableBentoGrid({ items, onItemClick }: ClickableBentoGridProps) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mt-6">
        {items.map((item, index) => (
          <motion.div
            key={index}
            onClick={() => onItemClick?.(index)}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className={`group relative p-4 rounded-xl overflow-hidden transition-all duration-300 cursor-pointer
            border border-gray-100/80 dark:border-white/10 bg-white dark:bg-black
            hover:shadow-lg hover:-translate-y-1 will-change-transform
          `}
          >
            <div
              className={`absolute inset-0 ${
                item.hasPersistentHover
                  ? "opacity-100"
                  : "opacity-0 group-hover:opacity-100"
              } transition-opacity duration-300`}
            >
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(0,0,0,0.02)_1px,transparent_1px)] dark:bg-[radial-gradient(circle_at_center,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[length:4px_4px]" />
            </div>

            <div className="relative flex flex-col space-y-3">
              <div className="flex items-center justify-between">
                <div className="w-8 h-8 rounded-lg flex items-center justify-center bg-black/5 dark:bg-white/10 group-hover:bg-gradient-to-br transition-all duration-300">
                  {item.icon}
                </div>
                <span className="text-xs font-medium px-2 py-1 rounded-lg backdrop-blur-sm bg-black/5 dark:bg-white/10 text-gray-600 dark:text-gray-300 transition-colors duration-300 group-hover:bg-black/10 dark:group-hover:bg-white/20">
                  {item.status || "Active"}
                </span>
              </div>

              <div className="space-y-2">
                <h3 className="font-medium text-gray-900 dark:text-gray-100 tracking-tight text-[15px]">
                  {item.title}
                  <span className="ml-2 text-xs text-gray-500 dark:text-gray-400 font-normal">
                    {item.meta}
                  </span>
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-300 leading-snug font-[425]">
                  {item.description}
                </p>
              </div>

              <div className="flex items-center justify-between mt-2">
                <div className="flex flex-wrap gap-2 text-xs text-gray-500 dark:text-gray-400">
                  {item.tags?.map((tag, i) => (
                    <span
                      key={i}
                      className="px-2 py-1 rounded-md bg-black/5 dark:bg-white/10 backdrop-blur-sm transition-all duration-200 hover:bg-black/10 dark:hover:bg-white/20"
                    >
                      #{tag}
                    </span>
                  ))}
                </div>
                <span className="text-xs text-gray-500 dark:text-gray-400 opacity-0 group-hover:opacity-100 transition-opacity">
                  {item.cta || "Join →"}
                </span>
              </div>
            </div>

            <div
              className={`absolute inset-0 -z-10 rounded-xl p-px bg-gradient-to-br from-transparent via-gray-100/50 to-transparent dark:via-white/10 ${
                item.hasPersistentHover
                  ? "opacity-100"
                  : "opacity-0 group-hover:opacity-100"
              } transition-opacity duration-300`}
            />
          </motion.div>
        ))}
      </div>
    );
  }
  useEffect(() => {
    const fetchRooms = async () => {
      const token = localStorage.getItem("token");
      if (token) {
        setAuthToken(token);
        try {
          const response = await getRoom(token);
          const fetchedRooms = response.rooms || [];
          setRooms(
            fetchedRooms.map((room: any) => ({
              id: room.id,
              roomName: room.slug,
              adminName: room.adminName || "",
              slug: room.slug,
              imageUrl:
                "https://upload.wikimedia.org/wikipedia/commons/3/3a/Excalidraw_logo.png",
            }))
          );
        } catch (error) {
          showFancyToast({
            title: "Error",
            description: "Failed to fetch rooms.",
            type: "error",
          });
        }
      }
      setLoading(false); // ✅ Always stop loading after fetch
    };
    fetchRooms();
  }, []);

  React.useEffect(() => {
    const token = localStorage.getItem("token");
    if (token) {
      // Protect page from back navigation by replacing history state
      window.history.pushState(null, "", window.location.href);
      const onPopState = (e: PopStateEvent) => {
        window.history.pushState(null, "", window.location.href);
      };
      window.addEventListener("popstate", onPopState);
      return () => {
        window.removeEventListener("popstate", onPopState);
      };
    }
  }, []);

  function handleLog() {
    localStorage.removeItem("token");
    localStorage.removeItem("userPic");
    showFancyToast({
      title: "Logout Successfully",
      description: "Hope to see you again soon!",
      type: "success",
    });

    router.push("/signin");
  }

  const handleJoinRoom = (slug: string) => {
    router.push(`/canvas/${slug}`);
  };

  const roomItems: BentoItem[] = rooms.map((room, index) => {
    const icons: React.ComponentType<LucideProps>[] = [
      Globe,
      Users,
      Palette,
      Zap,
      Paintbrush,
      Target,
    ];

    const Icon = icons[index % icons.length] || Globe;
    return {
      title: room.roomName,
      description: `Admin: ${room.adminName}`,
      icon: <Icon className="w-4 h-4 text-purple-500" />,
      status: "Live",
      tags: ["Excalidraw", "Real-time", "Canvas"],
      cta: "Join →",
      meta: `Room #${room.id}`,
    };
  });

  const handleItemClick = (index: number) => {
    const room = rooms[index];
    if (room) handleJoinRoom(room.slug);
  };

  return (
    <>
      <div className="min-h-screen bg-black text-white relative overflow-hidden">
        {/* Beams */}
        <div className="flex justify-center items-center inset-0 z-0 absolute pointer-events-none">
          <Beams
            beamWidth={15}
            beamHeight={20}
            beamNumber={20}
            lightColor="#A15DA2"
            speed={4}
            noiseIntensity={1.75}
            scale={0.2}
            rotation={30}
          />
        </div>

        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="p-6 md:p-8 relative z-10"
        >
          <div className="flex flex-col md:flex-row justify-between items-center">
            <div className="flex items-center space-x-2 mb-4 md:mb-0">
              <div className="w-10 h-10 flex items-center justify-center">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="#a855f7"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="w-7 h-7"
                >
                  <path d="M12 20h9" />
                  <path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4Z" />
                </svg>
              </div>
              <span className="text-3xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
                CanvasFlow
              </span>
            </div>
            <div className="flex justify-center gap-2">
              <button
                onClick={handleCreateRoom}
                className="bg-gradient-to-r flex gap-1 from-purple-600 to-pink-600 text-white px-3 py-2 rounded-lg font-medium shadow-md hover:scale-105 cursor-pointer transition-transform"
              >
                <Plus /> Create Room
              </button>
              <button
                onClick={handleLog}
                className="bg-gradient-to-r flex gap-1 from-purple-600 to-pink-600 text-white px-3 py-2 rounded-lg font-medium shadow-md hover:scale-105 cursor-pointer transition-transform"
              >
                <LogOut /> Log Out
              </button>
            </div>
          </div>

          {/* Grid */}
          {loading ? (
            <div className="text-center mt-32">
              <p className="mb-6 text-purple-400 text-lg">Loading rooms...</p>
            </div>
          ) : roomItems.length > 0 ? (
            <ClickableBentoGrid
              items={roomItems}
              onItemClick={handleItemClick}
            />
          ) : (
            <div className="text-center mt-32">
              <p className="mb-6 text-purple-400 text-lg">
                No rooms available.
              </p>
              <button
                onClick={handleCreateRoom}
                className="bg-gradient-to-r from-purple-700 to-pink-600 hover:from-pink-600 hover:to-purple-700 px-6 py-3 rounded-full font-semibold shadow-lg transition-transform transform hover:scale-105"
              >
                Create a Room
              </button>
            </div>
          )}
        </motion.div>
      </div>
      {showCreateForm && (
        <CreateRoomForm onCreate={handleCreate} onCancel={handleCancel} />
      )}
    </>
  );
};

export default Page;
