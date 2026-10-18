import checkedIn from '../data/episodes.json';
import live from '../data/live.json';
import { LINES, TREE } from '../data/site.js';

// Every id that the tree and the lines point at must exist, or the pages break.
function treeIds(node, out = []) {
  out.push(node.id);
  (node.kids || []).forEach((k) => treeIds(k, out));
  return out;
}
const needed = treeIds(TREE).concat(LINES.filter((l) => l.from).map((l) => l.from));
const fits = (eps) => Array.isArray(eps) && eps.length > 0 && needed.every((id) => eps.some((e) => e.id === id));

// The fetched copy wins when it is complete. Otherwise the checked-in file is used.
export const episodes = fits(live.episodes) ? live.episodes : checkedIn;
export const source = fits(live.episodes) ? 'r2' : 'checked-in';
