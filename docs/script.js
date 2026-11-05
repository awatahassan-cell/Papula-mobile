// ==========================================================================
// Papula (پەپوولە) - Interactive Engine
// Kurdish Alphabet Explorer, Bilingual Modes, and Navigation
// ==========================================================================

// Kurdish Alphabet Showcase Data (Letter, Example Word, English, 3D Picture)
const ALPHABET_DATA = {
  'ئـ': { word: 'ئەستێرە', en: 'Star', img: 'assets/001-white-medium-star.webp' },
  'ا': { word: 'ئاسک', en: 'Deer', img: 'assets/002-butterfly.webp' },
  'ب': { word: 'پەپوولە', en: 'Butterfly', img: 'assets/002-butterfly.webp' },
  'پ': { word: 'پەپوولە', en: 'Butterfly', img: 'assets/002-butterfly.webp' },
  'ت': { word: 'ترێ', en: 'Grapes', img: 'assets/045-grapes.webp' },
  'ج': { word: 'جووجەڵە', en: 'Chick', img: 'assets/007-bear-face.webp' },
  'چ': { word: 'چڵ', en: 'Blossom', img: 'assets/003-red-apple.webp' },
  'ح': { word: 'حەوز', en: 'Pool', img: 'assets/123-rainbow.webp' },
  'خ': { word: 'خۆر', en: 'Sun', img: 'assets/001-white-medium-star.webp' },
  'د': { word: 'دار', en: 'Tree', img: 'assets/003-red-apple.webp' },
  'ر': { word: 'ڕێوی', en: 'Fox', img: 'assets/011-fox-face.webp' },
  'ڕ': { word: 'ڕێوی', en: 'Fox', img: 'assets/011-fox-face.webp' },
  'ز': { word: 'زەوی', en: 'Earth', img: 'assets/002-butterfly.webp' },
  'ژ': { word: 'ژوور', en: 'Room', img: 'assets/007-bear-face.webp' },
  'س': { word: 'سێو', en: 'Apple', img: 'assets/003-red-apple.webp' },
  'ش': { word: 'شووتی', en: 'Watermelon', img: 'assets/099-watermelon.webp' },
  'ع': { word: 'عەینەک', en: 'Glasses', img: 'assets/001-white-medium-star.webp' },
  'غ': { word: 'غار', en: 'Cave', img: 'assets/007-bear-face.webp' },
  'ف': { word: 'فیل', en: 'Elephant', img: 'assets/029-elephant.webp' },
  'ڤ': { word: 'ڤیدیۆ', en: 'Video', img: 'assets/015-rabbit-face.webp' },
  'ق': { word: 'قاز', en: 'Goose', img: 'assets/013-fish.webp' },
  'ک': { word: 'کەروێشک', en: 'Rabbit', img: 'assets/015-rabbit-face.webp' },
  'گ': { word: 'گوڵ', en: 'Flower', img: 'assets/002-butterfly.webp' },
  'ل': { word: 'کەروێشک', en: 'Rabbit', img: 'assets/015-rabbit-face.webp' },
  'ڵ': { word: 'ماسی', en: 'Fish', img: 'assets/013-fish.webp' },
  'م': { word: 'مانگ', en: 'Moon', img: 'assets/009-crescent-moon.webp' },
  'ن': { word: 'نان', en: 'Bread', img: 'assets/003-red-apple.webp' },
  'و': { word: 'ورچ', en: 'Bear', img: 'assets/007-bear-face.webp' },
  'ۆ': { word: 'کۆلارە', en: 'Kite', img: 'assets/002-butterfly.webp' },
  'وو': { word: 'شووتی', en: 'Watermelon', img: 'assets/099-watermelon.webp' },
  'ھ': { word: 'هەنگوین', en: 'Honey', img: 'assets/010-honey-pot.webp' },
  'ە': { word: 'پەپوولە', en: 'Butterfly', img: 'assets/002-butterfly.webp' },
  'ی': { word: 'یاری', en: 'Game', img: 'assets/001-white-medium-star.webp' },
  'ێ': { word: 'سێو', en: 'Apple', img: 'assets/003-red-apple.webp' }
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
