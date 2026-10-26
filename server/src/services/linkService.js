import { Link } from "../models/index.js";
import { linkInput, id } from "../validators/input.js";
import { findNote, record } from "./noteService.js";
import { requireFound } from "../utils/errors.js";
export async function createLink(owner, body) {
  const data = linkInput(body, true);
  await Promise.all([
    findNote(owner, data.sourceNote),
    findNote(owner, data.targetNote),
  ]);
  const link = await Link.create({ ...data, owner });
  await record(owner, "Connected two ideas", "link", link._id);
  return link;
}
export async function updateLink(owner, linkId, body) {
  const link = requireFound(
    await Link.findOneAndUpdate(
      { owner, _id: id(linkId) },
      { $set: linkInput(body) },
      { returnDocument: "after", runValidators: true },
    ),
    "Connection not found",
  );
  return link;
}
export async function deleteLink(owner, linkId) {
  const link = requireFound(
    await Link.findOneAndDelete({ owner, _id: id(linkId) }),
    "Connection not found",
  );
  await record(owner, "Removed a connection", "link", link._id);
  return { deleted: true };
}
