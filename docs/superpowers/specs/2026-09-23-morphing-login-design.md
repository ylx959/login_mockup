# Morphing Login Experience Design

**Status:** Approved on 2026-09-23

## Objective

Build a small, production-minded authentication frontend for the existing FastAPI project. The experience begins as a single centered `SIGN IN/UP` pill, morphs into a switchable sign-in/sign-up form, and expands into a full-page black welcome canvas after authentication. The visual language is restrained Apple-like glass paired with asymmetric MoMA-style typography.

The work also includes the smallest backend correction needed to make the approved frontend contract coherent.

## Scope

### Included

- Sign-in form with email and password.
- Sign-up form with name, email, and password.
- A switch between the two modes without closing the surface.
- Initial session restoration on page load.
- Inline validation, pending, error, and success states.
- A full-page welcome state using the authenticated member name.
- A top-right Dynamic Island-style logout capsule so the authentication cycle can be exercised repeatedly.
- Responsive behavior down to a 375px viewport and landscape layouts.
- Reduced-motion, keyboard, screen-reader, password-manager, and paste support.
- Minimal repair of the FastAPI authentication contract and database-table mismatch.

### Excluded

- Password reset, email verification, OAuth, passkeys, user profiles, or account settings.
- A new database migration system.
- A frontend framework, component library, icon library, or animation dependency.
- Decorative imagery, carousels, or unrelated landing-page content.

## Visual Direction

### Signature

The interface is remembered as one continuous material object: button, form, and page are three states of the same morphing surface. This is the only prominent visual effect. Everything else remains quiet.

### Palette

- `canvas`: `#EFEEEC`
- `ink`: `#11110F`
- `night`: `#090909`
- `glass`: `rgba(15, 15, 15, 0.76)`
- `paper`: `#F4F3EF`
- `muted`: `#A7A7A2`
- `accent`: `#D95C4F`
- `error`: `#E06B5F`

The accent appears only in focus, error, and the welcome canvas registration mark. The initial hover brightening comes from a restrained inner highlight and ambient reflection, not a neon outer glow.

### Typography

- Welcome display: `Arial Black`, `Helvetica Neue`, `Arial`, sans-serif.
- Interface/body: `-apple-system`, `BlinkMacSystemFont`, `Helvetica Neue`, `Arial`, sans-serif.
- Labels use uppercase or sentence case consistently; no third-party web font is loaded.
- The welcome name is uppercased visually with tight negative tracking, while its accessible text preserves the member's original name.

### Layout

Collapsed state:

```text
┌─────────────────────────────────────────────┐
│                                             │
│                ╭──────────╮                 │
│                │ SIGN IN  │                 │
│                ╰──────────╯                 │
│                                             │
└─────────────────────────────────────────────┘
```

Expanded authentication state:

```text
┌─────────────────────────────────────────────┐
│                                             │
│          ╭──────────────────────╮           │
│          │ SIGN IN   CREATE     │           │
│          │                      │           │
│          │ Email                │           │
│          │ [________________]   │           │
│          │ Password        show│           │
│          │ [________________]   │           │
│          │                      │           │
│          │ [ Continue       ]   │           │
│          ╰──────────────────────╯           │
│                                             │
└─────────────────────────────────────────────┘
```

Authenticated state:

```text
┌─────────────────────────────────────────────┐
│ MEMBER / ACTIVE                         ──  │
│                              ╭───────────╮  │
│                              │ SIGN OUT  │  │
│                              ╰───────────╯  │
│                                             │
│ HELLO,                                      │
│ MEMBER NAME                                 │
│                                             │
└─────────────────────────────────────────────┘
```

The auth surface is at most 420px wide. On narrow screens it uses 20px side gutters. Controls are at least 44px high. The authenticated composition is left-aligned and asymmetric, but collapses safely on mobile without horizontal scrolling. The logout capsule stays in the top-right safe area, uses the same glass edge treatment as the original pill, and never overlaps the welcome name at large text sizes.

## Motion Model

The application has a finite set of observable view states:

```text
collapsed → signIn ↔ signUp → submitting → welcome
     ↑          ↖ error ↗                    │
     └────────────── signOut ────────────────┘
```

- Hover: 180ms ambient brightening.
- Press: immediate `scale(0.97)` feedback.
- Pill-to-panel: 420–520ms transform/opacity morph with spring-like easing.
- Mode switch: 180–240ms content crossfade/translation inside a stable shell.
- Panel-to-page: 600–760ms transform/clip reveal, followed by the welcome type settling into place.
- Logout begins by widening the top-right capsule into a `SIGNING OUT…` status island. On success, that island contracts as the black canvas recedes and the centered sign-in pill returns.
- Exit motion is shorter than enter motion.
- Animations are interruptible; correctness never depends on an `animationend` event.
- Only transform and opacity are animated during frequent transitions. Layout is measured before and after mutation, then bridged with FLIP-style transforms.
- Under `prefers-reduced-motion: reduce`, the final state is applied immediately with only a short opacity change.

## Architecture

### Backend authentication module

FastAPI exposes one coherent `/api/member` interface:

- `POST /api/member` accepts `{ name, email, password }` and returns `{ ok, member?, error? }`.
- `PUT /api/member/auth` accepts `{ email, password }` and returns `{ ok, member?, error? }`.
- `GET /api/member/auth` returns the current session as `{ ok, member? }`.
- `DELETE /api/member/auth` clears the session and returns `{ ok: true }`.

Both sign-up and sign-in use the `users` table. The login request does not require a name. Password hashing and verification stay behind the backend authentication module's interface. Duplicate email, invalid credentials, and invalid input are distinct observable error modes without revealing whether an email exists during sign-in.

### Frontend authentication adapter

`auth-api.js` is the only module that knows HTTP methods, URLs, JSON response shapes, and fetch failures. Its interface exposes `checkSession()`, `signIn(credentials)`, `signUp(profile)`, and `signOut()`. A fetch implementation is accepted as a dependency so the same interface is testable without a network.

### Frontend state module

`auth-state.js` owns the legal state transitions and returns state rather than mutating the DOM. Its small interface is a reducer that accepts the previous state and a named event. Invalid or stale completion events do not corrupt the current view.

### Morphing surface module

`morph-surface.js` hides FLIP measurements, Web Animations usage, cancellation, and reduced-motion handling behind one interface. Callers request a visual mutation and await a result; they do not manage animation frames or computed transforms.

### Authentication application module

`auth-app.js` coordinates the state module, authentication adapter, morphing surface, and DOM. It owns form rendering, focus placement, accessible announcements, pending controls, and session restoration. `main.js` only locates the root and boots this module.

This shape gives callers leverage through three deep modules and keeps database, HTTP, state-transition, and animation knowledge local to their respective implementations.

## Data Flow

1. Page boot renders the collapsed surface and calls `checkSession()`.
2. An authenticated session transitions directly to `welcome`; an anonymous session remains collapsed.
3. Activating the pill transitions to `signIn` and focuses the email field after the morph settles.
4. Switching mode preserves the email value and changes password autocomplete semantics; the sign-up name field appears only in `signUp`.
5. Submit performs native constraint checks, sets `submitting`, disables the primary action, and invokes the matching adapter method.
6. Failure returns to the active form, retains entered email/name, clears only the password, shows a recoverable inline message, and focuses the first invalid field or error summary.
7. Success transitions to `welcome` using the server-provided member name.
8. Sign out expands the top-right capsule into a pending status, clears the session, and returns to `collapsed` through a coordinated shared-surface transition. A failed request restores the `SIGN OUT` action and announces a retryable error without leaving the welcome view.

## Error and Loading Behavior

- Field errors sit directly below the relevant field and are linked with `aria-describedby`.
- Multiple validation failures also produce a focusable summary linked to each invalid field.
- Invalid credentials use a neutral message: `Email or password is incorrect.`
- Duplicate registration uses: `An account already uses this email.`
- Offline/network failure uses: `We couldn't reach the server. Check your connection and try again.`
- Server failure uses: `Something went wrong. Try again.`
- Pending form buttons keep their width, show a quiet progress mark, expose `aria-busy`, and cannot be submitted twice. The logout capsule is the intentional exception: it widens to reveal `SIGNING OUT…` while keeping a stable 44px hit-area height.
- Status changes are announced through one polite live region without stealing focus.

## Accessibility

- Every input has a persistent visible label and correct `name`, `type`, and `autocomplete` value.
- Password paste and password managers remain enabled.
- Mode selectors and close/sign-out actions use native buttons with visible keyboard focus.
- Tab order follows the visual order.
- The panel can be closed with its visible close button or Escape when no request is pending.
- Text and meaningful control boundaries meet WCAG AA contrast.
- No information relies on color alone.
- Motion preference is respected, and the final content remains complete without animation.
- The page retains browser zoom and works at increased text size.

## Testing Strategy

- Backend request/response and session behavior are tested through FastAPI's interface with an isolated SQLite database adapter.
- The frontend authentication adapter is tested with an injected fake fetch implementation.
- The pure state module is tested for legal, failed, repeated, and stale transitions.
- DOM tests cover opening, mode switching, validation, pending behavior, server errors, successful welcome rendering, focus placement, Escape, and logout.
- Production build must complete without warnings.
- Browser verification covers 375×812, 844×390, 768×1024, and 1440×900 viewports, keyboard-only use, reduced motion, slow/failing network, refresh with an active session, and refresh without a session.

## Implementation Constraints

- Preserve unrelated user changes already present in the worktree.
- Do not add React, Tailwind, GSAP, Framer Motion, or an icon package.
- Use semantic design tokens rather than raw colors inside individual selectors.
- Use no emoji and no decorative image dependency.
- Keep authentication correctness in application state; animation completion is presentation-only.
- Keep the UI copy short, direct, and consistent.
