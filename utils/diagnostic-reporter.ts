import type { Reporter, TestCase, TestResult } from '@playwright/test/reporter';

export default class DiagnosticReporter implements Reporter {
    onTestBegin(test: TestCase): void {
        console.log(`[PW][TEST] start="${test.titlePath().join(' > ')}"`);
    }

    onTestEnd(test: TestCase, result: TestResult): void {
        const title = test.titlePath().join(' > ');
        console.log(`[PW][TEST] end="${title}" status="${result.status}" durationMs=${result.duration}`);

        if (result.status === 'failed' || result.status === 'timedOut') {
            for (const error of result.errors) {
                console.log(`[PW][TEST_FAIL] test="${title}" message="${error.message ?? 'unknown error'}"`);
            }
            if (result.attachments.length > 0) {
                console.log(`[PW][ARTIFACTS] test="${title}" files="${result.attachments.map(item => item.name).join(', ')}"`);
            }
        }
    }
}
