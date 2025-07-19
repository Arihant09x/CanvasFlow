import express from "express";
import bcrypt from "bcrypt";
import { userAuth } from "../middleware/userAuth.js";
import { LoginSchema, SignUpSchema } from "@repo/common/types";
import { prismaClient } from "@repo/database/db";
import jwt, { JwtPayload } from "jsonwebtoken";
import { env } from "@repo/backend-common/config";
const JWT_SECRET = env.JWT_SECRET;
if (!JWT_SECRET) {
  console.error("FATAL: JWT_SECRET environment variable is not set");
  process.exit(1); // Crash immediately if missing; server can't work without it
}
console.log(JWT_SECRET);
const router: express.Router = express.Router();
router.use(express.json());
router.get("/", (req, res) => {
  res.status(200).json({
    message: "Welcome to the excaildraw backend",
  });
});
router.post("/signup", async (req, res) => {
  try {
    const result = SignUpSchema.safeParse(req.body);
    if (!result.success) {
      res.status(401).json({
        message:
          result.error.errors.map((error) => error.message).join(" ,") ||
          "Invild Inputs",
        error: result.error.errors,
      });
      return;
    }
    let { email, firstname, lastname, password, photo } = req.body;
    if (photo == null) {
      photo =
        "https://sp.yimg.com/ib/th?id=OIP.uoa-pARZtksq6F7eMJn4MAHaHa&pid=Api&w=148&h=148&c=7&dpr=2&rs=1";
    }
    const existingUser = await prismaClient.user.findUnique({
      where: { email },
    });
    if (existingUser) {
      res.status(409).json({
        message: `This Email has already been taken: ${email}`,
      });
      return;
    }
    const hashPassword = await bcrypt.hash(password, 10);
    const user = await prismaClient.user.create({
      data: {
        email,
        firstname,
        lastname,
        password: hashPassword,
        photo,
      },
    });
    const token = jwt.sign({ id: user.id }, JWT_SECRET);
    res.status(201).json({
      messaage: `User Created Sucessfully with this email ${email}`,
      user: {
        id: user.id,
        email: user.email,
        firstname: user.firstname,
        token: token,
        photoURL: user.photo,
      },
    });
  } catch (e) {
    console.error("Error during signup ", e);
    res.status(500).json({
      message: "Internal server error",
      e,
    });
  }
});

router.post("/signin", async (req, res) => {
  try {
    const result = LoginSchema.safeParse(req.body);
    if (!result.success) {
      res.status(401).json({
        message:
          result.error.errors.map((error) => error.message).join(" ,") ||
          "Invalid Inputs",
        error: result.error.errors,
      });
      return;
    }

    const { email, password } = req.body;
    const existingUser = await prismaClient.user.findUnique({
      where: { email },
    });
    if (!existingUser) {
      res.status(409).json({
        message: "Invalid Credentials/Signup first",
      });
      return;
    }

    // Check password
    const isPasswordValid = await bcrypt.compare(
      password,
      existingUser.password
    );
    if (!isPasswordValid) {
      res.status(401).json({
        message: "Invalid Credentials",
      });
      return;
    }

    const token = jwt.sign({ id: existingUser.id }, JWT_SECRET);
    res.status(200).json({
      message: "User Logged In Successfully",
      token: token,
      PhotoURL: existingUser.photo,
    });
  } catch (e) {
    console.error("Error during signin ", e);
    res.status(500).json({
      message: "Internal server error",
      e,
    });
  }
});

router.post("/room-id", userAuth, async (req, res) => {
  try {
    const { slug } = req.body;
    const adminId = req.userId;
    if (!slug || !adminId) {
      res.status(400).json({
        message: "Missing slug or user not authenticated",
      });
      return;
    }
    const roomExist = await prismaClient.room.findUnique({
      where: { slug },
    });
    if (roomExist) {
      res.status(409).json({
        message: "Room with this slug already exists",
      });
      return;
    }

    const room = await prismaClient.room.create({
      data: {
        slug,
        adminId,
      },
    });
    res.status(201).json({
      message: "Room created Successsfully",
      room: {
        id: room.id,
        slug: room.slug,
        adminId: room.adminId,
        createdAt: room.createdAt,
      },
    });
  } catch (e) {
    res.status(500).json({
      message: "Internal server error during room-id creation",
      error: Error instanceof Error ? Error.message : Error,
    });
  }
});
router.get("/rooms", userAuth, async (req, res) => {
  try {
    const rooms = await prismaClient.room.findMany();

    // Fetch admin info for each room
    const roomsWithAdmin = await Promise.all(
      rooms.map(async (room) => {
        const admin = await prismaClient.user.findUnique({
          where: { id: room.adminId },
        });
        return {
          ...room,
          adminName: admin?.firstname || "Unknown",
          adminPhoto: admin?.photo || "",
        };
      })
    );

    res.status(200).json({
      rooms: roomsWithAdmin,
    });
  } catch (e) {
    console.error("Error fetching rooms", e);
    res.status(500).json({
      message: "Internal server error while fetching rooms",
    });
  }
});
router.get("/chats/:roomid", userAuth, async (req, res) => {
  const roomId = Number(req.params.roomid);
  if (isNaN(roomId)) {
    res.status(400).json({
      message: "Invalid room id",
    });
    return;
  }
  try {
    const messages = await prismaClient.chat.findMany({
      where: {
        roomId: roomId,
      },
      orderBy: {
        id: "desc",
      },
      take: 1000,
    });
    res.status(201).json({
      messages,
    });
  } catch (e) {
    console.error("Error during chats", e);
    res.status(500).json({
      messgae: "Internal server error during chat history",
    });
  }
});

router.get("/room/:slug", userAuth, async (req, res) => {
  const slug = req.params.slug;

  try {
    const room = await prismaClient.room.findFirst({
      where: {
        slug,
      },
    });
    res.status(201).json({
      room: {
        id: room?.id,
        slug: room?.slug,
        adminId: room?.adminId,
        createdAt: room?.createdAt,
      },
    });
  } catch (e) {
    console.error("Error during chats", e);
    res.status(500).json({
      messgae: "Internal server error during chat history",
    });
  }
});

router.get("/user", userAuth, async (req, res) => {
  try {
    const user = await prismaClient.user.findUnique({
      where: {
        id: req.userId,
      },
    });
    res.status(200).json({
      photoURL: user?.photo,
    });
  } catch (e) {
    console.error("Error during user userInfo", e);
    res.status(500).json({
      message: "Internal server error during user Info",
    });
  }
});

router.get("/my-rooms", userAuth, async (req, res) => {
  try {
    const userId = req.userId;
    const rooms = await prismaClient.room.findMany({
      where: { adminId: userId },
    });

    // Fetch admin info for each room
    const roomsWithAdmin = await Promise.all(
      rooms.map(async (room) => {
        const admin = await prismaClient.user.findUnique({
          where: { id: room.adminId },
        });
        return {
          ...room,
          adminName: admin?.firstname || "Unknown",
          adminPhoto: admin?.photo || "",
        };
      })
    );

    res.status(200).json({
      rooms: roomsWithAdmin,
    });
  } catch (e) {
    res.status(500).json({
      message: "Internal server error while fetching my rooms",
    });
  }
});

//  delete room endpoint
router.delete("/room/:id", userAuth, async (req, res) => {
  try {
    const roomId = Number(req.params.id);
    const userId = req.userId;
    // Only allow deleting if the user is the admin
    const room = await prismaClient.room.findUnique({ where: { id: roomId } });
    if (!room || room.adminId !== userId) {
      res.status(403).json({ message: "Not authorized to delete this room" });
      return;
    }
    await prismaClient.room.delete({ where: { id: roomId } });
    res.status(200).json({ message: "Room deleted successfully" });
  } catch (e) {
    res
      .status(500)
      .json({ message: "Internal server error during room deletion" });
  }
});
export default router;
