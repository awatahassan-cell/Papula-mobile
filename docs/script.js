// ==========================================================================
// Papula (پەپوولە) - Interactive Engine
// Kurdish Alphabet Explorer, Bilingual Modes, and Navigation
// ==========================================================================

// Kurdish Alphabet Showcase Data (Letter, Example Word, English, 3D Picture)
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
  "ع": { word: "عەینەک", en: "Glasses", img: "assets/letters/043-eyeglasses.webp" },
  "غ": { word: "غەزال", en: "Little Gazelle", img: "assets/letters/014-deer.webp" },
  "ف": { word: "فڕۆکە", en: "Airplane", img: "assets/letters/085-airplane.webp" },
  "ڤ": { word: "ڤیدیۆ", en: "Cartoon Video", img: "assets/letters/087-clapper-board.webp" },
  "ق": { word: "قەڵەم", en: "Pencil / Pen", img: "assets/letters/030-pencil.webp" },
  "ک": { word: "کەرۆشک", en: "Rabbit", img: "assets/letters/015-rabbit-face.webp" },
  "گ": { word: "گوڵ", en: "Flower", img: "assets/letters/035-rose.webp" },
  "ل": { word: "لێمۆ", en: "Lemon", img: "assets/letters/026-lemon.webp" },
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

document.addEventListener('DOMContentLoaded', () => {
  // 1. Interactive Alphabet Explorer
  const tilesContainer = document.getElementById('alphabetTiles');
  const inspectLetter = document.getElementById('inspectLetter');
  const inspectWord = document.getElementById('inspectWord');
  const inspectEn = document.getElementById('inspectEn');
  const inspectImg = document.getElementById('inspectImg');

  if (tilesContainer) {
    const letters = Object.keys(ALPHABET_DATA);
    tilesContainer.innerHTML = '';

    letters.forEach((char, index) => {
      const tile = document.createElement('div');
      tile.className = 'letter-tile' + (index === 2 ? ' active' : ''); // 'ب' active by default
      tile.innerHTML = `<span class="char">${char}</span>`;

      tile.addEventListener('click', () => {
        document.querySelectorAll('.letter-tile').forEach(t => t.classList.remove('active'));
        tile.classList.add('active');

        const item = ALPHABET_DATA[char];
        if (item) {
          inspectLetter.textContent = char;
          inspectWord.textContent = item.word;
          inspectEn.textContent = item.en;
          inspectImg.src = item.img;
          inspectImg.alt = item.word;

          // Gentle animation
          inspectImg.style.transform = 'scale(0.8) rotate(-8deg)';
          setTimeout(() => {
            inspectImg.style.transition = 'transform 0.3s cubic-bezier(0.34, 1.56, 0.64, 1)';
            inspectImg.style.transform = 'scale(1) rotate(0deg)';
          }, 30);
        }
      });

      tilesContainer.appendChild(tile);
    });
  }

  // 2. Language Switcher (Kurdish / English)
  const savedLang = localStorage.getItem('papula_lang') || 'ku';
  applyLanguage(savedLang);

  document.querySelectorAll('.lang-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const lang = btn.getAttribute('data-set-lang');
      applyLanguage(lang);
    });
  });

  // 3. Tab Switcher for Legal Pages (Privacy Policy & Terms)
  const tabBtns = document.querySelectorAll('.tab-btn');
  tabBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      const targetId = btn.getAttribute('data-tab');
      tabBtns.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');

      document.querySelectorAll('.tab-content').forEach(panel => {
        panel.style.display = panel.id === targetId ? 'block' : 'none';
      });
    });
  });

  // 4. Mobile Navigation Menu Toggle
  const mobileToggle = document.querySelector('.mobile-toggle');
  const navMenu = document.querySelector('.nav-menu');

  if (mobileToggle && navMenu) {
    mobileToggle.addEventListener('click', () => {
      const isOpen = navMenu.style.display === 'flex';
      navMenu.style.display = isOpen ? 'none' : 'flex';
      if (!isOpen) {
        navMenu.style.flexDirection = 'column';
        navMenu.style.position = 'absolute';
        navMenu.style.top = '86px';
        navMenu.style.left = '20px';
        navMenu.style.right = '20px';
        navMenu.style.background = '#FFFFFF';
        navMenu.style.padding = '20px';
        navMenu.style.boxShadow = '0 16px 36px rgba(0,0,0,0.12)';
        navMenu.style.borderRadius = '24px';
        navMenu.style.border = '1px solid #E2D9CE';
      }
    });
  }
});

function applyLanguage(lang) {
  localStorage.setItem('papula_lang', lang);
  const html = document.documentElement;

  if (lang === 'en') {
    html.setAttribute('lang', 'en');
    html.setAttribute('dir', 'ltr');
  } else {
    html.setAttribute('lang', 'ku');
    html.setAttribute('dir', 'rtl');
  }

  // Update button active class
  document.querySelectorAll('.lang-btn').forEach(btn => {
    if (btn.getAttribute('data-set-lang') === lang) {
      btn.classList.add('active');
    } else {
      btn.classList.remove('active');
    }
  });

  // Show/Hide translated elements
  document.querySelectorAll('[data-lang]').forEach(el => {
    if (el.getAttribute('data-lang') === lang) {
      el.style.display = el.tagName === 'SPAN' ? 'inline' : (el.tagName === 'DIV' || el.tagName === 'P' || el.tagName === 'H1' || el.tagName === 'H2' || el.tagName === 'H3' ? 'block' : '');
    } else {
      el.style.display = 'none';
    }
  });
}
