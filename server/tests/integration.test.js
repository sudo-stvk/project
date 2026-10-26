import "dotenv/config";
import test from "node:test";
import assert from "node:assert/strict";
import mongoose from "mongoose";
import { randomBytes } from "node:crypto";
import { app } from "../src/app.js";
import { connectDatabase } from "../src/config/database.js";
import {
  User,
  Note,
  Link,
  GraphLayout,
  Activity,
} from "../src/models/index.js";
process.env.JWT_SECRET = randomBytes(48).toString("hex");
process.env.CLIENT_ORIGIN = "http://localhost:5173";
test(
  "real MongoDB end-to-end: auth, notes, graph, ownership, search, layouts, seed and export",
  { timeout: 60000 },
  async (t) => {
    // Use a separate database and clean only accounts created by this test.
    const uri =
      process.env.TEST_MONGODB_URI || "mongodb://127.0.0.1:27017/neuron_test";
    assert.ok(
      /\/neuron_test(?:\?|$)/.test(uri),
      "Integration tests require a neuron_test database",
    );
    await connectDatabase(uri);
    const server = app.listen(0, "127.0.0.1");
    await new Promise((resolve) => server.once("listening", resolve));
    const base = `http://127.0.0.1:${server.address().port}/api`,
      stamp = randomBytes(6).toString("hex"),
      owners = [];
    function session() {
      let cookie = "";
      return async (
        path,
        method = "GET",
        body,
        expected = 200,
        origin = "http://localhost:5173",
      ) => {
        const response = await fetch(base + path, {
          method,
          headers: {
            "Content-Type": "application/json",
            origin,
            ...(cookie ? { cookie } : {}),
          },
          body: body === undefined ? undefined : JSON.stringify(body),
        });
        const set = response.headers.get("set-cookie");
        if (set) cookie = set.split(";")[0];
        const result = await response.json();
        assert.equal(
          response.status,
          expected,
          `${method} ${path}: ${JSON.stringify(result)}`,
        );
        return result.data ?? result;
      };
    }
    const one = session(),
      two = session(),
      anonymous = session();
    try {
      await t.test(
        "register, persistent session, logout, login, and origin checks",
        async () => {
          const user = await one(
            "/auth/register",
            "POST",
            {
              name: "Test One",
              email: `one-${stamp}@example.com`,
              password: "safe-test-password-123",
            },
            201,
          );
          owners.push(user._id);
          assert.equal(user.passwordHash, undefined);
          assert.equal((await one("/auth/me")).email, user.email);
          await one("/auth/logout", "POST", {});
          await one("/notes", "GET", undefined, 401);
          await one("/auth/login", "POST", {
            email: user.email,
            password: "safe-test-password-123",
          });
          await one(
            "/notes",
            "POST",
            { title: "Blocked" },
            403,
            "https://evil.example",
          );
        },
      );
      let a, b, c, edge;
      await t.test(
        "CRUD persists edits in MongoDB, with safe missing-resource handling",
        async () => {
          a = await one(
            "/notes",
            "POST",
            {
              title: "Neural learning",
              content: "Neural networks learn patterns",
              tags: ["AI", "learning"],
            },
            201,
          );
          await one(`/notes/${a._id}`, "PATCH", {
            title: "Neural learning revised",
            content: "Neural learning uses repeated patterns",
            color: "#22D3EE",
          });
          assert.equal(
            (await Note.findById(a._id)).title,
            "Neural learning revised",
          );
          assert.equal((await one(`/notes/${a._id}`)).note.color, "#22D3EE");
          await one("/notes/not-valid", "GET", undefined, 400);
          await one("/notes/000000000000000000000000", "GET", undefined, 404);
          b = await one(
            "/notes",
            "POST",
            {
              title: "Learning patterns",
              content: "Neural learning uses repeated patterns",
              tags: ["ai", "learning"],
            },
            201,
          );
          c = await one(
            "/notes",
            "POST",
            {
              title: "Learning neural systems",
              content: "Neural learning uses patterns",
              tags: ["ai"],
            },
            201,
          );
        },
      );
      await t.test(
        "relationships, unique constraint, backlinks, recommendations and BFS",
        async () => {
          edge = await one(
            "/links",
            "POST",
            { sourceNote: a._id, targetNote: b._id, relationType: "supports" },
            201,
          );
          await one(
            "/links",
            "POST",
            { sourceNote: a._id, targetNote: b._id, relationType: "supports" },
            409,
          );
          await one(
            "/links",
            "POST",
            { sourceNote: a._id, targetNote: a._id },
            400,
          );
          assert.equal(
            (await one(`/notes/${b._id}`)).backlinks[0].sourceNote,
            a._id,
          );
          assert.equal((await one("/graph")).links[0].id, edge._id);
          assert.deepEqual(
            (await one(`/graph/path?from=${b._id}&to=${a._id}`)).path,
            [b._id, a._id],
          );
          assert.deepEqual(
            (await one(`/graph/path?from=${a._id}&to=${c._id}`)).path,
            [],
          );
          const rec = await one(`/recommendations/${a._id}`);
          assert.ok(rec.suggestions.some((s) => s.noteId === c._id));
          assert.ok(!rec.suggestions.some((s) => s.noteId === b._id));
          await one(`/links/${edge._id}`, "PATCH", {
            relationType: "extends",
            label: "Test relationship",
          });
        },
      );
      await t.test(
        "full-text search, filters, analytics, profile and export use real data",
        async () => {
          assert.ok(
            (await one("/search?q=neural")).notes.some((n) => n._id === a._id),
          );
          assert.equal((await one("/notes?tag=ai&limit=2")).notes.length, 2);
          const stats = await one("/analytics/overview");
          assert.equal(stats.totalNotes, 3);
          assert.equal(stats.totalEdges, 1);
          assert.equal(stats.orphanedNotes, 1);
          const updated = await one("/auth/me", "PATCH", {
            name: "New name",
            settings: { nodeLabels: false },
          });
          assert.equal(updated.settings.nodeLabels, false);
          const data = await one("/export");
          assert.equal(data.notes.length, 3);
          assert.equal(data.links.length, 1);
        },
      );
      await t.test(
        "a second account cannot read or mutate any first-account resources",
        async () => {
          const user = await two(
            "/auth/register",
            "POST",
            {
              name: "Test Two",
              email: `two-${stamp}@example.com`,
              password: "safe-test-password-123",
            },
            201,
          );
          owners.push(user._id);
          await two(`/notes/${a._id}`, "GET", undefined, 404);
          await two(`/notes/${a._id}`, "PATCH", { title: "Hijack" }, 404);
          await two(`/notes/${a._id}`, "DELETE", undefined, 404);
          await two(`/links/${edge._id}`, "PATCH", { label: "Hijack" }, 404);
          await two(`/links/${edge._id}`, "DELETE", undefined, 404);
          await two(
            "/links",
            "POST",
            { sourceNote: a._id, targetNote: b._id },
            404,
          );
          await two(`/recommendations/${a._id}`, "GET", undefined, 404);
          await two(
            `/graph/path?from=${a._id}&to=${b._id}`,
            "GET",
            undefined,
            404,
          );
          assert.equal((await two("/search?q=neural")).total, 0);
          assert.equal((await two("/graph")).nodes.length, 0);
          await two(
            "/graph/layout",
            "PUT",
            { positions: [{ noteId: a._id, x: 1, y: 2, pinned: true }] },
            400,
          );
          await anonymous("/notes", "GET", undefined, 401);
        },
      );
      await t.test(
        "layout merge, viewport persistence and note deletion cleanup",
        async () => {
          await one("/graph/layout", "PUT", {
            positions: [{ noteId: a._id, x: 125, y: 250, pinned: true }],
            viewport: { x: 5, y: 6, zoom: 1.3 },
          });
          await one("/graph/layout", "PUT", {
            positions: [{ noteId: b._id, x: 300, y: 400, pinned: false }],
          });
          const layout = await one("/graph/layout");
          assert.equal(layout.positions.length, 2);
          assert.equal(layout.viewport.zoom, 1.3);
          await one(`/notes/${a._id}`, "DELETE");
          assert.equal(await Link.countDocuments({ owner: owners[0] }), 0);
          assert.equal((await one("/graph/layout")).positions.length, 1);
          assert.equal((await one(`/notes/${b._id}`)).backlinks.length, 0);
          await one(`/notes/${a._id}`, "GET", undefined, 404);
        },
      );
      await t.test(
        "optional demo seeding is idempotent and account-scoped",
        async () => {
          await one("/demo/seed", "POST", {});
          await one("/demo/seed", "POST", {});
          assert.equal(
            await Note.countDocuments({ owner: owners[0], isDemo: true }),
            20,
          );
          assert.equal(await Link.countDocuments({ owner: owners[0] }), 27);
          assert.equal((await two("/notes")).total, 0);
          assert.ok((await one("/analytics/overview")).orphanedNotes >= 1);
          await one("/auth/logout", "POST", {});
          await one("/graph", "GET", undefined, 401);
        },
      );
    } finally {
      for (const Model of [Link, Note, GraphLayout, Activity])
        await Model.deleteMany({ owner: { $in: owners } });
      await User.deleteMany({ _id: { $in: owners } });
      await new Promise((resolve) => server.close(resolve));
      await mongoose.disconnect();
    }
  },
);
