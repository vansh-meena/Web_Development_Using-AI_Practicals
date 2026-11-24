"use strict";

/* ==========================================================================
   DOM Lab — ten widgets in plain JavaScript.
   init() sets everything up on DOMContentLoaded; teardown() undoes all of it.
   ========================================================================== */

// --- Shared state so teardown() can stop everything init() started --------

let clockInterval = null;   // widget 1
let rafId = null;           // widget 6
let observer = null;        // widget 10
let lastFocusedElement = null; // widget 7 — button to restore focus to
let activeFilter = "all";   // widget 3 — current category
let activeSort = "newest";  // widget 4 — current sort order
let progressStartTime = null; // widget 6 — rAF timestamp

// DOM API: AbortController — every listener below is registered with this
// signal, so one abort() call in teardown() removes them all at once.
const listenerController = new AbortController();
const { signal } = listenerController;

// DOM API: document.addEventListener — entry points.
document.addEventListener("DOMContentLoaded", init);
// teardown only on pagehide — NOT on load — so init() state survives.
window.addEventListener("pagehide", teardown);

function init() {
  startClock();
  startStatCounters();
  setupThemeToggle();
  setupToast();
  setupProjectControls();
  setupClickCounter();
  setupProgressBar();
  setupModal();
  setupAccordion();
  setupNewsletterForm();
  setupScrollReveal();
}

function teardown() {
  listenerController.abort();
  // DOM API: clearInterval / cancelAnimationFrame / IntersectionObserver.disconnect()
  if (clockInterval !== null) { clearInterval(clockInterval); clockInterval = null; }
  if (rafId !== null) { cancelAnimationFrame(rafId); rafId = null; }
  if (observer !== null) { observer.disconnect(); observer = null; }

  // Reset the state init() changed so a fresh init() starts clean.
  document.body.removeAttribute("data-theme");
  const themeToggle = document.querySelector('[data-js="theme-toggle"]');
  if (themeToggle) {
    themeToggle.textContent = "Dark theme";
    themeToggle.setAttribute("aria-pressed", "false");
  }
  const overlay = document.querySelector('[data-js="modal-overlay"]');
  if (overlay) overlay.hidden = true;
  const startBtn = document.querySelector('[data-js="progress-start"]');
  if (startBtn) startBtn.disabled = false;
  document.querySelectorAll(".accordion-panel").forEach((panel) => panel.classList.remove("is-open"));
}

/* ==========================================================================
   Shared helpers
   ========================================================================== */

// Every widget calls this guard before attaching a listener, so a missing
// element can never throw on null.
function requireEl(el) {
  return el !== null && el !== undefined;
}

/* ==========================================================================
   Widget 1 — live clock and time-based greeting
   ========================================================================== */

// DOM API: setInterval + Element.textContent + Date / String.padStart()
function startClock() {
  const clockEl = document.querySelector('[data-js="clock"]');
  const greetingEl = document.querySelector('[data-js="greeting"]');
  if (!requireEl(clockEl) || !requireEl(greetingEl)) return;

  function updateClock() {
    const now = new Date();
    const hours = String(now.getHours()).padStart(2, "0");
    const minutes = String(now.getMinutes()).padStart(2, "0");
    const seconds = String(now.getSeconds()).padStart(2, "0");
    clockEl.textContent = `${hours}:${minutes}:${seconds}`;
  }

  function updateGreeting() {
    const hour = new Date().getHours();
    if (hour < 12) {
      greetingEl.textContent = "Good morning";
    } else if (hour < 18) {
      greetingEl.textContent = "Good afternoon";
    } else {
      greetingEl.textContent = "Good evening";
    }
  }

  updateClock();
  updateGreeting();
  clockInterval = setInterval(updateClock, 1000);
}

/* ==========================================================================
   Widget 1b — stat counters that count up with requestAnimationFrame
   ========================================================================== */

// DOM API: requestAnimationFrame — animate each stat from 0 to its data-target.
function startStatCounters() {
  const stats = document.querySelectorAll('[data-js="stat"]');
  if (stats.length === 0) return;

  const DURATION_MS = 1200;

  function animateStat(el, startTime) {
    const target = Number(el.dataset.target) || 0;
    const suffix = el.dataset.suffix || "";
    const elapsed = startTime === null ? 0 : performance.now() - startTime;
    const percent = Math.min(elapsed / DURATION_MS, 1);
    const eased = 1 - Math.pow(1 - percent, 3);
    el.textContent = String(Math.round(eased * target)) + suffix;

    if (percent < 1) {
      requestAnimationFrame(() => animateStat(el, startTime === null ? performance.now() : startTime));
    }
  }

  stats.forEach((el) => {
    requestAnimationFrame(() => animateStat(el, null));
  });
}

/* ==========================================================================
   Widget 2 — light/dark theme toggle
   ========================================================================== */

// DOM API: Element.setAttribute() — flips data-theme on the page wrapper;
// CSS custom properties defined for each theme value do the visual work.
function setupThemeToggle() {
  const toggle = document.querySelector('[data-js="theme-toggle"]');
  if (!requireEl(toggle)) return;

  toggle.addEventListener("click", () => {
    const current = document.body.getAttribute("data-theme");
    const next = current === "dark" ? "light" : "dark";
    document.body.setAttribute("data-theme", next);
    toggle.setAttribute("aria-pressed", next === "dark" ? "true" : "false");
    toggle.textContent = next === "dark" ? "Light theme" : "Dark theme";
  }, { signal });
}

/* ==========================================================================
   Widget 2b — toast: slides in from a corner for 2.5s, then removes itself
   ========================================================================== */

// DOM APIs: createElement() + textContent() + Element.remove()
function setupToast() {
  const toastBtn = document.querySelector('[data-js="toast-btn"]');
  const toastRegion = document.querySelector('[data-js="toast-region"]');
  if (!requireEl(toastBtn) || !requireEl(toastRegion)) return;

  toastBtn.addEventListener("click", () => {
    const toast = document.createElement("div");
    toast.className = "toast";
    toast.textContent = "Hello from plain JavaScript!";

    // textContent is safe here — it never parses the string as HTML.
    toastRegion.appendChild(toast);
    requestAnimationFrame(() => toast.classList.add("is-visible"));

    setTimeout(() => {
      toast.classList.remove("is-visible");
      setTimeout(() => toast.remove(), 300);
    }, 2500);
  }, { signal });
}

/* ==========================================================================
   Widgets 3 & 4 — project filter (pills) + live search + sort
   ========================================================================== */

// DOM API: event delegation — one click listener on the button container
// uses event.target.closest() to find which chip was clicked.
function setupProjectControls() {
  const filterContainer = document.querySelector('[data-js="filter-buttons"]');
  const searchInput = document.querySelector('[data-js="search"]');
  const sortSelect = document.querySelector('[data-js="sort-select"]');
  if (!requireEl(filterContainer)) return;

  filterContainer.addEventListener("click", (event) => {
    const button = event.target.closest("[data-filter]");
    if (!button) return;

    activeFilter = button.dataset.filter;
    filterContainer.querySelectorAll("[data-filter]").forEach((chip) => {
      const isSelected = chip === button;
      chip.classList.toggle("is-active", isSelected);
      chip.setAttribute("aria-pressed", isSelected ? "true" : "false");
    });
    applyProjectControls();
  }, { signal });

  if (requireEl(searchInput)) {
    searchInput.addEventListener("input", applyProjectControls, { signal });
  }
  if (requireEl(sortSelect)) {
    sortSelect.addEventListener("change", () => {
      activeSort = sortSelect.value;
      applyProjectControls();
    }, { signal });
  }
}

// DOM API: Node.textContent (read) + Element.classList.toggle() —
// category, search text and sort order all drive the visible card list.
function applyProjectControls() {
  const grid = document.querySelector('[data-js="project-grid"]');
  const noResults = document.querySelector('[data-js="no-results"]');
  const searchInput = document.querySelector('[data-js="search"]');
  if (!requireEl(grid)) return;

  const query = searchInput ? searchInput.value.trim().toLowerCase() : "";
  const cards = Array.from(grid.querySelectorAll('[data-js="project-card"]'));
  let visibleCount = 0;

  // Filter first, then sort what survives, then append in the new order.
  const visibleCards = cards.filter((card) => {
    const matchesCategory = activeFilter === "all" || card.dataset.category === activeFilter;
    const title = card.querySelector(".card-title").textContent.toLowerCase();
    const description = card.querySelector(".card-desc").textContent.toLowerCase();
    const matchesSearch = title.includes(query) || description.includes(query);
    return matchesCategory && matchesSearch;
  });

  if (activeSort === "az") {
    visibleCards.sort((a, b) => a.dataset.title.localeCompare(b.dataset.title));
  } else {
    visibleCards.sort((a, b) => b.dataset.date.localeCompare(a.dataset.date));
  }

  cards.forEach((card) => card.classList.add("is-hidden"));
  visibleCards.forEach((card) => {
    card.classList.remove("is-hidden");
    grid.appendChild(card);
    visibleCount++;
  });

  if (noResults) noResults.hidden = visibleCount !== 0;
}

/* ==========================================================================
   Widget 5 — click counter
   ========================================================================== */

// DOM API: addEventListener("click") + textContent (write)
function setupClickCounter() {
  const button = document.querySelector('[data-js="counter-btn"]');
  const valueEl = document.querySelector('[data-js="counter-value"]');
  if (!requireEl(button) || !requireEl(valueEl)) return;

  let count = 0;
  button.addEventListener("click", () => {
    count++;
    valueEl.textContent = String(count);
  }, { signal });
}

/* ==========================================================================
   Widget 6 — progress bar animated with requestAnimationFrame
   ========================================================================== */

// DOM API: requestAnimationFrame / cancelAnimationFrame + setAttribute
function setupProgressBar() {
  const bar = document.querySelector('[data-js="progress-bar"]');
  const fill = document.querySelector('[data-js="progress-fill"]');
  const startBtn = document.querySelector('[data-js="progress-start"]');
  const resetBtn = document.querySelector('[data-js="progress-reset"]');
  if (!requireEl(bar) || !requireEl(fill) || !requireEl(startBtn) || !requireEl(resetBtn)) return;

  const DURATION_MS = 3000;

  function animate(timestamp) {
    if (progressStartTime === null) progressStartTime = timestamp;
    const elapsed = timestamp - progressStartTime;
    const percent = Math.min(Math.round((elapsed / DURATION_MS) * 100), 100);

    fill.style.width = `${percent}%`;
    bar.setAttribute("aria-valuenow", String(percent));

    if (percent < 100) {
      rafId = requestAnimationFrame(animate);
    } else {
      rafId = null;
      progressStartTime = null;
      startBtn.disabled = false;
    }
  }

  startBtn.addEventListener("click", () => {
    if (rafId !== null) return;
    startBtn.disabled = true;
    progressStartTime = null;
    rafId = requestAnimationFrame(animate);
  }, { signal });

  resetBtn.addEventListener("click", () => {
    cancelAnimationFrame(rafId);
    rafId = null;
    progressStartTime = null;
    fill.style.width = "0%";
    bar.setAttribute("aria-valuenow", "0");
    startBtn.disabled = false;
  }, { signal });
}

/* ==========================================================================
   Widget 7 — accessible modal with focus trap (three trigger buttons)
   ========================================================================== */

// DOM APIs: .focus(), document.activeElement, KeyboardEvent.key
function setupModal() {
  const overlay = document.querySelector('[data-js="modal-overlay"]');
  const modal = document.querySelector('[data-js="modal"]');
  const closeBtn = document.querySelector('[data-js="modal-close"]');
  const openButtons = document.querySelectorAll('[data-js="modal-open"]');
  if (!requireEl(overlay) || !requireEl(modal) || !requireEl(closeBtn) || openButtons.length === 0) return;

  const titleEl = modal.querySelector('[data-js="modal-title"]');
  const bodyEl = modal.querySelector('[data-js="modal-body"]');

  function openModal(trigger) {
    lastFocusedElement = trigger;
    // textContent is safe here — modal copy comes from static HTML attributes.
    if (titleEl) titleEl.textContent = trigger.dataset.modalTitle || "";
    if (bodyEl) bodyEl.textContent = trigger.dataset.modalBody || "";
    overlay.hidden = false;
    closeBtn.focus();
  }

  function closeModal() {
    overlay.hidden = true;
    if (lastFocusedElement) lastFocusedElement.focus();
  }

  // Event delegation across all three open buttons.
  openButtons.forEach((btn) => {
    btn.addEventListener("click", () => openModal(btn), { signal });
  });
  closeBtn.addEventListener("click", closeModal, { signal });

  // Backdrop click: only close when the overlay itself (not the dialog) is hit.
  overlay.addEventListener("click", (event) => {
    if (event.target === overlay) closeModal();
  }, { signal });

  // Keyboard: Escape closes, Tab is trapped inside the dialog.
  document.addEventListener("keydown", (event) => {
    if (overlay.hidden) return;

    if (event.key === "Escape") {
      event.preventDefault();
      closeModal();
    }

    if (event.key === "Tab") {
      const focusables = modal.querySelectorAll("button, a[href], input, [tabindex]:not([tabindex='-1'])");
      if (focusables.length === 0) return;
      const first = focusables[0];
      const last = focusables[focusables.length - 1];

      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    }
  }, { signal });
}

/* ==========================================================================
   Widget 8 — accordion (event delegation on the container)
   ========================================================================== */

// DOM API: Element.getAttribute() / setAttribute() + hidden property
function setupAccordion() {
  const accordion = document.querySelector('[data-js="accordion"]');
  if (!requireEl(accordion)) return;

  accordion.addEventListener("click", (event) => {
    const header = event.target.closest("[aria-expanded]");
    if (!header || !accordion.contains(header)) return;

    const panel = document.getElementById(header.getAttribute("aria-controls"));
    if (!panel) return;

    const isOpen = header.getAttribute("aria-expanded") === "true";
    header.setAttribute("aria-expanded", isOpen ? "false" : "true");
    panel.hidden = isOpen;
    // .is-open drives the CSS max-height slide; hidden is for semantics.
    panel.classList.toggle("is-open", !isOpen);
  }, { signal });
}

/* ==========================================================================
   Widget 9 — newsletter form with inline validation
   ========================================================================== */

// DOM APIs: Event.preventDefault(), form.reset(), aria-invalid + aria-live
function setupNewsletterForm() {
  const form = document.querySelector('[data-js="newsletter-form"]');
  if (!requireEl(form)) return;

  const nameInput = form.querySelector('[data-js="newsletter-name"]');
  const emailInput = form.querySelector('[data-js="newsletter-email"]');
  const nameError = form.querySelector('[data-js="newsletter-name-error"]');
  const emailError = form.querySelector('[data-js="newsletter-email-error"]');
  const successMessage = form.querySelector('[data-js="newsletter-success"]');
  const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  function showError(input, errorEl, message) {
    errorEl.textContent = message;
    input.setAttribute("aria-invalid", message ? "true" : "false");
  }

  function validateName() {
    const value = nameInput.value.trim();
    if (!value) {
      showError(nameInput, nameError, "Please enter your name.");
      return false;
    }
    showError(nameInput, nameError, "");
    return true;
  }

  function validateEmail() {
    const value = emailInput.value.trim();
    if (!value) {
      showError(emailInput, emailError, "Please enter your email address.");
      return false;
    }
    if (!emailPattern.test(value)) {
      showError(emailInput, emailError, "Please enter a valid email address.");
      return false;
    }
    showError(emailInput, emailError, "");
    return true;
  }

  nameInput.addEventListener("blur", validateName, { signal });
  emailInput.addEventListener("blur", validateEmail, { signal });

  form.addEventListener("submit", (event) => {
    event.preventDefault();

    const nameOk = validateName();
    const emailOk = validateEmail();
    if (!nameOk || !emailOk) {
      successMessage.hidden = true;
      return;
    }

    // textContent is safe here — it never parses the value as HTML.
    successMessage.textContent = `Thanks for subscribing, ${nameInput.value.trim()}!`;
    successMessage.hidden = false;
    form.reset();
  }, { signal });
}

/* ==========================================================================
   Widget 10 — scroll reveal with IntersectionObserver
   ========================================================================== */

// DOM API: IntersectionObserver — watch each card, reveal it once, unobserve.
function setupScrollReveal() {
  const revealCards = document.querySelectorAll('[data-js="reveal"]');
  if (revealCards.length === 0) return;

  observer = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add("is-visible");
        observer.unobserve(entry.target);
      }
    });
  }, { threshold: 0.15 });

  revealCards.forEach((card) => observer.observe(card));
}
