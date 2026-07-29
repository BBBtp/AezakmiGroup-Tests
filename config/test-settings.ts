import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env') });

const baseUrl = process.env.E2E_BASE_URL;

if (!baseUrl) {
  throw new Error('Missing required environment variable: E2E_BASE_URL');
}

export const testSettings = {
  baseUrl,
} as const;
