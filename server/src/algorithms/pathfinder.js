export function shortestPath(nodeIds, links, from, to) {
  const adjacency = new Map(nodeIds.map((id) => [String(id), []]));
  if (!adjacency.has(from) || !adjacency.has(to)) return null;
  for (const link of links) {
    const a = String(link.source ?? link.sourceNote),
      b = String(link.target ?? link.targetNote);
    if (adjacency.has(a) && adjacency.has(b)) {
      adjacency.get(a).push(b);
      adjacency.get(b).push(a);
    }
  }
  const queue = [from],
    previous = new Map([[from, null]]);
  for (let i = 0; i < queue.length; i++) {
    const node = queue[i];
    if (node === to) {
      const path = [];
      for (let at = to; at !== null; at = previous.get(at)) path.push(at);
      return path.reverse();
    }
    for (const next of adjacency.get(node))
      if (!previous.has(next)) {
        previous.set(next, node);
        queue.push(next);
      }
  }
  return [];
}
