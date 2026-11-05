// ==========================================================================
// Papula (پەپوولە) - Website Interactive Scripts
// Bilingual switcher, tab navigation, and mobile menu
// ==========================================================================

document.addEventListener('DOMContentLoaded', () => {
  // 1. Language Toggle & Preference
  const currentLang = localStorage.getItem('papula_lang') || 'ku';
  setLanguage(currentLang);

  document.querySelectorAll('.lang-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const lang = btn.getAttribute('data-set-lang');
      setLanguage(lang);
    });
  });

  // 2. Tab Switcher for Legal Pages (Kurdish / English)
  const tabBtns = document.querySelectorAll('.tab-btn');
  tabBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      const target = btn.getAttribute('data-tab');
      
      tabBtns.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');

      document.querySelectorAll('.tab-content').forEach(content => {
        if (content.id === target) {
          content.style.display = 'block';
        } else {
          content.style.display = 'none';
        }
      });
    });
  });

  // 3. Mobile Navigation Menu Toggle
  const mobileBtn = document.querySelector('.mobile-menu-btn');
  const navLinks = document.querySelector('.nav-links');

  if (mobileBtn && navLinks) {
    mobileBtn.addEventListener('click', () => {
      const isVisible = navLinks.style.display === 'flex';
      navLinks.style.display = isVisible ? 'none' : 'flex';
      if (!isVisible) {
        navLinks.style.flexDirection = 'column';
        navLinks.style.position = 'absolute';
        navLinks.style.top = '80px';
        navLinks.style.left = '0';
        navLinks.style.right = '0';
        navLinks.style.background = '#FFFDF8';
        navLinks.style.padding = '20px';
        navLinks.style.boxShadow = '0 10px 20px rgba(0,0,0,0.08)';
        navLinks.style.borderBottom = '1px solid #F1E8DB';
      }
    });
  }
});

function setLanguage(lang) {
  localStorage.setItem('papula_lang', lang);
  const html = document.documentElement;

  if (lang === 'en') {
    html.setAttribute('lang', 'en');
    html.setAttribute('dir', 'ltr');
  } else {
    html.setAttribute('lang', 'ku');
    html.setAttribute('dir', 'rtl');
  }

  // Update button active state
  document.querySelectorAll('.lang-btn').forEach(btn => {
    if (btn.getAttribute('data-set-lang') === lang) {
      btn.classList.add('active');
    } else {
      btn.classList.remove('active');
    }
  });

  // Show/Hide bilingual blocks
  document.querySelectorAll('[data-lang]').forEach(el => {
    if (el.getAttribute('data-lang') === lang) {
      el.style.display = el.tagName === 'SPAN' ? 'inline' : (el.tagName === 'DIV' || el.tagName === 'SECTION' || el.tagName === 'P' ? 'block' : '');
    } else {
      el.style.display = 'none';
    }
  });
}
