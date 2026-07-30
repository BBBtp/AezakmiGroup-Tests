class CleanupRegistry {
  #entries = [];

  register(name, task) {
    if (!name.trim()) throw new Error('Cleanup task name must not be empty');
    const entry = { name: name.trim(), task, active: true };
    this.#entries.push(entry);

    return {
      name: entry.name,
      dismiss: () => {
        entry.active = false;
      },
      runNow: async () => {
        if (!entry.active) return;
        entry.active = false;
        try {
          await entry.task();
        } catch (error) {
          entry.active = true;
          throw error;
        }
      },
    };
  }

  get pendingCount() {
    return this.#entries.filter((entry) => entry.active).length;
  }

  async runAll() {
    const failures = [];
    for (const entry of [...this.#entries].reverse()) {
      if (!entry.active) continue;
      entry.active = false;
      try {
        await entry.task();
      } catch (error) {
        failures.push(new Error(`Cleanup "${entry.name}" failed`, { cause: error }));
      }
    }
    if (failures.length) {
      throw new AggregateError(failures, `${failures.length} cleanup task(s) failed`);
    }
  }
}

// CommonJS keeps this dependency executable from Node unit tests without a TypeScript loader.
// eslint-disable-next-line no-undef
exports.CleanupRegistry = CleanupRegistry;
