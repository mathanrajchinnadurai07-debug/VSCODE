/* ============================================================
   branding.js — Global Website Branding Engine
   Reads branding configuration from localStorage (ce_branding)
   and applies it across every page: colors, names, taglines.
   ============================================================ */
(function() {
  'use strict';

  const DEFAULTS = {
    companyName:    'Curfee',
    companyFull:    'Curfee Organic Market',
    tagline:        'Explore Organic',
    logoEmoji:      '🌿',
    primaryColor:   '#2d6a4f',
    primaryLight:   '#52b788',
    primaryPale:    '#d8f3dc',
    accentColor:    '#f77f00',
    headerBg:       '#ffffff',
    footerText:     '© 2024 Curfee Organic Market. Made with 🌿 in India',
    helplineNumber: '+91 78457 44038',
    supportEmail:   'curfee01@gmail.com',
    whatsappNumber: '+91 78457 44038',
  };

  function getBranding() {
    try {
      const stored = JSON.parse(localStorage.getItem('ce_branding'));
      return Object.assign({}, DEFAULTS, stored || {});
    } catch { return Object.assign({}, DEFAULTS); }
  }

  function applyBranding() {
    const b = getBranding();

    // 1. Inject CSS custom properties
    const root = document.documentElement;
    root.style.setProperty('--primary',       b.primaryColor);
    root.style.setProperty('--primary-light',  b.primaryLight);
    root.style.setProperty('--primary-pale',   b.primaryPale);
    root.style.setProperty('--accent',         b.accentColor);

    // 2. Replace branded text elements
    document.querySelectorAll('[data-brand]').forEach(el => {
      const key = el.getAttribute('data-brand');
      if (key === 'name')        el.textContent = b.companyName;
      if (key === 'full-name')   el.textContent = b.companyFull;
      if (key === 'tagline')     el.textContent = b.tagline;
      if (key === 'logo-emoji')  el.textContent = b.logoEmoji;
      if (key === 'footer')      el.textContent = b.footerText;
      if (key === 'helpline')    el.textContent = b.helplineNumber;
      if (key === 'email')       el.textContent = b.supportEmail;
      if (key === 'whatsapp')    el.textContent = b.whatsappNumber;
    });

    // 3. Update href for tel: and mailto: links
    document.querySelectorAll('[data-brand-href="helpline"]').forEach(el => {
      el.href = 'tel:' + b.helplineNumber.replace(/\s/g, '');
    });
    document.querySelectorAll('[data-brand-href="email"]').forEach(el => {
      el.href = 'mailto:' + b.supportEmail;
    });
    document.querySelectorAll('[data-brand-href="whatsapp"]').forEach(el => {
      el.href = 'https://wa.me/' + b.whatsappNumber.replace(/[^0-9]/g, '');
    });

    // 4. Update page title
    const titleEl = document.querySelector('title');
    if (titleEl && titleEl.dataset.brandTitle) {
      titleEl.textContent = titleEl.dataset.brandTitle.replace('{name}', b.companyFull);
    }
  }

  // Run on DOM ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', applyBranding);
  } else {
    applyBranding();
  }

  // Expose globally so admin can trigger re-apply after saving
  window.applyBranding = applyBranding;
  window.getBranding = getBranding;
  window.BRANDING_DEFAULTS = DEFAULTS;

  // Floating WhatsApp Button removed per request (now only in chat)

})();
