addEventListener('hashchange', () => location.reload());

function fitText(el) {
  el.style.fontSize = '';
  for (let size = parseFloat(getComputedStyle(el).fontSize); el.scrollWidth > el.clientWidth && size > 10; size -= 1) el.style.fontSize = size - 1 + 'px';
}

(() => {
  const card = readCard(location.hash);
  if (!card) {
    document.getElementById('oops').hidden = false;
    document.getElementById('world').hidden = true;
    return;
  }
  const tail = card.cross ? '-cross' : '';
  window.CFG = {
    age: card.age,
    syllables: card.syllables,
    img: {
      scene: `img/scenebg${tail}.webp`,
      end: `img/endbg${tail}.webp`,
      lines: `img/lines${tail}.webp`,
      prin: `img/prin-${card.hair}-${card.skin}${tail}.webp`
    }
  };
  document.querySelectorAll('img[data-img]').forEach(i => { i.src = CFG.img[i.dataset.img]; });
  document.title = `A birthday card for ${card.name}`;
  document.getElementById('envname').textContent = card.name;
  document.getElementById('rubhint').textContent = `Rub to color it in, ${card.name}!`;
  document.getElementById('nth').textContent = `Happy ${ordinal(card.age)} birthday`;
  document.getElementById('who').textContent = `${card.name}!`;
  const msg = document.getElementById('msg');
  ENDINGS[card.ending](card.name).forEach((line, i) => {
    const el = document.createElement(i ? 'p' : 'h2');
    el.textContent = line;
    msg.append(el);
  });
  const sig = document.createElement('p');
  sig.className = 'sig';
  sig.textContent = `Love, ${card.from}`;
  msg.append(sig);

  const fitAll = () => {
    fitText(document.getElementById('envname'));
    fitText(document.getElementById('rubhint'));
    fitText(document.getElementById('nth'));
    fitText(document.getElementById('who'));
    [...msg.children].forEach(el => fitText(el));
  };
  fitAll();
  document.fonts.ready.then(fitAll);

  const s = document.createElement('script');
  s.src = 'card.js';
  document.body.append(s);
})();
