import { NextFunction, Request, Response } from "express";
import dotenv from "dotenv";
import jwt, { JwtPayload } from "jsonwebtoken";
import { env } from "@repo/backend-common/config";
dotenv.config();
const JWT_SECRET = env.JWT_SECRET as string;
if (!JWT_SECRET) {
  console.error("FATAL: JWT_SECRET environment variable is not set");
  process.exit(1); // Crash immediately if missing; server can't work without it
}
declare global {
  namespace Express {
    export interface Request {
      userId?: string;
    }
  }
}

export function userAuth(req: Request, res: Response, next: NextFunction) {
  const token = req.headers["authorization"] ?? "";
  if (!token) {
    res.status(401).json({ message: "No token provided" });
    return;
  }
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as JwtPayload;
    if (decoded.id) {
      req.userId = decoded.id;
      next();
    } else {
      res.status(400).json({
        message: "Unauthorized token ",
      });
      return;
    }
  } catch (e) {
    console.error("Error during Middleware: ", e);
    res.status(401).json({ msg: "Invalid token" });
    return;
  }
}
