import path from 'node:path';

import dotenv from 'dotenv';

import { publishAllureResults } from './doqa-publication.mjs';

dotenv.config();

try {
  const result = await publishAllureResults({
    allureDir: path.resolve(process.env.ALLURE_RESULTS_DIR?.trim() || 'allure-results'),
    title: process.env.DOQA_RUN_TITLE?.trim() || undefined,
  });
  console.log(JSON.stringify(result, null, 2));
} catch (error) {
  console.error(`DoQA report was not published: ${error.message}`);
  if (error.details) console.error(`DoQA details: ${JSON.stringify(error.details)}`);
  process.exitCode = 1;
}
