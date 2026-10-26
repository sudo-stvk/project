import { Note, Link, GraphLayout, Activity } from "../models/index.js";
import { noteInput, queryFilter, pagination, id } from "../validators/input.js";
import { requireFound } from "../utils/errors.js";
export const record = (owner, action, entityType, entityId) =>
  Activity.create({ owner, action, entityType, entityId });
export const findNote = async (owner, noteId) =>
  requireFound(
    await Note.findOne({ _id: id(noteId), owner }),
    "Note not found",
  );
export async function listNotes(owner, query) {
  const { page, limit } = pagination(query),
    filter = queryFilter(owner, query);
  const sorting =
    query.sort === "title"
      ? { title: 1, _id: 1 }
      : filter.$text && query.sort !== "recent"
        ? { score: { $meta: "textScore" }, _id: 1 }
        : { isPinned: -1, updatedAt: -1, _id: 1 };
  const [notes, total] = await Promise.all([
    Note.find(filter, filter.$text ? { score: { $meta: "textScore" } } : {})
      .sort(sorting)
      .skip((page - 1) * limit)
      .limit(limit)
      .lean(),
    Note.countDocuments(filter),
  ]);
  const ids = notes.map((n) => n._id),
    edges = await Link.find({
      owner,
      $or: [{ sourceNote: { $in: ids } }, { targetNote: { $in: ids } }],
    }).lean();
  const counts = new Map();
  for (const edge of edges)
    for (const key of ["sourceNote", "targetNote"])
      counts.set(String(edge[key]), (counts.get(String(edge[key])) || 0) + 1);
  return {
    notes: notes.map((n) => ({
      ...n,
      connectionCount: counts.get(String(n._id)) || 0,
    })),
    total,
    page,
    pages: Math.ceil(total / limit),
  };
}
export async function createNote(owner, body) {
  const note = await Note.create({ ...noteInput(body, true), owner });
  await record(owner, "Created a note", "note", note._id);
  return note;
}
export async function getNote(owner, noteId) {
  noteId = id(noteId);
  const note = await findNote(owner, noteId);
  const links = await Link.find({
    owner,
    $or: [{ sourceNote: note._id }, { targetNote: note._id }],
  }).lean();
  const related = await Note.find({
    owner,
    _id: { $in: links.flatMap((l) => [l.sourceNote, l.targetNote]) },
  })
    .select("title color tags")
    .lean();
  const map = new Map(related.map((n) => [String(n._id), n]));
  return {
    note,
    backlinks: links
      .filter((l) => String(l.targetNote) === noteId)
      .map((l) => ({ ...l, note: map.get(String(l.sourceNote)) })),
    outgoing: links
      .filter((l) => String(l.sourceNote) === noteId)
      .map((l) => ({ ...l, note: map.get(String(l.targetNote)) })),
  };
}
export async function updateNote(owner, noteId, body) {
  const note = await findNote(owner, noteId);
  Object.assign(note, noteInput(body));
  await note.save();
  await record(owner, "Edited a note", "note", note._id);
  return note;
}
export async function deleteNote(owner, noteId) {
  const note = await findNote(owner, noteId);
  await Link.deleteMany({
    owner,
    $or: [{ sourceNote: note._id }, { targetNote: note._id }],
  });
  await GraphLayout.updateOne(
    { owner },
    { $pull: { positions: { noteId: note._id } } },
  );
  await Note.deleteOne({ owner, _id: note._id });
  await record(owner, "Deleted a note", "note", note._id);
  return { deleted: true };
}
