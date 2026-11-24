/* Turns card settings into the part of a link after the #, and back. Browsers don't send that part to the server. */
const HAIR = { blonde: '#e8c15a', red: '#c4572e', brown: '#8a5a36', black: '#2b1b12' };
const SKIN = { light: '#f6cba9', tan: '#dba177', brown: '#a86b45', dark: '#7a4a2e' };
const ENDINGS = {
  story: n => ['Once upon a time', `a kid named ${n} had`, 'a birthday with a unicorn,', 'a princess and a castle.', `And everybody loved ${n}`, 'very, very much.'],
  short: n => [`Happy birthday, ${n}!`, 'We hope your day is full', 'of singing, dancing, art', 'and lots of cake.', 'We love you!'],
  faith: n => [`Happy birthday, ${n}!`, 'God made you sweet, silly', 'and so good at art. We hope', 'your day is full of singing,', 'dancing and cake.', 'We love you!']
};
const MAX_AGE = 12;

const tidy = s => String(s ?? '').normalize('NFC').replace(/\s+/g, ' ').trim();
// A dot followed by a letter looks like a web address
const NAME_OK = s => [...s].length <= 14 && /^\p{L}[\p{L}\p{M}'’ .\-]*$/u.test(s) && !/\.\S/.test(s);
const FROM_OK = s => [...s].length <= 28 && /^[\p{L}\p{N}][\p{L}\p{M}\p{N}'’ .,&+\-]*$/u.test(s) && /\p{L}/u.test(s) && !/\.\S/.test(s);

const letters = s => s.replace(/[^\p{L}\p{M}]/gu, '');
// Cut the name after the same number of letters as each part of the split, so punctuation stays with its part
function cut(name, parts) {
  const out = [];
  let rest = [...name];
  parts.forEach((p, i) => {
    let left = [...letters(p)].length, piece = '';
    while (rest.length && (left > 0 || !/\p{L}/u.test(rest[0]))) {
      if (/[\p{L}\p{M}]/u.test(rest[0])) left--;
      piece += rest.shift();
    }
    if (i === parts.length - 1) piece += rest.join('');
    out.push(piece);
  });
  return out;
}
function guessSplit(name) {
  if (/[^a-z'’ .\-]/i.test(name)) return [name];
  const parts = name.split(/[ \-]+/).filter(Boolean).flatMap(word => {
    const bits = word.match(/[^aeiouy]*[aeiouy]+(?:[^aeiouy]+$|[^aeiouy](?=[^aeiouy]))?/gi);
    if (!bits || bits.join('') !== word) return [word];
    if (bits.length > 1 && /^[^aeiouy]+e$/i.test(bits.at(-1))) bits.push(bits.splice(-2).join(''));
    return bits;
  });
  return parts.length > 6 ? [name] : cut(name, parts);
}
function splitSong(name, song) {
  const parts = tidy(song).split(/[\-\s]+/).filter(p => letters(p));
  if (!parts.length || parts.length > 6 || letters(parts.join('')).toLowerCase() !== letters(name).toLowerCase()) return null;
  return cut(name, parts);
}
const showSplit = parts => parts.map(letters).join('-');

function ordinal(n) {
  return n + (n >= 11 && n <= 13 ? 'th' : { 1: 'st', 2: 'nd', 3: 'rd' }[n] || 'th');
}

function readCard(hash) {
  let q;
  try { q = new URLSearchParams(String(hash).replace(/^#/, '')); } catch { return null; }
  const name = tidy(q.get('name')), from = tidy(q.get('from')), age = Number(q.get('age'));
  if (!NAME_OK(name) || !FROM_OK(from) || !/^\d+$/.test(q.get('age') || '') || age < 1 || age > MAX_AGE) return null;
  const pick = (key, table, other) => (Object.hasOwn(table, q.get(key) ?? '') ? q.get(key) : other);
  return {
    name, from, age,
    syllables: splitSong(name, q.get('song')) || guessSplit(name),
    hair: pick('hair', HAIR, 'brown'),
    skin: pick('skin', SKIN, 'light'),
    ending: pick('ending', ENDINGS, 'story'),
    cross: q.get('cross') === '1'
  };
}

function writeCard(c) {
  const q = new URLSearchParams({ name: c.name, age: c.age, from: c.from });
  const split = showSplit(c.syllables);
  if (split !== showSplit(guessSplit(c.name))) q.set('song', split);
  q.set('hair', c.hair);
  q.set('skin', c.skin);
  if (c.cross) q.set('cross', '1');
  q.set('ending', c.ending);
  return '#' + q.toString().replaceAll('+', '%20');
}

if (typeof module !== 'undefined') module.exports = { readCard, writeCard, guessSplit, splitSong, ordinal, NAME_OK, FROM_OK, tidy };
