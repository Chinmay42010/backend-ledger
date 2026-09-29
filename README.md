# backend-ledger

Minimal Node.js + Express API for user auth and account creation, backed by MongoDB/Mongoose.

## What it does

- `POST /api/auth/register` — create user, hash password, return JWT + `token` cookie, send registration email
- `POST /api/auth/login` — verify credentials, return JWT + `token` cookie
- `POST /api/accounts` — protected, creates an account (`INR`, `ACTIVE` by default) for the logged-in user

Auth accepts `Authorization: Bearer <token>` or `token` cookie.

## Tech stack

Node.js, Express 5, Mongoose 9, JWT, bcryptjs, cookie-parser, Nodemailer, dotenv.

## Project structure

```
server.js            # entry, listens on 6969
src/app.js           # express app, mounts /api/auth + /api/accounts
src/config/db.js     # mongoose connect via MONGO_URI
src/routes/          # auth.routes.js, account.routes.js
src/controllers/     # auth.controller.js, account.controller.js
src/middleware/auth.middleware.js
src/models/          # user.models.js, account.model.js
src/services/email.service.js
```

## Getting started

Prerequisites: Node 18+, a MongoDB URI, Gmail OAuth creds for email.

```bash
npm install
```

Create `.env`:

```env
MONGO_URI=mongodb+srv://...
JWT_SECRET=...
EMAIL_USER=...
CLIENT_ID=...
CLIENT_SECRET=...
REFRESH_TOKEN=...
```

Run:

```bash
npm run dev   # nodemon server.js
npm start     # node server.js
```

Server: `http://localhost:6969`.

## API

Register:

```bash
curl -X POST http://localhost:6969/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"name":"A","email":"a@x.com","password":"secret123"}'
```

Login:

```bash
curl -X POST http://localhost:6969/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"a@x.com","password":"secret123"}'
```

Create account (protected):

```bash
curl -X POST http://localhost:6969/api/accounts \
  -H "Authorization: Bearer <token>"
```

## Notes

- No tests (`npm test` is a placeholder).
- Registration email failures don't fail registration.
- Port is hardcoded to `6969` in `server.js`.
