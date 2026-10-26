import { Router } from "express";
import { rateLimit } from "express-rate-limit";
import { authenticate } from "../middleware/security.js";
import * as c from "../controllers/apiController.js";
export const router = Router();
const authLimit = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 30,
  standardHeaders: "draft-8",
  legacyHeaders: false,
  message: {
    success: false,
    message: "Too many attempts. Try again in 15 minutes.",
  },
});
router.post("/auth/register", authLimit, c.register);
router.post("/auth/login", authLimit, c.login);
router.post("/auth/logout", c.logout);
router.use(authenticate);
router.get("/auth/me", c.me);
router.patch("/auth/me", c.profile);
router.get("/notes", c.listNotes);
router.post("/notes", c.createNote);
router.get("/notes/:id", c.getNote);
router.patch("/notes/:id", c.updateNote);
router.delete("/notes/:id", c.deleteNote);
router.get("/search", c.search);
router.get("/graph", c.getGraph);
router.get("/graph/layout", c.getLayout);
router.put("/graph/layout", c.saveLayout);
router.get("/graph/path", c.path);
router.post("/links", c.createLink);
router.patch("/links/:id", c.updateLink);
router.delete("/links/:id", c.deleteLink);
router.get("/recommendations/:noteId", c.recommendations);
router.get("/analytics/overview", c.overview);
router.get("/activities", c.activities);
router.get("/export", c.exportData);
router.post(
  "/demo/seed",
  rateLimit({
    windowMs: 60000,
    limit: 5,
    message: {
      success: false,
      message: "Please wait a minute before seeding again.",
    },
  }),
  c.seed,
);
