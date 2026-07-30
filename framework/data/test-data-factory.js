class TestDataFactory {
  #sequence = 0;

  uniqueLabel(prefix) {
    this.#sequence += 1;
    const normalizedPrefix = prefix.trim().replace(/\s+/g, '-');
    if (!normalizedPrefix) throw new Error('Test data prefix must not be empty');
    return `${normalizedPrefix}-${Date.now()}-${this.#sequence}`;
  }

  firstAvailableNumber(occupied, range) {
    const used = new Set([...occupied].map(Number));
    for (let value = range.min; value <= range.max; value += 1) {
      if (!used.has(value)) return value;
    }
    throw new Error(`No available number in range ${range.min}..${range.max}`);
  }
}

// CommonJS keeps the factory directly unit-testable without a TypeScript loader.
// eslint-disable-next-line no-undef
exports.TestDataFactory = TestDataFactory;
