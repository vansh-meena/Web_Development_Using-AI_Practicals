/* =========================================================
   Vansh — Portfolio interactions
   Plain vanilla JS. No dependencies.
   ========================================================= */

/* ---------- Config ---------- */
// Replace this with your real Formspree endpoint ID.
const FORMSPREE_ENDPOINT = "https://formspree.io/f/YOUR_FORM_ID";

/* ---------- Respect reduced motion ---------- */
const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

/* ---------- 1. Typing effect (hero) ---------- */
(function typingEffect() {
  if (prefersReducedMotion) return;

  const el = document.getElementById("typed");
  if (!el) return;

  const roles = [
    "Android Developer",
    "Kotlin Enthusiast",
    "Mobile App Builder",
    "CS Undergraduate",
  ];

  let roleIndex = 0;
  let charIndex = 0;
  let deleting = false;

  function tick() {
    const current = roles[roleIndex];

    if (!deleting) {
      charIndex++;
      el.textContent = current.slice(0, charIndex);
      if (charIndex === current.length) {
        deleting = true;
        return setTimeout(tick, 1600);
      }
      return setTimeout(tick, 75);
    }

    charIndex--;
    el.textContent = current.slice(0, charIndex);
    if (charIndex === 0) {
      deleting = false;
      roleIndex = (roleIndex + 1) % roles.length;
      return setTimeout(tick, 350);
    }
    setTimeout(tick, 40);
  }

  tick();
})();

/* ---------- 2. Mobile nav toggle ---------- */
(function mobileNav() {
  const toggle = document.getElementById("navToggle");
  const links = document.getElementById("navLinks");
  if (!toggle || !links) return;

  function close() {
    links.classList.remove("is-open");
    toggle.classList.remove("is-open");
    toggle.setAttribute("aria-expanded", "false");
  }

  toggle.addEventListener("click", () => {
    const open = links.classList.toggle("is-open");
    toggle.classList.toggle("is-open", open);
    toggle.setAttribute("aria-expanded", String(open));
  });

  // Close menu when a link is clicked
  links.querySelectorAll(".nav__link").forEach((link) =>
    link.addEventListener("click", close)
  );

  // Close on outside click
  document.addEventListener("click", (e) => {
    if (!links.contains(e.target) && !toggle.contains(e.target)) close();
  });
})();

/* ---------- 3. Active section highlighting ---------- */
(function activeSection() {
  const navLinks = Array.from(document.querySelectorAll(".nav__link"));
  const sections = navLinks
    .map((link) => document.querySelector(link.getAttribute("href")))
    .filter(Boolean);

  if (!sections.length) return;

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        const id = "#" + entry.target.id;
        navLinks.forEach((link) =>
          link.classList.toggle("is-active", link.getAttribute("href") === id)
        );
      });
    },
    { rootMargin: "-45% 0px -50% 0px", threshold: 0 }
  );

  sections.forEach((section) => observer.observe(section));
})();

/* ---------- 4. Reveal on scroll ---------- */
(function revealOnScroll() {
  const items = document.querySelectorAll(".reveal");
  if (!items.length) return;

  if (prefersReducedMotion || !("IntersectionObserver" in window)) {
    items.forEach((el) => el.classList.add("is-visible"));
    return;
  }

  const observer = new IntersectionObserver(
    (entries, obs) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add("is-visible");
          obs.unobserve(entry.target);
        }
      });
    },
    { rootMargin: "0px 0px -10% 0px", threshold: 0.12 }
  );

  items.forEach((el) => observer.observe(el));
})();

/* ---------- 5. Back to top ---------- */
(function backToTop() {
  const btn = document.getElementById("toTop");
  if (!btn) return;

  btn.addEventListener("click", () =>
    window.scrollTo({ top: 0, behavior: prefersReducedMotion ? "auto" : "smooth" })
  );
})();

/* ---------- 6. Contact form ---------- */
(function contactForm() {
  const form = document.getElementById("contactForm");
  if (!form) return;

  const nameEl = document.getElementById("name");
  const emailEl = document.getElementById("email");
  const messageEl = document.getElementById("message");
  const nameErr = document.getElementById("nameError");
  const emailErr = document.getElementById("emailError");
  const messageErr = document.getElementById("messageError");
  const status = document.getElementById("formStatus");
  const submitBtn = document.getElementById("submitBtn");

  const emailRe = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  function setError(input, errorEl, msg) {
    errorEl.textContent = msg;
    input.classList.toggle("is-invalid", Boolean(msg));
    return !msg;
  }

  function validate() {
    const okName = setError(nameEl, nameErr, nameEl.value.trim() ? "" : "Please enter your name.");
    const okEmail = setError(
      emailEl,
      emailErr,
      emailRe.test(emailEl.value.trim()) ? "" : "Please enter a valid email."
    );
    const okMsg = setError(
      messageEl,
      messageErr,
      messageEl.value.trim().length >= 5 ? "" : "Message must be at least 5 characters."
    );
    return okName && okEmail && okMsg;
  }

  // Clear error on input
  [nameEl, emailEl, messageEl].forEach((el) =>
    el.addEventListener("input", () => el.classList.remove("is-invalid"))
  );

  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    status.textContent = "";
    status.className = "form__status";

    if (!validate()) {
      status.textContent = "Please fix the highlighted fields.";
      status.classList.add("is-err");
      return;
    }

    submitBtn.classList.add("is-loading");
    submitBtn.disabled = true;

    try {
      const res = await fetch(FORMSPREE_ENDPOINT, {
        method: "POST",
        headers: { Accept: "application/json" },
        body: new FormData(form),
      });

      if (res.ok) {
        status.textContent = "Thanks! Your message has been sent.";
        status.classList.add("is-ok");
        form.reset();
      } else {
        throw new Error("Request failed");
      }
    } catch (err) {
      status.textContent = "Something went wrong. Please try again or email me directly.";
      status.classList.add("is-err");
    } finally {
      submitBtn.classList.remove("is-loading");
      submitBtn.disabled = false;
    }
  });
})();
