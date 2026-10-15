(function () {
  var PEOPLE = [
    { name: 'Kishan Kavi', role: 'Founder & Tax Consultant', phone: '07534 764515', email: 'kishan@kktaxes.co.uk' },
    { name: 'Jayshal Chauhan', role: 'Consultant', phone: '', email: '' },
    { name: 'Calum Scott MacAulay', role: 'Head of Commercial', phone: '', email: '' }
  ];
  var FIELDS = ['name', 'role', 'phone', 'email'];
  var $ = function (id) { return document.getElementById(id); };
  var card = $('card'), stage = $('stage'), side = $('side');
  var reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  function draw() {
    FIELDS.forEach(function (f) {
      var v = $(f).value.trim();
      document.querySelectorAll('[data-f="' + f + '"]').forEach(function (el) { el.textContent = v; });
    });
  }
  function choose(i) {
    FIELDS.forEach(function (f) { $(f).value = PEOPLE[i][f]; });
    document.querySelectorAll('#people button').forEach(function (b, n) { b.setAttribute('aria-pressed', n === i ? 'true' : 'false'); });
    draw();
  }
  PEOPLE.forEach(function (p, i) {
    var b = document.createElement('button');
    b.type = 'button';
    b.textContent = p.name.split(' ')[0];
    b.addEventListener('click', function () { choose(i); });
    $('people').appendChild(b);
  });
  FIELDS.forEach(function (f) { $(f).addEventListener('input', function () { draw(); wake(); }); });
  var asked = new URLSearchParams(location.search).get('for');
  var start = 0;
  PEOPLE.forEach(function (p, i) { if (asked && p.name.toLowerCase().indexOf(asked.toLowerCase()) === 0) start = i; });
  choose(start);

  // Rotation: `turn` is where the card rests (multiples of 180), `spin` is the drag in progress,
  // and `tx`/`ty` are the small tilt that follows the pointer. Everything eases towards its target.
  var turn = 0, spin = 0, auto = 0, tx = 0, ty = 0, cur = { x: 0, y: 0 }, dragging = false, moved = 0, startX = 0, startSpin = 0, last = 0, prev = 0, shown = false;
  var IDLE_MS = 3200, SPIN_DEG_PER_S = 26;

  // Any touch ends the idle spin and settles the card on whichever face is nearer.
  function wake() {
    last = performance.now();
    if (auto !== 0) { turn = Math.round((turn + auto) / 180) * 180; auto = 0; announce(); }
  }

  function frame(t) {
    var dt = Math.min(64, t - (prev || t)); prev = t;
    if (!dragging && !reduced && !document.hidden && t - last > IDLE_MS) auto += SPIN_DEG_PER_S * dt / 1000;
    var spinning = auto !== 0;
    var targetY = turn + spin + auto + (dragging || spinning ? 0 : ty);
    var targetX = dragging ? 0 : spinning ? 7 : tx;
    var k = reduced ? 1 : spinning ? 0.2 : 0.12;
    cur.y += (targetY - cur.y) * k;
    cur.x += (targetX - cur.x) * (reduced ? 1 : 0.08);
    // Nothing is written while the card is at rest, so a still card costs nothing.
    var key = cur.y.toFixed(2) + '|' + cur.x.toFixed(2);
    if (key === drawn) { if (running) requestAnimationFrame(frame); return; }
    drawn = key;
    card.style.transform = 'rotateX(' + cur.x.toFixed(2) + 'deg) rotateY(' + cur.y.toFixed(2) + 'deg)';
    // Angle of the visible face away from flat: it moves the highlight and shades the side turning away.
    var rad = cur.y * Math.PI / 180, a = ((cur.y % 180) + 180) % 180;
    if (a > 90) a -= 180;
    var back = Math.cos(rad) < 0;
    if (back !== shown) { shown = back; side.textContent = back ? 'Back' : 'Front'; }
    var lean = back ? -a : a, away = Math.abs(lean) / 90;
    var move = 'translate3d(' + (-lean * 0.75).toFixed(2) + '%,' + (-cur.x * 0.8).toFixed(2) + '%,0)';
    var left = (away * 0.14 + Math.max(0, -lean) / 90 * 0.5).toFixed(3), right = (away * 0.14 + Math.max(0, lean) / 90 * 0.5).toFixed(3);
    for (var i = 0; i < hl.length; i++) { hl[i].style.transform = move; sl[i].style.opacity = left; sr[i].style.opacity = right; }
    floor.style.transform = 'translate3d(calc(-50% + ' + (-Math.sin(rad) * 14).toFixed(1) + 'px),0,0) scaleX(' + Math.max(0.2, Math.abs(Math.cos(rad))).toFixed(3) + ')';
    if (running) requestAnimationFrame(frame);
  }
  var hl = document.querySelectorAll('.hl'), sl = document.querySelectorAll('.sl'), sr = document.querySelectorAll('.sr'), floor = $('floor'), drawn = '', running = true, onScreen = true;
  // The loop stops while the card is scrolled away or the tab is in the background.
  function setRunning() {
    var should = onScreen && !document.hidden;
    if (should && !running) { running = true; prev = 0; last = performance.now(); requestAnimationFrame(frame); }
    else if (!should) running = false;
  }
  if ('IntersectionObserver' in window) new IntersectionObserver(function (e) { onScreen = e[0].isIntersecting; setRunning(); }).observe(stage);
  document.addEventListener('visibilitychange', setRunning);
  requestAnimationFrame(frame);

  function announce() { /* the label follows the visible face in frame() */ }
  function flip(dir) { wake(); turn += 180 * (dir || 1); spin = 0; announce(); }

  stage.addEventListener('pointermove', function (e) {
    wake();
    if (dragging) {
      var dx = e.clientX - startX;
      moved = Math.max(moved, Math.abs(dx));
      spin = startSpin + dx * 0.55;
      return;
    }
    if (e.pointerType === 'mouse') {
      var r = stage.getBoundingClientRect();
      ty = ((e.clientX - r.left) / r.width - 0.5) * 26;
      tx = -((e.clientY - r.top) / r.height - 0.5) * 16;
    }
  });
  stage.addEventListener('pointerleave', function () { if (!dragging) { tx = 0; ty = 0; } });
  // Presses are taken on the wrapper, because the browser can report either the wrapper or the card
  // itself as the target while the card is turned in 3D.
  var grip = $('tilt');
  grip.addEventListener('pointerdown', function (e) {
    wake(); dragging = true; moved = 0; startX = e.clientX; startSpin = spin;
    try { grip.setPointerCapture(e.pointerId); } catch (err) { /* capture is a nicety, not required */ }
  });
  function release() {
    if (!dragging) return;
    dragging = false;
    if (moved > 6) {
      var total = turn + spin;
      turn = Math.round(total / 180) * 180;
      spin = 0;
      announce();
    }
    last = performance.now();
  }
  grip.addEventListener('pointerup', release);
  grip.addEventListener('pointercancel', release);
  grip.addEventListener('click', function (e) {
    if (moved > 6) { e.preventDefault(); moved = 0; return; }
    flip(1);
  });
  card.addEventListener('keydown', function (e) {
    if (e.key === 'ArrowLeft') { e.preventDefault(); flip(-1); }
    if (e.key === 'ArrowRight') { e.preventDefault(); flip(1); }
  });
  $('flip').addEventListener('click', function () { flip(1); });
  $('print').addEventListener('click', function () { draw(); window.print(); });

  // A contact file (vCard) made in the browser from the details on the card. Nothing is sent anywhere.
  function vcard() {
    var esc = function (v) { return v.replace(/\\/g, '\\\\').replace(/\n/g, '\\n').replace(/,/g, '\\,').replace(/;/g, '\\;'); };
    var name = $('name').value.trim(), role = $('role').value.trim(), phone = $('phone').value.trim(), email = $('email').value.trim();
    var parts = name.split(/\s+/), family = parts.length > 1 ? parts.pop() : '', given = parts.join(' ');
    var tel = phone.replace(/[^0-9+]/g, '').replace(/^0/, '+44');
    var lines = ['BEGIN:VCARD', 'VERSION:3.0', 'N:' + esc(family) + ';' + esc(given) + ';;;', 'FN:' + esc(name), 'ORG:KK Tax'];
    if (role) lines.push('TITLE:' + esc(role));
    if (tel) lines.push('TEL;TYPE=CELL,VOICE:' + tel);
    if (email) lines.push('EMAIL;TYPE=WORK,INTERNET:' + esc(email));
    lines.push('URL:https://kktaxes.co.uk', 'END:VCARD');
    return { text: lines.join('\r\n') + '\r\n', file: (name || 'kk-tax').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') + '.vcf' };
  }
  $('contact').addEventListener('click', function () {
    wake();
    if (!$('name').value.trim()) { side.textContent = 'Add a name first'; $('name').focus(); return; }
    var v = vcard(), blob = new Blob([v.text], { type: 'text/vcard' });
    var a = document.createElement('a');
    a.href = URL.createObjectURL(blob); a.download = v.file;
    document.body.appendChild(a); a.click(); a.remove();
    setTimeout(function () { URL.revokeObjectURL(a.href); }, 60000);
  });
})();
