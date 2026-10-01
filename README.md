# backend-ledger

Ledger-style money transfer API. Users register, create accounts, and move funds between accounts. Every transfer writes immutable DEBIT/CREDIT ledger entries inside a MongoDB transaction, and balances are derived from the ledger. Auth is JWT (cookie or `Authorization` header) with token blacklisting on logout.

## Tech stack

Node.js 18+ · Express 5 · Mongoose 9 · MongoDB · JWT · bcryptjs · cookie-parser · Nodemailer (Gmail OAuth) · dotenv

## Project structure

```
src/server.js                 # entry, listens on 6969
src/app.js                    # express app, mounts /api/* routers
src/config/db.js              # mongoose connect via MONGO_URI
src/routes/
  auth.routes.js              # register, login, logout
  account.routes.js           # create, list, balance
  transaction.routes.js       # transfer, system initial-funds
src/controllers/
  auth.controller.js
  account.controller.js
  transaction.controller.js
src/middleware/auth.middleware.js   # authMiddleware, authSystemUserMiddleware
src/models/
  user.models.js              # email, name, password (hashed), systemUser
  account.model.js            # user ref, status, currency + getBalance()
  transaction.model.js        # from/to, amount, status, idempotencyKey (unique)
  ledger.model.js             # immutable account/amount/transaction/type entries
  blacklist.model.js          # logged-out tokens (auto-expire, 3 days)
src/services/email.service.js # registration + transaction emails
```

## Getting started

Prerequisites: Node 18+, a MongoDB connection string, Gmail OAuth credentials (for email).

```bash
npm install
```

Create `.env` in the project root (never commit this file):

```env
MONGO_URI=mongodb+srv://<user>:<pass>@<cluster>/<db>
JWT_SECRET=<random-secret>
EMAIL_USER=<you@gmail.com>
CLIENT_ID=<oauth-client-id>
CLIENT_SECRET=<oauth-client-secret>
REFRESH_TOKEN=<oauth-refresh-token>
```

| Variable      | Used for                              |
|---------------|---------------------------------------|
| `MONGO_URI`   | Mongoose connection string            |
| `JWT_SECRET`  | Signing auth tokens (3-day expiry)    |
| `EMAIL_USER`, `CLIENT_ID`, `CLIENT_SECRET`, `REFRESH_TOKEN` | Gmail OAuth for notification emails |

Run:

```bash
npm run dev   # nodemon src/server.js (development)
npm start     # node src/server.js (production)
```

Server: `http://localhost:6969`. Health check: `GET /api/health`. Interactive playground: open `http://localhost:6969/` in a browser to use & test every endpoint.

## API documentation

Full endpoint reference + step-by-step Postman testing guide: **[API.md](./API.md)**

Quick map:

| Method | Path                                      | Auth        |
|--------|-------------------------------------------|-------------|
| POST   | `/api/auth/register`                      | public      |
| POST   | `/api/auth/login`                         | public      |
| POST   | `/api/auth/logout`                        | user        |
| POST   | `/api/accounts`                           | user        |
| GET    | `/api/accounts`                           | user        |
| GET    | `/api/accounts/balance/:accountId`        | user (owner)|
| POST   | `/api/transactions`                       | user        |
| POST   | `/api/transactions/system/initial-funds`  | system user |

Auth = `Authorization: Bearer <token>` header (login/register also set a `token` cookie). A `systemUser:true` user is required for initial funding — see API.md.

## Deploy (Render)

- Root Directory: empty (leave default)
- Build Command: `npm install`
- Start Command: `npm start`
- Branch: `master`
- Add every `.env` key under Environment — `.env` is gitignored, Render never sees it otherwise or the boot crashes on DB connect.