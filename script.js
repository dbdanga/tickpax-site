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

  // ── Early Access Form ─────────────────────────────────────────────
  var form = $('#early-access-form');
  var formSuccess = $('#form-success');

  function getField(id) { return document.getElementById(id); }
  function getError(id) { return document.getElementById(id + '-error'); }

  function setError(fieldId, message) {
    var field = getField(fieldId);
    var error = getError(fieldId);
    if (field) { field.classList.add('error'); field.setAttribute('aria-describedby', fieldId + '-error'); }
    if (error) { error.textContent = message; }
  }

  function clearError(fieldId) {
    var field = getField(fieldId);
    var error = getError(fieldId);
    if (field) { field.classList.remove('error'); field.removeAttribute('aria-describedby'); }
    if (error) { error.textContent = ''; }
  }

  function validateEmail(email) {
    // Basic RFC-compliant email check — not exhaustive but sufficient for a lead form
    return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email);
  }

  function validateForm() {
    var valid = true;

    var nameVal = (getField('ea-name') || {}).value || '';
    if (!nameVal.trim()) {
      setError('ea-name', 'Please enter your name.');
      valid = false;
    } else {
      clearError('ea-name');
    }

    var companyVal = (getField('ea-company') || {}).value || '';
    if (!companyVal.trim()) {
      setError('ea-company', 'Please enter your company name.');
      valid = false;
    } else {
      clearError('ea-company');
    }

    var emailVal = (getField('ea-email') || {}).value || '';
    if (!emailVal.trim()) {
      setError('ea-email', 'Please enter your work email.');
      valid = false;
    } else if (!validateEmail(emailVal.trim())) {
      setError('ea-email', 'Please enter a valid email address.');
      valid = false;
    } else {
      clearError('ea-email');
    }

    return valid;
  }

  if (form) {
    // Live validation on blur
    ['ea-name', 'ea-company', 'ea-email'].forEach(function (id) {
      var field = getField(id);
      if (field) {
        field.addEventListener('blur', function () {
          validateForm();
        });
        field.addEventListener('input', function () {
          clearError(id);
        });
      }
    });

    form.addEventListener('submit', function (e) {
      e.preventDefault();

      if (!validateForm()) {
        // Focus the first error field
        var firstError = form.querySelector('.error');
        if (firstError) { firstError.focus(); }
        return;
      }

      // Collect form data
      var submitBtn = form.querySelector('[type="submit"]');
      if (submitBtn) {
        submitBtn.disabled = true;
        submitBtn.textContent = 'Submitting…';
      }

      // Simulate async submission (replace with actual endpoint)
      setTimeout(function () {
        form.style.display = 'none';
        if (formSuccess) {
          formSuccess.hidden = false;
          formSuccess.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
        }
      }, 800);
    });
  }

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

  // ── Live hero metrics ("at a glance") ─────────────────────────────
  // Every 1.3s: recovered hours +1, estimated value tracks hours × rate,
  // AI acceptance drifts within ±3 of its baseline.
  var metricHours = $('#metric-hours');
  var metricValue = $('#metric-value');
  var metricAccept = $('#metric-accept');

  if (metricHours && metricValue && metricAccept) {
    var hours = 1250;
    var ratePerHour = 100;          // 1,250h × $100 = $125,000 baseline
    var acceptBaseline = 87;        // drifts to 84–90

    setInterval(function () {
      hours += 1;
      metricHours.textContent = hours.toLocaleString('en-US');
      metricValue.textContent = '$' + (hours * ratePerHour).toLocaleString('en-US');

      var drift = Math.floor(Math.random() * 7) - 3; // -3..+3
      var accept = acceptBaseline + drift;
      if (accept < 0) { accept = 0; }
      if (accept > 100) { accept = 100; }
      metricAccept.textContent = accept;
    }, 1300);
  }

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
