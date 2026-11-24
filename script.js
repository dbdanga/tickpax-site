/* ================================================================
   TickPax Website — script.js
   Navigation, scroll effects, form validation, animations
   ================================================================ */

(function () {
  'use strict';

  // ── Utility ──────────────────────────────────────────────────────
  function $(selector, parent) {
    return (parent || document).querySelector(selector);
  }
  function $$(selector, parent) {
    return Array.from((parent || document).querySelectorAll(selector));
  }

  // ── Nav scroll behaviour ──────────────────────────────────────────
  var navHeader = $('#nav-header');
  var lastScroll = 0;

  function handleNavScroll() {
    var scrollY = window.scrollY;
    if (scrollY > 20) {
      navHeader.classList.add('scrolled');
    } else {
      navHeader.classList.remove('scrolled');
    }
    lastScroll = scrollY;
  }

  window.addEventListener('scroll', handleNavScroll, { passive: true });
  handleNavScroll();

  // ── Mobile nav drawer ─────────────────────────────────────────────
  var navToggle = $('.nav-toggle');
  var navDrawer = $('#nav-drawer');

  function openDrawer() {
    navDrawer.classList.add('open');
    navDrawer.setAttribute('aria-hidden', 'false');
    navToggle.setAttribute('aria-expanded', 'true');
    document.body.style.overflow = 'hidden';
  }

  function closeDrawer() {
    navDrawer.classList.remove('open');
    navDrawer.setAttribute('aria-hidden', 'true');
    navToggle.setAttribute('aria-expanded', 'false');
    document.body.style.overflow = '';
  }

  if (navToggle && navDrawer) {
    navToggle.addEventListener('click', function () {
      var isOpen = navDrawer.classList.contains('open');
      if (isOpen) { closeDrawer(); } else { openDrawer(); }
    });

    // Close on nav link click
    $$('a', navDrawer).forEach(function (link) {
      link.addEventListener('click', closeDrawer);
    });

    // Close on escape
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && navDrawer.classList.contains('open')) {
        closeDrawer();
        navToggle.focus();
      }
    });

    // Close on outside click
    document.addEventListener('click', function (e) {
      if (
        navDrawer.classList.contains('open') &&
        !navDrawer.contains(e.target) &&
        !navToggle.contains(e.target)
      ) {
        closeDrawer();
      }
    });
  }

  // ── Smooth scroll for anchor links ───────────────────────────────
  $$('a[href^="#"]').forEach(function (anchor) {
    anchor.addEventListener('click', function (e) {
      var href = this.getAttribute('href');
      if (href === '#') return;
      var target = document.getElementById(href.slice(1));
      if (target) {
        e.preventDefault();
        target.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    });
  });

  // ── Scroll reveal ─────────────────────────────────────────────────
  function addRevealClasses() {
    var revealTargets = [
      '.problem-card',
      '.workflow-step',
      '.flow-node',
      '.feature-block',
      '.audience-card',
      '.loop-input',
      '.compare-col',
      '.era-signal-card',
      '.trust-item',
      '.fit-card',
      '.pricing-card',
      '.section-label',
      '.section-headline',
      '.section-sub',
    ];

    revealTargets.forEach(function (sel) {
      $$(sel).forEach(function (el, i) {
        if (!el.classList.contains('reveal')) {
          el.classList.add('reveal');
          var delay = Math.min(i * 1, 3);
          if (delay > 0) {
            el.classList.add('reveal-delay-' + delay);
          }
        }
      });
    });
  }

  function setupScrollReveal() {
    addRevealClasses();

    var observer = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) {
            entry.target.classList.add('visible');
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.12, rootMargin: '0px 0px -40px 0px' }
    );

    $$('.reveal').forEach(function (el) {
      observer.observe(el);
    });
  }

  if ('IntersectionObserver' in window) {
    setupScrollReveal();
  } else {
    // Fallback: show everything
    $$('.reveal').forEach(function (el) {
      el.classList.add('visible');
    });
  }

  // ── Footer year ───────────────────────────────────────────────────
  var yearEl = $('#footer-year');
  if (yearEl) {
    yearEl.textContent = new Date().getFullYear();
  }

  // ── Animated confidence bars (trigger on scroll) ──────────────────
  var confidenceBars = $$('.confidence-fill, .ib-fill, .ph-reasoning-bar, .roi-bar');
  var barObserver = new IntersectionObserver(
    function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          var el = entry.target;
          // ROI bars grow vertically (height); all others grow horizontally (width).
          var prop = el.classList.contains('roi-bar') ? 'height' : 'width';
          var target = el.style[prop] || '0%';
          el.style[prop] = '0%';
          // Small delay to trigger transition
          requestAnimationFrame(function () {
            requestAnimationFrame(function () {
              el.style[prop] = target;
            });
          });
          barObserver.unobserve(el);
        }
      });
    },
    { threshold: 0.5 }
  );

  confidenceBars.forEach(function (bar) {
    barObserver.observe(bar);
  });

  // ── Active nav link highlighting ──────────────────────────────────
  var sections = $$('section[id]');
  var navLinks = $$('.nav-links a');

  var sectionObserver = new IntersectionObserver(
    function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          var id = entry.target.getAttribute('id');
          navLinks.forEach(function (link) {
            var href = link.getAttribute('href');
            if (href === '#' + id) {
              link.style.color = 'var(--color-white)';
            } else {
              link.style.color = '';
            }
          });
        }
      });
    },
    { threshold: 0.4 }
  );

  sections.forEach(function (section) {
    sectionObserver.observe(section);
  });

  // ── Dashboard proposal accept interaction ────────────────────────
  $$('.p-accept').forEach(function (btn) {
    btn.addEventListener('click', function () {
      var row = btn.closest('.proposal-row');
      if (row) {
        row.style.opacity = '0.4';
        row.style.pointerEvents = 'none';
        btn.textContent = '✓ Accepted';
        btn.style.background = 'rgba(16,185,129,0.3)';

        // Update pending count
        var badge = $('.proposals-badge');
        if (badge) {
          var count = parseInt(badge.textContent, 10);
          if (!isNaN(count) && count > 0) {
            var next = count - 1;
            badge.textContent = next + ' pending';
            if (next === 0) {
              badge.style.background = 'rgba(16,185,129,0.15)';
              badge.style.color = 'var(--color-success)';
              badge.textContent = 'All reviewed';
            }
          }
        }
      }
    });
  });

})();
