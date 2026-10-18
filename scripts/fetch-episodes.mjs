// Pulls the episode list at build time from the podcast feed bucket on R2:
//   https://pub-14b7dc82f6b745fd9d0474ac306daa23.r2.dev/episodes.json (beside feed.xml)
//
// The site needs more than a feed gives: a question, a short answer, one sentence
// about the episode, and the threads (lines) it belongs to. The remote copy is used
// only when every episode carries those fields. Otherwise the site uses the
// checked-in src/data/episodes.json.
//
// If the fetch fails, the last good copy already in src/data/live.json is kept,
// so a build never breaks and a page never goes empty.

import { readFile, writeFile } from 'node:fs/promises';

const OUT = new URL('../src/data/live.json', import.meta.url);
const SOURCE = 'https://pub-14b7dc82f6b745fd9d0474ac306daa23.r2.dev/episodes.json';
const MONTHS = ['jan', 'feb', 'mar', 'apr', 'may', 'jun', 'jul', 'aug', 'sep', 'oct', 'nov', 'dec'];

// The site never shows a long dash, even if one arrives in the feed.
const clean = (s = '') => String(s).replace(/\s*[\u2013\u2014]\s*/g, ', ').replace(/\s+/g, ' ').trim().toLowerCase();

// "2026-06-23" becomes "23 jun". A date that is already short stays as it is.
function shortDate(d) {
  const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(d || '');
  return m ? `${Number(m[3])} ${MONTHS[Number(m[2]) - 1]}` : clean(d);
}

function normalize(e) {
  const id = String(e.id || '').toUpperCase();
  const threads = (e.threads || []).map(String);
  return {
    id,
    title: clean(e.title).replace(/^plain strata:\s*/, ''),
    date: id.startsWith('B') ? '' : shortDate(e.date),
    aired: /^\d{4}-\d{2}-\d{2}/.test(e.date || '') ? e.date.slice(0, 10) : undefined,
    line: id.startsWith('B') ? 'bed' : String(e.line || threads[0] || ''),
    threads: id.startsWith('B') ? [] : threads,
    question: clean(e.question),
    answer: clean(e.answer),
    about: clean(e.about),
    url: e.url || undefined,
  };
}

const complete = (e) => e.id && e.title && e.question && e.answer && e.about && Array.isArray(e.threads) && (e.id.startsWith('B') || (e.line && e.threads.length));

async function remote() {
  const res = await fetch(SOURCE, { headers: { 'User-Agent': 'plainstrata.com build' }, signal: AbortSignal.timeout(20000) });
  if (!res.ok) throw new Error(`${res.status} from ${new URL(SOURCE).host}`);
  const data = await res.json();
  const list = Array.isArray(data) ? data : data.episodes;
  if (!Array.isArray(list) || !list.length) throw new Error('no episodes in the response');
  const eps = list.map(normalize);
  const missing = eps.filter((e) => !complete(e)).length;
  if (missing) throw new Error(`${missing} of ${eps.length} episodes lack question, answer, about or threads`);
  // basics first, then the episodes in the order they aired
  return eps.sort((a, b) => {
    const ab = a.id.startsWith('B'), bb = b.id.startsWith('B');
    if (ab !== bb) return ab ? -1 : 1;
    if (ab) return a.id.localeCompare(b.id, 'en', { numeric: true });
    return (a.aired || '').localeCompare(b.aired || '');
  });
}

const previous = JSON.parse(await readFile(OUT, 'utf8').catch(() => '{}'));
let out;
try {
  const episodes = await remote();
  out = { fetchedAt: new Date().toISOString(), source: 'live', episodes };
  console.log(`fetch episodes: ${episodes.length} items from R2`);
} catch (err) {
  out = { ...previous, source: previous.episodes?.length ? `kept previous copy (${err.message})` : `checked-in data (${err.message})` };
  console.warn(`fetch episodes: ${out.source}`);
}
await writeFile(OUT, JSON.stringify(out, null, 2) + '\n');
