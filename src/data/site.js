// Everything on the site that is written by hand lives here.
// The episodes live in episodes.json (checked in) or live.json (fetched from R2 at build time).

export const SHOW = 'https://podcasts.apple.com/us/podcast/plain-strata/id6783455764';
export const LETTER = 'https://buttondown.com/plainstrata';
// Buttondown's own subscribe page posts to this address.
export const SUBSCRIBE_ACTION = 'https://buttondown.com/api/emails/embed-subscribe/plainstrata';
export const CREATOR = { name: 'Dastan Modubash', url: 'https://dasmod.xyz', label: 'dasmod.xyz' };

// Where to listen. A platform shows up on the site only when it has an address.
export const LISTEN = [
  ['apple podcasts', SHOW],
  ['spotify', null],
  ['youtube', null],
];

export const DESCRIPTION = 'A podcast and a newsletter that explain decentralized AI, layer by layer. Free, twice a week.';

// The lines of the map: one question the show keeps coming back to.
// lane = the column on the map (0 is the trunk), from = the basics episode the line starts at.
export const LINES = [
  { k: 'bed', name: 'start here', lane: 0 },
  { k: 'check', name: 'can you check it?', lane: 0, from: 'B02' },
  { k: 'off', name: 'who holds the off switch?', lane: -1, from: 'B08' },
  { k: 'wall', name: 'can strangers train together?', lane: -2, from: 'B05' },
  { k: 'agents', name: 'can software do business?', lane: -3, from: 'B07' },
  { k: 'rent', name: 'rent or own?', lane: 1, from: 'B06' },
  { k: 'sells', name: 'who pays for the network?', lane: 2, from: 'B03' },
];

// The home page question tree. q overrides the episode's own question.
export const TREE = { id: 'B01', kids: [
  { id: 'P1', q: 'why does it matter?', kids: [{ id: 'P7' }, { id: 'P2' }] },
  { id: 'B06', kids: [{ id: 'L2', kids: [{ id: 'P4' }] }, { id: 'P11' }] },
  { id: 'B02', kids: [{ id: 'L6' }, { id: 'L9', kids: [{ id: 'L11' }] }, { id: 'L10', kids: [{ id: 'L12' }] }] },
  { id: 'B03', kids: [{ id: 'P13' }, { id: 'P15' }] },
  { id: 'B07', kids: [{ id: 'P3' }, { id: 'L4' }] },
]};
