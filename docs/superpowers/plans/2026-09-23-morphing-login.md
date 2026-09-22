# Morphing Login Experience Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the approved Apple-like morphing authentication experience, MoMA-style welcome canvas, and top-right Dynamic Island logout control.

**Architecture:** Keep the completed FastAPI `/api/member` module as the server seam. Split the vanilla Vite frontend into deep modules for HTTP authentication, pure state transitions, cancellable FLIP animation, and DOM orchestration. Authentication remains correct when motion is reduced, interrupted, or unavailable.

**Tech Stack:** FastAPI, SQLAlchemy, bcrypt, Pydantic, pytest, SQLite test adapter, Vite 7, semantic HTML, CSS custom properties, Web Animations API, Vitest, jsdom.

## Global Constraints

- Preserve unrelated worktree changes.
- Treat backend application code as read-only unless a failing integration test proves a narrowly scoped compatibility fix is required.
- Sign-up sends `name`, `email`, `password`; sign-in sends only `email`, `password`.
- Consume `{ ok, member, error }` from the existing server, including `email_taken` and `invalid_credentials`.
- Add no React, Tailwind, GSAP, Framer Motion, icon package, web font, or decorative image.
- Use canvas `#EFEEEC`, ink `#11110F`, night `#090909`, glass `rgba(15,15,15,.76)`, paper `#F4F3EF`, muted `#A7A7A2`, accent `#D95C4F`, error `#E06B5F`.
- Animate transform and opacity for frequent transitions; never depend on animation completion for correctness.
- Support reduced motion, browser zoom, keyboard navigation, password paste/autofill, and 44px controls.
- Verify 375×812, 844×390, 768×1024, and 1440×900 without horizontal scroll.
- Use no emoji.

## File Map

- Verify the completed backend in `backend/app/routers/member.py`, `backend/app/core/{session,security}.py`, `backend/app/{models,schemas}.py`, and `backend/tests/test_member.py`.
- Run the existing backend tests without rewriting routes, database, session, security, or startup modules.
- Create `frontend/src/auth/{auth-api,auth-state,auth-app}.js` with matching tests.
- Create `frontend/src/motion/morph-surface.js` with tests.
- Replace `frontend/src/main.js` and `frontend/src/style.css`; simplify `frontend/index.html`.
- Modify frontend dependency manifests and create `README.md`.

---

### Task 1: Verify the Existing Backend Contract Without Changing It

**Files:**
- Verify: `backend/app/main.py`, `backend/app/routers/member.py`, `backend/app/core/session.py`, `backend/app/core/security.py`
- Verify: `backend/app/models.py`, `backend/app/schemas.py`, `backend/tests/conftest.py`, `backend/tests/test_member.py`
- Modify: `frontend/vite.config.js`

**Interface:** `{ ok: boolean, member: { name, email } | null, error: string | null }` from `POST /api/member` and `GET`, `PUT`, `DELETE /api/member/auth`.

- [ ] **Step 1: Run the existing contract suite**

```bash
cd backend
source dev.sh
pip install -qr requirements-dev.txt
pytest tests/test_member.py -v
```

Expected: 11 passed, covering duplicate email, neutral invalid credentials, session restore, repeatable logout, email normalization, and password non-disclosure.

- [ ] **Step 2: Align the frontend proxy with the existing backend startup**

Keep `backend/dev.sh` unchanged. Its fallback port is 9000, so set the frontend default in `frontend/vite.config.js` to:

```js
const API_TARGET = process.env.API_TARGET ?? "http://127.0.0.1:9000";
```

`API_TARGET` remains available when the backend is intentionally started on another port.

- [ ] **Step 3: Re-run the backend suite without staging backend files**

```bash
cd backend
pytest tests/test_member.py -v
```

Expected: 11 passed. Do not stage or commit backend files as part of the frontend implementation.

---

### Task 2: Create the Frontend Authentication and State Modules

**Files:**
- Modify: `frontend/package.json`, `frontend/package-lock.json`
- Create: `frontend/src/auth/auth-api.js`, `frontend/src/auth/auth-api.test.js`
- Create: `frontend/src/auth/auth-state.js`, `frontend/src/auth/auth-state.test.js`

**Interfaces:** `createAuthApi({ fetchImpl })` exposes `checkSession`, `signIn`, `signUp`, `signOut`; `reduceAuthState(state,event)` owns legal transitions.

- [ ] **Step 1: Install tests and add scripts**

```bash
cd frontend
npm install --save-dev vitest jsdom
```

Add `"test": "vitest run"` and `"test:watch": "vitest"` to scripts.

- [ ] **Step 2: Write failing adapter tests**

```js
import { describe, expect, it, vi } from "vitest";
import { createAuthApi } from "./auth-api.js";

const response = (body, status = 200) => new Response(JSON.stringify(body), { status });

describe("auth api", () => {
  it("signs in without name", async () => {
    const fetchImpl = vi.fn().mockResolvedValue(response({ ok: true, member: { name: "Annie Lin", email: "annie@example.com" }, error: null }));
    await createAuthApi({ fetchImpl }).signIn({ email: "annie@example.com", password: "correct-horse" });
    expect(fetchImpl).toHaveBeenCalledWith("/api/member/auth", expect.objectContaining({
      method: "PUT",
      body: JSON.stringify({ email: "annie@example.com", password: "correct-horse" }),
    }));
  });

  it("maps invalid credentials", async () => {
    const fetchImpl = vi.fn().mockResolvedValue(response({ ok: false, member: null, error: "invalid_credentials" }, 401));
    await expect(createAuthApi({ fetchImpl }).signIn({ email: "annie@example.com", password: "incorrect-pass" }))
      .rejects.toMatchObject({ code: "invalid_credentials", message: "Email or password is incorrect.", status: 401 });
  });
});
```

- [ ] **Step 3: Implement the adapter**

```js
const COPY = {
  email_taken: "An account already uses this email.",
  invalid_credentials: "Email or password is incorrect.",
  server_error: "Something went wrong. Try again.",
};

export class AuthApiError extends Error {
  constructor(code, message, status = 0) { super(message); this.name = "AuthApiError"; this.code = code; this.status = status; }
}

export function createAuthApi({ fetchImpl = globalThis.fetch } = {}) {
  async function request(path, options = {}) {
    let result;
    try {
      result = await fetchImpl(path, { credentials: "same-origin", headers: { "Content-Type": "application/json" }, ...options });
    } catch {
      throw new AuthApiError("network_error", "We couldn't reach the server. Check your connection and try again.");
    }
    const body = await result.json().catch(() => ({}));
    if (!result.ok) {
      const code = body.error ?? "server_error";
      throw new AuthApiError(code, COPY[code] ?? COPY.server_error, result.status);
    }
    return body;
  }
  return {
    checkSession: () => request("/api/member/auth"),
    signIn: (value) => request("/api/member/auth", { method: "PUT", body: JSON.stringify(value) }),
    signUp: (value) => request("/api/member", { method: "POST", body: JSON.stringify(value) }),
    signOut: () => request("/api/member/auth", { method: "DELETE" }),
  };
}
```

- [ ] **Step 4: Write failing reducer tests**

Test `OPEN`, `SWITCH_MODE`, active-request success, stale completion rejection, failed authentication, logout pending/success, and failed logout retaining welcome.

```js
it("ignores stale completion", () => {
  const pending = reduceAuthState({ ...initialAuthState, view: "form" }, { type: "AUTH_STARTED", requestId: 8 });
  expect(reduceAuthState(pending, { type: "AUTH_SUCCEEDED", requestId: 7, member: { name: "Wrong" } })).toEqual(pending);
});
```

- [ ] **Step 5: Implement the reducer**

```js
export const initialAuthState = Object.freeze({ view: "collapsed", mode: "signIn", status: "idle", member: null, error: null, pendingId: null });

export function reduceAuthState(state, event) {
  switch (event.type) {
    case "SESSION_FOUND": return { ...initialAuthState, view: "welcome", member: event.member };
    case "OPEN": return state.status === "idle" ? { ...state, view: "form", error: null } : state;
    case "CLOSE": return state.status === "idle" ? { ...initialAuthState } : state;
    case "SWITCH_MODE": return state.view === "form" && state.status === "idle" ? { ...state, mode: event.mode, error: null } : state;
    case "AUTH_STARTED": return { ...state, status: "submitting", error: null, pendingId: event.requestId };
    case "AUTH_SUCCEEDED": return state.pendingId === event.requestId ? { ...initialAuthState, view: "welcome", member: event.member } : state;
    case "AUTH_FAILED": return state.pendingId === event.requestId ? { ...state, status: "idle", error: event.error, pendingId: null } : state;
    case "SIGN_OUT_STARTED": return state.view === "welcome" ? { ...state, status: "signingOut", error: null, pendingId: event.requestId } : state;
    case "SIGN_OUT_SUCCEEDED": return state.pendingId === event.requestId ? { ...initialAuthState } : state;
    case "SIGN_OUT_FAILED": return state.pendingId === event.requestId ? { ...state, status: "idle", error: event.error, pendingId: null } : state;
    default: return state;
  }
}
```

- [ ] **Step 6: Run and commit**

```bash
cd frontend
npm test -- src/auth/auth-api.test.js src/auth/auth-state.test.js
git add package.json package-lock.json src/auth/auth-api.js src/auth/auth-api.test.js src/auth/auth-state.js src/auth/auth-state.test.js
git commit -m "feat: add frontend authentication modules"
```

---

### Task 3: Implement Cancellable Shared-Surface Motion

**Files:**
- Create: `frontend/src/motion/morph-surface.js`, `frontend/src/motion/morph-surface.test.js`

**Interface:** `createMorphSurface({ windowRef }) -> { morph(element, mutate, options), cancel(element) }`.

- [ ] **Step 1: Write failing tests**

Test FLIP keyframes from 112×44 to 420×520, cancellation when a second transition starts, and this reduced-motion result:

```js
const element = document.createElement("div");
element.animate = vi.fn();
const mutate = vi.fn();
await createMorphSurface({ windowRef: { matchMedia: () => ({ matches: true }) } }).morph(element, mutate);
expect(mutate).toHaveBeenCalledOnce();
expect(element.animate).not.toHaveBeenCalled();
```

- [ ] **Step 2: Implement FLIP and cancellation**

```js
export function createMorphSurface({ windowRef = window } = {}) {
  const active = new WeakMap();
  const reduced = () => windowRef.matchMedia?.("(prefers-reduced-motion: reduce)").matches ?? false;
  function cancel(element) { active.get(element)?.cancel(); active.delete(element); }
  async function morph(element, mutate, { duration = 480 } = {}) {
    cancel(element);
    if (reduced() || typeof element.animate !== "function") { mutate(); return; }
    const first = element.getBoundingClientRect();
    mutate();
    const last = element.getBoundingClientRect();
    const animation = element.animate([
      { transformOrigin: "top left", transform: `translate(${first.left - last.left}px,${first.top - last.top}px) scale(${first.width / last.width},${first.height / last.height})`, opacity: .92 },
      { transformOrigin: "top left", transform: "translate(0,0) scale(1)", opacity: 1 },
    ], { duration, easing: "cubic-bezier(.16,1,.3,1)", fill: "both" });
    active.set(element, animation);
    try { await animation.finished; } catch { /* newer state owns presentation */ }
    finally { if (active.get(element) === animation) { animation.cancel(); active.delete(element); } }
  }
  return { morph, cancel };
}
```

- [ ] **Step 3: Run and commit**

```bash
cd frontend
npm test -- src/motion/morph-surface.test.js
git add src/motion
git commit -m "feat: add cancellable morphing surface"
```

---

### Task 4: Build the Accessible Authentication Application

**Files:**
- Modify: `frontend/index.html`
- Replace: `frontend/src/main.js`
- Create: `frontend/src/auth/auth-app.js`, `frontend/src/auth/auth-app.test.js`

**Interface:** `createAuthApp({ root, api, morpher }) -> { start(), destroy() }`; user content is assigned only through `textContent`.

- [ ] **Step 1: Simplify the document shell**

Use `<div id="app"></div>` plus `/src/main.js`; set title `Member`, theme color `#EFEEEC`, description `Member sign in`, and retain the responsive viewport meta tag.

- [ ] **Step 2: Write failing DOM tests**

With jsdom, a fake API, and `const immediateMorpher = { morph: async (_el, mutate) => mutate(), cancel: vi.fn() }`, test: opening/focus; Sign in/Create switch; correct request payloads; linked field errors; disabled single-submit; safe member-name rendering; Escape; session restore; logout label changing to `SIGNING OUT…`; successful logout returning to the pill; failed logout restoring the welcome view.

- [ ] **Step 3: Implement semantic templates**

```js
const shellTemplate = () => `
  <main class="auth-stage" data-view="collapsed">
    <button class="entry-island" type="button" data-action="open" aria-expanded="false">SIGN IN/UP</button>
    <section class="auth-island" aria-labelledby="auth-title" hidden></section>
    <section class="welcome-canvas" aria-labelledby="welcome-title" hidden>
      <div class="welcome-meta">MEMBER / ACTIVE</div>
      <button class="logout-island" type="button" data-action="sign-out"><span data-logout-label>SIGN OUT</span></button>
      <h1 id="welcome-title" class="welcome-title"><span>HELLO,</span><span data-member-name></span></h1>
    </section>
    <div class="sr-status" role="status" aria-live="polite" aria-atomic="true"></div>
  </main>`;
```

Use visible labels and inputs with `autocomplete="name"`, `autocomplete="email"`, and `current-password`/`new-password`. Use min/max values 2/100 for name and 8/200 for password. Assign the name with:

```js
root.querySelector("[data-member-name]").textContent = state.member?.name ?? "MEMBER";
```

- [ ] **Step 4: Implement orchestration and errors**

Use one delegated click listener, one submit listener, and one keydown listener. Retain name/email after failure, clear password, link inline errors using `aria-describedby`, focus `.error-summary`, and announce server errors. While logging out set `SIGNING OUT…`, `aria-busy="true"`, and `disabled`; on failure restore `SIGN OUT` without leaving welcome.

```js
const validationMessages = {
  name: "Enter at least 2 characters for your name.",
  email: "Enter a valid email address.",
  password: "Use at least 8 characters for your password.",
};
```

- [ ] **Step 5: Replace the composition root**

```js
import "./style.css";
import { createAuthApi } from "./auth/auth-api.js";
import { createAuthApp } from "./auth/auth-app.js";
import { createMorphSurface } from "./motion/morph-surface.js";

createAuthApp({ root: document.querySelector("#app"), api: createAuthApi(), morpher: createMorphSurface() }).start();
```

- [ ] **Step 6: Run and commit**

```bash
cd frontend
npm test
git add index.html src/main.js src/auth/auth-app.js src/auth/auth-app.test.js
git commit -m "feat: build accessible authentication flow"
```

---

### Task 5: Apply the Apple-Glass and MoMA Visual System

**Files:**
- Replace: `frontend/src/style.css`

- [ ] **Step 1: Add tokens and base layout**

```css
:root { font-family: -apple-system,BlinkMacSystemFont,"Helvetica Neue",Arial,sans-serif; --canvas:#efeeec; --ink:#11110f; --night:#090909; --glass:rgba(15,15,15,.76); --paper:#f4f3ef; --muted:#a7a7a2; --accent:#d95c4f; --error:#e06b5f; --focus:0 0 0 3px rgba(217,92,79,.34); }
* { box-sizing: border-box; }
html,body { min-width:320px; min-height:100dvh; }
body { margin:0; overflow-x:hidden; background:var(--canvas); }
button,input { font:inherit; }
button:focus-visible,input:focus-visible { outline:0; box-shadow:var(--focus); }
.auth-stage { position:relative; display:grid; min-height:100dvh; place-items:center; overflow:clip; background:var(--canvas); color:var(--ink); }
```

- [ ] **Step 2: Style entry and form islands**

```css
.entry-island,.logout-island { min-height:44px; border:1px solid rgba(255,255,255,.48); border-radius:999px; background:#9b9b98; color:#fff; cursor:pointer; box-shadow:inset 0 1px 0 rgba(255,255,255,.36),0 10px 28px rgba(31,31,28,.12); transition:filter 180ms ease,transform 100ms ease,min-width 420ms cubic-bezier(.16,1,.3,1); }
.entry-island { min-width:112px; padding:0 20px; }
.entry-island:hover,.logout-island:hover { filter:brightness(1.1); }
.entry-island:active,.logout-island:active { transform:scale(.97); }
.auth-island { width:min(420px,calc(100vw - 40px)); padding:clamp(24px,5vw,36px); border:1px solid rgba(255,255,255,.14); border-radius:32px; background:var(--glass); color:var(--paper); box-shadow:inset 0 1px 0 rgba(255,255,255,.12),0 28px 80px rgba(17,17,15,.2); backdrop-filter:blur(24px) saturate(112%); }
.field input,.primary-action { min-height:48px; }
```

Add stable mode, toolbar, close, field, inline-error, summary, pending, and disabled styles. Indicate active mode with weight plus underline, not color alone.

- [ ] **Step 3: Style welcome and logout Dynamic Island**

```css
.welcome-canvas { position:absolute; inset:0; min-height:100dvh; background:var(--night); color:var(--paper); }
.welcome-meta { position:absolute; top:max(28px,env(safe-area-inset-top)); left:max(28px,env(safe-area-inset-left)); color:var(--muted); font-size:.72rem; letter-spacing:.16em; }
.welcome-meta::after { content:""; display:inline-block; width:30px; height:2px; margin-left:12px; background:var(--accent); }
.logout-island { position:absolute; top:max(20px,env(safe-area-inset-top)); right:max(20px,env(safe-area-inset-right)); min-width:104px; padding:0 18px; background:rgba(38,38,36,.78); backdrop-filter:blur(18px); }
.logout-island[aria-busy="true"] { min-width:154px; cursor:wait; }
.welcome-title { position:absolute; left:clamp(24px,7vw,112px); bottom:clamp(44px,10vh,120px); max-width:min(84vw,1180px); margin:0; font-family:"Arial Black","Helvetica Neue",Arial,sans-serif; font-size:clamp(3.5rem,11vw,10.5rem); font-weight:900; line-height:.78; letter-spacing:-.075em; text-transform:uppercase; }
.welcome-title span { display:block; overflow-wrap:anywhere; }
```

- [ ] **Step 4: Add responsive/reduced-motion rules, test, and commit**

```css
@media (max-width:560px) { .welcome-meta{left:20px}.logout-island{right:20px}.welcome-title{left:20px;bottom:max(36px,env(safe-area-inset-bottom));max-width:calc(100vw - 40px);font-size:clamp(3rem,17vw,5.4rem);line-height:.84} }
@media (max-height:520px) and (orientation:landscape) { .auth-stage{align-items:start;padding-block:20px}.welcome-title{bottom:24px;font-size:clamp(2.6rem,12vh,5rem);line-height:.86} }
@media (prefers-reduced-motion:reduce) { *,*::before,*::after{animation-duration:.01ms!important;animation-iteration-count:1!important;transition-duration:.01ms!important} }
```

```bash
cd frontend
npm test
npm run build
git add src/style.css
git commit -m "feat: style morphing glass authentication experience"
```

---

### Task 6: Verify and Document the Complete Experience

**Files:**
- Create: `README.md`

- [ ] **Step 1: Document operation**

Document `./backend/dev.sh`, `npm --prefix frontend run dev`, `pytest backend/tests -v`, `npm --prefix frontend test`, and `npm --prefix frontend run build`. State the backend startup fallback is port 9000, Vite uses 5173, and `API_TARGET` can override the proxy target without changing backend code.

- [ ] **Step 2: Run full verification**

```bash
cd backend && pytest tests -v
cd ../frontend && npm test && npm run build
```

Expected: 11 backend tests, all frontend tests, and the Vite build pass.

- [ ] **Step 3: Browser verification**

Verify keyboard focus, switching, validation, pending state, sign-up, sign-in, session refresh, paste/autofill, Escape, successful and failed logout, and reduced motion. Confirm the top-right capsule widens to `SIGNING OUT…` before the black canvas retreats.

- [ ] **Step 4: Viewport verification**

Inspect collapsed, form, and welcome at 375×812, 844×390, 768×1024, and 1440×900. Confirm no horizontal scroll, clipped focus ring, or overlap between logout and headline. Store screenshots under `/tmp/login-mockup-verification/`, not Git.

- [ ] **Step 5: Commit documentation**

```bash
git diff --check
git add README.md
git commit -m "docs: add login mockup development guide"
```

If verification reveals a defect, first add a focused regression test, fix it, run the relevant and full suites, and commit that correction separately.
