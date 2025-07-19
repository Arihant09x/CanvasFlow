import express from "express";
import cors from "cors";
import router from "./route/routers.js";
const app = express();
app.use(express.json());
app.use(cors());
app.use("/api/v1", router);
const connect = () => {
  app.listen(5000);
  console.log("server is running on port: 5000");
};
connect();
