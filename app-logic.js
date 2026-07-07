/* ==========================================================================
   JavaScript Logic & State Management
   Vanilla JS, no dependencies. Demonstrates a small, framework-free state
   management pattern (observable store) plus practical features that pair
   with the earlier HTML/CSS files: theme toggling, form validation, and
   dynamic rendering driven entirely by state changes.
   ========================================================================== */

"use strict";

/* --------------------------------------------------------------------------
   1. Minimal Observable Store
   A tiny pub/sub state container. Components "subscribe" to state changes
   instead of manually querying and mutating the DOM everywhere — the same
   core idea behind Redux/Zustand, without the library.
   -------------------------------------------------------------------------- */
function createStore(initialState) {
  let state = { ...initialState };
  const listeners = new Set();

  function getState() {
    return state;
  }

  // Accepts a partial update object OR a function of (prevState) => partial
  function setState(update) {
    const partial = typeof update === "function" ? update(state) : update;
    state = { ...state, ...partial };
    listeners.forEach((listener) => listener(state));
  }

  function subscribe(listener) {
    listeners.add(listener);
    return () => listeners.delete(listener); // unsubscribe function
  }

  return { getState, setState, subscribe };
}

/* --------------------------------------------------------------------------
   2. Application State
   Single source of truth for this page. Everything on screen is a
   reflection of this object — nothing is read from the DOM as "truth".
   -------------------------------------------------------------------------- */
const store = createStore({
  theme: localStorage.getItem("theme") || "light",
  contactForm: {
    name: "",
    email: "",
    message: "",
    errors: {},
    submitted: false,
  },
  messages: [], // list of previously "sent" messages, for demo rendering
});

/* --------------------------------------------------------------------------
   3. Theme Toggle
   Persists to localStorage and updates a data attribute that the CSS
   file's [data-theme="dark"] selector reads.
   -------------------------------------------------------------------------- */
function initThemeToggle() {
  const toggleBtn = document.querySelector("[data-theme-toggle]");
  if (!toggleBtn) return;

  applyTheme(store.getState().theme);

  toggleBtn.addEventListener("click", () => {
    const next = store.getState().theme === "dark" ? "light" : "dark";
    store.setState({ theme: next });
  });

  store.subscribe((state) => applyTheme(state.theme));
}

function applyTheme(theme) {
  document.documentElement.setAttribute("data-theme", theme);
  localStorage.setItem("theme", theme);

  const toggleBtn = document.querySelector("[data-theme-toggle]");
  if (toggleBtn) {
    toggleBtn.setAttribute("aria-pressed", theme === "dark");
    toggleBtn.textContent = theme === "dark" ? "Switch to light mode" : "Switch to dark mode";
  }
}

/* --------------------------------------------------------------------------
   4. Form State & Validation
   Validation runs on submit and on blur, writing errors into state rather
   than directly manipulating error DOM nodes from inside the validators.
   -------------------------------------------------------------------------- */
const validators = {
  name: (value) => (value.trim().length < 2 ? "Please enter your full name." : ""),
  email: (value) =>
    /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value) ? "" : "Please enter a valid email address.",
  message: (value) => (value.trim().length < 10 ? "Message must be at least 10 characters." : ""),
};

function validateField(field, value) {
  return validators[field] ? validators[field](value) : "";
}

function validateAll(formState) {
  const errors = {};
  for (const field of Object.keys(validators)) {
    const error = validateField(field, formState[field]);
    if (error) errors[field] = error;
  }
  return errors;
}

function initContactForm() {
  const form = document.querySelector("#contact-form");
  if (!form) return;

  const fields = ["name", "email", "message"];

  // Update state as the user types (controlled-input pattern)
  fields.forEach((field) => {
    const input = form.querySelector(`[name="${field}"]`);
    if (!input) return;

    input.addEventListener("input", (e) => {
      store.setState((prev) => ({
        contactForm: { ...prev.contactForm, [field]: e.target.value },
      }));
    });

    input.addEventListener("blur", (e) => {
      const error = validateField(field, e.target.value);
      store.setState((prev) => ({
        contactForm: {
          ...prev.contactForm,
          errors: { ...prev.contactForm.errors, [field]: error },
        },
      }));
    });
  });

  form.addEventListener("submit", (e) => {
    e.preventDefault();
    const current = store.getState().contactForm;
    const errors = validateAll(current);

    if (Object.keys(errors).length > 0) {
      store.setState({ contactForm: { ...current, errors } });
      // Move focus to the first invalid field for accessibility
      const firstErrorField = Object.keys(errors)[0];
      form.querySelector(`[name="${firstErrorField}"]`)?.focus();
      return;
    }

    store.setState((prev) => ({
      contactForm: { name: "", email: "", message: "", errors: {}, submitted: true },
      messages: [...prev.messages, { ...current, sentAt: new Date().toISOString() }],
    }));
    form.reset();
  });

  // Re-render error messages and live status whenever state changes
  store.subscribe((state) => renderFormErrors(form, state.contactForm.errors));
  store.subscribe((state) => renderMessageList(state.messages));
}

function renderFormErrors(form, errors) {
  ["name", "email", "message"].forEach((field) => {
    const errorEl = form.querySelector(`[data-error-for="${field}"]`);
    const input = form.querySelector(`[name="${field}"]`);
    if (!errorEl || !input) return;

    errorEl.textContent = errors[field] || "";
    input.setAttribute("aria-invalid", Boolean(errors[field]));
  });
}

/* --------------------------------------------------------------------------
   5. Rendering Derived UI (messages list)
   The list is fully rebuilt from state on every change — simple and
   predictable for small lists; for large lists you'd diff instead.
   -------------------------------------------------------------------------- */
function renderMessageList(messages) {
  const list = document.querySelector("#message-list");
  const status = document.querySelector("#form-status");
  if (!list) return;

  list.innerHTML = "";
  messages
    .slice()
    .reverse()
    .forEach((msg) => {
      const li = document.createElement("li");
      li.className = "card";
      li.innerHTML = `
        <p class="card-title">${escapeHtml(msg.name)}</p>
        <p class="card-body">${escapeHtml(msg.message)}</p>
      `;
      list.appendChild(li);
    });

  if (status && messages.length > 0) {
    status.textContent = "Message sent. Thank you!";
  }
}

// Prevents user input from being interpreted as HTML (basic XSS guard)
function escapeHtml(str) {
  const div = document.createElement("div");
  div.textContent = str;
  return div.innerHTML;
}

/* --------------------------------------------------------------------------
   6. Debounce / Throttle Utilities
   Common performance helpers for scroll, resize, and input-heavy handlers.
   -------------------------------------------------------------------------- */
function debounce(fn, delay = 200) {
  let timeoutId;
  return function debounced(...args) {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => fn.apply(this, args), delay);
  };
}

function throttle(fn, limit = 200) {
  let waiting = false;
  return function throttled(...args) {
    if (waiting) return;
    fn.apply(this, args);
    waiting = true;
    setTimeout(() => (waiting = false), limit);
  };
}

/* --------------------------------------------------------------------------
   7. Init
   -------------------------------------------------------------------------- */
document.addEventListener("DOMContentLoaded", () => {
  initThemeToggle();
  initContactForm();
});
