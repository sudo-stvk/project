import express from "express";
import helmet from "helmet";
import cookieParser from "cookie-parser";
import { router } from "./routes/api.js";
import { originGuard, errorHandler } from "./middleware/security.js";
export const app = express();
app.disable("x-powered-by");
app.use(helmet());
app.use(express.json({ limit: "1mb" }));
app.use(cookieParser());
app.use("/api", (req, res, next) => {
  if (
    ["POST", "PATCH", "PUT"].includes(req.method) &&
    (!req.body || typeof req.body !== "object" || Array.isArray(req.body))
  )
    return res
      .status(400)
      .json({
        success: false,
        message: "Send a JSON object as the request body",
      });
  next();
});
app.use("/api", originGuard, router);
app.use((req, res) =>
  res.status(404).json({ success: false, message: "Endpoint not found" }),
);
app.use(errorHandler);
