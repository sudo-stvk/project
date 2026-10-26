import { HttpError } from "../utils/errors.js";
import { relationTypes } from "../models/index.js";
export function check(condition, message) {
  if (!condition) throw new HttpError(400, message);
}
export function id(value) {
  check(
    typeof value === "string" && /^[a-f\d]{24}$/i.test(value),
    "Invalid resource ID",
  );
  return value.toLowerCase();
}
export function string(value, name, max, min = 0) {
  check(
    typeof value === "string" &&
      value.trim().length >= min &&
      value.length <= max,
    `${name} must contain ${min}–${max} characters`,
  );
  return value.trim();
}
export function boolean(value, name) {
  check(typeof value === "boolean", `${name} must be true or false`);
  return value;
}
export function noteInput(body, create = false) {
  const out = {};
  if (create || body.title !== undefined)
    out.title = string(body.title, "Title", 200, 1);
  if (body.content !== undefined) {
    check(
      typeof body.content === "string" && body.content.length <= 100000,
      "Content must be text up to 100,000 characters",
    );
    out.content = body.content;
  }
  if (body.tags !== undefined) {
    check(
      Array.isArray(body.tags) && body.tags.length <= 20,
      "Use at most 20 tags",
    );
    out.tags = [
      ...new Set(body.tags.map((t) => string(t, "Tag", 40, 1).toLowerCase())),
    ];
  }
  if (body.color !== undefined) {
    check(
      typeof body.color === "string" && /^#[a-f\d]{6}$/i.test(body.color),
      "Use a six-digit hex color",
    );
    out.color = body.color;
  }
  for (const key of ["isPinned", "isArchived"])
    if (body[key] !== undefined) out[key] = boolean(body[key], key);
  return out;
}
export function linkInput(body, create = false) {
  const out = {};
  if (create) {
    out.sourceNote = id(body.sourceNote);
    out.targetNote = id(body.targetNote);
    check(out.sourceNote !== out.targetNote, "A note cannot connect to itself");
  }
  if (create || body.relationType !== undefined) {
    out.relationType = body.relationType || "relates_to";
    check(
      relationTypes.includes(out.relationType),
      "Invalid relationship type",
    );
  }
  if (body.label !== undefined) out.label = string(body.label, "Label", 100);
  return out;
}
export function pagination(query) {
  const page = Number(query.page ?? 1),
    limit = Number(query.limit ?? 24);
  check(Number.isInteger(page) && page > 0 && page <= 100000, "Invalid page");
  check(
    Number.isInteger(limit) && limit > 0 && limit <= 250,
    "Limit must be 1–250",
  );
  return { page, limit };
}
export function queryFilter(owner, query) {
  const filter = { owner };
  if (query.search)
    filter.$text = { $search: string(query.search, "Search", 300, 1) };
  if (query.tag) filter.tags = string(query.tag, "Tag", 40, 1).toLowerCase();
  for (const key of ["pinned", "archived"])
    if (query[key] !== undefined && query[key] !== "all") {
      check(["true", "false"].includes(query[key]), `Invalid ${key} filter`);
      filter[key === "pinned" ? "isPinned" : "isArchived"] =
        query[key] === "true";
    }
  return filter;
}
