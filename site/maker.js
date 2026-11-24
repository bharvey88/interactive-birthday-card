const $ = id => document.getElementById(id);
const cap = s => s[0].toUpperCase() + s.slice(1);
const ENDING_NAMES = { story: 'Fairy tale', short: 'Short and sweet', faith: 'With a little faith' };

for (let n = 1; n <= MAX_AGE; n++) $('age').append(new Option(n, n, n === 6, n === 6));

function radio(box, group, value, on, cls, fill) {
  const l = document.createElement('label'), r = document.createElement('input');
  l.className = cls;
  r.type = 'radio';
  r.name = group;
  r.value = value;
  r.checked = on;
  l.append(r);
  fill(l);
  box.append(l);
}
for (const [group, table, first] of [['hair', HAIR, 'brown'], ['skin', SKIN, 'light']]) {
  for (const [value, color] of Object.entries(table)) {
    radio($(group), group, value, value === first, 'pick', l => {
      const dot = document.createElement('i');
      dot.style.background = color;
      l.append(dot, cap(value));
    });
  }
}
for (const value of Object.keys(ENDINGS)) {
  radio($('ending'), 'ending', value, value === 'story', 'end', l => {
    const b = document.createElement('b'), t = document.createElement('span');
    b.textContent = ENDING_NAMES[value];
    t.dataset.ending = value;
    l.append(b, t);
  });
}
const picked = group => document.querySelector(`input[name=${group}]:checked`).value;

let songTouched = false;
function refresh() {
  const name = tidy($('name').value);
  if (!songTouched) $('song').value = NAME_OK(name) ? showSplit(guessSplit(name)) : '';
  const e = $('envname');
  e.textContent = name;
  e.style.fontSize = '';
  for (let size = 44; e.scrollWidth > e.clientWidth && size > 10; size--) e.style.fontSize = size - 1 + 'px';
  $('princess').src = `card/img/prin-${picked('hair')}-${picked('skin')}${$('cross').checked ? '-cross' : ''}.webp`;
  document.querySelectorAll('[data-ending]').forEach(t => { t.textContent = ENDINGS[t.dataset.ending](name || 'your kid').join(' '); });
}
$('song').addEventListener('input', () => { songTouched = $('song').value !== ''; });
$('f').addEventListener('input', () => { $('done').hidden = true; refresh(); });
document.fonts.ready.then(refresh);
refresh();

function problem(id, text) {
  $(id + '-e').textContent = text;
  $(id).setAttribute('aria-invalid', text ? 'true' : 'false');
  return !!text;
}
$('f').addEventListener('submit', ev => {
  ev.preventDefault();
  const name = tidy($('name').value), from = tidy($('from').value);
  const song = splitSong(name, $('song').value || showSplit(guessSplit(name)));
  const bad = [
    problem('name', NAME_OK(name) ? '' : name ? 'Use up to 14 letters. Spaces, dashes and apostrophes are fine.' : 'Type a first name.') && 'name',
    problem('from', FROM_OK(from) ? '' : from ? 'Use up to 28 letters and numbers. Commas, dashes and & are fine.' : 'Type who the card is from.') && 'from',
    problem('song', song || !NAME_OK(name) ? '' : `Spell the name the same way, like ${showSplit(guessSplit(name))}.`) && 'song'
  ].filter(Boolean);
  if (bad.length) {
    $(bad[0]).focus();
    return;
  }
  const url = new URL('card/', location.href);
  url.hash = writeCard({ name, from, age: $('age').value, syllables: song, hair: picked('hair'), skin: picked('skin'), cross: $('cross').checked, ending: picked('ending') });
  $('link').value = url.href;
  $('open').href = url.href;
  $('share').hidden = !navigator.share;
  $('copy').textContent = 'Copy link';
  $('done').hidden = false;
  $('done').scrollIntoView({ block: 'nearest' });
  $('copy').focus({ preventScroll: true });
});
$('copy').onclick = async () => {
  try {
    await navigator.clipboard.writeText($('link').value);
    $('copy').textContent = 'Copied';
  } catch {
    $('link').focus();
    $('link').select();
    $('copy').textContent = document.execCommand('copy') ? 'Copied' : 'Press and hold the link to copy';
  }
};
$('share').onclick = () => navigator.share({ url: $('link').value }).catch(() => {});
$('link').onfocus = () => $('link').select();
