/*!
 * HAIR TECHNIQUE — main.js
 * Vanilla JS, no dependencies. Pairs with the black/white spiral stylesheet.
 * Motion is CSS-driven (transform + opacity); JS only toggles state.
 */
(function () {
  'use strict';

  /* ============================================================
     1. Helpers
     ============================================================ */
  var motionQuery = window.matchMedia('(prefers-reduced-motion: reduce)');

  function reducedMotion() {
    return motionQuery.matches;
  }

  function $(selector, scope) {
    return (scope || document).querySelector(selector);
  }

  function $$(selector, scope) {
    return Array.prototype.slice.call((scope || document).querySelectorAll(selector));
  }

  /* ============================================================
     2. Navbar: solid background after scrolling
     ============================================================ */
  function initNavbar() {
    var navbar = $('#navbar');
    if (!navbar) { return; }

    var ticking = false;

    function update() {
      navbar.classList.toggle('scrolled', window.scrollY > 40);
      ticking = false;
    }

    window.addEventListener('scroll', function () {
      if (!ticking) {
        ticking = true;
        window.requestAnimationFrame(update);
      }
    }, { passive: true });

    update();
  }

  /* ============================================================
     3. Mobile navigation (overlay, scroll lock, Escape, focus)
     ============================================================ */
  function initMobileNav() {
    var hamburger = $('#hamburger');
    var mobileNav = $('#mobileNav');
    var closeBtn  = $('#mobileNavClose');
    if (!hamburger || !mobileNav) { return; }

    function setOpen(open) {
      mobileNav.classList.toggle('open', open);
      document.body.style.overflow = open ? 'hidden' : '';
      hamburger.setAttribute('aria-expanded', String(open));
      if (open && closeBtn) { closeBtn.focus(); }
      if (!open) { hamburger.focus(); }
    }

    hamburger.addEventListener('click', function () { setOpen(true); });
    if (closeBtn) { closeBtn.addEventListener('click', function () { setOpen(false); }); }

    $$('a', mobileNav).forEach(function (link) {
      link.addEventListener('click', function () {
        mobileNav.classList.remove('open');
        document.body.style.overflow = '';
        hamburger.setAttribute('aria-expanded', 'false');
      });
    });

    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && mobileNav.classList.contains('open')) { setOpen(false); }
    });

    // Close the overlay if the window grows to desktop width
    window.addEventListener('resize', function () {
      if (window.innerWidth > 768 && mobileNav.classList.contains('open')) {
        mobileNav.classList.remove('open');
        document.body.style.overflow = '';
        hamburger.setAttribute('aria-expanded', 'false');
      }
    });
  }

  /* ============================================================
     4. Anchor links: smooth scroll offset by the fixed navbar
     ============================================================ */
  function initAnchors() {
    var navbar = $('#navbar');

    $$('a[href^="#"]').forEach(function (anchor) {
      anchor.addEventListener('click', function (e) {
        var id = anchor.getAttribute('href');
        if (!id || id.length < 2) { return; }

        var target = $(id);
        if (!target) { return; }

        e.preventDefault();
        var offset = navbar ? navbar.offsetHeight : 0;
        var top = target.getBoundingClientRect().top + window.pageYOffset - offset;

        window.scrollTo({ top: top, behavior: reducedMotion() ? 'auto' : 'smooth' });

        if (history.pushState) { history.pushState(null, '', id); }
        if (!target.hasAttribute('tabindex')) { target.setAttribute('tabindex', '-1'); }
        target.focus({ preventScroll: true });
      });
    });
  }

  /* ============================================================
     5. Scroll reveal (IntersectionObserver, one-shot)
     ============================================================ */
  function initReveal() {
    var items = $$('.reveal');
    if (!items.length) { return; }

    if (reducedMotion() || !('IntersectionObserver' in window)) {
      items.forEach(function (el) { el.classList.add('visible'); });
      return;
    }

    var observer = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add('visible');
          observer.unobserve(entry.target);
        }
      });
    }, { threshold: 0.12, rootMargin: '0px 0px -48px 0px' });

    items.forEach(function (el) { observer.observe(el); });
  }

  /* ============================================================
     6. FAQ accordion (one open at a time, height from content)
     ============================================================ */
  function initFAQ() {
    var items = $$('.faq-item');
    if (!items.length) { return; }

    function setState(item, open) {
      var question = $('.faq-question', item);
      var answer   = $('.faq-answer', item);
      if (!question || !answer) { return; }

      item.classList.toggle('open', open);
      question.setAttribute('aria-expanded', String(open));
      // Inline height overrides the stylesheet's fixed max-height so long answers never clip
      answer.style.maxHeight = open ? answer.scrollHeight + 'px' : '';
    }

    items.forEach(function (item) {
      var question = $('.faq-question', item);
      if (!question) { return; }

      question.addEventListener('click', function () {
        var willOpen = !item.classList.contains('open');
        items.forEach(function (other) {
          if (other !== item) { setState(other, false); }
        });
        setState(item, willOpen);
      });
    });

    // Keep an open answer the right height if the layout reflows
    window.addEventListener('resize', function () {
      items.forEach(function (item) {
        var answer = $('.faq-answer', item);
        if (answer && item.classList.contains('open')) {
          answer.style.maxHeight = answer.scrollHeight + 'px';
        }
      });
    });
  }

  /* ============================================================
     7. Animated counters
     ============================================================ */
  function initCounters() {
    var counters = $$('.counter');
    if (!counters.length) { return; }

    function format(el, value, decimals) {
      el.textContent = (el.dataset.prefix || '') + value.toFixed(decimals) + (el.dataset.suffix || '');
    }

    function run(el) {
      var raw      = el.dataset.target || '0';
      var target   = parseFloat(raw);
      var decimals = raw.indexOf('.') > -1 ? raw.split('.')[1].length : 0;

      if (reducedMotion()) { format(el, target, decimals); return; }

      var duration = 1800;
      var start = null;

      function step(timestamp) {
        if (start === null) { start = timestamp; }
        var progress = Math.min((timestamp - start) / duration, 1);
        var eased = 1 - Math.pow(1 - progress, 3); // easeOutCubic
        format(el, target * eased, decimals);
        if (progress < 1) { window.requestAnimationFrame(step); }
      }

      window.requestAnimationFrame(step);
    }

    if (!('IntersectionObserver' in window)) {
      counters.forEach(function (el) {
        format(el, parseFloat(el.dataset.target || '0'), 0);
      });
      return;
    }

    var observer = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) { return; }
        observer.unobserve(entry.target);
        run(entry.target);
      });
    }, { threshold: 0.5 });

    counters.forEach(function (el) { observer.observe(el); });
  }

  /* ============================================================
     8. Hero spiral: only animate while the hero is on screen
     ============================================================ */
  function initHeroSpiral() {
    var hero   = $('.hero');
    var spiral = $('.hero__spiral');
    if (!hero || !spiral || !('IntersectionObserver' in window)) { return; }

    var observer = new IntersectionObserver(function (entries) {
      spiral.style.animationPlayState = entries[0].isIntersecting ? 'running' : 'paused';
    }, { threshold: 0 });

    observer.observe(hero);
  }

  /* ============================================================
     9. Motion toggle (user pause for spiral + marquee)
     ============================================================ */
  function initMotionToggle() {
    var btn = $('#motionToggle');
    if (!btn) { return; }

    // The OS setting already stops all motion, so the control isn't needed
    if (reducedMotion()) { btn.hidden = true; return; }

    var label = $('.motion-label', btn);
    var icon  = $('i', btn);
    var paused = false;

    function render() {
      document.body.classList.toggle('motion-reduced', paused);
      btn.setAttribute('aria-pressed', String(paused));
      if (label) { label.textContent = paused ? 'Play motion' : 'Pause motion'; }
      if (icon)  { icon.className = paused ? 'fa-solid fa-play' : 'fa-solid fa-pause'; }
    }

    btn.addEventListener('click', function () {
      paused = !paused;
      render();
    });

    render();
  }

  /* ============================================================
     10. Newsletter form (validation + status message)
     ============================================================ */
  function initNewsletter() {
    var form = $('#newsletterForm');
    if (!form) { return; }

    var input  = $('.newsletter-input', form);
    var button = $('button[type="submit"]', form);
    if (!input || !button) { return; }

    var status = document.createElement('p');
    status.setAttribute('role', 'status');
    status.style.cssText = 'width:100%;font-size:.9rem;font-weight:700;margin-top:8px;';
    form.appendChild(status);

    var emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    form.addEventListener('submit', function (e) {
      e.preventDefault();
      var email = input.value.trim();

      if (!emailPattern.test(email)) {
        input.setAttribute('aria-invalid', 'true');
        status.textContent = 'Enter a valid email address.';
        input.focus();
        return;
      }

      input.removeAttribute('aria-invalid');
      button.disabled = true;

      // TODO: replace with a real endpoint (Mailchimp, Brevo, your own form handler)
      // fetch('/subscribe', { method: 'POST', body: JSON.stringify({ email: email }) })
      status.textContent = 'You\u2019re subscribed. Check your inbox for your 10% off code.';
      input.value = '';

      window.setTimeout(function () {
        button.disabled = false;
        status.textContent = '';
      }, 6000);
    });

    input.addEventListener('input', function () {
      input.removeAttribute('aria-invalid');
      status.textContent = '';
    });
  }

  /* ============================================================
     11. Init
     ============================================================ */
  function init() {
    initNavbar();
    initMobileNav();
    initAnchors();
    initReveal();
    initFAQ();
    initCounters();
    initHeroSpiral();
    initMotionToggle();
    initNewsletter();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
