# Murandi Apartments

A full-stack apartment management application for tenants, landlords, and administrators. Murandi brings apartment listings, tenant records, rent payments, maintenance requests, and reporting into a React interface backed by an Express API and PostgreSQL.

## Features

- Separate registration, login, and dashboard pages for tenants, landlords, and administrators.
- Apartment listing creation, updates, and leasing information.
- Tenant profiles and lease records.
- Stripe Checkout for rent payments in Kenyan shillings (KES).
- M-Pesa sandbox STK push integration.
- Maintenance request submission and completion tracking.
- Payment and maintenance reports, payment history, and receipt records.
- Email verification, password reset, and payment confirmation emails with PDF receipts.
- Tenant notifications and read status.

Some features require additional configuration or fixes described under [Current limitations](#current-limitations).

## Technology

| Layer | Technologies |
| --- | --- |
| Frontend | React 19, Vite 6, React Router 7, Tailwind CSS 4, Axios |
| Backend | Node.js, Express 5, CommonJS |
| Database | PostgreSQL through the `pg` connection pool |
| Authentication | JWT session cookies and bcrypt password hashing |
| Payments | Stripe and Safaricom M-Pesa sandbox |
| Email and receipts | Nodemailer with Gmail, PDFKit |
| Testing | Jest controller unit tests |
| Deployment files | GitHub Actions, PM2, Docker, NGINX, Kubernetes, Jenkins |

## Project structure

```text
.
├── index.js                 # Express entry point, middleware, and route mounting
├── config/db.js             # PostgreSQL connection settings
├── controllers/             # Business logic and integrations
├── routes/                  # API route definitions
├── middleware/              # JWT and role-specific session handling
├── assets/                  # Assets used in generated receipts
├── client/
│   ├── src/pages/           # Tenant, landlord, and administrator screens
│   ├── src/components/      # Shared interface components
│   ├── src/apiEndpoint.js   # Frontend API base URL
│   ├── Dockerfile          # Vite build and NGINX image
│   └── nginx.conf          # SPA routing configuration
├── test/unit/              # Backend controller tests
├── local_backup.sql        # PostgreSQL schema and existing data snapshot
├── Dockerfile              # Backend image
├── docker-compose.yml      # Container configuration; see limitations
├── k8s/                    # Kubernetes deployments, services, and ingress
├── .github/workflows/      # Test and VPS deployment workflow
└── Jenkinsfile             # Dependency installation pipeline
```

## Local setup

### Prerequisites

- Node.js **22.12.0 or newer** and npm **10.9.2 or newer**, as declared in the backend package manifest.
- A running PostgreSQL database and the `psql` command-line client. The included database snapshot was exported from PostgreSQL **17.4**; use a compatible server to restore it.
- Stripe test credentials for checkout. The backend initializes Stripe when loading its routes, so `STRIPE_SECRET_KEY` must be set even when working on other features.
- Gmail credentials for verification, password reset, and payment emails.
- Safaricom sandbox credentials if testing M-Pesa.

### 1. Install dependencies

```bash
git clone https://github.com/Allan-Binga/Apartment-Management-System.git
cd Apartment-Management-System
npm ci
npm ci --prefix client
```

If you already have this repository checked out, run the two installation commands from its root directory.

### 2. Configure the backend

Create or update `.env` in the project root. Replace the example values with your local settings; preserve any credentials you have already configured.

```dotenv
NODE_ENV=development
PORT=5700

DB_HOST=localhost
DB_PORT=5432
DB_USER=postgres
DB_PASSWORD=replace-with-your-local-database-password
DB_DATABASE=murandi_apartments

JWT_SECRET=replace-with-a-long-random-secret
CLIENT_URL=http://localhost:5173

STRIPE_SECRET_KEY=sk_test_replace_me
STRIPE_WEBHOOK=whsec_replace_me

MAIL_USER=your-account@gmail.com
MAIL_PASS=replace-with-your-gmail-app-password
```

For M-Pesa testing, also configure:

```dotenv
PASSKEY=replace-with-your-sandbox-passkey
CONSUMER_KEY=replace-with-your-sandbox-consumer-key
CONSUMER_SECRET=replace-with-your-sandbox-consumer-secret
CALLBACK_URL=https://your-public-api-host/murandi/v1/webhook/callback
```

The M-Pesa controller uses sandbox URLs and the hard-coded shortcode `174379`. It accepts phone numbers matching `2547XXXXXXXX`.

Database configuration depends on the runtime mode:

| Runtime mode | Database settings |
| --- | --- |
| Development (`npm run dev`) | `DB_HOST`, `DB_PORT`, `DB_USER`, `DB_PASSWORD`, `DB_DATABASE` |
| Production (`npm start`) | `DATABASE_URL`, with SSL enabled in `config/db.js` |

For production, supply a connection string such as `postgresql://user:password@host:5432/database`. The current SSL configuration uses `rejectUnauthorized: false`.

### 3. Prepare the database

The repository includes `local_backup.sql`, rather than a migration or database initialization command. This snapshot contains both schema and existing records; review it before importing it into a new local development database.

Using the example PostgreSQL user above:

```bash
createdb -h localhost -U postgres murandi_apartments
psql -h localhost -U postgres -d murandi_apartments -v ON_ERROR_STOP=1 -f local_backup.sql
```

The dump assigns ownership to the `postgres` role. If using another database user, adapt the ownership statements and permissions before restoring it.

**Schema gap:** the snapshot does not define the `notifications` table required by `controllers/notifications.js`. Notification features need that table provisioned separately. There is no migration supplied for it, so restoring the snapshot alone does not fully initialize every feature.

### 4. Configure the frontend

Create `client/.env.development.local` with:

```dotenv
VITE_BACKEND_ENDPOINT=http://localhost:5700/murandi/v1
```

Include `/murandi/v1` and omit a trailing slash: frontend requests append paths such as `/auth/login/tenant` to this value. Restart Vite after changing its environment settings.

The current payment page redirects to the Checkout URL returned by the backend. It does not read a Stripe publishable key from the frontend environment.

### 5. Start the application

In one terminal, start the backend from the repository root:

```bash
npm run dev
```

In a second terminal, start the frontend:

```bash
npm run dev --prefix client
```

- Frontend: `http://localhost:5173`
- API base URL: `http://localhost:5700/murandi/v1`

The backend does not serve the React application or define a homepage at `/`. To check an API route:

```bash
curl http://localhost:5700/murandi/v1/listings/all-listings
```

Use the tenant, landlord, or administrator registration and login pages to create a session. Tenant email verification requires working mail credentials. Stripe rent checkout also requires a tenant record whose apartment number matches an apartment listing.

## Payments and webhooks

Stripe checkout is created through `POST /murandi/v1/checkout/create-checkout-session` using the tenant's session cookie. The backend calculates the rent from the matching listing and returns a hosted Checkout URL.

Configure Stripe to deliver `checkout.session.completed` events to:

```text
https://your-public-api-host/murandi/v1/webhook
```

Set `STRIPE_WEBHOOK` to that endpoint's signing secret. The webhook marks the payment as paid and triggers receipt email, notification, and report creation. Returning to the frontend success page alone does not complete those backend updates.

M-Pesa STK requests use `POST /murandi/v1/checkout/create-pesa-checkout`, with `amount` and `phoneNumber` in the JSON body. The callback route is `/murandi/v1/webhook/callback`; see the callback parsing limitation below before testing the full flow.

## API overview

All paths below are relative to `/murandi/v1`. Consult [routes](routes) for complete method and middleware definitions and [controllers](controllers) for request fields and responses.

| Area | Example endpoints |
| --- | --- |
| Authentication | `POST /auth/register/tenant`, `POST /auth/login/tenant`, `POST /auth/logout/tenant`; equivalent landlord and admin paths |
| Verification | `GET /verify`, `POST /verify/resend/account/verification` |
| Password reset | `POST /password/send/email`, `PUT /password/reset/password/token` |
| Users | `GET /users/me`, `GET /users/all-users`, `GET /users/technicians` |
| Tenant records | `PUT /tenants/tenant/update/:id`, `DELETE /tenants/landlord/remove/:id` |
| Listings | `GET /listings/all-listings`, `GET /listings/my-listing`, `POST /listings/create-listing` |
| Payments | `GET /payments/all`, `GET /payments/my-payments` |
| Checkout | `POST /checkout/create-checkout-session`, `POST /checkout/create-pesa-checkout` |
| Maintenance | `GET /maintenance/requests/all`, `POST /maintenance/requests/create`, `PATCH /maintenance/requests/complete/:id` |
| Reports | `GET /reports`, `GET /reports/payment`, `GET /reports/maintenance` |
| Receipts | `GET /receipts/all` |
| Notifications | `GET /notifications/my-notifications`, `PUT /notifications/my-notifications/:notificationId/mark-as-read` |
| Payment callbacks | `POST /webhook`, `POST /webhook/callback` |

Authenticated routes use the `tenantSession`, `landlordSession`, or `adminSession` HTTP-only cookie. Browser clients must include credentials in requests. Authentication middleware is applied per route; some management routes currently have no authentication middleware.

## Development commands

Run these commands from the repository root:

| Command | Purpose |
| --- | --- |
| `npm run dev` | Run the backend with Nodemon |
| `npm start` | Run the backend with `NODE_ENV=production` |
| `npm test` | Run backend Jest tests serially |
| `npm run test:watch` | Run Jest in watch mode |
| `npm run test:coverage` | Generate backend test coverage |
| `npm run dev --prefix client` | Start the Vite development server |
| `npm run build --prefix client` | Build the frontend into `client/dist` |
| `npm run preview --prefix client` | Preview the frontend build locally |
| `npm run lint --prefix client` | Run frontend ESLint checks |

The backend unit tests live in `test/unit` and mock database and external service calls. They do not verify a live database, email delivery, payment provider callbacks, or browser workflows. The frontend has no test script configured.

## Deployment

### Frontend and backend

Set `VITE_BACKEND_ENDPOINT` for the target environment before building the frontend; Vite embeds it into the generated assets. Serve `client/dist` through a static server with SPA fallback to `index.html`. The included `client/nginx.conf` provides that fallback.

Run the backend separately with its environment variables and database connection configured. Add the frontend origin to the CORS allowlist in `index.js` when deploying to a new hostname. Changing `CLIENT_URL` controls email and payment redirect links but does not update the CORS allowlist.

### GitHub Actions

[The deployment workflow](.github/workflows/actions.yml) runs on pushes to `master`. It installs backend dependencies, runs Jest, then connects to a VPS over SSH to pull the repository, install dependencies, build the frontend, and reload the application with PM2.

Required repository secrets:

| Secret | Purpose |
| --- | --- |
| `SSH_KEY` | Private key used to access the VPS |
| `SSH_USER` | Deployment username |
| `SSH_HOST` | VPS hostname or address |
| `PROJECT_PATH` | Repository directory on the VPS |

The workflow expects NVM with Node.js 24, PM2, a configured checkout, and application environment settings on the VPS. It does not provision PostgreSQL or configure the web server that serves `client/dist`. Its reload command targets `murandi`, while its fallback starts `Murandi`; align those process names for the intended deployment.

### Containers and Kubernetes

The backend Dockerfile starts the API with `npm start`, so it requires the production `DATABASE_URL`. The frontend Dockerfile builds the client and serves it through NGINX on port 80.

The checked-in Compose configuration needs corrections before it can run both containers successfully; see [Current limitations](#current-limitations).

The manifests in `k8s/` define the `murandi-apartments` namespace, backend and frontend deployments and services, and ingress for `murandi-apartments.local`. Before applying them, provide the `murandi-secrets` Kubernetes Secret, reachable database settings, suitable container images, and an ingress controller. Frontend API configuration must be supplied at image build time. No database deployment is included.

The Jenkinsfile checks out the repository and installs backend dependencies using a Jenkins NodeJS tool named `NodeJS 23`. It also uses Slack notifications; it does not build or deploy the full application.

## Current limitations

- **Incomplete database snapshot:** `local_backup.sql` lacks the notifications table, and the repository has no migration workflow. Prisma dependencies are present, but the application uses `pg` and no Prisma schema is supplied.
- **Compose/frontend mismatch:** Compose overrides the NGINX image with `npm run dev`, uses `/app/client` as its working directory, and maps port 5173 to 5173. The final frontend image serves static files on port 80 and has no Node.js runtime. Its service definition must be aligned with that image. The Compose database service is commented out.
- **Frontend Docker build variables:** `client/Dockerfile` appends an extra `s` to `VITE_APP_STRIPE_PUBLISHABLE_KEY`. The current client does not consume that variable. Compose also does not supply the frontend API build argument.
- **M-Pesa callback parsing:** the webhook router is mounted before `express.json()`. Stripe has its own raw-body parser, but the M-Pesa callback lacks a JSON parser at that point, which prevents normal JSON callback processing.
- **Route access controls:** several management and reporting routes do not apply authentication or role middleware. Public deployment requires reviewing these routes and the administrator registration flow.

## Troubleshooting

| Symptom | What to check |
| --- | --- |
| PostgreSQL connection error | Database availability, credentials, and whether the backend is using development variables or production `DATABASE_URL` |
| Missing relation/table error | Whether the database snapshot was restored and whether the requested feature needs schema absent from it |
| Stripe initialization error | `STRIPE_SECRET_KEY` in the backend environment |
| Verification or reset email does not arrive | Gmail account settings, `MAIL_USER`, `MAIL_PASS`, and backend logs |
| CORS rejection | The browser's exact origin against the allowlist in `index.js`; local ports 5173 and 5174 are allowed |
| API requests use the wrong URL | `VITE_BACKEND_ENDPOINT`, including `/murandi/v1`; restart development or rebuild production assets after changes |
| Payment remains pending | Stripe webhook delivery, signing secret, and backend webhook logs |
| API root returns 404 | Use a defined `/murandi/v1/...` route; the frontend runs separately |

## License

The backend `package.json` declares **ISC**. A standalone license file is not currently included in the repository.
