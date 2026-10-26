import { Note, Link, Activity, GraphLayout } from "../models/index.js";
export async function overview(owner) {
  const [notes, links, topTags, activityOverTime] = await Promise.all([
    Note.find({ owner })
      .select("title tags color updatedAt isArchived")
      .sort({ updatedAt: -1 })
      .lean(),
    Link.find({ owner }).select("sourceNote targetNote").lean(),
    Note.aggregate([
      { $match: { owner } },
      { $unwind: "$tags" },
      { $group: { _id: "$tags", count: { $sum: 1 } } },
      { $sort: { count: -1, _id: 1 } },
      { $limit: 12 },
    ]),
    Activity.aggregate([
      {
        $match: {
          owner,
          createdAt: { $gte: new Date(Date.now() - 30 * 86400000) },
        },
      },
      {
        $group: {
          _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
          count: { $sum: 1 },
        },
      },
      { $sort: { _id: 1 } },
    ]),
  ]);
  const degree = new Map();
  for (const l of links)
    for (const k of ["sourceNote", "targetNote"])
      degree.set(String(l[k]), (degree.get(String(l[k])) || 0) + 1);
  const connectedNotes = notes.filter((n) => degree.has(String(n._id))).length;
  return {
    totalNotes: notes.length,
    totalEdges: links.length,
    connectedNotes,
    orphanedNotes: notes.length - connectedNotes,
    topTags,
    mostConnected: notes
      .map((n) => ({ ...n, degree: degree.get(String(n._id)) || 0 }))
      .sort((a, b) => b.degree - a.degree)
      .slice(0, 6),
    unconnected: notes.filter((n) => !degree.has(String(n._id))).slice(0, 8),
    recentNotes: notes.slice(0, 5),
    activityOverTime,
  };
}
export async function activities(owner) {
  return Activity.find({ owner }).sort({ createdAt: -1 }).limit(30).lean();
}
export async function exportData(owner) {
  const [notes, links, layout] = await Promise.all([
    Note.find({ owner }).lean(),
    Link.find({ owner }).lean(),
    GraphLayout.findOne({ owner }).lean(),
  ]);
  return {
    version: 1,
    exportedAt: new Date().toISOString(),
    notes,
    links,
    layout,
  };
}
