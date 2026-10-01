# backend-ledger — API documentation

Base URL (local): `http://localhost:6969`
Health check: `GET /api/health` → `Ledger service is up and running`
Interactive playground: open `http://localhost:6969/` in a browser — every endpoint below has a form there, no Postman needed.

> Postman setup used below: create an environment with `baseUrl = http://localhost:6969`.
> After login/register, copy the `token` from the response into an environment variable
> `token`, then add a **collection-level** header `Authorization: Bearer {{token}}`
> so every protected request carries it. (The API also accepts the `token` cookie
> it sets, but the header is explicit and reliable in Postman.)

---

## Conventions

- All request/response bodies are JSON. Send header `Content-Type: application/json`.
- Success bodies are shown per endpoint. Error bodies look like
  `{ "message": "<reason>" }` (auth endpoints add `"status": "Failed"` on some errors).
- Protected endpoints need `Authorization: Bearer <token>` (login or register to get one).

---

## 1. Register — `POST /api/auth/register` (public)

Creates a user, hashes the password, returns a JWT (3-day expiry) and sets a `token` cookie. A welcome email is sent after the response.

**Postman:** Method `POST`, URL `{{baseUrl}}/api/auth/register`, tab Body → raw → JSON:

```json
{
  "name": "Asha",
  "email": "asha@example.com",
  "password": "secret123"
}
```

| Field      | Required | Notes                        |
|------------|----------|------------------------------|
| `name`     | yes      | trimmed                      |
| `email`    | yes      | valid email, unique           |
| `password` | yes      | min 6 characters, hashed (bcrypt) |

**Success `201`:**

```json
{
  "user": { "_id": "<userId>", "email": "asha@example.com", "name": "Asha" },
  "token": "<jwt>"
}
```

**Errors:** `400` missing field · `422` email already registered · `500` server error.

---

## 2. Login — `POST /api/auth/login` (public)

Verifies credentials, returns a JWT and sets the `token` cookie.

**Postman:** Method `POST`, URL `{{baseUrl}}/api/auth/login`, Body → raw → JSON:

```json
{
  "email": "asha@example.com",
  "password": "secret123"
}
```

| Field      | Required | Notes              |
|------------|----------|--------------------|
| `email`    | yes      |                    |
| `password` | yes      | compared to hash   |

**Success `200`:** same shape as register (`{ user, token }`).

**Errors:** `400` email/password missing · `401` email or password incorrect · `500` server error.

---

## 3. Logout — `POST /api/auth/logout` (auth: any logged-in user)

Blacklists the calling token (auto-expires in 3 days) and clears the cookie. No body needed.

**Postman:** Method `POST`, URL `{{baseUrl}}/api/auth/logout`, tab Authorization → Bearer Token → `{{token}}` (or rely on the collection header). Body: none.

**Success `200`:**

```json
{ "message": "User Logged out successfully" }
```

**Notes:** needs a valid (non-blacklisted) token — logged-out tokens get `401` on any protected route. Re-calling with no token still returns `200`.

---

## 4. Create account — `POST /api/accounts` (auth)

Creates an account for the logged-in user. Defaults: `status: "ACTIVE"`, `currency: "INR"`. Body: none (empty JSON `{}` is fine).

**Postman:** Method `POST`, URL `{{baseUrl}}/api/accounts`. No body required.

**Success `201`:**

```json
{
  "account": {
    "_id": "<accountId>",
    "user": "<userId>",
    "status": "ACTIVE",
    "currency": "INR"
  }
}
```

Save `account._id` as `{{accountId}}` for the steps below.

**Errors:** `401` missing/invalid token · `500` server error.

---

## 5. List my accounts — `GET /api/accounts` (auth)

Returns all accounts belonging to the logged-in user.

**Postman:** Method `GET`, URL `{{baseUrl}}/api/accounts`. No body.

**Success `200`:**

```json
{ "message": "Fetched accounts successfully", "accounts": [ { "...": "..." } ] }
```

**Errors:** `401` missing/invalid token · `500` server error.

---

## 6. Account balance — `GET /api/accounts/balance/:accountId` (auth, owner only)

Balance is derived from ledger entries (`CREDIT − DEBIT`). New accounts with no entries return `0`.

**Postman:** Method `GET`, URL `{{baseUrl}}/api/accounts/balance/{{accountId}}` (paste an account ID from step 4/5). No body.

**Success `200`:**

```json
{ "accountId": "<accountId>", "balance": 10000 }
```

**Errors:** `400` account not found (wrong ID or not yours) · `401` missing/invalid token · `500` server error (e.g. malformed ID).

---

## 7. Transfer — `POST /api/transactions` (auth)

Moves funds between two accounts. Flow: validates input → checks accounts exist and are `ACTIVE` → checks idempotency key → checks sender balance from ledger → creates PENDING transaction + DEBIT/SUCCESS atomically (MongoDB session) → marks COMPLETED → sends email.

**Postman:** Method `POST`, URL `{{baseUrl}}/api/transactions`, Body → raw → JSON:

```json
{
  "fromAccount": "<senderAccountId>",
  "toAccount": "<receiverAccountId>",
  "amount": 500,
  "idempotencyKey": "<fresh-uuid-per-attempt>"
}
```

| Field            | Required | Notes                                              |
|------------------|----------|----------------------------------------------------|
| `fromAccount`    | yes      | must exist (any user's account — see note)         |
| `toAccount`      | yes      | must exist                                         |
| `amount`         | yes      | must be ≤ sender balance                           |
| `idempotencyKey` | yes      | UUID, unique per attempt — **generate a new one for every retry** |

**Success `200`:**

```json
{ "message": "Transaction completed successfully", "transaction": { "...": "..." } }
```

**Errors:** `400` missing field · `400` invalid from/to account · `400` account not ACTIVE · `400` insufficient balance · `200` + existing transaction (replayed `COMPLETED` key) · `200` "Transaction is Processing" (replayed `PENDING` key) · `500` FAILED/REVERSED replay or server error.

**Replay note:** re-sending the *same* `idempotencyKey` never double-spends — you get the original transaction back. Concurrent duplicates are resolved by the unique index the same way.

---

## 8. Initial funds (system funding) — `POST /api/transactions/system/initial-funds` (auth: system user only)

Funds an account from the system user's own account. The system account is debited (it may go negative — no balance check here by design).

**Postman:** Method `POST`, URL `{{baseUrl}}/api/transactions/system/initial-funds`, tab Authorization → Bearer Token → the **system user's** token (see setup below), Body → raw → JSON:

```json
{
  "toAccount": "<receiverAccountId>",
  "amount": 10000,
  "idempotencyKey": "<fresh-uuid-per-attempt>"
}
```

**Success `201`:**

```json
{ "message": "Initial funds transaction completed successfully", "transaction": { "...": "..." } }
```

**Errors:** `401` token missing/invalid/expired · `401` user not found · `403` not a system user (regular-user token) · `400` invalid `toAccount` · `400` system user has no account yet (create one via step 4 while logged in as the system user) · `500` duplicate key / server error.

**System-user setup (one time):** a demo system account is provided for testing.
Register it once via step 1 (or the playground AUTH tab) with exactly:

- Email: `system@gmail.com`
- Password: `SystemFunds2026`

then flag it in MongoDB (no endpoint exposes this):

```js
db.users.updateOne({ email: "system@gmail.com" }, { $set: { systemUser: true } });
```

Then login as that user (step 2), create its funding account (step 4), and use its token for this endpoint.

---

## End-to-end test sequence (Postman)

Do the steps in order. Save `token`, `accountId`s as you go.

1. **Register system user** → step 1 (`system@example.com`) → save `token` as `{{sysToken}}`. Set `systemUser:true` in DB (see step 8). Create its account → step 4 → this is the funding source.
2. **Register Alice and Bob** → step 1 twice → save both tokens (`{{aliceToken}}`, `{{bobToken}}`).
3. **Alice creates account** (auth: `{{aliceToken}}`) → step 4 → save as `{{aliceAcct}}`. Repeat for Bob → `{{bobAcct}}`.
4. **Fund Alice** (auth: `{{sysToken}}`) → step 8 with `toAccount = {{aliceAcct}}`, `amount = 10000`, fresh UUID key → expect `201`.
5. **Check Alice balance** (auth: `{{aliceToken}}`) → step 6 → expect `10000`.
6. **Alice → Bob transfer** (auth: `{{aliceToken}}`) → step 7 with `fromAccount = {{aliceAcct}}`, `toAccount = {{bobAcct}}`, `amount = 500`, fresh UUID key → expect `200`.
7. **Verify balances** → step 6 for both: Alice `9500`, Bob `500`.
8. **Replay test** → repeat step 6's request body *unchanged* (same `idempotencyKey`) → expect `200 "Transaction already processed"` with the *same* transaction, balances unchanged.
9. **Insufficient-balance test** → step 7 with `amount = 999999` + fresh key → expect `400 Insufficient Balance`.
10. **Logout** (auth: user token) → step 3 → token blacklisted; reuse it → `401` everywhere.

**Generating UUIDs in Postman:** in the request body use `"idempotencyKey": "{{$guid}}"` and Postman fills a fresh UUID per send — handy for steps 4/6/7, but for step 8 (replay) paste a fixed value instead.
