# JavaScript Logic & State Management

A vanilla JavaScript file demonstrating a small, framework-free state management pattern (observable store), plus practical features that pair with the earlier HTML/CSS project files: theme toggling, controlled-form validation, and state-driven rendering.

## Files

- `app-logic.js` — self-contained script, no dependencies, no build step

## Architecture overview

| Section | Purpose |
|---|---|
| Observable Store | Tiny pub/sub state container — the core Redux/Zustand idea without the library |
| Application State | Single source of truth (theme, form fields, errors, message history) |
| Theme Toggle | Persists to `localStorage`, syncs a `data-theme` attribute the CSS reads |
| Form State & Validation | Controlled inputs, validation on blur + submit, accessible error handling |
| Rendering | Message list rebuilt from state on every change |
| Utilities | `debounce` and `throttle` helpers for performance-sensitive handlers |
| Init | Wires everything up on `DOMContentLoaded` |

## Key concepts

- **Single source of truth** — the DOM never holds state directly; every visible element reflects the `store`'s current state
- **Pub/sub updates** — `store.subscribe(listener)` re-renders only the parts of the UI that care about a given change, instead of one big re-render function
- **Controlled inputs** — form fields write to state on every keystroke (`input` event) rather than being read only at submit time
- **Validation as pure functions** — each field has an independent `validators[field]` function, easy to test or extend
- **Accessible error handling** — invalid fields get `aria-invalid="true"`, error text goes into a linked element, and focus moves to the first invalid field after a failed submit
- **XSS-safe rendering** — user-entered text is passed through `escapeHtml()` before being inserted into the DOM
- **Debounce vs. throttle** — `debounce` delays until input stops (good for search-as-you-type); `throttle` guarantees a max call rate (good for scroll/resize)

## How to use

Include the script and add the matching markup hooks:

```html
<button data-theme-toggle aria-pressed="false">Switch to dark mode</button>

<form id="contact-form" novalidate>
  <input name="name" required>
  <span data-error-for="name"></span>

  <input name="email" type="email" required>
  <span data-error-for="email"></span>

  <textarea name="message" required></textarea>
  <span data-error-for="message"></span>

  <button type="submit">Send</button>
</form>

<div id="form-status" role="status"></div>
<ul id="message-list"></ul>

<script src="app-logic.js"></script>
```

## Extending the store

Add new state by extending the initial object passed to `createStore`, then read/write it the same way as existing fields:

```js
store.setState({ myNewField: "value" });
store.subscribe((state) => console.log(state.myNewField));
```

For larger apps, split state into separate stores per feature area rather than growing one flat object indefinitely.

## Browser support

Uses only standard ES2017+ features (`const`/`let`, arrow functions, spread syntax, template literals, `Set`). No transpilation needed for current-generation browsers.

## Related

- `semantic-accessibility-demo.html` — semantic structure & accessibility demo
- `advanced-responsive.css` — responsive CSS architecture (provides the `.card`, `[data-theme="dark"]` styles this script targets)
