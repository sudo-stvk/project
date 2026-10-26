import { Note, Link, GraphLayout } from "../models/index.js";
import { check, id, queryFilter } from "../validators/input.js";
import { findNote } from "./noteService.js";
import { shortestPath } from "../algorithms/pathfinder.js";
import { recommend } from "../algorithms/similarity.js";
export async function graph(owner, query) {
  const filter = queryFilter(owner, { archived: "false", ...query });
  const [notes, total] = await Promise.all([
    Note.find(filter)
      .select("title tags color isArchived")
      .sort({ isPinned: -1, updatedAt: -1 })
      .limit(250)
      .lean(),
    Note.countDocuments(filter),
  ]);
  const ids = notes.map((n) => n._id);
  const links = await Link.find({
    owner,
    sourceNote: { $in: ids },
    targetNote: { $in: ids },
  }).lean();
  const degrees = new Map();
  for (const l of links)
    for (const k of ["sourceNote", "targetNote"])
      degrees.set(String(l[k]), (degrees.get(String(l[k])) || 0) + 1);
  return {
    nodes: notes.map((n) => ({
      ...n,
      id: String(n._id),
      degree: degrees.get(String(n._id)) || 0,
    })),
    links: links.map((l) => ({
      id: String(l._id),
      source: String(l.sourceNote),
      target: String(l.targetNote),
      relationType: l.relationType,
      label: l.label,
    })),
    total,
    truncated: total > 250,
  };
}
export async function getLayout(owner) {
  return (
    (await GraphLayout.findOne({ owner }).lean()) || {
      positions: [],
      viewport: { x: 0, y: 0, zoom: 1 },
    }
  );
}
export async function saveLayout(owner, body) {
  check(body && typeof body === "object", "Invalid layout");
  const update = {};
  if (body.reset === true) update.positions = [];
  else if (body.positions !== undefined) {
    check(
      Array.isArray(body.positions) && body.positions.length <= 250,
      "Save at most 250 positions at once",
    );
    const positions = body.positions.map((p) => {
      check(p && typeof p === "object", "Invalid node position");
      id(p.noteId);
      check(
        Number.isFinite(p.x) &&
          Number.isFinite(p.y) &&
          Math.abs(p.x) <= 1e6 &&
          Math.abs(p.y) <= 1e6 &&
          typeof p.pinned === "boolean",
        "Invalid node position",
      );
      return { noteId: p.noteId, x: p.x, y: p.y, pinned: p.pinned };
    });
    const count = await Note.countDocuments({
      owner,
      _id: { $in: positions.map((p) => p.noteId) },
    });
    check(
      count === new Set(positions.map((p) => p.noteId)).size,
      "Layout contains unknown notes",
    );
    const current = await getLayout(owner),
      map = new Map(current.positions.map((p) => [String(p.noteId), p]));
    for (const p of positions) map.set(p.noteId, p);
    update.positions = [...map.values()];
  }
  if (body.viewport !== undefined) {
    check(
      body.viewport && typeof body.viewport === "object",
      "Invalid viewport",
    );
    const { x, y, zoom } = body.viewport;
    check(
      [x, y, zoom].every(Number.isFinite) &&
        Math.abs(x) < 1e6 &&
        Math.abs(y) < 1e6 &&
        zoom >= 0.1 &&
        zoom <= 4,
      "Invalid viewport",
    );
    update.viewport = { x, y, zoom };
  }
  return GraphLayout.findOneAndUpdate(
    { owner },
    { $set: update, $setOnInsert: { owner } },
    { upsert: true, returnDocument: "after", runValidators: true },
  );
}
export async function path(owner, from, to) {
  // shortcut: account graphs are loaded in memory; batch traversal for very large workspaces.
  from = id(from);
  to = id(to);
  await Promise.all([findNote(owner, from), findNote(owner, to)]);
  const [notes, links] = await Promise.all([
    Note.find({ owner }).select("_id").lean(),
    Link.find({ owner }).select("sourceNote targetNote").lean(),
  ]);
  return {
    path: shortestPath(
      notes.map((n) => n._id),
      links,
      from,
      to,
    ),
  };
}
export async function recommendations(owner, noteId) {
  // shortcut: rebuild TF-IDF per request; cache the corpus when account size makes this slow.
  const note = await findNote(owner, noteId);
  const [notes, links] = await Promise.all([
    Note.find({ owner, isArchived: false })
      .select("title content tags color isArchived")
      .lean(),
    Link.find({
      owner,
      $or: [{ sourceNote: note._id }, { targetNote: note._id }],
    }).lean(),
  ]);
  const excluded = new Set(
    links.flatMap((l) => [String(l.sourceNote), String(l.targetNote)]),
  );
  return { noteId, suggestions: recommend(note, notes, excluded) };
}
