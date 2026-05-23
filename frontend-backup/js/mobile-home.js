/* ============================================================
   Curfee Organic Market — Mobile Home JS
   Hero slider, product scroll rendering, bottom nav,
   Dynamic CMS content rendering from admin
   ============================================================ */

// ===== DYNAMIC CMS: Load admin-edited content =====
(function() {
  function ceGet(k, d) { try { return JSON.parse(localStorage.getItem('ce_' + k)) ?? d; } catch { return d; } }

  // --- Dynamic Banners ---
  const banners = ceGet('homepage_banners', null);
  if (banners && banners.length) {
    const track = document.getElementById('mHeroTrack');
    const dotsWrap = document.querySelector('.m-hero-dots');
    if (track) {
      track.innerHTML = banners.map(b =>
        `<div class="m-hero-card" style="background:${b.gradient};">` +
          `<div class="m-hero-text">` +
            `<span class="m-hero-tag">${b.tag}</span>` +
            `<h2>${b.title}</h2>` +
            `<p>${b.desc}</p>` +
            `<a href="${b.link}" class="m-hero-cta">${b.cta}</a>` +
          `</div>` +
          `<div class="m-hero-img">${b.emoji}</div>` +
        `</div>`
      ).join('');
    }
    if (dotsWrap) {
      dotsWrap.innerHTML = banners.map((_, i) =>
        `<span class="m-dot${i === 0 ? ' active' : ''}" data-slide="${i}"></span>`
      ).join('');
    }
  }

  // --- Dynamic Sponsored ---
  const sp = ceGet('homepage_sponsored', null);
  if (sp) {
    const spEl = document.querySelector('.m-sponsored-banner');
    if (spEl) {
      spEl.querySelector('.m-sponsored-text strong').textContent = sp.title;
      spEl.querySelector('.m-sponsored-text span').textContent = sp.sub;
      spEl.querySelector('.m-sponsored-btn').textContent = sp.btn;
      spEl.querySelector('.m-sponsored-btn').href = sp.link;
    }
  }

  // --- Dynamic Deal Cards ---
  const deals = ceGet('homepage_deals', null);
  if (deals && deals.length) {
    const dealGrids = document.querySelectorAll('.m-deal-grid');
    // Render deals in chunks of 4 across deal grids
    dealGrids.forEach((grid, gi) => {
      const chunk = deals.slice(gi * 4, gi * 4 + 4);
      if (chunk.length) {
        grid.innerHTML = chunk.map(d =>
          `<a href="${d.link}" class="m-deal-card" style="background:${d.gradient};">` +
            `<h3>${d.title}</h3>` +
            `<p class="m-deal-off">${d.offer}</p>` +
            `<div class="m-deal-img">${d.emojis}</div>` +
            `<span class="m-deal-link">Shop now</span>` +
          `</a>`
        ).join('');
      }
    });
  }

  // --- Dynamic Categories ---
  const cats = ceGet('categories', null);
  if (cats && cats.length) {
    const tabWrap = document.querySelector('.m-category-tabs');
    if (tabWrap) {
      tabWrap.innerHTML = cats.map((c, i) =>
        `<a href="${c.link}" class="m-cat-tab${i === 0 ? ' active' : ''}">` +
          `<div class="m-cat-tab-icon">${c.emoji}</div>` +
          `<span>${c.name}</span>` +
        `</a>`
      ).join('');
    }
  }
})();

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
