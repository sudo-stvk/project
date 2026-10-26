const stopwords = new Set(
  "a an the and or but in on at to of for from with is are was were be been being this that these those it its as by we you your our their they can could will would should have has had not into about how what when which who than then also use using".split(
    " ",
  ),
);
export const tokenize = (text) =>
  (text.toLowerCase().match(/[\p{L}\p{N}]+/gu) || []).filter(
    (t) => t.length > 2 && !stopwords.has(t),
  );
const tagsOf = (note) =>
  new Set((note.tags || []).map((t) => t.trim().toLowerCase()).filter(Boolean));
const intersect = (a, b) => [...a].filter((x) => b.has(x));
export function jaccard(a, b) {
  const union = new Set([...a, ...b]);
  return union.size ? intersect(a, b).length / union.size : 0;
}
export function recommend(input, notes, excluded = new Set()) {
  const corpus = notes.some((n) => String(n._id) === String(input._id))
    ? notes
    : [...notes, input];
  const documents = corpus.map((n) => tokenize(`${n.title} ${n.content}`));
  const df = new Map();
  for (const tokens of documents)
    for (const token of new Set(tokens))
      df.set(token, (df.get(token) || 0) + 1);
  function vector(tokens) {
    const v = new Map();
    for (const token of tokens) v.set(token, (v.get(token) || 0) + 1);
    for (const [token, count] of v)
      v.set(
        token,
        (count / tokens.length) *
          (Math.log((1 + corpus.length) / (1 + df.get(token))) + 1),
      );
    return v;
  }
  const vectors = documents.map(vector),
    inputIndex = corpus.findIndex((n) => String(n._id) === String(input._id)),
    base = vectors[inputIndex];
  const norm = (v) => Math.sqrt([...v.values()].reduce((s, x) => s + x * x, 0));
  const baseNorm = norm(base),
    tags = tagsOf(input),
    title = new Set(tokenize(input.title));
  return corpus
    .flatMap((note, i) => {
      if (i === inputIndex || note.isArchived || excluded.has(String(note._id)))
        return [];
      const other = vectors[i],
        denominator = baseNorm * norm(other);
      const cosine = denominator
        ? [...base].reduce(
            (sum, [term, weight]) => sum + weight * (other.get(term) || 0),
            0,
          ) / denominator
        : 0;
      const sharedTags = intersect(tags, tagsOf(note));
      const sharedTerms = intersect(
        new Set(documents[inputIndex]),
        new Set(documents[i]),
      ).slice(0, 6);
      const score = Math.max(
        0,
        Math.min(
          1,
          0.45 * jaccard(tags, tagsOf(note)) +
            0.35 * cosine +
            0.2 * jaccard(title, new Set(tokenize(note.title))),
        ),
      );
      if (score <= 0.015) return [];
      return [
        {
          noteId: String(note._id),
          title: note.title,
          color: note.color,
          score,
          sharedTags,
          sharedTerms,
          reasons: [
            sharedTags.length ? `Shared tags: ${sharedTags.join(", ")}` : "",
            sharedTerms.length
              ? `Matching terms: ${sharedTerms.join(", ")}`
              : "",
          ].filter(Boolean),
        },
      ];
    })
    .sort((a, b) => b.score - a.score || a.noteId.localeCompare(b.noteId))
    .slice(0, 8);
}
