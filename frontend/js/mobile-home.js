/* ============================================================
   Curfee Organic Market — Mobile Home JS
   Hero slider, product scroll rendering, bottom nav
   ============================================================ */

// ===== HERO SLIDER =====
(function() {
  const track = document.getElementById('mHeroTrack');
  const dots = document.querySelectorAll('.m-dot');
  if (!track || !dots.length) return;

  let current = 0;
  const total = track.children.length;

  function goToSlide(i) {
    current = i;
    track.style.transform = `translateX(-${current * 100}%)`;
    dots.forEach((d, idx) => d.classList.toggle('active', idx === current));
  }

  dots.forEach(d => d.addEventListener('click', () => goToSlide(+d.dataset.slide)));

  // Auto slide every 4 seconds
  let autoTimer = setInterval(() => goToSlide((current + 1) % total), 4000);

  // Pause on touch
  track.addEventListener('touchstart', () => clearInterval(autoTimer));
  track.addEventListener('touchend', () => {
    autoTimer = setInterval(() => goToSlide((current + 1) % total), 4000);
  });

  // Swipe support
  let startX = 0;
  track.addEventListener('touchstart', e => { startX = e.touches[0].clientX; }, { passive: true });
  track.addEventListener('touchend', e => {
    const diff = startX - e.changedTouches[0].clientX;
    if (diff > 50) goToSlide(Math.min(current + 1, total - 1));
    else if (diff < -50) goToSlide(Math.max(current - 1, 0));
  }, { passive: true });
})();

// ===== RENDER PRODUCTS INTO HORIZONTAL SCROLL =====
// Override the default grid rendering for mobile homepage
(function() {
  // Wait for home.js to load fallback products
  setTimeout(function() {
    // Re-render product grids as horizontal scrolls
    const grids = document.querySelectorAll('.m-product-scroll');
    grids.forEach(grid => {
      // Products are already rendered by home.js; 
      // Just ensure they fit the scroll layout
      const cards = grid.querySelectorAll('.product-card');
      cards.forEach(card => {
        card.style.minWidth = '';
        card.style.maxWidth = '';
      });
    });
  }, 500);
})();

// ===== BOTTOM NAV HIGHLIGHT =====
(function() {
  const currentPage = window.location.pathname.split('/').pop() || 'index.html';
  const navItems = document.querySelectorAll('.m-bnav-item');
  navItems.forEach(item => {
    const href = item.getAttribute('href');
    if (href === currentPage || (currentPage === '' && href === 'index.html')) {
      item.classList.add('active');
    } else {
      item.classList.remove('active');
    }
  });
})();

// ===== HEADER SCROLL EFFECT =====
(function() {
  const header = document.getElementById('mHeader');
  if (!header) return;
  let lastScroll = 0;
  
  window.addEventListener('scroll', () => {
    const y = window.scrollY;
    if (y > 150 && y > lastScroll) {
      header.style.transform = 'translateY(-100%)';
      header.style.transition = 'transform 0.3s ease';
    } else {
      header.style.transform = 'translateY(0)';
    }
    lastScroll = y;
  }, { passive: true });
})();

// ===== LOCATION DETECT =====
(function() {
  const locSpan = document.getElementById('userLocation');
  if (!locSpan) return;
  
  locSpan.parentElement?.addEventListener('click', (e) => {
    e.preventDefault();
    if ('geolocation' in navigator) {
      locSpan.textContent = 'Detecting...';
      navigator.geolocation.getCurrentPosition(
        pos => { locSpan.textContent = `${pos.coords.latitude.toFixed(2)}, ${pos.coords.longitude.toFixed(2)}`; },
        () => { locSpan.textContent = 'India'; }
      );
    }
  });
})();
