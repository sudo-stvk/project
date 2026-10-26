import test from "node:test";
import assert from "node:assert/strict";
import { shortestPath } from "../src/algorithms/pathfinder.js";
import { recommend, jaccard, tokenize } from "../src/algorithms/similarity.js";
import { createSaveQueue } from "../../client/src/utils/saveQueue.js";
import { mergeLayout } from "../../client/src/utils/layout.js";
test("partial graph views preserve pending arrangements and newest positions", () => {
  const old = {
    positions: [
      { noteId: "a", x: 1, y: 2, pinned: false },
      { noteId: "b", x: 3, y: 4, pinned: false },
    ],
    viewport: { x: 0, y: 0, zoom: 1 },
  };
  const merged = mergeLayout(old, {
    positions: [{ noteId: "a", x: 20, y: 30, pinned: true }],
    viewport: { x: 4, y: 5, zoom: 2 },
  });
  assert.equal(merged.positions.length, 2);
  assert.equal(merged.positions.find((p) => p.noteId === "a").x, 20);
  assert.equal(merged.positions.find((p) => p.noteId === "b").x, 3);
  assert.equal(merged.viewport.zoom, 2);
});
const links = [
  { source: "a", target: "b" },
  { source: "b", target: "c" },
  { source: "c", target: "a" },
  { source: "c", target: "d" },
];
test("BFS finds direct and shortest paths through cycles in either direction", () => {
  assert.deepEqual(shortestPath(["a", "b", "c", "d"], links, "a", "b"), [
    "a",
    "b",
  ]);
  assert.deepEqual(shortestPath(["a", "b", "c", "d"], links, "a", "d"), [
    "a",
    "c",
    "d",
  ]);
  assert.deepEqual(shortestPath(["a", "b", "c", "d"], links, "d", "a"), [
    "d",
    "c",
    "a",
  ]);
});
test("BFS handles disconnected, unknown, and identical nodes", () => {
  assert.deepEqual(
    shortestPath(["a", "b", "c", "d", "e"], links, "a", "e"),
    [],
  );
  assert.equal(shortestPath(["a"], [], "a", "missing"), null);
  assert.deepEqual(shortestPath(["a"], [], "a", "a"), ["a"]);
});
const notes = [
  {
    _id: "a",
    title: "Neural learning",
    content: "Machine learning uses neural networks to learn patterns",
    tags: ["AI", "learning"],
  },
  {
    _id: "b",
    title: "Neural learning",
    content: "Machine learning uses neural networks to learn patterns",
    tags: ["ai", "learning", "ai"],
  },
  {
    _id: "c",
    title: "Garden design",
    content: "Wild flowers and pollinators",
    tags: ["nature"],
  },
  {
    _id: "d",
    title: "Learning methods",
    content: "Practice helps learn patterns",
    tags: ["learning"],
  },
];
test("similarity stays bounded, sorts useful matches, normalizes tags, and excludes connections", () => {
  const result = recommend(notes[0], notes);
  assert.equal(result[0].noteId, "b");
  assert.ok(Math.abs(result[0].score - 1) < 1e-10);
  for (const r of result) assert.ok(r.score >= 0 && r.score <= 1);
  assert.deepEqual(
    result.map((n) => n.noteId),
    ["b", "d"],
  );
  assert.deepEqual(
    recommend(notes[0], notes, new Set(["b"])).map((n) => n.noteId),
    ["d"],
  );
  assert.ok(result[0].reasons.some((r) => r.includes("ai")));
});
test("empty token sets and archived notes are handled explicitly", () => {
  assert.equal(jaccard(new Set(), new Set()), 0);
  assert.deepEqual(tokenize("the an and !!"), []);
  assert.deepEqual(
    recommend({ _id: "x", title: "", content: "", tags: [] }, [
      { _id: "y", title: "", content: "", tags: [] },
    ]),
    [],
  );
  assert.ok(
    !recommend(
      notes[0],
      notes.map((n) => ({ ...n, isArchived: n._id === "b" })),
    ).some((n) => n.noteId === "b"),
  );
});
test("autosave serializes edits arriving during a request and retains failures for retry", async () => {
  const writes = [],
    resolvers = [],
    statuses = [];
  const queue = createSaveQueue(
    (value) =>
      new Promise((resolve) => {
        writes.push(value);
        resolvers.push(resolve);
      }),
    (text) => statuses.push(text),
  );
  queue.edit("old");
  const flush = queue.flush();
  queue.edit("new");
  assert.equal(queue.flush(), flush);
  assert.deepEqual(writes, ["old"]);
  resolvers.shift()();
  await new Promise((resolve) => setImmediate(resolve));
  assert.deepEqual(writes, ["old", "new"]);
  assert.equal(queue.dirty, true);
  resolvers.shift()();
  await flush;
  assert.equal(queue.dirty, false);
  assert.equal(statuses.at(-1), "All changes saved");
  let fail = true;
  const retry = createSaveQueue(
    async () => {
      if (fail) throw new Error("offline");
    },
    () => {},
  );
  retry.edit("keep me");
  await assert.rejects(retry.flush(), /offline/);
  assert.equal(retry.dirty, true);
  fail = false;
  await retry.flush();
  assert.equal(retry.dirty, false);
});
