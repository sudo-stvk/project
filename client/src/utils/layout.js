export function mergeLayout(previous, next) {
  const positions = new Map(
    (previous?.positions || []).map((p) => [p.noteId, p]),
  );
  for (const position of next.positions || [])
    positions.set(position.noteId, position);
  return {
    positions: [...positions.values()],
    viewport: next.viewport || previous?.viewport || { x: 0, y: 0, zoom: 1 },
  };
}
