import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { z } from 'zod';
import { DoqaApiError, DoqaClient } from './doqa-client.mjs';

const client = new DoqaClient();
const server = new McpServer({ name: 'crm-doqa', version: '0.1.0' });

function result(value) {
  return { content: [{ type: 'text', text: JSON.stringify(value, null, 2) }] };
}

function failure(error) {
  const details = error instanceof DoqaApiError ? { status: error.status, details: error.details } : { message: error.message };
  return { isError: true, content: [{ type: 'text', text: JSON.stringify(details, null, 2) }] };
}

server.registerTool('doqa_find_candidates', {
  title: 'Find DoQA automation candidates',
  description: 'Find ready DoQA test cases marked as planned for automation and not yet automated.',
  inputSchema: {
    limit: z.number().int().min(1).max(20).default(6),
    search: z.string().optional(),
    automationStatuses: z.array(z.enum(['manual', 'planned', 'automated'])).default(['planned']),
  },
}, async ({ limit, search, automationStatuses }) => {
  try { return result(await client.listAutomationCandidates({ limit, search, automationStatuses })); }
  catch (error) { return failure(error); }
});

server.registerTool('doqa_get_case', {
  title: 'Get DoQA case',
  description: 'Get a complete DoQA test case and its ETag.',
  inputSchema: { caseId: z.number().int().positive() },
}, async ({ caseId }) => {
  try { return result(await client.getCase(caseId)); }
  catch (error) { return failure(error); }
});

server.registerTool('doqa_create_case', {
  title: 'Create DoQA test case',
  description: 'Create a fully described test case in DoQA. New cases are planned for automation by default.',
  inputSchema: {
    folderId: z.number().int().positive(),
    title: z.string().min(1),
    description: z.string().default(''),
    preconditions: z.string().default(''),
    expectedResult: z.string().default(''),
    steps: z.array(z.object({ step: z.string().min(1), result: z.string().min(1), testData: z.string().nullable().optional() })).default([]),
    priority: z.enum(['high', 'medium', 'low']).default('medium'),
    status: z.enum(['ready', 'review']).default('ready'),
    automationStatus: z.enum(['manual', 'planned', 'automated']).default('planned'),
    tagIds: z.array(z.number().int().positive()).default([]),
  },
}, async (input) => {
  try { return result(await client.createCase(input)); }
  catch (error) { return failure(error); }
});

server.registerTool('doqa_analyze_case', {
  title: 'Analyze DoQA case quality',
  description: 'Read-only analysis of test-case quality and suitability for automation.',
  inputSchema: { caseId: z.number().int().positive() },
}, async ({ caseId }) => {
  try { return result(await client.analyzeCase(caseId)); }
  catch (error) { return failure(error); }
});

server.registerTool('doqa_improve_case', {
  title: 'Improve DoQA case',
  description: 'Normalize safe formatting and remove exact duplicate steps using ETag optimistic locking. Does not invent business logic.',
  inputSchema: {
    caseId: z.number().int().positive(),
    apply: z.boolean().default(true),
  },
}, async ({ caseId, apply }) => {
  try { return result(await client.improveCase(caseId, { apply })); }
  catch (error) { return failure(error); }
});

server.registerTool('doqa_claim_case', {
  title: 'Claim DoQA case for automation',
  description: 'Safely mark a manual DoQA case as planned/review using ETag optimistic locking.',
  inputSchema: {
    caseId: z.number().int().positive(),
    responsibleId: z.number().int().positive().optional(),
    tagIds: z.array(z.number().int().positive()).optional(),
  },
}, async ({ caseId, responsibleId, tagIds }) => {
  try { return result(await client.claimCase(caseId, { responsibleId, tagIds })); }
  catch (error) { return failure(error); }
});

server.registerTool('doqa_upload_autotest_report', {
  title: 'Upload autotest report to DoQA',
  description: 'Upload a JUnit or raw Allure report archive to DoQA and create a populated test run.',
  inputSchema: {
    reportToken: z.string().min(1),
    reportPath: z.string().min(1),
    type: z.enum(['allure', 'junit']).default('allure'),
    title: z.string().min(1).optional(),
  },
}, async ({ reportToken, reportPath, type, title }) => {
  try { return result(await client.uploadAutotestReport({ reportToken, reportPath, type, title })); }
  catch (error) { return failure(error); }
});

await server.connect(new StdioServerTransport());
