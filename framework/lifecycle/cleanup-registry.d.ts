export type CleanupTask = () => Promise<void> | void;

export type CleanupHandle = {
  readonly name: string;
  dismiss(): void;
  runNow(): Promise<void>;
};

export class CleanupRegistry {
  register(name: string, task: CleanupTask): CleanupHandle;
  get pendingCount(): number;
  runAll(): Promise<void>;
}
