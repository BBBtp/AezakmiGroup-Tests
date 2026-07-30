import path from 'node:path';

import dotenv from 'dotenv';

import { generateBugDrafts, resetBugDraftOutput } from './bug-drafts.mjs';
import { publishAllureResults } from './doqa-publication.mjs';

dotenv.config();

const allureDir = path.resolve(process.env.ALLURE_RESULTS_DIR?.trim() || 'allure-results');
let publication;
try {
  publication = await publishAllureResults({
    allureDir,
    title: process.env.DOQA_RUN_TITLE?.trim() || undefined,
  });
} catch (error) {
  console.error(`DoQA report was not published: ${error.message}`);
  if (error.details) console.error(`DoQA details: ${JSON.stringify(error.details)}`);
  process.exitCode = 1;
}

if (publication) {
  let bugDrafts;
  try {
    const bugDraftsDir = path.resolve(process.env.BUG_DRAFTS_DIR?.trim() || 'bug-drafts');
    await resetBugDraftOutput(bugDraftsDir);
    bugDrafts = await generateBugDrafts({
      allureDir,
      outputDir: bugDraftsDir,
      runId: publication.verification.runId,
    });
  } catch (error) {
    console.error(`Bug drafts were not prepared: ${error.message}`);
    process.exitCode = 1;
  }
  console.log(JSON.stringify({ ...publication, bugDrafts }, null, 2));
}
