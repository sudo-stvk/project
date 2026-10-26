import * as auth from "../services/authService.js";
import * as notes from "../services/noteService.js";
import * as links from "../services/linkService.js";
import * as graph from "../services/graphService.js";
import * as analytics from "../services/analyticsService.js";
import { seedDemo } from "../seeds/demo.js";
const ok = (res, data, status = 200) =>
  res.status(status).json({ success: true, data });
export const register = async (req, res) => {
  const user = await auth.register(req.body);
  auth.setSession(res, user);
  ok(res, auth.publicUser(user), 201);
};
export const login = async (req, res) => {
  const user = await auth.login(req.body);
  auth.setSession(res, user);
  ok(res, auth.publicUser(user));
};
export const logout = (req, res) => {
  res.clearCookie("neuron_session", {
    ...auth.cookieOptions(),
    maxAge: undefined,
  });
  ok(res, { loggedOut: true });
};
export const me = (req, res) => ok(res, auth.publicUser(req.user));
export const profile = async (req, res) =>
  ok(res, await auth.updateProfile(req.user, req.body));
export const listNotes = async (req, res) =>
  ok(res, await notes.listNotes(req.user._id, req.query));
export const search = async (req, res) =>
  ok(
    res,
    await notes.listNotes(req.user._id, {
      ...req.query,
      search: req.query.q,
      archived: "false",
    }),
  );
export const createNote = async (req, res) =>
  ok(res, await notes.createNote(req.user._id, req.body), 201);
export const getNote = async (req, res) =>
  ok(res, await notes.getNote(req.user._id, req.params.id));
export const updateNote = async (req, res) =>
  ok(res, await notes.updateNote(req.user._id, req.params.id, req.body));
export const deleteNote = async (req, res) =>
  ok(res, await notes.deleteNote(req.user._id, req.params.id));
export const createLink = async (req, res) =>
  ok(res, await links.createLink(req.user._id, req.body), 201);
export const updateLink = async (req, res) =>
  ok(res, await links.updateLink(req.user._id, req.params.id, req.body));
export const deleteLink = async (req, res) =>
  ok(res, await links.deleteLink(req.user._id, req.params.id));
export const getGraph = async (req, res) =>
  ok(res, await graph.graph(req.user._id, req.query));
export const getLayout = async (req, res) =>
  ok(res, await graph.getLayout(req.user._id));
export const saveLayout = async (req, res) =>
  ok(res, await graph.saveLayout(req.user._id, req.body));
export const path = async (req, res) =>
  ok(res, await graph.path(req.user._id, req.query.from, req.query.to));
export const recommendations = async (req, res) =>
  ok(res, await graph.recommendations(req.user._id, req.params.noteId));
export const overview = async (req, res) =>
  ok(res, await analytics.overview(req.user._id));
export const activities = async (req, res) =>
  ok(res, await analytics.activities(req.user._id));
export const exportData = async (req, res) =>
  ok(res, await analytics.exportData(req.user._id));
export const seed = async (req, res) => ok(res, await seedDemo(req.user._id));
