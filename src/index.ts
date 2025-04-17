#!/usr/bin/env node
import minimist from 'minimist';
import path from 'path';
import { CrawlerApplication } from './application/crawlerApplication';

interface Args {
  start_url?: string;
  reset?: boolean;
  folder?: string;
  max?: number;
}

const args = minimist<Args>(process.argv.slice(2), { boolean: ['reset'] });
const startUrl = args.start_url;
const reset = args.reset ?? false;
const folderArg = args.folder ?? null;
const maxPages = args.max ?? 10000;

if (!startUrl) {
  console.error('Error: --start_url argument is required.');
  process.exit(1);
}

const folder = folderArg || new URL(startUrl).hostname;
const outputDir = path.join(process.cwd(), 'sites', folder);

(async () => {
  const app = new CrawlerApplication({ startUrl, outputDir, reset, maxPages });
  try {
    await app.run();
    console.log('Crawling finished.');
  } catch (error) {
    console.error('Unhandled error:', error);
    process.exit(1);
  }
})();