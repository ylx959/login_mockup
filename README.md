# YLX Lab Login Mockup

A dark, frosted-glass login flow. A small **touch me** pill floats over a photo backdrop; tap it and the pill morphs into a glass card where you can log in or sign up. After a successful login the card gives way to a welcome page, and signing out shrinks everything back into the pill.

## Build with

- React 19 & TypeScript
- Vite
- Motion (`motion/react`)
- React Router
- CSS Modules (no UI kit, no icon package)
- FastAPI & MySQL

>React + TypeScript + Vite on the front, FastAPI + MySQL on the back. Motion drives the pill-to-card morph, the content reveal and the page hand-off.

## Highlights
- **Pill ⇄ Card Morph** — The pill and the glass card share one `layoutId`, so Motion grows one into the other instead of fading one out and another in.
- **Tap Outside to Collapse** — Pressing anywhere outside the card folds it back into the pill. It won't collapse while a request is in flight.
- **Island-style Resizing** — Switching between log in and sign up changes the card's height with a spring, like a Dynamic Island, instead of jumping.
- **Late-response Guard** — Every request carries an id; a response that comes back after the user has moved on is ignored instead of dragging the screen back.
- **Neutral Errors** — A wrong password and an unknown email return exactly the same result, so nobody can probe which emails are registered.


## Development

```bash
git clone git@github.com:ylx959/login_mockup.git
cd login_mockup
```

The backend and frontend run in separate terminals. Start the backend first.

### Backend

Requires Python 3.12+ and a local MySQL.

**1. Create the database** (once):

```sql
CREATE DATABASE login_mockup;
USE login_mockup;
CREATE TABLE users(
    id BIGINT NOT NULL AUTO_INCREMENT,
    name VARCHAR(100) NOT NULL,
    email VARCHAR(255) NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    created_at TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY(id),
    UNIQUE KEY email(email)
);
```

**2. Set up `.env`** (once):

```bash
cd backend
cp .env.example .env
python3 -c 'import secrets;print(secrets.token_urlsafe(32))'   # paste the output into SESSION_SECRET
```

| Variable | Default | Holds |
|---|---|---|
| `DB_HOST` | `127.0.0.1` | MySQL host |
| `DB_PORT` | `3306` | MySQL port |
| `DB_USER` | `root` | MySQL user |
| `DB_PASSWORD` | — | MySQL password |
| `DB_NAME` | `login_mockup` | Database name |
| `SESSION_SECRET` | — | Signs the session cookie. Required |

`.env` is ignored by git.

**3. Run:**

```bash
./dev.sh                  # API on http://127.0.0.1:9000
PORT=8000 ./dev.sh        # or on another port
```

On the first run, `dev.sh` creates `.venv` and installs `requirements.txt`. Use `source dev.sh` to enter the venv in the current terminal without starting the server.

**Tests:**

```bash
source dev.sh
pip install -qr requirements-dev.txt    # once
python -m pytest tests -v               # 11 API contract tests
```

The tests create and drop their own `login_mockup_test` database, so your real data is never touched.

### Frontend

Requires Node 20+.

```bash
cd frontend
npm install
npm run dev               # http://localhost:5173
npm run build             # outputs to dist/
```

Vite proxies `/api` to the backend, so the frontend just calls `fetch("/api/...")` with no CORS setup. The proxy targets `http://127.0.0.1:9000` by default. If the backend runs on another port, point the proxy at it:

```bash
API_TARGET=http://127.0.0.1:8000 npm run dev
```

**Tests:**

```bash
npm test                  # 67 tests: http, adapter, state machine, validation, components
npm run typecheck
```


## Editing your own content

Everything a user reads or fills in lives in `frontend/src/data/` — no need to open a component.

| File | Holds |
|---|---|
| `copy.ts` | Brand name, the `touch me` label, titles and buttons for each mode, error and validation messages, welcome text |
| `fields.ts` | Each field's label, placeholder, icon, autocomplete hint and length limits, plus which fields each mode shows |

The length limits in `fields.ts` match the backend's `SignupRequest` (name 50 / password 128). Change them in both places, or users can type values the server will reject with `422`.

### Change the feel of the motion

All springs and variants live in `frontend/src/lib/motion.ts`.

| Name | Controls |
|---|---|
| `shellSpring` | The pill ⇄ card morph and the card's height changes — slower, with a little overshoot |
| `contentSpring` | Swapping titles and fields — faster, so it feels crisp |
| `contentRevealVariants` | The form opening outward from its exact centre |
| `screenVariants` | The fade hand-off between the login screen and the member page |

Colours and glass effects are semantic tokens in `frontend/src/styles/tokens.css`. The backdrop photo is `frontend/src/assets/room.jpg`.

## API

All four endpoints return the same `{ ok, member, error }` shape, where `member` is `{ name, email }`.

| Method | Path | Sends | Success | Failure |
| --- | --- | --- | --- | --- |
| POST | `/api/member` | `{name,email,password}` | `201` + member | `409` `email_taken` |
| PUT | `/api/member/auth` | `{email,password}` | `200` + member | `401` `invalid_credentials` |
| GET | `/api/member/auth` | — | `200` `{ok,member}` | `ok:false` when signed out |
| DELETE | `/api/member/auth` | — | `200` `{ok:true}` | — |

Malformed input is always `422`, so `422`, `409` and `401` are three distinct errors the frontend can tell apart.

### How It Works

```
backend/
  app/main.py                  FastAPI + mysql.connector, four endpoints and the session
  tests/                       Contract tests against an isolated login_mockup_test database

frontend/src/
  lib/http.ts                  The only place that knows how fetch is configured
  lib/motion.ts                Every spring and variant
  modules/auth/
    types.ts                   Member, error codes, request/result types
    auth-client.ts             The only adapter that knows about /api/member
    auth-machine.ts            Pure state transitions; blocks late responses
    validate.ts                Pure validation, rules aligned with the backend
    use-auth.ts                The one auth interface components need
  data/                        Copy and field specs
  components/                  One folder per component, each with its own CSS Module
  styles/tokens.css            Semantic tokens for the dark glass look
```

- **State Machine** — `booting → collapsed ⇄ form (log in ↔ sign up) → welcome`, and signing out returns to `collapsed`. Every legal transition lives in `auth-machine.ts`, which never touches the DOM or the network.
- **One Hook** — `useAuth` hides the state machine, the HTTP adapter, request ordering and the late-response guard. Components only see `state` and a handful of actions.
- **Injected Client** — Tests swap in a fake `AuthClient`, so the whole app runs without a network.

## License
Released under the [MIT License](LICENSE). © 2026 YLX Studio.

The MIT License covers the code only. The backdrop photo `frontend/src/assets/room.jpg` comes from [Dezeen — Daddy Cool by Pattern Studio](https://www.dezeen.com/2025/02/21/daddy-cool-sydney-home-renovation-pattern-studio/); its rights stay with the original owners.
