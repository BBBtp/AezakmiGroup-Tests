import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import path from 'node:path';
import { z } from 'zod';
import { DoqaApiError, DoqaClient } from './doqa-client.mjs';

const server = new McpServer({ name: 'crm-doqa', version: '0.6.0' });
const outputSchema = { result: z.unknown() };
const checklistItemSchema = z.lazy(() =>
  z.object({
    id: z.number().int().positive().nullable().optional(),
    title: z.string().min(1),
    children: z.array(checklistItemSchema).default([]),
  }),
);

function getClient() {
  return new DoqaClient();
}

function result(value) {
  return {
    structuredContent: { result: value },
    content: [{ type: 'text', text: JSON.stringify(value, null, 2) }],
  };
}

function failure(error) {
  const details =
    error instanceof DoqaApiError
      ? { status: error.status, details: error.details }
      : { message: error.message };
  return { isError: true, content: [{ type: 'text', text: JSON.stringify(details, null, 2) }] };
}

server.registerTool(
  'doqa_find_candidates',
  {
    title: 'Find DoQA automation candidates',
    description: 'Find ready DoQA test cases marked as planned for automation and not yet automated.',
    inputSchema: {
      limit: z.number().int().min(1).max(20).default(6),
      search: z.string().optional(),
      automationStatuses: z.array(z.enum(['manual', 'planned', 'automated'])).default(['planned']),
    },
    outputSchema,
    annotations: { readOnlyHint: true, destructiveHint: false, idempotentHint: true, openWorldHint: true },
  },
  async ({ limit, search, automationStatuses }) => {
    try {
      return result(await getClient().listAutomationCandidates({ limit, search, automationStatuses }));
    } catch (error) {
      return failure(error);
    }
  },
);

server.registerTool(
  'doqa_get_case',
  {
    title: 'Get DoQA case',
    description: 'Get a complete DoQA test case and its ETag.',
    inputSchema: { caseId: z.number().int().positive() },
    outputSchema,
    annotations: { readOnlyHint: true, destructiveHint: false, idempotentHint: true, openWorldHint: true },
  },
  async ({ caseId }) => {
    try {
      return result(await getClient().getCase(caseId));
    } catch (error) {
      return failure(error);
    }
  },
);

server.registerTool(
  'doqa_create_case',
  {
    title: 'Create DoQA test case',
    description:
      'Create a fully described test case in DoQA. New cases are planned for automation by default.',
    inputSchema: {
      folderId: z.number().int().positive(),
      title: z.string().min(1),
      description: z.string().default(''),
      preconditions: z.string().default(''),
      expectedResult: z.string().default(''),
      steps: z
        .array(
          z.object({
            step: z.string().min(1),
            result: z.string().min(1),
            testData: z.string().nullable().optional(),
          }),
        )
        .default([]),
      priority: z.enum(['high', 'medium', 'low']).default('medium'),
      status: z.enum(['ready', 'review']).default('ready'),
      automationStatus: z.enum(['manual', 'planned', 'automated']).default('planned'),
      tagIds: z.array(z.number().int().positive()).default([]),
    },
    outputSchema,
    annotations: { readOnlyHint: false, destructiveHint: false, idempotentHint: false, openWorldHint: true },
  },
  async (input) => {
    try {
      return result(await getClient().createCase(input));
    } catch (error) {
      return failure(error);
    }
  },
);

server.registerTool(
  'doqa_list_checklists',
  {
    title: 'List DoQA checklists',
    description: 'Read DoQA checklist folders and checklists without changing them.',
    inputSchema: {
      limit: z.number().int().min(1).max(20).default(20),
      folderId: z.number().int().positive().optional(),
      search: z.string().optional(),
    },
    outputSchema,
    annotations: { readOnlyHint: true, destructiveHint: false, idempotentHint: true, openWorldHint: true },
  },
  async (input) => {
    try {
      return result(await getClient().listChecklists(input));
    } catch (error) {
      return failure(error);
    }
  },
);

server.registerTool(
  'doqa_get_checklist',
  {
    title: 'Get DoQA checklist',
    description: 'Get a complete DoQA checklist and its ETag/versionUuid.',
    inputSchema: { checklistId: z.number().int().positive() },
    outputSchema,
    annotations: { readOnlyHint: true, destructiveHint: false, idempotentHint: true, openWorldHint: true },
  },
  async ({ checklistId }) => {
    try {
      return result(await getClient().getChecklist(checklistId));
    } catch (error) {
      return failure(error);
    }
  },
);

server.registerTool(
  'doqa_create_checklist_folder',
  {
    title: 'Create DoQA checklist folder',
    description:
      'Create one checklist folder under an existing parent using the latest folder-tree ETag. Exact sibling duplicates are rejected.',
    inputSchema: {
      parentId: z.number().int().positive(),
      name: z.string().min(1).max(255),
    },
    outputSchema,
    annotations: { readOnlyHint: false, destructiveHint: false, idempotentHint: false, openWorldHint: true },
  },
  async (input) => {
    try {
      return result(await getClient().createChecklistFolder(input));
    } catch (error) {
      return failure(error);
    }
  },
);

server.registerTool(
  'doqa_create_checklist',
  {
    title: 'Create DoQA checklist',
    description: 'Create a fully reviewed checklist in DoQA. Existing checklists are never replaced.',
    inputSchema: {
      folderId: z.number().int().positive(),
      title: z.string().min(1),
      description: z.string().default(''),
      preconditions: z.string().default(''),
      expectedResult: z.string().default(''),
      children: z.array(checklistItemSchema).min(1),
      priority: z.enum(['high', 'medium', 'low']).default('medium'),
      status: z.enum(['ready', 'review']).default('ready'),
      tagIds: z.array(z.number().int().positive()).default([]),
      responsibleId: z.number().int().positive().optional(),
    },
    outputSchema,
    annotations: { readOnlyHint: false, destructiveHint: false, idempotentHint: false, openWorldHint: true },
  },
  async (input) => {
    try {
      return result(await getClient().createChecklist(input));
    } catch (error) {
      return failure(error);
    }
  },
);

server.registerTool(
  'doqa_update_checklist',
  {
    title: 'Safely update DoQA checklist',
    description:
      'Update checklist metadata or append reviewed checks using ETag optimistic locking. Existing checks are never replaced or deleted.',
    inputSchema: {
      checklistId: z.number().int().positive(),
      title: z.string().min(1).optional(),
      description: z.string().optional(),
      preconditions: z.string().optional(),
      expectedResult: z.string().optional(),
      appendChildren: z.array(checklistItemSchema).default([]),
      priority: z.enum(['high', 'medium', 'low']).optional(),
      status: z.enum(['ready', 'review']).optional(),
      tagIds: z.array(z.number().int().positive()).optional(),
      responsibleId: z.number().int().positive().optional(),
    },
    outputSchema,
    annotations: { readOnlyHint: false, destructiveHint: false, idempotentHint: false, openWorldHint: true },
  },
  async ({ checklistId, ...changes }) => {
    try {
      return result(await getClient().updateChecklist(checklistId, changes));
    } catch (error) {
      return failure(error);
    }
  },
);

server.registerTool(
  'doqa_restructure_checklist',
  {
    title: 'Safely restructure DoQA checklist checks',
    description:
      'Reparent existing checklist checks under new hierarchy groups using ETag locking. Every existing check ID and title must be preserved exactly once; deletion and rewriting are rejected.',
    inputSchema: {
      checklistId: z.number().int().positive(),
      children: z.array(checklistItemSchema).min(1),
    },
    outputSchema,
    annotations: { readOnlyHint: false, destructiveHint: false, idempotentHint: false, openWorldHint: true },
  },
  async ({ checklistId, children }) => {
    try {
      return result(await getClient().restructureChecklist(checklistId, children));
    } catch (error) {
      return failure(error);
    }
  },
);

server.registerTool(
  'doqa_analyze_case',
  {
    title: 'Analyze DoQA case quality',
    description: 'Read-only analysis of test-case quality and suitability for automation.',
    inputSchema: { caseId: z.number().int().positive() },
    outputSchema,
    annotations: { readOnlyHint: true, destructiveHint: false, idempotentHint: true, openWorldHint: true },
  },
  async ({ caseId }) => {
    try {
      return result(await getClient().analyzeCase(caseId));
    } catch (error) {
      return failure(error);
    }
  },
);

server.registerTool(
  'doqa_improve_case',
  {
    title: 'Improve DoQA case',
    description:
      'Normalize safe formatting and remove exact duplicate steps using ETag optimistic locking. Does not invent business logic.',
    inputSchema: {
      caseId: z.number().int().positive(),
      apply: z.boolean().default(false),
    },
    outputSchema,
    annotations: { readOnlyHint: false, destructiveHint: false, idempotentHint: false, openWorldHint: true },
  },
  async ({ caseId, apply }) => {
    try {
      return result(await getClient().improveCase(caseId, { apply }));
    } catch (error) {
      return failure(error);
    }
  },
);

server.registerTool(
  'doqa_claim_case',
  {
    title: 'Claim DoQA case for automation',
    description: 'Safely mark a manual DoQA case as planned/review using ETag optimistic locking.',
    inputSchema: {
      caseId: z.number().int().positive(),
      responsibleId: z.number().int().positive().optional(),
      tagIds: z.array(z.number().int().positive()).optional(),
    },
    outputSchema,
    annotations: { readOnlyHint: false, destructiveHint: false, idempotentHint: true, openWorldHint: true },
  },
  async ({ caseId, responsibleId, tagIds }) => {
    try {
      return result(await getClient().claimCase(caseId, { responsibleId, tagIds }));
    } catch (error) {
      return failure(error);
    }
  },
);

server.registerTool(
  'doqa_upload_autotest_report',
  {
    title: 'Upload autotest report to DoQA',
    description:
      'Upload a non-empty JUnit or filtered raw Allure archive from DOQA_REPORT_DIR. The report token is read only from the environment.',
    inputSchema: {
      reportFile: z
        .string()
        .min(1)
        .refine(
          (value) => path.basename(value) === value,
          'reportFile must be a file name without directories',
        ),
      type: z.enum(['allure', 'junit']).default('allure'),
      title: z.string().min(1).optional(),
    },
    outputSchema,
    annotations: { readOnlyHint: false, destructiveHint: false, idempotentHint: false, openWorldHint: true },
  },
  async ({ reportFile, type, title }) => {
    try {
      const trustedRoot = path.resolve(process.env.DOQA_REPORT_DIR?.trim() || 'reports/doqa');
      return result(
        await getClient().uploadAutotestReport({
          reportPath: path.join(trustedRoot, reportFile),
          trustedRoot,
          type,
          title,
        }),
      );
    } catch (error) {
      return failure(error);
    }
  },
);

server.registerTool(
  'doqa_analyze_run_failures',
  {
    title: 'Analyze failed DoQA run elements',
    description:
      'Read-only triage of failed, broken and blocked run elements. Returns evidence and existing run defects without creating anything.',
    inputSchema: {
      runId: z.number().int().positive(),
    },
    outputSchema,
    annotations: { readOnlyHint: true, destructiveHint: false, idempotentHint: true, openWorldHint: true },
  },
  async ({ runId }) => {
    try {
      return result(await getClient().analyzeRunFailures(runId));
    } catch (error) {
      return failure(error);
    }
  },
);

server.registerTool(
  'doqa_prepare_product_bug_draft',
  {
    title: 'Prepare a product bug draft',
    description:
      'Read-only. Prepares copy-ready bug fields for an explicitly confirmed product failure and checks active duplicates.',
    inputSchema: {
      runId: z.number().int().positive(),
      caseId: z.number().int().positive(),
      evidence: z.string().min(1),
      title: z.string().min(1).max(255).optional(),
      actualResult: z.string().min(1).optional(),
      expectedResult: z.string().min(1).optional(),
      priority: z.enum(['high', 'medium', 'low']).default('high'),
    },
    outputSchema,
    annotations: { readOnlyHint: true, destructiveHint: false, idempotentHint: true, openWorldHint: true },
  },
  async (input) => {
    try {
      return result(await getClient().prepareProductBugDraft(input));
    } catch (error) {
      return failure(error);
    }
  },
);

await server.connect(new StdioServerTransport());
