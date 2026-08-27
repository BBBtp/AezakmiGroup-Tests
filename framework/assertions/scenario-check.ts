import { expect, test } from '@playwright/test';

class ScenarioCheck {
  equal<T>(description: string, actual: T, expected: T): Promise<void> {
    return this.step(description, () => expect(actual).toBe(expected));
  }

  deepEqual(description: string, actual: unknown, expected: unknown): Promise<void> {
    return this.step(description, () => expect(actual).toEqual(expected));
  }

  matchObject(description: string, actual: unknown, expected: Record<string, unknown>): Promise<void> {
    return this.step(description, () => expect(actual).toMatchObject(expected));
  }

  contains(description: string, actual: string, expected: string): Promise<void> {
    return this.step(description, () => expect(actual).toContain(expected));
  }

  matches(description: string, actual: string, expected: string | RegExp): Promise<void> {
    return this.step(description, () => expect(actual).toMatch(expected));
  }

  defined(description: string, actual: unknown): Promise<void> {
    return this.step(description, () => expect(actual).toBeDefined());
  }

  async requireDefined<T>(description: string, actual: T): Promise<NonNullable<T>> {
    await this.defined(description, actual);
    return actual as NonNullable<T>;
  }

  greaterThan(description: string, actual: number, minimum: number): Promise<void> {
    return this.step(description, () => expect(actual).toBeGreaterThan(minimum));
  }

  isTrue(description: string, actual: boolean): Promise<void> {
    return this.step(description, () => expect(actual).toBe(true));
  }

  isNull(description: string, actual: unknown): Promise<void> {
    return this.step(description, () => expect(actual).toBeNull());
  }

  hasProperty(description: string, actual: object, property: string): Promise<void> {
    return this.step(description, () => expect(actual).toHaveProperty(property));
  }

  length(description: string, actual: { length: number }, expected: number): Promise<void> {
    return this.step(description, () => expect(actual).toHaveLength(expected));
  }

  eventuallyEqual<T>(description: string, probe: () => T | Promise<T>, expected: T): Promise<void> {
    return this.step(description, () => expect.poll(probe).toBe(expected));
  }

  eventuallyNotEqual<T>(description: string, probe: () => T | Promise<T>, previous: T): Promise<void> {
    return this.step(description, () => expect.poll(probe).not.toBe(previous));
  }

  private async step(description: string, assertion: () => void | Promise<void>): Promise<void> {
    await test.step(`ПРОВЕРКА · ${description}`, assertion);
  }
}

export const scenarioCheck = new ScenarioCheck();
