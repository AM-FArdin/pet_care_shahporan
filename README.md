# 🐾 Shahporan Pet & Vet Care — Clinic Management Web App

A full-stack veterinary clinic management system built for **Shahporan Pet & Vet Care**, Sylhet, Bangladesh.

## ✨ Features

- **Home Dashboard** — Clinic info, services, doctor profiles, contact details
- **Customer Management** — Search by name or phone, add/view owner profiles
- **Pet Profiles** — Per-customer pets with species, breed, medical info
- **Vaccination Records** — Log vaccines with due dates, doctor, batch number
- **Medical Records** — Visit logs with diagnosis, treatment, prescription, vitals
- **Inventory Management** — Track medicines, vaccines, equipment with low-stock alerts

## 🛠 Tech Stack

| Layer | Tech |
|---|---|
| Frontend | Next.js 16 (App Router), React 19, TypeScript |
| Styling | Tailwind CSS v4 |
| Database | Neon DB (PostgreSQL, serverless) |
| ORM | Drizzle ORM |
| Icons | Lucide React |
| Deployment | Vercel |

---

## 🚀 Deployment Guide

### Step 1 — Set up Neon Database

1. Go to [neon.tech](https://neon.tech) and create a free account
2. Create a new project: **"shahporan-vet"**
3. Copy your **Connection String** (looks like `postgresql://user:pass@host.neon.tech/dbname?sslmode=require`)

### Step 2 — Configure Environment Variables

Edit `.env.local` (for local dev) and set:
```
DATABASE_URL="postgresql://your-neon-connection-string"
```

### Step 3 — Initialize the Database

```bash
npm run db:push
```
This pushes the schema to your Neon database automatically.

**Or** run the SQL migration manually in the Neon console:
```bash
# Open drizzle/0000_init.sql and run it in Neon SQL editor
```

### Step 4 — Run Locally

```bash
npm install
npm run dev
```
Open [http://localhost:3000](http://localhost:3000)

### Step 5 — Deploy to Vercel

1. Push your code to GitHub
2. Go to [vercel.com](https://vercel.com) → **New Project** → Import your repo
3. Add environment variable in Vercel dashboard:
   - `DATABASE_URL` = your Neon connection string
4. Click **Deploy** ✅

---

## 📁 Project Structure

```
src/
├── app/
│   ├── page.tsx              # Home dashboard
│   ├── customers/
│   │   ├── page.tsx          # Customer search & list
│   │   └── [id]/page.tsx     # Customer + pet profiles
│   ├── inventory/
│   │   └── page.tsx          # Inventory management
│   └── api/
│       ├── owners/           # Customer CRUD APIs
│       ├── pets/             # Pet CRUD APIs
│       ├── vaccinations/     # Vaccination APIs
│       ├── medical-records/  # Visit record APIs
│       └── inventory/        # Inventory APIs
├── components/
│   └── Navbar.tsx
└── lib/
    └── db/
        ├── index.ts          # Neon DB connection
        └── schema.ts         # Drizzle ORM schema
```

## 🩺 Doctors

- **Dr. Zahidul Islam Munna** — DVM (SAU), CT (India), MS Fellow in Medicine
- **Dr. Ali Md. Mahedi Hasan Nadel** — DVM (SAU), CT (India), MS Fellow in Epidemiology

📍 BIDC Point, near Inaya's Cafe, Shahporan, Sylhet | 📞 01521765716
