Backend Ledger
Backend Ledger is a Node.js + Express API for managing user accounts, balances, and ledger-based money transfers. It is built with MongoDB and Mongoose, and includes authentication, protected routes, transaction processing, and email notifications.

Features
User registration, login, and logout
JWT-based authentication with cookie support
Protected account creation and balance lookup
Ledger-style debit/credit tracking
Transaction creation with idempotency protection
MongoDB session-based transaction flow
System user support for initial funding transactions
Email notifications for registration and transaction events
Blacklisted token handling for secure logout
Tech Stack
Node.js
Express
MongoDB + Mongoose
JWT
bcryptjs
Nodemailer
dotenv
cookie-parser
Project Structure
bash
backend-ledger/
├── server.js
├── package.json
├── package-lock.json
├── .gitignore
├── src/
│   ├── app.js
│   ├── config/
│   │   └── db.js
│   ├── controllers/
│   │   ├── account.controller.js
│   │   ├── auth.controller.js
│   │   └── transaction.controller.js
│   ├── middleware/
│   │   └── auth.middleware.js
│   ├── models/
│   │   ├── account.model.js
│   │   ├── blackList.model.js
│   │   ├── ledger.model.js
│   │   ├── transaction.model.js
│   │   └── user.model.js
│   ├── routes/
│   │   ├── account.routes.js
│   │   ├── auth.routes.js
│   │   └── transaction.routes.js
│   └── services/
│       └── email.service.js
Getting Started
Prerequisites
Node.js
MongoDB instance
Email service credentials for Nodemailer
Installation
bash
npm install
Environment Variables
Create a .env file in the project root:

env
MONGO_URI=your_mongodb_connection_string
JWT_SECRET=your_jwt_secret
EMAIL_USER=your_email_address
CLIENT_ID=your_oauth_client_id
CLIENT_SECRET=your_oauth_client_secret
REFRESH_TOKEN=your_oauth_refresh_token
Run the app
Development mode:

bash
npm run dev
Production mode:

bash
npm start
The server runs on port 3000 by default.

API Endpoints
Authentication
HTTP
POST /api/auth/register
POST /api/auth/login
POST /api/auth/logout
Accounts
HTTP
POST /api/accounts/
GET /api/accounts/
GET /api/accounts/balance/:accountId
Transactions
HTTP
POST /api/transactions/
POST /api/transactions/system/initial-funds
Authentication Flow
Users register with name, email, and password
Passwords are hashed before saving
JWT tokens are issued on successful login or registration
Tokens are validated through middleware
Logged-out tokens are stored in a blacklist to prevent reuse
Ledger Behavior
The application tracks ledger entries using debit and credit records for each account. Account balances are derived from aggregated ledger data.

A transfer flow includes:

validating request inputs
checking idempotency key
verifying account status
validating balance
creating pending transaction records
writing debit and credit ledger entries
marking the transaction as completed
sending email notifications
Notes
This project is focused on backend logic and API behavior rather than a frontend UI.
Email sending relies on Gmail OAuth configuration via environment variables.
There are currently no automated tests defined in the project scripts.
License
This project uses the ISC license as declared in package.json.

Contributing
Contributions are welcome. If you want to improve validation, add tests, or harden the transaction flow, open a pull request with a clear description of the change.

Contact
For questions or support, please reach out via the repository owner or maintainers on GitHub.