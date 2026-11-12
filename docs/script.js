// Papula website: language switch, rotating phone, day-of-learning steps, alphabet explorer, small motion.
// The ALPHABET_DATA block below is rebuilt from the app's own letters by scripts/build-site-alphabet.cjs.
const ALPHABET_DATA = {
  "ئـ": { word: "ئاو", en: "Water", img: "assets/letters/023-droplet.webp" },
  "ا": { word: "ئاگر", en: "Fire", img: "assets/letters/031-fire.webp" },
  "ب": { word: "باران", en: "Rain", img: "assets/letters/012-cloud-with-rain.webp" },
  "پ": { word: "پشیلە", en: "Cat", img: "assets/letters/016-cat-face.webp" },
  "ت": { word: "تۆپ", en: "Ball", img: "assets/letters/025-soccer-ball.webp" },
  "ج": { word: "جووجەڵە", en: "Chick", img: "assets/letters/078-front-facing-baby-chick.webp" },
  "چ": { word: "چاو", en: "Eye", img: "assets/letters/024-eye.webp" },
  "ح": { word: "حەوز", en: "Fish Pond", img: "assets/letters/013-fish.webp" },
  "خ": { word: "خۆر", en: "Sun", img: "assets/letters/006-black-sun-with-rays.webp" },
  "د": { word: "دار", en: "Tree", img: "assets/letters/005-deciduous-tree.webp" },
  "ر": { word: "باران", en: "Rain", img: "assets/letters/012-cloud-with-rain.webp" },
  "ڕ": { word: "ڕێگا", en: "Road / Path", img: "assets/letters/040-railway-track.webp" },
  "ز": { word: "زەنگ", en: "Bell", img: "assets/letters/038-bell.webp" },
  "ژ": { word: "ژوژک", en: "Hedgehog", img: "assets/letters/083-hedgehog.webp" },
  "س": { word: "سێو", en: "Apple", img: "assets/letters/003-red-apple.webp" },
  "ش": { word: "شێر", en: "Lion", img: "assets/letters/004-lion-face.webp" },
  "ع": { word: "عەلی", en: "Ali", img: "assets/letters/115-child.webp" },
  "غ": { word: "سپێناغ", en: "Spinach", img: "assets/letters/151-herb.webp" },
  "ف": { word: "فڕۆکە", en: "Airplane", img: "assets/letters/085-airplane.webp" },
  "ڤ": { word: "ڤیدیۆ", en: "Cartoon Video", img: "assets/letters/087-clapper-board.webp" },
  "ق": { word: "قەڵەم", en: "Pencil / Pen", img: "assets/letters/030-pencil.webp" },
  "ک": { word: "کەروێشک", en: "Rabbit", img: "assets/letters/015-rabbit-face.webp" },
  "گ": { word: "گوڵ", en: "Flower", img: "assets/letters/035-rose.webp" },
  "ل": { word: "لیمۆ", en: "Lemon", img: "assets/letters/026-lemon.webp" },
  "ڵ": { word: "ماڵ", en: "Home", img: "assets/letters/019-house-with-garden.webp" },
  "م": { word: "ماسی", en: "Goldfish", img: "assets/letters/070-tropical-fish.webp" },
  "ن": { word: "نان", en: "Bread", img: "assets/letters/008-baguette-bread.webp" },
  "و": { word: "ورچ", en: "Bear", img: "assets/letters/007-bear-face.webp" },
  "ۆ": { word: "کۆتر", en: "Dove", img: "assets/letters/051-dove-of-peace.webp" },
  "وو": { word: "دوو", en: "Number Two", img: "assets/letters/065-victory-hand.webp" },
  "ھ": { word: "هەنگوین", en: "Honey", img: "assets/letters/010-honey-pot.webp" },
  "ە": { word: "دەرگا", en: "Door", img: "assets/letters/044-door.webp" },
  "ی": { word: "یاری", en: "Game / Play", img: "assets/letters/021-video-game.webp" },
  "ێ": { word: "سێو", en: "Tasty Apple", img: "assets/letters/003-red-apple.webp" }
};

(function () {
  'use strict';
  var doc = document, root = doc.documentElement;
  var reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  root.classList.add('js');

  /* ---------- Language: every element with data-en keeps its Kurdish original in data-ku ---------- */
  var nodes = doc.querySelectorAll('[data-en]');
  nodes.forEach(function (el) { el.setAttribute('data-ku', el.innerHTML); });
  function setLang(lang) {
    root.lang = lang === 'en' ? 'en' : 'ckb';
    root.dir = lang === 'en' ? 'ltr' : 'rtl';
    nodes.forEach(function (el) { el.innerHTML = el.getAttribute(lang === 'en' ? 'data-en' : 'data-ku'); });
    doc.querySelectorAll('.lang button').forEach(function (b) { b.setAttribute('aria-pressed', String(b.dataset.lang === lang)); });
    doc.querySelectorAll('[data-only]').forEach(function (el) { el.hidden = el.dataset.only !== lang; });
    doc.querySelectorAll('img[data-src-en]').forEach(function (img) { img.src = lang === 'en' ? img.dataset.srcEn : img.dataset.srcKu; });
    var t = doc.querySelector('title');
    if (t && t.dataset.en) t.textContent = lang === 'en' ? t.dataset.en : t.dataset.ku;
    try { localStorage.setItem('papula_lang', lang); } catch (e) {}
    renderInspect();
  }
  var title = doc.querySelector('title');
  if (title && title.dataset.en) title.dataset.ku = title.textContent;
  var saved = 'ku';
  try { saved = localStorage.getItem('papula_lang') || 'ku'; } catch (e) {}

  /* ---------- Mobile menu ---------- */
  var menu = doc.querySelector('.menu-btn'), nav = doc.querySelector('.nav');
  if (menu && nav) {
    menu.addEventListener('click', function () { var o = nav.classList.toggle('open'); menu.setAttribute('aria-expanded', String(o)); });
    nav.addEventListener('click', function (e) { if (e.target.tagName === 'A') { nav.classList.remove('open'); menu.setAttribute('aria-expanded', 'false'); } });
  }

  /* ---------- Hero phone: screens fade into each other ---------- */
  var shots = doc.querySelectorAll('.stage .screen img');
  if (shots.length > 1 && !reduce) {
    var i = 0;
    setInterval(function () { shots[i].classList.remove('on'); i = (i + 1) % shots.length; shots[i].classList.add('on'); }, 3200);
  }

  /* ---------- A day with Papula: pick a step, the phone shows it ---------- */
  var steps = doc.querySelectorAll('.step'), dayShots = doc.querySelectorAll('.day-phone .screen img');
  function pick(n) {
    steps.forEach(function (s, k) { s.setAttribute('aria-selected', String(k === n)); });
    dayShots.forEach(function (im, k) { im.classList.toggle('on', k === n); });
  }
  steps.forEach(function (s, k) { s.addEventListener('click', function () { pick(k); stopAuto(); }); s.addEventListener('mouseenter', function () { pick(k); }); });
  var auto = null, cur = 0;
  function stopAuto() { if (auto) { clearInterval(auto); auto = null; } }
  if (steps.length) { pick(0); if (!reduce) auto = setInterval(function () { cur = (cur + 1) % steps.length; pick(cur); }, 4200); }

  /* ---------- Alphabet explorer ---------- */
  var box = doc.getElementById('tiles'), bigEl = doc.getElementById('inspectLetter'), wordEl = doc.getElementById('inspectWord'), enEl = doc.getElementById('inspectEn'), imgEl = doc.getElementById('inspectImg');
  var current = 'ب';
  function renderInspect() {
    if (!box || !ALPHABET_DATA[current]) return;
    var d = ALPHABET_DATA[current];
    bigEl.textContent = current; wordEl.textContent = d.word; enEl.textContent = d.en;
    imgEl.src = d.img; imgEl.alt = d.word;
    box.querySelectorAll('.tile').forEach(function (t) { t.setAttribute('aria-pressed', String(t.textContent === current)); });
  }
  if (box) {
    Object.keys(ALPHABET_DATA).forEach(function (ch) {
      var b = doc.createElement('button'); b.type = 'button'; b.className = 'tile'; b.textContent = ch; b.setAttribute('aria-label', ch + ' - ' + ALPHABET_DATA[ch].word);
      b.addEventListener('click', function () {
        current = ch; renderInspect();
        if (!reduce) { imgEl.style.transform = 'scale(.7) rotate(-8deg)'; setTimeout(function () { imgEl.style.transform = ''; }, 30); }
      });
      box.appendChild(b);
    });
  }

  /* ---------- Reveal on scroll (content stays visible if this never runs) ---------- */
  var rev = doc.querySelectorAll('.reveal');
  if ('IntersectionObserver' in window && !reduce) {
    var io = new IntersectionObserver(function (es) { es.forEach(function (e) { if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); } }); }, { threshold: 0.12 });
    rev.forEach(function (el) { io.observe(el); });
  } else { rev.forEach(function (el) { el.classList.add('in'); }); }

  doc.querySelectorAll('.lang button').forEach(function (b) { b.addEventListener('click', function () { setLang(b.dataset.lang); }); });
  var y = doc.getElementById('year'); if (y) y.textContent = new Date().getFullYear();
  setLang(saved);
})();

// The phone download bar shows once the first screen has been scrolled past, and hides again near the end card.
(function () {
  var bar = document.getElementById('stick'), hero = document.getElementById('top'), end = document.querySelector('.get');
  if (!bar || !hero) return;
  function update() {
    var past = hero.getBoundingClientRect().bottom < 0;
    var atEnd = end && end.getBoundingClientRect().top < window.innerHeight * 0.7;
    bar.classList.toggle('on', past && !atEnd);
  }
  window.addEventListener('scroll', update, { passive: true }); window.addEventListener('resize', update); update();
})();
