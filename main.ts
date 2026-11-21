// gta6-meme-x-01 entry program (Node 22, standard library only).
//
// The entry is the X post itself: the house reads the post from X — its
// first picture, then its text — and hands that to the judge. This program
// does not describe the post, grade it, or fetch anything. Its only job is
// to carry POST.json from the repository root into /output, where the gate
// reads it.
//
//   mkdir -p out && MAKEFUN_BOT_DIR=. MAKEFUN_OUTPUT_DIR=out node main.ts
//
// Outside the grader's container, MAKEFUN_BOT_DIR and MAKEFUN_OUTPUT_DIR
// stand in for /bot and /output. Inside it they default to /bot and
// /output. No network, no wall clock, no files outside the repository:
// the two runs of an entry must write the same bytes.
//
// POST.json must be a JSON object with one field, the post's address:
//
//   {"url": "https://x.com/<handle>/status/<id>"}
//
// Until the post exists the file holds a placeholder address and the gate
// refuses the entry (valid 0) — that is on purpose, since a starter that
// passed would need no post at all.

import { copyFileSync, mkdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

const BOT_DIR = process.env.MAKEFUN_BOT_DIR ?? '/bot';
const OUTPUT_DIR = process.env.MAKEFUN_OUTPUT_DIR ?? '/output';

const POST_FILE = 'POST.json';

// The gate only accepts an X post address: x.com or twitter.com, a handle,
// /status/, and digits only for the id — or the /i/web/status/<id> form the
// house also reads. A query or fragment after the id is read past by the
// house, so we only check the shape up to the id.
const POST_URL =
  /^https:\/\/(www\.|mobile\.)?(x\.com|twitter\.com)\/([^/]+\/status\/\d+|i\/web\/status\/\d+)(\?.*)?(#.*)?$/;

function fail(message: string): never {
  console.error(`gta6-meme-x-01: ${message}`);
  process.exit(1);
}

const source = join(BOT_DIR, POST_FILE);

let parsed: unknown;
try {
  parsed = JSON.parse(readFileSync(source, 'utf8'));
} catch (err) {
  fail(`could not read ${POST_FILE} from ${BOT_DIR}: ${(err as Error).message}`);
}

if (typeof parsed !== 'object' || parsed === null || Array.isArray(parsed)) {
  fail(`${POST_FILE} must be a JSON object, got ${Array.isArray(parsed) ? 'an array' : typeof parsed}`);
}

const url = (parsed as Record<string, unknown>).url;
if (typeof url !== 'string' || !POST_URL.test(url)) {
  fail(
    `${POST_FILE} must name an X post address like ` +
      `https://x.com/<handle>/status/<id>; got ${JSON.stringify(url)}`,
  );
}

mkdirSync(OUTPUT_DIR, { recursive: true });
try {
  copyFileSync(source, join(OUTPUT_DIR, POST_FILE));
} catch (err) {
  fail(`could not copy ${POST_FILE} to ${OUTPUT_DIR}: ${(err as Error).message}`);
}
