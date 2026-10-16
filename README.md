
# Shahporan Veterinary Clinic

Shahporan Veterinary Clinic is a web-based clinic management system for handling
customers, pets, medical records, vaccinations, inventory, sales, invoices,
operational expenses, and dashboard reporting in one place.

The application is built with Next.js and React, uses PostgreSQL through Neon
and Drizzle ORM, and provides a protected admin area for clinic staff.

## Features

- **Dashboard**
  - Revenue, sales, inventory, and activity summaries
  - Low-stock inventory alerts
  - Upcoming vaccination and due-date alerts
- **Customer and pet management**
  - Owner profiles and contact details
  - Pet profiles and medical history
  - Vaccination and follow-up tracking
- **Medical records**
  - Visit details, diagnosis, treatment, prescriptions, weight, and temperature
  - Attending doctor and next-visit information
- **Inventory**
  - Product quantities, pricing, suppliers, expiry dates, batches, and locations
  - Low-stock monitoring
  - Automatic stock deduction when products are billed
- **Sales and billing**
  - Create invoices containing products and services
  - Percentage or fixed discounts
  - Cash, mobile wallet, card, and bank payment methods
  - Paid and due payment status tracking
  - Invoice preview and printing
  - Edit invoices after creation; totals, payment status, and inventory are recalculated
  - Cancel invoices and restore deducted inventory
- **Operational expenses**
  - Record rent, utilities, salaries, supplies, medicine purchases, and other expenses
  - Edit expense entries when a mistake is found
  - Soft-delete incorrect expense entries
  - Date filtering and Excel export

## Technology

- Next.js 16 with the App Router
- React 19 and TypeScript
- Tailwind CSS 4
- PostgreSQL with Neon Serverless
- Drizzle ORM and Drizzle Kit
- Lucide React icons
- XLSX export support

## Requirements

- Node.js 20 or newer
- npm
- A PostgreSQL database; Neon is recommended because the project uses the Neon
  serverless HTTP driver

## Getting started

1. Install dependencies:

   ```bash
   npm install
   ```

2. Create a local environment file:

   ```bash
   cp .env.example .env.local
   ```

   If `.env.example` is not present in your checkout, create `.env.local`
   manually with the variables shown below.

3. Set the database and admin credentials:

   ```env
   DATABASE_URL=postgresql://user:password@host/database?sslmode=require
   ADMIN_USERNAME=admin
   ADMIN_PASSWORD=replace-with-a-strong-password
   ADMIN_SESSION_SECRET=replace-with-a-long-random-secret
   ```

   Never commit `.env`, `.env.local`, database URLs, passwords, or session
   secrets. Environment files are ignored by Git.

4. Apply the database schema:

   ```bash
   npm run db:push
   ```

   The application also contains an initialization endpoint used by the
   application setup flow:

   ```text
   POST /api/init-db
   ```

5. Start the development server:

   ```bash
   npm run dev
   ```

6. Open [http://localhost:3000](http://localhost:3000) and sign in with the
   configured admin credentials.

## Available scripts

| Command | Purpose |
| --- | --- |
| `npm run dev` | Start the development server |
| `npm run build` | Create a production build |
| `npm run start` | Run the production build |
| `npm run lint` | Run ESLint |
| `npx tsc --noEmit` | Run the TypeScript compiler without emitting files |
| `npm run db:push` | Push the Drizzle schema to PostgreSQL |
| `npm run db:generate` | Generate Drizzle migration files |
| `npm run db:studio` | Open Drizzle Studio |

## Project structure

```text
src/
├── app/
│   ├── api/                 Next.js API routes
│   ├── customers/           Customer and pet screens
│   ├── inventory/           Inventory management
│   ├── sales/               Sales, invoices, and expenses
│   ├── login/               Admin login
│   ├── page.tsx             Dashboard
│   └── layout.tsx           Shared application layout
├── components/              Shared dashboard and navigation components
├── lib/
│   ├── auth.ts              Session token and credential utilities
│   └── db/                  Drizzle database connection, schema, and setup
└── middleware.ts            Protected route handling
```

## API areas

The application exposes REST-style route handlers for:

- `/api/auth/*` — login, logout, and current session
- `/api/dashboard/*` — dashboard statistics
- `/api/owners/*` — customers
- `/api/pets/*` — pets
- `/api/medical-records/*` — medical records
- `/api/vaccinations/*` — vaccinations
- `/api/inventory/*` — inventory
- `/api/sales/*` — invoices and invoice line items
- `/api/expenses/*` — operational expenses
- `/api/alerts/*` — due-date alerts

Invoice updates use a database transaction so the previous inventory deduction
is restored before the corrected line items are applied.

## Security notes

- Configure `ADMIN_PASSWORD` and `ADMIN_SESSION_SECRET` in every deployed
  environment.
- Do not use the development fallback credentials in production.
- Keep `DATABASE_URL` and all environment files outside version control.
- Run the application behind HTTPS in production so the secure session cookie
  is enabled.

## Validation

Before opening a pull request or deploying, run:

```bash
npm run lint
npx tsc --noEmit
npm run build
```

## License

This project is private software for Shahporan Veterinary Clinic. No license
for redistribution is currently provided.
