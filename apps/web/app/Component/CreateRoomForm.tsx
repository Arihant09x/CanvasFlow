"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
} from "../Component/ui/card";

interface CreateRoomFormProps {
  onCreate: (roomName: string) => void;
  onCancel: () => void;
}

const CreateRoomForm: React.FC<CreateRoomFormProps> = ({
  onCreate,
  onCancel,
}) => {
  const [roomName, setRoomName] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (roomName.trim()) {
      onCreate(roomName.trim());
    }
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex  items-center justify-center  bg-opacity-50 backdrop-blur-sm"
      >
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.8, opacity: 0 }}
          transition={{ duration: 0.3 }}
          className="max-w-md w-full"
        >
          <Card>
            <form onSubmit={handleSubmit}>
              <CardHeader>
                <CardTitle>Create a New Room</CardTitle>
                <CardDescription>
                  Enter the name of the room you want to create.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <input
                  type="text"
                  value={roomName}
                  onChange={(e) => setRoomName(e.target.value)}
                  placeholder="Room name"
                  className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-600"
                  autoFocus
                />
              </CardContent>
              <CardFooter className="flex justify-end space-x-2">
                <button
                  type="button"
                  onClick={onCancel}
                  className="px-4 py-2 rounded-md bg-gray-300 hover:bg-gray-400 text-gray-700"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-md bg-purple-600 hover:bg-purple-700 text-white"
                >
                  Create
                </button>
              </CardFooter>
            </form>
          </Card>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

export default CreateRoomForm;
