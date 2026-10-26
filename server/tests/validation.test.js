import test from "node:test";
import assert from "node:assert/strict";
import {
  noteInput,
  linkInput,
  id,
  pagination,
  queryFilter,
} from "../src/validators/input.js";
import { requireFound } from "../src/utils/errors.js";
const a = "0123456789abcdef01234567",
  b = "1123456789abcdef01234567";
test("validates boundary types, excludes owner injection, and normalizes tags", () => {
  assert.deepEqual(
    noteInput({ title: " Thought ", owner: b, tags: ["AI", "ai"] }, true),
    { title: "Thought", tags: ["ai"] },
  );
  for (const body of [
    { title: "" },
    { color: "red" },
    { tags: "ai" },
    { isPinned: "false" },
    { content: {} },
  ])
    assert.throws(() => noteInput(body), { status: 400 });
  assert.throws(() => id("bad"), { status: 400 });
  assert.throws(() => pagination({ limit: 251 }), { status: 400 });
  assert.throws(() => queryFilter(a, { search: { $gt: "" } }), { status: 400 });
});
test("relationship validation prevents self links and unknown types", () => {
  assert.throws(
    () => linkInput({ sourceNote: a, targetNote: a.toUpperCase() }, true),
    /cannot connect/,
  );
  assert.throws(
    () => linkInput({ sourceNote: a, targetNote: a }, true),
    /cannot connect/,
  );
  assert.throws(
    () =>
      linkInput(
        { sourceNote: a, targetNote: b, relationType: "unknown" },
        true,
      ),
    { status: 400 },
  );
  assert.equal(
    linkInput({ sourceNote: a, targetNote: b }, true).relationType,
    "relates_to",
  );
});
test("missing resources produce helpful 404 errors", () => {
  assert.throws(() => requireFound(null, "Note not found"), {
    status: 404,
    message: "Note not found",
  });
});
