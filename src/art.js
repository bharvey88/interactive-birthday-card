const f = v => `fill="var(--${v})"`, S = 'class="s"';
const heart = (x, y, s, c) => `<path transform="translate(${x} ${y}) scale(${s})" d="M0 6C-3-4-14-2-10 7C-8 12-2 15 0 18C2 15 8 12 10 7C14-2 3-4 0 6Z" fill="${c}"/>`;
const star = (x, y, r, c) => {
  let p = '';
  for (let i = 0; i < 10; i++) {
    const a = -Math.PI / 2 + i * Math.PI / 5, q = i % 2 ? r * .45 : r;
    p += (i ? 'L' : 'M') + (x + q * Math.cos(a)).toFixed(1) + ' ' + (y + q * Math.sin(a)).toFixed(1);
  }
  return `<path d="${p}Z" fill="${c}"/>`;
};
const cross = (x, y, s) => `<path transform="translate(${x} ${y}) scale(${s})" ${S} ${f('gold')} d="M-3.5 0H3.5V9H13V16H3.5V38H-3.5V16H-13V9H-3.5Z"/>`;

const castle = (o = {}) => `<g class="k">
<path ${S} ${f('wall2')} d="M115 118H185V240H115Z"/>
<path ${S} ${f('wall')} d="M40 160H100V340H40Z"/><path ${S} ${f('wall')} d="M200 160H260V340H200Z"/>
<path ${S} ${f('roof')} d="M28 162L70 78L112 162Z"/><path ${S} ${f('roof')} d="M188 162L230 78L272 162Z"/>
<path ${S} ${f('roof2')} d="M101 122L150 44L199 122Z"/>
${[70, 230].map(x => `<path fill="none" style="stroke:var(--line);stroke-width:2.5" d="M${x} 80V50"/><path ${S} ${f('m1')} d="M${x} 50L${x + 26} 58L${x} 67Z"/>`).join('')}
${o.cross === false ? `<path fill="none" style="stroke:var(--line);stroke-width:2.5" d="M150 46V16"/><path ${S} ${f('m2')} d="M150 16L176 24L150 33Z"/>` : cross(150, 7, 1)}
<path ${S} ${f('wall')} d="M82 340V222H98V234H114V222H130V234H146V222H154V234H170V222H186V234H202V222H218V340Z"/>
<path ${S} ${f('door')} d="M122 340V288a28 28 0 0 1 56 0V340Z"/><path style="stroke:var(--line);stroke-width:2" d="M150 262V340"/><circle cx="143" cy="306" r="3" ${f('gold')}/><circle cx="157" cy="306" r="3" ${f('gold')}/>
${[[70, 200], [230, 200], [70, 260], [230, 260], [150, 165]].map(([x, y]) => `<path ${S} ${f('win')} d="M${x - 9} ${y + 16}V${y}a9 9 0 0 1 18 0V${y + 16}Z"/>`).join('')}
</g>`;

const unicorn = () => `<g class="k">
<path ${S} ${f('m2')} d="M56 138C12 112-6 168 18 188C4 200 14 226 36 216C62 204 46 178 64 162Z"/><path ${S} ${f('m1')} d="M54 146C28 138 18 164 34 182C26 192 30 204 40 200C54 192 44 176 60 160Z"/>
<path ${S} ${f('shade')} d="M92 168h20v46a6 6 0 0 1-6 6h-8a6 6 0 0 1-6-6Z"/><path ${S} ${f('shade')} d="M138 164h20v50a6 6 0 0 1-6 6h-8a6 6 0 0 1-6-6Z"/>
<path ${S} ${f('body')} d="M46 150C46 112 88 104 112 110C118 92 128 78 144 74L180 116C168 130 166 146 164 158C162 190 130 196 104 194C70 194 46 182 46 150Z"/>
<path ${S} ${f('body')} d="M66 176h23v42a8 8 0 0 1-8 8h-7a8 8 0 0 1-8-8Z"/><path ${S} ${f('body')} d="M116 178h23v40a8 8 0 0 1-8 8h-7a8 8 0 0 1-8-8Z"/>
<path ${S} ${f('hoof')} d="M66 208h23v10a8 8 0 0 1-8 8h-7a8 8 0 0 1-8-8Z"/><path ${S} ${f('hoof')} d="M116 208h23v10a8 8 0 0 1-8 8h-7a8 8 0 0 1-8-8Z"/>
${heart(78, 138, 1.1, 'var(--m1)')}
<path ${S} ${f('m1')} d="M122 150C94 146 92 120 108 112C94 100 102 78 120 78C118 56 140 42 154 52C160 70 150 76 146 88C142 104 148 112 138 122C140 136 134 148 122 150Z"/>
<path ${S} ${f('horn')} d="M166 54L194 4L190 58Z"/><path style="stroke:var(--line);stroke-width:2;fill:none" d="M173 42L191 48M180 29L192 34"/>
<path ${S} ${f('body')} d="M140 64L136 32Q156 38 162 56Z"/>
<path ${S} ${f('body')} d="M126 92C124 62 148 50 170 52C194 54 206 68 208 84C226 88 232 102 226 114C220 128 200 130 184 126C154 134 128 120 126 92Z"/>
<path ${f('muzz')} d="M206 86C225 89 231 102 225 113C219 125 202 128 189 125C186 108 192 92 206 86Z"/>
<circle cx="215" cy="100" r="2.6" ${f('ink')}/><path fill="none" style="stroke:var(--ink);stroke-width:2.6" d="M196 115Q206 121 215 114"/>
<ellipse cx="180" cy="86" rx="7" ry="9.5" ${f('ink')}/><circle cx="182.5" cy="82" r="3" fill="#fff"/><path fill="none" style="stroke:var(--ink);stroke-width:2.4" d="M172 80L164 76M173 76L167 69M178 74L175 67"/>
<ellipse cx="163" cy="106" rx="9" ry="6" ${f('cheek')}/>
<path ${S} ${f('m2')} d="M152 40C136 46 136 66 148 74C150 82 158 80 160 72C172 70 176 56 168 48C164 40 158 38 152 40Z"/>
</g>`;

const limb = d => `<path fill="none" style="stroke:var(--line);stroke-width:calc(11px + 2px * var(--lw))" d="${d}"/><path fill="none" style="stroke:var(--skin);stroke-width:11px" d="${d}"/>`;
const princess = (o = {}) => `<g class="k">
<path ${S} ${f('hair')} d="M42 62C34 14 126 14 118 62C130 96 132 132 116 142C106 132 54 132 44 142C28 132 30 96 42 62Z"/>
${limb('M106 124Q132 116 134 88')}${limb('M54 124Q30 138 34 160')}
<path ${S} ${f('dress')} d="M62 108Q80 120 98 108L108 144C122 168 140 196 146 222Q134 234 122 224Q108 238 94 226Q80 240 66 226Q52 238 38 224Q26 234 14 222C20 196 38 168 52 144Z"/>
<path ${S} ${f('dress2')} d="M80 152C92 168 108 196 112 218Q106 228 94 226Q80 240 66 226Q54 228 48 218C52 196 68 168 80 152Z"/>
<path ${S} ${f('gold')} d="M52 142Q80 152 108 142L109 150Q80 161 51 150Z"/>
<circle ${S} cx="55" cy="118" r="13" ${f('dress2')}/><circle ${S} cx="105" cy="118" r="13" ${f('dress2')}/>
<path ${S} ${f('skin')} d="M72 92H88V108Q80 114 72 108Z"/>
<circle ${S} cx="80" cy="68" r="32" ${f('skin')}/>
<path ${S} ${f('hair')} d="M47 68C46 36 70 30 84 38C98 30 116 42 113 68C104 62 94 54 86 46C78 58 60 62 47 68Z"/>
<path ${S} ${f('gold')} d="M55 40L50 12L67 26L80 4L93 26L110 12L105 40Q80 30 55 40Z"/>
<circle cx="80" cy="25" r="4" ${f('m1')}/><circle cx="62" cy="31" r="3" ${f('m2')}/><circle cx="98" cy="31" r="3" ${f('m2')}/>
<ellipse cx="68" cy="73" rx="4.2" ry="6" ${f('ink')}/><ellipse cx="92" cy="73" rx="4.2" ry="6" ${f('ink')}/><circle cx="69.5" cy="70.5" r="1.8" fill="#fff"/><circle cx="93.5" cy="70.5" r="1.8" fill="#fff"/>
<path fill="none" style="stroke:var(--ink);stroke-width:2" d="M63 72L58 71M97 72L102 71"/>
<ellipse cx="59" cy="83" rx="6" ry="4" ${f('cheek')}/><ellipse cx="101" cy="83" rx="6" ry="4" ${f('cheek')}/>
<path fill="none" style="stroke:var(--ink);stroke-width:2.6" d="M70 86Q80 95 90 86"/>
${o.necklace ? `<path fill="none" style="stroke:#d99a00;stroke-width:1.6" d="M66 102Q80 126 94 102"/><path d="M78 114h4v4h5v4h-5v10h-4v-10h-5v-4h5Z" fill="#ffc400" stroke="#8a5a00" stroke-width="1"/>` : ''}
</g>`;

const RB = ['#ff8cc3', '#ffb98a', '#ffe48a', '#a9e3c0', '#a9c8f7', '#c79bf2'];
const at = (x, y, s, g, c = '') => `<g transform="translate(${x} ${y}) scale(${s})"><g class="${c}">${g}</g></g>`;
const T = (x, y, size, txt, font, fill) => `<text x="${x}" y="${y}" font-size="${size}" text-anchor="middle" font-family="${font}" fill="${fill}">${txt}</text>`;
const CS = "'Cabin Sketch'";
const cast = (o = {}) => at(20, 150, .87, castle(o)) + at(4, 400, .72, unicorn()) + at(168, 390, .72, princess(o));
