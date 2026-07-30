export type NumberRange = {
  min: number;
  max: number;
};

export class TestDataFactory {
  uniqueLabel(prefix: string): string;
  firstAvailableNumber(occupied: Iterable<string | number>, range: NumberRange): number;
}
