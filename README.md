# Arc Banking demo

Arc is a React + TypeScript banking demo with a public landing page and a local Node.js API. Visitors can explore the demo dashboard or create a demo account and sign in. The app does not connect to a bank, verify a real-world identity, send password-reset emails, or move real money.

## Requirements

- Node.js 18 or newer
- npm

## Run in development

```sh
npm install
npm run dev
```

Open the Vite URL printed in the terminal (normally `http://127.0.0.1:5173`). The dev command starts both Vite and the API server; Vite proxies `/api` requests to `http://127.0.0.1:3001`.

## Build and run

```sh
npm install
npm start
```

This builds the React application into `dist/`, then starts the Node server at `http://localhost:3001`. Set the `PORT` environment variable to use another port.

## Deploy to Vercel

Import the GitHub repository into Vercel and deploy with the included `vercel.json` configuration. The React app is served as a static Vite build, and `/api/*` requests are handled by the Node.js serverless function.

Vercel demo data is stored temporarily under `/tmp` and can be cleared when a serverless instance restarts. Demo accounts and sessions are not durable. This is for portfolio demonstration only; do not use real personal or financial information.

## Demo authentication

- Choose **Explore the demo account** on the sign-in screen to start a temporary demo session without creating an account. Demo sessions use the same `HttpOnly`, `SameSite=Strict` session cookie as registered accounts and have their own simulated transfers.
- Create an account with a name, email address, and password of at least 10 characters.
- Sign in with that email and password. The server stores password hashes (scrypt), not plaintext passwords.
- The session is an in-memory server session referenced by an `HttpOnly`, `SameSite=Strict` cookie. Signing out expires the cookie. Server restarts end active sessions.
- To reset a password, use **Forgot password?**. In this local demo, the reset token is shown on screen instead of emailed. It expires after 15 minutes and can only be used once.
- Use **Reset demo** on the dashboard to clear that user's simulated transfers. It does not delete the login account.

This is demo authentication, not production banking security. `data.json` is a local JSON file and the dashboard values are shared sample data, not private per-user bank records. Do not enter a real banking password, SSN, card number, or other sensitive financial information.

## Data

The server creates `data.json` the first time the API needs data. It contains sample dashboard data, simulated transfers, and demo user records with password hashes and reset-token hashes. This local demo file is ignored by Git.

## API

Authentication endpoints set or clear the session cookie. Protected dashboard endpoints require a valid signed-in session.

### `POST /api/demo-session`

Starts a temporary demo session and sets the session cookie. The response contains a demo user's name and email; no account or password is created.

### `POST /api/auth/register`

Creates a demo user and signs them in.

Request:

```json
{ "name": "Jordan Davis", "email": "jordan@example.com", "password": "at-least-10-characters" }
```

### `POST /api/auth/login`

Signs in an existing user and sets the session cookie.

### `GET /api/auth/me`

Returns the current signed-in user's name and email.

### `POST /api/auth/logout`

Ends the current session and expires the cookie.

### `POST /api/auth/forgot-password`

Accepts an email and returns a generic response. For an existing account, it also returns a short-lived demo reset token for the local on-screen reset flow. In a deployed real service, send the token through a verified email flow instead of returning it to the browser.

### `POST /api/auth/reset-password`

Accepts `{ "email": "...", "token": "...", "password": "..." }`, checks the unexpired one-time token, replaces the password hash, and ends that user's active sessions.

### `GET /api/summary`

Returns the sample balance, income, spending, accounts, transactions, goals, and upcoming bills. It requires authentication. The shared sample dataset is not live financial account information.

### `POST /api/transfers`

Validates and saves a demo transfer. Amounts must be greater than zero, no more than `$8,420`, and have at most two decimal places. Destinations must be one of the demo goals/accounts.

Request:

```json
{ "amount": 100, "destination": "First home goal" }
```

Response includes the saved queued transfer and the updated dashboard summary. Transfers are isolated by demo login, but do not change account balances or perform a real payment.

### `POST /api/reset-demo`

Clears the current user's simulated transfers and returns the original sample dashboard data.
