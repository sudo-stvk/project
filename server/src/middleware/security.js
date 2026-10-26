import jwt from "jsonwebtoken";
import { User } from "../models/index.js";
import { HttpError } from "../utils/errors.js";
export async function authenticate(req, res, next) {
  try {
    const token = jwt.verify(
      req.cookies.neuron_session || "",
      process.env.JWT_SECRET,
      { algorithms: ["HS256"] },
    );
    req.user = await User.findById(token.sub);
    if (!req.user) throw new Error("Missing user");
    next();
  } catch {
    next(new HttpError(401, "Please sign in to continue"));
  }
}
export function originGuard(req, res, next) {
  if (["GET", "HEAD", "OPTIONS"].includes(req.method)) return next();
  const allowed = (
    process.env.CLIENT_ORIGIN || "http://localhost:5173,http://127.0.0.1:5173"
  )
    .split(",")
    .map((s) => s.trim());
  if (!req.get("origin") || !allowed.includes(req.get("origin")))
    return next(new HttpError(403, "Request origin is not allowed"));
  next();
}
export function errorHandler(error, req, res, next) {
  if (res.headersSent) return next(error);
  let status = error.status || 500,
    message = error.message;
  if (error.code === 11000) {
    status = 409;
    message = "This email or relationship already exists";
  }
  if (error.name === "ValidationError" || error.name === "CastError") {
    status = 400;
    message = "Invalid input";
  }
  if (status >= 500) {
    console.error(error);
    message = "The server could not complete this request. Please retry.";
  }
  res.status(status).json({ success: false, message });
}
