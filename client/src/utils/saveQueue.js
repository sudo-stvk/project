// Serial writes prevent an older request from reaching MongoDB after a newer edit.
export function createSaveQueue(write, onStatus, onSaved) {
  let value,
    revision = 0,
    saved = 0,
    running = null;
  const queue = {
    get dirty() {
      return revision !== saved;
    },
    edit(next) {
      value = next;
      revision++;
      onStatus("Unsaved changes");
    },
    flush() {
      if (running) return running;
      running = (async () => {
        while (saved !== revision) {
          const currentRevision = revision,
            snapshot = value;
          onStatus("Saving…");
          try {
            await write(snapshot);
            saved = currentRevision;
            onSaved?.();
          } catch (error) {
            onStatus(`Save failed: ${error.message}`);
            throw error;
          }
        }
        onStatus("All changes saved");
      })().finally(() => {
        running = null;
      });
      return running;
    },
  };
  return queue;
}
